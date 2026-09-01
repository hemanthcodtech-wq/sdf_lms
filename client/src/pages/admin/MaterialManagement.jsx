import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaTimes, FaVideo, FaFilePdf, FaBook, FaTrash, FaEye } from 'react-icons/fa';

const MaterialManagement = () => {
  const [courses, setCourses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [previewMaterial, setPreviewMaterial] = useState(null);
  
  const [formData, setFormData] = useState({
    courseId: '',
    date: '',
    topicsCovered: '',
    driveLink: '',
    materialType: 'Recording'
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      fetchMaterials(selectedCourseId);
    } else {
      setMaterials([]);
    }
  }, [selectedCourseId]);

  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/courses`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setCourses(res.data.data);
      if (res.data.data.length > 0) {
        setSelectedCourseId(res.data.data[0]._id);
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async (courseId) => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/courses/${courseId}/materials`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setMaterials(res.data.data);
    } catch (err) {
      console.error("Error fetching materials:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (window.confirm('Are you sure you want to remove this material?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/courses/${selectedCourseId}/materials/${materialId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
        });
        fetchMaterials(selectedCourseId);
      } catch (err) {
        console.error("Error deleting material:", err);
        alert('Failed to delete material.');
      }
    }
  };

  const getEmbedUrl = (url) => {
    if (!url) return '';
    if (url.includes('drive.google.com')) {
      if (url.includes('/view')) {
        return url.replace(/\/view(\?usp=.*)?$/, '/preview');
      }
      if (url.includes('/edit')) {
        return url.replace(/\/edit(\?usp=.*)?$/, '/preview');
      }
      const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://drive.google.com/file/d/${match[1]}/preview`;
      }
      const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (idMatch && idMatch[1]) {
        return `https://drive.google.com/file/d/${idMatch[1]}/preview`;
      }
    }
    return url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/courses/${formData.courseId}/materials`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setIsModalOpen(false);
      setFormData({ courseId: '', date: '', topicsCovered: '', driveLink: '', materialType: 'Recording' });
      if (formData.courseId === selectedCourseId) {
        fetchMaterials(selectedCourseId);
      } else {
        setSelectedCourseId(formData.courseId);
      }
    } catch (err) {
      console.error("Error adding material:", err);
      alert('Failed to add material.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-24 md:pb-8 font-inter">
      
      {/* Top Banner Header */}
      <div className="bg-white/60 backdrop-blur-2xl rounded-[2.5rem] p-6 lg:p-8 border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-green/10 text-brand-green-dark text-xs font-bold uppercase tracking-wider mb-2">
            Learning Resources
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">Class Materials & Recordings</h1>
          <p className="text-gray-500 text-sm mt-1">Upload daily session video recordings, PDF guides, and practice materials.</p>
        </div>
        
        <button 
          onClick={() => {
            setFormData({ ...formData, courseId: selectedCourseId });
            setIsModalOpen(true);
          }}
          className="bg-brand-green hover:bg-brand-green-dark text-white font-bold py-3.5 px-6 rounded-2xl shadow-[0_6px_20px_rgba(41,120,56,0.3)] transition-all flex items-center gap-2.5 w-max text-xs lg:text-sm group"
        >
          <FaPlus size={12} className="group-hover:rotate-90 transition-transform" />
          <span>Upload Material</span>
        </button>
      </div>

      {/* Course Selector Filter Card */}
      <div className="bg-white/70 backdrop-blur-2xl rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-white/80 p-5 lg:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center font-bold">
            <FaBook />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Select Course Curricula</label>
            <span className="text-xs text-gray-500 font-medium">Filter materials by registered program</span>
          </div>
        </div>
        
        <select 
          value={selectedCourseId} 
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="w-full md:w-80 p-3.5 bg-white/90 border border-gray-200/80 rounded-2xl outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all font-bold text-gray-900 shadow-xs text-sm"
        >
          {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
          {materials.map(mat => (
            <div key={mat._id} className="bg-white/75 backdrop-blur-2xl rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-white/80 p-6 flex flex-col justify-between hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    {mat.materialType === 'Recording' ? (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-bold">
                        <FaVideo size={12} /> Recording
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl text-xs font-bold">
                        <FaFilePdf size={12} /> Document
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-gray-500 bg-[#FAF7F2] border border-gray-200/50 px-3 py-1 rounded-xl">
                    {new Date(mat.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-gray-900 group-hover:text-brand-green transition-colors leading-snug">{mat.topicsCovered}</h3>
              </div>

              <div className="flex items-center gap-2.5 pt-5 border-t border-gray-100 mt-6">
                <button 
                  onClick={() => setPreviewMaterial(mat)} 
                  className="flex-1 bg-brand-green/10 hover:bg-brand-green hover:text-white text-brand-green-dark font-bold py-2.5 rounded-xl text-center transition-all flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider"
                >
                  <FaEye size={12} /> Preview
                </button>
                <button 
                  onClick={() => handleDeleteMaterial(mat._id)}
                  className="w-10 h-10 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all shadow-xs"
                  title="Delete Material"
                >
                  <FaTrash size={12} />
                </button>
              </div>
            </div>
          ))}
          {materials.length === 0 && (
            <div className="col-span-full py-16 text-center text-gray-400 bg-white/40 backdrop-blur-md rounded-3xl border border-dashed border-gray-300">
              No materials or recordings uploaded yet for this course.
            </div>
          )}
        </div>
      )}

      {/* Preview Modal for Admin */}
      <AnimatePresence>
        {previewMaterial && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewMaterial(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col relative z-10 overflow-hidden">
              <div className="bg-white px-6 py-5 border-b border-gray-100 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{previewMaterial.topicsCovered}</h3>
                  <p className="text-sm font-medium text-gray-500">{previewMaterial.materialType} • {new Date(previewMaterial.date).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <a href={previewMaterial.driveLink} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                    Open in Drive
                  </a>
                  <button onClick={() => setPreviewMaterial(null)} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
                    <FaTimes size={18}/>
                  </button>
                </div>
              </div>
              <div className="flex-1 w-full bg-gray-100 flex items-center justify-center relative">
                <iframe 
                  src={getEmbedUrl(previewMaterial.driveLink)} 
                  className="w-full h-full border-none" 
                  title="Material Viewer" 
                  allow="autoplay; fullscreen"
                ></iframe>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Material Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-40 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-green-dark/20 backdrop-blur-sm"
              onClick={() => !submitting && setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="bg-white/40 backdrop-blur-3xl border-l border-white/60 shadow-[-20px_0_40px_rgba(0,0,0,0.08)] w-full max-w-md h-full overflow-y-auto relative z-10 p-6 flex flex-col"
            >
              <button 
                onClick={() => !submitting && setIsModalOpen(false)}
                className="absolute top-6 right-6 text-gray-500 hover:text-brand-green bg-white/60 backdrop-blur-md p-2.5 rounded-full border border-white/50 shadow-sm transition-all z-20"
              >
                <FaTimes />
              </button>
              
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2"><FaBook className="text-brand-green"/> Add Material</h2>
              
              <form onSubmit={handleSubmit} className="space-y-5 flex-1">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Course</label>
                  <select required value={formData.courseId} onChange={e => setFormData({...formData, courseId: e.target.value})} className="w-full p-3 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl outline-none focus:border-brand-green transition-all">
                    <option value="">Select a course...</option>
                    {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date of Class</label>
                  <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-3 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl outline-none focus:border-brand-green transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Topics Covered</label>
                  <input type="text" required placeholder="e.g. Advanced Poses" value={formData.topicsCovered} onChange={e => setFormData({...formData, topicsCovered: e.target.value})} className="w-full p-3 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl outline-none focus:border-brand-green transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Material Type</label>
                  <select required value={formData.materialType} onChange={e => setFormData({...formData, materialType: e.target.value})} className="w-full p-3 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl outline-none focus:border-brand-green transition-all">
                    <option value="Recording">Recording</option>
                    <option value="PDF">PDF</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Drive Link (URL)</label>
                  <input type="url" required placeholder="https://drive.google.com/..." value={formData.driveLink} onChange={e => setFormData({...formData, driveLink: e.target.value})} className="w-full p-3 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl outline-none focus:border-brand-green transition-all" />
                  <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200/60 p-2.5 rounded-lg mt-2 font-medium leading-relaxed">
                    💡 <strong>Important:</strong> In Google Drive, right-click your file &gt; click <strong>Share</strong> &gt; set <strong>General Access</strong> to <strong>"Anyone with the link" (Viewer)</strong> so all students can view it instantly without requesting access.
                  </p>
                </div>
                <div className="pt-6">
                  <button type="submit" disabled={submitting} className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-70 flex justify-center items-center gap-2">
                    {submitting ? 'Adding...' : 'Add Material'}
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

export default MaterialManagement;
