const express = require('express');
const { protect, instructor } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Course = require('../models/Course');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const Material = require('../models/Material');

const router = express.Router();

// GET /api/instructor/dashboard-stats
router.get('/dashboard-stats', protect, instructor, async (req, res) => {
  try {
    const instructorUser = await User.findById(req.user._id).select('-password');

    // Find all courses assigned to this instructor
    const assignedCourses = await Course.find({
      $or: [
        { instructorId: req.user._id },
        { instructor: req.user.name },
        { _id: { $in: instructorUser.assignedCourses || [] } }
      ]
    })
    .populate('moderatorId', 'name emailOrPhone phone')
    .sort('-createdAt');

    const courseIds = assignedCourses.map(c => c._id);

    let enrollments = [];
    let materials = [];
    let classes = [];

    if (courseIds.length > 0) {
      classes = await Class.find({
        $or: [
          { courseId: { $in: courseIds } },
          { instructor: req.user.name }
        ]
      }).populate('courseId', 'title category timings startTime endTime thumbnailUrl').sort('date time');

      enrollments = await Enrollment.find({
        course: { $in: courseIds }
      }).select('studentEmail course amountPaid progress createdAt');

      materials = await Material.find({
        courseId: { $in: courseIds }
      }).sort('-date');
    }

    // Attach student count, session metrics, and materials to each course
    const coursesWithStats = assignedCourses.map(c => {
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

    // Enrich classes with precise time-based status
    const now = new Date();
    const enrichedClasses = classes.map((cl, idx) => {
      const clObj = cl.toObject ? cl.toObject() : cl;
      const classDate = new Date(cl.date);
      let startHour = 6, startMin = 0;
      if (cl.time) {
        const parts = cl.time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (parts) {
          let h = parseInt(parts[1], 10);
          const m = parseInt(parts[2], 10);
          const ampm = parts[3] ? parts[3].toUpperCase() : null;
          if (ampm === 'PM' && h < 12) h += 12;
          if (ampm === 'AM' && h === 12) h = 0;
          startHour = h;
          startMin = m;
        }
      }
      const sessionStart = new Date(classDate);
      sessionStart.setHours(startHour, startMin, 0, 0);
      const duration = cl.durationMinutes || 60;
      const sessionEnd = new Date(sessionStart.getTime() + duration * 60 * 1000);

      const isPast = now > sessionEnd;
      const isLiveNow = now >= new Date(sessionStart.getTime() - 15 * 60 * 1000) && now <= sessionEnd;
      const status = isPast ? 'COMPLETED' : (isLiveNow ? 'LIVE NOW' : 'UPCOMING');

      return {
        ...clObj,
        sessionNumber: idx + 1,
        status,
        isPast,
        isLiveNow,
        isUpcoming: !isPast && !isLiveNow,
        sessionStart,
        sessionEnd
      };
    });

    const upcomingClasses = enrichedClasses.filter(c => !c.isPast);

    res.json({
      success: true,
      data: {
        profile: instructorUser,
        stats: {
          totalCourses: assignedCourses.length,
          totalClasses: enrichedClasses.length,
          upcomingClassesCount: upcomingClasses.length,
          totalStudents: enrollments.length
        },
        upcomingClasses: upcomingClasses.slice(0, 8),
        allClasses: enrichedClasses,
        assignedCourses: coursesWithStats
      }
    });
  } catch (error) {
    console.error('Error in instructor dashboard-stats:', error);
    res.status(500).json({ success: false, message: 'Error fetching instructor dashboard', error: error.message });
  }
});

// GET /api/instructor/courses/:id/details - Complete course view for instructor
router.get('/courses/:id/details', protect, instructor, async (req, res) => {
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

// GET /api/instructor/courses/:id/materials
router.get('/courses/:id/materials', protect, instructor, async (req, res) => {
  try {
    const materials = await Material.find({ courseId: req.params.id }).sort('-date');
    res.json({ success: true, data: materials });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching course materials', error: error.message });
  }
});

// POST /api/instructor/courses/:id/materials - Instructor adds material for a completed/conducted class
router.post('/courses/:id/materials', protect, instructor, async (req, res) => {
  try {
    const courseId = req.params.id;
    let { date, topicsCovered, driveLink, materialType } = req.body;

    if (!topicsCovered || !driveLink) {
      return res.status(400).json({ success: false, message: 'Topic covered and link are required' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    let normType = 'Recording';
    if (materialType) {
      const lower = materialType.toLowerCase();
      if (lower.includes('pdf') || lower.includes('note') || lower.includes('doc')) {
        normType = 'PDF';
      } else if (lower.includes('record') || lower.includes('video')) {
        normType = 'Recording';
      } else {
        normType = 'Other';
      }
    }

    const material = await Material.create({
      courseId,
      date: date ? new Date(date) : new Date(),
      topicsCovered: topicsCovered.trim(),
      driveLink: driveLink.trim(),
      materialType: normType
    });

    res.status(201).json({ success: true, message: 'Material added successfully', data: material });
  } catch (error) {
    console.error('Error adding material as instructor:', error);
    res.status(500).json({ success: false, message: error.message || 'Error adding material', error: error.message });
  }
});

// DELETE /api/instructor/courses/:id/materials/:materialId - Instructor removes material
router.delete('/courses/:id/materials/:materialId', protect, instructor, async (req, res) => {
  try {
    const { materialId } = req.params;
    await Material.findByIdAndDelete(materialId);
    res.json({ success: true, message: 'Material deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting material', error: error.message });
  }
});

// PUT /api/instructor/profile - Update instructor own profile
router.put('/profile', protect, instructor, async (req, res) => {
  try {
    const { name, phone, bio, speciality, experience, password } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const oldName = user.name;
    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (speciality !== undefined) user.speciality = speciality.trim();
    if (experience !== undefined) user.experience = experience.trim();
    if (password && password.length >= 6) {
      user.password = password;
    }

    await user.save();

    // Sync updated name to all assigned courses and classes
    if (name && name.trim() !== oldName) {
      await Course.updateMany(
        { $or: [{ instructorId: user._id }, { instructor: oldName }] },
        { instructor: user.name, instructorId: user._id }
      );
      await Class.updateMany(
        { instructor: oldName },
        { instructor: user.name }
      );
    }

    const responseData = user.toObject();
    delete responseData.password;

    res.json({ success: true, message: 'Profile updated successfully', data: responseData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating profile', error: error.message });
  }
});

module.exports = router;
