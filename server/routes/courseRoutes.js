const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const Course = require('../models/Course');
const upload = require('../middleware/upload');

const router = express.Router();

// Get all courses (admin)
router.get('/', protect, admin, async (req, res) => {
  try {
    const courses = await Course.find().sort('-createdAt');
    res.json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// Get enrollments for a specific course (admin)
router.get('/:id/enrollments', protect, admin, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const Enrollment = require('../models/Enrollment');
    const enrollments = await Enrollment.find({ course: req.params.id })
      .sort('-createdAt');
    res.json({ success: true, data: enrollments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// Get all courses (public)
router.get('/public', async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true }).sort('-createdAt');
    res.json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// Get single course (public)
router.get('/public/:slugOrId', async (req, res) => {
  try {
    const { slugOrId } = req.params;
    let course;
    
    // Check if it's a valid ObjectId
    const mongoose = require('mongoose');
    if (mongoose.isValidObjectId(slugOrId)) {
      course = await Course.findById(slugOrId);
    }
    
    // If not found by ID, try finding by slug
    if (!course) {
      course = await Course.findOne({ slug: slugOrId });
    }

    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// Create new course
router.post('/', protect, admin, upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'content', maxCount: 1 }]), async (req, res) => {
  try {
    const { title, description, category, duration, level, language } = req.body;
    let whatYouWillLearn = [];
    if (req.body.whatYouWillLearn) {
      try {
        whatYouWillLearn = JSON.parse(req.body.whatYouWillLearn);
      } catch (e) {
        whatYouWillLearn = [];
      }
    }
    
    let thumbnailUrl = '';
    let contentUrl = '';

    if (req.files) {
      if (req.files.thumbnail) thumbnailUrl = req.files.thumbnail[0].path;
      if (req.files.content) contentUrl = req.files.content[0].path;
    }
    
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const course = await Course.create({
      title, slug, description, category, duration, level, language, whatYouWillLearn,
      thumbnailUrl, contentUrl
    });

    res.status(201).json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating course', error: error.message });
  }
});

// Update course
router.put('/:id', protect, admin, upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'content', maxCount: 1 }]), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const { title, description, category, duration, level, language } = req.body;
    
    let whatYouWillLearn = course.whatYouWillLearn;
    if (req.body.whatYouWillLearn) {
      try {
        whatYouWillLearn = JSON.parse(req.body.whatYouWillLearn);
      } catch (e) {}
    }

    let slug = course.slug;
    if (title && title !== course.title) {
      slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    let updateData = { title, slug, description, category, duration, level, language, whatYouWillLearn };

    if (req.files) {
      if (req.files.thumbnail) updateData.thumbnailUrl = req.files.thumbnail[0].path;
      if (req.files.content) updateData.contentUrl = req.files.content[0].path;
    }

    const updatedCourse = await Course.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ success: true, data: updatedCourse });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating course', error: error.message });
  }
});

// Delete course
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    
    await course.deleteOne();
    res.json({ success: true, message: 'Course removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting course', error: error.message });
  }
});

module.exports = router;
