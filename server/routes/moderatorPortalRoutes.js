const express = require('express');
const { protect, moderator } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Course = require('../models/Course');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const Material = require('../models/Material');

const router = express.Router();

// GET /api/moderator/dashboard-stats
router.get('/dashboard-stats', protect, moderator, async (req, res) => {
  try {
    const moderatorUser = await User.findById(req.user._id).select('-password');
    const totalUsers = await User.countDocuments({ role: 'student' });
    const totalInstructors = await User.countDocuments({ role: 'instructor' });
    const totalCourses = await Course.countDocuments();
    const totalEnrollments = await Enrollment.countDocuments();

    // Fetch assigned courses specifically assigned to this moderator, or all active courses
    const assignedCourses = await Course.find({
      $or: [
        { moderatorId: req.user._id },
        { moderator: req.user.name }
      ]
    })
    .populate('instructorId', 'name emailOrPhone speciality phone')
    .sort('-createdAt');

    const allCourses = await Course.find({ isPublished: true })
      .populate('instructorId', 'name emailOrPhone speciality phone')
      .populate('moderatorId', 'name emailOrPhone phone')
      .sort('-createdAt');

    const targetCourses = assignedCourses.length > 0 ? assignedCourses : allCourses;
    const courseIds = targetCourses.map(c => c._id);

    // Fetch classes, enrollments, and materials
    const classes = await Class.find({ courseId: { $in: courseIds } })
      .populate('courseId', 'title category timings startTime endTime')
      .sort('date time');

    const enrollments = await Enrollment.find({ course: { $in: courseIds } })
      .select('studentEmail course amountPaid progress');

    const materials = await Material.find({ courseId: { $in: courseIds } }).sort('-date');

    const coursesWithStats = targetCourses.map(c => {
      const cObj = c.toObject();
      const courseEnrollments = enrollments.filter(e => e.course?.toString() === c._id.toString());
      const courseClasses = classes.filter(cl => cl.courseId?._id?.toString() === c._id.toString() || cl.courseId?.toString() === c._id.toString());
      const courseMaterials = materials.filter(m => m.courseId?.toString() === c._id.toString());
      return {
        ...cObj,
        enrolledStudentsCount: courseEnrollments.length,
        totalSessionsCount: courseClasses.length || (c.sessionDates ? c.sessionDates.length : 0),
        classes: courseClasses,
        materials: courseMaterials
      };
    });

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const upcomingSessions = classes.filter(c => new Date(c.date) >= now);

    // Recent registered users for review
    const recentStudents = await User.find({ role: 'student' })
      .select('name emailOrPhone phone status createdAt')
      .sort('-createdAt')
      .limit(8);

    res.json({
      success: true,
      data: {
        profile: moderatorUser,
        stats: {
          totalUsers,
          totalInstructors,
          totalCourses,
          totalEnrollments,
          assignedCoursesCount: assignedCourses.length,
          systemStatus: 'Optimal',
          flaggedItemsCount: 0
        },
        assignedCourses: coursesWithStats,
        isSpecificallyAssigned: assignedCourses.length > 0,
        upcomingSessions: upcomingSessions.slice(0, 6),
        recentStudents
      }
    });
  } catch (error) {
    console.error('Error in moderator dashboard-stats:', error);
    res.status(500).json({ success: false, message: 'Error fetching moderator dashboard', error: error.message });
  }
});

// GET /api/moderator/courses/:id/details - Full course access for moderator
router.get('/courses/:id/details', protect, moderator, async (req, res) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findById(courseId)
      .populate('instructorId', 'name emailOrPhone speciality phone bio')
      .populate('moderatorId', 'name emailOrPhone phone');

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const classes = await Class.find({ courseId }).sort('date time');
    const materials = await Material.find({ courseId }).sort('-date');
    const enrollments = await Enrollment.find({ course: courseId }).select('studentEmail progress createdAt amountPaid');

    res.json({
      success: true,
      data: {
        course,
        classes,
        materials,
        enrollments
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching course details', error: error.message });
  }
});

// PUT /api/moderator/profile - Update moderator profile
router.put('/profile', protect, moderator, async (req, res) => {
  try {
    const { name, phone, bio, password } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (password && password.length >= 6) {
      user.password = password;
    }

    await user.save();

    const responseData = user.toObject();
    delete responseData.password;

    res.json({ success: true, message: 'Profile updated successfully', data: responseData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating profile', error: error.message });
  }
});

module.exports = router;
