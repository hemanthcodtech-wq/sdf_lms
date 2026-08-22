import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaUser, FaPhone, FaEnvelope, FaLock, FaCheckCircle, FaArrowLeft, FaShieldAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';

const Register = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState('FORM'); // 'FORM' | 'OTP'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [otp, setOtp] = useState('');
  const [agreed, setAgreed] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Resend OTP Countdown
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name.trim()) {
      return setError('Please enter your full name.');
    }
    if (!formData.phone.trim()) {
      return setError('Please enter your phone number.');
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      return setError('Please enter a valid email address.');
    }
    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters long.');
    }
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match.');
    }
    if (!agreed) {
      return setError('Please agree to the Terms & Conditions and Privacy Policy.');
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/register-send-otp`, {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        password: formData.password
      });

      if (response.data.success) {
        setStep('OTP');
        setCountdown(60);
        setSuccessMsg(`A 6-digit verification code has been sent to ${formData.email.trim()}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification code. Please check your information.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP & Complete Registration
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      return setError('Please enter the complete 6-digit verification code.');
    }

    setIsVerifying(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/register-verify-otp`, {
        email: formData.email.trim(),
        otp: otp.trim()
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify({
          _id: response.data._id,
          name: response.data.name,
          email: response.data.email,
          phone: response.data.phone,
          emailOrPhone: response.data.emailOrPhone,
          role: response.data.role
        }));

        setSuccessMsg('Account verified successfully! Redirecting...');
        
        const searchParams = new URLSearchParams(location.search);
        const redirectUrl = searchParams.get('redirect') || '/dashboard';
        
        setTimeout(() => {
          navigate(redirectUrl);
        }, 1200);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/register-send-otp`, {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        password: formData.password
      });

      if (response.data.success) {
        setCountdown(60);
        setSuccessMsg(`A fresh verification code was sent to ${formData.email.trim()}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center relative overflow-hidden font-inter py-10 px-4">
      
      {/* Background Refraction Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand-green/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#F2994A]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md flex flex-col items-center z-10">
        
        {/* Glassmorphism Card */}
        <div className="w-full bg-white/75 backdrop-blur-2xl border border-white/80 shadow-[0_12px_40px_rgba(0,0,0,0.06)] rounded-[2.25rem] p-7 md:p-9 flex flex-col items-center">
          
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-3 w-full">
            <img src="/logo.png" alt="Swamy Dwija Foundation" className="w-44 h-auto object-contain" />
          </div>

          <AnimatePresence mode="wait">
            
            {/* ─── STEP 1: REGISTRATION FORM ─── */}
            {step === 'FORM' && (
              <motion.div
                key="form-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full"
              >
                <div className="text-center mb-6 w-full">
                  <span className="inline-block px-3 py-1 rounded-full bg-brand-green/10 text-brand-green-dark text-[11px] font-extrabold uppercase tracking-wider mb-1.5">
                    Student Enrollment
                  </span>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Create an Account</h2>
                  <p className="text-xs text-gray-500 mt-1">Join the global wellness & yogic learning community</p>
                </div>

                {error && (
                  <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold text-center">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSendOtp} className="w-full flex flex-col gap-3.5">
                  
                  {/* Full Name */}
                  <div className="flex items-center px-4 py-3 bg-gray-50/80 border border-gray-200/80 rounded-2xl focus-within:bg-white focus-within:border-brand-green focus-within:ring-2 focus-within:ring-brand-green/20 transition-all shadow-xs">
                    <FaUser className="text-gray-400 mr-3 shrink-0" size={14} />
                    <input 
                      name="name"
                      type="text"
                      placeholder="Full Legal Name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full bg-transparent border-none outline-none text-sm placeholder-gray-400 text-gray-800 font-medium"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="flex items-center px-4 py-3 bg-gray-50/80 border border-gray-200/80 rounded-2xl focus-within:bg-white focus-within:border-brand-green focus-within:ring-2 focus-within:ring-brand-green/20 transition-all shadow-xs">
                    <FaPhone className="text-gray-400 mr-3 shrink-0" size={14} />
                    <input 
                      name="phone"
                      type="tel"
                      placeholder="Phone Number (e.g. 9876543210)"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full bg-transparent border-none outline-none text-sm placeholder-gray-400 text-gray-800 font-medium"
                    />
                  </div>

                  {/* Email */}
                  <div className="flex items-center px-4 py-3 bg-gray-50/80 border border-gray-200/80 rounded-2xl focus-within:bg-white focus-within:border-brand-green focus-within:ring-2 focus-within:ring-brand-green/20 transition-all shadow-xs">
                    <FaEnvelope className="text-gray-400 mr-3 shrink-0" size={14} />
                    <input 
                      name="email"
                      type="email"
                      placeholder="Email Address"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full bg-transparent border-none outline-none text-sm placeholder-gray-400 text-gray-800 font-medium"
                    />
                  </div>
                  
                  {/* Password */}
                  <div className="flex items-center px-4 py-3 bg-gray-50/80 border border-gray-200/80 rounded-2xl focus-within:bg-white focus-within:border-brand-green focus-within:ring-2 focus-within:ring-brand-green/20 relative transition-all shadow-xs">
                    <FaLock className="text-gray-400 mr-3 shrink-0" size={14} />
                    <input 
                      name="password"
                      type={showPassword ? "text" : "password"} 
                      placeholder="Create Password (min 6 chars)"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="w-full bg-transparent border-none outline-none text-sm placeholder-gray-400 text-gray-800 font-medium pr-8"
                    />
                    <button 
                      type="button"
                      className="absolute right-3.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </button>
                  </div>

                  {/* Confirm Password */}
                  <div className="flex items-center px-4 py-3 bg-gray-50/80 border border-gray-200/80 rounded-2xl focus-within:bg-white focus-within:border-brand-green focus-within:ring-2 focus-within:ring-brand-green/20 relative transition-all shadow-xs">
                    <FaLock className="text-gray-400 mr-3 shrink-0" size={14} />
                    <input 
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"} 
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="w-full bg-transparent border-none outline-none text-sm placeholder-gray-400 text-gray-800 font-medium pr-8"
                    />
                    <button 
                      type="button"
                      className="absolute right-3.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </button>
                  </div>

                  {/* Terms and Privacy Checkbox */}
                  <label className="flex items-start gap-2.5 text-xs text-gray-600 cursor-pointer select-none mt-1">
                    <input 
                      type="checkbox" 
                      checked={agreed} 
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-0.5 rounded border-gray-300 text-brand-green focus:ring-brand-green/20 w-4 h-4 cursor-pointer" 
                    />
                    <span className="leading-snug">
                      I agree to the <Link to="/terms" target="_blank" className="text-brand-green font-bold hover:underline">Terms & Conditions</Link>, <Link to="/privacy" target="_blank" className="text-brand-green font-bold hover:underline">Privacy Policy</Link>, and <Link to="/refund-policy" target="_blank" className="text-brand-green font-bold hover:underline">Refund Policy</Link>.
                    </span>
                  </label>

                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full py-3.5 mt-2 rounded-2xl bg-brand-green hover:bg-brand-green-dark text-white font-extrabold text-sm shadow-[0_6px_20px_rgba(10,79,42,0.25)] hover:shadow-[0_8px_25px_rgba(10,79,42,0.35)] transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isLoading ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Sending Verification Code...</>
                    ) : 'Verify Email & Register →'}
                  </button>
                </form>

                {/* Sign In Link */}
                <p className="text-xs text-gray-600 text-center mt-6">
                  Already have an account? <Link to="/login" className="text-brand-green font-extrabold hover:underline">Login here</Link>
                </p>
              </motion.div>
            )}

            {/* ─── STEP 2: 6-DIGIT EMAIL OTP VERIFICATION ─── */}
            {step === 'OTP' && (
              <motion.div
                key="otp-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full text-center"
              >
                <div className="w-14 h-14 bg-emerald-50 text-brand-green rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <FaShieldAlt size={24} />
                </div>

                <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-1">Verify Your Email</h2>
                <p className="text-xs text-gray-500 mb-1">
                  We've sent a 6-digit verification code to:
                </p>
                <p className="text-xs font-bold text-brand-green-dark bg-emerald-50/80 px-3 py-1 rounded-full inline-block mb-5">
                  {formData.email}
                </p>

                {successMsg && (
                  <div className="w-full mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold text-center">
                    {successMsg}
                  </div>
                )}

                {error && (
                  <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold text-center">
                    {error}
                  </div>
                )}

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-1 text-left">
                    <label className="block text-[11px] font-extrabold text-gray-600 uppercase tracking-wider text-center">
                      Enter 6-Digit Code
                    </label>
                    <input 
                      type="text"
                      maxLength={6}
                      pattern="[0-9]*"
                      inputMode="numeric"
                      required
                      autoFocus
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="• • • • • •"
                      className="w-full py-3.5 bg-gray-50/80 border-2 border-gray-200 focus:border-brand-green focus:bg-white rounded-2xl text-center text-2xl font-mono font-black tracking-[10px] text-brand-green-dark outline-none transition-all shadow-inner"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isVerifying || otp.length !== 6}
                    className="w-full py-3.5 rounded-2xl bg-brand-green hover:bg-brand-green-dark text-white font-extrabold text-sm shadow-[0_6px_20px_rgba(10,79,42,0.25)] transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isVerifying ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Verifying Account...</>
                    ) : 'Confirm & Complete Registration'}
                  </button>

                  {/* Resend OTP & Back Action */}
                  <div className="pt-3 border-t border-gray-100 flex flex-col items-center gap-2 text-xs">
                    {countdown > 0 ? (
                      <span className="text-gray-400 font-medium">
                        Resend code in <strong className="text-gray-700">{countdown}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={isLoading}
                        className="text-brand-green font-extrabold hover:underline cursor-pointer"
                      >
                        Resend Verification Code
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setStep('FORM');
                        setError('');
                        setSuccessMsg('');
                      }}
                      className="text-gray-500 hover:text-gray-800 font-bold flex items-center gap-1 mt-1 cursor-pointer"
                    >
                      <FaArrowLeft size={10} /> Edit Details / Change Email
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

          </AnimatePresence>

        </div>
      </div>
    </div>
  );
};

export default Register;
