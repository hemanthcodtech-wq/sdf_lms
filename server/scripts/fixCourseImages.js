require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Course = require('../models/Course');

async function fixCourses() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const courses = await Course.find();
  for (const c of courses) {
    console.log(`Course: "${c.title}", raw thumbnailUrl: "${c.thumbnailUrl}"`);
    if (c.thumbnailUrl) {
      let normalized = c.thumbnailUrl.replace(/\\/g, '/');
      const idx = normalized.indexOf('/uploads/');
      if (idx !== -1) {
        normalized = normalized.substring(idx);
      } else if (normalized.startsWith('uploads/')) {
        normalized = '/' + normalized;
      }
      if (normalized !== c.thumbnailUrl) {
        console.log(`Updating "${c.title}" -> ${normalized}`);
        c.thumbnailUrl = normalized;
        await c.save();
      }
    }
  }
  console.log('Done fixing courses.');
  process.exit(0);
}

fixCourses().catch(console.error);
