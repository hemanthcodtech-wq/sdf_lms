import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaChevronRight } from 'react-icons/fa';
import { PiCertificate, PiHeart, PiBookOpen, PiCreditCard, PiGearSix, PiQuestion, PiSignOut } from 'react-icons/pi';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';

const ProfileMenu = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    firstName: 'Anjali',
    lastName: 'Sharma',
    emailOrPhone: 'anjali@example.com'
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        setProfile(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const menuItems = [
    { title: 'My Wishlist', icon: PiHeart, path: '/dashboard/wishlist' },
    { title: 'My Enrollments', icon: PiBookOpen, path: '/dashboard/learning' },
    { title: 'Payment History', icon: PiCreditCard, path: '/dashboard/payment-history' },
    { title: 'My Certificates', icon: PiCertificate, path: '/dashboard/certificates' },
    { title: 'Settings', icon: PiGearSix, path: '/dashboard/settings' },
    { title: 'Help & Support', icon: PiQuestion, path: '/dashboard/support' },
    { title: 'Logout', icon: PiSignOut, path: '/login', action: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } 
    }
  ];

  return (
    <div className="min-h-screen bg-bg-cream pt-4 md:pt-16 pb-24 md:pb-12 font-inter">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="flex items-center mb-6 mt-2 md:hidden">
          <button onClick={() => navigate(-1)} className="mr-4 text-brand-green">
            <FaArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-brand-green">Profile</h1>
        </div>

        {/* Glassmorphism Container */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[2rem] overflow-hidden flex flex-col md:flex-row min-h-[500px]"
        >
          {/* Left Panel - User Info */}
          <div className="w-full md:w-2/5 bg-white/50 p-8 md:p-12 flex flex-col border-b md:border-b-0 md:border-r border-white/60 relative">
            
            <div className="flex-1 flex flex-col justify-center">
              <div className="w-16 h-1 bg-brand-green mb-6 rounded-full hidden md:block"></div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight mb-2">
                {profile.firstName ? `${profile.firstName} ${profile.lastName || ''}`.trim() : 'Student'}
              </h2>
              <p className="text-gray-500 font-medium text-sm md:text-base">
                {profile.emailOrPhone}
              </p>
            </div>
            
            {/* Desktop Only Decoration */}
            <div className="hidden md:block mt-12 text-sm text-gray-400 font-medium">
              Manage your learning journey, certificates, and account settings all in one place.
            </div>
          </div>

          {/* Right Panel - Menu Grid */}
          <div className="w-full md:w-3/5 p-6 md:p-10 flex flex-col justify-center">
            
            <h3 className="text-lg font-bold text-gray-800 mb-6 hidden md:block px-2">Account Overview</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {menuItems.map((item, index) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  key={item.title}
                >
                  <button
                    onClick={() => {
                      if (item.action) item.action();
                      else if (item.path !== '#') navigate(item.path);
                    }}
                    className={`w-full flex items-center p-4 md:p-5 rounded-2xl bg-white/60 border border-white/80 shadow-sm hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] hover:bg-white hover:-translate-y-1 transition-all duration-300 group ${item.title === 'Logout' ? 'sm:col-span-2 mt-4' : ''}`}
                  >
                    <div className={`w-12 h-12 rounded-full flex flex-shrink-0 items-center justify-center mr-4 transition-colors duration-300 ${item.title === 'Logout' ? 'bg-red-50 text-red-500 group-hover:bg-red-500 group-hover:text-white' : 'bg-brand-green/10 text-brand-green group-hover:bg-brand-green group-hover:text-white'}`}>
                      <item.icon size={24} />
                    </div>
                    <div className="flex-1 text-left">
                      <span className={`font-bold text-[15px] ${item.title === 'Logout' ? 'text-red-600' : 'text-gray-800'}`}>
                        {item.title}
                      </span>
                    </div>
                    <FaChevronRight size={14} className={`transition-colors ${item.title === 'Logout' ? 'text-red-200 group-hover:text-red-400' : 'text-gray-300 group-hover:text-brand-green'}`} />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfileMenu;
