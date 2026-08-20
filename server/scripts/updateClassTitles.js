const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Course = require('../models/Course');
const Class = require('../models/Class');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sdf_lms';

async function updateTitles() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for class title updates...');

    const courses = await Course.find();
    for (const course of courses) {
      const classes = await Class.find({ courseId: course._id }).sort({ date: 1, time: 1 });
      const topics = course.topics && course.topics.length > 0 ? course.topics : ['Foundation & Alignment', 'Core Practice', 'Breathing & Flow', 'Posture Deep Dive', 'Integration & Relaxation'];

      for (let i = 0; i < classes.length; i++) {
        const cls = classes[i];
        const sessionIndex = i + 1;
        const topicName = topics[i % topics.length];
        const newTitle = `${course.title} - Session ${sessionIndex}: ${topicName}`;

        cls.title = newTitle;
        await cls.save();
      }
      console.log(`Updated ${classes.length} class titles for: ${course.title}`);
    }

    console.log('✅ All existing class titles successfully updated with Session # and Topic names!');
    process.exit(0);
  } catch (err) {
    console.error('Update error:', err);
    process.exit(1);
  }
}

updateTitles();
