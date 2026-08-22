import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  FaShieldAlt, FaLock, FaEnvelope, FaEye, FaEyeSlash, 
  FaArrowLeft, FaUserShield, FaCheckCircle, FaKey, FaTimes
} from 'react-icons/fa';

const ModeratorLogin = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot / Reset Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP + New Password, 3: Success
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');

  // Auto-open forgot password if query params present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('forgot') === 'true') {
      const emailParam = params.get('email') || '';
      setForgotEmail(emailParam);
      setIsForgotModalOpen(true);
      setForgotStep(1);
    }
  }, [location]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
        emailOrPhone: formData.email.trim(),
        password: formData.password
      });

      if (response.data.success) {
        if (response.data.role !== 'moderator' && response.data.role !== 'admin') {
          setError('Access Denied: You must have an active Moderator account to access this portal.');
          setIsLoading(false);
          return;
        }

        localStorage.setItem('moderatorToken', response.data.token);
        localStorage.setItem('moderatorUser', JSON.stringify({
          _id: response.data._id,
          name: response.data.name,
          email: response.data.emailOrPhone,
          role: response.data.role,
          phone: response.data.phone
        }));

        navigate('/moderator/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenForgotModal = () => {
    setForgotStep(1);
    setForgotEmail(formData.email || '');
    setForgotOtp('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotError('');
    setForgotMessage('');
    setIsForgotModalOpen(true);
  };

  // Step 1: Send OTP
  const handleSendResetOtp = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      return setForgotError('Please enter your moderator email address.');
    }
    setForgotError('');
    setForgotLoading(true);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/forgot-password`, {
        emailOrPhone: forgotEmail.trim()
      });

      if (res.data.success) {
        setForgotMessage(res.data.message || '6-digit verification code sent to your email.');
        setForgotStep(2);
      }
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Failed to send OTP code. Please check your email.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 2: Verify OTP & Reset Password
  const handleResetModeratorPassword = async (e) => {
    e.preventDefault();
    if (!forgotOtp || forgotOtp.trim().length < 6) {
      return setForgotError('Please enter the 6-digit OTP code sent to your email.');
    }
    if (forgotNewPassword.length < 6) {
      return setForgotError('Password must be at least 6 characters long.');
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      return setForgotError('Passwords do not match.');
    }

    setForgotError('');
    setForgotLoading(true);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/reset-password`, {
        emailOrPhone: forgotEmail.trim(),
        otp: forgotOtp.trim(),
        newPassword: forgotNewPassword
      });

      if (res.data.success) {
        setForgotStep(3);
      }
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4 md:p-8 font-inter relative overflow-hidden">
      
      {/* Ambient background glows */}
      <div className="absolute -top-32 -left-32 w-[550px] h-[550px] bg-[#0A4F2A]/12 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-[550px] h-[550px] bg-[#d97706]/10 rounded-full blur-[160px] pointer-events-none"></div>

      <div className="w-full max-w-5xl z-10">
        
        {/* Back Link */}
        <div className="mb-6 flex justify-between items-center px-2">
          <Link 
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-brand-green transition-colors bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl border border-gray-200/80 shadow-xs"
          >
            <FaArrowLeft size={11} /> Back to Main Portal
          </Link>
          <div className="flex items-center gap-2 text-[11px] font-bold text-brand-green-dark bg-brand-green/10 px-3 py-1.5 rounded-full border border-brand-green/20">
            <FaShieldAlt />
            Governance Portal
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 25, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-white/80 backdrop-blur-2xl border border-white shadow-[0_20px_70px_rgba(0,0,0,0.06)] rounded-[2.5rem] overflow-hidden grid grid-cols-1 lg:grid-cols-12"
        >
          {/* Left Branding Panel */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#06331A] via-[#0A4F2A] to-[#14532D] p-8 lg:p-12 text-white relative overflow-hidden flex flex-col justify-between">
            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-extrabold tracking-widest uppercase text-emerald-200">
                <FaShieldAlt /> Platform Operations
              </div>

              <div className="space-y-2">
                <div className="bg-white p-3 rounded-2xl inline-block shadow-md mb-2">
                  <img src="/logo.png" alt="SDF Logo" className="h-10 w-auto" />
                </div>
                <h2 className="text-xl lg:text-2xl font-black tracking-tight leading-tight">
                  MODERATOR CONSOLE
                </h2>
                <p className="text-xs text-emerald-100/80 font-medium">
                  Swamy Dwija Foundation Community Governance
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 space-y-3 text-xs text-emerald-50/90 font-medium">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-emerald-200 shrink-0">
                    <FaUserShield size={13} />
                  </div>
                  <span>Learner Oversight & Code of Conduct</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-emerald-200 shrink-0">
                    <FaCheckCircle size={13} />
                  </div>
                  <span>Classroom Etiquette & Discussion Review</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-8 mt-8 border-t border-white/10 flex items-center justify-between text-[11px] text-emerald-200/70">
              <span>Moderator v1.0</span>
              <span>SDF Trust & Safety</span>
            </div>
          </div>

          {/* Right Login Console */}
          <div className="lg:col-span-7 p-8 lg:p-12 flex flex-col justify-center relative">
            
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-green/10 text-brand-green-dark rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                Staff Authentication
              </div>
              <h1 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">Moderator Sign In</h1>
              <p className="text-gray-500 text-xs lg:text-sm mt-1">
                Enter your credentials or recover your password with OTP.
              </p>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-2xl flex items-center gap-2.5"
                >
                  <FaShieldAlt className="text-red-500 shrink-0" size={14} />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="space-y-1.5">
                <label className="block text-gray-700 text-xs font-extrabold uppercase tracking-wider">
                  Moderator Email ID
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="moderator@swamydwija.org"
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-gray-700 text-xs font-extrabold uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleOpenForgotModal}
                    className="text-xs text-brand-green font-extrabold hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-extrabold py-4 rounded-2xl shadow-lg shadow-brand-green/25 transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-2 text-sm cursor-pointer mt-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying Staff Credentials...</span>
                  </>
                ) : (
                  <>
                    <FaShieldAlt />
                    <span>Enter Moderator Console</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 font-medium">
              <span>Trust & Governance Portal</span>
              <Link to="/admin/login" className="text-gray-500 hover:text-brand-green font-bold">
                Admin Login ↗
              </Link>
            </div>

          </div>

        </motion.div>
      </div>

      {/* MODERATOR FORGOT PASSWORD MODAL */}
      <AnimatePresence>
        {isForgotModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsForgotModalOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] p-6 lg:p-8 shadow-2xl z-10"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center text-lg">
                    <FaKey />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900">
                      {forgotStep === 1 && 'Reset Moderator Password'}
                      {forgotStep === 2 && 'Verify 6-Digit OTP'}
                      {forgotStep === 3 && 'Password Reset Complete!'}
                    </h2>
                    <p className="text-xs text-gray-400">Moderator security recovery</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsForgotModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-all cursor-pointer"
                >
                  <FaTimes size={13} />
                </button>
              </div>

              {forgotError && (
                <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-2xl">
                  {forgotError}
                </div>
              )}

              {forgotMessage && forgotStep === 2 && (
                <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
                  <FaCheckCircle /> {forgotMessage}
                </div>
              )}

              {/* STEP 1: Enter Email */}
              {forgotStep === 1 && (
                <form onSubmit={handleSendResetOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                      Moderator Registered Email
                    </label>
                    <div className="relative">
                      <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="moderator@swamydwija.org"
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none"
                      />
                    </div>
                    <p className="text-[11px] text-gray-400">
                      We will send a 6-digit verification code and reset link directly to your inbox.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-3.5 bg-brand-green hover:bg-brand-green-dark text-white font-extrabold text-xs rounded-2xl shadow-md disabled:opacity-60 transition-all flex justify-center items-center gap-2 cursor-pointer"
                  >
                    {forgotLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Sending OTP Code...</span>
                      </>
                    ) : (
                      <span>Send 6-Digit OTP Code</span>
                    )}
                  </button>
                </form>
              )}

              {/* STEP 2: Enter OTP & New Password */}
              {forgotStep === 2 && (
                <form onSubmit={handleResetModeratorPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                      6-Digit OTP Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value)}
                      placeholder="123456"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-center text-xl font-mono tracking-widest font-black text-brand-green-dark focus:bg-white focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showForgotNewPassword ? 'text' : 'password'}
                        required
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showForgotNewPassword ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                      Confirm New Password
                    </label>
                    <input
                      type={showForgotNewPassword ? 'text' : 'password'}
                      required
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none"
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="text-gray-500 hover:underline font-bold"
                    >
                      ← Resend Code
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-3.5 bg-brand-green hover:bg-brand-green-dark text-white font-extrabold text-xs rounded-2xl shadow-md disabled:opacity-60 transition-all flex justify-center items-center gap-2 cursor-pointer"
                  >
                    {forgotLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Resetting Password...</span>
                      </>
                    ) : (
                      <span>Reset & Save New Password</span>
                    )}
                  </button>
                </form>
              )}

              {/* STEP 3: Success Screen */}
              {forgotStep === 3 && (
                <div className="text-center space-y-4 py-4">
                  <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-brand-green">
                    <FaCheckCircle size={28} />
                  </div>
                  <p className="text-xs text-gray-600">
                    Your moderator account password has been updated securely. You can now log in with your new password.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ email: forgotEmail, password: '' });
                      setIsForgotModalOpen(false);
                    }}
                    className="w-full py-3.5 bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold rounded-2xl shadow-md transition-all cursor-pointer"
                  >
                    Sign In to Moderator Console →
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ModeratorLogin;
