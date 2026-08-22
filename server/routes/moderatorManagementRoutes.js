const express = require('express');
const crypto = require('crypto');
const { protect, admin } = require('../middleware/authMiddleware');
const User = require('../models/User');
const { sendModeratorCredentialsEmail } = require('../utils/emailService');

const router = express.Router();

// Helper to generate a random readable password
const generateRandomPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// GET /api/admin/moderators - Get all moderators
router.get('/', protect, admin, async (req, res) => {
  try {
    const moderators = await User.find({ role: 'moderator' })
      .select('-password')
      .sort('-createdAt');

    res.json({ success: true, data: moderators });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching moderators', error: error.message });
  }
});

// POST /api/admin/moderators - Create a new moderator and email credentials
router.post('/', protect, admin, async (req, res) => {
  try {
    const { name, email, phone, bio, customPassword, sendEmail = true } = req.body;

    if (!email || !name) {
      return res.status(400).json({ success: false, message: 'Name and Email are required fields' });
    }

    const emailClean = email.trim().toLowerCase();
    const existingUser = await User.findOne({ emailOrPhone: emailClean });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: `A user or moderator with email "${emailClean}" already exists.` 
      });
    }

    const plainPassword = customPassword && customPassword.trim().length >= 6 
      ? customPassword.trim() 
      : generateRandomPassword();

    const moderator = new User({
      emailOrPhone: emailClean,
      name: name.trim(),
      phone: phone ? phone.trim() : '',
      bio: bio ? bio.trim() : '',
      role: 'moderator',
      status: 'active',
      password: plainPassword
    });

    await moderator.save();

    // Send credentials email
    let emailSent = false;
    if (sendEmail) {
      const rawOrigin = req.headers.origin || process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
      const clientOrigin = rawOrigin.replace(/\/$/, '');
      const loginUrl = `${clientOrigin}/moderator/login`;

      const emailRes = await sendModeratorCredentialsEmail({
        to: emailClean,
        name: moderator.name,
        email: emailClean,
        password: plainPassword,
        loginUrl
      });
      emailSent = emailRes.success;
    }

    const responseData = moderator.toObject();
    delete responseData.password;

    res.status(201).json({
      success: true,
      message: `Moderator ${moderator.name} registered successfully! ${sendEmail ? (emailSent ? 'Credentials sent via email.' : 'Account created (Email delivery fallback recorded).') : ''}`,
      data: responseData,
      generatedPassword: plainPassword,
      emailSent
    });
  } catch (error) {
    console.error('Error creating moderator:', error);
    res.status(500).json({ success: false, message: 'Server error creating moderator', error: error.message });
  }
});

// PUT /api/admin/moderators/:id - Update moderator details
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const { name, phone, bio, status, newPassword } = req.body;

    const moderator = await User.findOne({ _id: req.params.id, role: 'moderator' });
    if (!moderator) {
      return res.status(404).json({ success: false, message: 'Moderator not found' });
    }

    if (name) moderator.name = name.trim();
    if (phone !== undefined) moderator.phone = phone.trim();
    if (bio !== undefined) moderator.bio = bio.trim();
    if (status) moderator.status = status;
    if (newPassword && newPassword.trim().length >= 6) {
      moderator.password = newPassword.trim();
    }

    await moderator.save();

    const responseData = moderator.toObject();
    delete responseData.password;

    res.json({
      success: true,
      message: 'Moderator profile updated successfully',
      data: responseData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating moderator', error: error.message });
  }
});

// DELETE /api/admin/moderators/:id - Delete a moderator
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const moderator = await User.findOneAndDelete({ _id: req.params.id, role: 'moderator' });
    if (!moderator) {
      return res.status(404).json({ success: false, message: 'Moderator not found' });
    }

    res.json({ success: true, message: `Moderator ${moderator.name || moderator.emailOrPhone} has been removed` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting moderator', error: error.message });
  }
});

// POST /api/admin/moderators/:id/resend-credentials - Reset/Resend credentials to moderator email
router.post('/:id/resend-credentials', protect, admin, async (req, res) => {
  try {
    const moderator = await User.findOne({ _id: req.params.id, role: 'moderator' });
    if (!moderator) {
      return res.status(404).json({ success: false, message: 'Moderator not found' });
    }

    // Generate new password
    const newPassword = generateRandomPassword();
    moderator.password = newPassword;
    await moderator.save();

    const rawOrigin = req.headers.origin || process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    const clientOrigin = rawOrigin.replace(/\/$/, '');
    const loginUrl = `${clientOrigin}/moderator/login`;

    const emailRes = await sendModeratorCredentialsEmail({
      to: moderator.emailOrPhone,
      name: moderator.name,
      email: moderator.emailOrPhone,
      password: newPassword,
      loginUrl
    });

    res.json({
      success: true,
      message: `New credentials sent to ${moderator.emailOrPhone}`,
      generatedPassword: newPassword,
      emailSent: emailRes.success
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error resending credentials', error: error.message });
  }
});

module.exports = router;
