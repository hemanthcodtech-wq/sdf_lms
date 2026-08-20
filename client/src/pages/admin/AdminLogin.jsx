import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  FaShieldAlt, FaLock, FaEnvelope, FaEye, FaEyeSlash, 
  FaArrowLeft, FaCheckCircle, FaAward, FaCloud, FaServer 
} from 'react-icons/fa';

const AdminLogin = () => {
  const [formData, setFormData] = useState({ email: 'admin@sdf.com', password: 'admin123' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
        emailOrPhone: formData.email,
        password: formData.password
      });

      if (response.data.success) {
        if (response.data.role !== 'admin') {
          setError('Access Denied: Administrative privileges required.');
          setIsLoading(false);
          return;
        }

        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminUser', JSON.stringify({ email: response.data.emailOrPhone, role: response.data.role }));
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4 md:p-8 font-inter relative overflow-hidden">
      
      {/* Background Ambient Liquid Orbs */}
      <div className="absolute -top-32 -left-32 w-[550px] h-[550px] bg-[#0A4F2A]/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-[550px] h-[550px] bg-[#B8860B]/10 rounded-full blur-[160px] pointer-events-none"></div>
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-[#2D6A4F]/8 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Main Container Grid */}
      <div className="w-full max-w-5xl z-10">
        
        {/* Back Link */}
        <div className="mb-6 flex justify-between items-center px-2">
          <Link 
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-[#0A4F2A] transition-colors bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl border border-gray-200/80 shadow-xs"
          >
            <FaArrowLeft size={11} /> Return to Public Portal
          </Link>
          <div className="flex items-center gap-2 text-[11px] font-bold text-[#0A4F2A] bg-green-50 px-3 py-1.5 rounded-full border border-green-200/60">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
            System Live & Verified
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 25, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-white/80 backdrop-blur-2xl border border-white shadow-[0_20px_70px_rgba(0,0,0,0.06)] rounded-[2.5rem] overflow-hidden grid grid-cols-1 lg:grid-cols-12"
        >
          {/* Left Institutional Branding Panel (Desktop Only) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#06331A] via-[#0A4F2A] to-[#125B34] p-8 lg:p-12 text-white relative overflow-hidden flex flex-col justify-between">
            {/* Background Texture Overlay */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:16px_16px]"></div>
            
            {/* Top Brand Info */}
            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-extrabold tracking-widest uppercase text-[#D4AF37]">
                <FaShieldAlt /> Authorized Personnel Only
              </div>

              <div className="space-y-2">
                <div className="bg-white p-3.5 rounded-2xl inline-block shadow-md mb-2">
                  <img src="/logo.png" alt="SDF Logo" className="h-10 w-auto" />
                </div>
                <h2 className="text-xl lg:text-2xl font-black tracking-tight leading-tight">
                  SWAMY DWIJA FOUNDATION
                </h2>
                <p className="text-xs text-green-100/80 font-medium">
                  Academy of Yoga, Pranayama & Vedic Wellness Sciences
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 space-y-3.5 text-xs text-green-50/90 font-medium">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-[#D4AF37] shrink-0">
                    <FaLock size={12} />
                  </div>
                  <span>256-Bit Encrypted Administrative Session</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-[#D4AF37] shrink-0">
                    <FaAward size={12} />
                  </div>
                  <span>Watermarked Certificate & Invoice Infrastructure</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-[#D4AF37] shrink-0">
                    <FaCloud size={12} />
                  </div>
                  <span>Cloudinary Verified Master Vault</span>
                </div>
              </div>
            </div>

            {/* Bottom Status */}
            <div className="relative z-10 pt-8 mt-8 border-t border-white/10 flex items-center justify-between text-[11px] text-green-200/70">
              <span>SDF Portal v2.4</span>
              <span>Hyderabad Central Server</span>
            </div>
          </div>

          {/* Right Login Authentication Console */}
          <div className="lg:col-span-7 p-8 lg:p-12 flex flex-col justify-center relative">
            
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-green/10 text-brand-green-dark rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                Executive Portal
              </div>
              <h1 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">System Sign In</h1>
              <p className="text-gray-500 text-xs lg:text-sm mt-1">
                Enter your administrative credentials to access the central LMS controller.
              </p>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-2xl flex items-center gap-2.5 shadow-xs"
                >
                  <FaShieldAlt className="text-red-500 shrink-0" size={14} />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Admin Email */}
              <div className="space-y-1.5">
                <label className="block text-gray-700 text-xs font-extrabold uppercase tracking-wider">
                  Admin Account Email
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="admin@sdf.com"
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-[#0A4F2A]/20 focus:border-[#0A4F2A] outline-none transition-all shadow-xs"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-gray-700 text-xs font-extrabold uppercase tracking-wider">
                    Administrative Password
                  </label>
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
                    className="w-full pl-11 pr-12 py-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-[#0A4F2A]/20 focus:border-[#0A4F2A] outline-none transition-all shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#0A4F2A] hover:bg-[#06331A] text-white font-extrabold py-4 rounded-2xl shadow-lg shadow-[#0A4F2A]/25 hover:shadow-[#0A4F2A]/40 transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-2 text-sm tracking-wide mt-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <FaShieldAlt />
                    <span>Authorize & Open Controller</span>
                  </>
                )}
              </button>
            </form>

            {/* Bottom Security Notice */}
            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 font-medium">
              <span>Encrypted SSL Gateway</span>
              <span>Swamy Dwija Foundation © 2026</span>
            </div>

          </div>

        </motion.div>
      </div>

    </div>
  );
};

export default AdminLogin;
