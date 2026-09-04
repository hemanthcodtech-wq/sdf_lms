import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHome, FaBook, FaInfoCircle, FaUser, FaGlobe, FaArrowLeft } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';

const PublicNavbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const { lang, setLang, t } = useLanguage();

  const isCourseDetails = location.pathname.startsWith('/courses/') && location.pathname !== '/courses';
  const isCourseList = location.pathname === '/courses';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: t('nav_home'), path: '/' },
    { name: t('nav_about'), path: '/about' },
    { name: t('nav_courses'), path: '/courses' },
    { name: t('nav_contact'), path: '/contact' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 bg-white flex items-center h-18 md:h-20 ${isScrolled ? 'shadow-md border-b border-gray-100' : 'shadow-sm'}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex justify-between items-center w-full relative">
          
          {/* Left Side: Logo & Optional Back Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {(isCourseDetails || isCourseList) && (
              <button 
                onClick={() => navigate(-1)} 
                className="md:hidden flex items-center justify-center text-brand-green-dark p-1.5 hover:bg-brand-green/10 rounded-full transition-colors flex-shrink-0"
                aria-label="Go back"
              >
                <FaArrowLeft size={16} />
              </button>
            )}

            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <img 
                src="/Swamy logo.png" 
                alt="Swamy Dwija Foundation" 
                className="h-10 sm:h-12 md:h-16 w-auto max-h-16 object-contain" 
              />
              <span className="font-outfit font-bold text-lg text-brand-green-dark hidden lg:block">
                Swamy Dwija Foundation
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-8 items-center">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative font-outfit font-medium text-[16px] transition-colors ${isActive(link.path) ? 'text-brand-green' : 'text-gray-700 hover:text-brand-green'}`}
              >
                {link.name}
                {isActive(link.path) && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-brand-green rounded-full"
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Right side: Language + Auth */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Language Select Dropdown */}
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
              <FaGlobe className="text-brand-green text-xs" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="bg-transparent text-sm font-bold text-gray-700 font-outfit outline-none cursor-pointer pr-1"
              >
                <option value="en">EN</option>
                <option value="te">TE</option>
              </select>
            </div>

            {/* Auth Buttons */}
            {token ? (
              <Link
                to={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                className="px-6 py-2.5 rounded-full bg-brand-green text-white font-semibold font-outfit text-sm hover:bg-brand-green-dark transition-all shadow-[0_4px_14px_0_rgba(13,92,49,0.39)] hover:shadow-[0_6px_20px_rgba(13,92,49,0.23)] hover:-translate-y-0.5"
              >
                {t('nav_dashboard')}
              </Link>
            ) : (
              <>
                <Link to="/login" className="font-outfit font-semibold text-gray-700 hover:text-brand-green transition-colors px-2">
                  {t('nav_login')}
                </Link>
                <Link to="/register" className="px-6 py-2.5 rounded-full bg-brand-green text-white font-semibold font-outfit text-sm hover:bg-brand-green-dark transition-all shadow-[0_4px_14px_0_rgba(13,92,49,0.39)] hover:shadow-[0_6px_20px_rgba(13,92,49,0.23)] hover:-translate-y-0.5">
                  {t('nav_register')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Right Controls: Language + Hamburger */}
          <div className="md:hidden flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Mobile Language Select */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-full border border-gray-200 bg-gray-50 flex-shrink-0">
              <FaGlobe className="text-brand-green text-[10px]" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="bg-transparent text-xs font-bold text-gray-700 font-outfit outline-none cursor-pointer pr-0.5"
              >
                <option value="en">EN</option>
                <option value="te">TE</option>
              </select>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1 text-gray-700 hover:text-brand-green focus:outline-none flex-shrink-0"
              aria-label="Toggle navigation menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-glass-border"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md font-outfit font-medium text-base ${isActive(link.path) ? 'bg-brand-green/10 text-brand-green' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  {link.name}
                </Link>
              ))}

              <div className="mt-4 pt-4 border-t border-gray-200/50 flex flex-col space-y-3">
                {token ? (
                  <Link
                    to={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                    className="w-full text-center px-4 py-2 rounded-full bg-brand-green text-white font-semibold font-outfit"
                  >
                    {t('nav_dashboard')}
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="w-full text-center px-4 py-2 rounded-full border border-brand-green text-brand-green font-semibold font-outfit">
                      {t('nav_login')}
                    </Link>
                    <Link to="/register" className="w-full text-center px-4 py-2 rounded-full bg-brand-green text-white font-semibold font-outfit">
                      {t('nav_register')}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navbar (Mobile Only) */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-gray-100 z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex justify-around items-center pt-2 pb-3 px-1 max-w-full">
          <Link to="/" className={`flex flex-col items-center gap-1 transition-colors flex-1 py-1 ${isActive('/') ? 'text-brand-green font-bold' : 'text-gray-400 hover:text-brand-green'}`}>
            <FaHome className="text-lg sm:text-xl" />
            <span className="text-[10px] sm:text-[11px] font-outfit tracking-tight truncate max-w-[65px] text-center">{t('nav_bottom_home')}</span>
          </Link>
          <Link to="/courses" className={`flex flex-col items-center gap-1 transition-colors flex-1 py-1 ${isActive('/courses') ? 'text-brand-green font-bold' : 'text-gray-400 hover:text-brand-green'}`}>
            <FaBook className="text-lg sm:text-xl" />
            <span className="text-[10px] sm:text-[11px] font-outfit tracking-tight truncate max-w-[65px] text-center">{t('nav_bottom_classes')}</span>
          </Link>
          <Link to="/about" className={`flex flex-col items-center gap-1 transition-colors flex-1 py-1 ${isActive('/about') ? 'text-brand-green font-bold' : 'text-gray-400 hover:text-brand-green'}`}>
            <FaInfoCircle className="text-lg sm:text-xl" />
            <span className="text-[10px] sm:text-[11px] font-outfit tracking-tight truncate max-w-[65px] text-center">{t('nav_bottom_about')}</span>
          </Link>
          <Link to={token ? (user?.role === 'admin' ? '/admin/dashboard' : '/dashboard') : '/login'} className={`flex flex-col items-center gap-1 transition-colors flex-1 py-1 ${location.pathname.includes('/dashboard') || location.pathname.includes('/login') ? 'text-brand-green font-bold' : 'text-gray-400 hover:text-brand-green'}`}>
            <FaUser className="text-lg sm:text-xl" />
            <span className="text-[10px] sm:text-[11px] font-outfit tracking-tight truncate max-w-[65px] text-center">{token ? t('nav_dashboard') : t('nav_bottom_login')}</span>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
};

export default PublicNavbar;
