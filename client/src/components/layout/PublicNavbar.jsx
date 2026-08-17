import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHome, FaBook, FaInfoCircle, FaUser } from 'react-icons/fa';
const PublicNavbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Courses', path: '/courses' },
    { name: 'Contact', path: '/contact' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 w-full z-50 transition-all duration-300 bg-white ${isScrolled ? 'py-3 shadow-md' : 'py-5 shadow-sm'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center w-full relative">
          
          {/* Mobile Spacer (for flex balance) */}
          <div className="w-8 md:hidden"></div>

          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-2 absolute md:relative left-1/2 transform -translate-x-1/2 md:translate-x-0 md:left-0">
            <img src="/Swamy logo.png" alt="Logo" className="h-10 w-auto" />
            <span className="font-outfit font-bold text-lg text-brand-green-dark hidden lg:block">Swamy Dwija Foundation</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-8 items-center">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`relative font-outfit font-medium text-[16px] transition-colors ${isActive(link.path) ? 'text-brand-green' : 'text-gray-700 hover:text-brand-green'
                  }`}
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

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {token ? (
              <Link
                to={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                className="px-6 py-2.5 rounded-full bg-brand-green text-white font-semibold font-outfit text-sm hover:bg-brand-green-dark transition-all shadow-[0_4px_14px_0_rgba(13,92,49,0.39)] hover:shadow-[0_6px_20px_rgba(13,92,49,0.23)] hover:-translate-y-0.5"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="font-outfit font-semibold text-gray-700 hover:text-brand-green transition-colors px-2"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2.5 rounded-full bg-brand-green text-white font-semibold font-outfit text-sm hover:bg-brand-green-dark transition-all shadow-[0_4px_14px_0_rgba(13,92,49,0.39)] hover:shadow-[0_6px_20px_rgba(13,92,49,0.23)] hover:-translate-y-0.5"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 hover:text-brand-green focus:outline-none"
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
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md font-outfit font-medium text-base ${isActive(link.path) ? 'bg-brand-green/10 text-brand-green' : 'text-gray-700 hover:bg-gray-50'
                    }`}
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
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="w-full text-center px-4 py-2 rounded-full border border-brand-green text-brand-green font-semibold font-outfit"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/register"
                      className="w-full text-center px-4 py-2 rounded-full bg-brand-green text-white font-semibold font-outfit"
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navbar (Mobile Only) */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-100 z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex justify-around items-center pt-3 pb-4 px-2">
          <Link to="/" className={`flex flex-col items-center gap-1.5 transition-colors ${isActive('/') ? 'text-brand-green' : 'text-gray-400 hover:text-brand-green'}`}>
            <FaHome className="text-xl" />
            <span className="text-[11px] font-outfit font-bold tracking-wide">Home</span>
          </Link>
          <Link to="/courses" className={`flex flex-col items-center gap-1.5 transition-colors ${isActive('/courses') ? 'text-brand-green' : 'text-gray-400 hover:text-brand-green'}`}>
            <FaBook className="text-xl" />
            <span className="text-[11px] font-outfit font-bold tracking-wide">Classes</span>
          </Link>
          <Link to="/about" className={`flex flex-col items-center gap-1.5 transition-colors ${isActive('/about') ? 'text-brand-green' : 'text-gray-400 hover:text-brand-green'}`}>
            <FaInfoCircle className="text-xl" />
            <span className="text-[11px] font-outfit font-bold tracking-wide">About</span>
          </Link>
          <Link to={token ? (user?.role === 'admin' ? '/admin/dashboard' : '/dashboard') : '/login'} className={`flex flex-col items-center gap-1.5 transition-colors ${location.pathname.includes('/dashboard') || location.pathname.includes('/login') ? 'text-brand-green' : 'text-gray-400 hover:text-brand-green'}`}>
            <FaUser className="text-xl" />
            <span className="text-[11px] font-outfit font-bold tracking-wide">{token ? 'Dashboard' : 'Login'}</span>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
};

export default PublicNavbar;
