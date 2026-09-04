import React, { useState, useEffect, useRef } from 'react';
import { FaArrowLeft, FaChevronRight, FaCamera, FaSpinner, FaCheckCircle, FaEdit, FaTimes, FaSave, FaUser, FaPhone, FaEnvelope, FaLock } from 'react-icons/fa';
import { PiCertificate, PiHeart, PiBookOpen, PiCreditCard, PiGearSix, PiQuestion, PiSignOut } from 'react-icons/pi';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const ProfileMenu = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState({
    name: '',
    firstName: '',
    lastName: '',
    emailOrPhone: '',
    email: '',
    phone: '',
    avatar: '',
  });
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [saveErrorMsg, setSaveErrorMsg] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        setProfile(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const handleOpenEditModal = () => {
    setEditFormData({
      name: profile.name || `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
      phone: profile.phone || '',
      email: profile.email || (profile.emailOrPhone && profile.emailOrPhone.includes('@') ? profile.emailOrPhone : ''),
      password: '',
    });
    setSaveErrorMsg('');
    setSaveSuccessMsg('');
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    setEditFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editFormData.name.trim()) {
      setSaveErrorMsg('Please enter your full legal name.');
      return;
    }

    setSavingProfile(true);
    setSaveErrorMsg('');
    setSaveSuccessMsg('');

    try {
      const token = localStorage.getItem('token');
      const payload = {
        name: editFormData.name.trim(),
        phone: editFormData.phone.trim(),
        email: editFormData.email.trim(),
      };
      if (editFormData.password.trim()) {
        payload.password = editFormData.password.trim();
      }

      const res = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/auth/profile`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setProfile(prev => ({
          ...prev,
          name: res.data.name,
          firstName: res.data.firstName,
          lastName: res.data.lastName,
          email: res.data.email,
          emailOrPhone: res.data.emailOrPhone,
          phone: res.data.phone
        }));

        // Update stored user in localStorage
        const storedUser = localStorage.getItem('user');
        let updatedUserObj = res.data;
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            updatedUserObj = {
              ...parsed,
              name: res.data.name,
              firstName: res.data.firstName,
              lastName: res.data.lastName,
              email: res.data.email,
              emailOrPhone: res.data.emailOrPhone,
              phone: res.data.phone
            };
          } catch (e) {}
        }
        localStorage.setItem('user', JSON.stringify(updatedUserObj));
        if (res.data.token) {
          localStorage.setItem('token', res.data.token);
        }

        // Global broadcast for instant navbar and page synchronization
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('user-updated'));

        setSaveSuccessMsg('Profile updated! Your certificate name has also been updated.');
        setTimeout(() => {
          setIsEditModalOpen(false);
          setSaveSuccessMsg('');
        }, 1400);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setSaveErrorMsg(err.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setUploading(true);
      setUploadSuccess(false);

      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/upload-avatar`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (res.data.success) {
        setProfile(prev => ({ ...prev, avatar: res.data.avatar }));
        
        // Update stored user
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            parsed.avatar = res.data.avatar;
            localStorage.setItem('user', JSON.stringify(parsed));
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('user-updated'));
          } catch (e) {}
        }

        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Error uploading avatar:", err);
      alert(err?.response?.data?.message || 'Failed to upload profile picture.');
    } finally {
      if (e.target) e.target.value = '';
      setUploading(false);
    }
  };

  const menuItems = [
    { title: 'My Wishlist', icon: PiHeart, path: '/dashboard/wishlist' },
    { title: 'My Enrollments', icon: PiBookOpen, path: '/dashboard/learning' },
    { title: 'Payment History', icon: PiCreditCard, path: '/dashboard/payment-history' },
    { title: 'My Certificates', icon: PiCertificate, path: '/dashboard/certificates' },
    { title: 'Settings', icon: PiGearSix, path: '/dashboard/settings' },
    { title: 'Help & Support', icon: PiQuestion, path: '/dashboard/support' },
    { title: 'Logout', icon: PiSignOut, path: '/login', action: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } 
    }
  ];

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http')) return avatarPath;
    const base = import.meta.env.VITE_API_BASE_URL.replace('/api', '');
    return `${base}${avatarPath}`;
  };

  const displayName = profile.name || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Student';

  return (
    <div className="min-h-screen bg-bg-cream pt-4 md:pt-16 pb-24 md:pb-12 font-inter">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="flex items-center mb-6 mt-2 md:hidden">
          <button onClick={() => navigate(-1)} className="mr-4 text-brand-green">
            <FaArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-brand-green">Profile</h1>
        </div>

        {/* Glassmorphism Container */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[2rem] overflow-hidden flex flex-col md:flex-row min-h-[500px]"
        >
          {/* Left Panel - User Info */}
          <div className="w-full md:w-2/5 bg-white/50 p-8 md:p-12 flex flex-col border-b md:border-b-0 md:border-r border-white/60 relative items-center md:items-start text-center md:text-left">
            
            {/* Avatar Upload Container */}
            <div className="relative mb-6 group">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-brand-green text-white flex items-center justify-center text-3xl md:text-4xl font-bold">
                {profile.avatar ? (
                  <img
                    src={getAvatarUrl(profile.avatar)}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{displayName.charAt(0).toUpperCase()}</span>
                )}
              </div>

              {/* Upload Button Overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                title="Update Profile Photo"
                className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-brand-green text-white flex items-center justify-center shadow-md hover:bg-brand-green/90 transition-transform active:scale-95 border-2 border-white cursor-pointer"
              >
                {uploading ? (
                  <FaSpinner className="animate-spin" size={14} />
                ) : (
                  <FaCamera size={14} />
                )}
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />
            </div>

            {uploadSuccess && (
              <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-200">
                <FaCheckCircle size={12} /> Profile Photo Updated!
              </div>
            )}

            <div className="flex-1 flex flex-col justify-center w-full">
              <div className="w-16 h-1 bg-brand-green mb-6 rounded-full hidden md:block"></div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight mb-2">
                {displayName}
              </h2>
              <p className="text-gray-500 font-medium text-sm md:text-base">
                {profile.email || profile.emailOrPhone}
              </p>
              {profile.phone && (
                <p className="text-gray-400 font-medium text-xs md:text-sm mt-1">
                  📞 {profile.phone}
                </p>
              )}

              {/* Edit Profile Button */}
              <button
                type="button"
                onClick={handleOpenEditModal}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <FaEdit size={13} />
                <span>Edit Profile Details</span>
              </button>
            </div>
            
            {/* Desktop Only Decoration */}
            <div className="hidden md:block mt-8 text-xs text-gray-400 font-medium">
              Click the camera icon on your avatar anytime to change your profile picture.
            </div>
          </div>

          {/* Right Panel - Menu Grid */}
          <div className="w-full md:w-3/5 p-6 md:p-10 flex flex-col justify-center">
            
            <h3 className="text-lg font-bold text-gray-800 mb-6 hidden md:block px-2">Account Overview</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {menuItems.map((item, index) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  key={item.title}
                >
                  <button
                    onClick={() => {
                      if (item.action) item.action();
                      else if (item.path !== '#') navigate(item.path);
                    }}
                    className={`w-full flex items-center p-4 md:p-5 rounded-2xl bg-white/60 border border-white/80 shadow-sm hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] hover:bg-white hover:-translate-y-1 transition-all duration-300 group ${item.title === 'Logout' ? 'sm:col-span-2 mt-4' : ''}`}
                  >
                    <div className={`w-12 h-12 rounded-full flex flex-shrink-0 items-center justify-center mr-4 transition-colors duration-300 ${item.title === 'Logout' ? 'bg-red-50 text-red-500 group-hover:bg-red-500 group-hover:text-white' : 'bg-brand-green/10 text-brand-green group-hover:bg-brand-green group-hover:text-white'}`}>
                      <item.icon size={24} />
                    </div>
                    <div className="flex-1 text-left">
                      <span className={`font-bold text-[15px] ${item.title === 'Logout' ? 'text-red-600' : 'text-gray-800'}`}>
                        {item.title}
                      </span>
                    </div>
                    <FaChevronRight size={14} className={`transition-colors ${item.title === 'Logout' ? 'text-red-200 group-hover:text-red-400' : 'text-gray-300 group-hover:text-brand-green'}`} />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 md:p-8 max-w-lg w-full relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center font-bold">
                    <FaEdit size={18} />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-gray-900">Edit Profile Details</h3>
                    <p className="text-xs text-gray-500">Updates across website, mobile app & certificates</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <FaTimes size={18} />
                </button>
              </div>

              {saveErrorMsg && (
                <div className="mb-4 p-3.5 bg-red-50 text-red-700 rounded-xl text-xs font-semibold border border-red-200">
                  {saveErrorMsg}
                </div>
              )}

              {saveSuccessMsg && (
                <div className="mb-4 p-3.5 bg-green-50 text-green-700 rounded-xl text-xs font-semibold border border-green-200 flex items-center gap-2">
                  <FaCheckCircle /> {saveSuccessMsg}
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Full Legal Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <FaUser size={14} />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={editFormData.name}
                      onChange={handleEditChange}
                      required
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-brand-green focus:bg-white focus:ring-2 focus:ring-brand-green/20 outline-none transition-all font-semibold"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    ✨ This exact legal name will automatically appear on all your course completion certificates.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Phone / WhatsApp Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <FaPhone size={14} />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={editFormData.phone}
                      onChange={handleEditChange}
                      placeholder="e.g. +91 9876543210"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-brand-green focus:bg-white focus:ring-2 focus:ring-brand-green/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <FaEnvelope size={14} />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={editFormData.email}
                      onChange={handleEditChange}
                      placeholder="student@example.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-brand-green focus:bg-white focus:ring-2 focus:ring-brand-green/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    New Password (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <FaLock size={14} />
                    </div>
                    <input
                      type="password"
                      name="password"
                      value={editFormData.password}
                      onChange={handleEditChange}
                      placeholder="Leave blank to keep current password"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-brand-green focus:bg-white focus:ring-2 focus:ring-brand-green/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-6 py-2.5 bg-brand-green hover:bg-brand-green-dark text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-70 cursor-pointer"
                  >
                    {savingProfile ? (
                      <>
                        <FaSpinner className="animate-spin" size={14} />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <FaSave size={14} />
                        <span>Save Changes</span>
                      </>
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

export default ProfileMenu;
