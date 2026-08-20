import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';

const Register = () => {
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ emailOrPhone: '', password: '', confirmPassword: '' });
  const [agreed, setAgreed] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) {
      return setError('Please accept the Terms & Conditions and Privacy Policy to register.');
    }
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
        emailOrPhone: formData.emailOrPhone,
        password: formData.password
      }, { timeout: 10000 });
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify({ emailOrPhone: response.data.emailOrPhone, role: response.data.role }));
        
        const searchParams = new URLSearchParams(location.search);
        const redirectUrl = searchParams.get('redirect') || '/dashboard';
        navigate(redirectUrl);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-cream flex flex-col items-center justify-center relative overflow-hidden font-inter py-8 px-4">
      


      <div className="w-full max-w-md flex flex-col items-center z-10">
        
        {/* Glassmorphism Card */}
        <div className="w-full bg-white/60 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-[2rem] p-8 md:p-10 flex flex-col items-center">
          
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-4 w-full drop-shadow-sm">
            <img src="/logo.png" alt="Swamy Dwija Foundation" className="w-48 h-auto" />
          </div>

          {/* Welcome Text */}
          <div className="text-center mb-8 w-full">
            <p className="text-[15px] text-gray-800 font-semibold mb-1">{t('register_join')}</p>
            <h2 className="text-2xl md:text-3xl font-bold text-brand-green">{t('register_title')}</h2>
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
                placeholder={t('register_email')}
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
                placeholder={t('register_password')}
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

            <div className="custom-input flex items-center px-4 py-3.5 relative shadow-sm">
              <input 
                name="confirmPassword"
                type={showPassword ? "text" : "password"} 
                placeholder={t('register_confirm')}
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full bg-transparent border-none outline-none text-[15px] placeholder-gray-500 text-gray-800 pr-10"
              />
            </div>

            {/* Terms and Privacy Agreement Checkbox */}
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
              className="w-full py-3.5 mt-2 rounded-full bg-brand-green text-white font-semibold text-[16px] shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:bg-brand-green-dark transition-all duration-300 flex justify-center items-center"
            >
              {isLoading ? t('register_loading') : t('register_btn')}
            </button>
          </form>

          {/* Sign In Link */}
          <p className="text-[14px] text-gray-600 mt-8">
            {t('register_have_account')} <Link to="/login" className="text-brand-green font-semibold hover:text-brand-green-dark hover:underline transition-colors">{t('register_login_link')}</Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Register;
