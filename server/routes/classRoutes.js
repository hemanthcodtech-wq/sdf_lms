const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const Class = require('../models/Class');
const Course = require('../models/Course');
const { createZoomMeeting } = require('../services/zoomService');
const { sendClassUpdateAlert, sendClassReminder } = require('../services/emailService');

const Enrollment = require('../models/Enrollment');

const router = express.Router();

// GET classes for a logged-in student based on their enrollments
router.get('/student', protect, async (req, res) => {
  try {
    const studentIdentifier = req.user.emailOrPhone;
    
    // Find all courses the student is enrolled in
    const enrollments = await Enrollment.find({ studentEmail: studentIdentifier });
    const enrolledCourseIds = enrollments.map(e => e.course);

    // Find all scheduled classes for those courses
    const classes = await Class.find({ courseId: { $in: enrolledCourseIds } })
      .populate('courseId', 'title category level thumbnailUrl whatsappGroupLink instructor timings')
      .sort('date time');
      
    res.json({ success: true, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// GET all scheduled classes (admin & public)
router.get('/', async (req, res) => {
  try {
    const classes = await Class.find()
      .populate('courseId', 'title category level thumbnailUrl whatsappGroupLink instructor timings')
      .sort('date time');
    res.json({ success: true, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// POST schedule a new class (admin)
router.post('/', protect, admin, async (req, res) => {
  try {
    const { title, courseId, date, time, durationMinutes, isRecurring } = req.body;
    
    // Ensure course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Try to create Zoom meeting
    // Convert date + time to ISO 8601 for Zoom start_time
    const startTimeObj = new Date(`${date}T${time}:00`);
    const zoomDetails = await createZoomMeeting(title || `${course.title} Class`, startTimeObj.toISOString(), durationMinutes);

    const newClass = await Class.create({
      title,
      courseId,
      date,
      time,
      durationMinutes,
      isRecurring,
      zoomLink: zoomDetails.joinUrl,
      zoomMeetingId: zoomDetails.meetingId
    });

    res.status(201).json({ success: true, data: newClass });
  } catch (error) {
    console.error('Error scheduling class:', error);
    res.status(500).json({ success: false, message: 'Error scheduling class', error: error.message });
  }
});

// PUT update a scheduled class (admin)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const classId = req.params.id;
    const updateData = req.body;

    const updatedClass = await Class.findByIdAndUpdate(classId, updateData, { new: true }).populate('courseId', 'title');
    
    if (!updatedClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    // Trigger schedule change email alert to enrolled students
    try {
      const enrollments = await Enrollment.find({ course: updatedClass.courseId._id });
      for (const en of enrollments) {
        await sendClassUpdateAlert(en.studentEmail, updatedClass.courseId.title, updatedClass.title, updatedClass.date, updatedClass.time);
      }
    } catch (emailErr) {
      console.error('Failed to send class update alerts:', emailErr);
    }

    res.json({ success: true, data: updatedClass });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating class', error: error.message });
  }
});

// POST /api/classes/:id/reschedule - Reschedule a class session with a fresh Zoom meeting
router.post('/:id/reschedule', protect, admin, async (req, res) => {
  try {
    const classId = req.params.id;
    const { newDate, newTime, newTitle, durationMinutes } = req.body;

    if (!newDate || !newTime) {
      return res.status(400).json({ success: false, message: 'New date and time are required to reschedule' });
    }

    const liveClass = await Class.findById(classId).populate('courseId');
    if (!liveClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    const oldDateStr = new Date(liveClass.date).toISOString().split('T')[0];
    const newDateStr = newDate;

    // Generate new Zoom meeting for the new date and time
    let formattedTime = newTime;
    // Format 12-hour or 24-hour time to ISO format
    let hours = 6, minutes = 0;
    if (newTime.includes(':')) {
      const parts = newTime.split(':');
      hours = parseInt(parts[0], 10);
      minutes = parseInt(parts[1], 10);
      if (newTime.toLowerCase().includes('pm') && hours < 12) hours += 12;
      if (newTime.toLowerCase().includes('am') && hours === 12) hours = 0;
    }

    const startTimeObj = new Date(newDate);
    startTimeObj.setHours(hours, minutes, 0, 0);

    const classTitle = newTitle || liveClass.title || `${liveClass.courseId?.title || 'SDF'} Class`;
    const classDuration = parseInt(durationMinutes, 10) || liveClass.durationMinutes || 60;

    const zoomDetails = await createZoomMeeting(classTitle, startTimeObj.toISOString(), classDuration);

    // Update the class document
    liveClass.title = classTitle;
    liveClass.date = new Date(newDate);
    liveClass.time = formattedTime;
    liveClass.durationMinutes = classDuration;
    liveClass.zoomLink = zoomDetails.joinUrl;
    liveClass.zoomMeetingId = zoomDetails.meetingId;
    await liveClass.save();

    // Update Course sessionDates array to stay in sync
    if (liveClass.courseId) {
      const course = await Course.findById(liveClass.courseId._id || liveClass.courseId);
      if (course && Array.isArray(course.sessionDates)) {
        const updatedDates = course.sessionDates.filter(d => d !== oldDateStr);
        if (!updatedDates.includes(newDateStr)) {
          updatedDates.push(newDateStr);
        }
        updatedDates.sort();
        course.sessionDates = updatedDates;
        await course.save();
      }
    }

    // Send notifications to enrolled students
    try {
      const enrollments = await Enrollment.find({ course: liveClass.courseId?._id || liveClass.courseId });
      for (const en of enrollments) {
        await sendClassUpdateAlert(en.studentEmail, liveClass.courseId?.title || 'Course', liveClass.title, liveClass.date, liveClass.time);
      }
    } catch (emailErr) {
      console.error('[Class Reschedule] Alert email error:', emailErr.message);
    }

    res.json({
      success: true,
      message: `Class "${liveClass.title}" rescheduled successfully to ${newDate} at ${newTime} with a new Zoom meeting link!`,
      data: liveClass
    });
  } catch (error) {
    console.error('Error rescheduling class:', error);
    res.status(500).json({ success: false, message: 'Error rescheduling class', error: error.message });
  }
});

// POST send class reminder (admin)
router.post('/:id/remind', protect, admin, async (req, res) => {
  try {
    const classId = req.params.id;
    const classDetails = await Class.findById(classId).populate('courseId', 'title');
    
    if (!classDetails) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    const enrollments = await Enrollment.find({ course: classDetails.courseId._id });
    let count = 0;
    
    for (const en of enrollments) {
      await sendClassReminder(
        en.studentEmail, 
        classDetails.courseId.title, 
        classDetails.title, 
        classDetails.date, 
        classDetails.time, 
        classDetails.zoomLink
      );
      count++;
    }

    res.json({ success: true, message: `Reminders sent to ${count} students.` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error sending reminders', error: error.message });
  }
});

// DELETE a scheduled class (admin)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const classId = req.params.id;
    const deletedClass = await Class.findByIdAndDelete(classId);

    if (!deletedClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    res.json({ success: true, message: 'Class successfully deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting class', error: error.message });
  }
});

module.exports = router;
