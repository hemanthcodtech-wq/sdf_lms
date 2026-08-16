import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';

const AdminLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
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
          setError('Unauthorized: Admin access only.');
          setIsLoading(false);
          return;
        }

        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminUser', JSON.stringify({ email: response.data.emailOrPhone, role: response.data.role }));
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Invalid credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4 font-inter relative overflow-hidden">
      
      {/* Light Background decoration */}
      <div className="absolute top-[-5%] left-[-5%] w-[50%] h-[50%] bg-[#e0f2e9] rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[50%] bg-[#fef5e7] rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-[#eaf6f0] rounded-full blur-[80px] pointer-events-none"></div>

      <div className="w-full max-w-[420px] flex flex-col items-center z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.95 }} 
          animate={{ opacity: 1, y: 0, scale: 1 }} 
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full bg-white/70 backdrop-blur-2xl border border-white shadow-[0_15px_60px_rgba(0,0,0,0.06)] rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden flex flex-col items-center"
        >
          {/* Decorative inner glow */}
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/60 to-transparent pointer-events-none"></div>

          <div className="text-center mb-8 relative z-10 flex flex-col items-center">
            {/* Logo Section */}
            <div className="mb-6 drop-shadow-sm flex justify-center">
              <img src="/logo.png" alt="Swamy Dwija Foundation" className="w-40 h-auto" />
            </div>
            
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Admin Portal</h1>
            <p className="text-gray-500 text-sm mt-2 font-medium">Secure access for authorized personnel</p>
          </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl text-center font-medium shadow-sm">
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-5 relative z-10">
          <div>
            <label className="block text-gray-700 text-[13px] font-bold mb-1.5 uppercase tracking-wide">Admin Email</label>
            <div className="relative group">
              <input 
                type="text" 
                name="email"
                value={formData.email} 
                onChange={handleChange} 
                className="w-full bg-white/60 border border-gray-200 text-gray-800 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all shadow-sm placeholder:text-gray-400 font-medium"
                placeholder="admin@sdf.com"
                required 
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-700 text-[13px] font-bold mb-1.5 uppercase tracking-wide">Password</label>
            <div className="relative group">
              <input 
                type="password" 
                name="password"
                value={formData.password} 
                onChange={handleChange} 
                className="w-full bg-white/60 border border-gray-200 text-gray-800 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all shadow-sm placeholder:text-gray-400 font-medium"
                placeholder="••••••••"
                required 
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-bold py-4 rounded-2xl shadow-[0_8px_20px_rgba(13,92,49,0.2)] hover:shadow-[0_12px_25px_rgba(13,92,49,0.3)] hover:-translate-y-1 transition-all duration-300 mt-8 disabled:opacity-70 disabled:hover:translate-y-0 flex justify-center items-center text-[15px]"
          >
            {isLoading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Authorize Access'}
          </button>
        </form>
      </motion.div>
      </div>
    </div>
  );
};

export default AdminLogin;
