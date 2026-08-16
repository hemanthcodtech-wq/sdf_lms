import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUsers, FaBookOpen, FaGraduationCap, FaVideo, FaDollarSign, FaUserCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';

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
    { title: 'Total Revenue', value: `$${stats.totalRevenue}`, icon: FaDollarSign, color: 'bg-[#0a4f2a]', bg: 'bg-[#0a4f2a]/10', text: 'text-[#0a4f2a]' },
    { title: 'Total Students', value: stats.totalUsers, icon: FaUsers, color: 'bg-[#d67b22]', bg: 'bg-[#d67b22]/10', text: 'text-[#d67b22]' },
    { title: 'Total Courses', value: stats.totalCourses, icon: FaBookOpen, color: 'bg-[#70a448]', bg: 'bg-[#70a448]/10', text: 'text-[#70a448]' },
    { title: 'Enrollments', value: stats.totalEnrollments, icon: FaGraduationCap, color: 'bg-[#297838]', bg: 'bg-[#297838]/10', text: 'text-[#297838]' },
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-full"><div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6">
      
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>
        <p className="text-gray-500 mt-1">Here is the latest data for your LMS platform.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/60 backdrop-blur-2xl rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 flex items-center justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
          >
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{card.title}</p>
              <h3 className="text-3xl font-bold text-gray-800">{card.value}</h3>
            </div>
            <div className={`w-14 h-14 rounded-[1.25rem] ${card.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-white/40 shadow-sm`}>
              <card.icon size={24} className={card.text} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white/60 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-8 flex flex-col h-[400px]">
          <h2 className="text-lg font-bold text-gray-800 mb-4 shrink-0">Recent Activity</h2>
          <div className="overflow-y-auto flex-1 pr-2">
            {stats.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {stats.recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 bg-white/70 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                    <div className="w-10 h-10 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center shrink-0">
                      <FaUserCircle size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{activity.studentEmail}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Enrolled in <span className="font-semibold text-brand-green-dark">{activity.course?.title}</span></p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-gray-400 block">{new Date(activity.createdAt).toLocaleDateString()}</span>
                      <span className="text-[10px] font-bold text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-md uppercase mt-1 inline-block">+${activity.amountPaid}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic py-8 text-center bg-white/40 backdrop-blur-md rounded-xl border border-dashed border-gray-300/50 h-full flex items-center justify-center">
                No recent activity to display.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-8 flex flex-col h-[400px]">
          <h2 className="text-lg font-bold text-gray-800 mb-4 shrink-0">Upcoming Classes (Zoom)</h2>
          <div className="overflow-y-auto flex-1 pr-2">
            {stats.upcomingClasses && stats.upcomingClasses.length > 0 ? (
              <div className="space-y-4">
                {stats.upcomingClasses.map((cls, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 bg-white/70 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex flex-col items-center justify-center shrink-0 border border-blue-100 font-bold">
                      <span className="text-xs">{new Date(cls.date).toLocaleString('default', { month: 'short' })}</span>
                      <span className="text-lg leading-tight">{new Date(cls.date).getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-800 truncate">{cls.title || cls.courseId?.title}</h4>
                      <p className="text-xs font-medium text-gray-500 mt-1 flex items-center gap-1.5"><FaVideo className="text-gray-400" /> {cls.time}</p>
                    </div>
                    <div className="shrink-0 pt-2">
                      {cls.zoomLink ? (
                        <a href={cls.zoomLink} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors">Join</a>
                      ) : (
                        <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg">No Link</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic py-8 text-center bg-white/40 backdrop-blur-md rounded-xl border border-dashed border-gray-300/50 h-full flex items-center justify-center">
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
