import React from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { FaTachometerAlt, FaBook, FaUsers, FaCalendarAlt, FaSignOutAlt, FaFolderOpen, FaExternalLinkAlt, FaShieldAlt, FaAward } from 'react-icons/fa';
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
    { name: 'Materials', path: '/admin/materials', icon: FaFolderOpen },
    { name: 'Certificates & Invoices', path: '/admin/records', icon: FaAward },
    { name: 'Users', path: '/admin/users', icon: FaUsers },
  ];

  return (
    <div className="flex h-screen bg-[#FAF7F2] font-inter overflow-hidden relative">

      {/* Desktop Sidebar (Hidden on Mobile) */}
      <aside className="hidden md:flex md:static inset-y-0 left-0 w-64 lg:w-72 bg-white/75 backdrop-blur-2xl text-gray-800 flex-col shadow-[4px_0_30px_rgba(0,0,0,0.03)] z-30 shrink-0 border-r border-white/60">
        <div className="h-20 flex items-center justify-between px-6 border-b border-gray-100/80 bg-white/40 sticky top-0">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="SDF Logo" className="h-9 w-auto object-contain drop-shadow-sm" />
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-wider text-brand-green-dark">SDF ADMIN</span>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Management Hub</span>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
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

          <div className="pt-6 px-3 mb-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Quick Links</div>
          <Link
            to="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3.5 px-4 py-3 rounded-2xl text-gray-600 hover:bg-white/80 hover:text-brand-green font-semibold transition-all text-sm group"
          >
            <FaExternalLinkAlt size={14} className="text-gray-400 group-hover:text-brand-green" />
            <span>View Public Site</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-100/80 bg-white/40">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-2xl text-red-500 hover:bg-red-50/80 hover:text-red-600 font-bold transition-all text-sm"
          >
            <FaSignOutAlt size={16} />
            <span>Logout Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#FAF7F2] relative overflow-hidden">
        
        {/* Ambient liquid background orbs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-green/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
        <div className="absolute top-1/2 left-1/3 w-[500px] h-[500px] bg-[#d67b22]/8 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#70a448]/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Header */}
        <header className="h-16 md:h-20 bg-white/70 backdrop-blur-xl border-b border-white/60 flex items-center justify-between px-4 md:px-8 z-20 shrink-0 shadow-[0_4px_30px_rgba(0,0,0,0.02)] sticky top-0">
          
          {/* Mobile centered logo */}
          <div className="md:hidden flex items-center justify-center w-full relative">
            <img src="/logo.png" alt="SDF Logo" className="h-12 w-auto drop-shadow-sm" />
          </div>

          {/* Desktop Left */}
          <div className="hidden md:flex items-center gap-3">
            <h2 className="text-base lg:text-lg font-extrabold text-gray-800 tracking-tight">Swamy Dwija Foundation Admin Portal</h2>
          </div>

          {/* Desktop Right */}
          <div className="hidden md:flex items-center gap-3 lg:gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50/90 border border-green-200/80 rounded-full text-green-800 text-xs font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
              <span>System Live</span>
            </div>
            <div className="flex items-center gap-2.5 pl-3 border-l border-gray-200/80">
              <div className="w-9 h-9 rounded-xl bg-brand-green text-white flex items-center justify-center font-black text-xs shadow-md">
                SA
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-900 leading-tight">Administrator</span>
                <span className="text-[10px] font-semibold text-gray-400">Super User</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 xl:p-10 pb-24 md:pb-10">
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
      </div>

      {/* Mobile Bottom Navigation (Sticky) */}
      <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t border-gray-200/80 shadow-[0_-4px_25px_rgba(0,0,0,0.06)] z-50 md:hidden">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  isActive ? 'text-brand-green font-bold' : 'text-gray-400 hover:text-gray-600 font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={20} className={isActive ? 'text-brand-green' : ''} />
                  <span className={`text-[10px] font-semibold ${isActive ? 'text-brand-green font-bold' : ''}`}>
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
