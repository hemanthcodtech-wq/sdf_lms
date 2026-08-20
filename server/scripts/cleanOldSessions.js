const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Course = require('../models/Course');
const Class = require('../models/Class');
const Material = require('../models/Material');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sdf_lms';

async function clean() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for session cleanup...');

    const courses = await Course.find();
    for (const course of courses) {
      if (course.startDate) {
        const start = new Date(course.startDate);
        start.setHours(0, 0, 0, 0);

        // Delete any class scheduled before the official start date
        const deletedClasses = await Class.deleteMany({
          courseId: course._id,
          date: { $lt: start }
        });
        if (deletedClasses.deletedCount > 0) {
          console.log(`Deleted ${deletedClasses.deletedCount} pre-start classes for: ${course.title}`);
        }

        // Delete any material before official start date
        const deletedMaterials = await Material.deleteMany({
          courseId: course._id,
          date: { $lt: start }
        });
        if (deletedMaterials.deletedCount > 0) {
          console.log(`Deleted ${deletedMaterials.deletedCount} pre-start materials for: ${course.title}`);
        }
      }
    }

    console.log('✅ Session date cleanup completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Cleanup error:', err);
    process.exit(1);
  }
}

clean();
