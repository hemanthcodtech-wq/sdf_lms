const express = require('express');
const crypto = require('crypto');
const { protect, admin } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Course = require('../models/Course');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const { sendInstructorCredentialsEmail } = require('../utils/emailService');

const router = express.Router();

// Helper to generate a random readable password if none provided
const generateRandomPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// GET /api/admin/instructors - Get all instructors with assigned courses/classes count
router.get('/', protect, admin, async (req, res) => {
  try {
    const instructors = await User.find({ role: 'instructor' })
      .select('-password')
      .populate('assignedCourses', 'title category level')
      .sort('-createdAt');

    // Fetch classes taught or mapped to instructor
    const classes = await Class.find().select('instructor courseId');

    const instructorsWithStats = instructors.map(inst => {
      const instructorObj = inst.toObject();
      const mappedClasses = classes.filter(c => c.instructor && c.instructor.toLowerCase() === inst.name?.toLowerCase());
      return {
        ...instructorObj,
        totalClassesCount: mappedClasses.length
      };
    });

    res.json({ success: true, data: instructorsWithStats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching instructors', error: error.message });
  }
});

// POST /api/admin/instructors - Create a new instructor and email credentials
router.post('/', protect, admin, async (req, res) => {
  try {
    const { name, email, phone, speciality, experience, bio, customPassword, assignedCourses, sendEmail = true } = req.body;

    if (!email || !name) {
      return res.status(400).json({ success: false, message: 'Name and Email are required fields' });
    }

    const emailClean = email.trim().toLowerCase();
    const existingUser = await User.findOne({ emailOrPhone: emailClean });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: `A user or instructor with email "${emailClean}" already exists.` 
      });
    }

    const plainPassword = customPassword && customPassword.trim().length >= 6 
      ? customPassword.trim() 
      : generateRandomPassword();

    const instructor = new User({
      emailOrPhone: emailClean,
      name: name.trim(),
      phone: phone ? phone.trim() : '',
      speciality: speciality ? speciality.trim() : 'Yoga & Wellness Expert',
      experience: experience ? experience.trim() : '5+ Years',
      bio: bio ? bio.trim() : '',
      role: 'instructor',
      status: 'active',
      password: plainPassword,
      assignedCourses: assignedCourses || []
    });

    await instructor.save();

    // Send credentials email
    let emailSent = false;
    if (sendEmail) {
      const rawOrigin = req.headers.origin || process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
      const clientOrigin = rawOrigin.replace(/\/$/, '');
      const loginUrl = `${clientOrigin}/instructor/login`;

      const emailRes = await sendInstructorCredentialsEmail({
        to: emailClean,
        name: instructor.name,
        email: emailClean,
        password: plainPassword,
        speciality: instructor.speciality,
        experience: instructor.experience,
        loginUrl
      });
      emailSent = emailRes.success;
    }

    const responseData = instructor.toObject();
    delete responseData.password;

    res.status(201).json({
      success: true,
      message: `Instructor ${instructor.name} registered successfully! ${sendEmail ? (emailSent ? 'Credentials sent via email.' : 'Account created (Email delivery fallback recorded).') : ''}`,
      data: responseData,
      generatedPassword: plainPassword,
      emailSent
    });
  } catch (error) {
    console.error('Error creating instructor:', error);
    res.status(500).json({ success: false, message: 'Server error creating instructor', error: error.message });
  }
});

// PUT /api/admin/instructors/:id - Update instructor details
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const { name, phone, speciality, experience, bio, status, assignedCourses, newPassword } = req.body;

    const instructor = await User.findOne({ _id: req.params.id, role: 'instructor' });
    if (!instructor) {
      return res.status(404).json({ success: false, message: 'Instructor not found' });
    }

    if (name) instructor.name = name.trim();
    if (phone !== undefined) instructor.phone = phone.trim();
    if (speciality !== undefined) instructor.speciality = speciality.trim();
    if (experience !== undefined) instructor.experience = experience.trim();
    if (bio !== undefined) instructor.bio = bio.trim();
    if (status) instructor.status = status;
    if (assignedCourses) instructor.assignedCourses = assignedCourses;
    if (newPassword && newPassword.trim().length >= 6) {
      instructor.password = newPassword.trim();
    }

    await instructor.save();

    const responseData = instructor.toObject();
    delete responseData.password;

    res.json({
      success: true,
      message: 'Instructor profile updated successfully',
      data: responseData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating instructor', error: error.message });
  }
});

// DELETE /api/admin/instructors/:id - Delete an instructor
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const instructor = await User.findOneAndDelete({ _id: req.params.id, role: 'instructor' });
    if (!instructor) {
      return res.status(404).json({ success: false, message: 'Instructor not found' });
    }

    res.json({ success: true, message: `Instructor ${instructor.name || instructor.emailOrPhone} has been removed` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting instructor', error: error.message });
  }
});

// POST /api/admin/instructors/:id/resend-credentials - Reset/Resend credentials to instructor email
router.post('/:id/resend-credentials', protect, admin, async (req, res) => {
  try {
    const instructor = await User.findOne({ _id: req.params.id, role: 'instructor' });
    if (!instructor) {
      return res.status(404).json({ success: false, message: 'Instructor not found' });
    }

    // Generate new password
    const newPassword = generateRandomPassword();
    instructor.password = newPassword;
    await instructor.save();

    const rawOrigin = req.headers.origin || process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    const clientOrigin = rawOrigin.replace(/\/$/, '');
    const loginUrl = `${clientOrigin}/instructor/login`;

    const emailRes = await sendInstructorCredentialsEmail({
      to: instructor.emailOrPhone,
      name: instructor.name,
      email: instructor.emailOrPhone,
      password: newPassword,
      speciality: instructor.speciality,
      experience: instructor.experience,
      loginUrl
    });

    res.json({
      success: true,
      message: `New credentials sent to ${instructor.emailOrPhone}`,
      generatedPassword: newPassword,
      emailSent: emailRes.success
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error resending credentials', error: error.message });
  }
});

module.exports = router;
