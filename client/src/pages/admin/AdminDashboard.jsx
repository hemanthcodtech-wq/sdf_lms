import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaUsers, FaBookOpen, FaGraduationCap, FaVideo, FaRupeeSign, 
  FaUserCircle, FaPlus, FaFolderOpen, FaArrowRight, FaCalendarCheck, 
  FaClock, FaSlidersH, FaCheckCircle, FaTimes, FaSave, FaGlobe, FaAward,
  FaFileContract, FaPhoneAlt, FaEnvelope
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
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

  // Public Stats Modal State
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [publicStats, setPublicStats] = useState({
    studentsCount: 5000,
    studentsSuffix: '+',
    studentsLabel: 'Transformed Seekers',
    coursesCount: 25,
    coursesSuffix: '+',
    coursesLabel: 'Master Curricula',
    instructorsCount: 15,
    instructorsSuffix: '+',
    instructorsLabel: 'Expert Gurus',
    satisfactionRate: 99,
    satisfactionSuffix: '%',
    satisfactionLabel: 'Satisfaction',
    communitiesCount: 15,
    communitiesSuffix: '+',
    communitiesLabel: 'Global Communities',
    lineageRate: 100,
    lineageSuffix: '%',
    lineageLabel: 'Authentic Vedic Lineage'
  });
  const [savingStats, setSavingStats] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Policy & Support Contact State
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [activePolicyTab, setActivePolicyTab] = useState('contact'); // 'contact' | 'terms' | 'privacy' | 'refund'
  const [policyData, setPolicyData] = useState({
    termsAndConditions: '',
    privacyPolicy: '',
    refundPolicy: '',
    contactPhone: '+91 98765 43210',
    contactEmail: 'support@sdflms.org'
  });
  const [savingPolicy, setSavingPolicy] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchPublicStats();
    fetchPolicies();
  }, []);

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

  const fetchPublicStats = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/settings/stats`);
      if (res.data.success && res.data.data) {
        setPublicStats(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching public stats", err);
    }
  };

  const fetchPolicies = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/settings/policies`);
      if (res.data.success && res.data.data) {
        setPolicyData(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching policies", err);
    }
  };

  const handleSavePolicies = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSavingPolicy(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/admin/settings/policies`,
        policyData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        showToast('Legal policies & support contact updated successfully across Mobile App & Website!');
        setPolicyModalOpen(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating policies');
    } finally {
      setSavingPolicy(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleSavePublicStats = async (e) => {
    e.preventDefault();
    setSavingStats(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/admin/settings/stats`,
        publicStats,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        showToast('Public platform metrics updated successfully across Home & About pages!');
        setStatsModalOpen(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating platform stats');
    } finally {
      setSavingStats(false);
    }
  };

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

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-8 z-50 bg-brand-green text-white px-6 py-3.5 rounded-2xl shadow-2xl font-bold text-sm flex items-center gap-2 border border-brand-green-dark"
          >
            <FaCheckCircle className="text-yellow-300" /> {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
      
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
          
          {/* Edit Public Stats Button */}
          <button
            onClick={() => setStatsModalOpen(true)}
            className="px-4 py-3 bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-800 border border-amber-300 rounded-2xl text-xs lg:text-sm font-bold shadow-xs transition-all flex items-center gap-2"
            title="Edit public metrics shown on Home and About pages"
          >
            <FaSlidersH size={13} />
            <span>Edit Public Stats</span>
          </button>

          {/* Edit Policies & Support Contact Button */}
          <button
            onClick={() => setPolicyModalOpen(true)}
            className="px-4 py-3 bg-emerald-500/10 hover:bg-brand-green hover:text-white text-emerald-800 border border-emerald-300 rounded-2xl text-xs lg:text-sm font-bold shadow-xs transition-all flex items-center gap-2"
            title="Edit Terms, Privacy Policy, Refund Policy and Support Contact"
          >
            <FaFileContract size={13} />
            <span>Policies & Support Contact</span>
          </button>

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

      {/* 🌟 EDIT PUBLIC PLATFORM METRICS MODAL */}
      <AnimatePresence>
        {statsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-[2.5rem] max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-white/80 my-8 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center text-xl border border-amber-200">
                    <FaSlidersH />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900">Manage Public Platform Stats</h3>
                    <p className="text-xs text-gray-500">
                      Sync and edit metrics shown on Home & About pages (eliminates contradictions & errors).
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setStatsModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-all"
                >
                  <FaTimes size={13} />
                </button>
              </div>

              <form onSubmit={handleSavePublicStats} className="space-y-4">
                
                {/* Students Metric */}
                <div className="grid grid-cols-3 gap-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-100 items-center">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block">Students Count</label>
                    <input
                      type="number"
                      required
                      value={publicStats.studentsCount}
                      onChange={(e) => setPublicStats({ ...publicStats, studentsCount: Number(e.target.value) })}
                      className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-brand-green"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block">Suffix</label>
                    <input
                      type="text"
                      value={publicStats.studentsSuffix}
                      onChange={(e) => setPublicStats({ ...publicStats, studentsSuffix: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-brand-green"
                      placeholder="e.g. +"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block">Label</label>
                    <input
                      type="text"
                      value={publicStats.studentsLabel}
                      onChange={(e) => setPublicStats({ ...publicStats, studentsLabel: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-brand-green"
                      placeholder="e.g. Transformed Seekers"
                    />
                  </div>
                </div>

                {/* Courses Metric */}
                <div className="grid grid-cols-3 gap-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-100 items-center">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block">Courses Count</label>
                    <input
                      type="number"
                      required
                      value={publicStats.coursesCount}
                      onChange={(e) => setPublicStats({ ...publicStats, coursesCount: Number(e.target.value) })}
                      className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-brand-green"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block">Suffix</label>
                    <input
                      type="text"
                      value={publicStats.coursesSuffix}
                      onChange={(e) => setPublicStats({ ...publicStats, coursesSuffix: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-brand-green"
                      placeholder="e.g. +"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block">Label</label>
                    <input
                      type="text"
                      value={publicStats.coursesLabel}
                      onChange={(e) => setPublicStats({ ...publicStats, coursesLabel: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-brand-green"
                      placeholder="e.g. Master Curricula"
                    />
                  </div>
                </div>

                {/* Instructors Metric */}
                <div className="grid grid-cols-3 gap-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-100 items-center">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block">Instructors Count</label>
                    <input
                      type="number"
                      required
                      value={publicStats.instructorsCount}
                      onChange={(e) => setPublicStats({ ...publicStats, instructorsCount: Number(e.target.value) })}
                      className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-brand-green"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block">Suffix</label>
                    <input
                      type="text"
                      value={publicStats.instructorsSuffix}
                      onChange={(e) => setPublicStats({ ...publicStats, instructorsSuffix: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-brand-green"
                      placeholder="e.g. +"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block">Label</label>
                    <input
                      type="text"
                      value={publicStats.instructorsLabel}
                      onChange={(e) => setPublicStats({ ...publicStats, instructorsLabel: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-brand-green"
                      placeholder="e.g. Expert Gurus"
                    />
                  </div>
                </div>

                {/* Satisfaction Rate */}
                <div className="grid grid-cols-3 gap-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-100 items-center">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block">Satisfaction Rate</label>
                    <input
                      type="number"
                      required
                      value={publicStats.satisfactionRate}
                      onChange={(e) => setPublicStats({ ...publicStats, satisfactionRate: Number(e.target.value) })}
                      className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-brand-green"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block">Suffix</label>
                    <input
                      type="text"
                      value={publicStats.satisfactionSuffix}
                      onChange={(e) => setPublicStats({ ...publicStats, satisfactionSuffix: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-brand-green"
                      placeholder="e.g. %"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block">Label</label>
                    <input
                      type="text"
                      value={publicStats.satisfactionLabel}
                      onChange={(e) => setPublicStats({ ...publicStats, satisfactionLabel: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-brand-green"
                      placeholder="e.g. Satisfaction"
                    />
                  </div>
                </div>

                {/* Global Communities */}
                <div className="grid grid-cols-3 gap-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-100 items-center">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block">Communities Count</label>
                    <input
                      type="number"
                      required
                      value={publicStats.communitiesCount}
                      onChange={(e) => setPublicStats({ ...publicStats, communitiesCount: Number(e.target.value) })}
                      className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-brand-green"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block">Suffix</label>
                    <input
                      type="text"
                      value={publicStats.communitiesSuffix}
                      onChange={(e) => setPublicStats({ ...publicStats, communitiesSuffix: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-brand-green"
                      placeholder="e.g. +"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block">Label</label>
                    <input
                      type="text"
                      value={publicStats.communitiesLabel}
                      onChange={(e) => setPublicStats({ ...publicStats, communitiesLabel: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-brand-green"
                      placeholder="e.g. Global Communities"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setStatsModalOpen(false)}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingStats}
                    className="px-6 py-2.5 bg-brand-green hover:bg-brand-green-dark text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {savingStats ? (
                      <span>Saving...</span>
                    ) : (
                      <>
                        <FaSave size={12} />
                        <span>Save & Sync All Pages</span>
                      </>
                    )}
                  </button>
                </div>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Policies & Support Contact Modal */}
      <AnimatePresence>
        {policyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 lg:p-8 max-w-3xl w-full shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-green/10 flex items-center justify-center text-brand-green">
                    <FaFileContract size={18} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900">Legal Policies & Support Contact</h2>
                    <p className="text-xs text-gray-500">Live configuration for Terms, Privacy, Refund, and Phone/Email buttons in Mobile App & Website.</p>
                  </div>
                </div>
                <button
                  onClick={() => setPolicyModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <FaTimes size={18} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex flex-wrap gap-2 pt-4 pb-2 border-b border-gray-100">
                <button
                  type="button"
                  onClick={() => setActivePolicyTab('contact')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    activePolicyTab === 'contact'
                      ? 'bg-brand-green text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FaPhoneAlt size={11} /> Support Phone & Email
                </button>
                <button
                  type="button"
                  onClick={() => setActivePolicyTab('terms')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activePolicyTab === 'terms'
                      ? 'bg-brand-green text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Terms & Conditions
                </button>
                <button
                  type="button"
                  onClick={() => setActivePolicyTab('privacy')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activePolicyTab === 'privacy'
                      ? 'bg-brand-green text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Privacy Policy
                </button>
                <button
                  type="button"
                  onClick={() => setActivePolicyTab('refund')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activePolicyTab === 'refund'
                      ? 'bg-brand-green text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Refund Policy
                </button>
              </div>

              <form onSubmit={handleSavePolicies} className="space-y-4 pt-4">
                {/* Contact Tab */}
                {activePolicyTab === 'contact' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <p className="text-xs font-bold text-emerald-900 leading-relaxed">
                        These contact details are linked directly to the "Call Us" and "Email Us" buttons in the Mobile App and Website policy & help screens.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">
                          <FaPhoneAlt className="inline mr-1 text-brand-green" /> Support Phone Number
                        </label>
                        <input
                          type="text"
                          required
                          value={policyData.contactPhone}
                          onChange={(e) => setPolicyData({ ...policyData, contactPhone: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-brand-green"
                          placeholder="e.g. +91 98765 43210"
                        />
                        <span className="text-[11px] text-gray-400 mt-1 block">Clicking 'Call' opens dialer with this number</span>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">
                          <FaEnvelope className="inline mr-1 text-brand-green" /> Support Email Address
                        </label>
                        <input
                          type="email"
                          required
                          value={policyData.contactEmail}
                          onChange={(e) => setPolicyData({ ...policyData, contactEmail: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-brand-green"
                          placeholder="e.g. support@swamydwija.org"
                        />
                        <span className="text-[11px] text-gray-400 mt-1 block">Clicking 'Email' opens email compose to this address</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Terms Tab */}
                {activePolicyTab === 'terms' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 block">Terms & Conditions Content</label>
                    <textarea
                      rows={14}
                      value={policyData.termsAndConditions}
                      onChange={(e) => setPolicyData({ ...policyData, termsAndConditions: e.target.value })}
                      className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-mono text-gray-800 outline-none focus:border-brand-green focus:bg-white leading-relaxed"
                      placeholder="Enter Terms & Conditions..."
                    />
                  </div>
                )}

                {/* Privacy Tab */}
                {activePolicyTab === 'privacy' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 block">Privacy Policy Content</label>
                    <textarea
                      rows={14}
                      value={policyData.privacyPolicy}
                      onChange={(e) => setPolicyData({ ...policyData, privacyPolicy: e.target.value })}
                      className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-mono text-gray-800 outline-none focus:border-brand-green focus:bg-white leading-relaxed"
                      placeholder="Enter Privacy Policy..."
                    />
                  </div>
                )}

                {/* Refund Tab */}
                {activePolicyTab === 'refund' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 block">Refund & Cancellation Policy Content</label>
                    <textarea
                      rows={14}
                      value={policyData.refundPolicy}
                      onChange={(e) => setPolicyData({ ...policyData, refundPolicy: e.target.value })}
                      className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-mono text-gray-800 outline-none focus:border-brand-green focus:bg-white leading-relaxed"
                      placeholder="Enter Refund & Cancellation Policy..."
                    />
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setPolicyModalOpen(false)}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingPolicy}
                    className="px-6 py-2.5 bg-brand-green hover:bg-brand-green-dark text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {savingPolicy ? (
                      <span>Saving...</span>
                    ) : (
                      <>
                        <FaSave size={12} />
                        <span>Save & Publish to App and Web</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminDashboard;
