import React, { useState, useEffect } from 'react';
import { FaUser, FaQuestionCircle, FaBell, FaVideo, FaGraduationCap, FaChevronRight, FaWhatsapp, FaAward } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { getCourseImageUrl } from '../../utils/imageHelper';

const MyLearning = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [upcomingClass, setUpcomingClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTick, setCurrentTick] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTick(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const parseClassDateTime = (dateVal, timeVal) => {
    if (!dateVal) return null;
    try {
      const rawDate = typeof dateVal === 'string' 
        ? (dateVal.includes('T') ? dateVal.split('T')[0] : dateVal)
        : new Date(dateVal).toISOString().split('T')[0];
      const [y, m, d] = rawDate.split('-').map(Number);
      if (!y || !m || !d) return null;

      let startH = 6, startM = 0;
      if (timeVal) {
        const match = String(timeVal).match(/(\d{1,2}):(\d{2})/);
        if (match) {
          startH = parseInt(match[1], 10);
          startM = parseInt(match[2], 10);
          const isPM = /pm/i.test(timeVal);
          const isAM = /am/i.test(timeVal);
          if (isPM && startH < 12) startH += 12;
          if (isAM && startH === 12) startH = 0;
        }
      }
      return new Date(y, m - 1, d, startH, startM, 0, 0);
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // 1. Fetch enrolled courses
      try {
        const coursesRes = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/payments/history`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (coursesRes.data && coursesRes.data.success && Array.isArray(coursesRes.data.data)) {
          const fetchedCourses = coursesRes.data.data
            .filter(enrollment => enrollment && (enrollment.course || enrollment.courseId))
            .map(enrollment => {
              const courseObj = typeof enrollment.course === 'object' ? enrollment.course : {};
              
              // Dynamic progress calculation matching session dates
              const dates = courseObj.sessionDates || [];
              const classes = courseObj.classes || courseObj.sessions || [];
              const totalCount = dates.length > 0 ? dates.length : classes.length;
              let calcProgress = 0;
              let allFinished = false;

              if (totalCount > 0) {
                const now = new Date();
                let completedCount = 0;
                for (let idx = 0; idx < totalCount; idx++) {
                  const rawDate = dates[idx] || (classes[idx] && classes[idx].date) || courseObj.startDate;
                  if (rawDate) {
                    try {
                      const dateStr = String(rawDate).includes('T') ? String(rawDate).split('T')[0] : String(rawDate);
                      const [y, m, d] = dateStr.split('-').map(Number);
                      if (y && m && d) {
                        let startH = 6, startM = 0;
                        const timeStr = (classes[idx] && classes[idx].time) || courseObj.startTime || (courseObj.timings ? courseObj.timings.split(' to ')[0] : '06:00');
                        if (timeStr) {
                          const match = timeStr.trim().match(/(\d{1,2}):(\d{2})/);
                          if (match) {
                            startH = parseInt(match[1], 10);
                            startM = parseInt(match[2], 10);
                            if (timeStr.toLowerCase().includes('pm') && startH < 12) startH += 12;
                            if (timeStr.toLowerCase().includes('am') && startH === 12) startH = 0;
                          }
                        }
                        const sessionStart = new Date(y, m - 1, d, startH, startM, 0, 0);
                        const durMins = (classes[idx] && classes[idx].durationMinutes) || 60;
                        const sessionEnd = new Date(sessionStart.getTime() + durMins * 60 * 1000);
                        if (now > sessionEnd) {
                          completedCount++;
                        }
                      }
                    } catch (e) {}
                  }
                }
                allFinished = completedCount === totalCount && totalCount > 0;
                calcProgress = allFinished ? 100 : Math.round((completedCount / totalCount) * 100);
              } else if (typeof enrollment.progress === 'number' && enrollment.progress > 0) {
                calcProgress = enrollment.progress;
                allFinished = enrollment.completed || enrollment.progress >= 100;
              }

              return {
                id: enrollment._id,
                courseId: courseObj._id || enrollment.course,
                title: courseObj.title || 'Enrolled Course',
                category: courseObj.category || 'Vedic Sciences',
                image: courseObj.thumbnailUrl || courseObj.thumbnail || courseObj.image || '',
                whatsappGroupLink: courseObj.whatsappGroupLink || '',
                progress: calcProgress,
                completed: allFinished && Boolean(enrollment.certificateId),
                accessValidity: enrollment.accessValidity || courseObj.accessValidity || '2 Months',
                accessExpiryDate: enrollment.accessExpiryDate,
                isExpired: Boolean(enrollment.isExpired),
                validityLabel: enrollment.validityLabel || (courseObj.accessValidity ? `${courseObj.accessValidity} Access` : '2 Months Access')
              };
            });
          setCourses(fetchedCourses);
        }
      } catch (cErr) {
        console.error('Error fetching enrolled courses:', cErr);
      }

      // 2. Fetch all classes safely
      try {
        const classesRes = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/classes/student`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (classesRes.data && classesRes.data.success && Array.isArray(classesRes.data.data)) {
          const now = new Date();
          const futureClasses = classesRes.data.data.filter(cls => {
            if (!cls || !cls.date) return false;
            const sessionStart = parseClassDateTime(cls.date, cls.time);
            if (!sessionStart) return false;
            const duration = cls.durationMinutes || 60;
            const sessionEnd = new Date(sessionStart.getTime() + duration * 60 * 1000);
            return sessionEnd >= now;
          }).sort((a, b) => {
            const aTime = parseClassDateTime(a?.date, a?.time)?.getTime() || 0;
            const bTime = parseClassDateTime(b?.date, b?.time)?.getTime() || 0;
            return aTime - bTime;
          });

          if (futureClasses.length > 0) {
            setUpcomingClass(futureClasses[0]);
          }
        }
      } catch (clsErr) {
        console.warn('Optional classes fetch error:', clsErr);
      }

    } catch (err) {
      console.error('Error fetching learning data:', err);
      if (err?.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }
      setError('Failed to load your learning data. Please refresh or check your connection.');
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

  const isClassLive = (cls) => {
    if (!cls || !cls.date) return false;
    try {
      const sessionStart = parseClassDateTime(cls.date, cls.time);
      if (!sessionStart) return false;
      const now = new Date(currentTick);
      const joinWindowStart = new Date(sessionStart.getTime() - 2 * 60 * 1000);
      const duration = cls.durationMinutes || 60;
      const sessionEnd = new Date(sessionStart.getTime() + duration * 60 * 1000);
      return now >= joinWindowStart && now <= sessionEnd;
    } catch (e) {
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F7F5] pb-24 md:pb-8 pt-20 md:pt-8">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-6">
        
        {loading ? (
           <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div></div>
        ) : error ? (
           <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl shadow-sm border border-gray-100 text-center space-y-4">
             <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto text-xl font-bold">⚠️</div>
             <h3 className="font-bold text-gray-900 text-lg">Session Expired or Connection Error</h3>
             <p className="text-sm text-gray-500">{error}</p>
             <div className="flex justify-center gap-3 pt-2">
               <button
                 onClick={fetchData}
                 className="px-5 py-2.5 bg-brand-green text-white text-xs font-bold rounded-xl shadow-sm hover:opacity-90 transition-all"
               >
                 Retry Loading
               </button>
               <button
                 onClick={() => {
                   localStorage.removeItem('token');
                   localStorage.removeItem('user');
                   navigate('/login');
                 }}
                 className="px-5 py-2.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200 transition-all"
               >
                 Log In Again
               </button>
             </div>
           </div>
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
                      <span>{upcomingClass.time || '10:30 AM'}</span>
                      <span className="w-px h-3 bg-gray-300 mx-1"></span>
                      <span>{new Date(upcomingClass.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </>
                ) : (
                  <div className="py-2 text-gray-500 font-medium">No upcoming classes scheduled.</div>
                )}
              </div>

              {upcomingClass && (
                isClassLive(upcomingClass) ? (
                  <a 
                    href={upcomingClass.zoomLink || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-[#fcd536] hover:bg-[#f6cd24] text-gray-900 font-extrabold px-8 py-3.5 rounded-full text-base shadow-[0_4px_15px_rgba(252,213,54,0.3)] transition-all hover:scale-105 flex items-center gap-2 whitespace-nowrap animate-pulse cursor-pointer"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping inline-block"></span>
                    Join Now (Live)
                  </a>
                ) : (
                  <div className="flex flex-col items-center md:items-end gap-1.5">
                    <button 
                      disabled={true}
                      title={`Join button activates 2 minutes before ${upcomingClass.time || 'class starts'}`}
                      className="bg-gray-200/90 text-gray-400 font-bold px-8 py-3.5 rounded-full text-base shadow-none cursor-not-allowed flex items-center gap-2 whitespace-nowrap opacity-60 filter blur-[0.3px] select-none"
                    >
                      <FaVideo size={14} className="text-gray-400" />
                      Join Now
                    </button>
                    <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 border border-amber-300/70 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      STARTS 2M BEFORE
                    </span>
                  </div>
                )
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
                        {course.isExpired ? (
                          <span className="text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1 bg-red-600 text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                            Expired
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wide opacity-80 flex items-center gap-1 bg-white/30 px-2 py-0.5 rounded-full">
                            Enrolled
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex items-start gap-4 mb-3">
                          <div className="w-14 h-14 rounded-xl bg-gray-50 shrink-0 overflow-hidden border border-gray-100 flex items-center justify-center">
                            {course.image ? (
                              <img
                                src={getCourseImageUrl(course.image)}
                                alt={course.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <FaGraduationCap className="text-gray-300 size-6" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 pt-1">
                            <h3 className="text-lg font-black text-gray-800 leading-snug line-clamp-2">{course.title}</h3>
                          </div>
                        </div>

                        {/* Access Validity Badge */}
                        <div className="mb-3">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                            course.isExpired 
                              ? 'bg-red-50 text-red-700 border-red-200' 
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}>
                            <span>{course.isExpired ? '🔒' : '⏳'}</span>
                            <span>{course.validityLabel}</span>
                          </span>
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
                              className={`flex-1 font-bold px-3 py-3 rounded-xl text-xs sm:text-sm shadow-sm transition-transform active:scale-95 flex justify-center items-center gap-1.5 cursor-pointer ${
                                course.isExpired 
                                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200' 
                                  : 'bg-[#fcd536] hover:bg-[#f6cd24] text-gray-900'
                              }`}
                            >
                              <span>{course.isExpired ? 'View Course (Archived)' : 'View Classes'}</span> <FaChevronRight className="text-[10px]" />
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

                          {(course.progress === 100 && course.completed) && (
                            <button
                              onClick={() => navigate('/dashboard/certificates')}
                              className="w-full mt-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                            >
                              <FaAward className="text-amber-600" />
                              <span>Certificate Ready • View in Portal</span>
                            </button>
                          )}
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
