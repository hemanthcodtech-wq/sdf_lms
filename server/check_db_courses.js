const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Course = require('./models/Course');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sdf_lms';

async function checkCourses() {
  await mongoose.connect(MONGO_URI);
  const courses = await Course.find().populate('instructorId');
  console.log(`Found ${courses.length} courses in database:`);
  courses.forEach(c => {
    console.log(`- ${c.title} (Published: ${c.isPublished}, Instructor: ${c.instructorId?.name || c.instructor || 'None'}, ID: ${c._id})`);
  });
  process.exit(0);
}

checkCourses();
