import React, { useState, useEffect } from 'react';
import { FaUser, FaQuestionCircle, FaBell, FaVideo, FaGraduationCap, FaChevronRight, FaWhatsapp } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';

const MyLearning = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [upcomingClass, setUpcomingClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Fetch enrolled courses
      const coursesRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/payments/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Fetch all classes
      const classesRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/classes/student`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (coursesRes.data.success) {
        const fetchedCourses = coursesRes.data.data.map(enrollment => {
          return {
            id: enrollment._id,
            courseId: enrollment.course?._id,
            title: enrollment.course?.title || 'Unknown Course',
            category: enrollment.course?.category || 'General',
            image: enrollment.course?.thumbnailUrl || '',
            whatsappGroupLink: enrollment.course?.whatsappGroupLink || '',
            progress: Math.floor(Math.random() * 60) + 10 // Mock progress
          };
        });
        setCourses(fetchedCourses);
      }

      if (classesRes.data.success) {
        const now = new Date();
        const futureClasses = classesRes.data.data.filter(cls => {
          const classTime = new Date(`${cls.date.split('T')[0]}T${cls.time}:00`);
          return classTime > now;
        }).sort((a, b) => {
          const aTime = new Date(`${a.date.split('T')[0]}T${a.time}:00`);
          const bTime = new Date(`${b.date.split('T')[0]}T${b.time}:00`);
          return aTime - bTime;
        });

        if (futureClasses.length > 0) {
          setUpcomingClass(futureClasses[0]);
        }
      }

    } catch (err) {
      console.error('Error fetching learning data:', err);
      setError('Failed to load your learning data.');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Yoga': 'bg-[#f4efe6] text-amber-800',
      'Meditation': 'bg-[#e9f1e8] text-green-800',
      'General': 'bg-[#e8ebf4] text-blue-800'
    };
    return colors[category] || colors['General'];
  };

  return (
    <div className="min-h-screen bg-[#F9F7F5] pb-24 md:pb-8 pt-20 md:pt-8">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-6">
        
        {loading ? (
           <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div></div>
        ) : error ? (
           <div className="text-center text-red-500 p-4">{error}</div>
        ) : (
          <div className="space-y-6">
            
            {/* Upcoming Class Card */}
            <div className="bg-[#f5f4ef] rounded-2xl p-6 md:p-8 border border-[#e6e2d3] flex flex-col md:flex-row items-center justify-between shadow-sm relative overflow-hidden max-w-4xl mx-auto w-full gap-6">
              <div className="absolute top-0 left-0 w-full md:w-2 md:h-full h-1 md:bg-gradient-to-b bg-gradient-to-r from-yellow-300 to-yellow-500"></div>
              
              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <h2 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-widest">Upcoming Class</h2>
                {upcomingClass ? (
                  <>
                    <h3 className="text-xl md:text-2xl font-black text-gray-800 line-clamp-1">{upcomingClass.title || upcomingClass.courseId?.title}</h3>
                    <div className="flex items-center justify-center md:justify-start gap-2 mt-2 text-sm font-medium text-gray-600">
                      <FaVideo className="text-yellow-500"/>
                      <span>{new Date(`${upcomingClass.date.split('T')[0]}T${upcomingClass.time}:00`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      <span className="w-px h-3 bg-gray-300 mx-1"></span>
                      <span>{new Date(upcomingClass.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </>
                ) : (
                  <div className="py-2 text-gray-500 font-medium">No upcoming classes scheduled.</div>
                )}
              </div>

              {upcomingClass && (
                <a 
                  href={upcomingClass.zoomLink || '#'} 
                  target={upcomingClass.zoomLink ? "_blank" : "_self"}
                  className={`bg-[#fcd536] hover:bg-[#f6cd24] text-gray-900 font-bold px-8 py-3.5 rounded-full text-lg shadow-[0_4px_15px_rgba(252,213,54,0.3)] transition-all hover:scale-105 flex items-center gap-2 whitespace-nowrap ${!upcomingClass.zoomLink && 'opacity-70 cursor-not-allowed'}`}
                >
                  Join Now
                </a>
              )}
            </div>

            <div className="pt-4">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2"><FaGraduationCap className="text-yellow-500" /> My Enrolled Courses</h2>
              {/* Course Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {courses.map((course, index) => {
                  const colors = getCategoryColor(course.category);
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
                      key={course.id}
                      className="bg-white rounded-[20px] border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col relative group"
                    >
                      {/* Top colored banner */}
                      <div className={`${colors} px-5 py-3 flex justify-between items-center border-b border-white/50`}>
                        <span className="font-bold text-sm tracking-tight">{course.category}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wide opacity-80 flex items-center gap-1 bg-white/30 px-2 py-0.5 rounded-full">
                          Enrolled
                        </span>
                      </div>

                      {/* Content */}
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-14 h-14 rounded-xl bg-gray-50 shrink-0 overflow-hidden border border-gray-100 flex items-center justify-center">
                            {course.image ? <img src={course.image.startsWith('http') ? course.image : `${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}/${course.image.replace(/\\/g, '/')}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <FaGraduationCap className="text-gray-300 size-6" />}
                          </div>
                          <div className="flex-1 min-w-0 pt-1">
                            <h3 className="text-lg font-black text-gray-800 leading-snug line-clamp-2">{course.title}</h3>
                          </div>
                        </div>

                        <div className="mt-auto pt-4 border-t border-gray-50">
                          <div className="flex justify-between items-center mb-2">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Progress</div>
                            <div className="text-sm font-bold text-gray-700">{course.progress}%</div>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 mb-6">
                            <div className="bg-[#fcd536] h-1.5 rounded-full" style={{ width: `${course.progress}%` }}></div>
                          </div>

                          <div className="flex gap-2">
                            <button 
                              onClick={() => navigate(`/dashboard/learning/${course.courseId}`)}
                              className="flex-1 bg-[#fcd536] hover:bg-[#f6cd24] text-gray-900 font-bold px-3 py-3 rounded-xl text-xs sm:text-sm shadow-sm transition-transform active:scale-95 flex justify-center items-center gap-1.5 cursor-pointer"
                            >
                              <span>View Classes</span> <FaChevronRight className="text-[10px]" />
                            </button>

                            {course.whatsappGroupLink && (
                              <a
                                href={course.whatsappGroupLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-3 bg-[#25D366] hover:bg-[#1ebc59] text-white rounded-xl shadow-xs transition-transform active:scale-95 flex items-center justify-center cursor-pointer"
                                title="Join Batch WhatsApp Group"
                              >
                                <FaWhatsapp size={17} />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                
                {courses.length === 0 && (
                  <div className="col-span-full text-center p-12 bg-white rounded-2xl border border-dashed border-gray-300 text-gray-500 font-medium">
                    You haven't enrolled in any courses yet.
                  </div>
                )}
              </div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
};

export default MyLearning;
