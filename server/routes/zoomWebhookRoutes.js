const express = require('express');
const router = express.Router();
const { handleWebhookUrlValidation } = require('../services/zoomService');
const Class = require('../models/Class');
const Course = require('../models/Course');
const Attendance = require('../models/Attendance');
const Material = require('../models/Material');
const User = require('../models/User');

/**
 * POST /api/zoom/webhook - Central Zoom Webhook Listener
 * Synchronizes meeting lifecycle, attendance, and cloud recordings
 */
router.post('/webhook', async (req, res) => {
  try {
    const { event, payload } = req.body;

    console.log(`[Zoom Webhook] Received Event: ${event}`);

    // 1. Zoom URL Validation Challenge (endpoint.url_validation)
    if (event === 'endpoint.url_validation') {
      const plainToken = payload?.plainToken;
      if (!plainToken) {
        return res.status(400).json({ success: false, message: 'Missing plainToken' });
      }
      const responseValidation = handleWebhookUrlValidation(plainToken);
      return res.status(200).json(responseValidation);
    }

    const meetingObj = payload?.object;
    const meetingId = meetingObj?.id?.toString();

    if (!meetingId) {
      return res.status(200).json({ success: true, message: 'Event received without meeting ID' });
    }

    // Find associated class in database
    const liveClass = await Class.findOne({ 
      $or: [
        { zoomMeetingId: meetingId },
        { zoomLink: { $regex: meetingId } }
      ]
    }).populate('courseId');

    // 2. Meeting Started
    if (event === 'meeting.started') {
      console.log(`[Zoom Webhook] Live Class Meeting Started: ID ${meetingId}`);
    }

    // 3. Meeting Ended
    if (event === 'meeting.ended') {
      console.log(`[Zoom Webhook] Live Class Meeting Ended: ID ${meetingId}`);
    }

    // 4. Participant Joined (Student Attendance Tracker)
    if (event === 'meeting.participant_joined') {
      const participant = meetingObj?.participant;
      const participantEmail = (participant?.email || participant?.user_name || '').toLowerCase().trim();
      const participantName = participant?.user_name || 'Learner';
      const joinTime = participant?.join_time ? new Date(participant.join_time) : new Date();

      if (liveClass && participantEmail) {
        // Find if user exists
        const user = await User.findOne({ emailOrPhone: participantEmail });

        await Attendance.findOneAndUpdate(
          { classId: liveClass._id, studentEmail: participantEmail },
          {
            $set: {
              classId: liveClass._id,
              courseId: liveClass.courseId?._id || liveClass.courseId,
              userId: user?._id,
              studentEmail: participantEmail,
              studentName: participantName,
              role: user?.role || 'student',
              joinTime,
              status: 'Present',
              zoomParticipantId: participant?.participant_user_id || participant?.id
            }
          },
          { upsert: true, new: true }
        );
        console.log(`[Zoom Webhook] Recorded Attendance (JOIN) for ${participantEmail} in class "${liveClass.title}"`);
      }
    }

    // 5. Participant Left (Calculate Duration)
    if (event === 'meeting.participant_left') {
      const participant = meetingObj?.participant;
      const participantEmail = (participant?.email || participant?.user_name || '').toLowerCase().trim();
      const leaveTime = participant?.leave_time ? new Date(participant.leave_time) : new Date();

      if (liveClass && participantEmail) {
        const existingRecord = await Attendance.findOne({ classId: liveClass._id, studentEmail: participantEmail });
        if (existingRecord) {
          const joinTime = existingRecord.joinTime || new Date();
          const durationMinutes = Math.max(1, Math.round((leaveTime - joinTime) / (1000 * 60)));
          
          existingRecord.leaveTime = leaveTime;
          existingRecord.durationMinutes = durationMinutes;
          await existingRecord.save();
          console.log(`[Zoom Webhook] Updated Attendance (LEAVE) for ${participantEmail}: ${durationMinutes} mins`);
        }
      }
    }

    // 6. Cloud Recording Completed (Auto-Publish to Class Study Materials)
    if (event === 'recording.completed') {
      const recordingFiles = meetingObj?.recording_files || [];
      const mp4File = recordingFiles.find(f => f.file_type === 'MP4' || f.file_extension === 'MP4') || recordingFiles[0];
      const playUrl = mp4File?.play_url || meetingObj?.share_url;

      if (liveClass && playUrl) {
        // Create or update Material record for students
        await Material.findOneAndUpdate(
          { courseId: liveClass.courseId?._id || liveClass.courseId, date: liveClass.date, materialType: 'Recording' },
          {
            $set: {
              courseId: liveClass.courseId?._id || liveClass.courseId,
              date: liveClass.date,
              topicsCovered: `${liveClass.title} - Official Cloud Recording`,
              driveLink: playUrl,
              materialType: 'Recording'
            }
          },
          { upsert: true, new: true }
        );
        console.log(`[Zoom Webhook] Auto-published Zoom Cloud Recording for class "${liveClass.title}": ${playUrl}`);
      }
    }

    res.status(200).json({ success: true, message: 'Webhook event processed successfully' });
  } catch (error) {
    console.error('[Zoom Webhook Error]:', error);
    res.status(500).json({ success: false, message: 'Error processing webhook', error: error.message });
  }
});

module.exports = router;
