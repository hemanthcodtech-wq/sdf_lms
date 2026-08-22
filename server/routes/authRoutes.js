const express = require('express');
const { 
  registerUser, 
  sendRegisterOtp,
  verifyRegisterOtp,
  loginUser, 
  getUserProfile, 
  updateUserProfile, 
  googleLogin, 
  getWishlist, 
  toggleWishlist,
  forgotPassword,
  verifyOtp,
  resetPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/register-send-otp', sendRegisterOtp);
router.post('/register-verify-otp', verifyRegisterOtp);
router.post('/login', loginUser);
router.post('/google', googleLogin);

// Forgot Password Flow
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

router.get('/wishlist', protect, getWishlist);
router.post('/wishlist/toggle/:courseId', protect, toggleWishlist);

module.exports = router;
