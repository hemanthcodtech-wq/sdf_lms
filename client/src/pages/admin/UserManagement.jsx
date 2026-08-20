import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUser, FaEnvelope, FaBook, FaCalendarAlt, FaTimes, FaSearch, FaCheckCircle, FaRupeeSign } from 'react-icons/fa';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setUsers(res.data.data);
    } catch (err) {
      console.error("Error fetching users", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUser = async (user) => {
    setSelectedUser(user);
    setLoadingDetails(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/users/${user._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setUserDetails(res.data.data);
    } catch (err) {
      console.error("Error fetching user details", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
    setUserDetails(null);
  };

  const handleAdminIssueCert = async (enrollmentId) => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/courses/admin/issue-certificate/${enrollmentId}`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
      );
      if (res.data.success) {
        alert('Certificate issued & emailed successfully!');
        if (selectedUser) handleOpenUser(selectedUser);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error issuing certificate');
    }
  };

  const filteredUsers = users.filter(u => 
    u.emailOrPhone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-24 md:pb-8 font-inter">
      
      {/* Top Banner Header */}
      <div className="bg-white/60 backdrop-blur-2xl rounded-[2.5rem] p-6 lg:p-8 border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-green/10 text-brand-green-dark text-xs font-bold uppercase tracking-wider mb-2">
            Student Management
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">Registered Learners</h1>
          <p className="text-gray-500 text-sm mt-1">Directory of students, enrollment histories, and course access status.</p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search by email, phone, name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white/90 border border-gray-200/80 rounded-2xl text-xs lg:text-sm font-medium text-gray-800 placeholder-gray-400 shadow-xs focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white/75 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-white/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 text-xs font-bold uppercase tracking-wider">
                  <th className="p-5 pl-8">Student Contact / Name</th>
                  <th className="p-5">Role</th>
                  <th className="p-5">Registration Date</th>
                  <th className="p-5 text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/80 text-sm">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-white/90 transition-colors">
                    <td className="p-5 pl-8">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center font-bold text-sm border border-brand-green/20 shrink-0">
                          {user.name ? user.name.charAt(0).toUpperCase() : <FaUser />}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{user.name || user.emailOrPhone}</div>
                          {user.name && <div className="text-xs text-gray-400 font-medium">{user.emailOrPhone}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                      }`}>
                        {user.role || 'Student'}
                      </span>
                    </td>
                    <td className="p-5 text-gray-600 font-medium text-xs">
                      {new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-5 pr-8 text-right">
                      <button 
                        onClick={() => handleOpenUser(user)}
                        className="px-4 py-2 bg-brand-green/10 hover:bg-brand-green hover:text-white text-brand-green-dark font-bold text-xs rounded-xl transition-all shadow-xs"
                      >
                        View Enrollments
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-12 text-center text-gray-400 font-medium">No students match your search filter.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Details Drawer */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
              onClick={handleCloseModal}
            />
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }} 
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="bg-white/95 backdrop-blur-3xl border-l border-white/80 shadow-[-20px_0_50px_rgba(0,0,0,0.15)] w-full max-w-lg h-full overflow-y-auto relative z-10 flex flex-col font-inter"
            >
              <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-xl z-20">
                <div>
                  <h2 className="text-lg font-black text-gray-900">Student Profile & History</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Learner information and payment logs</p>
                </div>
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 w-9 h-9 rounded-full flex items-center justify-center transition-all">
                  <FaTimes size={14} />
                </button>
              </div>
              
              <div className="p-6 md:p-8 flex-1 space-y-6">
                <div className="flex items-center gap-4 p-5 bg-[#FAF7F2] rounded-3xl border border-gray-200/60">
                  <div className="w-14 h-14 rounded-2xl bg-brand-green text-white flex items-center justify-center text-xl font-bold shadow-md">
                    {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : <FaUser />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-extrabold text-gray-900 truncate">{selectedUser.name || selectedUser.emailOrPhone}</h3>
                    <p className="text-xs text-gray-500 truncate">{selectedUser.emailOrPhone}</p>
                    <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 uppercase">
                      Verified Student
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-extrabold text-sm text-gray-900 mb-3 flex items-center gap-2">
                    <FaBook className="text-brand-green" /> Enrolled Course History
                  </h3>
                  
                  {loadingDetails ? (
                    <div className="flex justify-center py-12">
                      <div className="w-8 h-8 border-3 border-brand-green border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : userDetails?.enrollments?.length > 0 ? (
                    <div className="space-y-3.5">
                      {userDetails.enrollments.map(enrollment => (
                        <div key={enrollment._id} className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-bold text-gray-900 text-sm mb-1">{enrollment.course?.title || 'Wellness Course'}</h4>
                              <div className="flex items-center gap-3 text-xs font-semibold text-gray-500">
                                <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-md">{enrollment.course?.category || 'Wellness'}</span>
                                <span className="flex items-center gap-1"><FaCalendarAlt size={10} /> {new Date(enrollment.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                              </div>
                            </div>
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
                              <FaCheckCircle size={10} /> {enrollment.paymentStatus || 'Completed'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                            <div>
                              <span className="text-gray-400 block font-medium">Invoice:</span>
                              <span className="font-mono font-bold text-gray-800">{enrollment.invoiceNumber || 'SDF-INV-Generated'}</span>
                            </div>
                            <div>
                              <span className="text-gray-400 block font-medium">Certificate:</span>
                              <span className={`font-mono font-bold ${enrollment.completed ? 'text-brand-green' : 'text-amber-600'}`}>
                                {enrollment.completed ? (enrollment.certificateId || 'SDF-CERT-Issued') : 'Pending Completion'}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 items-center justify-between">
                            <div>
                              <span className="text-[11px] text-gray-400 font-medium block">Amount Paid</span>
                              <span className="text-base font-extrabold text-gray-900">₹{enrollment.amountPaid || 0}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Invoice Link */}
                              {enrollment.invoiceUrl ? (
                                <a
                                  href={enrollment.invoiceUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors"
                                >
                                  View Invoice ↗
                                </a>
                              ) : (
                                <a
                                  href={`${import.meta.env.VITE_API_BASE_URL}/payments/invoice/${enrollment._id}/download`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors"
                                >
                                  PDF Invoice ↗
                                </a>
                              )}

                              {/* Certificate Link or Status */}
                              {enrollment.completed ? (
                                enrollment.certificateUrl ? (
                                  <a
                                    href={enrollment.certificateUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3 py-1.5 bg-brand-green text-white hover:bg-brand-green-dark text-xs font-bold rounded-lg transition-colors shadow-xs"
                                  >
                                    View Certificate ↗
                                  </a>
                                ) : (
                                  <a
                                    href={`${import.meta.env.VITE_API_BASE_URL}/courses/certificate/${enrollment._id}/download`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3 py-1.5 bg-brand-green text-white hover:bg-brand-green-dark text-xs font-bold rounded-lg transition-colors shadow-xs"
                                  >
                                    PDF Certificate ↗
                                  </a>
                                )
                              ) : (
                                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold rounded-lg">
                                  In-Progress ({enrollment.progress || 0}%)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-200/60 border-dashed">
                      <p className="text-gray-400 font-medium text-xs">No active course enrollments for this student.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;
