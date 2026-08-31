import React, { useState, useEffect } from 'react';
import { 
  FaArrowLeft, FaAward, FaDownload, FaCheckCircle, 
  FaBookOpen, FaExternalLinkAlt, FaClock, FaEdit, 
  FaTimes, FaUserCheck, FaChalkboardTeacher
} from 'react-icons/fa';
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
  const [studentName, setStudentName] = useState('Learner');
  const [toastMessage, setToastMessage] = useState('');

  // Name Editing Modal State
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [editNameInput, setEditNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);

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

      let name = 'Learner';
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
      setEditNameInput(name);

      if (enrollmentsRes.data.success && enrollmentsRes.data.data) {
        const allEnr = enrollmentsRes.data.data;
        // Strictly filter only courses that are 100% completed
        const completed = allEnr.filter(e => e.completed === true && e.progress === 100);
        const inProgress = allEnr.filter(e => !e.completed || e.progress < 100);
        
        setCompletedEnrollments(completed);
        setInProgressEnrollments(inProgress);

        if (completed.length > 0 && completed[0].studentName) {
          setStudentName(completed[0].studentName);
          setEditNameInput(completed[0].studentName);
        }
      }
    } catch (err) {
      console.error('Error fetching certificate data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditName = () => {
    const active = completedEnrollments[selectedCertIndex];
    setEditNameInput(active?.studentName || studentName);
    setIsEditNameOpen(true);
  };

  const handleSaveName = async (e) => {
    e.preventDefault();
    const active = completedEnrollments[selectedCertIndex];
    if (!active || !editNameInput.trim()) return;

    setSavingName(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/courses/certificate/${active._id}/update-name`,
        { studentName: editNameInput.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setStudentName(editNameInput.trim());
        setCompletedEnrollments(prev => prev.map((enr, i) => 
          i === selectedCertIndex ? { ...enr, studentName: editNameInput.trim(), certificateUrl: res.data.enrollment?.certificateUrl || enr.certificateUrl } : enr
        ));
        setToastMessage('Official certificate name updated & regenerated successfully!');
        setIsEditNameOpen(false);
        setTimeout(() => setToastMessage(''), 4000);
      }
    } catch (err) {
      console.error('Error updating name:', err);
      alert(err.response?.data?.message || 'Failed to update certificate name.');
    } finally {
      setSavingName(false);
    }
  };

  const handleDownloadPDF = async (enrollment) => {
    if (!enrollment) return;
    setDownloading(true);
    try {
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
      if (enrollment.certificateUrl) {
        window.open(enrollment.certificateUrl, '_blank');
      } else {
        alert('Failed to download certificate PDF. Please try again.');
      }
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
        <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const activeCert = completedEnrollments[selectedCertIndex] || null;
  const currentPrintedName = activeCert?.studentName || studentName;
  const certCourse = activeCert?.course || {};
  const instructorName = certCourse.instructorId?.name || certCourse.instructor || 'Lead Yoga Guru';
  const categoryName = certCourse.category || 'Vedic Yoga';
  const levelName = certCourse.level || 'All Levels';
  const durationName = certCourse.duration || `${certCourse.sessionDates?.length || 30} Live Sessions`;
  const issueDateFormatted = activeCert?.completionDate 
    ? new Date(activeCert.completionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

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
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white text-brand-green hover:bg-gray-50 border border-gray-200 transition-colors shadow-xs cursor-pointer">
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
                    className={`w-full text-left p-4 rounded-2xl transition-all border flex items-center justify-between cursor-pointer ${
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
                        className="w-full py-2 bg-gray-50 hover:bg-brand-green/10 text-brand-green text-xs font-bold rounded-xl border border-gray-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        View Live Schedule & Classes →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: High-Resolution Classic Certificate Preview */}
            <div className="lg:col-span-8 flex flex-col items-center">
              {activeCert && (
                <div className="w-full space-y-5">
                  <motion.div 
                    key={activeCert._id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full bg-[#FCFAF6] rounded-3xl shadow-[0_15px_50px_rgba(0,0,0,0.08)] border-4 border-[#0A4F2A]/30 relative overflow-hidden flex flex-col items-center justify-between text-center select-none"
                    style={{ aspectRatio: '1.414/1' }}
                  >
                    {/* Official Certificate Template Background Image */}
                    <img 
                      src="/certificate_template.jpg" 
                      alt="Certificate Background" 
                      className="absolute inset-0 w-full h-full object-fill pointer-events-none"
                    />

                    {/* Certificate Foreground Overlays */}
                    <div className="relative z-10 w-full h-full flex flex-col justify-between p-4 md:p-6 text-left">
                      
                      {/* Left Sidebar Meta Information Overlay */}
                      <div className="absolute left-[12%] top-[39.5%] text-[7.5px] md:text-[9.5px] font-bold text-gray-900 text-left w-[12%] pl-1">
                        {activeCert.studentId || `SDWFY${activeCert._id.slice(-6).toUpperCase()}`}
                      </div>
                      <div className="absolute left-[12%] top-[51%] text-[7.5px] md:text-[9.5px] font-bold text-gray-900 text-left w-[12%] pl-1">
                        {issueDateFormatted}
                      </div>
                      <div className="absolute left-[12%] top-[58.5%] text-[7px] md:text-[9px] font-bold text-gray-900 text-left w-[12%] bg-[#FAF7F2] py-0.5 pl-1 rounded">
                        <div>{durationName?.includes('(') ? durationName.split('(')[0] : (durationName || '30 Days')}</div>
                        <div className="text-[6.5px] md:text-[8px] text-gray-800">{durationName?.includes('(') ? `(${durationName.split('(')[1]}` : '(20 Hours)'}</div>
                      </div>
                      <div className="absolute left-[12%] top-[70.5%] text-[7px] md:text-[9px] font-bold text-gray-900 text-left w-[12%] pl-1">
                        {activeCert.certificateId || `SDWFY${activeCert._id.slice(-8).toUpperCase()}`}
                      </div>

                      {/* Recipient Student Name (Center, above green line, Professional Capital Typography) */}
                      <div className="absolute left-[18%] right-[18%] top-[48.5%] text-center flex items-center justify-center pointer-events-none">
                        <h1 
                          className={`font-serif font-black text-[#0A4F2A] tracking-wider px-1 select-none leading-tight uppercase whitespace-nowrap overflow-hidden text-ellipsis ${
                            (currentPrintedName || '').length > 34 
                              ? 'text-[10px] sm:text-xs md:text-sm' 
                              : (currentPrintedName || '').length > 24 
                                ? 'text-xs sm:text-sm md:text-base lg:text-lg'
                                : (currentPrintedName || '').length > 16
                                  ? 'text-sm sm:text-base md:text-lg lg:text-xl'
                                  : 'text-base sm:text-lg md:text-xl lg:text-2xl'
                          }`}
                        >
                          {currentPrintedName}
                        </h1>
                      </div>

                      {/* Dynamic Course Title (Center, below 'has successfully completed the') */}
                      {(certCourse.title && certCourse.title !== 'Yoga for Wellness and Inner Balance') && (
                        <div className="absolute left-[20%] right-[18%] top-[61%] text-center bg-[#FAF7F2] py-0.5 rounded px-2 pointer-events-none">
                          <h4 className={`font-extrabold text-gray-900 truncate ${
                            (certCourse.title || '').length > 35 ? 'text-[10px] sm:text-xs md:text-sm' : 'text-xs sm:text-sm md:text-base'
                          }`}>
                            {certCourse.title}
                          </h4>
                        </div>
                      )}

                      {/* Bottom Instructor Details (Left, Centered under left diamond ornament) */}
                      <div className="absolute left-[24.5%] -translate-x-1/2 bottom-[9%] text-center w-[22%]">
                        <p className="font-extrabold text-[8px] md:text-[10px] text-[#0A4F2A] uppercase tracking-tight">
                          {instructorName || 'RISHI KRISHNA'}
                        </p>
                        <p className="text-[6.5px] md:text-[8px] text-gray-600 font-medium">
                          Yoga Instructor
                        </p>
                        <p className="text-[6px] md:text-[7px] text-gray-500">
                          Certified Yoga Professional
                        </p>
                      </div>

                      {/* Bottom Director Details (Right, Centered under right diamond ornament) */}
                      <div className="absolute left-[64%] -translate-x-1/2 bottom-[9%] text-center w-[22%]">
                        <p className="font-extrabold text-[8px] md:text-[10px] text-[#0A4F2A] uppercase tracking-tight">
                          SWAMY DWIJA
                        </p>
                        <p className="text-[6.5px] md:text-[8px] text-gray-600 font-medium">
                          Founder & Director
                        </p>
                        <p className="text-[6px] md:text-[7px] text-gray-500">
                          Swamy Dwija Foundation
                        </p>
                      </div>

                    </div>
                  </motion.div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 w-full">
                    
                    {/* Correct Name Button */}
                    <button
                      onClick={handleOpenEditName}
                      className="px-5 py-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-extrabold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                    >
                      <FaEdit className="text-brand-green" />
                      <span>Correct / Edit Legal Name</span>
                    </button>

                    {/* Download PDF Button */}
                    <button
                      onClick={() => handleDownloadPDF(activeCert)}
                      disabled={downloading}
                      className="flex-1 py-4 bg-brand-green hover:bg-brand-green-dark text-white font-extrabold rounded-2xl shadow-lg shadow-brand-green/20 hover:shadow-brand-green/40 transition-all duration-300 flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-70 cursor-pointer"
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
                        className="px-4 py-4 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-xs"
                      >
                        <FaExternalLinkAlt size={12} />
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
                      className="px-4 py-2 bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                    >
                      Go to Classes →
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <button
                onClick={() => navigate('/courses')}
                className="px-8 py-3.5 bg-brand-green hover:bg-brand-green-dark text-white font-bold text-sm rounded-2xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <FaBookOpen /> Explore Programs
              </button>
            )}
          </div>
        )}

      </div>

      {/* EDIT PRINTED NAME MODAL */}
      <AnimatePresence>
        {isEditNameOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !savingName && setIsEditNameOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl z-10 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-black text-lg text-gray-900 flex items-center gap-2">
                  <FaUserCheck className="text-brand-green" /> Correct Printed Legal Name
                </h3>
                <button 
                  onClick={() => !savingName && setIsEditNameOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer"
                >
                  <FaTimes size={14} />
                </button>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed">
                Please enter your full official legal name exactly as you wish it to be printed and permanently verified on your Certificate of Completion.
              </p>

              <form onSubmit={handleSaveName} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Full Legal Name *
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={editNameInput} 
                    onChange={e => setEditNameInput(e.target.value)} 
                    placeholder="e.g. Rama Raju Koyyalagadda"
                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-green/20 outline-none font-bold text-gray-900"
                  />
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-[11px] leading-relaxed">
                  ✓ Your official PDF certificate and verification records will be automatically regenerated with this name.
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button 
                    type="button" 
                    disabled={savingName}
                    onClick={() => setIsEditNameOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={savingName}
                    className="px-6 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-dark text-white font-extrabold text-xs shadow-md disabled:opacity-60 flex items-center gap-2 cursor-pointer"
                  >
                    {savingName ? (
                      <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Regenerating...</>
                    ) : 'Save & Regenerate Certificate'}
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

export default Certificates;
