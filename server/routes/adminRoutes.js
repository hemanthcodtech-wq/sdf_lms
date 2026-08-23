const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Course = require('../models/Course');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
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

    // Generate the High-Resolution PDF Certificate
    const certPdfBuffer = await generateCertificatePDF({
      studentName: studentName.trim(),
      courseTitle: courseTitle.trim(),
      completionDate: formattedDate,
      certificateId: finalCertId,
      studentId: studentId || (finalCertId.replace(/[^0-9]/g, '').slice(-8) ? `SDWFY${finalCertId.replace(/[^0-9]/g, '').slice(-8)}` : undefined),
      duration: duration || '30 Days\n(20 Hours)',
      instructorName: instructorName || 'RISHI KRISHNA',
      instructorTitle: instructorTitle || 'Yoga Instructor',
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

    // Update Enrollment in MongoDB if enrollmentId provided or if matching studentEmail & courseTitle
    let updatedEnrollment = null;
    if (updateEnrollment) {
      if (enrollmentId) {
        updatedEnrollment = await Enrollment.findById(enrollmentId);
      } else if (studentEmail) {
        updatedEnrollment = await Enrollment.findOne({ studentEmail });
      }

      if (updatedEnrollment) {
        updatedEnrollment.studentName = studentName.trim();
        updatedEnrollment.certificateId = finalCertId;
        updatedEnrollment.completed = true;
        updatedEnrollment.progress = 100;
        updatedEnrollment.completionDate = new Date();
        if (certificateUrl) {
          updatedEnrollment.certificateUrl = certificateUrl;
        }
        await updatedEnrollment.save();
      }
    }

    // Send Email to Learner if requested
    let emailSent = false;
    let emailError = null;
    if (sendEmail && studentEmail) {
      try {
        await sendCourseCompletionEmail({
          to: studentEmail.trim(),
          studentName: studentName.trim(),
          course: { title: courseTitle.trim() },
          certId: finalCertId,
          certificatePdfBuffer: certPdfBuffer
        });
        emailSent = true;
      } catch (eErr) {
        console.error('Email dispatch error:', eErr);
        emailError = eErr.message;
      }
    }

    res.json({
      success: true,
      message: emailSent
        ? `Certificate ${finalCertId} generated & emailed successfully to ${studentEmail}!`
        : `Certificate ${finalCertId} generated successfully!`,
      certificateId: finalCertId,
      certificateUrl,
      emailSent,
      emailError,
      enrollment: updatedEnrollment,
      pdfBase64: certPdfBuffer.toString('base64')
    });
  } catch (error) {
    console.error('Error generating custom certificate:', error);
    res.status(500).json({ success: false, message: 'Server error generating certificate', error: error.message });
  }
});

// Admin: Preview Certificate PDF directly as binary stream
router.post('/certificate/preview-pdf', protect, admin, async (req, res) => {
  try {
    const {
      studentName = 'Learner Name',
      courseTitle = 'Yoga for Wellness and Inner Balance',
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

    const certPdfBuffer = await generateCertificatePDF({
      studentName: studentName.trim(),
      courseTitle: courseTitle.trim(),
      completionDate: formattedDate,
      certificateId: finalCertId,
      studentId: studentId || 'SDWFY250501',
      duration: duration || '30 Days\n(20 Hours)',
      instructorName: instructorName || 'RISHI KRISHNA',
      instructorTitle: instructorTitle || 'Yoga Instructor',
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

module.exports = router;
