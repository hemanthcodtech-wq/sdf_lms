import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaSearch, FaUserTie, FaClock, FaSignal, FaImage } from 'react-icons/fa';

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/courses/public`);
      setCourses(data.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-16">
        {/* Mobile Header (Back Arrow & Title) */}
        <div className="flex md:hidden items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-brand-green-dark hover:text-brand-green transition-colors">
            <svg stroke="currentColor" fill="none" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="20" width="20" xmlns="http://www.w3.org/2000/svg"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </button>
          <h1 className="text-xl font-extrabold text-brand-green-dark">All Classes</h1>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-brand-green-dark mb-4 tracking-tight">All Classes</h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Discover a wide range of courses taught by expert instructors.
          </p>
        </div>

        {/* Search Bar & Filter */}
        <div className="flex gap-3 mb-6 md:max-w-3xl md:mx-auto">
          <div className="relative flex-1">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search classes..." 
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
        <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-10 md:justify-center md:gap-3">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 md:px-5 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap transition-all border ${
                selectedCategory === cat 
                  ? 'bg-brand-green-dark text-white border-brand-green-dark shadow-sm' 
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Course List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100 max-w-3xl mx-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-2">No classes found</h3>
            <p className="text-gray-500 text-sm">Try adjusting your search or category filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {filteredCourses.map((course, index) => (
              <motion.div 
                key={course._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, type: 'spring', stiffness: 200, damping: 20 }}
                className="bg-white rounded-[20px] p-2.5 md:p-4 shadow-sm hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] border border-gray-100 flex flex-row md:flex-col gap-4 md:gap-5 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group"
                onClick={() => navigate(`/courses/${course.slug || course._id}`)}
              >
                {/* Image Section */}
                <div className="w-[100px] h-[100px] md:w-full md:h-52 shrink-0 relative overflow-hidden rounded-xl md:rounded-[16px] bg-gray-100">
                  {course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300"><FaImage size={24} className="md:w-10 md:h-10" /></div>
                  )}
                  {/* Category badge - Laptop layout shows it top-left */}
                  <div className="hidden md:block absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[11px] font-extrabold text-brand-green shadow-sm uppercase tracking-wider">
                    {course.category}
                  </div>
                </div>
                
                {/* Content Section */}
                <div className="flex-1 flex flex-col justify-center md:justify-start py-1 pr-2 md:pr-0 md:px-1">
                  <h3 className="text-[14px] md:text-xl font-extrabold text-gray-900 leading-snug line-clamp-2 md:mb-1.5 group-hover:text-brand-green transition-colors">{course.title}</h3>
                  
                  <p className="text-[11px] md:text-sm font-medium text-gray-500 mt-1 md:mb-5">{course.level}</p>

                  <div className="mt-auto pt-2 md:pt-0 flex items-center justify-start text-[11px] md:text-[13px] text-gray-600 font-bold mb-1 md:mb-4">
                    <div className="text-gray-500 font-medium">{course.duration}</div>
                  </div>
                  
                  {/* Price - Desktop Only */}
                  <div className="hidden md:block pt-1 md:pt-2">
                    <span className="text-lg md:text-xl font-black text-brand-green-dark tracking-tight">${course.price}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseList;
