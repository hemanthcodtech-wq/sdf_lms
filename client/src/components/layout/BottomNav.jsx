import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaHome, FaChalkboardTeacher, FaBookOpen, FaUser, FaGraduationCap } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';

const BottomNav = () => {
  const { t } = useLanguage();
  const navItems = [
    { name: t('dash_nav_home'), path: '/dashboard', icon: FaHome },
    { name: t('dash_nav_courses'), path: '/courses', icon: FaGraduationCap },
    { name: t('dash_nav_classes'), path: '/dashboard/classes', icon: FaChalkboardTeacher },
    { name: t('dash_nav_learning'), path: '/dashboard/learning', icon: FaBookOpen },
    { name: t('dash_nav_profile'), path: '/dashboard/profile', icon: FaUser },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 md:hidden">
      <div className="flex justify-around items-center h-16 pb-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-brand-green' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  animate={isActive ? { y: -2 } : { y: 0 }}
                  className="relative"
                >
                  <item.icon size={20} />
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-brand-green rounded-b-md"
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    />
                  )}
                </motion.div>
                <span className={`text-[10px] font-semibold ${isActive ? 'text-brand-green' : ''}`}>
                  {item.name}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;
