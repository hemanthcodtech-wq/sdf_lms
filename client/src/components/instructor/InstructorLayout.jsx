import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { 
  FaTachometerAlt, FaVideo, FaBookOpen, FaUserTie, 
  FaSignOutAlt, FaExternalLinkAlt, FaSpa, FaOm, FaBars, FaTimes,
  FaUserGraduate, FaUserEdit, FaPhone, FaEnvelope
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const InstructorLayout = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const rawUser = localStorage.getItem('instructorUser');
  const instructor = rawUser ? JSON.parse(rawUser) : { name: 'Yoga Instructor', speciality: 'Yoga Master' };

  const handleLogout = () => {
    localStorage.removeItem('instructorToken');
    localStorage.removeItem('instructorUser');
    navigate('/instructor/login');
  };

  const navItems = [
    { name: 'Guru Dashboard', path: '/instructor/dashboard', icon: FaTachometerAlt },
  ];

  return (
    <div className="flex h-screen bg-[#FAF7F2] font-inter overflow-hidden relative">

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:static inset-y-0 left-0 w-64 lg:w-72 bg-white/80 backdrop-blur-2xl text-gray-800 flex-col shadow-[4px_0_30px_rgba(0,0,0,0.03)] z-30 shrink-0 border-r border-white/60">
        <div className="h-20 flex items-center justify-between px-6 border-b border-gray-100/80 bg-white/40 sticky top-0">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="SDF Logo" className="h-9 w-auto object-contain drop-shadow-sm" />
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-wider text-brand-green-dark">INSTRUCTOR PANEL</span>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Faculty Portal</span>
            </div>
          </div>
        </div>

        {/* Instructor Mini Badge */}
        <div className="p-4 mx-4 my-4 bg-emerald-50/90 border border-emerald-200/80 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-green text-white flex items-center justify-center font-black text-sm shadow-xs">
              {instructor.name ? instructor.name.charAt(0).toUpperCase() : <FaSpa />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-xs text-gray-900 truncate">{instructor.name || 'Instructor'}</div>
              <div className="text-[11px] text-emerald-800 font-extrabold truncate">{instructor.speciality || 'Yoga Guru'}</div>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <div className="px-3 mb-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Navigation</div>
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-brand-green text-white shadow-[0_8px_20px_rgba(41,120,56,0.25)] font-bold' 
                    : 'text-gray-600 hover:bg-white/80 hover:text-brand-green font-semibold hover:shadow-xs'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={18} className={isActive ? "text-white" : "text-gray-400"} />
                  <span className="text-sm tracking-tight">{item.name}</span>
                </>
              )}
            </NavLink>
          ))}

          <div className="pt-6 px-3 mb-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Quick Access</div>
          <Link
            to="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3.5 px-4 py-3 rounded-2xl text-gray-600 hover:bg-white/80 hover:text-brand-green font-semibold transition-all text-sm group"
          >
            <FaExternalLinkAlt size={14} className="text-gray-400 group-hover:text-brand-green" />
            <span>Public Courses</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-100/80 bg-white/40">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-2xl text-red-500 hover:bg-red-50/80 hover:text-red-600 font-bold transition-all text-sm cursor-pointer"
          >
            <FaSignOutAlt size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#FAF7F2] relative overflow-hidden">
        
        {/* Mobile & Desktop Header */}
        <header className="h-16 md:h-20 bg-white/80 backdrop-blur-xl border-b border-white/80 flex items-center justify-between px-4 md:px-8 z-20 shrink-0 shadow-[0_4px_30px_rgba(0,0,0,0.02)] sticky top-0">
          
          {/* Mobile Left: Menu Toggle & Logo */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              aria-label="Open menu"
            >
              <FaBars size={16} />
            </button>
            <img src="/logo.png" alt="SDF Logo" className="h-10 w-auto object-contain" />
          </div>

          <div className="hidden md:flex items-center gap-3">
            <h2 className="text-base lg:text-lg font-extrabold text-gray-800 tracking-tight">
              Swamy Dwija Foundation • Instructor Workspace
            </h2>
          </div>

          {/* User Status / Avatar */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-emerald-50 border border-emerald-200/80 rounded-full text-emerald-800 text-[11px] sm:text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Faculty Active</span>
            </div>

            <div 
              onClick={() => setMobileMenuOpen(true)}
              className="flex items-center gap-2 pl-2 border-l border-gray-200/80 cursor-pointer"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-brand-green text-white flex items-center justify-center font-black text-xs shadow-md">
                {instructor.name ? instructor.name.charAt(0).toUpperCase() : 'I'}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-bold text-gray-900 leading-tight truncate max-w-[120px]">{instructor.name || 'Instructor'}</span>
                <span className="text-[10px] font-semibold text-gray-400 truncate max-w-[120px]">{instructor.speciality || 'Guru'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Outlet with responsive padding */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 xl:p-10 pb-24 md:pb-10">
          <div className="max-w-[1600px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <Outlet />
            </motion.div>
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-2xl border-t border-gray-200/80 px-6 py-2.5 flex items-center justify-around shadow-[0_-8px_30px_rgba(0,0,0,0.05)]">
          <NavLink
            to="/instructor/dashboard"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[11px] font-bold transition-all ${
                isActive ? 'text-brand-green' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            <FaTachometerAlt size={18} />
            <span>Dashboard</span>
          </NavLink>

          <Link
            to="/"
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center gap-1 text-[11px] font-bold text-gray-400 hover:text-gray-600 transition-all"
          >
            <FaExternalLinkAlt size={16} />
            <span>Public Site</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-600 transition-all cursor-pointer"
          >
            <FaSignOutAlt size={17} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Mobile Slide-Out Drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div 
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
              className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl z-10 flex flex-col p-5 overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="SDF Logo" className="h-9 w-auto" />
                  <div className="flex flex-col">
                    <span className="font-black text-xs text-brand-green-dark">INSTRUCTOR PANEL</span>
                    <span className="text-[9px] text-gray-400 uppercase font-bold">Faculty Hub</span>
                  </div>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
                >
                  <FaTimes size={13} />
                </button>
              </div>

              {/* Profile Card in Drawer */}
              <div className="p-4 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl mb-5 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-brand-green text-white flex items-center justify-center font-black text-lg shadow-sm">
                    {instructor.name ? instructor.name.charAt(0).toUpperCase() : 'I'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-extrabold text-sm text-gray-900 truncate">{instructor.name || 'Instructor'}</div>
                    <div className="text-xs text-emerald-800 font-bold truncate">{instructor.speciality || 'Yoga Guru'}</div>
                  </div>
                </div>
                {instructor.emailOrPhone && (
                  <div className="text-[11px] text-gray-500 truncate pt-1 border-t border-emerald-100">
                    📧 {instructor.emailOrPhone}
                  </div>
                )}
                {instructor.phone && (
                  <div className="text-[11px] text-gray-500 truncate">
                    📞 {instructor.phone}
                  </div>
                )}
              </div>

              {/* Navigation Items */}
              <div className="space-y-1 flex-1">
                <NavLink
                  to="/instructor/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                      isActive ? 'bg-brand-green text-white shadow-sm' : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <FaTachometerAlt />
                  <span>Guru Dashboard</span>
                </NavLink>

                <Link
                  to="/"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                >
                  <FaExternalLinkAlt />
                  <span>Public Courses ↗</span>
                </Link>
              </div>

              {/* Drawer Footer Sign Out */}
              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={handleLogout}
                  className="w-full py-3 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <FaSignOutAlt />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default InstructorLayout;
