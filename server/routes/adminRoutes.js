const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Course = require('../models/Course');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const Attendance = require('../models/Attendance');
const courseRoutes = require('./courseRoutes');
const { generateInvoicePDF, generateCertificatePDF } = require('../utils/pdfGenerator');
const { uploadBufferToCloudinary } = require('../utils/cloudinaryUploader');
const { sendCourseEnrollmentEmail, sendCourseCompletionEmail } = require('../utils/emailService');

const router = express.Router();

router.use('/courses', courseRoutes);

// Get Dashboard Analytics
router.get('/analytics', protect, admin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'student' });
    const totalCourses = await Course.countDocuments();
    const totalEnrollments = await Enrollment.countDocuments();
    const totalClasses = await Class.countDocuments();
    const totalCertificates = await Enrollment.countDocuments({ completed: true, certificateId: { $ne: null } });

    // Calculate total revenue
    const revenueResult = await Enrollment.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: '$amountPaid' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Get Recent Activity (last 5 enrollments with user and course info)
    const recentActivity = await Enrollment.find()
      .populate('course', 'title category price')
      .sort('-createdAt')
      .limit(5);

    // Get Upcoming Classes (Zoom)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingClasses = await Class.find({
      date: { $gte: today, $lte: nextWeek }
    })
      .populate('courseId', 'title')
      .sort('date time')
      .limit(5);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalCourses,
        totalEnrollments,
        totalClasses,
        totalCertificates,
        totalRevenue,
        recentActivity,
        upcomingClasses
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching analytics' });
  }
});

// Get all certificate and invoice records
router.get('/records', protect, admin, async (req, res) => {
  try {
    const enrollments = await Enrollment.find()
      .populate('course', 'title category price accessValidity')
      .sort('-createdAt');

    // Enrich with student user details
    const records = await Promise.all(enrollments.map(async (enr) => {
      const user = await User.findOne({ emailOrPhone: enr.studentEmail }).select('name firstName lastName emailOrPhone createdAt');
      let studentName = user?.name;
      if (!studentName && user?.firstName) {
        studentName = `${user.firstName} ${user.lastName || ''}`.trim();
      }
      if (!studentName) {
        studentName = enr.studentEmail.split('@')[0];
      }

      return {
        _id: enr._id,
        studentEmail: enr.studentEmail,
        studentName,
        course: enr.course,
        amountPaid: enr.amountPaid,
        paymentStatus: enr.paymentStatus,
        progress: enr.progress,
        completed: enr.completed,
        completionDate: enr.completionDate,
        certificateId: enr.certificateId,
        invoiceNumber: enr.invoiceNumber,
        certificateUrl: enr.certificateUrl,
        invoiceUrl: enr.invoiceUrl,
        createdAt: enr.createdAt,
        updatedAt: enr.updatedAt
      };
    }));

    res.json({ success: true, data: records });
  } catch (error) {
    console.error("Error fetching admin records:", error);
    res.status(500).json({ success: false, message: 'Error fetching records', error: error.message });
  }
});

// Public / Admin Certificate Verification by ID
router.get('/verify-certificate/:certId', async (req, res) => {
  try {
    const { certId } = req.params;
    const enrollment = await Enrollment.findOne({
      $or: [
        { certificateId: certId },
        { certificateId: new RegExp(certId, 'i') }
      ],
      completed: true
    }).populate('course', 'title category accessValidity');

    if (!enrollment) {
      return res.status(404).json({ 
        success: false, 
        message: `No authentic certificate found matching ID: ${certId}` 
      });
    }

    const user = await User.findOne({ emailOrPhone: enrollment.studentEmail });
    let studentName = user?.name;
    if (!studentName && user?.firstName) {
      studentName = `${user.firstName} ${user.lastName || ''}`.trim();
    }
    if (!studentName) {
      studentName = enrollment.studentEmail.split('@')[0];
    }

    res.json({
      success: true,
      verified: true,
      data: {
        certificateId: enrollment.certificateId,
        studentName,
        courseTitle: enrollment.course?.title,
        completionDate: enrollment.completionDate,
        issueDate: enrollment.completionDate || enrollment.updatedAt,
        certificateUrl: enrollment.certificateUrl,
        status: 'Authentic & Verified',
        issuer: 'Swamy Dwija Foundation Academy of Yoga & Vedic Sciences'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Verification error', error: error.message });
  }
});

// Admin: Revoke Certificate
router.post('/revoke-certificate/:enrollmentId', protect, admin, async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.enrollmentId);
    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Enrollment record not found' });
    }

    enrollment.completed = false;
    enrollment.progress = 0;
    enrollment.certificateId = null;
    enrollment.certificateUrl = null;
    await enrollment.save();

    res.json({ success: true, message: 'Certificate revoked and progress reset', enrollment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error revoking certificate', error: error.message });
  }
});

// Admin: Resend Invoice Email
router.post('/resend-invoice/:enrollmentId', protect, admin, async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.enrollmentId).populate('course');
    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Enrollment record not found' });
    }

    const user = await User.findOne({ emailOrPhone: enrollment.studentEmail });
    let studentName = user?.name;
    if (!studentName && user?.firstName) {
      studentName = `${user.firstName} ${user.lastName || ''}`.trim();
    }
    if (!studentName) {
      studentName = enrollment.studentEmail.split('@')[0];
    }

    const invoiceNumber = enrollment.invoiceNumber || `SDF-INV-${Date.now().toString().slice(-6)}`;

    // Generate Invoice PDF
    const invoicePdfBuffer = await generateInvoicePDF({
      invoiceNumber,
      studentName,
      studentEmail: enrollment.studentEmail,
      courseTitle: enrollment.course?.title || 'Yoga Course',
      amountPaid: enrollment.amountPaid,
      paymentDate: new Date(enrollment.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      accessValidity: enrollment.course?.accessValidity || '2 Months'
    });

    // Upload to Cloudinary if not present
    if (!enrollment.invoiceUrl) {
      const cloudUrl = await uploadBufferToCloudinary(invoicePdfBuffer, invoiceNumber, 'sdf_invoices');
      if (cloudUrl) {
        enrollment.invoiceUrl = cloudUrl;
        await enrollment.save();
      }
    }

    // Send email
    await sendCourseEnrollmentEmail({
      to: enrollment.studentEmail,
      studentName,
      course: enrollment.course,
      invoiceNumber,
      amountPaid: enrollment.amountPaid,
      invoicePdfBuffer
    });

    res.json({ success: true, message: `Invoice sent successfully to ${enrollment.studentEmail}` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error resending invoice', error: error.message });
  }
});

// Get all users
router.get('/users', protect, admin, async (req, res) => {
  try {
    const users = await User.find({ role: 'student' }).select('-password').sort('-createdAt');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching users' });
  }
});

