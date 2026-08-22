const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Class = require('../models/Class');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { generateMeetingSdkToken } = require('../services/zoomService');

// Middleware to extract user from Authorization header (Student, Instructor, Moderator, or Admin)
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id || decoded._id).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found or unauthorized' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token', error: error.message });
  }
};

/**
 * GET /api/live-classes/:classId/sdk-token
 * Generates Zoom Meeting SDK token for embedded in-app classroom experience
 */
router.get('/:classId/sdk-token', authenticateUser, async (req, res) => {
  try {
    const { classId } = req.params;
    const liveClass = await Class.findById(classId).populate('courseId');

    if (!liveClass) {
      return res.status(404).json({ success: false, message: 'Live class session not found' });
    }

    const course = liveClass.courseId;
    const user = req.user;

    // Verify Access Permissions
    let role = 0; // 0 = Attendee (student)
    const isInstructor = user.role === 'instructor' && (course?.instructorId?.toString() === user._id.toString() || user.assignedCourses?.includes(course?._id));
    const isModerator = user.role === 'moderator' && (course?.moderatorId?.toString() === user._id.toString() || user.assignedCourses?.includes(course?._id));
    const isAdmin = user.role === 'admin' || user.role === 'superadmin';

    if (isInstructor || isAdmin) {
      role = 1; // 1 = Host / Teacher
    } else if (!isModerator) {
      // Check student enrollment
      const enrollment = await Enrollment.findOne({
        studentEmail: user.emailOrPhone,
        courseId: course?._id
      });
      if (!enrollment && user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'You are not enrolled in this course batch' });
      }
    }

    const meetingNumber = liveClass.zoomMeetingId || (liveClass.zoomLink ? liveClass.zoomLink.match(/\/j\/([0-9]+)/)?.[1] : '9999999999');
    
    const sdkTokenData = generateMeetingSdkToken({
      meetingNumber: meetingNumber || '9999999999',
      role
    });

    res.json({
      success: true,
      data: {
        ...sdkTokenData,
        meetingNumber: meetingNumber || '9999999999',
        userName: user.name || user.firstName || 'Learner',
        userEmail: user.emailOrPhone,
        passWord: 'sdf' + (meetingNumber ? meetingNumber.slice(-3) : '123'),
        classTitle: liveClass.title,
        courseTitle: course?.title,
        zoomLink: liveClass.zoomLink,
        role: role === 1 ? 'Host' : 'Participant'
      }
    });
  } catch (error) {
    console.error('Error generating SDK token:', error);
    res.status(500).json({ success: false, message: 'Server error generating SDK token', error: error.message });
  }
});

/**
 * POST /api/live-classes/:classId/check-in
 * Record attendance when learner launches live classroom from Web or Mobile
 */
router.post('/:classId/check-in', authenticateUser, async (req, res) => {
  try {
    const { classId } = req.params;
    const liveClass = await Class.findById(classId);

    if (!liveClass) {
      return res.status(404).json({ success: false, message: 'Class session not found' });
    }

    const user = req.user;

    const record = await Attendance.findOneAndUpdate(
      { classId: liveClass._id, studentEmail: user.emailOrPhone },
      {
        $set: {
          classId: liveClass._id,
          courseId: liveClass.courseId,
          userId: user._id,
          studentEmail: user.emailOrPhone,
          studentName: user.name || user.firstName || 'Learner',
          role: user.role || 'student',
          joinTime: new Date(),
          status: 'Present'
        }
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Attendance recorded successfully', data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error checking in', error: error.message });
  }
});

/**
 * GET /api/live-classes/:classId/attendance
 * Retrieve complete attendance roster for a class
 */
router.get('/:classId/attendance', authenticateUser, async (req, res) => {
  try {
    const { classId } = req.params;
    const attendanceRecords = await Attendance.find({ classId }).sort('-joinTime');

    res.json({
      success: true,
      count: attendanceRecords.length,
      data: attendanceRecords
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching attendance', error: error.message });
  }
});

module.exports = router;
