require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Class = require('../models/Class');
const Course = require('../models/Course');
const { createZoomMeeting } = require('../services/zoomService');

async function populateZoom() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const classes = await Class.find().populate('courseId');
  console.log(`Found ${classes.length} classes to check.`);

  for (const item of classes) {
    if (!item.zoomLink || item.zoomLink.includes('zoom.us/j/54') || item.zoomLink.includes('zoom.us/j/65') || item.zoomLink.includes('zoom.us/j/73')) {
      console.log(`Generating real Zoom meeting for: "${item.title}"...`);
      try {
        const meeting = await createZoomMeeting(
          item.title || 'Swamy Dwija Foundation Live Class',
          item.date ? new Date(item.date).toISOString() : new Date().toISOString(),
          item.durationMinutes || 60
        );

        if (meeting.success && meeting.joinUrl) {
          item.zoomLink = meeting.joinUrl;
          item.zoomMeetingId = meeting.meetingId;
          await item.save();
          console.log(`Updated class "${item.title}" with real Zoom: ${meeting.joinUrl}`);
        }
      } catch (err) {
        console.error(`Failed to create meeting for "${item.title}":`, err.message);
      }
    }
  }

  // Also update courses
  const courses = await Course.find();
  for (const c of courses) {
    if (!c.zoomMeetingLink || c.zoomMeetingLink.includes('zoom.us/j/54') || c.zoomMeetingLink.includes('zoom.us/j/65')) {
      try {
        const meeting = await createZoomMeeting(
          c.title || 'Swamy Dwija Foundation Live Course',
          new Date().toISOString(),
          60
        );
        if (meeting.success && meeting.joinUrl) {
          c.zoomMeetingLink = meeting.joinUrl;
          await c.save();
          console.log(`Updated course "${c.title}" with real Zoom: ${meeting.joinUrl}`);
        }
      } catch (err) {
        console.error(`Failed to create course meeting:`, err.message);
      }
    }
  }

  console.log('All classes & courses updated with live Zoom meetings!');
  process.exit(0);
}

populateZoom().catch(console.error);
