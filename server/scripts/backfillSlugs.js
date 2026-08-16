const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Course = require('../models/Course');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const backfillSlugs = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    const courses = await Course.find();
    console.log(`Found ${courses.length} courses to update.`);

    for (const course of courses) {
      if (!course.slug) {
        course.slug = course.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');
        
        await course.save();
        console.log(`Updated course ${course._id} with slug: ${course.slug}`);
      } else {
        console.log(`Course ${course._id} already has slug: ${course.slug}`);
      }
    }

    console.log('Slug backfill complete.');
    process.exit(0);
  } catch (error) {
    console.error('Error backfilling slugs:', error);
    process.exit(1);
  }
};

backfillSlugs();
