import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaGraduationCap, FaClock, FaAward, FaPlay, FaChevronRight, FaBookOpen, FaUser, FaVideo, FaCalendarAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Home = () => {
  const [user, setUser] = useState(null);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [upcomingClass, setUpcomingClass] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {}
      }
    };
    loadUser();
    window.addEventListener('storage', loadUser);
    window.addEventListener('user-updated', loadUser);

    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Fetch enrolled courses
        const coursesRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/payments/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (coursesRes.data.success) {
          setEnrolledCount(coursesRes.data.data.length);
        }

        // Fetch classes
        try {
          const classesRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/classes/student`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (classesRes.data && classesRes.data.success && Array.isArray(classesRes.data.data)) {
            const now = new Date();
            const futureClasses = classesRes.data.data.filter(cls => {
              if (!cls || !cls.date) return false;
              try {
                const classTime = new Date(`${String(cls.date).split('T')[0]}T${cls.time || '00:00'}:00`);
                return classTime > now;
              } catch (e) {
                return false;
              }
            }).sort((a, b) => {
              try {
                const aTime = new Date(`${String(a.date).split('T')[0]}T${a.time || '00:00'}:00`);
                const bTime = new Date(`${String(b.date).split('T')[0]}T${b.time || '00:00'}:00`);
                return aTime - bTime;
              } catch (e) {
                return 0;
              }
            });
            if (futureClasses.length > 0) setUpcomingClass(futureClasses[0]);
          }
        } catch (e) {}
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();

    return () => {
      window.removeEventListener('storage', loadUser);
      window.removeEventListener('user-updated', loadUser);
    };
  }, []);

  const isClassLive = (cls) => {
    if (!cls || !cls.date) return false;
    try {
      const now = new Date();
      const rawDate = String(cls.date).split('T')[0];
      let startH = 6, startM = 0;
      if (cls.time) {
        const match = cls.time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (match) {
          startH = parseInt(match[1], 10);
          startM = parseInt(match[2], 10);
          const ampm = match[3] ? match[3].toUpperCase() : null;
          if (ampm === 'PM' && startH < 12) startH += 12;
          if (ampm === 'AM' && startH === 12) startH = 0;
        }
      }
      const [y, m, d] = rawDate.split('-').map(Number);
      const sessionStart = new Date(y, m - 1, d, startH, startM, 0, 0);
      const joinWindowStart = new Date(sessionStart.getTime() - 2 * 60 * 1000);
      const duration = cls.durationMinutes || 60;
      const sessionEnd = new Date(sessionStart.getTime() + duration * 60 * 1000);
      return now >= joinWindowStart && now <= sessionEnd;
    } catch (e) {
      return false;
    }
  };

  const displayName = user?.name || user?.emailOrPhone?.split('@')[0] || 'Learner';

  const stats = [
    { label: 'Courses Enrolled', value: enrolledCount, icon: FaGraduationCap, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Hours Learned', value: '0', icon: FaClock, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Certificates Earned', value: '0', icon: FaAward, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  ];

  const liveNow = isClassLive(upcomingClass);

  return (
    <div className="min-h-screen bg-[#F8F9FA] pt-24 pb-20 md:pb-12 md:pt-28 px-4 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
              Welcome back, <span className="text-[#C08552]">{displayName}</span> <span className="inline-block animate-wave">👋</span>
            </h1>
            <p className="text-gray-500 mt-2 font-medium">Continue your journey of learning and growth.</p>
          </div>
          <button onClick={() => navigate('/courses')} className="bg-[#C08552] hover:bg-[#a06b3e] text-white px-6 py-2.5 rounded-full font-semibold shadow-sm transition-colors w-max cursor-pointer">
            Explore Courses
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              key={i} 
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div>
                <div className="text-2xl font-black text-gray-800">{stat.value}</div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-0.5">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area: Next Class Banner */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
              className="relative w-full rounded-3xl overflow-hidden shadow-md group bg-[#2D2D2D] p-8 md:p-10 text-white flex flex-col justify-between min-h-[280px]"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>
              <div className="absolute bottom-0 right-10 w-40 h-40 bg-[#C08552]/20 rounded-full blur-2xl pointer-events-none"></div>

              <div>
                <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-full w-max mb-4 border border-white/10">
                  <span className={`w-2 h-2 rounded-full ${liveNow ? 'bg-green-400 animate-ping' : 'bg-amber-400 animate-pulse'}`}></span>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    {liveNow ? 'LIVE CLASS IN PROGRESS' : 'UPCOMING CLASS'}
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-white max-w-lg leading-tight mb-2">
                  {upcomingClass ? (upcomingClass.title || upcomingClass.courseId?.title || 'Live Class Session') : 'Welcome to SDF Learning'}
                </h2>
                <p className="text-gray-300 max-w-md text-sm leading-relaxed mb-6">
                  {upcomingClass ? (
                    `Session scheduled on ${new Date(upcomingClass.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} at ${upcomingClass.time || '10:30 AM'}.`
                  ) : (
                    'Explore your registered courses and attend live interactive classes.'
                  )}
                </p>
              </div>

              <div className="pt-2">
                {liveNow ? (
                  <button 
                    onClick={() => upcomingClass?.zoomLink ? window.open(upcomingClass.zoomLink, '_blank') : navigate('/dashboard/learning')} 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 px-8 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center gap-2.5 animate-pulse cursor-pointer text-sm"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping"></span>
                    <FaPlay size={12}/> Join Live Session
                  </button>
                ) : (
                  <div className="flex items-center gap-3 flex-wrap">
                    <button 
                      disabled={true}
                      className="bg-white/10 text-gray-400 font-semibold py-3 px-6 rounded-full flex items-center gap-2 text-xs border border-white/15 cursor-not-allowed opacity-60 filter blur-[0.3px] select-none"
                    >
                      <FaVideo size={12} className="text-gray-400" />
                      <span>Join Live Session</span>
                    </button>
                    <span className="text-xs font-semibold text-amber-300 bg-amber-400/20 border border-amber-300/30 px-3 py-1.5 rounded-full">
                      🔒 Activates 2 minutes before class
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar Area: Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button onClick={() => navigate('/dashboard/learning')} className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-amber-50/50 transition-colors group border border-transparent hover:border-amber-100 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#C08552]/10 flex items-center justify-center text-[#C08552]">
                      <FaBookOpen size={16}/>
                    </div>
                    <span className="font-bold text-sm text-gray-700 group-hover:text-[#C08552] transition-colors">My Enrolled Courses</span>
                  </div>
                  <FaChevronRight className="text-gray-400 group-hover:text-[#C08552] text-xs"/>
                </button>
                
                <button onClick={() => navigate('/dashboard/certificates')} className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-emerald-50/50 transition-colors group border border-transparent hover:border-emerald-100 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                      <FaAward size={16}/>
                    </div>
                    <span className="font-bold text-sm text-gray-700 group-hover:text-emerald-800 transition-colors">My Certificates</span>
                  </div>
                  <FaChevronRight className="text-gray-400 group-hover:text-emerald-800 text-xs"/>
                </button>

                <button onClick={() => navigate('/dashboard/profile')} className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-100 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600">
                      <FaUser size={16}/>
                    </div>
                    <span className="font-bold text-sm text-gray-700 group-hover:text-gray-900 transition-colors">Profile & Settings</span>
                  </div>
                  <FaChevronRight className="text-gray-400 group-hover:text-gray-600 text-xs"/>
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Home;
