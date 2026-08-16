const express = require('express');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// GET all enrollments for a user (Payment History)
router.get('/history', protect, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ studentEmail: req.user.emailOrPhone })
      .populate('course', 'title category thumbnailUrl')
      .sort('-createdAt');
      
    res.json({ success: true, data: enrollments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error fetching payment history', error: error.message });
  }
});

// Process Mock Checkout
router.post('/mock-checkout', async (req, res) => {
  try {
    const { courseId, email, amount } = req.body;
    
    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Create enrollment record
    const enrollment = await Enrollment.create({
      course: courseId,
      studentEmail: email,
      amountPaid: amount,
      paymentStatus: 'completed'
    });

    // Send confirmation email asynchronously
    const { sendEnrollmentConfirmation } = require('../services/emailService');
    sendEnrollmentConfirmation(email, course.title, amount).catch(err => console.error("Email error:", err));

    // Mock network latency for realism
    setTimeout(() => {
      res.status(200).json({ success: true, message: 'Payment successful', data: enrollment });
    }, 2500);
    
  } catch (error) {
    res.status(500).json({ success: false, message: 'Payment failed', error: error.message });
  }
});

module.exports = router;
