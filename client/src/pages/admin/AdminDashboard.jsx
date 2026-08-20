import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUsers, FaBookOpen, FaGraduationCap, FaVideo, FaRupeeSign, FaUserCircle, FaPlus, FaFolderOpen, FaArrowRight, FaCalendarCheck, FaClock } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    totalClasses: 0,
    totalRevenue: 0,
    recentActivity: [],
    upcomingClasses: []
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { 
      title: 'Total Revenue', 
      value: `₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`, 
      icon: FaRupeeSign, 
      gradient: 'from-emerald-500 to-green-600',
      iconBg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      subtitle: 'Verified course sales'
    },
    { 
      title: 'Active Students', 
      value: stats.totalUsers || 0, 
      icon: FaUsers, 
      gradient: 'from-orange-500 to-amber-600',
      iconBg: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
      subtitle: 'Registered learners'
    },
    { 
      title: 'Live Programs', 
      value: stats.totalCourses || 0, 
      icon: FaBookOpen, 
      gradient: 'from-blue-500 to-cyan-600',
      iconBg: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      subtitle: 'Published curricula'
    },
    { 
      title: 'Total Enrollments', 
      value: stats.totalEnrollments || 0, 
      icon: FaGraduationCap, 
      gradient: 'from-purple-500 to-indigo-600',
      iconBg: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      subtitle: 'Active course seats'
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-inter">
      
      {/* Top Banner with Glassmorphism */}
      <div className="bg-white/60 backdrop-blur-2xl rounded-[2.5rem] p-6 lg:p-8 border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-green/10 text-brand-green-dark text-xs font-bold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-brand-green"></span>
            Operational Intelligence
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">Admin Control Center</h1>
          <p className="text-gray-500 text-sm mt-1">Real-time enrollment trends, revenue tracking, and live Zoom schedule.</p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/admin/courses')}
            className="px-5 py-3 bg-brand-green hover:bg-brand-green-dark text-white rounded-2xl text-xs lg:text-sm font-bold shadow-[0_4px_16px_rgba(41,120,56,0.3)] transition-all flex items-center gap-2 group"
          >
            <FaPlus size={12} className="group-hover:rotate-90 transition-transform" />
            <span>Create Course</span>
          </button>
          <button
            onClick={() => navigate('/admin/materials')}
            className="px-5 py-3 bg-white/90 hover:bg-white text-gray-700 border border-gray-200/80 rounded-2xl text-xs lg:text-sm font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-2"
          >
            <FaFolderOpen className="text-brand-green" />
            <span>Upload Materials</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 lg:gap-6">
        {statCards.map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="bg-white/70 backdrop-blur-2xl rounded-[2rem] p-6 lg:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-white/80 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-300 group relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{card.title}</p>
                <h3 className="text-2xl lg:text-3xl font-black text-gray-900 mt-2 tracking-tight">{card.value}</h3>
                <p className="text-xs font-semibold text-gray-500 mt-1">{card.subtitle}</p>
              </div>
              <div className={`w-14 h-14 rounded-2xl ${card.iconBg} border flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-xs`}>
                <card.icon size={22} />
              </div>
            </div>
            {/* Subtle bottom gradient line */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
          </motion.div>
        ))}
      </div>

      {/* Grid: Recent Activity & Upcoming Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        
        {/* Recent Enrollments */}
        <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-white/80 p-6 lg:p-8 flex flex-col h-[480px]">
          <div className="flex items-center justify-between mb-6 shrink-0 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">Recent Enrollments</h2>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Learners joining live wellness programs</p>
            </div>
            <button 
              onClick={() => navigate('/admin/users')}
              className="text-xs font-bold text-brand-green hover:text-brand-green-dark flex items-center gap-1.5 transition-colors"
            >
              <span>View All Users</span>
              <FaArrowRight size={10} />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 pr-1.5 space-y-3.5 custom-scrollbar">
            {stats.recentActivity && stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 bg-white/80 rounded-2xl border border-gray-100/90 shadow-xs hover:shadow-md transition-all">
                  <div className="w-11 h-11 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center shrink-0 border border-brand-green/20 font-bold">
                    <FaUserCircle size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{activity.studentEmail}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      Course: <span className="font-semibold text-brand-green-dark">{activity.course?.title || 'Program Enrollment'}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-semibold text-gray-400 block">
                      {new Date(activity.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                    <span className="text-xs font-black text-brand-green bg-green-50 border border-green-200/60 px-2.5 py-0.5 rounded-full mt-1 inline-block">
                      +₹{activity.amountPaid || 0}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-400 italic py-16 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 h-full flex items-center justify-center">
                No recent enrollments recorded.
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Zoom Live Classes */}
        <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-white/80 p-6 lg:p-8 flex flex-col h-[480px]">
          <div className="flex items-center justify-between mb-6 shrink-0 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">Live Zoom Classes (Next 7 Days)</h2>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Automated schedule and instructor links</p>
            </div>
            <button 
              onClick={() => navigate('/admin/courses')}
              className="text-xs font-bold text-brand-green hover:text-brand-green-dark flex items-center gap-1.5 transition-colors"
            >
              <span>Manage Sessions</span>
              <FaArrowRight size={10} />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 pr-1.5 space-y-3.5 custom-scrollbar">
            {stats.upcomingClasses && stats.upcomingClasses.length > 0 ? (
              stats.upcomingClasses.map((cls, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 bg-white/80 rounded-2xl border border-gray-100/90 shadow-xs hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex flex-col items-center justify-center shrink-0 border border-blue-100 font-bold">
                    <span className="text-[10px] uppercase tracking-wider">{new Date(cls.date).toLocaleString('en-US', { month: 'short' })}</span>
                    <span className="text-base font-black leading-tight">{new Date(cls.date).getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-sm truncate">{cls.title || cls.courseId?.title}</h4>
                    <div className="flex items-center gap-3 text-xs font-medium text-gray-500 mt-1">
                      <span className="flex items-center gap-1 text-brand-green"><FaClock size={11} /> {cls.time}</span>
                      {cls.meetingId && <span className="text-[11px] text-gray-400 font-mono">ID: {cls.meetingId}</span>}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {cls.zoomLink ? (
                      <a 
                        href={cls.zoomLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <FaVideo size={11} /> Launch
                      </a>
                    ) : (
                      <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-xl">No Link</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-400 italic py-16 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 h-full flex items-center justify-center">
                No classes scheduled for the next 7 days.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;
