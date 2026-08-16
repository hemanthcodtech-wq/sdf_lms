import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaClock, FaGlobe, FaCheck, FaUser } from 'react-icons/fa';

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/courses/public/${id}`);
        setCourse(data.data);
      } catch (error) {
        console.error('Error fetching course:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

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
    <div className="min-h-screen bg-bg-cream relative overflow-x-hidden font-sans">
      
      {/* =========================================
          MOBILE VIEW (visible on small screens)
          ========================================= */}
      <div className="md:hidden pb-24">
        {/* Header */}
        <div className="fixed top-0 left-0 w-full z-50 bg-bg-cream/90 backdrop-blur-md px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-brand-green-dark p-1">
            <svg stroke="currentColor" fill="none" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="20" width="20" xmlns="http://www.w3.org/2000/svg"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </button>
          <h1 className="text-[17px] font-extrabold text-brand-green-dark">Class Details</h1>
        </div>

        {/* Image Section */}
        <div className="w-full h-[300px] mt-14 bg-gray-200">
          {course.thumbnailUrl ? (
            <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-brand-green/20 text-brand-green font-bold">No Image</div>
          )}
        </div>

        {/* Content Section */}
        <div className="px-5 py-6">
          <h1 className="text-[22px] font-extrabold text-gray-900 leading-tight mb-2">
            {course.title}
          </h1>
          
          <div className="flex items-center gap-3 mb-5">
            <span className="text-brand-green font-bold text-sm">{course.level}</span>
            <div className="flex items-center gap-1.5 text-sm text-gray-700 font-medium">
              <span className="text-[#f59e0b] text-[15px]">★</span>
              <span>4.8 <span className="text-gray-500 font-normal">(258 reviews)</span></span>
            </div>
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
            <h2 className="text-[17px] font-extrabold text-gray-900 mb-3">About This Class</h2>
            <p className="text-sm text-gray-700 leading-relaxed font-medium">
              {course.description}
            </p>
          </div>

          {/* What You Will Learn */}
          {(course.whatYouWillLearn && course.whatYouWillLearn.length > 0) && (
            <div className="mb-8">
              <h2 className="text-[17px] font-extrabold text-gray-900 mb-4">What You Will Learn</h2>
              <ul className="space-y-3">
                {course.whatYouWillLearn.map((item, idx) => (
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
            onClick={() => navigate(`/checkout/${course._id}`)}
            className="w-full bg-brand-green-dark hover:bg-brand-green text-white font-bold py-4 rounded-[20px] shadow-[0_8px_20px_rgba(20,83,45,0.2)] transition-all text-[15px]"
          >
            Enroll Now
          </button>
        </div>
      </div>


      {/* =========================================
          DESKTOP VIEW (visible on medium+ screens)
          ========================================= */}
      <div className="hidden md:block pb-20">
        
        {/* Navigation Bar */}
        <div className="w-full bg-white/60 backdrop-blur-xl border-b border-white/40 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <button onClick={() => navigate('/courses')} className="flex items-center gap-2 text-brand-green-dark hover:text-brand-green font-bold transition-colors">
              <FaArrowLeft /> Back to Classes
            </button>
          </div>
        </div>

        {/* Hero Section with Glassmorphism */}
        <div className="relative pt-12 pb-24 overflow-hidden">
          {/* Abstract background blobs for hero */}
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
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
                {course.title}
              </h1>
              
              <div className="flex items-center gap-6 text-gray-600 font-medium">
                <div className="flex items-center gap-2"><FaClock className="text-brand-green" /> {course.duration}</div>
                <div className="flex items-center gap-2"><FaGlobe className="text-brand-green" /> {course.language || 'English'}</div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#f59e0b]">★</span>
                  <span className="font-bold text-gray-900">4.8</span>
                  <span className="text-gray-500">(258 reviews)</span>
                </div>
              </div>
            </div>

            {/* Right Image (Glassmorphism Frame) */}
            <div className="w-full max-w-md lg:w-1/3 relative">
              <div className="absolute inset-[-10px] bg-white/40 backdrop-blur-2xl rounded-[2rem] border border-white/60 shadow-[0_20px_40px_rgba(0,0,0,0.06)] transform rotate-3"></div>
              <div className="relative h-[300px] rounded-[1.5rem] overflow-hidden shadow-lg bg-gray-100 z-10">
                {course.thumbnailUrl ? (
                  <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
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
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 lg:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white/80">
                <h2 className="text-2xl font-extrabold text-gray-900 mb-5">About This Class</h2>
                <p className="text-gray-700 leading-relaxed text-lg">
                  {course.description}
                </p>
              </motion.div>

              {/* What You Will Learn Block */}
              {(course.whatYouWillLearn && course.whatYouWillLearn.length > 0) && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 lg:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white/80">
                  <h2 className="text-2xl font-extrabold text-gray-900 mb-6">What You Will Learn</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {course.whatYouWillLearn.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-4">
                        <div className="w-6 h-6 rounded-full bg-brand-green/10 flex items-center justify-center shrink-0 mt-0.5">
                          <FaCheck className="text-brand-green-dark text-[12px]" />
                        </div>
                        <span className="text-gray-700 font-medium text-[15px]">{item}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Sticky Sidebar Action */}
            <div className="w-full lg:w-80">
              <div className="sticky top-28 bg-white/60 backdrop-blur-2xl rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-white">
                
                <h3 className="text-xl font-bold text-gray-900 text-center mb-6">Ready to start?</h3>
                
                <button 
                  onClick={() => navigate(`/checkout/${course._id}`)}
                  className="w-full py-4 px-6 bg-brand-green hover:bg-brand-green-dark text-white text-lg font-bold rounded-2xl shadow-[0_10px_25px_rgba(41,120,56,0.3)] hover:-translate-y-1 transition-all duration-300"
                >
                  Enroll Now
                </button>
                
                <p className="text-center text-sm text-gray-500 mt-4 font-medium">Join thousands of students</p>
                
                <div className="mt-8 pt-6 border-t border-gray-200/50 space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Access</span>
                    <span className="font-bold text-gray-800">Lifetime</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Language</span>
                    <span className="font-bold text-gray-800">{course.language || 'English'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Format</span>
                    <span className="font-bold text-gray-800">On-demand</span>
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

export default CourseDetails;
