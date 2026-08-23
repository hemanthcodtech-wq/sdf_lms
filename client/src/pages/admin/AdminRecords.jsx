import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaAward, FaFileInvoice, FaSearch, FaCheckCircle, FaClock, 
  FaDownload, FaExternalLinkAlt, FaTimes, FaShieldAlt, FaSyncAlt, 
  FaRupeeSign, FaEnvelope, FaTrashAlt, FaFileCsv, FaEye, FaUserGraduate,
  FaEdit, FaPlus, FaPaperPlane, FaMagic, FaCalendarAlt, FaUser, FaBook,
  FaIdCard, FaChalkboardTeacher
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

  // Live Certificate Preview Modal (Existing)
  const [previewRecord, setPreviewRecord] = useState(null);

  // 📝 Custom / Edit Certificate Modal State
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customModalMode, setCustomModalMode] = useState('create'); // 'create' | 'edit'
  const [coursesList, setCoursesList] = useState([]);
  const [customForm, setCustomForm] = useState({
    enrollmentId: null,
    studentName: '',
    studentEmail: '',
    courseTitle: '',
    completionDate: new Date().toISOString().split('T')[0],
    certificateId: '',
    studentId: '',
    duration: '30 Days (20 Hours)',
    instructorName: 'RISHI KRISHNA',
    instructorTitle: 'Yoga Instructor',
    instructorSubtitle: 'Certified Yoga Professional',
    sendEmail: true,
    updateEnrollment: true
  });
  const [customSubmitting, setCustomSubmitting] = useState(false);
  const [customPreviewing, setCustomPreviewing] = useState(false);

  useEffect(() => {
    fetchRecords();
    fetchCourses();
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

  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/courses/public`);
      if (res.data.success && Array.isArray(res.data.data)) {
        setCoursesList(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Helper to generate a random authentic certificate ID
  const generateNewCertId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const rand = Math.floor(100 + Math.random() * 900);
    return `SDF-CERT-${timestamp}${rand}`;
  };

  // Quick Select Course Handler
  const handleSelectCourse = (selectedTitle) => {
    const course = coursesList.find(c => c.title === selectedTitle || c._id === selectedTitle);
    if (course) {
      const instName = course.instructorId?.name || course.instructor || 'Lead Yoga Guru';
      const instTitle = course.instructorId?.speciality || 'Yoga Instructor';
      setCustomForm(prev => ({
        ...prev,
        courseTitle: course.title,
        duration: course.duration || prev.duration,
        instructorName: instName,
        instructorTitle: instTitle
      }));
    } else {
      setCustomForm(prev => ({ ...prev, courseTitle: selectedTitle }));
    }
  };

  // Open Modal in CREATE Mode (Brand New Custom Certificate)
  const handleOpenCreateModal = () => {
    setCustomModalMode('create');
    const firstCourse = coursesList.length > 0 ? coursesList[0] : null;
    const instName = firstCourse?.instructorId?.name || firstCourse?.instructor || 'Lead Yoga Guru';
    const instTitle = firstCourse?.instructorId?.speciality || 'Yoga Instructor';
    const courseDuration = firstCourse?.duration || '30 Days (20 Hours)';

    setCustomForm({
      enrollmentId: null,
      studentName: '',
      studentEmail: '',
      courseTitle: firstCourse ? firstCourse.title : 'Yoga for Wellness and Inner Balance',
      completionDate: new Date().toISOString().split('T')[0],
      certificateId: generateNewCertId(),
      studentId: `SDWFY${Date.now().toString().slice(-6)}`,
      duration: courseDuration,
      instructorName: instName,
      instructorTitle: instTitle,
      instructorSubtitle: 'Certified Yoga Professional',
      sendEmail: true,
      updateEnrollment: false
    });
    setCustomModalOpen(true);
  };

  // Open Modal in EDIT Mode (Modifying existing student enrollment certificate)
  const handleOpenEditModal = (record) => {
    setCustomModalMode('edit');
    
    // Parse date safely
    let parsedDate = new Date().toISOString().split('T')[0];
    if (record.completionDate) {
      try {
        parsedDate = new Date(record.completionDate).toISOString().split('T')[0];
      } catch (e) {}
    }

    const course = record.course || {};
    const fullCourse = coursesList.find(c => c._id === course._id || c.title === course.title) || course;
    const instName = fullCourse.instructorId?.name || fullCourse.instructor || record.instructorName || 'Lead Yoga Guru';
    const instTitle = fullCourse.instructorId?.speciality || record.instructorTitle || 'Yoga Instructor';
    const courseDuration = fullCourse.duration || '30 Days (20 Hours)';

    setCustomForm({
      enrollmentId: record._id,
      studentName: record.studentName || '',
      studentEmail: record.studentEmail || '',
      courseTitle: fullCourse.title || 'Yoga for Wellness and Inner Balance',
      completionDate: parsedDate,
      certificateId: record.certificateId || generateNewCertId(),
      studentId: record.studentEmail ? `SDWFY${record.studentEmail.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase()}` : 'SDWFY250501',
      duration: courseDuration,
      instructorName: instName,
      instructorTitle: instTitle,
      instructorSubtitle: 'Certified Yoga Professional',
      sendEmail: true,
      updateEnrollment: true
    });
    setCustomModalOpen(true);
  };

  // Handle Real-time Form Field Change
  const handleFormChange = (field, value) => {
    setCustomForm(prev => ({ ...prev, [field]: value }));
  };

  // Handle PDF Preview in new browser tab / window
  const handleDownloadPreviewPDF = async () => {
    if (!customForm.studentName.trim()) {
      alert('Please enter a student name before previewing.');
      return;
    }
    setCustomPreviewing(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/admin/certificate/preview-pdf`,
        {
          studentName: customForm.studentName,
          courseTitle: customForm.courseTitle,
          completionDate: customForm.completionDate,
          certificateId: customForm.certificateId,
          studentId: customForm.studentId,
          duration: customForm.duration,
          instructorName: customForm.instructorName,
          instructorTitle: customForm.instructorTitle,
          instructorSubtitle: customForm.instructorSubtitle
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
          responseType: 'blob'
        }
      );

      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, '_blank');
    } catch (err) {
      console.error('Error previewing certificate PDF:', err);
      alert('Could not render certificate PDF. Please check server logs.');
    } finally {
      setCustomPreviewing(false);
    }
  };

  // Save / Generate and Send Certificate via API
  const handleSaveAndSendCertificate = async (e) => {
    e.preventDefault();
    if (!customForm.studentName.trim()) {
      alert('Please enter a valid student name');
      return;
    }
    if (!customForm.courseTitle.trim()) {
      alert('Please enter a course title');
      return;
    }
    if (customForm.sendEmail && !customForm.studentEmail.trim()) {
      alert('Please enter a student email to send the certificate email.');
      return;
    }

    setCustomSubmitting(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/admin/certificate/custom-generate-and-send`,
        customForm,
        { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
      );

      if (res.data.success) {
        showToast(res.data.message || 'Certificate created and processed successfully!');
        setCustomModalOpen(false);
        fetchRecords();
      }
    } catch (err) {
      console.error('Error creating custom certificate:', err);
      alert(err.response?.data?.message || 'Failed to process certificate. Please try again.');
    } finally {
      setCustomSubmitting(false);
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
            className="fixed top-24 right-8 z-50 bg-brand-green text-white px-6 py-3.5 rounded-2xl shadow-2xl font-bold text-sm flex items-center gap-2 border border-brand-green-dark"
          >
            <FaCheckCircle className="text-yellow-300" /> {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Banner Header */}
      <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] p-6 lg:p-8 border border-white/90 shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-green/10 text-brand-green-dark text-xs font-bold uppercase tracking-wider mb-2">
            <FaShieldAlt /> Accreditation & Financial Records
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">Certificates & Invoices Hub</h1>
          <p className="text-gray-500 text-sm mt-1">
            Search, modify, create custom certificates, download official PDFs, and email credentials to learners.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* New Custom Certificate Button */}
          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-3 bg-brand-green hover:bg-brand-green-dark text-white font-extrabold rounded-2xl text-xs lg:text-sm shadow-md shadow-brand-green/25 transition-all flex items-center gap-2 transform active:scale-95"
          >
            <FaPlus size={12} className="text-yellow-300" />
            <span>Create / Issue Certificate</span>
          </button>

          {/* Verify by ID */}
          <button
            onClick={() => { setVerifyModalOpen(true); setVerifyResult(null); setVerifyError(''); }}
            className="px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-bold rounded-2xl text-xs lg:text-sm shadow-xs transition-all flex items-center gap-2"
          >
            <FaSearch size={13} className="text-gray-500" />
            <span>Verify ID</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold rounded-2xl text-xs lg:text-sm shadow-xs transition-all flex items-center gap-2"
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
            placeholder="Search by Certificate ID, Invoice No, Student Name, Email, Course..."
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
            <table className="w-full text-left border-collapse min-w-[1050px]">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 text-xs font-bold uppercase tracking-wider">
                  <th className="p-5 pl-8">Learner</th>
                  <th className="p-5">Course / Program</th>
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
                        
                        {/* ✏️ Edit & Send Certificate Action */}
                        <button
                          onClick={() => handleOpenEditModal(r)}
                          className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-800 text-xs font-bold rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5 border border-amber-300"
                          title="Modify details and send certificate to learner"
                        >
                          <FaEdit size={12} />
                          <span>{r.completed ? 'Modify & Send' : 'Issue / Send'}</span>
                        </button>

                        {/* Direct Open / View Invoice Button */}
                        <a
                          href={r.invoiceUrl || `${import.meta.env.VITE_API_BASE_URL}/payments/invoice/${r._id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5"
                          title="Open Tax Invoice PDF in new tab"
                        >
                          <FaEye size={12} className="text-gray-500" />
                          <span>Invoice</span>
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
                            <span>PDF</span>
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

      {/* 🌟 CERTIFICATE EDITOR & CREATOR MODAL (NEW FEATURE) */}
      <AnimatePresence>
        {customModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-[2rem] max-w-5xl w-full p-6 md:p-8 shadow-2xl border border-white/80 my-8 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center text-xl">
                    <FaAward />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                      {customModalMode === 'edit' ? 'Modify & Re-Issue Certificate' : 'Create Custom Certificate'}
                      <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Official SDF Studio
                      </span>
                    </h3>
                    <p className="text-xs text-gray-500">
                      Customize recipient name, course details, date, instructor, and send PDF directly to the student.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setCustomModalOpen(false)}
                  className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-all"
                >
                  <FaTimes size={14} />
                </button>
              </div>

              {/* Form & Live Digital Preview 2-Column Layout */}
              <form onSubmit={handleSaveAndSendCertificate} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Form Controls (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  
                  {/* Recipient Full Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <FaUser className="text-brand-green" /> Learner / Student Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ananya Sharma"
                      value={customForm.studentName}
                      onChange={(e) => handleFormChange('studentName', e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none"
                    />
                  </div>

                  {/* Recipient Email */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <FaEnvelope className="text-brand-green" /> Learner Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. learner@example.com"
                      value={customForm.studentEmail}
                      onChange={(e) => handleFormChange('studentEmail', e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none"
                    />
                  </div>

                  {/* Course Title (Pick from dropdown or custom type) */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><FaBook className="text-brand-green" /> Course / Program Title *</span>
                      {coursesList.length > 0 && (
                        <span className="text-[11px] text-brand-green font-normal">Or select existing course</span>
                      )}
                    </label>
                    <div className="space-y-2">
                      <input
                        type="text"
                        required
                        placeholder="e.g. Master Yoga Pranayama & Vedic Wellness"
                        value={customForm.courseTitle}
                        onChange={(e) => handleFormChange('courseTitle', e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none"
                      />
                      {coursesList.length > 0 && (
                        <select
                          onChange={(e) => e.target.value && handleSelectCourse(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-100/70 border border-gray-200 rounded-xl text-xs text-gray-600 focus:outline-none"
                        >
                          <option value="">-- Quick Select from Database Courses --</option>
                          {coursesList.map(c => (
                            <option key={c._id} value={c.title}>{c.title} ({c.category}) - Guru: {c.instructorId?.name || c.instructor || 'Assigned Guru'}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Certificate ID & Auto Generate */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><FaIdCard className="text-brand-green" /> Certificate ID</span>
                        <button
                          type="button"
                          onClick={() => handleFormChange('certificateId', generateNewCertId())}
                          className="text-[11px] text-brand-green hover:underline flex items-center gap-1 font-bold"
                        >
                          <FaMagic size={10} /> Auto-Generate
                        </button>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. SDF-CERT-260823"
                        value={customForm.certificateId}
                        onChange={(e) => handleFormChange('certificateId', e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-900 focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none"
                      />
                    </div>

                    {/* Completion / Issue Date */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                        <FaCalendarAlt className="text-brand-green" /> Issue / Completion Date
                      </label>
                      <input
                        type="date"
                        value={customForm.completionDate}
                        onChange={(e) => handleFormChange('completionDate', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none"
                      />
                    </div>
                  </div>

                  {/* Course Duration & Instructor Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Course Duration</label>
                      <input
                        type="text"
                        placeholder="e.g. 30 Days (20 Hours)"
                        value={customForm.duration}
                        onChange={(e) => handleFormChange('duration', e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                        <FaChalkboardTeacher className="text-brand-green" /> Instructor Name (Assigned Guru)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Assigned Course Guru"
                        value={customForm.instructorName}
                        onChange={(e) => handleFormChange('instructorName', e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none uppercase"
                      />
                    </div>
                  </div>

                  {/* Email & DB Update Checkboxes */}
                  <div className="pt-2 border-t border-gray-100 space-y-2">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-gray-800">
                      <input
                        type="checkbox"
                        checked={customForm.sendEmail}
                        onChange={(e) => handleFormChange('sendEmail', e.target.checked)}
                        className="w-4 h-4 text-brand-green rounded border-gray-300 focus:ring-brand-green"
                      />
                      <span>Email the official certificate PDF directly to the learner</span>
                    </label>

                    {customModalMode === 'edit' && (
                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-gray-800">
                        <input
                          type="checkbox"
                          checked={customForm.updateEnrollment}
                          onChange={(e) => handleFormChange('updateEnrollment', e.target.checked)}
                          className="w-4 h-4 text-brand-green rounded border-gray-300 focus:ring-brand-green"
                        />
                        <span>Update student database enrollment status to 100% Completed</span>
                      </label>
                    )}
                  </div>

                </div>

                {/* Right Interactive Certificate Live Mockup (5 cols) */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                        <FaAward className="text-yellow-600" /> Official Certificate Template Preview
                      </span>
                      <span className="text-[10px] bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded-full">
                        Live Canvas
                      </span>
                    </div>

                    {/* Official Template Canvas Image with Positioned Overlays */}
                    <div className="relative w-full aspect-[842/595] rounded-2xl overflow-hidden shadow-xl border-2 border-[#D4AF37] select-none bg-[#FCFAF6]">
                      <img
                        src="/certificate_template.jpg"
                        alt="Official Certificate Template"
                        className="w-full h-full object-cover pointer-events-none"
                      />

                      {/* 1. Left Sidebar Meta Information */}
                      {/* Student ID */}
                      <div 
                        style={{ top: '39.8%', left: '12.1%' }}
                        className="absolute text-[7px] sm:text-[9px] font-bold text-gray-900 tracking-tight"
                      >
                        {customForm.studentId || 'SDWFY250501'}
                      </div>

                      {/* Issue Date */}
                      <div 
                        style={{ top: '51.2%', left: '12.1%' }}
                        className="absolute text-[7px] sm:text-[9px] font-bold text-gray-900 tracking-tight whitespace-nowrap"
                      >
                        {customForm.completionDate ? new Date(customForm.completionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '23 August 2026'}
                      </div>

                      {/* Course Duration */}
                      <div 
                        style={{ top: '58.5%', left: '12.1%' }}
                        className="absolute text-[6.5px] sm:text-[8.5px] font-bold text-gray-900 tracking-tight leading-tight max-w-[20%]"
                      >
                        {customForm.duration || '30 Days (20 Hours)'}
                      </div>

                      {/* Certificate ID */}
                      <div 
                        style={{ top: '70.5%', left: '12.1%' }}
                        className="absolute text-[6.5px] sm:text-[8.5px] font-mono font-bold text-gray-900 tracking-tight"
                      >
                        {customForm.certificateId || 'SDF-CERT-SAMPLE'}
                      </div>

                      {/* 2. Recipient Name (Calligraphy Center at top ~47.5%) */}
                      <div 
                        style={{ top: '47.5%', left: '20%', right: '20%' }}
                        className="absolute flex items-center justify-center text-center pointer-events-none"
                      >
                        <span className="font-serif italic font-extrabold text-[#0A4F2A] text-[12px] sm:text-[16px] md:text-[18px] tracking-wide drop-shadow-xs line-clamp-1">
                          {customForm.studentName || 'Learner Full Name'}
                        </span>
                      </div>

                      {/* 3. Dynamic Course Title (Center at top ~61.5%) */}
                      <div 
                        style={{ top: '61.5%', left: '24%', right: '24%' }}
                        className="absolute flex items-center justify-center text-center pointer-events-none"
                      >
                        <span className="font-bold text-gray-900 text-[8px] sm:text-[10px] md:text-[11px] bg-[#FAF7F2]/90 px-2 py-0.5 rounded shadow-xs line-clamp-1">
                          {customForm.courseTitle || 'Yoga for Wellness and Inner Balance'}
                        </span>
                      </div>

                      {/* 4. Bottom Signatures: Instructor Name (left) & Director (right) */}
                      {/* Instructor Name (Center ~34.4%, Top ~86.7%) */}
                      <div 
                        style={{ top: '86.7%', left: '24%', width: '21%' }}
                        className="absolute text-center leading-tight pointer-events-none"
                      >
                        <p className="text-[6.5px] sm:text-[8.5px] font-bold text-[#0A4F2A] uppercase tracking-wider truncate">
                          {customForm.instructorName || 'Lead Yoga Guru'}
                        </p>
                        <p className="text-[5px] sm:text-[6.5px] text-gray-600 truncate">
                          {customForm.instructorTitle || 'Yoga Instructor'}
                        </p>
                      </div>

                      {/* Director Name (Center ~63.8%, Top ~86.7%) */}
                      <div 
                        style={{ top: '86.7%', left: '53.3%', width: '21%' }}
                        className="absolute text-center leading-tight pointer-events-none"
                      >
                        <p className="text-[6.5px] sm:text-[8.5px] font-bold text-[#0A4F2A] uppercase tracking-wider truncate">
                          SWAMY DWIJA
                        </p>
                        <p className="text-[5px] sm:text-[6.5px] text-gray-600 truncate">
                          Founder & Director
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* Actions inside Modal */}
                  <div className="space-y-2 pt-2">
                    
                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={customSubmitting}
                      className="w-full py-3.5 bg-brand-green hover:bg-brand-green-dark text-white font-extrabold rounded-2xl text-sm shadow-md shadow-brand-green/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {customSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Generating & Sending Certificate...</span>
                        </>
                      ) : (
                        <>
                          <FaPaperPlane size={13} className="text-yellow-300" />
                          <span>{customForm.sendEmail ? 'Generate, Save & Send Email' : 'Generate & Save Certificate'}</span>
                        </>
                      )}
                    </button>

                    {/* Download / Open PDF Preview Button */}
                    <button
                      type="button"
                      onClick={handleDownloadPreviewPDF}
                      disabled={customPreviewing}
                      className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      {customPreviewing ? (
                        <span>Rendering High-Res PDF...</span>
                      ) : (
                        <>
                          <FaDownload size={11} />
                          <span>Download / Preview High-Res PDF</span>
                        </>
                      )}
                    </button>

                  </div>

                </div>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

              {/* Certificate Canvas Mockup with Official Template Image */}
              <div className="relative w-full aspect-[842/595] rounded-3xl overflow-hidden shadow-2xl border-4 border-[#D4AF37] select-none bg-[#FCFAF6]">
                <img
                  src="/certificate_template.jpg"
                  alt="Official Certificate Template"
                  className="w-full h-full object-cover pointer-events-none"
                />

                {/* 1. Left Sidebar Meta Information */}
                {/* Student ID */}
                <div 
                  style={{ top: '39.8%', left: '12.1%' }}
                  className="absolute text-[8px] sm:text-[11px] font-bold text-gray-900 tracking-tight"
                >
                  {previewRecord.studentEmail ? `SDWFY${previewRecord.studentEmail.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase()}` : 'SDWFY250501'}
                </div>

                {/* Issue Date */}
                <div 
                  style={{ top: '51.2%', left: '12.1%' }}
                  className="absolute text-[8px] sm:text-[11px] font-bold text-gray-900 tracking-tight whitespace-nowrap"
                >
                  {previewRecord.completionDate ? new Date(previewRecord.completionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>

                {/* Course Duration */}
                <div 
                  style={{ top: '58.5%', left: '12.1%' }}
                  className="absolute text-[7.5px] sm:text-[10px] font-bold text-gray-900 tracking-tight leading-tight max-w-[20%]"
                >
                  {previewRecord.course?.duration || '30 Days (20 Hours)'}
                </div>

                {/* Certificate ID */}
                <div 
                  style={{ top: '70.5%', left: '12.1%' }}
                  className="absolute text-[7.5px] sm:text-[10px] font-mono font-bold text-gray-900 tracking-tight"
                >
                  {previewRecord.certificateId || 'SDF-CERT-SAMPLE'}
                </div>

                {/* 2. Recipient Name (Calligraphy Center at top ~47.5%) */}
                <div 
                  style={{ top: '47.5%', left: '20%', right: '20%' }}
                  className="absolute flex items-center justify-center text-center pointer-events-none"
                >
                  <span className="font-serif italic font-extrabold text-[#0A4F2A] text-[16px] sm:text-[22px] md:text-[26px] tracking-wide drop-shadow-xs line-clamp-1">
                    {previewRecord.studentName || 'Learner Full Name'}
                  </span>
                </div>

                {/* 3. Dynamic Course Title (Center at top ~61.5%) */}
                <div 
                  style={{ top: '61.5%', left: '24%', right: '24%' }}
                  className="absolute flex items-center justify-center text-center pointer-events-none"
                >
                  <span className="font-bold text-gray-900 text-[10px] sm:text-[13px] md:text-[15px] bg-[#FAF7F2]/90 px-3 py-0.5 rounded shadow-xs line-clamp-1">
                    {previewRecord.course?.title || 'Yoga for Wellness and Inner Balance'}
                  </span>
                </div>

                {/* 4. Bottom Signatures: Instructor Name (left) & Director (right) */}
                {/* Instructor Name (Center ~34.4%, Top ~86.7%) */}
                <div 
                  style={{ top: '86.7%', left: '24%', width: '21%' }}
                  className="absolute text-center leading-tight pointer-events-none"
                >
                  <p className="text-[8px] sm:text-[10.5px] font-bold text-[#0A4F2A] uppercase tracking-wider truncate">
                    {previewRecord.course?.instructorId?.name || previewRecord.course?.instructor || 'Lead Yoga Guru'}
                  </p>
                  <p className="text-[6px] sm:text-[8px] text-gray-600 truncate">
                    {previewRecord.course?.instructorId?.speciality || 'Yoga Instructor'}
                  </p>
                </div>

                {/* Director Name (Center ~63.8%, Top ~86.7%) */}
                <div 
                  style={{ top: '86.7%', left: '53.3%', width: '21%' }}
                  className="absolute text-center leading-tight pointer-events-none"
                >
                  <p className="text-[8px] sm:text-[10.5px] font-bold text-[#0A4F2A] uppercase tracking-wider truncate">
                    SWAMY DWIJA
                  </p>
                  <p className="text-[6px] sm:text-[8px] text-gray-600 truncate">
                    Founder & Director
                  </p>
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
