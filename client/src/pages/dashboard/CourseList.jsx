import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaSearch, FaUserTie, FaClock, FaSignal, FaImage, FaHeart, FaRegHeart } from 'react-icons/fa';
import { useLanguage, useAutoTranslate } from '../../context/LanguageContext';
import SEO from '../../components/common/SEO';
import { getCourseImageUrl } from '../../utils/imageHelper';

// Sub-component so useAutoTranslate hook can be called per card
const CourseCard = ({ course, isEnrolled, isWishlisted, onToggleWishlist, onClick }) => {
  const titleTe = useAutoTranslate(course.title, course.title_te);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[20px] p-2.5 md:p-4 shadow-sm hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] border border-gray-100 flex flex-row md:flex-col gap-4 md:gap-5 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group relative"
      onClick={onClick}
    >
      <div className="w-[100px] h-[100px] md:w-full md:h-52 shrink-0 relative overflow-hidden rounded-xl md:rounded-[16px] bg-gray-100">
        {course.thumbnailUrl ? (
          <img
            src={getCourseImageUrl(course.thumbnailUrl)}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            onError={(e) => { 
              e.currentTarget.onerror = null; 
              e.currentTarget.src = '/images/morning_yoga.png'; 
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300"><FaImage size={24} className="md:w-10 md:h-10" /></div>
        )}
        <div className="hidden md:block absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[11px] font-extrabold text-brand-green shadow-sm uppercase tracking-wider">
          {course.category}
        </div>
        
        {/* Top Right Badges: Enrolled & Wishlist */}
        <div className="absolute top-2 right-2 md:top-3 md:right-3 flex items-center gap-1.5">
          {isEnrolled && (
            <div className="bg-brand-green text-white px-2.5 py-1 rounded-md md:rounded-lg text-[10px] md:text-xs font-extrabold shadow-md flex items-center gap-1">
              ✓ Enrolled
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(course._id);
            }}
            className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors shadow-sm"
            title="Add to Wishlist"
          >
            {isWishlisted ? <FaHeart className="text-red-500 text-xs md:text-sm" /> : <FaRegHeart className="text-xs md:text-sm" />}
          </button>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center md:justify-start py-1 pr-2 md:pr-0 md:px-1">
        <h3 className="text-[14px] md:text-xl font-extrabold text-gray-900 leading-snug line-clamp-2 md:mb-1.5 group-hover:text-brand-green transition-colors">{titleTe}</h3>
        <p className="text-[11px] md:text-sm font-medium text-gray-500 mt-1 md:mb-5">{course.level}</p>
        <div className="mt-auto pt-2 md:pt-0 flex items-center justify-start text-[11px] md:text-[13px] text-gray-600 font-bold mb-1 md:mb-4">
          <div className="text-gray-500 font-medium">{course.duration}</div>
        </div>
        <div className="hidden md:flex items-center justify-between pt-1 md:pt-2">
          <span className="text-lg md:text-xl font-black text-brand-green-dark tracking-tight">₹{course.price}</span>
          {isEnrolled && (
            <span className="text-xs font-bold text-[#C08552] bg-amber-50 border border-amber-200/60 px-2.5 py-0.5 rounded-full">
              Active Access
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const navigate = useNavigate();
  const { lang, t } = useLanguage();

  useEffect(() => {
    fetchCourses();
    fetchEnrollments();
    fetchWishlist();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/courses/public`);
      const list = response?.data?.data || (Array.isArray(response?.data) ? response.data : []);
      setCourses(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/payments/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        const ids = res.data.data.map(en => en.course?._id || en.course).filter(Boolean);
        setEnrolledCourseIds(ids);
      }
    } catch(e) {}
  };

  const fetchWishlist = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/auth/wishlist`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setWishlistIds(res.data.data.map(c => c._id || c));
      }
    } catch(e) {}
  };

  const handleToggleWishlist = async (courseId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/wishlist/toggle/${courseId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setWishlistIds(res.data.data.map(c => c._id || c));
      }
    } catch (err) {
      console.error("Error toggling wishlist:", err);
    }
  };

  const categories = ['All', 'Yoga', 'Meditation', 'Nutrition', 'Ayurveda', 'Other'];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-bg-cream">
      <SEO 
        title="Live Yoga & Holistic Wellness Courses Catalog"
        description="Explore our accredited curriculum in Hatha Yoga, Ashtanga Vinyasa, Pranayama Breathwork, Vedic Meditation, and Ayurvedic Health."
        keywords="Yoga classes online, Hatha Yoga, Pranayama course, Meditation certification, Ayurveda training India"
        url="https://swamydwija.org/courses"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-6 md:py-12">
        {/* Sticky Search & Category Filter on Mobile */}
        <div className="sticky top-18 md:static z-30 bg-[#FAF7F2] -mx-4 px-4 pt-3 pb-3 sm:-mx-6 sm:px-6 border-b border-gray-200/80 shadow-sm md:shadow-none mb-6">
          {/* Desktop Header */}
          <div className="hidden md:block mb-10 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-brand-green-dark mb-4 tracking-tight">{t('course_all')}</h1>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">{t('course_discover')}</p>
          </div>

          {/* Search Bar & Filter */}
          <div className="flex gap-3 mb-3 md:mb-6 md:max-w-3xl md:mx-auto">
            <div className="relative flex-1">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder={t('course_search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-brand-green/20 outline-none transition-all text-sm text-gray-800"
              />
            </div>
            <button className="w-11 h-11 flex-shrink-0 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-600 shadow-sm hover:bg-gray-50 transition-colors">
              <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="18" width="18" xmlns="http://www.w3.org/2000/svg"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            </button>
          </div>

          {/* Categories (Scrollable horizontally) */}
          <div className="flex overflow-x-auto hide-scrollbar gap-2.5 md:mb-10 md:justify-center md:gap-3 py-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 md:px-6 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-bold whitespace-nowrap transition-all border ${
                  selectedCategory === cat 
                    ? 'bg-brand-green-dark text-white border-brand-green-dark shadow-sm' 
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Course List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100 max-w-3xl mx-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-2">{t('course_no_found')}</h3>
            <p className="text-gray-500 text-sm">{t('course_no_found_sub')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course._id}
                course={course}
                isEnrolled={enrolledCourseIds.includes(course._id)}
                isWishlisted={wishlistIds.includes(course._id)}
                onToggleWishlist={handleToggleWishlist}
                onClick={() => navigate(`/courses/${course.slug || course._id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseList;
