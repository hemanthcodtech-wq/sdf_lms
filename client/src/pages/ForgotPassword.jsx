import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaKey, FaShieldAlt, FaEye, FaEyeSlash, FaCheckCircle, FaEnvelope } from 'react-icons/fa';
import axios from 'axios';
import { motion } from 'framer-motion';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Enter Email, 2: Enter OTP & New Password, 3: Success
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!emailOrPhone) {
      return setError('Please enter your registered email address.');
    }
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/forgot-password`, {
        emailOrPhone: emailOrPhone.trim()
      });

      if (res.data.success) {
        setMessage(res.data.message || 'Verification code sent to your email.');
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset Password with OTP
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      return setError('Please enter the 6-digit OTP sent to your email.');
    }
    if (newPassword.length < 6) {
      return setError('Password must be at least 6 characters long.');
    }
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/reset-password`, {
        emailOrPhone: emailOrPhone.trim(),
        otp: otp.trim(),
        newPassword
      });

      if (res.data.success) {
        setStep(3);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] font-inter flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        
        {/* Back Link */}
        <Link 
          to="/login" 
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-brand-green transition-colors mb-6"
        >
          <FaArrowLeft size={12} />
          <span>Back to Sign In</span>
        </Link>

        {/* Card Container */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-2xl rounded-3xl p-8 md:p-10 border border-white shadow-[0_12px_40px_rgba(0,0,0,0.06)]"
        >
          {/* Top Logo / Icon */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-brand-green/10 flex items-center justify-center text-brand-green mb-3">
              <FaKey size={22} />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight text-center">
              {step === 1 && 'Reset Password'}
              {step === 2 && 'Enter Verification Code'}
              {step === 3 && 'Password Reset Complete!'}
            </h1>
            <p className="text-xs text-gray-500 text-center mt-1">
              {step === 1 && 'Enter your registered email to receive a 6-digit OTP code.'}
              {step === 2 && `Enter the code sent to ${emailOrPhone} and choose a new password.`}
              {step === 3 && 'Your password has been successfully updated.'}
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs text-center font-medium">
              {error}
            </div>
          )}

          {message && step === 2 && (
            <div className="mb-5 p-3.5 bg-green-50 border border-green-200 text-green-800 rounded-xl text-xs text-center font-medium">
              {message}
            </div>
          )}

          {/* STEP 1: Enter Email */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Registered Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full px-4 py-3.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm text-gray-800 focus:bg-white focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all outline-none"
                  />
                  <FaEnvelope className="absolute right-4 top-4 text-gray-400" size={14} />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-brand-green hover:bg-brand-green-dark text-white text-sm font-bold rounded-xl shadow-md shadow-brand-green/20 hover:shadow-brand-green/40 transition-all duration-300 disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <span>Send Reset OTP Code</span>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Enter OTP & New Password */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl text-center text-xl font-mono tracking-widest font-black text-brand-green-dark focus:bg-white focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl text-sm text-gray-800 focus:bg-white focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl text-sm text-gray-800 focus:bg-white focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all outline-none"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-gray-500 hover:underline"
                >
                  Resend Code
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-brand-green hover:bg-brand-green-dark text-white text-sm font-bold rounded-xl shadow-md shadow-brand-green/20 hover:shadow-brand-green/40 transition-all duration-300 disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <span>Reset & Save Password</span>
                )}
              </button>
            </form>
          )}

          {/* STEP 3: Success Screen */}
          {step === 3 && (
            <div className="text-center space-y-5 py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-brand-green">
                <FaCheckCircle size={32} />
              </div>
              <p className="text-sm text-gray-600">
                Your account password has been updated securely. You can now log in with your new credentials.
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full py-3.5 bg-brand-green hover:bg-brand-green-dark text-white text-sm font-bold rounded-xl shadow-md transition-all duration-300"
              >
                Sign In Now →
              </button>
            </div>
          )}

          {/* Security badge */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-400">
            <FaShieldAlt className="text-brand-green" /> 256-bit Encrypted Account Recovery
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default ForgotPassword;