// Get user details with enrollments
router.get('/users/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const enrollments = await Enrollment.find({ studentEmail: user.emailOrPhone })
      .populate('course', 'title category price level duration')
      .sort('-createdAt');

    res.json({
      success: true,
      data: {
        user,
        enrollments
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching user details' });
  }
});

// Delete a learner user and cascade cleanup
router.delete('/users/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin' || user.role === 'superadmin') {
      return res.status(400).json({ success: false, message: 'Cannot delete admin accounts from learner list' });
    }

    const identifiers = [user.emailOrPhone, user.email, user.phone].filter(Boolean);

    // Remove enrollments & attendance records for this student
    await Enrollment.deleteMany({ studentEmail: { $in: identifiers } });
    await Attendance.deleteMany({ studentEmail: { $in: identifiers } });

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: `Learner ${user.name || user.emailOrPhone} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Server error deleting user', error: error.message });
  }
});

// Admin: Custom Certificate Generation & Email Dispatch
router.post('/certificate/custom-generate-and-send', protect, admin, async (req, res) => {
  try {
    const {
      enrollmentId,
      studentName,
      studentEmail,
      courseTitle,
      completionDate,
      certificateId,
      studentId,
      duration,
      instructorName,
      instructorTitle,
      instructorSubtitle,
      directorTitle,
      directorSubtitle,
      sendEmail = false,
      updateEnrollment = true
    } = req.body;

    if (!studentName || !studentName.trim()) {
      return res.status(400).json({ success: false, message: 'Student / Recipient Name is required' });
    }
    if (!courseTitle || !courseTitle.trim()) {
      return res.status(400).json({ success: false, message: 'Course Title is required' });
    }
    if (sendEmail && (!studentEmail || !studentEmail.trim())) {
      return res.status(400).json({ success: false, message: 'Valid Student Email is required to send certificate email' });
    }

    const finalCertId = certificateId && certificateId.trim()
      ? certificateId.trim()
      : `SDF-CERT-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;

    const formattedDate = completionDate
      ? (typeof completionDate === 'string' && completionDate.includes('-') && completionDate.length === 10
          ? new Date(completionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
          : completionDate)
      : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

    // Look up assigned course instructor from Course model if needed
    let finalInstructorName = instructorName;
    let finalInstructorTitle = instructorTitle;
    let finalDuration = duration;

    try {
      const Course = require('../models/Course');
      const foundCourse = await Course.findOne({ title: { $regex: new RegExp(`^${courseTitle.trim()}$`, 'i') } }).populate('instructorId', 'name speciality');
      if (foundCourse) {
        if (!finalInstructorName || finalInstructorName === 'RISHI KRISHNA') {
          finalInstructorName = foundCourse.instructorId?.name || foundCourse.instructor || 'Lead Yoga Guru';
        }
        if (!finalInstructorTitle) {
          finalInstructorTitle = foundCourse.instructorId?.speciality || 'Yoga Instructor';
        }
        if (!finalDuration) {
          finalDuration = foundCourse.duration || '30 Days\n(20 Hours)';
        }
      }
    } catch (cErr) {
      console.error('Error finding course instructor:', cErr.message);
    }

    // Generate the High-Resolution PDF Certificate
    const certPdfBuffer = await generateCertificatePDF({
      studentName: studentName.trim(),
      courseTitle: courseTitle.trim(),
      completionDate: formattedDate,
      certificateId: finalCertId,
      studentId: studentId || (finalCertId.replace(/[^0-9]/g, '').slice(-8) ? `SDWFY${finalCertId.replace(/[^0-9]/g, '').slice(-8)}` : undefined),
      duration: finalDuration || '30 Days\n(20 Hours)',
      instructorName: finalInstructorName || 'Lead Yoga Guru',
      instructorTitle: finalInstructorTitle || 'Yoga Instructor',
      instructorSubtitle: instructorSubtitle || 'Certified Yoga Professional',
      directorTitle: directorTitle || 'Founder & Director',
      directorSubtitle: directorSubtitle || 'Swamy Dwija Foundation'
    });

    // Upload to Cloudinary
    let certificateUrl = null;
    try {
      certificateUrl = await uploadBufferToCloudinary(certPdfBuffer, finalCertId, 'sdf_certificates');
    } catch (cErr) {
      console.error('Cloudinary certificate upload error:', cErr.message);
    }

    // If enrollmentId is provided and updateEnrollment is true, update DB record
    let updatedEnrollment = null;
    if (enrollmentId && updateEnrollment) {
      const Enrollment = require('../models/Enrollment');
      updatedEnrollment = await Enrollment.findByIdAndUpdate(
        enrollmentId,
        {
          completed: true,
          progress: 100,
          certificateId: finalCertId,
          certificateUrl: certificateUrl || undefined,
          completionDate: new Date()
        },
        { new: true }
      ).populate('course');
    }

    // Send Email if requested
    let emailSent = false;
    if (sendEmail && studentEmail) {
      try {
        await sendCertificateEmail(
          studentEmail.trim(),
          studentName.trim(),
          courseTitle.trim(),
          certPdfBuffer,
          finalCertId
        );
        emailSent = true;
      } catch (emailErr) {
        console.error('Failed to send certificate email:', emailErr.message);
      }
    }

    res.json({
      success: true,
      message: emailSent
        ? `Certificate ${finalCertId} generated and successfully emailed to ${studentEmail}!`
        : `Certificate ${finalCertId} generated successfully!`,
      data: {
        certificateId: finalCertId,
        certificateUrl,
        emailSent,
        enrollment: updatedEnrollment
      }
    });

  } catch (error) {
    console.error('Error generating custom certificate:', error);
    res.status(500).json({ success: false, message: 'Server Error generating certificate', error: error.message });
  }
});

