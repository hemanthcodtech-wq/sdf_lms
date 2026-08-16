import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUser, FaEnvelope, FaBook, FaCalendarAlt, FaTimes } from 'react-icons/fa';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
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

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
        <p className="text-gray-500 mt-1">View registered users and their course enrollments.</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm font-semibold uppercase tracking-wide">
                  <th className="p-4 pl-6">Contact / Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4 text-center">Courses Enrolled</th>
                  <th className="p-4 text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center">
                          <FaUser />
                        </div>
                        <div className="font-semibold text-gray-800">{user.emailOrPhone}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600 text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-center font-bold text-gray-700">
                      {user.enrolledCoursesCount}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button 
                        onClick={() => handleOpenUser(user)}
                        className="text-brand-green hover:text-brand-green-dark font-medium text-sm transition-colors border border-brand-green/30 hover:bg-brand-green/10 px-4 py-1.5 rounded-lg"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Details Drawer/Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-green-dark/20 backdrop-blur-sm"
              onClick={handleCloseModal}
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="bg-white/90 backdrop-blur-3xl border-l border-white/60 shadow-[-20px_0_40px_rgba(0,0,0,0.08)] w-full max-w-lg h-full overflow-y-auto relative z-10 flex flex-col"
            >
              <div className="p-6 md:p-8 border-b border-gray-200/50 flex justify-between items-center sticky top-0 bg-white/50 backdrop-blur-xl z-20">
                <h2 className="text-xl font-bold text-gray-800">User Profile</h2>
                <button onClick={handleCloseModal} className="text-gray-500 hover:text-brand-green bg-white p-2 rounded-full border border-gray-100 shadow-sm transition-all"><FaTimes /></button>
              </div>
              
              <div className="p-6 md:p-8 flex-1">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 rounded-full bg-brand-green/15 text-brand-green flex items-center justify-center text-2xl border border-brand-green/20">
                    <FaUser />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedUser.emailOrPhone}</h3>
                    <p className="text-gray-500 text-sm flex items-center gap-1.5 mt-1 capitalize"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedUser.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{selectedUser.role}</span></p>
                  </div>
                </div>

                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2"><FaBook className="text-brand-green" /> Enrollment History</h3>
                
                {loadingDetails ? (
                  <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-brand-green border-t-transparent rounded-full animate-spin"></div></div>
                ) : userDetails?.enrollments?.length > 0 ? (
                  <div className="space-y-4">
                    {userDetails.enrollments.map(enrollment => (
                      <div key={enrollment._id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                        <h4 className="font-bold text-gray-900 mb-1">{enrollment.course?.title || 'Unknown Course'}</h4>
                        <div className="flex items-center gap-3 text-xs font-medium text-gray-500 mb-2">
                          <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700">{enrollment.course?.category}</span>
                          <span className="flex items-center gap-1"><FaCalendarAlt /> {new Date(enrollment.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between items-end mt-3 pt-3 border-t border-gray-50">
                          <span className="text-sm font-semibold text-gray-600">Amount Paid: <span className="text-brand-green-dark">${enrollment.amountPaid}</span></span>
                          <span className="bg-brand-green/10 text-brand-green-dark px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">{enrollment.paymentStatus}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
                    <p className="text-gray-500 font-medium text-sm">No enrollments found for this user.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;
