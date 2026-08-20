import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaAward, FaDownload, FaCheckCircle, FaBookOpen, FaExternalLinkAlt, FaClock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const Certificates = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [completedEnrollments, setCompletedEnrollments] = useState([]);
  const [inProgressEnrollments, setInProgressEnrollments] = useState([]);
  const [selectedCertIndex, setSelectedCertIndex] = useState(0);
  const [studentName, setStudentName] = useState('Student');
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');

      const [profileRes, enrollmentsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/auth/profile`, { 
          headers: { Authorization: `Bearer ${token}` } 
        }),
        axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/payments/history`, { 
          headers: { Authorization: `Bearer ${token}` } 
        })
      ]);

      let name = 'Student';
      if (profileRes.data.success && profileRes.data.data) {
        const { firstName, lastName, emailOrPhone, name: fullName } = profileRes.data.data;
        if (fullName) {
          name = fullName;
        } else if (firstName) {
          name = `${firstName} ${lastName || ''}`.trim();
        } else if (emailOrPhone && emailOrPhone.includes('@')) {
          const extracted = emailOrPhone.split('@')[0];
          name = extracted.charAt(0).toUpperCase() + extracted.slice(1);
        }
      }
      setStudentName(name);

      if (enrollmentsRes.data.success && enrollmentsRes.data.data) {
        const allEnr = enrollmentsRes.data.data;
        // Strictly filter only courses that are 100% completed
        const completed = allEnr.filter(e => e.completed === true && e.progress === 100);
        const inProgress = allEnr.filter(e => !e.completed || e.progress < 100);
        
        setCompletedEnrollments(completed);
        setInProgressEnrollments(inProgress);
      }
    } catch (err) {
      console.error('Error fetching certificate data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (enrollment) => {
    if (!enrollment) return;
    setDownloading(true);
    try {
      // If Cloudinary URL exists, open directly
      if (enrollment.certificateUrl) {
        window.open(enrollment.certificateUrl, '_blank');
        setDownloading(false);
        return;
      }

      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/courses/certificate/${enrollment._id}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Certificate-${enrollment.certificateId || 'SDF-Completion'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading certificate PDF:', err);
      alert('Failed to download certificate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-cream">
        <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const activeCert = completedEnrollments[selectedCertIndex] || null;

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col px-4 sm:px-6 lg:px-8 py-8 font-inter pb-24 md:pb-12">
      
      {/* Toast message */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-6 z-50 bg-brand-green text-white px-5 py-3 rounded-2xl shadow-xl font-bold text-sm flex items-center gap-2"
          >
            <FaCheckCircle /> {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-8 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white text-brand-green hover:bg-gray-50 border border-gray-200 transition-colors shadow-xs">
            <FaArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Official Certificates Portal</h1>
            <p className="text-xs md:text-sm text-gray-500">Verified digital accreditations issued upon full 100% course completion.</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full space-y-8">
        
        {completedEnrollments.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Completed Credentials Selector & In-progress section */}
            <div className="lg:col-span-4 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Earned Credentials ({completedEnrollments.length})
              </h3>
              
              <div className="space-y-2.5">
                {completedEnrollments.map((enr, idx) => (
                  <button
                    key={enr._id}
                    onClick={() => setSelectedCertIndex(idx)}
                    className={`w-full text-left p-4 rounded-2xl transition-all border flex items-center justify-between ${
                      selectedCertIndex === idx 
                        ? 'bg-brand-green text-white border-brand-green shadow-md shadow-brand-green/20' 
                        : 'bg-white text-gray-800 border-gray-200/80 hover:bg-gray-50'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <h4 className="font-extrabold text-sm truncate">{enr.course?.title || 'Yoga Program'}</h4>
                      <p className={`text-xs mt-0.5 ${selectedCertIndex === idx ? 'text-green-100' : 'text-gray-400'}`}>
                        {enr.certificateId || `ID: SDF-CERT-${enr._id.slice(-6).toUpperCase()}`}
                      </p>
                    </div>
                    <FaAward className={selectedCertIndex === idx ? 'text-yellow-300' : 'text-brand-green'} size={22} />
                  </button>
                ))}
              </div>

              {/* In Progress Courses Status */}
              {inProgressEnrollments.length > 0 && (
                <div className="pt-4 border-t border-gray-200/60 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Courses in Progress ({inProgressEnrollments.length})
                  </h3>
                  {inProgressEnrollments.map((inEnr) => (
                    <div key={inEnr._id} className="bg-white/80 rounded-2xl p-4 border border-gray-200/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-gray-800 truncate max-w-[190px]">{inEnr.course?.title}</span>
                        <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <FaClock size={9} /> {inEnr.progress || 0}% Done
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-tight">
                        Complete all live batch sessions to unlock your verified Certificate of Completion.
                      </p>
                      <button
                        onClick={() => navigate(`/dashboard/learning/${inEnr.course?._id || inEnr.course}`)}
                        className="w-full py-2 bg-gray-50 hover:bg-brand-green/10 text-brand-green text-xs font-bold rounded-xl border border-gray-200 transition-all flex items-center justify-center gap-1.5"
                      >
                        View Live Schedule & Classes →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: High-Resolution Certificate Preview with Logo Watermark */}
            <div className="lg:col-span-8 flex flex-col items-center">
              {activeCert && (
                <div className="w-full space-y-5">
                  <motion.div 
                    key={activeCert._id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full bg-[#FCFAF6] p-6 md:p-10 rounded-3xl shadow-[0_15px_50px_rgba(0,0,0,0.08)] border-4 border-[#B8860B] relative overflow-hidden flex flex-col items-center text-center aspect-[1.38/1]"
                  >
                    {/* Double Ornate Filigree Border */}
                    <div className="absolute inset-2 border border-[#0A4F2A] pointer-events-none rounded-2xl" />
                    <div className="absolute inset-3 border-2 border-[#D4AF37] pointer-events-none rounded-2xl" />
                    
                    {/* Corner Ornaments */}
                    <div className="absolute top-2 left-2 w-3 h-3 bg-[#B8860B]" />
                    <div className="absolute top-2 right-2 w-3 h-3 bg-[#B8860B]" />
                    <div className="absolute bottom-2 left-2 w-3 h-3 bg-[#B8860B]" />
                    <div className="absolute bottom-2 right-2 w-3 h-3 bg-[#B8860B]" />

                    {/* Translucent Background Watermark Logo */}
                    <div 
                      className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.07] z-0"
                    >
                      <img src="/logo.png" alt="Watermark" className="w-72 h-auto" />
                    </div>

                    {/* Certificate Foreground Content */}
                    <div className="relative z-10 w-full flex flex-col items-center">
                      <div className="flex flex-col items-center gap-1 mb-1">
                        <img src="/logo.png" alt="SDF Logo" className="h-12 w-auto mb-1" />
                        <h2 className="text-sm md:text-base font-extrabold tracking-widest text-[#0A4F2A] uppercase">
                          SWAMY DWIJA FOUNDATION
                        </h2>
                      </div>
                      <p className="text-[9px] text-[#854D0E] font-bold tracking-widest uppercase mb-3">
                        ACADEMY OF YOGA, PRANAYAMA & VEDIC WELLNESS SCIENCES
                      </p>

                      <h3 className="text-2xl md:text-3xl font-serif italic text-[#1E3A24] font-bold mb-1">
                        Certificate of Completion
                      </h3>
                      <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-2 font-medium">
                        THIS IS PROUDLY AND OFFICIALLY PRESENTED TO
                      </p>

                      <h1 className="text-2xl md:text-3xl font-serif font-black text-[#0A4F2A] mb-1 pb-1 px-6 max-w-md truncate">
                        {studentName}
                      </h1>
                      
                      {/* Dual underline */}
                      <div className="w-48 h-0.5 bg-[#D4AF37] mb-0.5" />
                      <div className="w-32 h-px bg-[#0A4F2A] mb-2" />

                      <p className="text-[10px] text-gray-600 max-w-md mb-2 leading-tight">
                        for successfully completing the comprehensive instructional curriculum, live training, and assessments in
                      </p>

                      <h4 className="text-base md:text-lg font-bold text-gray-900 mb-4">
                        {activeCert.course?.title || 'Yoga Program'}
                      </h4>

                      {/* Footer Details */}
                      <div className="flex justify-between items-end w-full px-4 mt-auto pt-3 border-t border-gray-200/80">
                        <div className="text-left text-[9px] text-gray-500 space-y-0.5">
                          <p className="font-bold text-gray-800">
                            Date of Issue: {new Date(activeCert.completionDate || activeCert.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="font-mono text-gray-500">
                            Certificate ID: {activeCert.certificateId || `SDF-CERT-${activeCert._id.slice(-6).toUpperCase()}`}
                          </p>
                        </div>

                        <div className="px-3 py-1 bg-[#FEF9C3] border border-[#D4AF37] rounded-md text-[#854D0E] text-[8px] font-bold">
                          ★ OFFICIALLY VERIFIED ★
                        </div>

                        <div className="text-right text-[9px] text-gray-500">
                          <div className="font-serif italic text-sm text-gray-900 border-b border-gray-400 pb-0.5 font-bold">
                            Swamy Dwija
                          </div>
                          <span className="font-bold text-[8px] text-gray-700 block mt-0.5">
                            Director of Education
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => handleDownloadPDF(activeCert)}
                      disabled={downloading}
                      className="flex-1 py-4 bg-brand-green hover:bg-brand-green-dark text-white font-extrabold rounded-2xl shadow-lg shadow-brand-green/20 hover:shadow-brand-green/40 transition-all duration-300 flex items-center justify-center gap-2 text-sm disabled:opacity-70 cursor-pointer"
                    >
                      {downloading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Generating Official PDF...</span>
                        </>
                      ) : (
                        <>
                          <FaDownload size={14} />
                          <span>Download Official Certificate (PDF)</span>
                        </>
                      )}
                    </button>

                    {activeCert.certificateUrl && (
                      <a
                        href={activeCert.certificateUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-5 py-4 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold rounded-2xl text-sm flex items-center justify-center gap-2 transition-colors shadow-xs"
                      >
                        <FaExternalLinkAlt size={12} /> View Cloud Archive
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        ) : (
          /* Empty State */
          <div className="bg-white/80 rounded-3xl p-10 md:p-14 border border-white shadow-sm text-center max-w-xl mx-auto space-y-6">
            <div className="w-20 h-20 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center mx-auto text-3xl">
              <FaAward />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900">No Certificates Earned Yet</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Certificates are awarded only upon completing 100% of all scheduled live training sessions in your enrolled programs.
              </p>
            </div>

            {inProgressEnrollments.length > 0 ? (
              <div className="space-y-3 pt-2 text-left">
                <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wider text-center">Your Active Enrolled Programs ({inProgressEnrollments.length})</h4>
                {inProgressEnrollments.map((enr) => (
                  <div key={enr._id} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-sm text-gray-800">{enr.course?.title}</h5>
                      <span className="text-xs text-gray-500">{enr.progress || 0}% of sessions completed</span>
                    </div>
                    <button
                      onClick={() => navigate(`/dashboard/learning/${enr.course?._id || enr.course}`)}
                      className="px-4 py-2 bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                    >
                      Go to Classes →
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <button
                onClick={() => navigate('/courses')}
                className="px-8 py-3.5 bg-brand-green hover:bg-brand-green-dark text-white font-bold text-sm rounded-2xl shadow-md transition-all inline-flex items-center gap-2"
              >
                <FaBookOpen /> Explore Programs
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Certificates;