// Admin: Certificate PDF Preview (Streams buffer directly to browser tab for live test)
router.post('/certificate/preview-pdf', protect, admin, async (req, res) => {
  try {
    const {
      studentName,
      courseTitle,
      completionDate,
      certificateId,
      studentId,
      duration,
      instructorName,
      instructorTitle,
      instructorSubtitle,
      directorTitle,
      directorSubtitle
    } = req.body;

    const formattedDate = completionDate
      ? (typeof completionDate === 'string' && completionDate.includes('-') && completionDate.length === 10
          ? new Date(completionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
          : completionDate)
      : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

    const finalCertId = certificateId || `SDF-CERT-PREVIEW`;

    let finalInstructorName = instructorName;
    let finalInstructorTitle = instructorTitle;
    let finalDuration = duration;

    try {
      const Course = require('../models/Course');
      const foundCourse = await Course.findOne({ title: { $regex: new RegExp(`^${(courseTitle || '').trim()}$`, 'i') } }).populate('instructorId', 'name speciality');
      if (foundCourse) {
        if (!finalInstructorName || finalInstructorName === 'RISHI KRISHNA') {
          finalInstructorName = foundCourse.instructorId?.name || foundCourse.instructor || 'Lead Yoga Guru';
        }
        if (!finalInstructorTitle) {
          finalInstructorTitle = foundCourse.instructorId?.speciality || 'Yoga Instructor';
        }
        if (!finalDuration) {
          finalDuration = foundCourse.duration || '30 Days\n(20 Hours)';
        }
      }
    } catch (cErr) {
      console.error('Error finding course instructor for preview:', cErr.message);
    }

    const certPdfBuffer = await generateCertificatePDF({
      studentName: (studentName || 'Learner Name').trim(),
      courseTitle: (courseTitle || 'Yoga for Wellness and Inner Balance').trim(),
      completionDate: formattedDate,
      certificateId: finalCertId,
      studentId: studentId || 'SDWFY250501',
      duration: finalDuration || '30 Days\n(20 Hours)',
      instructorName: finalInstructorName || 'Lead Yoga Guru',
      instructorTitle: finalInstructorTitle || 'Yoga Instructor',
      instructorSubtitle: instructorSubtitle || 'Certified Yoga Professional',
      directorTitle: directorTitle || 'Founder & Director',
      directorSubtitle: directorSubtitle || 'Swamy Dwija Foundation'
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Certificate-${finalCertId}.pdf"`);
    res.send(certPdfBuffer);
  } catch (error) {
    console.error('Error previewing certificate PDF:', error);
    res.status(500).json({ success: false, message: 'Error generating certificate preview' });
  }
});

// Site Setting for Platform Stats
const SiteSetting = require('../models/SiteSetting');

// Get Platform Stats Settings (Public)
router.get('/settings/stats', async (req, res) => {
  try {
    let setting = await SiteSetting.findOne({ key: 'platform_stats' });
    if (!setting) {
      setting = await SiteSetting.create({
        key: 'platform_stats',
        stats: {
          studentsCount: 5000,
          studentsSuffix: '+',
          studentsLabel: 'Transformed Seekers',
          coursesCount: 25,
          coursesSuffix: '+',
          coursesLabel: 'Master Curricula',
          instructorsCount: 15,
          instructorsSuffix: '+',
          instructorsLabel: 'Expert Gurus',
          satisfactionRate: 99,
          satisfactionSuffix: '%',
          satisfactionLabel: 'Satisfaction',
          communitiesCount: 15,
          communitiesSuffix: '+',
          communitiesLabel: 'Global Communities',
          lineageRate: 100,
          lineageSuffix: '%',
          lineageLabel: 'Authentic Vedic Lineage'
        }
      });
    }
    res.json({ success: true, data: setting.stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching stats settings', error: error.message });
  }
});

// Update Platform Stats Settings (Admin Only)
router.put('/settings/stats', protect, admin, async (req, res) => {
  try {
    const updatedStats = req.body;
    let setting = await SiteSetting.findOne({ key: 'platform_stats' });
    if (!setting) {
      setting = new SiteSetting({ key: 'platform_stats', stats: updatedStats });
    } else {
      setting.stats = { ...setting.stats, ...updatedStats };
    }
    await setting.save();
    res.json({ success: true, message: 'Platform stats updated successfully!', data: setting.stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating stats settings', error: error.message });
  }
});

// Default policy content helper
const DEFAULT_POLICIES = {
  termsAndConditions: `TERMS AND CONDITIONS

Last Updated: September 2026

Welcome to Swamy Dwija Foundation. These Terms and Conditions ("Terms") govern your access to and use of the Swammy Dwija Foundation mobile application, website, online courses, classes, learning materials, certificates, and related services (collectively referred to as the "Platform").

By creating an account, logging into the Platform, enrolling in a class/course, accessing learning materials, or using any services provided through the Platform, you acknowledge that you have read, understood, and agreed to these Terms and Conditions.

If you do not agree with these Terms, please do not use the Platform.

1. About the Platform
Swammy Dwija Foundation provides educational, training, learning, and course-related services through its digital Platform.

The Platform may allow users to:
• Create and manage a personal account.
• Log in and access their user dashboard.
• Browse available classes and courses.
• Enroll in available courses.
• Access course videos, lessons, documents, assignments, or other learning materials.
• Track course progress.
• Complete required course activities.
• Receive or download a certificate after satisfying the applicable course completion requirements.
• Access their enrolled courses and certificates through their account.

Swammy Dwija Foundation may add, modify, suspend, or discontinue features or services from time to time.

2. User Account Registration
To access certain features, you may be required to create an account.

When creating an account, you agree to:
• Provide accurate, complete, and current information.
• Use your real and appropriate identity information where required for enrollment or certification.
• Keep your login credentials confidential.
• Not share your account credentials with another person.
• Notify Swammy Dwija Foundation if you believe your account has been accessed without authorization.
• Maintain the accuracy of your account information.

You are responsible for activities performed through your account unless the activity occurred due to unauthorized access that was not caused by your negligence or failure to protect your credentials.

3. Eligibility
You must provide accurate information regarding your age and identity when requested.

Where a course or service has specific eligibility requirements, you must satisfy those requirements before enrollment.

If the Platform permits users under the age of 18, use of the Platform may be subject to the consent or involvement of a parent or lawful guardian as required by applicable law.

4. Course and Class Enrollment
Users may enroll in courses or classes available through the Platform.

Enrollment may be subject to:
• Course availability.
• Eligibility requirements.
• Course-specific requirements.
• Applicable fees, if any.
• Availability of seats or batches.
• Completion requirements.

Swammy Dwija Foundation reserves the right to update course content, schedules, instructors, learning materials, or course requirements when reasonably necessary.

Enrollment in a course does not automatically guarantee the issuance of a certificate.

5. Course Access
After successful enrollment, users may receive access to the relevant course materials through their account.

Course access may include:
• Video lessons.
• Text-based lessons.
• Study materials.
• Assignments.
• Quizzes or assessments.
• Practical activities.
• Other educational resources.

Users must use course materials only for their personal educational purposes unless Swammy Dwija Foundation expressly permits another use.

Users must not:
• Copy, reproduce, or redistribute course materials without permission.
• Sell or commercially distribute course content.
• Upload course materials to unauthorized websites or platforms.
• Record or reproduce restricted classes or sessions without permission.
• Share paid or restricted course access with other individuals.
• Attempt to bypass access restrictions.

6. Course Completion
Certificate eligibility may depend on completing the requirements specified for the particular course.

Course completion requirements may include:
• Completing required lessons.
• Watching required learning content.
• Completing assignments.
• Passing quizzes or assessments.
• Meeting minimum attendance requirements, where applicable.
• Completing practical activities.
• Achieving a required course score.
• Completing any other requirements specified for that course.

The specific completion requirements may vary from course to course.
Simply enrolling in or accessing a course does not automatically mean that the course has been completed.

7. Certificates
Where a course provides a certificate, the certificate may be issued only after the user satisfies the applicable course completion requirements.

Certificates may contain information such as:
• User's name.
• Course name.
• Completion date.
• Certificate number or identification number.
• Swammy Dwija Foundation details.
• Verification information, where applicable.

Users are responsible for ensuring that the name and other information provided during registration are accurate.
Swammy Dwija Foundation may not be responsible for errors in certificates resulting from incorrect information supplied by the user.

Certificates must not be altered, forged, duplicated, or falsely represented.

A certificate issued by Swammy Dwija Foundation represents completion of the applicable course or program according to the Foundation's stated requirements. It should not be represented as a professional license, government authorization, academic degree, or qualification unless expressly stated by Swammy Dwija Foundation and legally applicable.

8. Certificate Verification
Where certificate verification is provided, Swammy Dwija Foundation may maintain relevant certificate records for verification purposes.

Users may be required to provide a certificate number, verification code, QR code, or other information to verify a certificate.

Any attempt to create, modify, duplicate, or fraudulently represent a Swammy Dwija Foundation certificate is prohibited.

9. User Conduct
Users agree to use the Platform lawfully and responsibly.

You must not:
• Create an account using false or misleading information.
• Impersonate another person.
• Use another person's account without authorization.
• Attempt to gain unauthorized access to the Platform.
• Interfere with the operation or security of the Platform.
• Upload malicious software, viruses, or harmful files.
• Abuse, harass, threaten, or harm other users or instructors.
• Use the Platform for unlawful activities.
• Attempt to manipulate course progress, assessments, attendance, or certificates.
• Submit fraudulent information or documents.
• Misuse certificates or verification systems.
• Circumvent technical restrictions or security mechanisms.

10. Assignments and Assessments
Where courses contain assignments, quizzes, tests, or other assessments, users must complete them honestly unless collaboration is specifically permitted.

Submitting another person's work as your own, using unauthorized assistance, manipulating results, or engaging in other forms of academic dishonesty may result in:
• Removal of the submitted work.
• Failure of the relevant assessment.
• Suspension of course access.
• Cancellation or withholding of a certificate.
• Suspension or termination of the user's account.

11. Intellectual Property
All Platform content, including but not limited to logos, branding, text, course materials, videos, images, graphics, designs, software, website/app interfaces, and educational content, is owned by or licensed to Swammy Dwija Foundation and protected by applicable intellectual property laws.

Users receive a limited, non-exclusive, non-transferable right to access the content for the intended educational purpose.
No ownership rights in the Platform or its content are transferred to users.

12. User-Submitted Information and Content
If users submit information, assignments, feedback, comments, reviews, photographs, documents, or other content through the Platform, they must ensure that they have the necessary rights to provide such content.

Users must not submit content that:
• Infringes another person's intellectual property rights.
• Contains unlawful or harmful material.
• Contains unauthorized personal information of another individual.
• Is fraudulent or misleading.
• Violates applicable law.

13. Payments and Fees
If any course or service requires payment, the applicable price and payment conditions will be displayed before enrollment or purchase.

Users are responsible for providing accurate payment information and completing applicable payments.

Any refunds, cancellations, transfers, or course-specific payment policies will be governed by the policy applicable to that particular course or service.

Swammy Dwija Foundation may change course fees for future enrollments. Changes will not affect a completed transaction unless otherwise required by applicable law or expressly communicated.

14. Course Availability and Changes
Swammy Dwija Foundation may modify, update, temporarily suspend, or discontinue a course, class, instructor, schedule, learning material, or Platform feature.

Where reasonably possible, users may be notified of significant changes affecting an enrolled course.

Swammy Dwija Foundation will make reasonable efforts to maintain Platform availability but does not guarantee uninterrupted or error-free access at all times.

15. Account Suspension or Termination
Swammy Dwija Foundation may suspend, restrict, or terminate an account where reasonably necessary, including if a user:
• Violates these Terms.
• Engages in fraudulent activity.
• Misuses course materials.
• Shares unauthorized account access.
• Attempts to manipulate course completion or certification.
• Uses the Platform for unlawful purposes.
• Creates security or operational risks for the Platform.

Where appropriate, Swammy Dwija Foundation may cancel or withhold certificates associated with fraudulent or invalid course completion.

16. Privacy and Personal Information
To provide the Platform's services, Swammy Dwija Foundation may collect and process information such as name, email address, mobile number, login information, course enrollment information, course progress, assessment results, certificate information, and information voluntarily submitted by the user.

Personal information will be handled in accordance with Swammy Dwija Foundation's Privacy Policy and applicable laws.

Users should review the Privacy Policy to understand how their information is collected, used, stored, and handled. Where consent is required for processing personal data, the Platform may obtain consent through appropriate notices and consent mechanisms.

17. Account Security
Users are responsible for maintaining the security of their account credentials.
Swammy Dwija Foundation will not normally ask users to disclose their passwords.
If you believe your account has been compromised, you should contact Swammy Dwija Foundation as soon as reasonably possible.

18. Third-Party Services
The Platform may use third-party services for purposes such as payment processing, authentication, email communication, cloud hosting, analytics, notifications, certificate verification, and other technical services.

Use of such services may be subject to the relevant third party's terms and privacy policies.

19. Disclaimer
Swammy Dwija Foundation provides educational and training services through the Platform.

While reasonable efforts may be made to keep course content accurate and useful, Swammy Dwija Foundation does not guarantee that all educational content will always be complete, current, error-free, or suitable for every user's individual circumstances.

Course completion or receipt of a certificate does not guarantee employment, admission, promotion, income, professional licensing, or any particular outcome unless expressly stated.

20. Limitation of Liability
To the extent permitted by applicable law, Swammy Dwija Foundation shall not be responsible for losses arising from:
• User-provided inaccurate information.
• Unauthorized sharing of account credentials by the user.
• Temporary Platform interruptions.
• Internet or telecommunications failures.
• Third-party service interruptions.
• Misuse of educational materials by users.
• User's failure to meet course requirements.
• Events beyond the reasonable control of Swammy Dwija Foundation.

Nothing in these Terms is intended to exclude or limit liability where such exclusion or limitation is prohibited by applicable law.

21. External Links
The Platform may contain links to third-party websites or services.
Swammy Dwija Foundation does not necessarily control or endorse the content, policies, or practices of third-party websites.
Users should review the applicable terms and privacy policies before using third-party services.

22. Changes to These Terms
Swammy Dwija Foundation may update these Terms from time to time.
Updated Terms may be published on the Platform with a revised "Last Updated" date.
Continued use of the Platform after the updated Terms become effective may constitute acceptance of the updated Terms, subject to applicable law.

23. Governing Law
These Terms shall be governed by and interpreted in accordance with the laws applicable in India.
Any disputes relating to the Platform or these Terms shall be subject to the jurisdiction of the courts having appropriate jurisdiction over the location of Swammy Dwija Foundation, subject to applicable law.

24. Grievances and Contact
If you have questions, complaints, or concerns regarding these Terms, your account, course enrollment, certificates, or Platform services, please contact:

Swammy Dwija Foundation
Email: swamidwijafoundation@gmail.com
Phone: +91 9989551305
Address: Swammy Dwija Foundation Official Office

25. Acceptance of Terms
By creating an account, logging into the Platform, enrolling in a course, accessing course materials, or using the Platform, you acknowledge that you have read and understood these Terms and agree to comply with them.

If you do not agree to these Terms, you should discontinue use of the Platform.

© Swammy Dwija Foundation. All Rights Reserved.`,

  instructorTerms: `SWAMMY DWIJA FOUNDATION
INSTRUCTOR TERMS AND CONDITIONS

Last Updated: September 2026

These Instructor Terms and Conditions ("Instructor Terms") govern the relationship between Swammy Dwija Foundation ("Foundation", "we", "us", or "our") and any person who is approved or appointed to provide teaching, training, mentoring, instructional, or educational services through the Swammy Dwija Foundation mobile application, website, Zoom classes, online sessions, or other learning platforms ("Instructor", "you", or "your").

By accepting an instructor role, creating or accessing an instructor account, conducting classes, uploading course content, communicating with students, or providing teaching services through the Foundation, you agree to these Instructor Terms.

If you do not agree to these Terms, you must not act as an instructor for Swammy Dwija Foundation.

1. Role of the Instructor
An Instructor is responsible for providing educational and training services to students enrolled in courses assigned to or conducted by the Instructor.

Your responsibilities may include:
• Teaching assigned courses or classes.
• Conducting live online classes through Zoom or another approved platform.
• Explaining course concepts clearly and professionally.
• Preparing lessons and teaching materials.
• Conducting practical sessions where applicable.
• Answering reasonable student questions.
• Conducting assignments, quizzes, tests, or assessments where required.
• Monitoring student participation and attendance.
• Providing appropriate academic guidance.
• Following the course syllabus and learning objectives.
• Reporting student progress where required.
• Supporting the Foundation's course completion and certification process.

The Instructor is expected to perform these responsibilities professionally and in accordance with the Foundation's standards.

2. Instructor Registration and Verification
Before conducting classes, an Instructor may be required to provide information and documents requested by Swammy Dwija Foundation.

This may include:
• Full name.
• Email address.
• Mobile number.
• Educational qualifications.
• Professional qualifications.
• Teaching experience.
• Subject-matter expertise.
• Professional profile.
• Identification or verification documents where required.
• Other information reasonably required by the Foundation.

You agree that all information provided to the Foundation must be accurate, complete, and not misleading.
The Foundation may verify the information provided before approving an Instructor.

3. Instructor Approval
Creating an Instructor account or submitting an Instructor application does not automatically guarantee approval.
Swammy Dwija Foundation may approve, reject, suspend, or discontinue an Instructor's participation based on its applicable requirements and standards.
The Foundation may also request additional information or verification before allowing an Instructor to conduct classes.

4. Teaching Responsibilities
Instructors must conduct classes professionally and responsibly.

An Instructor is expected to:
• Start classes at the scheduled time.
• Conduct the class for the scheduled duration.
• Follow the approved course curriculum.
• Explain concepts accurately to the best of their professional knowledge.
• Maintain a professional teaching environment.
• Encourage appropriate student participation.
• Respond to reasonable academic questions.
• Complete assigned teaching responsibilities.
• Notify the Foundation in advance when unable to conduct a scheduled class, except in emergencies.
• Follow reasonable academic and operational instructions issued by the Foundation.

Instructors must not intentionally abandon scheduled classes or repeatedly fail to conduct assigned sessions without reasonable cause.

5. Zoom and Online Classes
The Instructor may be required to conduct classes through Zoom or another online meeting platform approved by Swammy Dwija Foundation.

The Instructor agrees to:
• Use the official meeting link or approved meeting method.
• Join the meeting sufficiently early to prepare for the class.
• Use an appropriate display name and professional profile.
• Maintain a stable and suitable internet connection where reasonably possible.
• Use suitable audio and video equipment.
• Conduct the class in an appropriate environment.
• Protect meeting links and access information.
• Not share private class links with unauthorized persons.
• Follow the Foundation's instructions regarding online classroom management.

The Foundation may provide meeting links, schedules, or other access information through the Instructor dashboard or other communication channels.

6. Class Attendance and Scheduling
Instructors are expected to follow the class schedule provided by Swammy Dwija Foundation.
If an Instructor cannot attend a scheduled class, the Instructor should inform the Foundation as early as reasonably possible.

Repeated late arrivals, early departures, unscheduled cancellations, missed classes, or failure to conduct assigned sessions may result in review or suspension of the Instructor's teaching assignment.
Where appropriate, the Foundation may arrange a replacement class or another Instructor.

7. Course Content and Curriculum
Instructors must follow the approved syllabus, curriculum, learning objectives, and course requirements applicable to their assigned course.

An Instructor may suggest improvements to course content, but significant changes to the official curriculum should be approved by the Foundation before implementation.
Instructors must not knowingly teach substantially different material from the approved course without appropriate authorization.

8. Instructor-Created Teaching Materials
If an Instructor creates presentations, notes, assignments, exercises, recordings, illustrations, documents, or other educational materials specifically for a course conducted through Swammy Dwija Foundation, the ownership and permitted use of those materials should be determined by the applicable written agreement between the Instructor and the Foundation.

Unless otherwise agreed in writing, the Instructor grants the Foundation permission to use materials specifically submitted for the Foundation's course delivery and administration purposes.
Nothing in these Terms transfers ownership of an Instructor's pre-existing intellectual property that was created independently of the Foundation.

9. Third-Party Content
Instructors must ensure that teaching materials they provide do not knowingly infringe third-party copyright, trademark, privacy, or other rights.

An Instructor must obtain appropriate permission or use legally permitted material when incorporating third-party images, videos, books, articles, presentations, software, or training resources.
The Instructor must not knowingly upload or distribute unauthorized copyrighted material through the Foundation's Platform.

10. Student Interaction
Instructors must communicate with students respectfully and professionally.

Instructors must not:
• Harass students.
• Threaten students.
• Discriminate against students.
• Use abusive or offensive language.
• Engage in inappropriate personal conduct.
• Request unnecessary personal information.
• Misuse student contact information.
• Pressure students into unrelated commercial transactions.
• Exploit the Instructor-student relationship for personal gain.

Academic disagreements should be handled professionally.

11. Student Privacy and Confidentiality
Instructors may receive access to student information such as name, email address, mobile number, course enrollment information, attendance, course progress, assignment information, and assessment results.

Such information must be used only for legitimate teaching or Foundation-related purposes.

Instructors must not:
• Sell student information.
• Share student information with unauthorized persons.
• Use student information for unrelated marketing.
• Add students to personal marketing lists without appropriate authorization.
• Publish student information publicly without appropriate permission.
• Download or retain unnecessary student information.

Instructors must take reasonable steps to protect confidential student information.

12. Recording of Classes
Classes may be recorded only when permitted or authorized by Swammy Dwija Foundation and in accordance with applicable law and the Foundation's policies.

Where recording is enabled, the recording may be used for legitimate purposes such as student learning, revision, course administration, quality review, instructor training, internal documentation, or certificate verification.

Instructors must not independently record, distribute, sell, publish, or upload Foundation classes or student interactions to other platforms without appropriate authorization.

13. Student Assessment
Where an Instructor is responsible for assignments, quizzes, examinations, projects, or other assessments, the Instructor must evaluate students fairly and according to the applicable course requirements.

Instructors must not:
• Falsify attendance.
• Falsify assessment results.
• Provide unauthorized answers during examinations.
• Manipulate student scores.
• Approve course completion when the requirements have not been satisfied.
• Issue or promise certificates independently of the Foundation's certification process.

Any certificate issued through the Foundation must follow the Foundation's applicable certificate requirements.

14. Course Completion and Certificates
The Instructor may provide recommendations or submit student completion information where required.

However, unless expressly authorized, the Instructor does not have independent authority to issue official Swammy Dwija Foundation certificates.

Certificate eligibility may depend on attendance, course completion, assignments, assessments, practical activities, minimum required scores, and other course-specific requirements.

Instructors must provide accurate information relating to student completion. Providing false completion information may result in suspension or termination of Instructor access.

15. Instructor Account Security
The Instructor is responsible for maintaining the confidentiality of their Instructor account credentials.

The Instructor must not:
• Share login credentials.
• Allow unauthorized persons to use the Instructor dashboard.
• Give students access to administrative or Instructor functions.
• Attempt to access another Instructor's account.
• Attempt to bypass Platform security.

Any suspected unauthorized access should be reported to the Foundation promptly.

16. Instructor Dashboard and Platform Use
Where an Instructor dashboard is provided, it may allow the Instructor to view assigned courses, view class schedules, view enrolled students, record or update attendance, manage assignments, view course progress, submit assessment information, communicate with students where permitted, and access teaching resources.

The Instructor must use these functions only for legitimate Foundation-related purposes.
The Instructor must not attempt to modify, delete, access, or manipulate information outside their authorized permissions.

17. No Unauthorized Promotion
Instructors must not use Foundation classes, student groups, or Foundation communication channels to promote unrelated businesses, courses, coaching services, products, paid services, affiliate links, or personal commercial activities unless expressly authorized by Swammy Dwija Foundation.

18. No Unauthorized Student Solicitation
Instructors must not intentionally use student information obtained through Swammy Dwija Foundation to move students to unrelated private courses, services, or platforms for personal commercial benefit without authorization.

19. Professional Conduct
Instructors are expected to maintain appropriate professional standards while representing Swammy Dwija Foundation.
Instructors should maintain professional communication, respect students and Foundation staff, provide accurate academic information, avoid misleading claims regarding qualifications or course outcomes, and follow applicable laws and Foundation policies.

Instructors must not falsely claim to be an employee, officer, authorized representative, or official spokesperson of Swammy Dwija Foundation unless such status has been expressly provided.

20. Conflicts of Interest
Instructors should disclose any material conflict of interest that could affect their responsibilities to the Foundation or its students.
An Instructor should not use their Foundation position to obtain unauthorized personal or commercial benefits from students.

21. Intellectual Property and Foundation Branding
Swammy Dwija Foundation's name, logo, trademarks, website, application, course branding, and other Foundation-owned materials may not be used without appropriate authorization.

Instructors must not create misleading websites or social media accounts representing themselves as the Foundation, modify the Foundation's logo without permission, or claim ownership of Foundation-owned course materials or branding.

22. Confidential Information
During the Instructor's association with the Foundation, the Instructor may receive confidential information relating to students, course structures, internal processes, platform features, administrative details, business information, and pricing.
The Instructor agrees not to disclose or misuse confidential information except where authorized or required by law.

23. Payments and Compensation
Where an Instructor is entitled to payment, compensation, fees, or other benefits, the applicable payment terms may be specified separately in an Instructor agreement, appointment letter, course agreement, or other written arrangement.

24. Independent Relationship
Unless a separate written agreement expressly states otherwise, these Terms alone do not create an employer-employee relationship between the Instructor and Swammy Dwija Foundation.

25. Prohibited Activities
An Instructor must not use the Foundation Platform or teaching role to conduct unlawful activities, upload malware, falsify student records or attendance, manipulate assessment results, forge certificates, misrepresent qualifications, or harass students.

26. Complaints and Student Concerns
Students may submit complaints or concerns regarding an Instructor or class. The Foundation may review complaints and take appropriate action based on its review, policies, and applicable law.

27. Quality and Performance Review
Swammy Dwija Foundation may periodically review teaching quality and course delivery, including class attendance, completion rates, student feedback, and compliance with Foundation policies.

28. Suspension or Termination of Instructor Access
Swammy Dwija Foundation may suspend or terminate an Instructor's access where reasonably necessary for violation of these Terms, serious student complaints, fraudulent activity, falsification of records, or unauthorized solicitation of students.

29. Effect of Termination
Upon termination of an Instructor's role, the Instructor must stop representing themselves as an active Foundation Instructor, cease accessing Foundation systems, return confidential information, and complete any required handover.

30. Technical Issues and Force Majeure
Online classes may be affected by circumstances outside reasonable control, including internet outages, power failures, Zoom service disruptions, or server issues. The affected party should communicate significant issues promptly and cooperate in arranging an alternative where practical.

31. Disclaimer
The Foundation provides tools and systems to support online teaching, but does not guarantee that third-party services like Zoom or internet service providers will always operate without interruption.

32. Changes to Instructor Terms
Swammy Dwija Foundation may update these Instructor Terms from time to time. Revised Terms will become effective from the date specified by the Foundation.

33. Governing Law
These Terms shall be governed by and interpreted in accordance with the applicable laws of India. Disputes shall be subject to the jurisdiction of courts having jurisdiction over the Foundation's location.

34. Instructor Contact and Grievances
For questions, concerns, technical issues, or complaints relating to an Instructor's role, contact:

Swammy Dwija Foundation
Email: swamidwijafoundation@gmail.com
Phone: +91 9989551305
Address: Swammy Dwija Foundation Official Office

35. Instructor Acceptance
By registering as an Instructor, accepting an Instructor assignment, accessing the Instructor dashboard, conducting a class, or providing educational services through Swammy Dwija Foundation, you confirm that you have read, understood, and agree to these Instructor Terms and Conditions.

© Swammy Dwija Foundation. All Rights Reserved.`,

  moderatorTerms: `SWAMMY DWIJA FOUNDATION
MODERATOR TERMS AND CONDITIONS

Last Updated: September 2026

These Moderator Terms and Conditions ("Moderator Terms") govern the role and responsibilities of any person appointed, approved, or authorized to act as a Moderator for Swammy Dwija Foundation ("Foundation", "we", "us", or "our").

A Moderator is responsible for monitoring online classes, supporting instructors and students, maintaining attendance and class records, identifying issues during sessions, and reporting relevant information to the Foundation.

By accepting a Moderator role, accessing the Moderator dashboard, joining online classes, monitoring students, or performing any Moderator duties, you agree to these Terms and Conditions.

1. Role of the Moderator
The Moderator acts as a class monitor and coordinator for Swammy Dwija Foundation.

The Moderator may be responsible for:
• Joining scheduled Zoom classes.
• Monitoring student attendance.
• Monitoring class start and end times.
• Checking whether the assigned Instructor conducts the class.
• Monitoring student participation where required.
• Supporting the Instructor during online sessions.
• Managing or assisting with the online classroom.
• Recording attendance accurately.
• Reporting technical or operational issues.
• Reporting significant classroom incidents.
• Communicating relevant information to the Foundation's authorized team.
• Supporting the smooth operation of online classes.

The Moderator's role is primarily to monitor, coordinate, and report, unless additional responsibilities have been specifically assigned by the Foundation.

2. Moderator Registration and Verification
Before being approved as a Moderator, the Foundation may require information such as full name, email address, mobile number, identification details, and relevant experience.
The Moderator must provide accurate and truthful information.

3. Moderator Approval
Submitting a Moderator application or creating a Moderator account does not automatically guarantee approval.
Swammy Dwija Foundation may approve, reject, suspend, or terminate Moderator access based on its operational needs, policies, or applicable agreements.

4. Zoom Class Monitoring
The Moderator may be required to join assigned Zoom classes.
The Moderator should join on time, use the official meeting link, verify that the scheduled class is taking place, monitor attendance, observe the session, report significant technical or operational problems, and assist the Instructor where needed.
The Moderator must not unnecessarily interrupt the Instructor or interfere with teaching.

5. Attendance Monitoring
Attendance monitoring is one of the primary responsibilities of the Moderator.
The Moderator may be responsible for recording students who joined the class, students who joined late, students who left early, and students who were absent.

Attendance records must be entered accurately and honestly.
The Moderator must not mark an absent student as present, modify attendance records for personal reasons, falsify attendance, or allow another person to attend using a student's account.

6. Attendance Corrections
If an attendance record contains an error, the Moderator should report the issue through the appropriate Foundation process.
Moderators should not manipulate historical attendance records without authorization.

7. Monitoring Instructor Attendance
The Moderator may also record relevant information concerning the Instructor's participation in the assigned class, including arrival time, class start time, class end time, early departure, or unscheduled cancellations.
The Moderator should record facts accurately and avoid making unsupported personal judgments about the Instructor.

8. Class Monitoring
The Moderator may monitor whether the scheduled class is taking place, the correct course/session is being conducted, students are able to access the session, the Instructor is present, and major technical problems are addressed.

9. Student Conduct Monitoring
The Moderator may help maintain an appropriate online classroom environment by reminding students about classroom rules, notifying the Instructor about disruptive behavior, reporting inappropriate conduct, and assisting with basic Zoom controls.

10. Moderator Communication With Students
Moderators may communicate with students for legitimate class-related purposes such as attendance clarification, class timing, Zoom access assistance, and basic instructions.
Moderators must not harass, threaten, or discriminate against students, request unnecessary personal information, or promote personal businesses or courses.

11. Student Privacy and Confidentiality
During their duties, Moderators may have access to student information such as name, email address, mobile number, course information, and attendance.
Such information must be treated as confidential and used only for legitimate Foundation-related purposes.
Moderators must not sell student information, share student records with unauthorized persons, or publish attendance records publicly.

12. Screenshots and Screen Recording
Moderators must not take screenshots, photographs, screen recordings, or other recordings of Zoom classes for personal use.
Moderators must not upload Foundation class recordings or screenshots to social media, messaging apps, or personal cloud storage.

13. Zoom Meeting Links and Access Information
Zoom meeting links, passwords, and meeting IDs must be treated as restricted information.
Moderators must not publicly post private meeting links or share credentials with unauthorized persons.

14. Moderator Dashboard
Where a Moderator dashboard is provided, the Moderator may access functions such as viewing assigned classes, student lists, recording attendance, viewing class schedules, and reporting issues.
The Moderator must use these functions only for authorized Foundation purposes and never attempt to bypass Platform security or modify records without authorization.

15. Class Reports
The Moderator may be required to submit class reports detailing date, start time, end time, instructor attendance, student attendance, technical issues, and operational observations.
Reports must be accurate and based on observed facts.

16. Reporting Problems
The Moderator should promptly report significant issues to the Foundation administrator, such as instructor absence, class cancellation, major technical failures, unauthorized entrants, or student misconduct.

17. No Unauthorized Changes
Moderators are not authorized to independently change course fees, curriculum, certificate requirements, student eligibility, instructor assignments, or official completion status.

18. Certificate and Course Completion
Moderators do not have independent authority to approve course completion, issue certificates, or guarantee certificates. Certificate issuance remains subject to the Foundation's official process.

19. Academic Decisions
The Moderator's primary role is monitoring and coordination. Unless separately authorized, the Moderator should not grade assignments, alter marks, or make academic eligibility decisions.

20. Professional Conduct
Moderators represent Swammy Dwija Foundation while performing their duties. Moderators must behave professionally, treat students and instructors respectfully, maintain confidentiality, and follow Foundation instructions.

21. No Personal or Commercial Use of Student Relationships
Moderators must not use access to Foundation students for unauthorized personal or commercial purposes, including selling products or collecting student information for marketing.

22. Confidential Foundation Information
Moderators must not disclose or misuse confidential Foundation information, including student records, instructor details, class schedules, or administrative data.

23. Account Security
Moderators are responsible for protecting their account credentials. Moderators must not share passwords or dashboard access with any unauthorized person.

24. Conflicts of Interest
A Moderator should disclose any situation that could materially interfere with their monitoring responsibilities, such as attempting to manipulate attendance records for personal associations.

25. Prohibited Activities
Moderators must not falsify attendance, alter student records, share confidential information, harass students or instructors, or misuse Zoom access.

26. Complaints and Investigations
The Foundation may review complaints regarding a Moderator and take appropriate action based on available information, applicable policies, and law.

27. Quality and Performance Monitoring
Swammy Dwija Foundation may review Moderator performance to ensure attendance accuracy, punctuality, and compliance with Foundation procedures.

28. Suspension or Termination of Moderator Access
The Foundation may suspend or terminate Moderator access for violation of these Terms, attendance falsification, inaccurate reporting, or misconduct.

29. Effect of Termination
After the Moderator's role ends, the Moderator must cease representing themselves as an active Foundation Moderator, stop accessing Foundation systems, and return or delete confidential information.

30. Technical Problems and Unexpected Events
Online classes may be affected by circumstances outside reasonable control, such as internet outages, device problems, or Zoom service interruptions. Moderators should report issues promptly.

31. Independent Relationship
Unless a separate written agreement provides otherwise, these Terms alone do not create an employer-employee relationship between the Moderator and Swammy Dwija Foundation.

32. Changes to These Terms
Swammy Dwija Foundation may update these Moderator Terms from time to time. Revised Terms will become effective from the date specified by the Foundation.

33. Governing Law
These Terms shall be governed by and interpreted in accordance with the applicable laws of India. Disputes shall be subject to the jurisdiction of courts having jurisdiction over the Foundation's location.

34. Contact and Grievances
For questions, concerns, technical issues, or complaints relating to the Moderator role, please contact:

Swammy Dwija Foundation
Email: swamidwijafoundation@gmail.com
Phone: +91 9989551305
Address: Swammy Dwija Foundation Official Office

35. Moderator Acceptance
By registering as a Moderator, accepting a Moderator assignment, accessing the Moderator dashboard, joining a class for monitoring purposes, or performing Moderator duties, you confirm that you have read, understood, and agree to these Moderator Terms and Conditions.

© Swammy Dwija Foundation. All Rights Reserved.`,

  privacyPolicy: `1. Information We Collect\nSwamy Dwija Foundation collects your name, email address, phone number, and basic profile information solely for account authentication, course enrollment, issuing completion certificates, and sending live session reminders.\n\n2. How We Use Your Information\nYour personal data is used exclusively to provide learning services, process payments via secure gateways (Razorpay / PhonePe), and send schedule updates. We never sell, rent, or trade your personal information to third parties.\n\n3. Data Security\nWe implement robust encryption and security protocols to safeguard your personal credentials and educational records against unauthorized access.\n\n4. Third-Party Integrations\nWe use verified services such as Google Identity for authentication and Zoom for live interactive classes. These services operate under their respective security standards.\n\n5. Privacy Questions\nIf you have questions about your personal data or wish to update your records, please reach out via the contact buttons below.`,

  refundPolicy: `1. 100% Digital Delivery\nAll courses, materials, and live lectures offered on Swamy Dwija Foundation are electronic digital goods. Course access is activated immediately upon successful payment verification.\n\n2. Cancellation Window\nYou may request a full refund or course transfer up to 24 hours prior to the start of Session 1 of your batch.\n\n3. Refund Processing\nApproved refunds are credited directly to your original payment method (Credit/Debit Card, Net Banking, or UPI) within 5 to 7 working business days.\n\n4. Exceptions\nOnce a batch has commenced and access to live interactive sessions or digital curriculum has been utilized, refunds cannot be issued. However, students experiencing genuine emergencies may request a transfer to a future batch.\n\n5. Submitting a Request\nTo request a cancellation or refund, please reach out to our team via the Call or Email button below with your registered email and Order ID.`,

  contactPhone: '+91 9989551305',
  contactEmail: 'swamidwijafoundation@gmail.com',
  faqs: [
    {
      q: 'How do I join my live Zoom classes?',
      a: 'Navigate to the Home screen under "Upcoming Live Classes" or go to "My Learning" -> tap your enrolled course -> select your active session under "Sessions" to join the live Zoom class.'
    },
    {
      q: 'When do I receive my course certificate?',
      a: 'Certificates are issued automatically once you finish all required video lessons, assignments, and quizzes with a passing grade.'
    },
    {
      q: 'Can I watch recorded lectures offline?',
      a: 'Yes, recorded classes and downloadable PDF materials are accessible 24/7 throughout your enrollment validity.'
    },
    {
      q: 'What if I miss a live class session?',
      a: "Don't worry! Instructors upload the session recording and notes to 'View Materials' inside your course dashboard so you can practice anytime."
    },
    {
      q: 'How do I download my payment invoice / receipt?',
      a: 'Visit Payment History from your Profile menu to view full transaction records and download an official receipt for each course purchase.'
    }
  ],
  updatedAt: new Date()
};

// Get Policies & Contact Information (Public)
router.get('/settings/policies', async (req, res) => {
  try {
    let setting = await SiteSetting.findOne({ key: 'platform_stats' });
    if (!setting) {
      setting = await SiteSetting.create({
        key: 'platform_stats',
        policies: DEFAULT_POLICIES
      });
    } else {
      let needsSave = false;
      if (!setting.policies) {
        setting.policies = { ...DEFAULT_POLICIES };
        needsSave = true;
      } else {
        if (!setting.policies.termsAndConditions) {
          setting.policies.termsAndConditions = DEFAULT_POLICIES.termsAndConditions;
          needsSave = true;
        }
        if (!setting.policies.instructorTerms) {
          setting.policies.instructorTerms = DEFAULT_POLICIES.instructorTerms;
          needsSave = true;
        }
        if (!setting.policies.moderatorTerms) {
          setting.policies.moderatorTerms = DEFAULT_POLICIES.moderatorTerms;
          needsSave = true;
        }
        if (!setting.policies.faqs || setting.policies.faqs.length === 0) {
          setting.policies.faqs = DEFAULT_POLICIES.faqs;
          needsSave = true;
        }
      }
      if (needsSave) {
        await setting.save();
      }
    }
    res.json({ success: true, data: setting.policies });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching policies', error: error.message });
  }
});

// Update Policies & Contact Information (Admin Only)
router.put('/settings/policies', protect, admin, async (req, res) => {
  try {
    const { termsAndConditions, instructorTerms, moderatorTerms, privacyPolicy, refundPolicy, contactPhone, contactEmail, faqs } = req.body;
    let setting = await SiteSetting.findOne({ key: 'platform_stats' });
    if (!setting) {
      setting = new SiteSetting({ key: 'platform_stats', policies: DEFAULT_POLICIES });
    }

    let sanitizedFaqs = setting.policies?.faqs || DEFAULT_POLICIES.faqs;
    if (Array.isArray(faqs)) {
      sanitizedFaqs = faqs.map((item) => ({
        q: (item.q || item.question || '').trim(),
        a: (item.a || item.answer || '').trim()
      })).filter((item) => item.q || item.a);
    }

    setting.policies = {
      termsAndConditions: termsAndConditions !== undefined ? termsAndConditions : (setting.policies?.termsAndConditions || DEFAULT_POLICIES.termsAndConditions),
      instructorTerms: instructorTerms !== undefined ? instructorTerms : (setting.policies?.instructorTerms || DEFAULT_POLICIES.instructorTerms),
      moderatorTerms: moderatorTerms !== undefined ? moderatorTerms : (setting.policies?.moderatorTerms || DEFAULT_POLICIES.moderatorTerms),
      privacyPolicy: privacyPolicy !== undefined ? privacyPolicy : (setting.policies?.privacyPolicy || DEFAULT_POLICIES.privacyPolicy),
      refundPolicy: refundPolicy !== undefined ? refundPolicy : (setting.policies?.refundPolicy || DEFAULT_POLICIES.refundPolicy),
      contactPhone: contactPhone || setting.policies?.contactPhone || DEFAULT_POLICIES.contactPhone,
      contactEmail: contactEmail || setting.policies?.contactEmail || DEFAULT_POLICIES.contactEmail,
      faqs: sanitizedFaqs,
      updatedAt: new Date()
    };

    await setting.save();
    res.json({
      success: true,
      message: 'Legal policies, FAQs & contact details updated successfully!',
      data: setting.policies
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating policies', error: error.message });
  }
});

module.exports = router;
