import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaGraduationCap, FaClock, FaAward, FaPlay, FaChevronRight, FaBookOpen, FaUser } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Home = () => {
  const [user, setUser] = useState(null);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [upcomingClass, setUpcomingClass] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

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
  }, []);

  const displayName = user?.name || user?.emailOrPhone?.split('@')[0] || 'Learner';

  const stats = [
    { label: 'Courses Enrolled', value: enrolledCount, icon: FaGraduationCap, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Hours Learned', value: '0', icon: FaClock, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Certificates Earned', value: '0', icon: FaAward, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] pt-24 pb-20 md:pb-12 md:pt-28 px-4 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
              Welcome back, <span className="text-[#C08552]">{displayName}</span> <span className="inline-block animate-wave">👋</span>
            </h1>
            <p className="text-gray-500 mt-2 font-medium">Continue your journey of learning and growth.</p>
          </div>
          <button onClick={() => navigate('/courses')} className="bg-[#C08552] hover:bg-[#a06b3e] text-white px-6 py-2.5 rounded-full font-semibold shadow-sm transition-colors w-max">
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
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Hero / Next Class Banner */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
              className="relative w-full h-[280px] md:h-[320px] rounded-3xl overflow-hidden shadow-md group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent z-10"></div>
              {/* Replace with a solid dynamic pattern if no image is available, or use a default one */}
              <div className="absolute inset-0 bg-[#2D2D2D] w-full h-full">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="absolute bottom-0 right-10 w-40 h-40 bg-[#C08552]/20 rounded-full blur-2xl"></div>
              </div>
              
              <div className="absolute inset-0 z-20 p-8 md:p-10 flex flex-col justify-center text-left">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full w-max mb-4 border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Up Next</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white max-w-lg leading-tight mb-2">
                  {upcomingClass ? (upcomingClass.title || upcomingClass.course?.title || 'Live Class Session') : 'Welcome to SDF Learning'}
                </h2>
                <p className="text-gray-300 mb-8 max-w-md line-clamp-2">
                  {upcomingClass ? `Join your upcoming session on ${new Date(upcomingClass.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} at ${upcomingClass.time}.` : 'Explore our catalog and start a new journey today.'}
                </p>
                
                <button 
                  onClick={() => upcomingClass?.zoomLink ? window.open(upcomingClass.zoomLink, '_blank') : navigate('/dashboard/learning')} 
                  className="bg-[#C08552] hover:bg-[#a06b3e] text-white font-bold py-3 px-8 rounded-full shadow-lg w-max transition-transform hover:scale-105 flex items-center gap-2"
                >
                  <FaPlay size={12}/> {upcomingClass?.zoomLink ? 'Join Live Session' : 'Go to Classes'}
                </button>
              </div>
            </motion.div>

          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            
            {/* Resume Learning Card */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Resume Learning</h3>
              </div>

              <div className="group cursor-pointer">
                <div className="w-full h-32 rounded-xl bg-gray-100 overflow-hidden mb-4 relative">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors z-10"></div>
                  <div className="w-full h-full bg-[#E5D9C5] flex items-center justify-center">
                    <FaBookOpen className="text-[#C08552] opacity-50" size={40}/>
                  </div>
                  <div className="absolute inset-0 z-20 flex items-center justify-center">
                    <div className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                      <FaPlay className="text-[#C08552] ml-1" size={14}/>
                    </div>
                  </div>
                </div>
                <h4 className="font-bold text-gray-800 text-base leading-tight mb-1 group-hover:text-[#C08552] transition-colors">Mindfulness Fundamentals</h4>
                <p className="text-xs text-gray-500 mb-3">Module 3: Breathing Techniques</p>
                
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#C08552] rounded-full" style={{ width: '65%' }}></div>
                  </div>
                  <span className="text-xs font-bold text-gray-700">65%</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button onClick={() => navigate('/dashboard/learning')} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#C08552]/10 flex items-center justify-center text-[#C08552]">
                      <FaBookOpen size={16}/>
                    </div>
                    <span className="font-semibold text-gray-700 group-hover:text-[#C08552] transition-colors">My Courses</span>
                  </div>
                  <FaChevronRight className="text-gray-400 group-hover:text-[#C08552] text-xs"/>
                </button>
                
                <button onClick={() => navigate('/dashboard/profile')} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                      <FaUser size={16}/>
                    </div>
                    <span className="font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">Edit Profile</span>
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
