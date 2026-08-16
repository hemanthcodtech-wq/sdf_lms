import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaFacebookF, FaPhoneAlt } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import axios from 'axios';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ emailOrPhone: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, formData, { timeout: 10000 });
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify({ emailOrPhone: response.data.emailOrPhone, role: response.data.role }));
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-cream flex flex-col items-center justify-center relative overflow-hidden font-inter py-10 px-4">
      


      <div className="w-full max-w-md flex flex-col items-center z-10">
        
        {/* Logo Section - Outside the card */}
        <div className="flex flex-col items-center mb-6 w-full drop-shadow-sm">
          <img src="/logo.png" alt="Swamy Dwija Foundation" className="w-48 h-auto" />
        </div>

        {/* Glassmorphism Card */}
        <div className="w-full bg-white/60 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-[2rem] p-8 md:p-10 flex flex-col items-center">
          
          {/* Welcome Text */}
          <div className="text-center mb-8 w-full">
            <p className="text-[15px] text-gray-800 font-semibold mb-1">Welcome Back!</p>
            <h2 className="text-2xl md:text-3xl font-bold text-brand-green">Login to Your Account</h2>
          </div>

          {error && (
            <div className="w-full mb-4 p-3 bg-red-100/80 backdrop-blur-sm border border-red-200 text-red-600 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            <div className="custom-input flex items-center px-4 py-3.5 shadow-sm">
              <input 
                name="emailOrPhone"
                type="text"
                placeholder="Email or Phone Number" 
                value={formData.emailOrPhone}
                onChange={handleChange}
                required
                className="w-full bg-transparent border-none outline-none text-[15px] placeholder-gray-500 text-gray-800"
              />
            </div>
            
            <div className="custom-input flex items-center px-4 py-3.5 relative shadow-sm">
              <input 
                name="password"
                type={showPassword ? "text" : "password"} 
                placeholder="Password" 
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full bg-transparent border-none outline-none text-[15px] placeholder-gray-500 text-gray-800 pr-10"
              />
              <button 
                type="button"
                className="absolute right-4 text-gray-500 hover:text-gray-700 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>

            <div className="flex justify-end mt-[-4px]">
              <a href="#" className="text-[13px] text-brand-green font-semibold hover:text-brand-green-dark transition-colors">Forgot Password?</a>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3.5 mt-2 rounded-full bg-brand-green text-white font-semibold text-[16px] shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:bg-brand-green-dark transition-all duration-300 flex justify-center items-center"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Divider */}
          <div className="w-full flex items-center justify-center space-x-3 mt-8 mb-6">
            <div className="h-[1px] bg-gray-300/60 flex-1"></div>
            <span className="text-[13px] text-gray-500 font-medium">or continue with</span>
            <div className="h-[1px] bg-gray-300/60 flex-1"></div>
          </div>

          {/* Social Buttons */}
          <div className="flex justify-center gap-5 mb-8 w-full">
            <button className="w-14 h-14 rounded-full bg-white shadow-[0_4px_15px_rgb(0,0,0,0.05)] border border-gray-100 flex items-center justify-center hover:shadow-[0_6px_20px_rgb(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300">
              <FcGoogle size={26} />
            </button>
            <button className="w-14 h-14 rounded-full bg-[#1877F2] text-white shadow-[0_4px_15px_rgb(24,119,242,0.2)] flex items-center justify-center hover:shadow-[0_6px_20px_rgb(24,119,242,0.3)] hover:-translate-y-1 transition-all duration-300">
              <FaFacebookF size={22} />
            </button>
            <button className="w-14 h-14 rounded-full bg-brand-green text-white shadow-[0_4px_15px_rgb(13,92,49,0.2)] flex items-center justify-center hover:shadow-[0_6px_20px_rgb(13,92,49,0.3)] hover:-translate-y-1 transition-all duration-300">
              <FaPhoneAlt size={20} />
            </button>
          </div>

          {/* Sign Up Link */}
          <p className="text-[14px] text-gray-600">
            Don't have an account? <Link to="/register" className="text-brand-green font-semibold hover:text-brand-green-dark hover:underline transition-colors">Sign Up</Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Login;
