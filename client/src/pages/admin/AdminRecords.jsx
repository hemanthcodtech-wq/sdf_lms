import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaAward, FaFileInvoice, FaSearch, FaCheckCircle, FaClock, 
  FaDownload, FaExternalLinkAlt, FaTimes, FaShieldAlt, FaSyncAlt, 
  FaRupeeSign, FaEnvelope, FaTrashAlt, FaFileCsv, FaEye, FaUserGraduate
} from 'react-icons/fa';

const AdminRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'certified', 'in-progress'
  const [actionLoading, setActionLoading] = useState({});
  const [toastMessage, setToastMessage] = useState('');

  // Certificate Verification Modal
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  // Live Certificate Preview Modal
  const [previewRecord, setPreviewRecord] = useState(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/records`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      if (res.data.success) {
        setRecords(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching admin records:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Issue / Re-issue Certificate
  const handleIssueCertificate = async (enrollmentId) => {
    setActionLoading(prev => ({ ...prev, [enrollmentId]: 'issuing' }));
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/courses/admin/issue-certificate/${enrollmentId}`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
      );
      if (res.data.success) {
        showToast('Certificate generated, stored in Cloudinary, and emailed to student!');
        fetchRecords();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error issuing certificate');
    } finally {
      setActionLoading(prev => ({ ...prev, [enrollmentId]: null }));
    }
  };

  // Revoke Certificate
  const handleRevokeCertificate = async (enrollmentId) => {
    if (!window.confirm('Are you sure you want to revoke this certificate? The student progress will be reset to in-progress.')) return;
    
    setActionLoading(prev => ({ ...prev, [enrollmentId]: 'revoking' }));
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/admin/revoke-certificate/${enrollmentId}`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
      );
      if (res.data.success) {
        showToast('Certificate revoked successfully.');
        fetchRecords();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error revoking certificate');
    } finally {
      setActionLoading(prev => ({ ...prev, [enrollmentId]: null }));
    }
  };

  // Resend Invoice
  const handleResendInvoice = async (enrollmentId) => {
    setActionLoading(prev => ({ ...prev, [enrollmentId]: 'invoicing' }));
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/admin/resend-invoice/${enrollmentId}`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
      );
      if (res.data.success) {
        showToast(res.data.message || 'Invoice PDF sent to student!');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error sending invoice');
    } finally {
      setActionLoading(prev => ({ ...prev, [enrollmentId]: null }));
    }
  };

  // Verify Certificate Lookup
  const handleVerifySearch = async (e) => {
    e?.preventDefault();
    if (!verifyInput.trim()) return;
    setVerifying(true);
    setVerifyError('');
    setVerifyResult(null);

    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/verify-certificate/${encodeURIComponent(verifyInput.trim())}`);
      if (res.data.success) {
        setVerifyResult(res.data.data);
      }
    } catch (err) {
      setVerifyError(err.response?.data?.message || 'Certificate ID not found or unverified');
    } finally {
      setVerifying(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (records.length === 0) return;
    const headers = ['Student Name', 'Student Email', 'Course Title', 'Amount Paid (INR)', 'Invoice Number', 'Certificate ID', 'Status', 'Date'];
    const rows = records.map(r => [
      `"${r.studentName || ''}"`,
      `"${r.studentEmail || ''}"`,
      `"${r.course?.title || ''}"`,
      r.amountPaid || 0,
      `"${r.invoiceNumber || ''}"`,
      `"${r.certificateId || 'N/A'}"`,
      r.completed ? 'Certified' : 'In-Progress',
      `"${new Date(r.createdAt).toLocaleDateString('en-IN')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SDF_Certificates_Invoices_Log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Filter records
  const filteredRecords = records.filter(r => {
    const matchesSearch = 
      r.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.studentEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.course?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.certificateId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'certified') return r.completed === true;
    if (statusFilter === 'in-progress') return !r.completed;
    return true;
  });

  // Calculate Metrics
  const totalCertificates = records.filter(r => r.completed && r.certificateId).length;
  const totalRevenue = records.reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);
  const inProgressCount = records.filter(r => !r.completed).length;
  const completionRate = records.length > 0 ? Math.round((totalCertificates / records.length) * 100) : 0;

  return (
    <div className="space-y-8 pb-24 md:pb-8 font-inter">

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-8 z-50 bg-brand-green text-white px-6 py-3.5 rounded-2xl shadow-xl font-bold text-sm flex items-center gap-2"
          >
            <FaCheckCircle /> {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Banner Header */}
      <div className="bg-white/60 backdrop-blur-2xl rounded-[2.5rem] p-6 lg:p-8 border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-green/10 text-brand-green-dark text-xs font-bold uppercase tracking-wider mb-2">
            <FaShieldAlt /> Accreditation & Financial Records
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">Certificates & Invoices Hub</h1>
          <p className="text-gray-500 text-sm mt-1">
            Search, issue, verify, and inspect all official certificates, Tax Invoices, and Cloudinary archives.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => { setVerifyModalOpen(true); setVerifyResult(null); setVerifyError(''); }}
            className="px-5 py-3 bg-brand-green hover:bg-brand-green-dark text-white font-extrabold rounded-2xl text-xs lg:text-sm shadow-md shadow-brand-green/20 transition-all flex items-center gap-2"
          >
            <FaSearch size={13} />
            <span>Verify Certificate by ID</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-5 py-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold rounded-2xl text-xs lg:text-sm shadow-xs transition-all flex items-center gap-2"
          >
            <FaFileCsv size={15} className="text-green-700" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Key Metric Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Certificates Awarded */}
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-2xl shrink-0">
            <FaAward />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Certificates Issued</span>
            <span className="text-2xl font-black text-gray-900">{totalCertificates}</span>
            <span className="text-[11px] text-brand-green font-semibold block mt-0.5">Verified Accreditations</span>
          </div>
        </div>

        {/* Total Invoices & Revenue */}
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-brand-green border border-emerald-200 flex items-center justify-center text-2xl shrink-0">
            <FaRupeeSign />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Revenue Collected</span>
            <span className="text-2xl font-black text-gray-900">₹{totalRevenue.toLocaleString('en-IN')}</span>
            <span className="text-[11px] text-gray-500 font-semibold block mt-0.5">{records.length} Tax Invoices</span>
          </div>
        </div>

        {/* In-Progress Learners */}
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center text-2xl shrink-0">
            <FaUserGraduate />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">In-Progress Students</span>
            <span className="text-2xl font-black text-gray-900">{inProgressCount}</span>
            <span className="text-[11px] text-blue-600 font-semibold block mt-0.5">Active Class Batches</span>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center text-2xl shrink-0">
            <FaCheckCircle />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Completion Rate</span>
            <span className="text-2xl font-black text-gray-900">{completionRate}%</span>
            <span className="text-[11px] text-purple-600 font-semibold block mt-0.5">Certification Success</span>
          </div>
        </div>

      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white/75 backdrop-blur-xl rounded-3xl p-4 md:p-5 border border-white/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search input */}
        <div className="relative flex-1 max-w-lg">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search by Certificate ID (e.g. SDF-CERT-XXXX), Invoice No, Student, Course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white/90 border border-gray-200/80 rounded-2xl text-xs lg:text-sm font-medium text-gray-800 placeholder-gray-400 shadow-xs focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none transition-all"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 bg-gray-100/80 p-1.5 rounded-2xl">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
              statusFilter === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            All Records ({records.length})
          </button>
          <button
            onClick={() => setStatusFilter('certified')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
              statusFilter === 'certified' ? 'bg-brand-green text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <FaAward size={11} /> Certified ({totalCertificates})
          </button>
          <button
            onClick={() => setStatusFilter('in-progress')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
              statusFilter === 'in-progress' ? 'bg-white text-amber-700 shadow-xs' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <FaClock size={11} /> In Progress ({inProgressCount})
          </button>
        </div>

      </div>

      {/* Main Records Table */}
      {loading ? (
        <div className="flex justify-center p-20">
          <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white/75 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-white/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 text-xs font-bold uppercase tracking-wider">
                  <th className="p-5 pl-8">Learner</th>
                  <th className="p-5">Course / Category</th>
                  <th className="p-5">Tax Invoice</th>
                  <th className="p-5">Certificate Status</th>
                  <th className="p-5">Amount (₹)</th>
                  <th className="p-5 text-right pr-8">Actions & Management</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/80 text-sm">
                {filteredRecords.map((r) => (
                  <tr key={r._id} className="hover:bg-white/90 transition-colors">
                    
                    {/* Learner */}
                    <td className="p-5 pl-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center font-bold text-sm border border-brand-green/20 shrink-0">
                          {r.studentName ? r.studentName.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <div>
                          <div className="font-extrabold text-gray-900">{r.studentName}</div>
                          <div className="text-xs text-gray-400 font-medium">{r.studentEmail}</div>
                        </div>
                      </div>
                    </td>

                    {/* Course */}
                    <td className="p-5">
                      <div className="font-bold text-gray-800 text-xs">{r.course?.title || 'Yoga Program'}</div>
                      <span className="text-[10px] text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-md mt-1 inline-block">
                        {r.course?.category || 'Holistic Wellness'}
                      </span>
                    </td>

                    {/* Tax Invoice */}
                    <td className="p-5">
                      <div className="space-y-1">
                        <span className="font-mono text-xs font-bold text-gray-800 block">
                          {r.invoiceNumber || 'SDF-INV-Generated'}
                        </span>
                        {r.invoiceUrl ? (
                          <a
                            href={r.invoiceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-green hover:underline"
                          >
                            <FaExternalLinkAlt size={9} /> Cloudinary PDF
                          </a>
                        ) : (
                          <a
                            href={`${import.meta.env.VITE_API_BASE_URL}/payments/invoice/${r._id}/download`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-brand-green"
                          >
                            <FaDownload size={9} /> Download Invoice
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Certificate */}
                    <td className="p-5">
                      {r.completed && r.certificateId ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-800">
                            <FaAward size={10} className="text-yellow-600" /> {r.certificateId}
                          </span>
                          <div className="flex items-center gap-2">
                            {r.certificateUrl ? (
                              <a
                                href={r.certificateUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-green hover:underline"
                              >
                                <FaExternalLinkAlt size={9} /> Cloudinary Cert
                              </a>
                            ) : (
                              <a
                                href={`${import.meta.env.VITE_API_BASE_URL}/courses/certificate/${r._id}/download`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-brand-green"
                              >
                                <FaDownload size={9} /> Download PDF
                              </a>
                            )}
                            <button
                              onClick={() => setPreviewRecord(r)}
                              className="text-[11px] font-bold text-gray-500 hover:text-gray-900 inline-flex items-center gap-1"
                            >
                              <FaEye size={10} /> Preview
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <FaClock size={9} /> In Progress ({r.progress || 0}%)
                        </span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="p-5 font-black text-gray-900">
                      ₹{r.amountPaid || 0}
                    </td>

                    {/* Actions */}
                    <td className="p-5 pr-8 text-right">
                      <div className="inline-flex items-center gap-2">
                        
                        {/* Direct Open / View Invoice Button */}
                        <a
                          href={r.invoiceUrl || `${import.meta.env.VITE_API_BASE_URL}/payments/invoice/${r._id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5"
                          title="Open Tax Invoice PDF in new tab"
                        >
                          <FaEye size={12} className="text-gray-500" />
                          <span>View Invoice</span>
                        </a>

                        {/* Direct Open / View Certificate if completed */}
                        {r.completed && (
                          <a
                            href={r.certificateUrl || `${import.meta.env.VITE_API_BASE_URL}/courses/certificate/${r._id}/download`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3.5 py-2 bg-brand-green/10 hover:bg-brand-green hover:text-white text-brand-green-dark text-xs font-bold rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5"
                            title="Open Certificate PDF in new tab"
                          >
                            <FaAward size={12} />
                            <span>View Cert</span>
                          </a>
                        )}

                        {/* Revoke Certificate if completed */}
                        {r.completed && (
                          <button
                            onClick={() => handleRevokeCertificate(r._id)}
                            disabled={actionLoading[r._id] === 'revoking'}
                            title="Revoke Certificate & Reset Status"
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-all border border-red-100"
                          >
                            <FaTrashAlt size={11} />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))}

                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-16 text-center text-gray-400 font-medium">
                      No accreditation or invoice records match your search query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🔍 Certificate ID Public Verification Modal */}
      <AnimatePresence>
        {verifyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-white/80 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center">
                    <FaShieldAlt size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900">Certificate Verification Engine</h3>
                    <p className="text-xs text-gray-400">Authenticate any Swamy Dwija certificate credential</p>
                  </div>
                </div>
                <button 
                  onClick={() => setVerifyModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-all"
                >
                  <FaTimes size={13} />
                </button>
              </div>

              <form onSubmit={handleVerifySearch} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase">Enter Certificate ID</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. SDF-CERT-2026-9941"
                      value={verifyInput}
                      onChange={(e) => setVerifyInput(e.target.value)}
                      className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-mono font-bold text-gray-900 focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none"
                    />
                    <button
                      type="submit"
                      disabled={verifying || !verifyInput.trim()}
                      className="px-6 py-3 bg-brand-green hover:bg-brand-green-dark text-white font-extrabold rounded-2xl text-sm shadow-md transition-all disabled:opacity-50"
                    >
                      {verifying ? 'Checking...' : 'Verify'}
                    </button>
                  </div>
                </div>
              </form>

              {/* Verification Result Display */}
              {verifyResult && (
                <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#D4AF37] space-y-3">
                  <div className="flex items-center gap-2 text-brand-green font-extrabold text-sm">
                    <FaCheckCircle size={16} /> Authentic & Verified Credential
                  </div>
                  <div className="space-y-1 text-xs">
                    <p><strong className="text-gray-600">Certificate ID:</strong> <span className="font-mono font-bold text-gray-900">{verifyResult.certificateId}</span></p>
                    <p><strong className="text-gray-600">Recipient Student:</strong> <span className="font-bold text-gray-900">{verifyResult.studentName}</span></p>
                    <p><strong className="text-gray-600">Accredited Course:</strong> <span className="font-bold text-[#0A4F2A]">{verifyResult.courseTitle}</span></p>
                    <p><strong className="text-gray-600">Date of Issue:</strong> <span className="text-gray-800">{new Date(verifyResult.issueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span></p>
                  </div>
                  {verifyResult.certificateUrl && (
                    <a
                      href={verifyResult.certificateUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-green hover:underline pt-1"
                    >
                      <FaExternalLinkAlt size={10} /> View Cloudinary Master Certificate PDF
                    </a>
                  )}
                </div>
              )}

              {verifyError && (
                <div className="bg-red-50 text-red-700 p-4 rounded-2xl border border-red-200 text-xs font-bold flex items-center gap-2">
                  <FaTimes /> {verifyError}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 📜 Certificate Live Preview Modal */}
      <AnimatePresence>
        {previewRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl border border-white/80 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
                  <FaAward className="text-yellow-600" /> Certificate Live Digital Preview
                </h3>
                <button
                  onClick={() => setPreviewRecord(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center"
                >
                  <FaTimes size={13} />
                </button>
              </div>

              {/* Certificate Canvas Mockup with Watermark */}
              <div className="w-full bg-[#FCFAF6] p-8 rounded-3xl border-4 border-[#B8860B] relative overflow-hidden flex flex-col items-center text-center">
                {/* Filigree Borders */}
                <div className="absolute inset-2 border border-[#0A4F2A] pointer-events-none rounded-2xl" />
                <div className="absolute inset-3 border-2 border-[#D4AF37] pointer-events-none rounded-2xl" />
                
                {/* Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.07] z-0">
                  <img src="/logo.png" alt="Watermark" className="w-64 h-auto" />
                </div>

                <div className="relative z-10 w-full flex flex-col items-center">
                  <img src="/logo.png" alt="Logo" className="h-10 w-auto mb-1" />
                  <h2 className="text-sm font-extrabold tracking-widest text-[#0A4F2A] uppercase">SWAMY DWIJA FOUNDATION</h2>
                  <p className="text-[8px] text-[#854D0E] font-bold tracking-widest uppercase mb-2">ACADEMY OF YOGA, PRANAYAMA & VEDIC WELLNESS SCIENCES</p>
                  
                  <h3 className="text-2xl font-serif italic text-[#1E3A24] font-bold mb-1">Certificate of Completion</h3>
                  <p className="text-[8px] text-gray-500 uppercase tracking-widest mb-2 font-medium">THIS IS PROUDLY PRESENTED TO</p>
                  
                  <h1 className="text-2xl font-serif font-black text-[#0A4F2A] mb-1">{previewRecord.studentName}</h1>
                  <div className="w-40 h-0.5 bg-[#D4AF37] mb-2" />

                  <p className="text-[9px] text-gray-600 max-w-sm mb-2 leading-tight">
                    for successfully completing the comprehensive instructional curriculum and live sessions in
                  </p>
                  <h4 className="text-base font-bold text-gray-900 mb-4">{previewRecord.course?.title}</h4>

                  <div className="flex justify-between items-end w-full px-4 pt-2 border-t border-gray-200 text-[8px] text-gray-500">
                    <div className="text-left">
                      <p className="font-bold text-gray-800">Date: {new Date(previewRecord.completionDate || previewRecord.updatedAt).toLocaleDateString('en-IN')}</p>
                      <p className="font-mono">{previewRecord.certificateId}</p>
                    </div>
                    <div className="px-2 py-0.5 bg-[#FEF9C3] border border-[#D4AF37] rounded text-[#854D0E] font-bold">
                      ★ OFFICIALLY VERIFIED ★
                    </div>
                    <div className="text-right">
                      <p className="font-serif italic font-bold text-gray-900">Swamy Dwija</p>
                      <p className="text-[7px]">Director of Education</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                {previewRecord.certificateUrl && (
                  <a
                    href={previewRecord.certificateUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2.5 bg-brand-green text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    <FaExternalLinkAlt size={11} /> Open Cloudinary PDF
                  </a>
                )}
                <button
                  onClick={() => setPreviewRecord(null)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminRecords;
