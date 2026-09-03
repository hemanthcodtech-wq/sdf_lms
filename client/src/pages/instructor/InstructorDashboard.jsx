import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSpa, FaOm, FaChalkboardTeacher, FaVideo, FaUsers, 
  FaCalendarAlt, FaClock, FaCheckCircle, FaAward, FaEdit, 
  FaPhone, FaEnvelope, FaBookOpen, FaExternalLinkAlt, FaTimes,
  FaShieldAlt, FaLayerGroup, FaPlayCircle, FaPlus, FaTrash,
  FaFilePdf, FaCloudUploadAlt, FaChevronRight, FaArrowLeft, FaBook,
  FaGraduationCap, FaLink, FaCheck
} from 'react-icons/fa';
import ZoomLiveClassroom from '../../components/classroom/ZoomLiveClassroom';
import { getCourseImageUrl } from '../../utils/imageHelper';

const InstructorDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [activeLiveClass, setActiveLiveClass] = useState(null);

  // Active Selected Course for Full Classroom View (similar to StudentClasses/MyLearning)
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseActiveTab, setCourseActiveTab] = useState('classes'); // 'classes', 'materials', 'students'
  const [loadingCourseDetails, setLoadingCourseDetails] = useState(false);
  const [selectedCourseData, setSelectedCourseData] = useState(null);

  // Add Material Modal State
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [materialForm, setMaterialForm] = useState({
    date: new Date().toISOString().split('T')[0],
    topicsCovered: '',
    driveLink: '',
    materialType: 'Recording'
  });
  const [materialSubmitting, setMaterialSubmitting] = useState(false);
  const [materialMsg, setMaterialMsg] = useState('');

  // Material Viewer Modal
  const [viewingMaterial, setViewingMaterial] = useState(null);

  // Profile update state
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    bio: '',
    speciality: '',
    experience: ''
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  const rawUser = localStorage.getItem('instructorUser');
  const cachedInstructor = rawUser ? JSON.parse(rawUser) : null;

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/instructor/dashboard-stats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('instructorToken')}` }
      });
      if (res.data.success) {
        setDashboardData(res.data.data);
        if (res.data.data.profile) {
          const prof = res.data.data.profile;
          setProfileForm({
            name: prof.name || '',
            phone: prof.phone || '',
            bio: prof.bio || '',
            speciality: prof.speciality || '',
            experience: prof.experience || ''
          });
          const rawStored = localStorage.getItem('instructorUser');
          const parsedStored = rawStored ? JSON.parse(rawStored) : {};
          localStorage.setItem('instructorUser', JSON.stringify({
            ...parsedStored,
            name: prof.name,
            phone: prof.phone,
            bio: prof.bio,
            speciality: prof.speciality,
            experience: prof.experience
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching instructor stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCourseDetails = async (course) => {
    setSelectedCourse(course);
    setCourseActiveTab('classes');
    setLoadingCourseDetails(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/instructor/courses/${course._id}/details`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('instructorToken')}` }
      });
      if (res.data.success) {
        setSelectedCourseData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching full course details:', err);
    } finally {
      setLoadingCourseDetails(false);
    }
  };

  const handleAddMaterialSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourse) return;
    setMaterialSubmitting(true);
    setMaterialMsg('');

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/instructor/courses/${selectedCourse._id}/materials`,
        materialForm,
        { headers: { Authorization: `Bearer ${localStorage.getItem('instructorToken')}` } }
      );

      if (res.data.success) {
        setMaterialMsg('Material published successfully!');
        // Refresh course data
        const refreshRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/instructor/courses/${selectedCourse._id}/details`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('instructorToken')}` }
        });
        if (refreshRes.data.success) {
          setSelectedCourseData(refreshRes.data.data);
        }
        fetchDashboardStats();
        setTimeout(() => {
          setIsAddMaterialOpen(false);
          setMaterialMsg('');
          setMaterialForm({
            date: new Date().toISOString().split('T')[0],
            topicsCovered: '',
            driveLink: '',
            materialType: 'Recording'
          });
        }, 1200);
      }
    } catch (err) {
      setMaterialMsg(err.response?.data?.message || 'Error adding material.');
    } finally {
      setMaterialSubmitting(false);
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!window.confirm('Are you sure you want to delete this class material?')) return;
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/instructor/courses/${selectedCourse._id}/materials/${materialId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('instructorToken')}` } }
      );
      // Refresh
      const refreshRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/instructor/courses/${selectedCourse._id}/details`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('instructorToken')}` }
      });
      if (refreshRes.data.success) {
        setSelectedCourseData(refreshRes.data.data);
      }
      fetchDashboardStats();
    } catch (err) {
      alert('Error deleting material');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg('');

    try {
      const res = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/instructor/profile`, profileForm, {
        headers: { Authorization: `Bearer ${localStorage.getItem('instructorToken')}` }
      });

      if (res.data.success) {
        setProfileMsg('Profile updated successfully!');
        if (cachedInstructor) {
          localStorage.setItem('instructorUser', JSON.stringify({
            ...cachedInstructor,
            name: profileForm.name,
            phone: profileForm.phone,
            speciality: profileForm.speciality,
            experience: profileForm.experience
          }));
        }
        fetchDashboardStats();
        setTimeout(() => {
          setIsEditProfileOpen(false);
          setProfileMsg('');
        }, 1500);
      }
    } catch (err) {
      setProfileMsg(err.response?.data?.message || 'Error updating profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const getEmbedUrl = (url) => {
    if (!url) return '';
    if (url.includes('drive.google.com')) {
      if (url.includes('/view')) return url.replace(/\/view(\?usp=.*)?$/, '/preview');
      if (url.includes('/edit')) return url.replace(/\/edit(\?usp=.*)?$/, '/preview');
      const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
    return url;
  };

  const profile = dashboardData?.profile || cachedInstructor || {};
  const stats = dashboardData?.stats || { totalCourses: 0, totalClasses: 0, upcomingClassesCount: 0, totalStudents: 0 };
  const upcomingClasses = dashboardData?.upcomingClasses || [];
  const assignedCourses = dashboardData?.assignedCourses || [];

  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  // If a course is selected, show its full dedicated Classroom view
  if (selectedCourse) {
    const course = selectedCourseData?.course || selectedCourse;
    const classes = selectedCourseData?.classes || selectedCourse.classes || [];
    const materials = selectedCourseData?.materials || selectedCourse.materials || [];
    const enrollments = selectedCourseData?.enrollments || [];

    return (
      <div className="space-y-8 pb-20 font-inter max-w-7xl mx-auto px-2 sm:px-4">
        {/* Back navigation */}
        <button
          onClick={() => { setSelectedCourse(null); setSelectedCourseData(null); }}
          className="text-brand-green-dark hover:text-brand-green flex items-center gap-2 font-black text-sm transition-all cursor-pointer bg-white/70 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-gray-200/80 shadow-xs w-max"
        >
          <FaArrowLeft size={13} /> Back to Courses & Dashboard
        </button>

        {/* Course Header Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#06331A] via-[#0A4F2A] to-[#15803D] rounded-[2.5rem] p-6 lg:p-10 text-white shadow-[0_15px_40px_rgba(10,79,42,0.18)]">
          <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none text-[180px]">
            <FaOm />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[#D4AF37] text-xs font-black tracking-wider uppercase">
                  {course.category}
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-900/60 text-emerald-200 text-xs font-bold flex items-center gap-1.5">
                  <FaClock size={11} className="text-emerald-400" />
                  {course.timings || (course.startTime ? `${course.startTime} to ${course.endTime}` : '06:00 to 07:15')}
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight">{course.title}</h1>
              <p className="text-emerald-100/90 text-sm max-w-2xl line-clamp-2">
                {course.description}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() => setIsAddMaterialOpen(true)}
                className="px-5 py-3 rounded-2xl bg-[#fcd536] hover:bg-[#f6cd24] text-gray-900 font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <FaPlus size={12} />
                <span>Add Class Material / Recording</span>
              </button>
            </div>
          </div>
        </div>

        {/* Classroom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          {/* Left Column Tabs Sidebar */}
          <div className="lg:sticky lg:top-24 space-y-4">
            {/* Quick Stats Widget */}
            <div className="bg-[#1C2826] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400 text-xl font-bold">
                    <FaBookOpen />
                  </div>
                  <div>
                    <h3 className="font-black text-lg">{classes.length} Sessions</h3>
                    <span className="text-[11px] text-gray-400 uppercase tracking-wider block">Curriculum Schedule</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Learners</span>
                  <span className="text-base font-black text-yellow-400">{enrollments.length || course.enrolledStudentsCount || 0} Enrolled</span>
                </div>
                <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Materials</span>
                  <span className="text-base font-black text-emerald-400">{materials.length} Uploaded</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="space-y-2.5">
              <button
                onClick={() => setCourseActiveTab('classes')}
                className={`w-full rounded-2xl py-4 px-5 flex items-center justify-between border transition-all cursor-pointer ${
                  courseActiveTab === 'classes'
                    ? 'bg-brand-green border-brand-green text-white shadow-md shadow-brand-green/20'
                    : 'bg-white/80 border-gray-200 hover:bg-white text-gray-700'
                }`}
              >
                <span className="text-sm font-extrabold flex items-center gap-2.5">
                  <FaVideo size={14} className={courseActiveTab === 'classes' ? 'text-white' : 'text-brand-green'} />
                  <span>Scheduled Live Classes ({classes.length})</span>
                </span>
                <FaChevronRight className="text-xs opacity-70" />
              </button>

              <button
                onClick={() => setCourseActiveTab('materials')}
                className={`w-full rounded-2xl py-4 px-5 flex items-center justify-between border transition-all cursor-pointer ${
                  courseActiveTab === 'materials'
                    ? 'bg-brand-green border-brand-green text-white shadow-md shadow-brand-green/20'
                    : 'bg-white/80 border-gray-200 hover:bg-white text-gray-700'
                }`}
              >
                <span className="text-sm font-extrabold flex items-center gap-2.5">
                  <FaBook size={14} className={courseActiveTab === 'materials' ? 'text-white' : 'text-brand-green'} />
                  <span>Class Materials & Recordings ({materials.length})</span>
                </span>
                <FaChevronRight className="text-xs opacity-70" />
              </button>

              <button
                onClick={() => setCourseActiveTab('students')}
                className={`w-full rounded-2xl py-4 px-5 flex items-center justify-between border transition-all cursor-pointer ${
                  courseActiveTab === 'students'
                    ? 'bg-brand-green border-brand-green text-white shadow-md shadow-brand-green/20'
                    : 'bg-white/80 border-gray-200 hover:bg-white text-gray-700'
                }`}
              >
                <span className="text-sm font-extrabold flex items-center gap-2.5">
                  <FaUsers size={14} className={courseActiveTab === 'students' ? 'text-white' : 'text-brand-green'} />
                  <span>Enrolled Student Roster ({enrollments.length})</span>
                </span>
                <FaChevronRight className="text-xs opacity-70" />
              </button>
            </div>
          </div>

          {/* Right Column Content Body */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* CLASSES TAB */}
            {courseActiveTab === 'classes' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2">
                  <h2 className="text-lg font-black text-gray-900">Classroom Timetable & Live Sessions</h2>
                  <span className="text-xs text-gray-500 font-bold">Total: {classes.length} Sessions</span>
                </div>

                {loadingCourseDetails ? (
                  <div className="flex justify-center p-12">
                    <div className="w-8 h-8 border-3 border-brand-green border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : classes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {classes.map((cls, idx) => {
                      const now = new Date();
                      const classDate = new Date(cls.date);

                      let startHour = 6, startMin = 0;
                      if (cls.time) {
                        const parts = cls.time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
                        if (parts) {
                          let h = parseInt(parts[1], 10);
                          const m = parseInt(parts[2], 10);
                          const ampm = parts[3] ? parts[3].toUpperCase() : null;
                          if (ampm === 'PM' && h < 12) h += 12;
                          if (ampm === 'AM' && h === 12) h = 0;
                          startHour = h;
                          startMin = m;
                        }
                      }

                      const datePart = new Date(cls.date).toISOString().split('T')[0];
                      const timePart = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}:00+05:30`;
                      const sessionStart = new Date(`${datePart}T${timePart}`);
                      const duration = cls.durationMinutes || 60;
                      const sessionEnd = new Date(sessionStart.getTime() + duration * 60 * 1000);

                      const isPast = now > sessionEnd;
                      const isLiveNow = now >= new Date(sessionStart.getTime() - 15 * 60 * 1000) && now <= sessionEnd;
                      const isUpcoming = now < new Date(sessionStart.getTime() - 15 * 60 * 1000);

                      return (
                        <div
                          key={cls._id || idx}
                          className={`bg-white rounded-3xl p-5 border flex flex-col justify-between shadow-xs hover:shadow-md transition-all ${
                            isLiveNow ? 'border-brand-green ring-2 ring-brand-green/20' : isPast ? 'border-gray-200 opacity-90' : 'border-gray-200/80'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Session {idx + 1}
                              </span>
                              {isLiveNow && (
                                <span className="text-[10px] font-extrabold text-green-700 bg-green-100 px-2.5 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span> LIVE NOW
                                </span>
                              )}
                              {isUpcoming && (
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                  UPCOMING
                                </span>
                              )}
                              {isPast && (
                                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                  COMPLETED
                                </span>
                              )}
                            </div>

                            <h4 className="font-black text-base text-gray-900 leading-snug mb-2 line-clamp-2">
                              {cls.title}
                            </h4>

                            <div className="flex items-center gap-3 text-xs text-gray-500 font-semibold mb-4">
                              <span className="flex items-center gap-1">
                                <FaCalendarAlt className="text-brand-green" size={12} />
                                {new Date(cls.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <FaClock className="text-brand-green" size={12} />
                                {cls.time || course.timings || '06:00 AM'}
                              </span>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-gray-100 mt-auto flex items-center justify-between">
                            {cls.zoomLink ? (
                              <button
                                onClick={() => setActiveLiveClass(cls)}
                                className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-sm hover:shadow flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                  isPast
                                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                    : 'bg-brand-green hover:bg-brand-green-dark text-white'
                                }`}
                              >
                                <FaPlayCircle size={13} />
                                <span>{isPast ? 'Replay / Enter Session ↗' : 'Start Live Classroom ↗'}</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => setIsAddMaterialOpen(true)}
                                className="w-full py-2 bg-emerald-50 hover:bg-brand-green hover:text-white text-emerald-800 rounded-xl font-bold text-xs transition-all cursor-pointer"
                              >
                                + Add Notes / Recording
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-12 text-center bg-white/70 rounded-3xl border border-dashed border-gray-300 text-gray-400">
                    No individual class sessions found.
                  </div>
                )}
              </div>
            )}

            {/* MATERIALS TAB */}
            {courseActiveTab === 'materials' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
                  <div>
                    <h2 className="text-lg font-black text-gray-900">Study Materials, Guides & Class Recordings</h2>
                    <p className="text-xs text-gray-400">Published directly to enrolled students' dashboard</p>
                  </div>
                  <button
                    onClick={() => setIsAddMaterialOpen(true)}
                    className="px-4 py-2.5 bg-brand-green hover:bg-brand-green-dark text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center gap-2 cursor-pointer w-max"
                  >
                    <FaPlus size={11} />
                    <span>Upload New Material</span>
                  </button>
                </div>

                {materials.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {materials.map((mat) => (
                      <div
                        key={mat._id}
                        className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs flex flex-col justify-between"
                      >
                        <div className="flex items-start gap-3.5 mb-4">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl shrink-0">
                            {mat.materialType === 'Recording' ? <FaVideo className="text-red-500" /> : <FaFilePdf className="text-blue-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 uppercase tracking-wider">
                              {mat.materialType || 'Recording'}
                            </span>
                            <h4 className="font-extrabold text-sm text-gray-900 mt-1 line-clamp-2">
                              {mat.topicsCovered}
                            </h4>
                            <span className="text-xs text-gray-400 block mt-1">
                              📅 {new Date(mat.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                          <button
                            onClick={() => setViewingMaterial(mat)}
                            className="px-4 py-2 bg-brand-green text-white hover:bg-brand-green-dark rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>Preview</span>
                            <FaExternalLinkAlt size={10} />
                          </button>

                          <button
                            onClick={() => handleDeleteMaterial(mat._id)}
                            className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                            title="Delete Material"
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center bg-white/70 rounded-3xl border border-dashed border-gray-300 space-y-3">
                    <FaCloudUploadAlt size={36} className="mx-auto text-gray-300" />
                    <p className="text-xs font-bold text-gray-600">No materials or recordings added yet for this course.</p>
                    <button
                      onClick={() => setIsAddMaterialOpen(true)}
                      className="px-5 py-2.5 bg-brand-green text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      + Add First Class Recording or Study PDF
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* STUDENTS TAB */}
            {courseActiveTab === 'students' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2">
                  <h2 className="text-lg font-black text-gray-900">Enrolled Student Roster</h2>
                  <span className="text-xs text-gray-500 font-bold">{enrollments.length} Active Learners</span>
                </div>

                {enrollments.length > 0 ? (
                  <div className="space-y-2.5">
                    {enrollments.map((enr, i) => (
                      <div
                        key={enr._id || i}
                        className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-green/10 text-brand-green-dark font-black flex items-center justify-center">
                            {i + 1}
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 block text-sm">{enr.studentEmail}</span>
                            <span className="text-gray-400 text-[11px]">Enrolled on {new Date(enr.createdAt).toLocaleDateString('en-IN')}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-bold text-brand-green bg-brand-green/10 px-2.5 py-1 rounded-lg text-[11px]">
                            Progress: {enr.progress || 0}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center bg-white/70 rounded-3xl border border-dashed border-gray-300 text-gray-400 text-xs font-medium">
                    No students currently enrolled in this batch.
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* ADD MATERIAL MODAL */}
        <AnimatePresence>
          {isAddMaterialOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setIsAddMaterialOpen(false)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white w-full max-w-lg rounded-[2.5rem] p-6 lg:p-8 shadow-2xl z-10"
              >
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
                  <div>
                    <h2 className="text-xl font-black text-gray-900">Add Class Material / Recording</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Publish study guide or recorded session for students</p>
                  </div>
                  <button
                    onClick={() => setIsAddMaterialOpen(false)}
                    className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 cursor-pointer"
                  >
                    <FaTimes size={14} />
                  </button>
                </div>

                {materialMsg && (
                  <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl">
                    {materialMsg}
                  </div>
                )}

                <form onSubmit={handleAddMaterialSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                      Class / Session Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={materialForm.date}
                      onChange={(e) => setMaterialForm({ ...materialForm, date: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-brand-green/20 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                      Material Type *
                    </label>
                    <select
                      value={materialForm.materialType}
                      onChange={(e) => setMaterialForm({ ...materialForm, materialType: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-brand-green/20 outline-none"
                    >
                      <option value="Recording">📹 Video Session Recording</option>
                      <option value="PDF">📄 PDF Notes & Study Guide</option>
                      <option value="Other">🧘 Practice Audio / Slide Resource</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                      Topics Covered / Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Session 3: Pranayama & Surya Namaskar Flow"
                      value={materialForm.topicsCovered}
                      onChange={(e) => setMaterialForm({ ...materialForm, topicsCovered: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-brand-green/20 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                      Google Drive / Video Link / Document URL *
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://drive.google.com/file/d/... or YouTube / Cloud URL"
                      value={materialForm.driveLink}
                      onChange={(e) => setMaterialForm({ ...materialForm, driveLink: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-brand-green/20 outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setIsAddMaterialOpen(false)}
                      className="px-5 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={materialSubmitting}
                      className="px-7 py-3 rounded-2xl bg-brand-green hover:bg-brand-green-dark text-white font-extrabold text-xs shadow-md disabled:opacity-60 cursor-pointer"
                    >
                      {materialSubmitting ? 'Publishing...' : 'Publish Material'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MATERIAL PREVIEW MODAL */}
        <AnimatePresence>
          {viewingMaterial && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setViewingMaterial(null)} />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col relative z-10 overflow-hidden">
                <div className="bg-white px-6 py-5 border-b border-gray-100 flex justify-between items-center shrink-0">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{viewingMaterial.topicsCovered}</h3>
                    <p className="text-sm font-medium text-gray-500">{viewingMaterial.materialType} • {new Date(viewingMaterial.date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <a href={viewingMaterial.driveLink} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                      Open in New Tab
                    </a>
                    <button onClick={() => setViewingMaterial(null)} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all cursor-pointer">
                      <FaTimes size={18}/>
                    </button>
                  </div>
                </div>
                <div className="flex-1 w-full bg-gray-100 flex items-center justify-center relative">
                  <iframe 
                    src={getEmbedUrl(viewingMaterial.driveLink)} 
                    className="w-full h-full border-none" 
                    title="Material Preview" 
                    allow="autoplay; fullscreen"
                  ></iframe>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Live Classroom Modal with Host Privileges & Attendance */}
        <ZoomLiveClassroom
          isOpen={Boolean(activeLiveClass)}
          onClose={() => setActiveLiveClass(null)}
          liveClass={activeLiveClass}
          course={selectedCourseData?.course || selectedCourse}
          userRole="instructor"
        />

      </div>
    );
  }

  // DEFAULT DASHBOARD VIEW
  return (
    <div className="space-y-8 pb-16 font-inter">
      
      {/* Top Banner Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#06331A] via-[#0A4F2A] to-[#15803D] rounded-[2.5rem] p-6 lg:p-10 text-white shadow-[0_15px_40px_rgba(10,79,42,0.18)]">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none text-[180px]">
          <FaOm />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#D4AF37] text-xs font-black tracking-wider uppercase">
              <FaSpa /> Official Instructor Panel
            </div>
            <h1 className="text-2xl lg:text-4xl font-black tracking-tight">
              Namaste, {profile.name || 'Instructor'} 🙏
            </h1>
            <p className="text-emerald-100/90 text-sm max-w-xl">
              Access your full course curriculum, class schedules, enrolled learners, and publish session recordings and materials for completed classes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsEditProfileOpen(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white font-bold text-xs transition-all cursor-pointer"
            >
              <FaEdit />
              <span>Edit Profile & Bio</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Assigned Programs */}
        <div className="bg-white/80 backdrop-blur-xl p-5 rounded-3xl border border-white/80 shadow-xs flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl font-black shrink-0">
            <FaBookOpen />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Assigned Courses</span>
            <h3 className="text-2xl font-black text-gray-900">
              {stats.totalCourses || 0}
            </h3>
          </div>
        </div>

        {/* Speciality Badge */}
        <div className="bg-white/80 backdrop-blur-xl p-5 rounded-3xl border border-white/80 shadow-xs flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center text-2xl font-black shrink-0">
            <FaSpa />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Discipline / Skill</span>
            <h3 className="text-sm font-black text-gray-900 truncate">
              {profile.speciality || 'Yoga & Pranayama'}
            </h3>
          </div>
        </div>

        {/* Total Sessions */}
        <div className="bg-white/80 backdrop-blur-xl p-5 rounded-3xl border border-white/80 shadow-xs flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center text-2xl font-black shrink-0">
            <FaVideo />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Total Sessions</span>
            <h3 className="text-2xl font-black text-gray-900">
              {stats.totalClasses || 0}
            </h3>
          </div>
        </div>

        {/* Students Enrolled */}
        <div className="bg-white/80 backdrop-blur-xl p-5 rounded-3xl border border-white/80 shadow-xs flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-2xl font-black shrink-0">
            <FaUsers />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Total Learners</span>
            <h3 className="text-2xl font-black text-gray-900">
              {stats.totalStudents || 0}
            </h3>
          </div>
        </div>

      </div>

      {/* ASSIGNED COURSES SECTION */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <FaGraduationCap className="text-brand-green" /> My Assigned Programs (Full Course Access)
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Click any course to manage its timetable, view student roster, and publish class materials.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/70 rounded-full w-max">
            {assignedCourses.length} Assigned Program{assignedCourses.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-3 border-brand-green border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : assignedCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignedCourses.map((course) => (
              <div 
                key={course._id}
                className="bg-white/85 backdrop-blur-xl rounded-[2rem] border border-white/90 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all flex flex-col overflow-hidden group"
              >
                {/* Course Thumbnail & Timings Banner */}
                <div className="relative h-44 w-full bg-gray-100 p-3 pb-0 overflow-hidden">
                  <div className="w-full h-full rounded-2xl overflow-hidden relative">
                    {course.thumbnailUrl ? (
                      <img 
                        src={getCourseImageUrl(course.thumbnailUrl)} 
                        alt={course.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/images/morning_yoga.png';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
                        <FaSpa size={36} />
                      </div>
                    )}
                    <div className="absolute top-2.5 right-2.5 bg-white/95 px-2.5 py-1 rounded-xl text-[10px] font-extrabold text-brand-green shadow-xs uppercase">
                      {course.category}
                    </div>

                    {/* Class Timing Banner */}
                    <div className="absolute bottom-2.5 left-2.5 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-1.5">
                      <FaClock className="text-emerald-400" size={11} />
                      <span>{course.timings || (course.startTime ? `${course.startTime} to ${course.endTime}` : '06:00 to 07:15')}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-extrabold text-base text-gray-900 leading-snug line-clamp-2 mb-2 group-hover:text-brand-green transition-colors">
                      {course.title}
                    </h3>
                    
                    {/* Course Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-[#FAF7F2] p-3 rounded-2xl border border-gray-200/60 mb-3">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Enrolled</span>
                        <span className="font-black text-gray-900">{course.enrolledStudentsCount || 0} Students</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Total Sessions</span>
                        <span className="font-black text-brand-green-dark">{course.totalSessionsCount || 0} Classes</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Materials</span>
                        <span className="font-bold text-emerald-800">{course.materials?.length || 0} Uploaded</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Level</span>
                        <span className="font-bold text-gray-700">{course.level || 'All Levels'}</span>
                      </div>
                    </div>

                    {/* Assigned Moderator Info */}
                    {course.moderatorId?.name && (
                      <div className="p-2 rounded-xl bg-teal-50/80 border border-teal-200/60 flex items-center justify-between text-xs text-teal-950">
                        <span className="flex items-center gap-1.5 font-bold">
                          <FaShieldAlt className="text-teal-700" size={11} />
                          <span>Mod: {course.moderatorId.name}</span>
                        </span>
                        <span className="text-[10px] text-teal-800 font-semibold">{course.moderatorId.phone || 'Online'}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
                    <button
                      onClick={() => handleOpenCourseDetails(course)}
                      className="w-full py-3 bg-brand-green hover:bg-brand-green-dark text-white rounded-xl font-extrabold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <FaBookOpen size={13} />
                      <span>Open Course & Materials Manager ↗</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-white/60 rounded-3xl border border-dashed border-gray-300 space-y-2">
            <FaChalkboardTeacher size={36} className="mx-auto text-gray-300" />
            <h3 className="font-bold text-gray-700 text-sm">No courses assigned to your profile yet.</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              When the administrator assigns you as lead instructor for a course in Course Management, it will appear here with complete access.
            </p>
          </div>
        )}
      </div>

      {/* SCHEDULED SESSIONS QUEUE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-6 lg:p-8 border border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <FaVideo className="text-brand-green" /> Upcoming Live Zoom Schedule
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Chronological list of upcoming live sessions across your courses</p>
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-full text-xs font-bold">
                {upcomingClasses.length} Scheduled
              </span>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-3 border-brand-green border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : upcomingClasses.length > 0 ? (
              <div className="space-y-3.5">
                {upcomingClasses.map((cls) => (
                  <div 
                    key={cls._id}
                    className="p-5 bg-gradient-to-br from-white to-[#FAF7F2] border border-gray-200/70 rounded-2xl shadow-xs hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-emerald-100/70 text-emerald-800 rounded-md text-[11px] font-extrabold">
                        {cls.courseId?.title || 'Yoga Program'}
                      </div>
                      <h3 className="font-extrabold text-base text-gray-900">{cls.title}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <FaCalendarAlt className="text-brand-green" />
                          {new Date(cls.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <FaClock className="text-brand-green" />
                          {cls.time || cls.courseId?.timings || '06:00 AM IST'}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {cls.zoomStartUrl || cls.zoomHostUrl || cls.zoomLink || cls.zoomJoinUrl ? (
                        <a
                          href={cls.zoomStartUrl || cls.zoomHostUrl || (cls.zoomLink ? cls.zoomLink.replace(/\/j\//, '/s/') : cls.zoomJoinUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-5 py-2.5 bg-brand-green hover:bg-brand-green-dark text-white rounded-xl font-bold text-xs shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <FaPlayCircle size={13} />
                          <span>Start Session ↗</span>
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400 font-semibold bg-gray-100 px-3 py-1.5 rounded-lg">
                          Session Ready
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50/70 rounded-2xl border border-gray-200/60 border-dashed space-y-2">
                <FaCalendarAlt size={28} className="mx-auto text-gray-300" />
                <p className="text-xs text-gray-500 font-medium">No live sessions scheduled for today yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Instructor Profile Card */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-6 border border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] space-y-5">
            <div className="text-center pb-4 border-b border-gray-100">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-[#06331A] to-[#16a34a] text-white flex items-center justify-center text-3xl font-black shadow-lg mb-3">
                {profile.name ? profile.name.charAt(0).toUpperCase() : 'G'}
              </div>
              <h3 className="font-black text-lg text-gray-900">{profile.name}</h3>
              <p className="text-xs text-brand-green font-extrabold mt-0.5">{profile.speciality || 'Yoga Guru'}</p>
              <p className="text-xs text-gray-400">{profile.emailOrPhone}</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                <span className="text-gray-400 font-medium">Phone:</span>
                <span className="font-bold text-gray-800">{profile.phone || 'Not added'}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                <span className="text-gray-400 font-medium">Experience:</span>
                <span className="font-bold text-gray-800">{profile.experience || 'Experienced'}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                <span className="text-gray-400 font-medium">Status:</span>
                <span className="font-bold text-emerald-700 uppercase">Active Master</span>
              </div>
            </div>

            {profile.bio && (
              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] font-extrabold uppercase text-gray-400 tracking-wider">Guru Bio</span>
                <p className="text-xs text-gray-600 bg-gray-50 p-3.5 rounded-2xl leading-relaxed">
                  {profile.bio}
                </p>
              </div>
            )}

            <button
              onClick={() => setIsEditProfileOpen(true)}
              className="w-full py-3 bg-brand-green/10 hover:bg-brand-green hover:text-white text-brand-green-dark font-extrabold text-xs rounded-xl transition-all cursor-pointer"
            >
              Update Profile Information
            </button>
          </div>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      <AnimatePresence>
        {isEditProfileOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsEditProfileOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] p-6 lg:p-8 shadow-2xl z-10"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
                <div>
                  <h2 className="text-xl font-black text-gray-900">Update Profile</h2>
                  <p className="text-xs text-gray-400">Edit your public instructor information</p>
                </div>
                <button
                  onClick={() => setIsEditProfileOpen(false)}
                  className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 cursor-pointer"
                >
                  <FaTimes size={14} />
                </button>
              </div>

              {profileMsg && (
                <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl">
                  {profileMsg}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-brand-green/20 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-brand-green/20 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                    Speciality / Discipline
                  </label>
                  <input
                    type="text"
                    value={profileForm.speciality}
                    onChange={(e) => setProfileForm({ ...profileForm, speciality: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-brand-green/20 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                    Bio & Philosophy
                  </label>
                  <textarea
                    rows="3"
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-brand-green/20 outline-none resize-none"
                  ></textarea>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsEditProfileOpen(false)}
                    className="px-5 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="px-7 py-3 rounded-2xl bg-brand-green hover:bg-brand-green-dark text-white font-extrabold text-xs shadow-md disabled:opacity-60 cursor-pointer"
                  >
                    {profileSaving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Live Classroom Modal with Host Privileges & Attendance */}
      <ZoomLiveClassroom
        isOpen={Boolean(activeLiveClass)}
        onClose={() => setActiveLiveClass(null)}
        liveClass={activeLiveClass}
        course={activeLiveClass?.courseId}
        userRole="instructor"
      />

    </div>
  );
};

export default InstructorDashboard;
