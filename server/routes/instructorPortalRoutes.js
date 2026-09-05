const express = require('express');
const { protect, instructor } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Course = require('../models/Course');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const Material = require('../models/Material');

const router = express.Router();

// Helper to populate student user details for an array of enrollment records
const enrichEnrollmentsWithStudentDetails = async (enrollmentList) => {
  if (!enrollmentList || enrollmentList.length === 0) return [];
  const emails = [...new Set(enrollmentList.map(e => e.studentEmail).filter(Boolean))];
  let userMap = {};
  if (emails.length > 0) {
    const users = await User.find({
      $or: [
        { emailOrPhone: { $in: emails } },
        { email: { $in: emails } },
        { phone: { $in: emails } }
      ]
    }).select('name firstName lastName email emailOrPhone phone avatar createdAt');

    users.forEach(u => {
      if (u.emailOrPhone) userMap[u.emailOrPhone.toLowerCase()] = u;
      if (u.email) userMap[u.email.toLowerCase()] = u;
      if (u.phone) userMap[u.phone.toLowerCase()] = u;
    });
  }

  return enrollmentList.map(enr => {
    const eObj = enr.toObject ? enr.toObject() : { ...enr };
    const emailKey = (enr.studentEmail || '').toLowerCase();
    const user = userMap[emailKey] || {};

    let studentName = user.name;
    if (!studentName && user.firstName) {
      studentName = `${user.firstName} ${user.lastName || ''}`.trim();
    }
    if (!studentName && enr.studentEmail) {
      studentName = enr.studentEmail.includes('@') ? enr.studentEmail.split('@')[0] : enr.studentEmail;
    }
    if (!studentName) {
      studentName = 'Learner';
    }

    const studentPhone = user.phone || (!user.emailOrPhone?.includes('@') ? user.emailOrPhone : '') || '';
    const studentEmail = user.email || (user.emailOrPhone?.includes('@') ? user.emailOrPhone : enr.studentEmail) || enr.studentEmail;

    return {
      ...eObj,
      studentName,
      studentPhone,
      studentEmail,
      studentAvatar: user.avatar || '',
      enrolledAt: enr.createdAt || user.createdAt
    };
  });
};

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

      const rawEnrollments = await Enrollment.find({
        course: { $in: courseIds }
      }).select('studentEmail course amountPaid paymentStatus progress completed createdAt');

      enrollments = await enrichEnrollmentsWithStudentDetails(rawEnrollments);

      materials = await Material.find({
        courseId: { $in: courseIds }
      }).sort('-date');
    }

    // Attach student count, full student details, session metrics, and materials to each course
    const coursesWithStats = assignedCourses.map(c => {
      const cObj = c.toObject();
      const courseEnrollments = enrollments.filter(e => e.course?.toString() === c._id.toString());
      const courseClasses = classes.filter(cl => cl.courseId?._id?.toString() === c._id.toString() || cl.courseId?.toString() === c._id.toString());
      const courseMaterials = materials.filter(m => m.courseId?.toString() === c._id.toString());
      return {
        ...cObj,
        enrolledStudentsCount: courseEnrollments.length,
        students: courseEnrollments,
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
      // Parse session date & time in IST (Asia/Kolkata +05:30)
      const datePart = new Date(cl.date).toISOString().split('T')[0];
      const timePart = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}:00+05:30`;
      const sessionStart = new Date(`${datePart}T${timePart}`);
      const duration = cl.durationMinutes || 60;
      const sessionEnd = new Date(sessionStart.getTime() + duration * 60 * 1000);

      const isPast = now > sessionEnd;
      const isLiveNow = now >= new Date(sessionStart.getTime() - 15 * 60 * 1000) && now <= sessionEnd;
      
      let status = 'UPCOMING';
      if (isPast) status = 'COMPLETED';
      else if (isLiveNow) status = 'LIVE NOW';

      // Determine Host start URL for launching Zoom directly
      let zoomHostUrl = cl.zoomStartUrl || '';
      if (!zoomHostUrl && cl.zoomLink) {
        // Convert /j/ (join) to /s/ (start) so Zoom prompts "Launch Zoom Meetings"
        zoomHostUrl = cl.zoomLink.replace(/\/j\//, '/s/');
      }

      return {
        ...clObj,
        sessionNumber: idx + 1,
        status,
        isPast,
        isLiveNow,
        isUpcoming: !isPast && !isLiveNow,
        sessionStart,
        sessionEnd,
        zoomStartUrl: zoomHostUrl || cl.zoomLink,
        zoomHostUrl: zoomHostUrl || cl.zoomLink
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
        assignedCourses: coursesWithStats,
        allStudents: enrollments
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
    const rawEnrollments = await Enrollment.find({ course: courseId }).select('studentEmail progress createdAt amountPaid paymentStatus completed');
    const enrollments = await enrichEnrollmentsWithStudentDetails(rawEnrollments);

    res.json({
      success: true,
      data: {
        course,
        classes,
        materials,
        enrollments,
        students: enrollments
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

// PUT /api/instructor/courses/:id/whatsapp - Update WhatsApp group/channel link
router.put('/courses/:id/whatsapp', protect, async (req, res) => {
  try {
    const courseId = req.params.id;
    const { whatsappGroupLink } = req.body;

    const isSuperAdmin = req.user.role === 'admin';
    let query = { _id: courseId };
    if (!isSuperAdmin) {
      query.$or = [
        { instructorId: req.user._id },
        { instructor: req.user.name },
        { moderatorId: req.user._id },
        { _id: { $in: req.user.assignedCourses || [] } }
      ];
    }

    const course = await Course.findOne(query);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found or you are not authorized to edit it' });
    }

    course.whatsappGroupLink = (whatsappGroupLink || '').trim();
    await course.save();

    res.json({
      success: true,
      message: 'WhatsApp group/channel link updated successfully',
      data: { courseId: course._id, whatsappGroupLink: course.whatsappGroupLink }
    });
  } catch (error) {
    console.error('Error updating course whatsapp link:', error);
    res.status(500).json({ success: false, message: 'Error updating WhatsApp link', error: error.message });
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
