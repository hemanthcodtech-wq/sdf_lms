import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaClock, FaVideo, FaExclamationCircle } from 'react-icons/fa';

const StudentClasses = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyClasses();
  }, []);

  const fetchMyClasses = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/classes/student`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setClasses(res.data.data);
    } catch (err) {
      console.error("Error fetching student classes:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8 max-w-5xl mx-auto px-4 md:px-0">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">My Live Schedule</h1>
        <p className="text-gray-500 mt-2">Upcoming live sessions for your enrolled courses.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : classes.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pt-4">
          {classes.map((cls, index) => {
            const classDate = new Date(`${cls.date.split('T')[0]}T${cls.time}:00`);
            const isToday = new Date().toDateString() === classDate.toDateString();
            
            return (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                key={cls._id} 
                className="bg-white rounded-[24px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col group"
              >
                {/* Header Image Area */}
                <div className="h-32 bg-brand-green/10 relative overflow-hidden flex-shrink-0">
                  {cls.courseId?.thumbnailUrl ? (
                    <img src={cls.courseId.thumbnailUrl} alt={cls.courseId.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-green/20 to-brand-green/5"></div>
                  )}
                  {isToday && (
                    <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md animate-pulse">
                      Today
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="p-6 flex-1 flex flex-col">
                  <span className="text-brand-green text-xs font-bold uppercase tracking-wider mb-2 block">{cls.courseId?.category || 'General'}</span>
                  <h3 className="text-xl font-bold text-gray-900 leading-tight mb-4">{cls.title || cls.courseId?.title}</h3>
                  
                  <div className="space-y-3 mb-6 flex-1">
                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-brand-green"><FaCalendarAlt /></div>
                      <span className="font-medium text-sm">{new Date(cls.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-brand-green"><FaClock /></div>
                      <span className="font-medium text-sm">{cls.time} ({cls.durationMinutes} mins)</span>
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <div className="mt-auto">
                    {cls.zoomLink ? (
                      <a 
                        href={cls.zoomLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(41,120,56,0.39)] flex justify-center items-center gap-2"
                      >
                        <FaVideo /> Join Live Class
                      </a>
                    ) : (
                      <div className="w-full bg-gray-100 text-gray-500 font-bold py-3.5 rounded-xl flex justify-center items-center gap-2 cursor-not-allowed">
                        Link Not Available
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm mt-4">
          <div className="w-20 h-20 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
            <FaExclamationCircle />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">No upcoming classes</h3>
          <p className="text-gray-500 max-w-md mx-auto">You don't have any scheduled live sessions for the courses you are currently enrolled in.</p>
        </div>
      )}
    </div>
  );
};

export default StudentClasses;
