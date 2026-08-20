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

module.exports = router;
