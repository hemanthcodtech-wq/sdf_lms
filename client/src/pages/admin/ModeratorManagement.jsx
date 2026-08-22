import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaShieldAlt, FaPlus, FaSearch, FaEnvelope, FaPhone, 
  FaTimes, FaEdit, FaTrash, FaKey, FaCheckCircle, 
  FaUserShield, FaSyncAlt, FaLock
} from 'react-icons/fa';

const generateRandomPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const ModeratorManagement = () => {
  const [moderators, setModerators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Drawer Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModerator, setEditingModerator] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
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
    fetchModerators();
  }, []);

  const fetchModerators = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/moderators`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      if (res.data.success) {
        setModerators(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching moderators:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (mod = null) => {
    setActionErrorMsg('');
    setActionSuccessMsg('');
    if (mod) {
      setEditingModerator(mod);
      setFormData({
        name: mod.name || '',
        email: mod.emailOrPhone || '',
        phone: mod.phone || '',
        bio: mod.bio || '',
        status: mod.status || 'active',
        customPassword: '',
        newPassword: '',
        sendEmail: false
      });
    } else {
      setEditingModerator(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        bio: '',
        status: 'active',
        customPassword: generateRandomPassword(),
        newPassword: '',
        sendEmail: true
      });
    }
    setIsModalOpen(true);
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

    try {
      if (editingModerator) {
        const payload = {
          name: formData.name,
          phone: formData.phone,
          bio: formData.bio,
          status: formData.status,
          newPassword: formData.newPassword || undefined
        };

        const res = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/admin/moderators/${editingModerator._id}`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
        });

        if (res.data.success) {
          setActionSuccessMsg('Moderator profile updated successfully!');
          fetchModerators();
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
          bio: formData.bio,
          customPassword: formData.customPassword,
          sendEmail: formData.sendEmail
        };

        const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/admin/moderators`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
        });

        if (res.data.success) {
          setActionSuccessMsg(res.data.message || 'Moderator created successfully!');
          fetchModerators();
          setTimeout(() => {
            setIsModalOpen(false);
            setActionSuccessMsg('');
          }, 1600);
        }
      }
    } catch (err) {
      setActionErrorMsg(err.response?.data?.message || 'Error saving moderator.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleResendCredentials = async (mod) => {
    if (!window.confirm(`Generate new login credentials and email them to ${mod.emailOrPhone}?`)) return;

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/admin/moderators/${mod._id}/resend-credentials`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      if (res.data.success) {
        alert(`✅ Credentials dispatched to ${mod.emailOrPhone}!\nTemporary Password: ${res.data.generatedPassword}`);
        fetchModerators();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resend credentials.');
    }
  };

  const handleDeleteModerator = async (mod) => {
    if (!window.confirm(`Are you sure you want to remove moderator "${mod.name || mod.emailOrPhone}"?`)) return;

    try {
      const res = await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/admin/moderators/${mod._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      if (res.data.success) {
        fetchModerators();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete moderator.');
    }
  };

  const filteredModerators = moderators.filter(mod => 
    (mod.name && mod.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (mod.emailOrPhone && mod.emailOrPhone.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (mod.phone && mod.phone.includes(searchTerm))
  );

  return (
    <div className="space-y-8 pb-24 md:pb-8 font-inter">
      
      {/* Top Banner Header */}
      <div className="bg-white/60 backdrop-blur-2xl rounded-[2.5rem] p-6 lg:p-8 border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-green/10 text-brand-green-dark text-xs font-bold uppercase tracking-wider mb-2">
            <FaShieldAlt /> Governance & Security
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">Moderator Management</h1>
          <p className="text-gray-500 text-sm mt-1">
            Assign platform moderators to manage discussions, supervise classroom conduct, and maintain community harmony.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="bg-brand-green hover:bg-brand-green-dark text-white font-bold py-3.5 px-6 rounded-2xl shadow-[0_6px_20px_rgba(41,120,56,0.3)] transition-all flex items-center gap-2.5 w-max text-xs lg:text-sm group cursor-pointer"
        >
          <FaPlus size={12} className="group-hover:rotate-90 transition-transform" />
          <span>Add New Moderator</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/80 backdrop-blur-xl p-5 rounded-3xl border border-white/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-green/10 text-brand-green-dark flex items-center justify-center text-xl font-black">
            <FaUserShield />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Moderators</span>
            <h3 className="text-2xl font-black text-gray-900">{moderators.length}</h3>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-5 rounded-3xl border border-white/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-black">
            <FaCheckCircle />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Staff</span>
            <h3 className="text-2xl font-black text-gray-900">
              {moderators.filter(m => m.status !== 'inactive').length}
            </h3>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-5 rounded-3xl border border-white/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center text-xl font-black">
            <FaShieldAlt />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Portal Role</span>
            <h3 className="text-lg font-black text-gray-900">Platform Governance</h3>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white/70 backdrop-blur-xl p-4 rounded-3xl border border-white/80 shadow-xs flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-gray-50/80 border border-gray-200/80 rounded-2xl text-xs lg:text-sm font-medium text-gray-800 placeholder-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
          />
        </div>
      </div>

      {/* Moderators Table */}
      {loading ? (
        <div className="flex justify-center p-20">
          <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white/75 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-white/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[750px]">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 text-xs font-bold uppercase tracking-wider">
                  <th className="p-5 pl-8">Moderator Name / Contact</th>
                  <th className="p-5">Assigned Role</th>
                  <th className="p-5">Status</th>
                  <th className="p-5">Created Date</th>
                  <th className="p-5 text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/80 text-sm">
                {filteredModerators.map((mod) => (
                  <tr key={mod._id} className="hover:bg-white/90 transition-colors">
                    <td className="p-5 pl-8">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0A4F2A] to-[#15803d] text-white flex items-center justify-center font-black text-base shadow-md shrink-0">
                          {mod.name ? mod.name.charAt(0).toUpperCase() : 'M'}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-sm">{mod.name || 'Unnamed Moderator'}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                            <FaEnvelope size={11} className="text-gray-400" />
                            <span>{mod.emailOrPhone}</span>
                          </div>
                          {mod.phone && (
                            <div className="text-[11px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                              <FaPhone size={10} className="text-gray-400" />
                              <span>{mod.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="p-5">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-full text-xs font-bold uppercase tracking-wider">
                        Moderator
                      </span>
                    </td>

                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                        mod.status === 'inactive'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                      }`}>
                        {mod.status || 'active'}
                      </span>
                    </td>

                    <td className="p-5 text-gray-600 font-medium text-xs">
                      {new Date(mod.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>

                    <td className="p-5 pr-8 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(mod)}
                          title="Edit Profile"
                          className="p-2.5 bg-brand-green/10 hover:bg-brand-green hover:text-white text-brand-green-dark rounded-xl transition-all cursor-pointer"
                        >
                          <FaEdit size={14} />
                        </button>

                        <button
                          onClick={() => handleResendCredentials(mod)}
                          title="Resend Login Credentials"
                          className="p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl transition-all border border-amber-200/60 cursor-pointer"
                        >
                          <FaKey size={14} />
                        </button>

                        <button
                          onClick={() => handleDeleteModerator(mod)}
                          title="Delete Moderator"
                          className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all border border-red-200/60 cursor-pointer"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredModerators.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-12 text-center text-gray-400 font-medium">
                      No moderators found matching search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODERATOR DRAWER */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-40 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-green-dark/20 backdrop-blur-sm"
              onClick={() => !formSubmitting && setIsModalOpen(false)}
            />

            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }} 
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="bg-white/40 backdrop-blur-3xl border-l border-white/60 shadow-[-20px_0_40px_rgba(0,0,0,0.08)] w-full max-w-2xl h-full overflow-y-auto relative z-10 p-6 md:p-10 flex flex-col overflow-x-hidden"
            >
              {/* Glassmorphism background blobs */}
              <div className="absolute top-[-5%] right-[-10%] w-72 h-72 bg-brand-green/30 rounded-full blur-[90px] pointer-events-none"></div>
              <div className="absolute bottom-[20%] left-[-10%] w-64 h-64 bg-[#d67b22]/20 rounded-full blur-[90px] pointer-events-none"></div>

              <button 
                onClick={() => !formSubmitting && setIsModalOpen(false)}
                className="absolute top-6 right-6 text-gray-500 hover:text-brand-green bg-white/60 backdrop-blur-md p-2.5 rounded-full border border-white/50 shadow-sm transition-all z-20 cursor-pointer"
              >
                <FaTimes />
              </button>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-6 relative z-10">
                {editingModerator ? 'Edit Moderator Profile' : 'Add Platform Moderator'}
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
                      placeholder="e.g. Anand Kumar" 
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
                      disabled={!!editingModerator}
                      value={formData.email} 
                      onChange={e => setFormData({ ...formData, email: e.target.value })} 
                      className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl focus:border-brand-green focus:bg-white/70 focus:ring-2 focus:ring-brand-green/20 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all font-medium disabled:opacity-60" 
                      placeholder="moderator@swamydwija.org" 
                    />
                  </div>

                  {/* Phone */}
                  <div className="col-span-full md:col-span-1">
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

                  {/* Status (if editing) */}
                  {editingModerator && (
                    <div className="col-span-full md:col-span-1">
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

                  {/* Bio / Responsibilities */}
                  <div className="col-span-full">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Notes & Responsibilities
                    </label>
                    <textarea 
                      rows="3" 
                      value={formData.bio} 
                      onChange={e => setFormData({ ...formData, bio: e.target.value })} 
                      className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl focus:border-brand-green focus:bg-white/70 focus:ring-2 focus:ring-brand-green/20 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all resize-none font-medium" 
                      placeholder="e.g. Oversees live session chats and user feedback..."
                    ></textarea>
                  </div>

                  {/* Password Configuration */}
                  {!editingModerator ? (
                    <div className="col-span-full bg-white/50 backdrop-blur-md border border-white/60 p-5 rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                          <FaLock className="text-brand-green" /> Portal Password
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

                      <label className="flex items-center gap-3 pt-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          name="sendEmail"
                          checked={formData.sendEmail}
                          onChange={handleFormChange}
                          className="w-4 h-4 text-brand-green rounded focus:ring-brand-green/20 border-gray-300 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-gray-800">
                          Email Login Credentials to Moderator Automatically
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

                <div className="pt-8 pb-24 md:pb-4 mt-auto">
                  <button 
                    type="submit" 
                    disabled={formSubmitting} 
                    className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-bold py-4 rounded-xl shadow-[0_4px_14px_0_rgba(41,120,56,0.39)] transition-all disabled:opacity-70 flex justify-center items-center gap-2 text-lg cursor-pointer"
                  >
                    {formSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving Moderator...</span>
                      </>
                    ) : (
                      <span>{editingModerator ? 'Update Moderator' : 'Save & Register Moderator'}</span>
                    )}
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

export default ModeratorManagement;
