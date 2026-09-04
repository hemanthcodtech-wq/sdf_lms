import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaLock, FaSave, FaArrowLeft } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';

const Settings = () => {
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    emailOrPhone: '',
    password: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        setProfile({
          ...res.data.data,
          password: ''
        });
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setMessage({ type: 'error', text: 'Failed to load profile.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        name: profile.name || `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
        firstName: profile.firstName,
        lastName: profile.lastName,
        emailOrPhone: profile.emailOrPhone,
        email: profile.email || (profile.emailOrPhone && profile.emailOrPhone.includes('@') ? profile.emailOrPhone : ''),
        phone: profile.phone,
      };
      if (profile.password) {
        payload.password = profile.password;
      }

      const res = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/auth/profile`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully! Certificate name has also been updated.' });
        if (res.data.token) {
          localStorage.setItem('token', res.data.token);
        }
        
        // Update stored user in localStorage
        const storedUser = localStorage.getItem('user');
        let updatedUserObj = res.data;
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            updatedUserObj = { ...parsed, ...res.data };
          } catch (e) {}
        }
        localStorage.setItem('user', JSON.stringify(updatedUserObj));
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('user-updated'));

        setProfile(prev => ({
          ...prev,
          ...res.data,
          password: ''
        }));
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24 md:pb-8 px-4 py-4 md:px-0 font-inter">
      <div className="flex items-center mb-6 mt-2 md:hidden">
        <button onClick={() => navigate(-1)} className="mr-4 text-brand-green">
          <FaArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-brand-green">Settings</h1>
      </div>

      <div className="hidden md:block mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-500 mt-2">Update your personal information and password.</p>
      </div>
      
      {message.text && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Full Legal Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <FaUser />
              </div>
              <input
                type="text"
                name="name"
                value={profile.name || `${profile.firstName || ''} ${profile.lastName || ''}`.trim()}
                onChange={handleChange}
                placeholder="Ramesh Kumar"
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-brand-green focus:bg-white focus:ring-2 focus:ring-brand-green/20 outline-none transition-all font-semibold"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              ✨ This exact legal name will automatically appear on all your certificates and official LMS records.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">First Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <FaUser />
                </div>
                <input type="text" name="firstName" value={profile.firstName || ''} onChange={handleChange} className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-brand-green focus:bg-white focus:ring-2 focus:ring-brand-green/20 outline-none transition-all" placeholder="John" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Last Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <FaUser />
                </div>
                <input type="text" name="lastName" value={profile.lastName || ''} onChange={handleChange} className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-brand-green focus:bg-white focus:ring-2 focus:ring-brand-green/20 outline-none transition-all" placeholder="Doe" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email / Phone</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <FaEnvelope />
              </div>
              <input type="text" name="emailOrPhone" value={profile.emailOrPhone || ''} onChange={handleChange} className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-brand-green focus:bg-white focus:ring-2 focus:ring-brand-green/20 outline-none transition-all" />
            </div>
          </div>

          <hr className="border-gray-100" />

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">New Password (Optional)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <FaLock />
              </div>
              <input type="password" name="password" value={profile.password} onChange={handleChange} placeholder="Leave blank to keep current password" className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-brand-green focus:bg-white focus:ring-2 focus:ring-brand-green/20 outline-none transition-all" />
            </div>
          </div>

          <div className="pt-4">
            <button type="submit" disabled={saving} className="w-full md:w-auto px-8 py-3.5 bg-brand-green hover:bg-brand-green-dark text-white font-bold rounded-xl transition-all shadow-[0_4px_14px_0_rgba(41,120,56,0.39)] flex items-center justify-center gap-2 disabled:opacity-70">
              {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <FaSave />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Settings;
