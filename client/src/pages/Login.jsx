import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaApple } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const Login = () => {
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ emailOrPhone: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const redirectAfterLogin = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify({
      emailOrPhone: data.emailOrPhone,
      name: data.name,
      avatar: data.avatar,
      role: data.role
    }));
    const searchParams = new URLSearchParams(location.search);
    const redirectUrl = searchParams.get('redirect') || '/dashboard';
    navigate(redirectUrl);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) {
      setError('Please agree to the Terms & Conditions and Privacy Policy.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, formData, { timeout: 10000 });
      if (response.data.success) {
        redirectAfterLogin(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google Identity Services callback
  const handleGoogleResponse = async (response) => {
    if (!agreed) {
      setError('Please agree to the Terms & Conditions and Privacy Policy.');
      return;
    }
    setIsGoogleLoading(true);
    setError('');
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/google`, {
        credential: response.credential,
      });
      if (res.data.success) {
        redirectAfterLogin(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Google login failed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Load Google Identity Services script and initialize
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const loadGoogleScript = () => {
      if (document.getElementById('google-identity-script')) {
        initGoogle();
        return;
      }
      const script = document.createElement('script');
      script.id = 'google-identity-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.body.appendChild(script);
    };

    const initGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });
      }
    };

    loadGoogleScript();
  }, []);

  const handleGoogleButtonClick = () => {
    if (!agreed) {
      setError('Please agree to the Terms & Conditions and Privacy Policy.');
      return;
    }
    if (!GOOGLE_CLIENT_ID) {
      setError('Google login is not configured yet. Please add your Google Client ID.');
      return;
    }
    if (window.google) {
      window.google.accounts.id.prompt();
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
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">{t('login_welcome')}</h2>
            <p className="text-[15px] text-gray-700 font-bold">{t('login_subtitle')}</p>
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
                placeholder={t('login_email_placeholder')}
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
                placeholder={t('login_password_placeholder') || 'Enter your password'} 
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

            <div className="flex justify-end items-center mt-[-4px]">
              <Link to="/forgot-password" className="text-[13px] text-[#2F80ED] font-extrabold hover:underline transition-colors">{t('login_forgot')}</Link>
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
              className="w-full py-3.5 mt-2 rounded-lg bg-[#F2994A] text-white font-bold text-[16px] shadow-sm hover:shadow-md hover:bg-[#E68A3B] transition-all duration-300 flex justify-center items-center"
            >
              {isLoading ? t('login_loading') : t('login_btn')}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center w-full">
            <p className="text-[14px] text-gray-700 font-bold">
              {t('login_no_account')} <Link to="/register" className="text-[#2F80ED] font-extrabold hover:underline transition-colors">{t('login_signup')}</Link>
            </p>
          </div>

          {/* Divider */}
          <div className="w-full flex items-center justify-center space-x-4 mt-6 mb-6">
            <div className="h-[1px] bg-gray-300 flex-1"></div>
            <span className="text-[14px] text-gray-500 font-extrabold tracking-wider">{t('login_or')}</span>
            <div className="h-[1px] bg-gray-300 flex-1"></div>
          </div>

          {/* Social Buttons */}
          <div className="flex flex-col justify-center gap-4 mb-4 w-full">
            <button
              type="button"
              onClick={handleGoogleButtonClick}
              disabled={isGoogleLoading}
              className="w-full h-12 rounded-lg bg-white border border-gray-300 flex items-center justify-center gap-3 hover:bg-gray-50 hover:shadow-md transition-all duration-300 disabled:opacity-60"
            >
              {isGoogleLoading ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <FcGoogle size={24} />
              )}
              <span className="text-gray-700 font-bold text-[15px]">
                {isGoogleLoading ? t('login_google_loading') : t('login_google')}
              </span>
            </button>
            <button className="w-full h-12 rounded-lg bg-black text-white flex items-center justify-center gap-3 hover:bg-gray-900 transition-all duration-300">
              <FaApple size={24} />
              <span className="text-white font-bold text-[15px]">{t('login_apple')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
