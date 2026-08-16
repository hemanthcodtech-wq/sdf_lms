import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaImage } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';

const MyLearning = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('In Progress');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const tabs = ['In Progress', 'Completed', 'Wishlisted'];

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const fetchMyCourses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/payments/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        // Map enrollments to course format
        const fetchedCourses = data.data.map(enrollment => {
          // Since progress isn't tracked in backend yet, we'll assign a random one for UI visualization, 
          // or you could store this in the Enrollment model later.
          const mockProgress = Math.floor(Math.random() * 60) + 10; 
          
          return {
            id: enrollment._id,
            courseId: enrollment.course?._id,
            title: enrollment.course?.title || 'Unknown Course',
            category: enrollment.course?.category || 'General',
            image: enrollment.course?.thumbnailUrl || '',
            progress: mockProgress, 
            status: enrollment.paymentStatus
          };
        });
        
        setCourses(fetchedCourses);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load your learning data.');
    } finally {
      setLoading(false);
    }
  };

  // Filter based on tabs (For now everything goes to In Progress since we mock progress)
  // In a real app, you'd filter by progress == 100 for Completed, etc.
  const displayCourses = courses.filter(course => {
    if (activeTab === 'Completed') return false; // Mocking no completed courses for now
    if (activeTab === 'Wishlisted') return false; // Mocking no wishlisted courses for now
    return true; // All fetched go to In Progress
  });

  return (
    <div className="min-h-screen bg-bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12 flex flex-col h-full">
        
        {/* Mobile Header */}
        <div className="flex md:hidden items-center mb-6 mt-2">
          <button onClick={() => navigate(-1)} className="mr-4 text-brand-green">
            <FaArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-brand-green">My Learning</h1>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block mb-10 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-brand-green-dark mb-4 tracking-tight">My Learning</h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Track your progress and continue your journey.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-between md:justify-center md:gap-12 border-b border-gray-200 mb-8 max-w-3xl mx-auto w-full z-10">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-2 text-sm md:text-base font-semibold transition-colors relative ${
                activeTab === tab
                  ? 'text-brand-green'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div 
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 w-full h-0.5 md:h-1 bg-brand-green rounded-t-md" 
                />
              )}
            </button>
          ))}
        </div>

        {/* Course List */}
        <div className="flex-1 pb-20 z-10">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 mt-10 p-4 bg-red-50 rounded-xl max-w-md mx-auto border border-red-100">
              {error}
            </div>
          ) : displayCourses.length === 0 ? (
            <div className="text-center bg-white/40 backdrop-blur-md rounded-3xl p-10 max-w-md mx-auto shadow-sm border border-white">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaImage className="text-gray-400" size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">No courses here</h3>
              <p className="text-gray-500 text-sm mb-6">You haven't enrolled in any courses yet.</p>
              <button 
                onClick={() => navigate('/courses')}
                className="bg-brand-green text-white px-6 py-2.5 rounded-full font-medium hover:bg-brand-green-dark transition-colors shadow-sm"
              >
                Browse Classes
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {displayCourses.map((course, index) => (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  key={course.id} 
                  onClick={() => course.courseId && navigate(`/courses/${course.courseId}`)}
                  className="bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_4px_20px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-[20px] p-3 md:p-4 flex flex-row md:flex-col gap-4 h-32 md:h-auto items-center md:items-stretch cursor-pointer transition-all duration-300 hover:-translate-y-1 group"
                >
                  {/* Image */}
                  <div className="h-full w-28 md:w-full md:h-48 rounded-xl md:rounded-[16px] overflow-hidden flex-shrink-0 bg-gray-100 relative">
                    {course.image ? (
                      <img 
                        src={course.image.startsWith('http') ? course.image : `${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}/${course.image.replace(/\\/g, '/')}`}
                        onError={(e) => { e.target.onerror = null; e.target.src = course.image; }} // Fallback
                        alt={course.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <FaImage size={24} />
                      </div>
                    )}
                    <div className="hidden md:block absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] font-bold text-brand-green uppercase tracking-wide">
                      {course.category}
                    </div>
                  </div>
                  
                  {/* Details */}
                  <div className="flex flex-col justify-center md:justify-start flex-1 h-full py-1 md:pt-2 md:px-1">
                    <h3 className="font-bold text-gray-900 text-[15px] md:text-[18px] mb-2 md:mb-4 leading-tight group-hover:text-brand-green transition-colors">{course.title}</h3>
                    
                    <div className="mt-auto w-full">
                      <div className="flex justify-between items-end mb-2">
                        <p className="text-[11px] md:text-[13px] text-gray-500 font-semibold">{course.progress}% Complete</p>
                        <span className="text-xs md:text-[14px] font-black text-gray-800">{course.progress}%</span>
                      </div>
                      <div className="h-1.5 md:h-2 bg-[#f0f0f0] rounded-full w-full overflow-hidden shadow-inner">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${course.progress}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-brand-green rounded-full" 
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyLearning;
