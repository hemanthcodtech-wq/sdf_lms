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

    // Check if user already exists with this email address (do not block on phone collisions)
    const existingUser = await User.findOne({
      $or: [
        { email: emailClean },
        { emailOrPhone: emailClean }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please sign in with your email and password.'
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

    // Double check user doesn't already exist with this email
    let user = await User.findOne({
      $or: [
        { email: emailClean },
        { emailOrPhone: emailClean }
      ]
    });

    if (user) {
      await OtpVerification.deleteMany({ email: emailClean });
      return res.status(400).json({ success: false, message: 'An account with this email is already registered. Please log in.' });
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
        { emailOrPhone: targetEmail }
      ]
    });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'An account with this email address already exists. Please log in.' });
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

    if (!user) {
      return res.status(404).json({
        success: false,
        notRegistered: true,
        message: 'Account not found. Please sign up first to create an account.'
      });
    }

    if (await user.comparePassword(password)) {
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
      res.status(401).json({
        success: false,
        message: 'Incorrect password. Please check your password or reset it.'
      });
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

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Determine final name
    let updatedName = req.body.name ? req.body.name.trim() : null;
    if (!updatedName && (req.body.firstName || req.body.lastName)) {
      updatedName = `${req.body.firstName || ''} ${req.body.lastName || ''}`.trim();
    }
    if (updatedName) {
      user.name = updatedName;
    }

    if (req.body.firstName !== undefined) user.firstName = req.body.firstName.trim();
    if (req.body.lastName !== undefined) user.lastName = req.body.lastName.trim();
    if (req.body.email) user.email = req.body.email.trim();
    if (req.body.emailOrPhone) user.emailOrPhone = req.body.emailOrPhone.trim();
    if (req.body.phone) user.phone = req.body.phone.trim();
    if (req.body.avatar) user.avatar = req.body.avatar;
    
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    // Cascading sync: Update studentName in all Enrollment records belonging to this user
    const finalName = updatedUser.name || `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim();
    if (finalName) {
      try {
        const Enrollment = require('../models/Enrollment');
        const Course = require('../models/Course');
        const { generateCertificatePDF } = require('../utils/pdfGenerator');
        const { uploadBufferToCloudinary } = require('../utils/cloudinary');

        const userIdentifiers = [
          updatedUser.email,
          updatedUser.emailOrPhone,
          updatedUser.phone,
          req.user.email,
          req.user.emailOrPhone,
          req.user.phone
        ].filter(Boolean);

        // 1. Update studentName in all enrollments for this user
        await Enrollment.updateMany(
          {
            $or: [
              { user: updatedUser._id },
              { studentEmail: { $in: userIdentifiers } }
            ]
          },
          {
            $set: {
              studentName: finalName
            }
          }
        );

        // 2. For completed enrollments, re-generate the certificate with the updated legal name
        const completedEnrollments = await Enrollment.find({
          $or: [
            { user: updatedUser._id },
            { studentEmail: { $in: userIdentifiers } }
          ],
          completed: true
        }).populate('course');

        for (const enr of completedEnrollments) {
          try {
            const courseObj = enr.course || await Course.findById(enr.course);
            const certId = enr.certificateId || `SDF-CERT-${enr._id.toString().slice(-6).toUpperCase()}`;
            const compDate = enr.completionDate || enr.updatedAt || new Date();
            const studentId = updatedUser.studentId || `SDWFY${updatedUser._id.toString().slice(-6).toUpperCase()}`;

            let instructorName = courseObj?.instructor || courseObj?.instructorId?.name;
            if (!instructorName && courseObj?.instructorId) {
              const instUser = await User.findById(courseObj.instructorId).select('name');
              if (instUser?.name) instructorName = instUser.name;
            }
            instructorName = instructorName || 'Course Instructor';

            const courseDuration = courseObj?.duration || (courseObj?.durationDays && courseObj?.durationHours ? `${courseObj.durationDays} (${courseObj.durationHours})` : (courseObj?.sessionDates?.length ? `${courseObj.sessionDates.length} Days (${courseObj.sessionDates.length} Hours)` : '30 Days (20 Hours)'));

            const certPdfBuffer = await generateCertificatePDF({
              studentName: finalName,
              studentId,
              courseTitle: courseObj?.title || 'Yoga & Vedic Sciences',
              category: courseObj?.category || 'Yoga & Vedic Sciences',
              level: courseObj?.level || 'All Levels',
              duration: courseDuration,
              instructorName,
              completionDate: new Date(compDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
              certificateId: certId
            });

            // If Cloudinary upload is configured, upload new PDF buffer to overwrite
            try {
              const cloudUrl = await uploadBufferToCloudinary(certPdfBuffer, certId, 'sdf_certificates');
              if (cloudUrl) {
                enr.certificateUrl = cloudUrl;
              }
            } catch (cErr) {
              // Ignore Cloudinary error, enrollment studentName is still updated
            }

            enr.studentName = finalName;
            await enr.save();
          } catch (certErr) {
            console.error('[Certificate Sync] Notice:', certErr.message);
          }
        }
      } catch (syncErr) {
        console.error('[Profile Update Sync Error]:', syncErr);
      }
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      _id: updatedUser._id,
      name: updatedUser.name,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email || updatedUser.emailOrPhone,
      emailOrPhone: updatedUser.emailOrPhone,
      phone: updatedUser.phone,
      avatar: updatedUser.avatar,
      role: updatedUser.role,
      token: generateToken(updatedUser._id),
    });
  } catch (error) {
    next(error);
  }
};

exports.uploadUserAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    user.avatar = avatarUrl;
    await user.save();

    res.json({
      success: true,
      message: 'Profile image updated successfully',
      avatar: avatarUrl,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email || user.emailOrPhone,
        emailOrPhone: user.emailOrPhone,
        phone: user.phone,
        avatar: avatarUrl,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.googleLogin = async (req, res, next) => {
  try {
    const { credential, idToken, accessToken, email: rawEmail, name: rawName, avatar: rawAvatar, googleId: rawGoogleId } = req.body;
    
    let googleId = rawGoogleId;
    let email = rawEmail;
    let name = rawName;
    let picture = rawAvatar;

    const tokenToVerify = credential || idToken;

    if (tokenToVerify) {
      try {
        const allowedAudiences = [
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_ANDROID_CLIENT_ID,
          '473693349273-r3lct54ccv5pfeppqkes57odmni6nvh4.apps.googleusercontent.com',
          '473693349273-oq1v2nk0kfpifpel0nhmji8sbuqgu8v3.apps.googleusercontent.com'
        ].filter(Boolean);

        const ticket = await client.verifyIdToken({
          idToken: tokenToVerify,
          audience: allowedAudiences,
        });

        const payload = ticket.getPayload();
        googleId = payload.sub || googleId;
        email = payload.email || email;
        name = payload.name || name;
        picture = payload.picture || picture;
      } catch (verifyError) {
        console.error('[GoogleAuth] verifyIdToken check failed, attempting tokeninfo verification:', verifyError.message);
        try {
          const axios = require('axios');
          const tokenInfoRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${tokenToVerify}`);
          if (tokenInfoRes.data?.email) {
            googleId = tokenInfoRes.data.sub || googleId;
            email = tokenInfoRes.data.email || email;
            name = tokenInfoRes.data.name || name;
            picture = tokenInfoRes.data.picture || picture;
          }
        } catch (tErr) {
          console.error('[GoogleAuth] tokeninfo verification failed:', tErr.message);
        }
      }
    } else if (accessToken) {
      try {
        const axios = require('axios');
        const userInfoRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (userInfoRes.data?.email) {
          googleId = userInfoRes.data.sub || googleId;
          email = userInfoRes.data.email || email;
          name = userInfoRes.data.name || name;
          picture = userInfoRes.data.picture || picture;
        }
      } catch (uErr) {
        console.error('[GoogleAuth] accessToken fetch failed:', uErr.message);
      }
    }

    // Fallbacks from raw values if passed directly from client
    if (!email && rawEmail) email = rawEmail;
    if (!name && rawName) name = rawName;
    if (!googleId && rawGoogleId) googleId = rawGoogleId;
    if (!picture && rawAvatar) picture = rawAvatar;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Google account email could not be verified' });
    }

    const emailClean = email.trim().toLowerCase();
    const emailEscaped = emailClean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const emailRegex = new RegExp(`^${emailEscaped}$`, 'i');

    // Find existing user by googleId, email, or emailOrPhone (exact or case-insensitive)
    let user = await User.findOne({ 
      $or: [
        ...(googleId ? [{ googleId }] : []), 
        { email: emailClean }, 
        { email: emailRegex },
        { emailOrPhone: emailClean },
        { emailOrPhone: emailRegex }
      ] 
    });

    if (user) {
      // User found! (Existing registered user with credentials or Google)
      let changed = false;
      if (googleId && user.googleId !== googleId) {
        user.googleId = googleId;
        changed = true;
      }
      if (!user.email) {
        user.email = emailClean;
        changed = true;
      }
      if (picture && (!user.avatar || user.avatar.includes('unsplash'))) {
        user.avatar = picture;
        changed = true;
      }
      if (!user.name && name) {
        user.name = name.trim();
        changed = true;
      }
      if (changed) await user.save();
    } else {
      // Create new user account seamlessly so sign-in with google always succeeds
      user = await User.create({
        email: emailClean,
        emailOrPhone: emailClean,
        googleId,
        name: (name || 'Student').trim(),
        avatar: picture || '',
        role: 'student',
        isEmailVerified: true,
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      _id: user._id,
      email: user.email || user.emailOrPhone,
      emailOrPhone: user.emailOrPhone,
      name: user.name || (user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Student'),
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      avatar: user.avatar || '',
      role: user.role || 'student',
      token,
    });
  } catch (error) {
    console.error('[GoogleAuth] Error:', error);
    res.status(500).json({ success: false, message: 'Google Sign-In failed: ' + error.message });
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

    const cleanIdentifier = emailOrPhone.trim().toLowerCase();
    const user = await User.findOne({
      $or: [
        { email: cleanIdentifier },
        { emailOrPhone: cleanIdentifier },
        { phone: emailOrPhone.trim() },
        { emailOrPhone: emailOrPhone.trim() }
      ]
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        notRegistered: true,
        message: 'Account not found. Please sign up first to create an account.'
      });
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

