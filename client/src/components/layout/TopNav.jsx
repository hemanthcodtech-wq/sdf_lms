import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaChalkboardTeacher, FaBookOpen, FaUser, FaBell, FaGraduationCap, FaGlobe, FaArrowLeft } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';

const TopNav = () => {
  const { t, lang, setLang } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {}
      } else {
        setUser(null);
      }
    };
    loadUser();
    window.addEventListener('storage', loadUser);
    window.addEventListener('user-updated', loadUser);
    return () => {
      window.removeEventListener('storage', loadUser);
      window.removeEventListener('user-updated', loadUser);
    };
  }, []);

  const isCourseDetails = location.pathname.startsWith('/courses/') && location.pathname !== '/courses';
  const isCourseList = location.pathname === '/courses';

  const navItems = [
    { name: t('dash_nav_home'), path: '/dashboard', icon: FaHome },
    { name: t('dash_nav_courses'), path: '/courses', icon: FaGraduationCap },
    { name: t('dash_nav_learning'), path: '/dashboard/learning', icon: FaBookOpen },
  ];

  return (
    <header
      className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-8 xl:px-24 h-18 md:h-20 bg-white border-b border-gray-100 shadow-sm"
    >
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

        <img 
          src="/logo.png" 
          alt="Logo" 
          className="h-10 sm:h-12 md:h-16 w-auto max-h-16 object-contain drop-shadow-sm cursor-pointer flex-shrink-0" 
          onClick={() => navigate('/')} 
        />
      </div>

      {/* Desktop Nav Links */}
      <nav className="hidden md:flex items-center gap-8">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === '/dashboard'}
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

      <div className="flex items-center gap-2 md:gap-4 relative z-10 ml-auto">
        {/* Language Select Dropdown */}
        <div className="flex items-center gap-1 px-2 py-1.5 md:px-3 md:py-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-colors shadow-sm">
          <FaGlobe className="text-brand-green text-[10px] md:text-xs" />
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="bg-transparent text-xs md:text-sm font-bold text-gray-700 outline-none cursor-pointer pr-1"
          >
            <option value="en">EN</option>
            <option value="te">TE</option>
          </select>
        </div>

        <button className="relative p-2 text-gray-500 hover:text-brand-green transition-colors bg-white rounded-full shadow-sm">
          <FaBell size={18} />
          <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
        <NavLink to="/dashboard/profile" className="hidden md:flex items-center gap-2 pl-2 md:pl-4 border-l border-gray-200">
          <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green overflow-hidden">
            <FaUser size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-800">{user?.name || user?.emailOrPhone?.split('@')[0] || 'User'}</span>
            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{user?.role || 'Learner'}</span>
          </div>
        </NavLink>
      </div>
    </header>
  );
};

export default TopNav;
