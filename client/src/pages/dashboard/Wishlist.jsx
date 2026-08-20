import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaHeart, FaTrash, FaGraduationCap, FaArrowRight, FaArrowLeft, FaCheck } from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    fetchWishlistAndEnrollments();
  }, []);

  const fetchWishlistAndEnrollments = async () => {
    try {
      const token = localStorage.getItem('token');
      const [wishRes, enrollRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/auth/wishlist`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/payments/history`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { success: false, data: [] } }))
      ]);

      if (wishRes.data.success) {
        setWishlist(wishRes.data.data);
      }
      if (enrollRes.data?.success) {
        const ids = enrollRes.data.data.map(p => (typeof p.course === 'object' ? p.course?._id : p.course));
        setEnrolledCourseIds(ids.filter(Boolean));
      }
    } catch (err) {
      console.error("Error fetching wishlist:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (courseId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/wishlist/toggle/${courseId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setWishlist(res.data.data);
      }
    } catch (err) {
      console.error("Error removing from wishlist:", err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 md:pb-8 px-4 md:px-0 font-inter">
      
      {/* Mobile Header */}
      <div className="flex items-center mb-6 mt-2 md:hidden">
        <button onClick={() => navigate(-1)} className="mr-4 text-brand-green-dark">
          <FaArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold text-brand-green-dark">My Wishlist</h1>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block mb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">My Wishlist</h1>
        <p className="text-gray-500 mt-1 text-base">Saved courses you're interested in taking.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : wishlist.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((course, idx) => {
            const isEnrolled = enrolledCourseIds.includes(course._id);
            return (
              <motion.div
                key={course._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
              >
                {/* Thumbnail */}
                <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
                  <img
                    src={course.thumbnailUrl || '/assets/course_yoga.png'}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-brand-green-dark/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    {course.category || 'Wellness'}
                  </div>
                  <button
                    onClick={() => handleRemove(course._id)}
                    className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-md hover:bg-red-50 text-red-500 rounded-full flex items-center justify-center shadow-sm transition-colors"
                    title="Remove from Wishlist"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-2">
                      <span className="text-brand-green font-bold uppercase">{course.level || 'Beginner'}</span>
                      <span>{course.accessValidity || '2 Months'} Access</span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg line-clamp-2 hover:text-brand-green transition-colors">
                      <Link to={`/courses/${course.slug || course._id}`}>
                        {course.title}
                      </Link>
                    </h3>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400 font-medium block">Course Fee</span>
                      <span className="text-xl font-extrabold text-gray-900">₹{course.price || 999}</span>
                    </div>

                    {isEnrolled ? (
                      <button
                        onClick={() => navigate(`/dashboard/learning/${course._id}`)}
                        className="px-4 py-2.5 bg-brand-green/10 text-brand-green-dark hover:bg-brand-green hover:text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
                      >
                        <FaCheck size={11} /> Enrolled
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(`/courses/${course.slug || course._id}`)}
                        className="px-5 py-2.5 bg-brand-green hover:bg-brand-green-dark text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-[0_4px_12px_rgba(41,120,56,0.25)]"
                      >
                        Enroll Now <FaArrowRight size={10} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm p-8 max-w-lg mx-auto">
          <div className="w-20 h-20 bg-red-50 text-red-400 rounded-full flex items-center justify-center text-3xl mx-auto mb-5">
            <FaHeart />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Your wishlist is empty</h3>
          <p className="text-gray-500 mb-8 text-sm">Explore our catalog of authentic yoga, pranayama, and meditation courses and bookmark your favorites!</p>
          <button
            onClick={() => navigate('/courses')}
            className="px-8 py-3.5 bg-brand-green hover:bg-brand-green-dark text-white font-bold rounded-2xl transition-all shadow-[0_4px_14px_rgba(41,120,56,0.3)] inline-flex items-center gap-2"
          >
            <FaGraduationCap size={16} /> Explore Courses
          </button>
        </div>
      )}
    </div>
  );
};

export default Wishlist;
