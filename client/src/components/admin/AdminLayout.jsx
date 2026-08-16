import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { FaTachometerAlt, FaBook, FaUsers, FaCalendarAlt, FaSignOutAlt, FaChalkboardTeacher } from 'react-icons/fa';
import { motion } from 'framer-motion';

const AdminLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: FaTachometerAlt },
    { name: 'Courses', path: '/admin/courses', icon: FaBook },
    { name: 'Classes', path: '/admin/classes', icon: FaChalkboardTeacher },
    { name: 'Users', path: '/admin/users', icon: FaUsers },
  ];

  return (
    <div className="flex h-screen bg-bg-cream font-inter overflow-hidden relative">

      {/* Desktop Sidebar (Hidden on Mobile) */}
      <aside className="hidden md:flex md:static inset-y-0 left-0 w-64 bg-white/90 backdrop-blur-2xl text-gray-800 flex-col shadow-[4px_0_24px_rgba(0,0,0,0.05)] z-30 shrink-0 border-r border-gray-200">
        <div className="h-20 flex items-center justify-center lg:justify-start px-6 border-b border-gray-200 bg-white/50 sticky top-0">
          <div className="flex items-center">
            <div className="p-1 rounded-lg">
              <img src="/logo.png" alt="SDF Logo" className="h-8 w-auto" />
            </div>
            <span className="ml-3 font-bold text-lg tracking-wider text-brand-green-dark hidden lg:block">ADMIN</span>
          </div>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-brand-green/10 text-brand-green-dark shadow-sm border-l-4 border-brand-green' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-brand-green hover:pl-5 border-l-4 border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={18} className={isActive ? "text-brand-green" : "text-gray-400"} />
                  <span className="font-medium text-sm tracking-wide">{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 bg-white/50">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <FaSignOutAlt size={18} />
            <span className="font-medium text-sm tracking-wide">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#fbf9f6] relative overflow-hidden">
        
        {/* Background decorations for glassmorphism refraction */}
        <div className="absolute top-[0%] right-[0%] w-[40%] h-[40%] bg-brand-green/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[0%] left-[0%] w-[50%] h-[50%] bg-[#d67b22]/10 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Top Header (Sticky) */}
        <header className="h-16 md:h-20 bg-white/60 backdrop-blur-xl border-b border-white/50 flex items-center justify-center md:justify-between px-4 md:px-8 z-20 shrink-0 shadow-[0_4px_30px_rgba(0,0,0,0.02)] sticky top-0">
          
          {/* Mobile centered logo */}
          <div className="md:hidden flex items-center justify-center">
            <img src="/logo.png" alt="SDF Logo" className="h-14 w-auto drop-shadow-sm" />
          </div>

          {/* Desktop Left side */}
          <div className="hidden md:flex items-center gap-3">
            <h2 className="text-lg md:text-xl font-bold text-gray-800">Swamy Dwija Foundation LMS</h2>
          </div>

          {/* Desktop Right side */}
          <div className="hidden md:flex items-center gap-3 md:gap-4">
            <span className="text-xs md:text-sm font-semibold text-brand-green-dark bg-brand-green/10 px-3 py-1.5 rounded-full border border-brand-green/20">Super Admin</span>
            <div className="w-10 h-10 rounded-full bg-brand-green/20 text-brand-green flex items-center justify-center font-bold">
              SA
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Mobile Bottom Navigation (Sticky) */}
      <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 md:hidden">
        <div className="flex justify-around items-center h-16 px-2">
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
                  <item.icon size={20} className={isActive ? 'text-brand-green' : ''} />
                  <span className={`text-[10px] font-semibold ${isActive ? 'text-brand-green' : ''}`}>
                    {item.name}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
      
    </div>
  );
};

export default AdminLayout;
