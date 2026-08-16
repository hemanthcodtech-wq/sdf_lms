const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');

const router = express.Router();

// GET all registered users
router.get('/', protect, admin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort('-createdAt');
    
    // For each user, let's optionally get their enrollment count.
    // However, the cleanest way is an aggregation, but doing it in code is fine for smaller sets.
    const enrollments = await Enrollment.find().select('studentEmail');
    
    // Map enrollments by email
    const enrollmentCounts = enrollments.reduce((acc, en) => {
      acc[en.studentEmail] = (acc[en.studentEmail] || 0) + 1;
      return acc;
    }, {});

    const usersWithStats = users.map(user => ({
      ...user.toObject(),
      enrolledCoursesCount: enrollmentCounts[user.emailOrPhone] || 0
    }));

    res.json({ success: true, data: usersWithStats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// GET single user and their enrollments
router.get('/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Fetch enrollments mapped to this user's emailOrPhone
    const enrollments = await Enrollment.find({ studentEmail: user.emailOrPhone })
      .populate('course', 'title category level')
      .sort('-createdAt');

    res.json({ 
      success: true, 
      data: {
        user,
        enrollments
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

module.exports = router;
