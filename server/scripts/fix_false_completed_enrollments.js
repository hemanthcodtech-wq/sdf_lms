const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sdf_lms';

async function fixEnrollments() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const Class = require('../models/Class');
    // Reset Snestron and any falsely completed courses
    const snestron = await Course.findOne({ title: /snestron/i });
    if (snestron) {
      const res = await Enrollment.updateMany(
        { course: snestron._id },
        { 
          $set: { 
            completed: false, 
            certificateId: null, 
            completionDate: null, 
            progress: 0 
          } 
        }
      );
      console.log('Reset Snestron enrollments:', res.modifiedCount);

      const classRes = await Class.updateMany(
        { courseId: snestron._id },
        {
          $set: {
            isRescheduled: true,
            originalTime: '11:35',
            originalDate: '2026-09-12'
          }
        }
      );
      console.log('Updated Snestron classes isRescheduled:', classRes.modifiedCount);
    }

    console.log('Database cleanup completed successfully.');
  } catch (err) {
    console.error('Error during cleanup:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

fixEnrollments();
