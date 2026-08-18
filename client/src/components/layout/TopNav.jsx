import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { FaHome, FaChalkboardTeacher, FaBookOpen, FaUser, FaBell, FaGraduationCap } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';

const TopNav = () => {
  const { t } = useLanguage();

  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Fetch user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: t('dash_nav_home'), path: '/dashboard', icon: FaHome },
    { name: t('dash_nav_courses'), path: '/courses', icon: FaGraduationCap },
    { name: t('dash_nav_classes'), path: '/dashboard/classes', icon: FaChalkboardTeacher },
    { name: t('dash_nav_learning'), path: '/dashboard/learning', icon: FaBookOpen },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 hidden md:flex justify-between items-center px-8 xl:px-24 h-20 ${
        scrolled ? 'bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-100' : 'bg-transparent'
      }`}
    >
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="Logo" className="h-14 md:h-16 w-auto" />
      </div>

      <nav className="flex items-center gap-8">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `relative font-medium text-[15px] transition-colors hover:text-brand-green ${
                isActive ? 'text-brand-green' : 'text-gray-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="flex items-center gap-2">
                  <item.icon size={16} />
                  {item.name}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="topNavIndicator"
                    className="absolute -bottom-7 left-0 w-full h-1 bg-brand-green rounded-t-md"
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-500 hover:text-brand-green transition-colors bg-white rounded-full shadow-sm">
          <FaBell size={18} />
          <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
        <NavLink to="/dashboard/profile" className="flex items-center gap-2 pl-4 border-l border-gray-200">
          <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green overflow-hidden">
            <FaUser size={16} />
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-semibold text-gray-800 leading-tight capitalize">
              {user?.emailOrPhone?.split('@')[0] || 'Guest'}
            </p>
            <p className="text-xs text-gray-500 capitalize">{user?.role || 'Student'}</p>
          </div>
        </NavLink>
      </div>
    </motion.header>
  );
};

export default TopNav;
