const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Course = require('../models/Course');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const courseRoutes = require('./courseRoutes');

const router = express.Router();

router.use('/courses', courseRoutes);

// Get Dashboard Analytics
router.get('/analytics', protect, admin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'student' });
    const totalCourses = await Course.countDocuments();
    const totalEnrollments = await Enrollment.countDocuments();
    const totalClasses = await Class.countDocuments();

    // Calculate total revenue
    const revenueResult = await Enrollment.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: '$amountPaid' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Get Recent Activity (last 5 enrollments with user and course info)
    const recentActivity = await Enrollment.find()
      .populate('course', 'title category')
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
        totalRevenue,
        recentActivity,
        upcomingClasses
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching analytics' });
  }
});

// Get all users
router.get('/users', protect, admin, async (req, res) => {
  try {
    const users = await User.find({ role: 'student' }).select('-password');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching users' });
  }
});

module.exports = router;
