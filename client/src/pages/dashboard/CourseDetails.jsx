import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaClock, FaGlobe, FaCheck, FaUser, FaHeart, FaRegHeart } from 'react-icons/fa';
import { useLanguage, useAutoTranslate } from '../../context/LanguageContext';
import SEO from '../../components/common/SEO';
import { getCourseImageUrl } from '../../utils/imageHelper';

// Inner component — allows calling useAutoTranslate per course field
const CourseContent = ({ course, handleEnroll, isEnrolled, isWishlisted, handleToggleWishlist }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const titleTe   = useAutoTranslate(course.title,       course.title_te);
  const descTe    = useAutoTranslate(course.description,  course.description_te);

  // For whatYouWillLearn: join items → translate → split back
  const learnStr  = course.whatYouWillLearn?.join(' || ') || '';
  const learnStrTe = course.whatYouWillLearn_te?.join(' || ') || '';
  const learnTranslated = useAutoTranslate(learnStr, learnStrTe);
  const learnItems = learnTranslated ? learnTranslated.split(' || ').filter(Boolean) : [];

  return (
    <div className="min-h-screen bg-bg-cream relative overflow-x-hidden font-sans">
      <SEO 
        title={`${course.title} | Swamy Dwija Foundation`}
        description={course.description?.substring(0, 160) || 'Join our transformative Vedic learning program.'}
        keywords={`${course.category}, ${course.title}, online course, Vedic learning`}
        image={getCourseImageUrl(course.thumbnailUrl)}
        url={window.location.href}
        type="article"
      />

      {/* =========================================
          MOBILE VIEW (visible on small screens)
          ========================================= */}
      <div className="md:hidden pb-24">

        {/* Image Section with Wishlist Button */}
        <div className="w-full h-[280px] bg-gray-200 relative">
          {course.thumbnailUrl ? (
            <img
              src={getCourseImageUrl(course.thumbnailUrl)}
              alt={course.title}
              className="w-full h-full object-cover"
              onError={(e) => { 
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/images/morning_yoga.png'; 
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-brand-green/20 text-brand-green font-bold">No Image</div>
          )}
          <button
            onClick={handleToggleWishlist}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-gray-400 hover:text-red-500 shadow-md transition-all"
            title="Wishlist Course"
          >
            {isWishlisted ? <FaHeart className="text-red-500 text-lg" /> : <FaRegHeart className="text-lg" />}
          </button>
        </div>

        {/* Content Section */}
        <div className="px-5 py-6">
          <h1 className="text-[26px] font-bold font-playfair text-gray-900 leading-tight mb-2 tracking-tight">
            {titleTe}
          </h1>
          
          <div className="flex items-center gap-3 mb-5">
            <span className="text-brand-green font-bold text-sm">{course.level}</span>
            {isEnrolled && (
              <span className="bg-brand-green/10 text-brand-green-dark text-xs font-bold px-3 py-1 rounded-full border border-brand-green/20 flex items-center gap-1">
                <FaCheck size={10} /> Enrolled
              </span>
            )}
          </div>

          {/* Pills */}
          <div className="flex flex-wrap gap-2.5 mb-8">
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm text-xs font-bold text-gray-700">
              <FaClock className="text-gray-400 text-[14px]" /> {course.duration}
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm text-xs font-bold text-gray-700">
              <FaUser className="text-gray-400 text-[14px]" /> {course.category}
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm text-xs font-bold text-gray-700">
              <FaGlobe className="text-gray-400 text-[14px]" /> {course.language || 'English'}
            </div>
          </div>

          {/* About */}
          <div className="mb-8">
            <h2 className="text-[22px] font-bold font-playfair text-gray-900 mb-3">{t('course_about')}</h2>
            <p className="text-[15px] font-inter text-gray-700 leading-relaxed">{descTe}</p>
          </div>

          {/* What You Will Learn */}
          {learnItems.length > 0 && (
            <div className="mb-8">
              <h2 className="text-[22px] font-bold font-playfair text-gray-900 mb-4">{t('course_learn')}</h2>
              <ul className="space-y-3">
                {learnItems.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <FaCheck className="text-brand-green-dark mt-0.5 shrink-0 text-sm" />
                    <span className="text-sm text-gray-700 font-semibold">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sticky Bottom Action */}
        <div className="fixed bottom-16 left-0 w-full bg-bg-cream/95 backdrop-blur-md px-5 py-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] border-t border-gray-100">
          <button 
            onClick={handleEnroll}
            className={`w-full font-bold py-4 rounded-[20px] transition-all text-[15px] shadow-lg ${
              isEnrolled 
                ? 'bg-[#C08552] hover:bg-[#a06b3e] text-white shadow-[#C08552]/20' 
                : 'bg-brand-green-dark hover:bg-brand-green text-white shadow-[0_8px_20px_rgba(20,83,45,0.2)]'
            }`}
          >
            {isEnrolled ? 'Go to Learning (Enrolled)' : t('course_enroll')}
          </button>
        </div>
      </div>


      {/* =========================================
          DESKTOP VIEW (visible on medium+ screens)
          ========================================= */}
      <div className="hidden md:block pb-20">
        
        {/* Hero Section with Glassmorphism */}
        <div className="relative pt-36 pb-24 overflow-hidden">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-brand-green/20 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-[#d67b22]/15 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col lg:flex-row gap-12 items-center">
            
            {/* Left Content */}
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-3">
                <span className="bg-white/60 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-brand-green shadow-sm border border-white/50">
                  {course.category}
                </span>
                <span className="bg-brand-green/10 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-brand-green-dark">
                  {course.level}
                </span>
                {isEnrolled && (
                  <span className="bg-brand-green text-white px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                    <FaCheck size={11} /> Enrolled
                  </span>
                )}
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold font-playfair text-gray-900 leading-[1.1] tracking-tight">
                {titleTe}
              </h1>
              
              <div className="flex items-center gap-6 text-gray-700 font-outfit font-semibold text-lg">
                <div className="flex items-center gap-2"><FaClock className="text-brand-green" /> {course.duration}</div>
                <div className="flex items-center gap-2"><FaGlobe className="text-brand-green" /> {course.language || 'English'}</div>
              </div>
            </div>

            {/* Right Image (Glassmorphism Frame) */}
            <div className="w-full max-w-md lg:w-1/3 relative">
              <div className="absolute inset-[-10px] bg-white/40 backdrop-blur-2xl rounded-[2rem] border border-white/60 shadow-[0_20px_40px_rgba(0,0,0,0.06)] transform rotate-3"></div>
              <div className="relative h-[300px] rounded-[1.5rem] overflow-hidden shadow-lg bg-gray-100 z-10">
                {course.thumbnailUrl ? (
                  <img
                    src={getCourseImageUrl(course.thumbnailUrl)}
                    alt={course.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { 
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/images/morning_yoga.png'; 
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-brand-green bg-brand-green/10">No Image</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content & Sticky Sidebar Grid */}
        <div className="max-w-7xl mx-auto px-6 relative z-20">
          <div className="flex flex-col lg:flex-row gap-10">
            
            {/* Main Content Details */}
            <div className="flex-1 space-y-10">
              
              {/* About Block */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/40 backdrop-blur-3xl rounded-3xl p-8 lg:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white/60">
                <h2 className="text-4xl font-bold font-playfair text-gray-900 mb-5">{t('course_about')}</h2>
                <div className="w-16 h-1 bg-brand-green mb-6 rounded-full"></div>
                <p className="text-gray-700 font-inter leading-relaxed text-lg">{descTe}</p>
              </motion.div>

              {/* What You Will Learn Block */}
              {learnItems.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/40 backdrop-blur-3xl rounded-3xl p-8 lg:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white/60">
                  <h2 className="text-4xl font-bold font-playfair text-gray-900 mb-6">{t('course_learn')}</h2>
                  <div className="w-16 h-1 bg-brand-green mb-8 rounded-full"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {learnItems.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-4 bg-white/50 p-4 rounded-2xl border border-white/50 shadow-sm transition-transform hover:-translate-y-1">
                        <div className="w-8 h-8 rounded-full bg-brand-green/20 flex items-center justify-center shrink-0">
                          <FaCheck className="text-brand-green-dark text-[14px]" />
                        </div>
                        <span className="text-gray-800 font-bold text-[16px] mt-1">{item}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Sticky Sidebar Action */}
            <div className="w-full lg:w-96">
              <div className="sticky top-36 bg-white/40 backdrop-blur-3xl rounded-[2.5rem] p-8 shadow-[0_30px_60px_rgba(0,0,0,0.12)] border border-white/80">
                <h3 className="text-2xl font-black text-gray-900 text-center mb-6">{isEnrolled ? 'Already Enrolled' : t('course_ready')}</h3>
                
                {isEnrolled && (
                  <div className="mb-6 p-3.5 bg-green-50 rounded-xl border border-green-200 text-center">
                    <span className="text-xs font-bold text-green-800 flex items-center justify-center gap-1.5">
                      <FaCheck size={12}/> You have active access to this course.
                    </span>
                  </div>
                )}

                <div className="flex gap-3">
                  <button 
                    onClick={handleEnroll}
                    className={`flex-1 py-4 px-6 text-white text-xl font-bold rounded-2xl transition-all duration-300 transform hover:-translate-y-1 shadow-lg ${
                      isEnrolled 
                        ? 'bg-[#C08552] hover:bg-[#a06b3e] shadow-[#C08552]/30' 
                        : 'bg-brand-green hover:bg-brand-green-dark shadow-[0_10px_25px_rgba(41,120,56,0.4)]'
                    }`}
                  >
                    {isEnrolled ? 'Go to Learning' : t('course_enroll')}
                  </button>
                  <button
                    onClick={handleToggleWishlist}
                    className="w-16 py-4 flex items-center justify-center rounded-2xl border border-gray-200 hover:border-red-300 bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all shadow-sm"
                    title="Wishlist Course"
                  >
                    {isWishlisted ? <FaHeart className="text-red-500 text-xl" /> : <FaRegHeart className="text-xl" />}
                  </button>
                </div>
                <p className="text-center text-sm text-gray-600 mt-5 font-semibold">{isEnrolled ? 'Access live classes and materials anytime.' : t('course_join_thousands')}</p>
                <div className="mt-8 pt-6 border-t border-gray-300/50 space-y-5">
                  <div className="flex justify-between items-center text-base">
                    <span className="text-gray-600 font-semibold">Course Duration</span>
                    <span className="font-bold text-gray-900">{course.duration || (course.durationMonths ? `${course.durationMonths} Month${course.durationMonths > 1 ? 's' : ''}` : 'Self-Paced')}</span>
                  </div>
                  <div className="flex justify-between items-center text-base">
                    <span className="text-gray-600 font-semibold">{t('course_access')}</span>
                    <span className="font-bold text-gray-900">{course.accessValidity ? `${course.accessValidity} after completion` : t('course_lifetime')}</span>
                  </div>
                  <div className="flex justify-between items-center text-base">
                    <span className="text-gray-600 font-semibold">Language</span>
                    <span className="font-bold text-gray-900">{course.language || 'English'}</span>
                  </div>
                  <div className="flex justify-between items-center text-base">
                    <span className="text-gray-600 font-semibold">{t('course_format')}</span>
                    <span className="font-bold text-gray-900">{t('course_ondemand')}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
      
    </div>
  );
};

// ── Outer loader wrapper ────────────────────────────────────────────────────────
const CourseDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleEnroll = () => {
    if (isEnrolled && course?._id) {
      navigate(`/dashboard/learning/${course._id}`);
      return;
    }
    const token = localStorage.getItem('token');
    if (token) {
      navigate(`/checkout/${course._id}`);
    } else {
      navigate(`/login?redirect=/checkout/${course._id}`);
    }
  };

  const handleToggleWishlist = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    if (!course?._id) return;
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/wishlist/toggle/${course._id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setIsWishlisted(res.data.isWishlisted);
      }
    } catch (err) {
      console.error("Error toggling wishlist:", err);
    }
  };

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/courses/public/${slug}`);
        setCourse(data.data);

        // Check if student is already enrolled & wishlisted
        const token = localStorage.getItem('token');
        if (token && data.data?._id) {
          try {
            const [histRes, wishRes] = await Promise.all([
              axios.get(`${import.meta.env.VITE_API_BASE_URL}/payments/history`, {
                headers: { Authorization: `Bearer ${token}` }
              }).catch(() => ({ data: { success: false, data: [] } })),
              axios.get(`${import.meta.env.VITE_API_BASE_URL}/auth/wishlist`, {
                headers: { Authorization: `Bearer ${token}` }
              }).catch(() => ({ data: { success: false, data: [] } }))
            ]);

            if (histRes.data.success) {
              const enrolled = histRes.data.data.some(en => 
                (en.course?._id === data.data._id || en.course === data.data._id)
              );
              setIsEnrolled(enrolled);
            }
            if (wishRes.data.success) {
              const wishlisted = wishRes.data.data.some(c => (c._id === data.data._id || c === data.data._id));
              setIsWishlisted(wishlisted);
            }
          } catch(e) {
            // Ignore auth error on public view
          }
        }
      } catch (error) {
        console.error('Error fetching course:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-bg-cream">
        <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-bg-cream flex items-center justify-center">
        <p className="text-gray-500 font-medium">Class not found.</p>
      </div>
    );
  }

  return (
    <CourseContent 
      course={course} 
      handleEnroll={handleEnroll} 
      isEnrolled={isEnrolled} 
      isWishlisted={isWishlisted} 
      handleToggleWishlist={handleToggleWishlist} 
    />
  );
};

export default CourseDetails;

