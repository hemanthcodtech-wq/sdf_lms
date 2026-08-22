import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaChalkboardTeacher, FaPlus, FaSearch, FaEnvelope, FaPhone, 
  FaAward, FaCalendarAlt, FaTimes, FaEdit, FaTrash, FaKey, 
  FaCheckCircle, FaSpa, FaOm, FaAppleAlt, FaHeartbeat, FaSyncAlt, 
  FaLock, FaInfoCircle
} from 'react-icons/fa';

const SPECIALITY_PRESETS = [
  'Yoga Asana & Pranayama',
  'Meditation & Mindfulness',
  'Food Nutritionist & Diet',
  'Ayurveda & Herbal Sciences',
  'Sound Healing & Vedic Chanting',
  'Stress Therapy & Holistic Wellness',
  'Hatha & Ashtanga Yoga',
  'Kriya Yoga & Breathwork'
];

const generateRandomPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const InstructorManagement = () => {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  // Drawer Modal State (styled matching CourseManagement drawer)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    speciality: 'Yoga Asana & Pranayama',
    customSpeciality: '',
    experience: '3+ Years',
    bio: '',
    status: 'active',
    customPassword: '',
    newPassword: '',
    sendEmail: true
  });

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [actionErrorMsg, setActionErrorMsg] = useState('');

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/instructors`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      if (res.data.success) {
        setInstructors(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching instructors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (inst = null) => {
    setActionErrorMsg('');
    setActionSuccessMsg('');
    if (inst) {
      setEditingInstructor(inst);
      const isPreset = SPECIALITY_PRESETS.includes(inst.speciality);
      setFormData({
        name: inst.name || '',
        email: inst.emailOrPhone || '',
        phone: inst.phone || '',
        speciality: isPreset ? inst.speciality : 'Other',
        customSpeciality: isPreset ? '' : inst.speciality,
        experience: inst.experience || '',
        bio: inst.bio || '',
        status: inst.status || 'active',
        customPassword: '',
        newPassword: '',
        sendEmail: false
      });
    } else {
      setEditingInstructor(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        speciality: 'Yoga Asana & Pranayama',
        customSpeciality: '',
        experience: '3+ Years',
        bio: '',
        status: 'active',
        customPassword: generateRandomPassword(),
        newPassword: '',
        sendEmail: true
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenDetailDrawer = (inst) => {
    setSelectedInstructor(inst);
    setIsDetailDrawerOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setActionErrorMsg('');
    setActionSuccessMsg('');

    const finalSpeciality = formData.speciality === 'Other' && formData.customSpeciality 
      ? formData.customSpeciality 
      : formData.speciality;

    try {
      if (editingInstructor) {
        const payload = {
          name: formData.name,
          phone: formData.phone,
          speciality: finalSpeciality,
          experience: formData.experience,
          bio: formData.bio,
          status: formData.status,
          newPassword: formData.newPassword || undefined
        };

        const res = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/admin/instructors/${editingInstructor._id}`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
        });

        if (res.data.success) {
          setActionSuccessMsg('Instructor profile updated successfully!');
          fetchInstructors();
          setTimeout(() => {
            setIsModalOpen(false);
            setActionSuccessMsg('');
          }, 1400);
        }
      } else {
        const payload = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          speciality: finalSpeciality,
          experience: formData.experience,
          bio: formData.bio,
          customPassword: formData.customPassword,
          sendEmail: formData.sendEmail
        };

        const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/admin/instructors`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
        });

        if (res.data.success) {
          setActionSuccessMsg(res.data.message || 'Instructor registered successfully!');
          fetchInstructors();
          setTimeout(() => {
            setIsModalOpen(false);
            setActionSuccessMsg('');
          }, 1600);
        }
      }
    } catch (err) {
      setActionErrorMsg(err.response?.data?.message || 'Error saving instructor details.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleResendCredentials = async (inst) => {
    if (!window.confirm(`Generate new login credentials and email them to ${inst.emailOrPhone}?`)) return;

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/admin/instructors/${inst._id}/resend-credentials`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      if (res.data.success) {
        alert(`✅ Credentials dispatched to ${inst.emailOrPhone}!\nTemporary Password: ${res.data.generatedPassword}`);
        fetchInstructors();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resend credentials.');
    }
  };

  const handleDeleteInstructor = async (inst) => {
    if (!window.confirm(`Are you sure you want to remove instructor "${inst.name || inst.emailOrPhone}"? This action cannot be undone.`)) return;

    try {
      const res = await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/admin/instructors/${inst._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      if (res.data.success) {
        fetchInstructors();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete instructor.');
    }
  };

  const filteredInstructors = instructors.filter(inst => {
    const matchesSearch = 
      (inst.name && inst.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (inst.emailOrPhone && inst.emailOrPhone.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (inst.phone && inst.phone.includes(searchTerm)) ||
      (inst.speciality && inst.speciality.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = filterCategory === 'ALL' || inst.speciality?.toLowerCase().includes(filterCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  const getSpecialityIcon = (spec = '') => {
    const s = spec.toLowerCase();
    if (s.includes('yoga')) return <FaSpa className="text-emerald-600" />;
    if (s.includes('meditation') || s.includes('mindful')) return <FaOm className="text-purple-600" />;
    if (s.includes('food') || s.includes('nutrition') || s.includes('diet')) return <FaAppleAlt className="text-amber-600" />;
    if (s.includes('ayurveda') || s.includes('herbal')) return <FaHeartbeat className="text-teal-600" />;
    return <FaAward className="text-brand-green" />;
  };

  return (
    <div className="space-y-8 pb-24 md:pb-8 font-inter">
      
      {/* Top Banner Header */}
      <div className="bg-white/60 backdrop-blur-2xl rounded-[2.5rem] p-6 lg:p-8 border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-green/10 text-brand-green-dark text-xs font-bold uppercase tracking-wider mb-2">
            <FaChalkboardTeacher /> Faculty & Gurus
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">Instructor Management</h1>
          <p className="text-gray-500 text-sm mt-1">
            Configure wellness masters, assign specialities, and dispatch portal login credentials.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="bg-brand-green hover:bg-brand-green-dark text-white font-bold py-3.5 px-6 rounded-2xl shadow-[0_6px_20px_rgba(41,120,56,0.3)] transition-all flex items-center gap-2.5 w-max text-xs lg:text-sm group cursor-pointer"
        >
          <FaPlus size={12} className="group-hover:rotate-90 transition-transform" />
          <span>Register New Instructor</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/80 backdrop-blur-xl p-5 rounded-3xl border border-white/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-black">
            <FaChalkboardTeacher />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Gurus</span>
            <h3 className="text-2xl font-black text-gray-900">{instructors.length}</h3>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-5 rounded-3xl border border-white/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center text-xl font-black">
            <FaSpa />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Yoga & Asana</span>
            <h3 className="text-2xl font-black text-gray-900">
              {instructors.filter(i => i.speciality?.toLowerCase().includes('yoga')).length}
            </h3>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-5 rounded-3xl border border-white/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-xl font-black">
            <FaOm />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Meditation</span>
            <h3 className="text-2xl font-black text-gray-900">
              {instructors.filter(i => i.speciality?.toLowerCase().includes('meditation')).length}
            </h3>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-5 rounded-3xl border border-white/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl font-black">
            <FaAppleAlt />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nutrition & Diet</span>
            <h3 className="text-2xl font-black text-gray-900">
              {instructors.filter(i => i.speciality?.toLowerCase().includes('nutrition') || i.speciality?.toLowerCase().includes('food')).length}
            </h3>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white/70 backdrop-blur-xl p-4 rounded-3xl border border-white/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search by instructor name, email, phone, skill..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-gray-50/80 border border-gray-200/80 rounded-2xl text-xs lg:text-sm font-medium text-gray-800 placeholder-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {['ALL', 'Yoga', 'Meditation', 'Nutrition', 'Ayurveda'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
                filterCategory === cat 
                  ? 'bg-brand-green text-white shadow-sm' 
                  : 'bg-white/80 text-gray-600 hover:bg-gray-100 border border-gray-200/60'
              }`}
            >
              {cat === 'ALL' ? 'All Specialties' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Instructors Table View */}
      {loading ? (
        <div className="flex justify-center p-20">
          <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white/75 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-white/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 text-xs font-bold uppercase tracking-wider">
                  <th className="p-5 pl-8">Instructor Profile</th>
                  <th className="p-5">Speciality / Category</th>
                  <th className="p-5">Experience</th>
                  <th className="p-5">Status</th>
                  <th className="p-5 text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/80 text-sm">
                {filteredInstructors.map((inst) => (
                  <tr key={inst._id} className="hover:bg-white/90 transition-colors">
                    <td className="p-5 pl-8">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0A4F2A] to-[#15803d] text-white flex items-center justify-center font-black text-base shadow-md shrink-0">
                          {inst.name ? inst.name.charAt(0).toUpperCase() : 'I'}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                            {inst.name || 'Unnamed Instructor'}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                            <FaEnvelope size={11} className="text-gray-400" />
                            <span>{inst.emailOrPhone}</span>
                          </div>
                          {inst.phone && (
                            <div className="text-[11px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                              <FaPhone size={10} className="text-gray-400" />
                              <span>{inst.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="p-5">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-gray-200/80 text-xs font-bold text-gray-800">
                        {getSpecialityIcon(inst.speciality)}
                        <span>{inst.speciality || 'Yoga & Holistic Wellness'}</span>
                      </div>
                    </td>

                    <td className="p-5">
                      <span className="text-xs font-extrabold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg">
                        {inst.experience || 'Experienced'}
                      </span>
                    </td>

                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                        inst.status === 'inactive'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                      }`}>
                        {inst.status || 'active'}
                      </span>
                    </td>

                    <td className="p-5 pr-8 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenDetailDrawer(inst)}
                          title="View Profile Details"
                          className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all cursor-pointer"
                        >
                          <FaInfoCircle size={14} />
                        </button>

                        <button
                          onClick={() => handleOpenModal(inst)}
                          title="Edit Profile"
                          className="p-2.5 bg-brand-green/10 hover:bg-brand-green hover:text-white text-brand-green-dark rounded-xl transition-all cursor-pointer"
                        >
                          <FaEdit size={14} />
                        </button>

                        <button
                          onClick={() => handleResendCredentials(inst)}
                          title="Resend Login Credentials Email"
                          className="p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl transition-all border border-amber-200/60 cursor-pointer"
                        >
                          <FaKey size={14} />
                        </button>

                        <button
                          onClick={() => handleDeleteInstructor(inst)}
                          title="Delete Instructor"
                          className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all border border-red-200/60 cursor-pointer"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredInstructors.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-12 text-center text-gray-400 font-medium">
                      No instructors match your search or filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT INSTRUCTOR DRAWER (Styled EXACTLY like Create Course Drawer) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-40 flex justify-end">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-green-dark/20 backdrop-blur-sm"
              onClick={() => !formSubmitting && setIsModalOpen(false)}
            />

            {/* Drawer Container */}
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }} 
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="bg-white/40 backdrop-blur-3xl border-l border-white/60 shadow-[-20px_0_40px_rgba(0,0,0,0.08)] w-full max-w-2xl h-full overflow-y-auto relative z-10 p-6 md:p-10 flex flex-col overflow-x-hidden"
            >
              {/* Glassmorphism background refraction blobs */}
              <div className="absolute top-[-5%] right-[-10%] w-72 h-72 bg-brand-green/30 rounded-full blur-[90px] pointer-events-none"></div>
              <div className="absolute bottom-[20%] left-[-10%] w-64 h-64 bg-[#d67b22]/20 rounded-full blur-[90px] pointer-events-none"></div>

              {/* Close Button */}
              <button 
                onClick={() => !formSubmitting && setIsModalOpen(false)}
                className="absolute top-6 right-6 text-gray-500 hover:text-brand-green bg-white/60 backdrop-blur-md p-2.5 rounded-full border border-white/50 shadow-sm transition-all z-20 cursor-pointer"
              >
                <FaTimes />
              </button>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-6 relative z-10">
                {editingInstructor ? 'Edit Instructor Profile' : 'Register New Instructor'}
              </h2>

              {actionErrorMsg && (
                <div className="mb-4 p-4 bg-red-50/90 backdrop-blur-md border border-red-200 text-red-700 text-xs font-bold rounded-2xl relative z-10">
                  {actionErrorMsg}
                </div>
              )}

              {actionSuccessMsg && (
                <div className="mb-4 p-4 bg-emerald-50/90 backdrop-blur-md border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 relative z-10">
                  <FaCheckCircle /> {actionSuccessMsg}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                  
                  {/* Full Name */}
                  <div className="col-span-full md:col-span-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Full Name *
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={formData.name} 
                      onChange={e => setFormData({ ...formData, name: e.target.value })} 
                      className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl focus:border-brand-green focus:bg-white/70 focus:ring-2 focus:ring-brand-green/20 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all font-medium" 
                      placeholder="e.g. Acharya Ramesh Sharma" 
                    />
                  </div>

                  {/* Email */}
                  <div className="col-span-full md:col-span-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Email Address (Login ID) *
                    </label>
                    <input 
                      type="email" 
                      required 
                      disabled={!!editingInstructor}
                      value={formData.email} 
                      onChange={e => setFormData({ ...formData, email: e.target.value })} 
                      className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl focus:border-brand-green focus:bg-white/70 focus:ring-2 focus:ring-brand-green/20 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all font-medium disabled:opacity-60" 
                      placeholder="instructor@swamydwija.org" 
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Phone Number
                    </label>
                    <input 
                      type="tel" 
                      value={formData.phone} 
                      onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                      className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl focus:border-brand-green focus:bg-white/70 focus:ring-2 focus:ring-brand-green/20 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all font-medium" 
                      placeholder="+91 98765 43210" 
                    />
                  </div>

                  {/* Experience */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Experience
                    </label>
                    <input 
                      type="text" 
                      value={formData.experience} 
                      onChange={e => setFormData({ ...formData, experience: e.target.value })} 
                      className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl focus:border-brand-green focus:bg-white/70 focus:ring-2 focus:ring-brand-green/20 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all font-medium" 
                      placeholder="e.g. 5+ Years / Senior Guru" 
                    />
                  </div>

                  {/* Speciality Dropdown */}
                  <div className="col-span-full">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Speciality / Category Discipline *
                    </label>
                    <select 
                      value={formData.speciality} 
                      onChange={e => setFormData({ ...formData, speciality: e.target.value })} 
                      className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl outline-none focus:bg-white/70 focus:border-brand-green transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] font-medium"
                    >
                      {SPECIALITY_PRESETS.map((preset) => (
                        <option key={preset} value={preset}>
                          {preset}
                        </option>
                      ))}
                      <option value="Other">Other / Custom Speciality</option>
                    </select>
                  </div>

                  {formData.speciality === 'Other' && (
                    <div className="col-span-full">
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Specify Custom Speciality
                      </label>
                      <input 
                        type="text" 
                        value={formData.customSpeciality} 
                        onChange={e => setFormData({ ...formData, customSpeciality: e.target.value })} 
                        className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl focus:border-brand-green focus:bg-white/70 focus:ring-2 focus:ring-brand-green/20 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all font-medium" 
                        placeholder="e.g. Mudra Therapy, Nada Yoga" 
                      />
                    </div>
                  )}

                  {/* Account Status (when editing) */}
                  {editingInstructor && (
                    <div className="col-span-full">
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Account Status
                      </label>
                      <select 
                        value={formData.status} 
                        onChange={e => setFormData({ ...formData, status: e.target.value })} 
                        className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl outline-none focus:bg-white/70 focus:border-brand-green transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] font-medium"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive / Suspended</option>
                      </select>
                    </div>
                  )}

                  {/* Bio / Description */}
                  <div className="col-span-full">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Instructor Bio & Profile Summary
                    </label>
                    <textarea 
                      rows="3" 
                      value={formData.bio} 
                      onChange={e => setFormData({ ...formData, bio: e.target.value })} 
                      className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl focus:border-brand-green focus:bg-white/70 focus:ring-2 focus:ring-brand-green/20 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all resize-none font-medium" 
                      placeholder="Brief description about the instructor's background, certifications, and teaching philosophy..."
                    ></textarea>
                  </div>

                  {/* Password Configuration Section */}
                  {!editingInstructor ? (
                    <div className="col-span-full bg-white/50 backdrop-blur-md border border-white/60 p-5 rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                          <FaLock className="text-brand-green" /> Initial Portal Password
                        </label>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, customPassword: generateRandomPassword() }))}
                          className="text-xs font-bold text-brand-green hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <FaSyncAlt size={11} /> Auto-Generate
                        </button>
                      </div>
                      <input
                        type="text"
                        name="customPassword"
                        value={formData.customPassword}
                        onChange={handleFormChange}
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl font-mono text-sm font-bold text-gray-900 focus:ring-2 focus:ring-brand-green/20 outline-none"
                      />
                      <p className="text-xs text-gray-500">
                        This password will be securely hashed and optionally sent to the instructor's email for their first login.
                      </p>

                      {/* Email Login Credentials Checkbox */}
                      <label className="flex items-center gap-3 pt-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          name="sendEmail"
                          checked={formData.sendEmail}
                          onChange={handleFormChange}
                          className="w-4 h-4 text-brand-green rounded focus:ring-brand-green/20 border-gray-300 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-gray-800">
                          Email Login Credentials to Instructor Automatically
                        </span>
                      </label>
                    </div>
                  ) : (
                    <div className="col-span-full bg-white/50 backdrop-blur-md border border-white/60 p-5 rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] space-y-2">
                      <label className="block text-sm font-bold text-gray-800">
                        Change Password (Leave blank to keep unchanged)
                      </label>
                      <input
                        type="password"
                        placeholder="Enter new password (min 6 characters)"
                        value={formData.newPassword || ''}
                        onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-green/20 outline-none"
                      />
                    </div>
                  )}

                </div>

                {/* Save Button */}
                <div className="pt-8 pb-24 md:pb-4 mt-auto">
                  <button 
                    type="submit" 
                    disabled={formSubmitting} 
                    className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-bold py-4 rounded-xl shadow-[0_4px_14px_0_rgba(41,120,56,0.39)] transition-all disabled:opacity-70 flex justify-center items-center gap-2 text-lg cursor-pointer"
                  >
                    {formSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving Instructor...</span>
                      </>
                    ) : (
                      <span>{editingInstructor ? 'Update Instructor' : 'Save & Register Instructor'}</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAIL DRAWER */}
      <AnimatePresence>
        {isDetailDrawerOpen && selectedInstructor && (
          <div className="fixed inset-0 z-40 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-green-dark/20 backdrop-blur-sm"
              onClick={() => setIsDetailDrawerOpen(false)}
            />

            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="bg-white/40 backdrop-blur-3xl border-l border-white/60 shadow-[-20px_0_40px_rgba(0,0,0,0.08)] w-full max-w-md h-full overflow-y-auto relative z-10 p-6 flex flex-col"
            >
              <button 
                onClick={() => setIsDetailDrawerOpen(false)}
                className="absolute top-6 right-6 text-gray-500 hover:text-brand-green bg-white/60 backdrop-blur-md p-2.5 rounded-full border border-white/50 shadow-sm transition-all z-20 cursor-pointer"
              >
                <FaTimes />
              </button>

              <h2 className="text-2xl font-bold text-gray-800 mb-2 mt-2">Instructor Profile</h2>
              <p className="text-brand-green font-semibold text-sm mb-6">{selectedInstructor.name}</p>

              <div className="flex-1 space-y-5">
                <div className="p-4 bg-white/80 rounded-2xl border border-gray-100 shadow-sm space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-medium">Contact Email:</span>
                    <span className="font-bold text-gray-800">{selectedInstructor.emailOrPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-medium">Phone:</span>
                    <span className="font-bold text-gray-800">{selectedInstructor.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-medium">Speciality:</span>
                    <span className="font-bold text-brand-green-dark">{selectedInstructor.speciality}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-medium">Experience:</span>
                    <span className="font-bold text-gray-800">{selectedInstructor.experience || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-medium">Status:</span>
                    <span className="font-bold text-emerald-700 uppercase">{selectedInstructor.status || 'Active'}</span>
                  </div>
                </div>

                {selectedInstructor.bio && (
                  <div className="p-4 bg-white/80 rounded-2xl border border-gray-100 shadow-sm space-y-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Biography</span>
                    <p className="text-xs text-gray-600 leading-relaxed">{selectedInstructor.bio}</p>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-gray-100 flex gap-2 mt-auto">
                <button
                  onClick={() => {
                    setIsDetailDrawerOpen(false);
                    handleOpenModal(selectedInstructor);
                  }}
                  className="flex-1 py-3 bg-brand-green text-white rounded-xl font-bold text-xs hover:bg-brand-green-dark transition-all cursor-pointer"
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => handleResendCredentials(selectedInstructor)}
                  className="flex-1 py-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl font-bold text-xs hover:bg-amber-100 transition-all cursor-pointer"
                >
                  Resend Login Email
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default InstructorManagement;
