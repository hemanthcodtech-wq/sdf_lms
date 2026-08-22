import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaCalendarAlt, FaVideo, FaFilePdf, FaTimes, FaBook, 
  FaArrowLeft, FaChevronRight, FaAward, FaPlayCircle, FaWhatsapp 
} from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import ZoomLiveClassroom from '../../components/classroom/ZoomLiveClassroom';

const StudentClasses = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [allClasses, setAllClasses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('classes'); // classes, materials
  const [completing, setCompleting] = useState(false);
  const [selectedLiveClass, setSelectedLiveClass] = useState(null);
  
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  const handleClaimCertificate = async () => {
    if (!courseId) {
      return navigate('/dashboard/certificates');
    }
    setCompleting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/courses/${courseId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate('/dashboard/certificates');
    } catch(e) {
      navigate('/dashboard/certificates');
    } finally {
      setCompleting(false);
    }
  };

  useEffect(() => {
    fetchMyClassesAndMaterials();
  }, [courseId]);

  const fetchMyClassesAndMaterials = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/classes/student`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      let fetchedClasses = res.data.data;
      if (courseId) {
        fetchedClasses = fetchedClasses.filter(c => c.courseId?._id === courseId);
      }
      setAllClasses(fetchedClasses);

      // Fetch materials
      const courseIds = courseId ? [courseId] : [...new Set(res.data.data.map(c => c.courseId?._id).filter(Boolean))];
      
      let allMaterials = [];
      for (const cid of courseIds) {
        try {
          const matRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/courses/${cid}/materials`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          if (matRes.data.data) {
            allMaterials = [...allMaterials, ...matRes.data.data.map(m => ({
              ...m, 
              courseName: res.data.data.find(c => c.courseId?._id === cid)?.courseId?.title || 'Course'
            }))];
          }
        } catch(e) {
          // ignore individual course fetch error
        }
      }
      setMaterials(allMaterials);
      
    } catch (err) {
      console.error("Error fetching student data:", err);
    } finally {
      setLoading(false);
    }
  };

  const [noMaterialNotice, setNoMaterialNotice] = useState(null);

  // Helper to convert any Google Drive URL into an embeddable iframe URL
  const getEmbedUrl = (url) => {
    if (!url) return '';
    if (url.includes('drive.google.com')) {
      if (url.includes('/view')) {
        return url.replace(/\/view(\?usp=.*)?$/, '/preview');
      }
      if (url.includes('/edit')) {
        return url.replace(/\/edit(\?usp=.*)?$/, '/preview');
      }
      const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://drive.google.com/file/d/${match[1]}/preview`;
      }
      const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (idMatch && idMatch[1]) {
        return `https://drive.google.com/file/d/${idMatch[1]}/preview`;
      }
    }
    return url;
  };

  const handleViewClassMaterial = (cls) => {
    const clsDateStr = new Date(cls.date).toISOString().split('T')[0];
    // Find material matching this specific class date or course
    const matched = materials.find(m => {
      const matDateStr = new Date(m.date).toISOString().split('T')[0];
      return matDateStr === clsDateStr;
    }) || materials.find(m => m.courseId === (cls.courseId?._id || cls.courseId));

    if (matched) {
      setSelectedMaterial(matched);
    } else {
      setNoMaterialNotice({
        title: cls.title || 'Class Session',
        date: new Date(cls.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      });
    }
  };

  const getNextClassDate = () => {
    const now = new Date();
    const futureClasses = allClasses.filter(cls => {
      const classTime = new Date(`${cls.date.split('T')[0]}T${cls.time}:00`);
      return classTime > now;
    }).sort((a, b) => new Date(`${a.date.split('T')[0]}T${a.time}:00`) - new Date(`${b.date.split('T')[0]}T${b.time}:00`));
    
    if (futureClasses.length > 0) {
      return new Date(futureClasses[0].date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    return 'None Scheduled';
  };

  const nextDate = getNextClassDate();

  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  return (
    <div className="min-h-screen bg-[#F9F7F5] pb-24 md:pb-12 pt-20 md:pt-10">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        
        {/* Back Button */}
        <button onClick={() => navigate(-1)} className="text-[#C08552] flex items-center gap-2 font-semibold mb-6 hover:text-[#a06b3e] transition-colors">
          <FaArrowLeft size={14} /> Back to Learning
        </button>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#C08552] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
              {/* Left Column (Sticky Sidebar on Desktop) */}
              <div className="lg:sticky lg:top-28 space-y-4">
                
                {/* Top Dark Card */}
                <div className="bg-[#2D2D2D] rounded-2xl p-6 md:p-8 flex flex-col justify-center text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-xl"></div>
                  
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 border border-white/20 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md shadow-sm">
                      <FaBook size={20} className="text-gray-200" />
                    </div>
                    <div>
                      <span className="text-3xl font-bold tracking-tight">
                        {activeTab === 'classes' ? `${allClasses.length}` : `${materials.length}`}
                      </span>
                      <span className="text-xs text-gray-400 font-medium tracking-wide uppercase block mt-1">Total {activeTab === 'classes' ? 'Classes' : 'Resources'}</span>
                    </div>
                  </div>
                  
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">Next Class on</span>
                    <span className="text-base font-bold text-yellow-400">{nextDate}</span>
                  </div>
                </div>

                {/* Action Pills */}
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                  
                  {/* WhatsApp Batch Group Join Card */}
                  {(() => {
                    const currentCourse = allClasses.find(c => (c.courseId?._id || c.courseId) === courseId)?.courseId || allClasses[0]?.courseId;
                    const whatsappLink = currentCourse?.whatsappGroupLink;

                    if (!whatsappLink) return null;

                    return (
                      <a 
                        href={whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-2xl p-4 bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all flex flex-col gap-2 group block cursor-pointer col-span-2 lg:col-span-1"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-extrabold text-sm">
                            <FaWhatsapp size={22} className="group-hover:scale-110 transition-transform" />
                            <span>Batch WhatsApp Group</span>
                          </div>
                          <span className="text-[10px] bg-white/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Join Group →</span>
                        </div>
                        <p className="text-[11px] text-emerald-50 leading-relaxed font-medium">
                          Connect with your peers, receive live class reminders & ask questions directly.
                        </p>
                      </a>
                    );
                  })()}

                  <button 
                    onClick={() => setActiveTab('classes')}
                    className={`rounded-xl py-4 px-5 flex items-center justify-between shadow-sm border transition-all duration-300 ${activeTab === 'classes' ? 'bg-[#C08552] border-[#C08552] text-white shadow-[#C08552]/20' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'}`}
                  >
                    <span className={`text-[13px] font-bold ${activeTab === 'classes' ? 'text-white' : 'text-gray-700'}`}>All Classes</span>
                    <FaChevronRight className={`${activeTab === 'classes' ? 'text-white' : 'text-gray-400'} text-[12px]`} />
                  </button>
                  <button 
                    onClick={() => setActiveTab('materials')}
                    className={`rounded-xl py-4 px-5 flex items-center justify-between shadow-sm border transition-all duration-300 ${activeTab === 'materials' ? 'bg-[#C08552] border-[#C08552] text-white shadow-[#C08552]/20' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'}`}
                  >
                    <span className={`text-[13px] font-bold ${activeTab === 'materials' ? 'text-white' : 'text-gray-700'}`}>Course Materials ({materials.length})</span>
                    <FaChevronRight className={`${activeTab === 'materials' ? 'text-white' : 'text-gray-400'} text-[12px]`} />
                  </button>
                  <button 
                    onClick={handleClaimCertificate}
                    disabled={completing}
                    className="rounded-xl py-4 px-5 flex items-center justify-between shadow-sm border border-brand-green/30 bg-green-50 hover:bg-green-100 text-brand-green transition-all duration-300 col-span-2 lg:col-span-1"
                  >
                    <span className="text-[13px] font-extrabold flex items-center gap-2">
                      <FaAward className="text-yellow-600" />
                      {completing ? 'Generating Certificate...' : 'Get Certificate of Completion'}
                    </span>
                    <FaChevronRight className="text-brand-green text-[12px]" />
                  </button>
                </div>
              </div>

              {/* Right Column (List Body) */}
              <div className="lg:col-span-2">
                <div className="bg-white/40 md:bg-transparent rounded-2xl md:rounded-none p-2 md:p-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {activeTab === 'classes' && (
                      allClasses.length > 0 ? allClasses.map((cls, index) => {
                        const classDate = new Date(cls.date);
                        const classDateMidnight = new Date(classDate);
                        classDateMidnight.setHours(0, 0, 0, 0);

                        const isToday = classDateMidnight.getTime() === todayMidnight.getTime();
                        const isPast = classDateMidnight.getTime() < todayMidnight.getTime();
                        const isUpcoming = classDateMidnight.getTime() > todayMidnight.getTime();
                        
                        return (
                          <motion.div 
                            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                            key={cls._id} 
                            className={`bg-white rounded-[20px] p-5 flex flex-col justify-between border shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-lg transition-all duration-300 group ${isToday ? 'border-brand-green ring-2 ring-brand-green/20' : 'border-gray-200'}`}
                          >
                            <div className="flex items-start gap-4 mb-5">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 group-hover:scale-110 transition-transform ${isToday ? 'bg-brand-green/10 border-brand-green/30 text-brand-green' : isPast ? 'bg-gray-50 border-gray-100 text-gray-400' : 'bg-amber-50 border-amber-100 text-[#C08552]'}`}>
                                <FaCalendarAlt size={18} />
                              </div>
                              <div className="flex flex-col pt-1 flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {isToday && (
                                    <span className="flex items-center gap-1.5 text-[10px] font-extrabold text-green-700 bg-green-100 px-2.5 py-0.5 rounded-full animate-pulse">
                                      <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span> LIVE TODAY
                                    </span>
                                  )}
                                  {isUpcoming && (
                                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                      UPCOMING
                                    </span>
                                  )}
                                  {isPast && (
                                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                      COMPLETED
                                    </span>
                                  )}
                                </div>
                                <span className="text-base font-black text-gray-800 line-clamp-2 leading-tight">{cls.title || 'Live Class Session'}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                              <span className="text-[12px] text-gray-500 font-semibold">
                                {new Date(cls.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} • {cls.time}
                              </span>
                              
                              {/* Dynamic Action Buttons based on Status */}
                              {isToday ? (
                                cls.zoomLink ? (
                                  <button 
                                    onClick={() => setSelectedLiveClass(cls)}
                                    className="text-[11px] font-bold text-white tracking-wider uppercase bg-brand-green hover:bg-brand-green-dark px-4 py-2 rounded-full shadow-md shadow-brand-green/30 transition-all hover:scale-105 flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <FaVideo size={12}/> JOIN LIVE
                                  </button>
                                ) : (
                                  <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">Link Pending</span>
                                )
                              ) : isPast ? (
                                <button 
                                  onClick={() => handleViewClassMaterial(cls)} 
                                  className="text-[11px] font-bold text-brand-green-dark hover:text-white bg-brand-green/10 hover:bg-brand-green px-4 py-2 rounded-full border border-brand-green/20 transition-all flex items-center gap-1.5 shadow-sm"
                                >
                                  <FaBook size={11} /> VIEW MATERIALS
                                </button>
                              ) : (
                                <span className="text-[11px] font-semibold text-amber-700 bg-amber-50/80 border border-amber-200/60 px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
                                  <FaCalendarAlt size={11} className="text-[#C08552]" /> Scheduled
                                </span>
                              )}
                            </div>
                          </motion.div>
                        )
                      }) : (
                        <div className="col-span-full text-center p-12 bg-white rounded-3xl border border-dashed border-gray-300 text-gray-500 font-medium">
                          No live classes scheduled for this course yet.
                        </div>
                      )
                    )}

                    {activeTab === 'materials' && (
                      materials.length > 0 ? materials.map((mat, index) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                          key={mat._id} 
                          className="bg-white rounded-[20px] p-5 flex flex-col justify-between border border-gray-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-lg transition-all duration-300 group"
                        >
                          <div className="flex items-start gap-4 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0 group-hover:scale-110 transition-transform">
                              {mat.materialType === 'Recording' ? <FaVideo className="text-red-500" size={18} /> : <FaFilePdf className="text-blue-500" size={18} />}
                            </div>
                            <div className="flex flex-col pt-1">
                              <span className="text-base font-black text-gray-800 line-clamp-2 leading-tight">{mat.topicsCovered}</span>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{mat.materialType}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                            <span className="text-[12px] text-gray-500 font-semibold">
                              {new Date(mat.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            
                            <button 
                              onClick={() => setSelectedMaterial(mat)}
                              className="text-[11px] font-bold text-white tracking-wider uppercase bg-brand-green hover:bg-brand-green-dark px-4 py-2 rounded-full shadow-sm transition-colors"
                            >
                              VIEW
                            </button>
                          </div>
                        </motion.div>
                      )) : (
                        <div className="col-span-full text-center p-12 bg-white rounded-3xl border border-dashed border-gray-300 text-gray-500 font-medium">
                          No materials available for this course yet.
                        </div>
                      )
                    )}
                    
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Material Viewer Modal (Google Drive iFrame) */}
      <AnimatePresence>
        {selectedMaterial && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedMaterial(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col relative z-10 overflow-hidden">
              <div className="bg-white px-6 py-5 border-b border-gray-100 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{selectedMaterial.topicsCovered}</h3>
                  <p className="text-sm font-medium text-gray-500">{selectedMaterial.courseName} • {selectedMaterial.materialType} • {new Date(selectedMaterial.date).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <a href={selectedMaterial.driveLink} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                    Open in Drive
                  </a>
                  <button onClick={() => setSelectedMaterial(null)} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
                    <FaTimes size={18}/>
                  </button>
                </div>
              </div>
              <div className="flex-1 w-full bg-gray-100 flex items-center justify-center relative">
                <iframe 
                  src={getEmbedUrl(selectedMaterial.driveLink)} 
                  className="w-full h-full border-none" 
                  title="Material Viewer" 
                  allow="autoplay; fullscreen"
                ></iframe>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* No Material Available Notice Modal */}
      <AnimatePresence>
        {noMaterialNotice && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setNoMaterialNotice(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative z-10 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-100">
                <FaBook size={24} />
              </div>
              <h3 className="font-bold text-xl text-gray-900 mb-2">Class Materials Notice</h3>
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                Recordings & notes for <strong>{noMaterialNotice.title}</strong> ({noMaterialNotice.date}) are currently being processed and will be uploaded soon by your instructor.
              </p>
              <button 
                onClick={() => setNoMaterialNotice(null)}
                className="w-full py-3 bg-brand-green hover:bg-brand-green-dark text-white font-bold rounded-xl transition-all shadow-md"
              >
                Got It
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* In-App Live Classroom with Attendance Check-In */}
      <ZoomLiveClassroom
        isOpen={Boolean(selectedLiveClass)}
        onClose={() => setSelectedLiveClass(null)}
        liveClass={selectedLiveClass}
        course={selectedLiveClass?.courseId}
        userRole="student"
      />

    </div>
  );
};

export default StudentClasses;
