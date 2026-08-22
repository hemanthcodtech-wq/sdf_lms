const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const OtpVerification = require('../models/OtpVerification');
const { sendRegistrationOtpEmail } = require('../utils/emailService');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '2d',
  });
};

// 1. Send 6-Digit Email Verification Code for Registration
exports.sendRegisterOtp = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and Password are required' });
    }

    const emailClean = email.trim().toLowerCase();
    const phoneClean = (phone || '').trim();

    // Check if user already exists with this email or phone
    const existingUser = await User.findOne({
      $or: [
        { email: emailClean },
        { emailOrPhone: emailClean },
        ...(phoneClean ? [{ phone: phoneClean }, { emailOrPhone: phoneClean }] : [])
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email or phone number already exists. Please login.'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any existing pending registrations for this email
    await OtpVerification.deleteMany({ email: emailClean });

    // Store pending registration with OTP (auto-expires in 10 mins)
    await OtpVerification.create({
      email: emailClean,
      otp,
      name: (name || '').trim(),
      phone: phoneClean,
      password,
    });

    // Send verification email
    await sendRegistrationOtpEmail({
      to: emailClean,
      name: (name || '').trim(),
      otp
    });

    res.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${emailClean}. Please verify to complete your registration.`
    });
  } catch (error) {
    console.error('Error sending registration OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to send verification code. Please check your email address and try again.' });
  }
};

// 2. Verify OTP & Finalize Registration
exports.verifyRegisterOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and verification code are required' });
    }

    const emailClean = email.trim().toLowerCase();
    const record = await OtpVerification.findOne({ email: emailClean, otp: otp.trim() });

    if (!record) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code. Please request a new code.' });
    }

    // Double check user doesn't already exist
    let user = await User.findOne({
      $or: [
        { email: emailClean },
        { emailOrPhone: emailClean },
        ...(record.phone ? [{ phone: record.phone }, { emailOrPhone: record.phone }] : [])
      ]
    });

    if (user) {
      await OtpVerification.deleteMany({ email: emailClean });
      return res.status(400).json({ success: false, message: 'User already registered. Please log in.' });
    }

    user = await User.create({
      name: record.name,
      email: emailClean,
      phone: record.phone,
      emailOrPhone: emailClean,
      password: record.password,
      role: 'student',
      isEmailVerified: true
    });

    // Clean up OTP record
    await OtpVerification.deleteMany({ email: emailClean });

    res.status(201).json({
      success: true,
      message: 'Account verified and registered successfully!',
      _id: user._id,
      email: user.email,
      emailOrPhone: user.emailOrPhone,
      name: user.name,
      phone: user.phone,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Error verifying registration OTP:', error);
    res.status(500).json({ success: false, message: 'Verification failed. Please try again.' });
  }
};

// 3. Fallback direct registration
exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, phone, emailOrPhone, password, role } = req.body;
    const targetEmail = (email || emailOrPhone || '').trim().toLowerCase();
    const targetPhone = (phone || '').trim();

    const userExists = await User.findOne({
      $or: [
        { email: targetEmail },
        { emailOrPhone: targetEmail },
        ...(targetPhone ? [{ phone: targetPhone }, { emailOrPhone: targetPhone }] : [])
      ]
    });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({
      name: (name || '').trim(),
      email: targetEmail,
      phone: targetPhone,
      emailOrPhone: targetEmail || targetPhone,
      password,
      role: role || 'student',
      isEmailVerified: true
    });

    if (user) {
      res.status(201).json({
        success: true,
        _id: user._id,
        email: user.email,
        emailOrPhone: user.emailOrPhone,
        name: user.name,
        phone: user.phone,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    next(error);
  }
};

// 4. Enhanced Login supporting either Phone or Email + Password
exports.loginUser = async (req, res, next) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      return res.status(400).json({ success: false, message: 'Email/Phone and Password are required' });
    }

    const identifier = emailOrPhone.trim();

    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { phone: identifier },
        { emailOrPhone: identifier.toLowerCase() },
        { emailOrPhone: identifier }
      ]
    });

    if (user && (await user.comparePassword(password))) {
      if (user.status === 'inactive') {
        return res.status(403).json({ 
          success: false, 
          message: 'Account is currently inactive. Please contact the administrator.' 
        });
      }

      res.json({
        success: true,
        _id: user._id,
        email: user.email || user.emailOrPhone,
        emailOrPhone: user.emailOrPhone,
        name: user.name,
        phone: user.phone,
        speciality: user.speciality,
        experience: user.experience,
        bio: user.bio,
        avatar: user.avatar,
        role: user.role,
        status: user.status || 'active',
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials. Please check your email or phone number and password.' });
    }
  } catch (error) {
    next(error);
  }
};

exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.json({ success: true, data: user });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    next(error);
  }
};

exports.updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.firstName = req.body.firstName || user.firstName;
      user.lastName = req.body.lastName || user.lastName;
      user.emailOrPhone = req.body.emailOrPhone || user.emailOrPhone;
      
      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        success: true,
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        emailOrPhone: updatedUser.emailOrPhone,
        role: updatedUser.role,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    next(error);
  }
};

exports.googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: 'No Google credential provided' });
    }

    // Verify the Google ID token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Find or create user
    let user = await User.findOne({ $or: [{ googleId }, { emailOrPhone: email }] });

    if (user) {
      // Update googleId if not set
      if (!user.googleId) {
        user.googleId = googleId;
        user.avatar = picture || user.avatar;
        user.name = name || user.name;
        await user.save();
      }
    } else {
      // Create new user with Google
      user = await User.create({
        emailOrPhone: email,
        googleId,
        name,
        avatar: picture,
        role: 'student',
      });
    }

    res.json({
      success: true,
      _id: user._id,
      emailOrPhone: user.emailOrPhone,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

exports.getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user.wishlist || [] });
  } catch (error) {
    next(error);
  }
};

exports.toggleWishlist = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.wishlist) {
      user.wishlist = [];
    }

    const index = user.wishlist.indexOf(courseId);
    let isWishlisted = false;

    if (index > -1) {
      user.wishlist.splice(index, 1);
      isWishlisted = false;
    } else {
      user.wishlist.push(courseId);
      isWishlisted = true;
    }

    await user.save();
    const populatedUser = await User.findById(req.user._id).populate('wishlist');

    res.json({
      success: true,
      isWishlisted,
      data: populatedUser.wishlist
    });
  } catch (error) {
    next(error);
  }
};

const { sendForgotPasswordOtpEmail } = require('../utils/emailService');

exports.forgotPassword = async (req, res, next) => {
  try {
    const { emailOrPhone } = req.body;
    if (!emailOrPhone) {
      return res.status(400).json({ success: false, message: 'Please provide your registered email or phone' });
    }

    const user = await User.findOne({ emailOrPhone: emailOrPhone.trim() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No registered account found with this email' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    // Determine origin and role-specific direct reset link
    const rawOrigin = req.headers.origin || process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    const clientOrigin = rawOrigin.replace(/\/$/, '');
    let resetLink = `${clientOrigin}/forgot-password?email=${encodeURIComponent(user.emailOrPhone)}`;
    if (user.role === 'instructor') {
      resetLink = `${clientOrigin}/instructor/login?forgot=true&email=${encodeURIComponent(user.emailOrPhone)}`;
    } else if (user.role === 'moderator') {
      resetLink = `${clientOrigin}/moderator/login?forgot=true&email=${encodeURIComponent(user.emailOrPhone)}`;
    } else if (user.role === 'admin') {
      resetLink = `${clientOrigin}/admin/login?forgot=true&email=${encodeURIComponent(user.emailOrPhone)}`;
    }

    // Send Email with OTP and reset link
    await sendForgotPasswordOtpEmail({ 
      to: user.emailOrPhone, 
      name: user.name || user.firstName || 'User',
      otp, 
      resetLink,
      role: user.role || 'student'
    });

    res.json({
      success: true,
      message: 'A 6-digit verification code and reset link have been sent to your email.'
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    const { emailOrPhone, otp } = req.body;
    if (!emailOrPhone || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const user = await User.findOne({
      emailOrPhone: emailOrPhone.trim(),
      resetPasswordOtp: otp.trim(),
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code' });
    }

    res.json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { emailOrPhone, otp, newPassword } = req.body;
    if (!emailOrPhone || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({
      emailOrPhone: emailOrPhone.trim(),
      resetPasswordOtp: otp.trim(),
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code' });
    }

    user.password = newPassword;
    user.resetPasswordOtp = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully! You can now log in.'
    });
  } catch (error) {
    next(error);
  }
};

