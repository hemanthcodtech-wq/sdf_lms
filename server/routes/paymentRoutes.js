const express = require('express');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { generateInvoicePDF } = require('../utils/pdfGenerator');
const { sendCourseEnrollmentEmail } = require('../utils/emailService');

const router = express.Router();

// GET all enrollments for a user (Payment History / My Courses)
router.get(['/history', '/my-enrollments', '/my-payments'], protect, async (req, res) => {
  try {
    const studentIdentifiers = [
      req.user.emailOrPhone,
      req.user.email,
      req.user.phone
    ].filter(Boolean);

    const enrollments = await Enrollment.find({
      $or: [
        { studentEmail: { $in: studentIdentifiers } },
        { user: req.user._id },
        { userId: req.user._id }
      ]
    })
      .populate('course', 'title category thumbnailUrl accessValidity duration price instructor instructorId whatsappGroupLink')
      .sort('-createdAt');

    // Ensure any completed enrollment has a valid certificateId attached to their account
    for (const enr of enrollments) {
      if ((enr.completed || enr.progress >= 100) && !enr.certificateId) {
        enr.certificateId = `SDF-CERT-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;
        enr.completed = true;
        enr.progress = 100;
        if (!enr.completionDate) enr.completionDate = new Date();
        await enr.save().catch(() => {});
      }
    }

    res.json({ success: true, data: enrollments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error fetching enrollments', error: error.message });
  }
});

// Download PDF Invoice
router.get('/invoice/:enrollmentId/download', protect, async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.enrollmentId).populate('course');
    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const user = await User.findOne({ emailOrPhone: enrollment.studentEmail });
    let studentName = user?.name;
    if (!studentName && user?.firstName) {
      studentName = `${user.firstName} ${user.lastName || ''}`.trim();
    }
    if (!studentName) {
      studentName = enrollment.studentEmail.split('@')[0];
    }

    const invoiceBuffer = await generateInvoicePDF({
      invoiceNumber: enrollment.invoiceNumber || `SDF-INV-${enrollment._id.toString().slice(-6).toUpperCase()}`,
      studentName,
      studentEmail: enrollment.studentEmail,
      courseTitle: enrollment.course?.title || 'Yoga Course',
      amountPaid: enrollment.amountPaid,
      paymentDate: new Date(enrollment.createdAt).toLocaleDateString('en-IN'),
      accessValidity: enrollment.course?.accessValidity || '2 Months'
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${enrollment.invoiceNumber || 'SDF-Receipt'}.pdf`);
    res.send(invoiceBuffer);
  } catch (error) {
    console.error('Error downloading invoice:', error);
    res.status(500).json({ success: false, message: 'Error generating invoice PDF' });
  }
});

// Create Razorpay Order
router.post('/create-order', protect, async (req, res) => {
  try {
    const { courseId, amount } = req.body;
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Determine final price (use amount passed if provided and valid, otherwise course.price)
    const numericAmount = amount !== undefined && !isNaN(Number(amount)) ? Number(amount) : Number(course.price || 0);

    // If free course, no Razorpay order required
    if (numericAmount <= 0) {
      return res.json({
        success: true,
        isFree: true,
        order: {
          id: `free_${Date.now()}`,
          amount: 0,
          currency: 'INR',
        },
        key: process.env.RAZORPAY_KEY_ID || 'rzp_live_TVzQGEkYQFMh9I',
      });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay payment gateway keys are not configured on server.',
      });
    }

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: Math.round(numericAmount * 100), // paise
      currency: "INR",
      receipt: `rcpt_${Date.now().toString().slice(-8)}`
    };

    const order = await instance.orders.create(options);

    res.json({ 
      success: true, 
      order, 
      key: process.env.RAZORPAY_KEY_ID 
    });
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.error?.description || error.message || 'Error creating Razorpay order', 
      error: error.message 
    });
  }
});

// Verify Razorpay Payment and send confirmation email with invoice PDF
router.post('/verify-payment', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId, amountPaid, isFree } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check if free course enrollment
    const isFreeEnrollment = isFree === true || amountPaid === 0 || razorpay_order_id?.startsWith('free_');

    let isAuthentic = false;
    if (isFreeEnrollment) {
      isAuthentic = true;
    } else if (razorpay_order_id && razorpay_payment_id && razorpay_signature && process.env.RAZORPAY_KEY_SECRET) {
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      isAuthentic = expectedSignature === razorpay_signature;
    }

    if (isAuthentic || process.env.NODE_ENV === 'development') {
      const invoiceNumber = `SDF-INV-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;
      const finalAmount = amountPaid !== undefined ? Number(amountPaid) : (isFreeEnrollment ? 0 : Number(course.price || 0));

      // Create Enrollment
      const enrollment = await Enrollment.create({
        course: courseId,
        studentEmail: req.user.emailOrPhone,
        amountPaid: finalAmount,
        invoiceNumber: invoiceNumber,
        paymentStatus: 'completed',
        progress: 0
      });

      // Get student name for invoice
      const user = await User.findById(req.user._id);
      let studentName = user?.name;
      if (!studentName && user?.firstName) {
        studentName = `${user.firstName} ${user.lastName || ''}`.trim();
      }
      if (!studentName) {
        studentName = req.user.emailOrPhone.split('@')[0];
      }

      const { uploadBufferToCloudinary } = require('../utils/cloudinaryUploader');

      // Generate Invoice PDF, upload to Cloudinary, and send email asynchronously
      generateInvoicePDF({
        invoiceNumber,
        studentName,
        studentEmail: req.user.emailOrPhone,
        courseTitle: course.title,
        amountPaid: finalAmount,
        paymentDate: new Date().toLocaleDateString('en-IN'),
        accessValidity: course.accessValidity || '2 Months'
      }).then(async (invoicePdfBuffer) => {
        // Upload to Cloudinary
        try {
          const cloudUrl = await uploadBufferToCloudinary(invoicePdfBuffer, invoiceNumber, 'sdf_invoices');
          if (cloudUrl) {
            enrollment.invoiceUrl = cloudUrl;
            await enrollment.save();
          }
        } catch (cErr) {
          console.error("Cloudinary invoice upload error:", cErr);
        }

        sendCourseEnrollmentEmail({
          to: req.user.emailOrPhone,
          studentName,
          course,
          invoiceNumber,
          amountPaid: finalAmount,
          invoicePdfBuffer
        }).catch(emailErr => console.error("Enrollment email sending error:", emailErr));
      }).catch(pdfErr => console.error("Invoice PDF generation error:", pdfErr));

      res.json({ 
        success: true, 
        message: 'Payment verified and enrollment confirmed!', 
        data: enrollment 
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid Payment Signature' });
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ success: false, message: 'Error verifying payment', error: error.message });
  }
});

module.exports = router;
