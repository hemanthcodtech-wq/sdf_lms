import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaEdit, FaTrash, FaTimes, FaCloudUploadAlt, FaVideo, FaFilePdf, FaImage, FaLanguage, FaSync } from 'react-icons/fa';

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: '', description: '', category: 'Yoga', duration: '', level: 'Beginner', language: 'English', whatYouWillLearn: '',
    title_te: '', description_te: '', whatYouWillLearn_te: ''
  });
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState('');
  
  const [enrolledUsers, setEnrolledUsers] = useState([]);
  const [enrolledCourse, setEnrolledCourse] = useState(null);
  const [isEnrolledModalOpen, setIsEnrolledModalOpen] = useState(false);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  
  // Files
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [contentFile, setContentFile] = useState(null); // video or pdf
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  // Free MyMemory Translation API — no key needed
  const translateText = async (text) => {
    if (!text || !text.trim()) return '';
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|te`
    );
    const data = await res.json();
    if (data.responseStatus === 200) return data.responseData.translatedText;
    throw new Error(data.responseDetails || 'Translation failed');
  };

  const handleAutoTranslate = async () => {
    if (!formData.title && !formData.description && !formData.whatYouWillLearn) {
      setTranslateError('Please fill in the English fields first.');
      return;
    }
    setIsTranslating(true);
    setTranslateError('');
    try {
      const [titleTe, descTe] = await Promise.all([
        formData.title ? translateText(formData.title) : Promise.resolve(''),
        formData.description ? translateText(formData.description) : Promise.resolve(''),
      ]);

      // Translate each learn item individually
      let learnTe = '';
      if (formData.whatYouWillLearn.trim()) {
        const lines = formData.whatYouWillLearn.split('\n').map(l => l.trim()).filter(Boolean);
        const translated = await Promise.all(lines.map(line => translateText(line)));
        learnTe = translated.join('\n');
      }

      setFormData(prev => ({
        ...prev,
        title_te: titleTe,
        description_te: descTe,
        whatYouWillLearn_te: learnTe
      }));
    } catch (err) {
      setTranslateError('Auto-translation failed. Please check your internet connection and try again.');
    } finally {
      setIsTranslating(false);
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
        duration: course.duration,
        level: course.level,
        language: course.language || 'English',
        whatYouWillLearn: course.whatYouWillLearn ? course.whatYouWillLearn.join('\n') : '',
        title_te: course.title_te || '',
        description_te: course.description_te || '',
        whatYouWillLearn_te: course.whatYouWillLearn_te ? course.whatYouWillLearn_te.join('\n') : ''
      });
    } else {
      setEditingCourse(null);
      setFormData({ title: '', description: '', category: 'Yoga', duration: '', level: 'Beginner', language: 'English', whatYouWillLearn: '', title_te: '', description_te: '', whatYouWillLearn_te: '' });
    }
    setThumbnailFile(null);
    setContentFile(null);
    setIsModalOpen(true);
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
    
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'whatYouWillLearn') {
          const array = formData.whatYouWillLearn.split('\n').map(item => item.trim()).filter(item => item !== '');
          data.append('whatYouWillLearn', JSON.stringify(array));
        } else if (key === 'whatYouWillLearn_te') {
          const array = formData.whatYouWillLearn_te.split('\n').map(item => item.trim()).filter(item => item !== '');
          data.append('whatYouWillLearn_te', JSON.stringify(array));
        } else {
          data.append(key, formData[key]);
        }
      });
      if (thumbnailFile) data.append('thumbnail', thumbnailFile);
      if (contentFile) data.append('content', contentFile);

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
    <div className="space-y-6 pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Course Management</h1>
          <p className="text-gray-500 mt-1">Add, edit, and organize your platform's content.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-brand-green hover:bg-brand-green-dark text-white font-semibold py-2.5 px-6 rounded-xl shadow-[0_4px_14px_0_rgba(41,120,56,0.39)] transition-all flex items-center gap-2 w-max"
        >
          <FaPlus /> New Class
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <motion.div 
              key={course._id}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-none border border-gray-200 flex flex-col hover:shadow-lg transition-all hover:border-gray-300"
            >
              {/* Square Image Section */}
              <div className="relative h-48 w-full bg-gray-50 border-b border-gray-200">
                {course.thumbnailUrl ? (
                  <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300"><FaImage size={32} /></div>
                )}
                <div className="absolute top-0 right-0 bg-brand-green px-3 py-1.5 text-[11px] font-bold text-white uppercase tracking-wider">
                  {course.category}
                </div>
              </div>
              
              {/* Structured Content Section */}
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 leading-snug line-clamp-2 mb-4">{course.title}</h3>
                
                <div className="flex flex-col gap-1.5 text-sm text-gray-600 mb-6">
                  <div className="flex items-start">
                    <span className="font-semibold text-gray-800 w-24">Level:</span> 
                    <span className="flex-1">{course.level}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-semibold text-gray-800 w-24">Duration:</span> 
                    <span className="flex-1">{course.duration}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-semibold text-gray-800 w-24">Language:</span> 
                    <span className="flex-1">{course.language || 'English'}</span>
                  </div>
                </div>
                
                {/* Square Footer / Actions */}
                <div className="mt-auto pt-4 border-t border-gray-100 flex items-end justify-between">
                  <button onClick={() => handleViewEnrollments(course)} className="px-3 py-1.5 border border-brand-green/30 text-brand-green hover:bg-brand-green hover:text-white transition-all rounded-md text-xs font-bold" title="View Students">
                    Students
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenModal(course)} className="p-2 border border-gray-200 text-gray-600 hover:text-blue-700 hover:border-blue-300 bg-gray-50 hover:bg-blue-50 transition-all rounded-none" title="Edit">
                      <FaEdit size={15} />
                    </button>
                    <button onClick={() => handleDelete(course._id)} className="p-2 border border-gray-200 text-gray-600 hover:text-red-700 hover:border-red-300 bg-gray-50 hover:bg-red-50 transition-all rounded-none" title="Delete">
                      <FaTrash size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {courses.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500 bg-white/40 backdrop-blur-md rounded-2xl border border-dashed border-gray-300">
              No classes found. Click "New Class" to create one.
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
                          <span className="text-xs text-gray-500">Paid: <span className="font-semibold text-brand-green">${enrollment.amountPaid}</span></span>
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
              
              <h2 className="text-2xl font-bold text-gray-800 mb-6 relative z-10">{editingCourse ? 'Edit Class' : 'Create New Class'}</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                  <div className="col-span-full">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Class Title</label>
                    <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl focus:border-brand-green focus:bg-white/70 focus:ring-2 focus:ring-brand-green/20 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all" placeholder="e.g. Yoga for Stress Relief" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl outline-none focus:bg-white/70 focus:border-brand-green transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                      <option>Yoga</option><option>Meditation</option><option>Nutrition</option><option>Ayurveda</option><option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Level</label>
                    <select value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})} className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl outline-none focus:bg-white/70 focus:border-brand-green transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                      <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Duration</label>
                    <input type="text" required placeholder="e.g. 45 mins" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl outline-none focus:bg-white/70 focus:border-brand-green transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Language</label>
                    <input type="text" required placeholder="e.g. English" value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})} className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl outline-none focus:bg-white/70 focus:border-brand-green transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" />
                  </div>

                  <div className="col-span-full">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">About This Class</label>
                    <textarea required rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl focus:border-brand-green focus:bg-white/70 focus:ring-2 focus:ring-brand-green/20 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all resize-none" placeholder="This class helps you relax your mind..."></textarea>
                  </div>
                  
                  <div className="col-span-full">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">What You Will Learn (One per line)</label>
                    <textarea required rows="4" value={formData.whatYouWillLearn} onChange={e => setFormData({...formData, whatYouWillLearn: e.target.value})} className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl focus:border-brand-green focus:bg-white/70 focus:ring-2 focus:ring-brand-green/20 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all resize-none" placeholder={`Stress relief techniques\nBreathing exercises\nImprove flexibility`}></textarea>
                  </div>

                  {/* Telugu Translation Section */}
                  <div className="col-span-full pt-6 mt-2 border-t border-brand-green/20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-brand-orange"></div>
                        <h3 className="font-bold text-gray-700 text-sm">Telugu Translation (తెలుగు)</h3>
                      </div>
                      <button
                        type="button"
                        onClick={handleAutoTranslate}
                        disabled={isTranslating}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-orange to-[#e07b20] text-white text-sm font-bold rounded-xl shadow-[0_4px_14px_rgba(234,122,40,0.4)] hover:shadow-[0_6px_20px_rgba(234,122,40,0.5)] hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                      >
                        {isTranslating ? (
                          <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Translating...</>
                        ) : (
                          <><FaLanguage className="text-base" /> ✨ Auto Translate to Telugu</>
                        )}
                      </button>
                    </div>

                    {translateError && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
                        {translateError}
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1.5">Title in Telugu (శీర్షిక)</label>
                        <input type="text" value={formData.title_te} onChange={e => setFormData({...formData, title_te: e.target.value})} className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl focus:border-brand-orange focus:bg-white/70 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all" placeholder="e.g. యోగా ధ్యాన తరగతి" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1.5">Description in Telugu (వివరణ)</label>
                        <textarea rows="3" value={formData.description_te} onChange={e => setFormData({...formData, description_te: e.target.value})} className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl focus:border-brand-orange focus:bg-white/70 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all resize-none" placeholder="ఈ తరగతి గురించి వివరణ..."></textarea>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1.5">What You Will Learn in Telugu (ఒక్కో అంశం వేర్వేరు వరుసలో)</label>
                        <textarea rows="4" value={formData.whatYouWillLearn_te} onChange={e => setFormData({...formData, whatYouWillLearn_te: e.target.value})} className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl focus:border-brand-orange focus:bg-white/70 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all resize-none" placeholder={`ఒత్తిడి తగ్గింపు పద్ధతులు\nశ్వాస వ్యాయామాలు\nవశ్యత మెరుగుపడడం`}></textarea>
                      </div>
                    </div>
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
                      <div className="border border-white/60 bg-white/40 backdrop-blur-md rounded-2xl p-5 text-center hover:bg-white/60 transition-colors shadow-sm cursor-pointer group">
                        <label className="cursor-pointer block">
                          <div className="w-12 h-12 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-white group-hover:scale-110 transition-transform gap-1.5">
                            <FaVideo className="text-brand-green/70 text-lg" /><FaFilePdf className="text-brand-green/70 text-lg" />
                          </div>
                          <span className="text-sm font-semibold text-gray-700">Upload Course Content</span>
                          <p className="text-xs text-gray-500 mt-1.5">{contentFile ? contentFile.name : (editingCourse?.contentUrl ? 'Current file saved' : 'MP4, PDF formats')}</p>
                          <input type="file" className="hidden" accept="video/mp4,application/pdf" onChange={e => setContentFile(e.target.files[0])} />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 pb-24 md:pb-4 mt-auto">
                  <button type="submit" disabled={uploading} className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-bold py-4 rounded-xl shadow-[0_4px_14px_0_rgba(41,120,56,0.39)] transition-all disabled:opacity-70 flex justify-center items-center gap-2 text-lg">
                    {uploading ? (
                      <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Uploading...</>
                    ) : 'Save Class'}
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

