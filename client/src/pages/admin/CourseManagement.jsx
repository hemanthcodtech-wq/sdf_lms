import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaEdit, FaTrash, FaTimes, FaCloudUploadAlt, FaVideo, FaFilePdf, FaImage, FaSync } from 'react-icons/fa';

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: '', description: '', category: 'Yoga', price: '', duration: '', durationMonths: 1, startDate: '', endDate: '', startTime: '', endTime: '', selectedSessionDates: [], topics: '', level: 'Beginner', language: 'English', accessValidity: '2 Months', whatYouWillLearn: ''
  });
  const [newSessionDate, setNewSessionDate] = useState('');
  const [enrolledUsers, setEnrolledUsers] = useState([]);
  const [enrolledCourse, setEnrolledCourse] = useState(null);
  const [isEnrolledModalOpen, setIsEnrolledModalOpen] = useState(false);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  
  // Files
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Calendar UI state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [holidays, setHolidays] = useState({});

  useEffect(() => {
    fetchCourses();
    fetchHolidays(new Date().getFullYear());
  }, []);

  const fetchHolidays = async (year) => {
    try {
      const res = await axios.get(`https://date.nager.at/api/v3/PublicHolidays/${year}/IN`);
      if (Array.isArray(res.data)) {
        const holidayMap = {};
        res.data.forEach(h => {
          holidayMap[h.date] = h.name;
        });
        setHolidays(prev => ({ ...prev, ...holidayMap }));
      }
    } catch (err) {
      // Graceful fallback for offline or unavailable third-party holiday API
      const fallbackHolidays = {
        [`${year}-01-26`]: 'Republic Day',
        [`${year}-08-15`]: 'Independence Day',
        [`${year}-10-02`]: 'Gandhi Jayanti',
        [`${year}-12-25`]: 'Christmas Day',
      };
      setHolidays(prev => ({ ...prev, ...fallbackHolidays }));
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/courses`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setCourses(res.data.data);
    } catch (err) {
      console.error("Error fetching courses", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (course = null) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        title: course.title,
        description: course.description,
        category: course.category,
        price: course.price !== undefined ? course.price : 0,
        duration: course.duration,
        durationMonths: course.durationMonths || 1,
        startDate: course.startDate ? new Date(course.startDate).toISOString().split('T')[0] : '',
        endDate: course.endDate ? new Date(course.endDate).toISOString().split('T')[0] : '',
        startTime: course.startTime || (course.timings ? course.timings.split(' to ')[0] : ''),
        endTime: course.endTime || (course.timings ? course.timings.split(' to ')[1] : ''),
        selectedSessionDates: course.sessionDates || [],
        topics: course.topics ? course.topics.join('\n') : '',
        level: course.level,
        language: course.language || 'English',
        accessValidity: course.accessValidity || '2 Months',
        whatYouWillLearn: course.whatYouWillLearn ? course.whatYouWillLearn.join('\n') : ''
      });
    } else {
      setFormData({ title: '', description: '', category: 'Yoga', price: '', duration: '', durationMonths: 1, startDate: '', endDate: '', startTime: '', endTime: '', selectedSessionDates: [], topics: '', level: 'Beginner', language: 'English', accessValidity: '2 Months', whatYouWillLearn: '' });
    }
    setNewSessionDate('');
    setThumbnailFile(null);
    setIsModalOpen(true);
  };

  const handleAddSessionDate = () => {
    if (newSessionDate && !formData.selectedSessionDates.includes(newSessionDate)) {
      setFormData({ ...formData, selectedSessionDates: [...formData.selectedSessionDates, newSessionDate].sort() });
      setNewSessionDate('');
    }
  };

  const handleRemoveSessionDate = (dateToRemove) => {
    setFormData({ ...formData, selectedSessionDates: formData.selectedSessionDates.filter(d => d !== dateToRemove) });
  };

  const handleViewEnrollments = async (course) => {
    setEnrolledCourse(course);
    setIsEnrolledModalOpen(true);
    setLoadingEnrollments(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/courses/${course._id}/enrollments`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setEnrolledUsers(res.data.data);
    } catch (err) {
      console.error("Error fetching enrollments", err);
    } finally {
      setLoadingEnrollments(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/admin/courses/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
        });
        fetchCourses();
      } catch (err) {
        console.error("Error deleting course", err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    
    // Calculate duration in months from dates
    let computedDurationMonths = 1;
    if (formData.startDate && formData.endDate) {
      const sDate = new Date(formData.startDate);
      const eDate = new Date(formData.endDate);
      const months = (eDate.getFullYear() - sDate.getFullYear()) * 12 + (eDate.getMonth() - sDate.getMonth());
      computedDurationMonths = months > 0 ? months : 1;
    }
    
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'whatYouWillLearn') {
          const array = formData.whatYouWillLearn.split('\n').map(item => item.trim()).filter(item => item !== '');
          data.append('whatYouWillLearn', JSON.stringify(array));
        } else if (key === 'topics') {
          const array = formData.topics.split('\n').map(item => item.trim()).filter(item => item !== '');
          data.append('topics', JSON.stringify(array));
        } else if (key === 'selectedSessionDates') {
          data.append('selectedSessionDates', JSON.stringify(formData.selectedSessionDates));
        } else if (key === 'durationMonths') {
          data.append('durationMonths', computedDurationMonths);
        } else if (key === 'price') {
          data.append('price', formData.price !== undefined && formData.price !== '' ? formData.price : 0);
        } else {
          data.append(key, formData[key]);
        }
      });
      if (thumbnailFile) data.append('thumbnail', thumbnailFile);

      const headers = { 
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        'Content-Type': 'multipart/form-data'
      };

      if (editingCourse) {
        await axios.put(`${import.meta.env.VITE_API_BASE_URL}/admin/courses/${editingCourse._id}`, data, { headers });
      } else {
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/admin/courses`, data, { headers });
      }

      setIsModalOpen(false);
      fetchCourses();
    } catch (err) {
      console.error("Error saving course", err);
      alert(err.response?.data?.message || 'Error saving course. Make sure Cloudinary keys are configured.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8 pb-24 md:pb-8 font-inter">
      
      {/* Top Banner Header */}
      <div className="bg-white/60 backdrop-blur-2xl rounded-[2.5rem] p-6 lg:p-8 border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-green/10 text-brand-green-dark text-xs font-bold uppercase tracking-wider mb-2">
            Curriculum & Programs
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">Course Management</h1>
          <p className="text-gray-500 text-sm mt-1">Configure yoga and wellness programs, schedules, session dates, and pricing.</p>
        </div>
        
        <button
          onClick={() => handleOpenModal()}
          className="bg-brand-green hover:bg-brand-green-dark text-white font-bold py-3.5 px-6 rounded-2xl shadow-[0_6px_20px_rgba(41,120,56,0.3)] transition-all flex items-center gap-2.5 w-max text-xs lg:text-sm group"
        >
          <FaPlus size={12} className="group-hover:rotate-90 transition-transform" />
          <span>Create New Course</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
          {courses.map(course => (
            <motion.div 
              key={course._id}
              initial={{ opacity: 0, scale: 0.96 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/75 backdrop-blur-2xl rounded-[2.25rem] border border-white/80 flex flex-col shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-300 overflow-hidden group"
            >
              {/* Image Section */}
              <div className="relative h-48 w-full bg-gray-100/80 overflow-hidden p-3 pb-0">
                <div className="w-full h-full rounded-2xl overflow-hidden relative">
                  {course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-100"><FaImage size={32} /></div>
                  )}
                  <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-extrabold text-brand-green shadow-xs uppercase tracking-wider">
                    {course.category}
                  </div>
                </div>
              </div>
              
              {/* Structured Content Section */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-base lg:text-lg font-black text-gray-900 leading-snug line-clamp-2 group-hover:text-brand-green transition-colors">{course.title}</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-6 bg-[#FAF7F2] p-3.5 rounded-2xl border border-gray-200/50">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Fee</span>
                    <span className="font-black text-brand-green-dark text-sm">₹{course.price || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Level</span>
                    <span className="font-bold text-gray-800">{course.level || 'All Levels'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Language</span>
                    <span className="font-bold text-gray-800 truncate block">{course.language || 'English'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Access</span>
                    <span className="font-bold text-amber-700">{course.accessValidity || '2 Months'}</span>
                  </div>
                </div>
                
                {/* Actions Footer */}
                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                  <button 
                    onClick={() => handleViewEnrollments(course)} 
                    className="px-4 py-2 bg-brand-green/10 text-brand-green hover:bg-brand-green hover:text-white transition-all rounded-xl text-xs font-bold"
                  >
                    View Students
                  </button>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleOpenModal(course)} 
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-all shadow-xs" 
                      title="Edit Course"
                    >
                      <FaEdit size={13} />
                    </button>
                    <button 
                      onClick={() => handleDelete(course._id)} 
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-xs" 
                      title="Delete Course"
                    >
                      <FaTrash size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {courses.length === 0 && (
            <div className="col-span-full py-16 text-center text-gray-400 bg-white/40 backdrop-blur-md rounded-3xl border border-dashed border-gray-300">
              No courses found. Click "Create New Course" to add your first program.
            </div>
          )}
        </div>
      )}

      {/* Enrolled Users Drawer */}
      <AnimatePresence>
        {isEnrolledModalOpen && (
          <div className="fixed inset-0 z-40 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-green-dark/20 backdrop-blur-sm"
              onClick={() => setIsEnrolledModalOpen(false)}
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="bg-white/40 backdrop-blur-3xl border-l border-white/60 shadow-[-20px_0_40px_rgba(0,0,0,0.08)] w-full max-w-md h-full overflow-y-auto relative z-10 p-6 flex flex-col"
            >
              <button 
                onClick={() => setIsEnrolledModalOpen(false)}
                className="absolute top-6 right-6 text-gray-500 hover:text-brand-green bg-white/60 backdrop-blur-md p-2.5 rounded-full border border-white/50 shadow-sm transition-all z-20"
              >
                <FaTimes />
              </button>
              
              <h2 className="text-xl font-bold text-gray-800 mb-2 mt-2">Enrolled Students</h2>
              <p className="text-brand-green font-semibold text-sm mb-6 line-clamp-1">{enrolledCourse?.title}</p>
              
              <div className="flex-1 overflow-y-auto pr-2">
                {loadingEnrollments ? (
                  <div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-brand-green border-t-transparent rounded-full animate-spin"></div></div>
                ) : enrolledUsers.length === 0 ? (
                  <div className="text-center text-gray-500 py-8 bg-white/50 rounded-xl border border-dashed border-gray-300 text-sm">
                    No students are currently enrolled in this course.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {enrolledUsers.map(enrollment => (
                      <div key={enrollment._id} className="bg-white/80 p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-1">
                        <span className="font-bold text-gray-800 text-sm">{enrollment.studentEmail}</span>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-gray-500">Paid: <span className="font-semibold text-brand-green">₹{enrollment.amountPaid}</span></span>
                          <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">Progress: {enrollment.progress}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Course Form Drawer */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-40 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-green-dark/20 backdrop-blur-sm"
              onClick={() => !uploading && setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="bg-white/40 backdrop-blur-3xl border-l border-white/60 shadow-[-20px_0_40px_rgba(0,0,0,0.08)] w-full max-w-2xl h-full overflow-y-auto relative z-10 p-6 md:p-10 flex flex-col overflow-x-hidden"
            >
              {/* Glassmorphism background refraction blobs */}
              <div className="absolute top-[-5%] right-[-10%] w-72 h-72 bg-brand-green/30 rounded-full blur-[90px] pointer-events-none"></div>
              <div className="absolute bottom-[20%] left-[-10%] w-64 h-64 bg-[#d67b22]/20 rounded-full blur-[90px] pointer-events-none"></div>

              <button 
                onClick={() => !uploading && setIsModalOpen(false)}
                className="absolute top-6 right-6 text-gray-500 hover:text-brand-green bg-white/60 backdrop-blur-md p-2.5 rounded-full border border-white/50 shadow-sm transition-all z-20"
              >
                <FaTimes />
              </button>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-6 relative z-10">{editingCourse ? 'Edit Course' : 'Create New Course'}</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                  <div className="col-span-full">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Course Title</label>
                    <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl focus:border-brand-green focus:bg-white/70 focus:ring-2 focus:ring-brand-green/20 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all" placeholder="e.g. Yoga for Stress Relief" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Course Fee (₹ INR)</label>
                    <input 
                      type="number" 
                      min="0"
                      required 
                      value={formData.price} 
                      onChange={e => setFormData({...formData, price: e.target.value})} 
                      className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl focus:border-brand-green focus:bg-white/70 focus:ring-2 focus:ring-brand-green/20 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all font-semibold" 
                      placeholder="e.g. 999" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl outline-none focus:bg-white/70 focus:border-brand-green transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                      <option>Yoga</option><option>Meditation</option><option>Nutrition</option><option>Ayurveda</option><option>Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Instruction Language</label>
                    <select value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})} className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl outline-none focus:bg-white/70 focus:border-brand-green transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                      <option value="English">English</option>
                      <option value="Telugu">Telugu</option>
                      <option value="English & Telugu">English & Telugu</option>
                      <option value="Hindi">Hindi</option>
                      <option value="English & Hindi">English & Hindi</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Access Validity After Completion</label>
                    <select value={formData.accessValidity} onChange={e => setFormData({...formData, accessValidity: e.target.value})} className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl outline-none focus:bg-white/70 focus:border-brand-green transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] font-medium">
                      <option value="1 Month">1 Month Access</option>
                      <option value="2 Months">2 Months Access</option>
                      <option value="3 Months">3 Months Access</option>
                      <option value="6 Months">6 Months Access</option>
                      <option value="1 Year">1 Year Access</option>
                      <option value="Lifetime">Lifetime Access</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Level</label>
                    <select value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})} className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl outline-none focus:bg-white/70 focus:border-brand-green transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                      <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Start Date</label>
                    <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl outline-none focus:bg-white/70 focus:border-brand-green transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">End Date</label>
                    <input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl outline-none focus:bg-white/70 focus:border-brand-green transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Session Timings</label>
                    <div className="flex flex-col gap-3">
                      
                      {/* Start Time Picker */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-500 w-12">Start:</span>
                        <div className="flex items-center gap-1 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl p-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                          <select 
                            value={formData.startTime ? (parseInt(formData.startTime.split(':')[0]) % 12 || 12).toString().padStart(2, '0') : '09'} 
                            onChange={e => {
                              const h = parseInt(e.target.value);
                              const isPM = formData.startTime && parseInt(formData.startTime.split(':')[0]) >= 12;
                              const min = formData.startTime ? formData.startTime.split(':')[1] : '00';
                              let newH = h;
                              if (isPM && h !== 12) newH += 12;
                              if (!isPM && h === 12) newH = 0;
                              setFormData({...formData, startTime: `${newH.toString().padStart(2, '0')}:${min}`});
                            }}
                            className="p-2 bg-transparent outline-none appearance-none cursor-pointer font-medium"
                          >
                            {[...Array(12)].map((_, i) => <option key={i+1} value={(i+1).toString().padStart(2, '0')}>{(i+1).toString().padStart(2, '0')}</option>)}
                          </select>
                          <span className="font-bold">:</span>
                          <select 
                            value={formData.startTime ? formData.startTime.split(':')[1] : '00'} 
                            onChange={e => {
                              const h = formData.startTime ? formData.startTime.split(':')[0] : '09';
                              setFormData({...formData, startTime: `${h}:${e.target.value}`});
                            }}
                            className="p-2 bg-transparent outline-none appearance-none cursor-pointer font-medium"
                          >
                            {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                          <select 
                            value={formData.startTime && parseInt(formData.startTime.split(':')[0]) >= 12 ? 'PM' : 'AM'} 
                            onChange={e => {
                              const isPM = e.target.value === 'PM';
                              let h = parseInt(formData.startTime ? formData.startTime.split(':')[0] : '9');
                              const min = formData.startTime ? formData.startTime.split(':')[1] : '00';
                              if (isPM && h < 12) h += 12;
                              if (!isPM && h >= 12) h -= 12;
                              setFormData({...formData, startTime: `${h.toString().padStart(2, '0')}:${min}`});
                            }}
                            className="p-2 bg-transparent outline-none appearance-none cursor-pointer font-bold text-brand-green"
                          >
                            <option value="AM">AM</option><option value="PM">PM</option>
                          </select>
                        </div>
                      </div>

                      {/* End Time Picker */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-500 w-12">End:</span>
                        <div className="flex items-center gap-1 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl p-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                          <select 
                            value={formData.endTime ? (parseInt(formData.endTime.split(':')[0]) % 12 || 12).toString().padStart(2, '0') : '10'} 
                            onChange={e => {
                              const h = parseInt(e.target.value);
                              const isPM = formData.endTime && parseInt(formData.endTime.split(':')[0]) >= 12;
                              const min = formData.endTime ? formData.endTime.split(':')[1] : '00';
                              let newH = h;
                              if (isPM && h !== 12) newH += 12;
                              if (!isPM && h === 12) newH = 0;
                              setFormData({...formData, endTime: `${newH.toString().padStart(2, '0')}:${min}`});
                            }}
                            className="p-2 bg-transparent outline-none appearance-none cursor-pointer font-medium"
                          >
                            {[...Array(12)].map((_, i) => <option key={i+1} value={(i+1).toString().padStart(2, '0')}>{(i+1).toString().padStart(2, '0')}</option>)}
                          </select>
                          <span className="font-bold">:</span>
                          <select 
                            value={formData.endTime ? formData.endTime.split(':')[1] : '00'} 
                            onChange={e => {
                              const h = formData.endTime ? formData.endTime.split(':')[0] : '10';
                              setFormData({...formData, endTime: `${h}:${e.target.value}`});
                            }}
                            className="p-2 bg-transparent outline-none appearance-none cursor-pointer font-medium"
                          >
                            {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                          <select 
                            value={formData.endTime && parseInt(formData.endTime.split(':')[0]) >= 12 ? 'PM' : 'AM'} 
                            onChange={e => {
                              const isPM = e.target.value === 'PM';
                              let h = parseInt(formData.endTime ? formData.endTime.split(':')[0] : '10');
                              const min = formData.endTime ? formData.endTime.split(':')[1] : '00';
                              if (isPM && h < 12) h += 12;
                              if (!isPM && h >= 12) h -= 12;
                              setFormData({...formData, endTime: `${h.toString().padStart(2, '0')}:${min}`});
                            }}
                            className="p-2 bg-transparent outline-none appearance-none cursor-pointer font-bold text-brand-green"
                          >
                            <option value="AM">AM</option><option value="PM">PM</option>
                          </select>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Custom Calendar for Session Dates */}
                  <div className="col-span-full bg-white/50 backdrop-blur-md border border-white/60 p-5 rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                    <label className="block text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      Select Session Dates (Generates Zoom Meetings)
                    </label>
                    {(!formData.startDate || !formData.endDate) ? (
                      <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                        Please select a <strong>Start Date</strong> and <strong>End Date</strong> first to enable the calendar.
                      </div>
                    ) : (
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Interactive Calendar UI built with native JS dates */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 w-full md:w-[320px] shrink-0">
                          {(() => {
                            const start = new Date(formData.startDate);
                            const end = new Date(formData.endDate);
                            
                            // Initialize current month view if not set correctly (e.g. on modal open)
                            // We use the start date as a fallback default
                            const displayMonth = currentMonth || new Date(start.getFullYear(), start.getMonth(), 1);
                            
                            const nextMonth = () => setCurrentMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1));
                            const prevMonth = () => setCurrentMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1));

                            const daysInMonth = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 0).getDate();
                            const firstDayOfMonth = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1).getDay();
                            
                            const days = [];
                            for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
                            for (let i = 1; i <= daysInMonth; i++) days.push(new Date(displayMonth.getFullYear(), displayMonth.getMonth(), i));

                            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

                            return (
                              <div>
                                <div className="flex justify-between items-center mb-4">
                                  <button type="button" onClick={prevMonth} className="text-gray-400 hover:text-brand-green p-1">&larr;</button>
                                  <span className="font-bold text-gray-800">{monthNames[displayMonth.getMonth()]} {displayMonth.getFullYear()}</span>
                                  <button type="button" onClick={nextMonth} className="text-gray-400 hover:text-brand-green p-1">&rarr;</button>
                                </div>
                                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => <div key={d} className={`text-xs font-bold ${i === 0 ? 'text-red-400' : 'text-gray-400'}`}>{d}</div>)}
                                </div>
                                <div className="grid grid-cols-7 gap-1 text-center">
                                  {days.map((day, idx) => {
                                    if (!day) return <div key={`empty-${idx}`} className="p-2"></div>;
                                    
                                    const dateStr = day.toISOString().split('T')[0];
                                    const isSelected = formData.selectedSessionDates.includes(dateStr);
                                    
                                    // Make day disabled if outside course start/end date
                                    day.setHours(0,0,0,0);
                                    const startCmp = new Date(start); startCmp.setHours(0,0,0,0);
                                    const endCmp = new Date(end); endCmp.setHours(0,0,0,0);
                                    const isDisabled = day < startCmp || day > endCmp;
                                    
                                    const isHoliday = holidays[dateStr];
                                    const isSunday = day.getDay() === 0;
                                    const isSpecialDay = isHoliday || isSunday;

                                    return (
                                      <div key={dateStr} className="relative flex justify-center group">
                                        <button
                                          type="button"
                                          disabled={isDisabled}
                                          onClick={() => {
                                            if (isSelected) {
                                              handleRemoveSessionDate(dateStr);
                                            } else {
                                              setFormData({ ...formData, selectedSessionDates: [...formData.selectedSessionDates, dateStr].sort() });
                                            }
                                          }}
                                          className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                                            isDisabled ? 'text-gray-300 cursor-not-allowed' :
                                            isSelected ? 'bg-brand-green text-white shadow-md' : 
                                            isSpecialDay ? 'text-red-500 bg-red-50 hover:bg-red-100' :
                                            'text-gray-700 hover:bg-gray-100'
                                          }`}
                                        >
                                          {day.getDate()}
                                        </button>
                                        {isHoliday && !isDisabled && (
                                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                                            {isHoliday}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        
                        {/* Selected Dates List */}
                        <div className="flex-1 flex flex-col">
                          <h4 className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-wider">Selected Sessions ({formData.selectedSessionDates.length})</h4>
                          <div className="flex flex-wrap gap-2 max-h-[250px] overflow-y-auto content-start">
                            {formData.selectedSessionDates.length === 0 ? (
                              <p className="text-sm text-gray-400 italic">Click dates on the calendar to select sessions.</p>
                            ) : (
                              formData.selectedSessionDates.map((date) => {
                                const d = new Date(date);
                                const dateFmt = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                                const dayName = d.toLocaleDateString('en-GB', { weekday: 'short' });
                                return (
                                  <div key={date} className="flex items-center gap-2 bg-white text-gray-700 pl-3 pr-2 py-1.5 rounded-lg text-sm font-medium border border-brand-green/20 shadow-sm">
                                    <span className="text-brand-green font-bold text-xs">{dayName}</span>
                                    <span>{dateFmt}</span>
                                    <button type="button" onClick={() => handleRemoveSessionDate(date)} className="text-gray-300 hover:text-red-500 ml-1 p-0.5 rounded transition-colors"><FaTimes size={12}/></button>
                                  </div>
                                )
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="col-span-full">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">About This Course</label>
                    <textarea required rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl focus:border-brand-green focus:bg-white/70 focus:ring-2 focus:ring-brand-green/20 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all resize-none" placeholder="This course helps you relax your mind..."></textarea>
                  </div>
                  
                  <div className="col-span-full">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Topics Covered (One per line)</label>
                    <textarea required rows="3" value={formData.topics} onChange={e => setFormData({...formData, topics: e.target.value})} className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl focus:border-brand-green focus:bg-white/70 focus:ring-2 focus:ring-brand-green/20 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all resize-none" placeholder={`Introduction\nAdvanced Poses`}></textarea>
                  </div>
                  
                  <div className="col-span-full">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">What You Will Learn (One per line)</label>
                    <textarea required rows="4" value={formData.whatYouWillLearn} onChange={e => setFormData({...formData, whatYouWillLearn: e.target.value})} className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl focus:border-brand-green focus:bg-white/70 focus:ring-2 focus:ring-brand-green/20 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all resize-none" placeholder={`Stress relief techniques\nBreathing exercises\nImprove flexibility`}></textarea>
                  </div>

                  {/* File Uploads */}
                  <div className="col-span-full pt-6 mt-2 border-t border-white/40">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><FaCloudUploadAlt className="text-brand-green" /> Media Uploads</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="border border-white/60 bg-white/40 backdrop-blur-md rounded-2xl p-5 text-center hover:bg-white/60 transition-colors shadow-sm cursor-pointer group">
                        <label className="cursor-pointer block">
                          <div className="w-12 h-12 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-white group-hover:scale-110 transition-transform">
                            <FaImage className="text-brand-green/70 text-xl" />
                          </div>
                          <span className="text-sm font-semibold text-gray-700">Upload Thumbnail Image</span>
                          <p className="text-xs text-gray-500 mt-1.5">{thumbnailFile ? thumbnailFile.name : (editingCourse?.thumbnailUrl ? 'Current image saved' : 'JPG, PNG formats')}</p>
                          <input type="file" className="hidden" accept="image/*" onChange={e => setThumbnailFile(e.target.files[0])} />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 pb-24 md:pb-4 mt-auto">
                  <button type="submit" disabled={uploading} className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-bold py-4 rounded-xl shadow-[0_4px_14px_0_rgba(41,120,56,0.39)] transition-all disabled:opacity-70 flex justify-center items-center gap-2 text-lg">
                    {uploading ? (
                      <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Uploading...</>
                    ) : 'Save Course'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CourseManagement;

