import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPlus, FaEdit, FaTrash, FaTimes, FaCloudUploadAlt, 
  FaImage, FaChalkboardTeacher, FaShieldAlt, FaClock, 
  FaCheckCircle, FaUserCheck, FaCalendarAlt, FaHistory,
  FaPlayCircle, FaExternalLinkAlt, FaSyncAlt, FaWhatsapp
} from 'react-icons/fa';
import { getCourseImageUrl } from '../../utils/imageHelper';

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [moderators, setModerators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  const [formData, setFormData] = useState({
    title: '', 
    description: '', 
    category: 'Yoga', 
    price: '', 
    duration: '', 
    durationMonths: 1, 
    startDate: '', 
    endDate: '', 
    startTime: '06:00', 
    endTime: '07:15', 
    selectedSessionDates: [], 
    topics: '', 
    level: 'Beginner', 
    language: 'English', 
    accessValidity: '2 Months', 
    whatYouWillLearn: '',
    instructorId: '',
    moderatorId: '',
    whatsappGroupLink: ''
  });

  const [newSessionDate, setNewSessionDate] = useState('');
  const [enrolledUsers, setEnrolledUsers] = useState([]);
  const [enrolledCourse, setEnrolledCourse] = useState(null);
  const [isEnrolledModalOpen, setIsEnrolledModalOpen] = useState(false);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  // Timetable & Rescheduling State
  const [isTimetableOpen, setIsTimetableOpen] = useState(false);
  const [timetableCourse, setTimetableCourse] = useState(null);
  const [timetableClasses, setTimetableClasses] = useState([]);
  const [loadingTimetable, setLoadingTimetable] = useState(false);

  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [selectedClassToReschedule, setSelectedClassToReschedule] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    newDate: '',
    newTime: '06:00',
    newTitle: '',
    durationMinutes: 60
  });
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleMsg, setRescheduleMsg] = useState('');
  
  // Files
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Calendar UI state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [holidays, setHolidays] = useState({});

  useEffect(() => {
    fetchCourses();
    fetchStaffList();
    fetchHolidays(new Date().getFullYear());
  }, []);

  const fetchStaffList = async () => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem('adminToken')}` };
      const [instRes, modRes] = await Promise.allSettled([
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/instructors`, { headers }),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/moderators`, { headers })
      ]);

      if (instRes.status === 'fulfilled' && instRes.value.data?.success) {
        setInstructors(instRes.value.data.data.filter(i => i.status !== 'inactive'));
      }
      if (modRes.status === 'fulfilled' && modRes.value.data?.success) {
        setModerators(modRes.value.data.data.filter(m => m.status !== 'inactive'));
      }
    } catch (err) {
      console.error('Error fetching staff list for assignments:', err);
    }
  };

  const fetchHolidays = async (year) => {
    try {
      const res = await axios.get(`https://date.nager.at/api/v3/PublicHolidays/${year}/IN`);
      if (Array.isArray(res.data)) {
        const holidayMap = {};
        res.data.forEach(h => {
          holidayMap[h.date] = h.name;
        });
        setHolidays(prev => ({ ...prev, ...holidayMap }));
      }
    } catch (err) {
      const fallbackHolidays = {
        [`${year}-01-26`]: 'Republic Day',
        [`${year}-08-15`]: 'Independence Day',
        [`${year}-10-02`]: 'Gandhi Jayanti',
        [`${year}-12-25`]: 'Christmas Day',
      };
      setHolidays(prev => ({ ...prev, ...fallbackHolidays }));
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/courses`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setCourses(res.data.data);
    } catch (err) {
      console.error("Error fetching courses", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (course = null) => {
    if (course) {
      setEditingCourse(course);
      const instId = course.instructorId?._id || course.instructorId || '';
      const modId = course.moderatorId?._id || course.moderatorId || '';

      setFormData({
        title: course.title || '',
        description: course.description || '',
        category: course.category || 'Yoga',
        price: course.price !== undefined ? course.price : 0,
        duration: course.duration || '',
        durationMonths: course.durationMonths || 1,
        startDate: course.startDate ? new Date(course.startDate).toISOString().split('T')[0] : '',
        endDate: course.endDate ? new Date(course.endDate).toISOString().split('T')[0] : '',
        startTime: course.startTime || (course.timings ? course.timings.split(' to ')[0] : '06:00'),
        endTime: course.endTime || (course.timings ? course.timings.split(' to ')[1] : '07:15'),
        selectedSessionDates: course.sessionDates || [],
        topics: course.topics ? course.topics.join('\n') : '',
        level: course.level || 'Beginner',
        language: course.language || 'English',
        accessValidity: course.accessValidity || '2 Months',
        whatYouWillLearn: course.whatYouWillLearn ? course.whatYouWillLearn.join('\n') : '',
        instructorId: instId,
        moderatorId: modId,
        whatsappGroupLink: course.whatsappGroupLink || ''
      });
    } else {
      setEditingCourse(null);
      setFormData({ 
        title: '', 
        description: '', 
        category: 'Yoga', 
        price: '', 
        duration: '', 
        durationMonths: 1, 
        startDate: '', 
        endDate: '', 
        startTime: '06:00', 
        endTime: '07:15', 
        selectedSessionDates: [], 
        topics: '', 
        level: 'Beginner', 
        language: 'English', 
        accessValidity: '2 Months', 
        whatYouWillLearn: '',
        instructorId: instructors.length > 0 ? instructors[0]._id : '',
        moderatorId: moderators.length > 0 ? moderators[0]._id : '',
        whatsappGroupLink: ''
      });
    }
    setNewSessionDate('');
    setThumbnailFile(null);
    setIsModalOpen(true);
  };

  const handleRemoveSessionDate = (dateToRemove) => {
    setFormData({ ...formData, selectedSessionDates: formData.selectedSessionDates.filter(d => d !== dateToRemove) });
  };

  const handleViewEnrollments = async (course) => {
    setEnrolledCourse(course);
    setIsEnrolledModalOpen(true);
    setLoadingEnrollments(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/courses/${course._id}/enrollments`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setEnrolledUsers(res.data.data);
    } catch (err) {
      console.error("Error fetching enrollments", err);
    } finally {
      setLoadingEnrollments(false);
    }
  };

  const handleOpenTimetable = async (course) => {
    setTimetableCourse(course);
    setIsTimetableOpen(true);
    setLoadingTimetable(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/classes`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      if (res.data.success) {
        const filtered = res.data.data.filter(c => (c.courseId?._id || c.courseId) === course._id);
        setTimetableClasses(filtered);
      }
    } catch (err) {
      console.error('Error fetching course timetable:', err);
    } finally {
      setLoadingTimetable(false);
    }
  };

  const handleOpenRescheduleModal = (cls) => {
    setSelectedClassToReschedule(cls);
    const currentDateFormatted = cls.date ? new Date(cls.date).toISOString().split('T')[0] : '';
    setRescheduleForm({
      newDate: currentDateFormatted,
      newTime: cls.time || '06:00',
      newTitle: cls.title || '',
      durationMinutes: cls.durationMinutes || 60
    });
    setRescheduleMsg('');
    setIsRescheduleOpen(true);
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClassToReschedule) return;

    setRescheduling(true);
    setRescheduleMsg('');

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/classes/${selectedClassToReschedule._id}/reschedule`,
        rescheduleForm,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
        }
      );

      if (res.data.success) {
        setRescheduleMsg('Class session rescheduled successfully with a fresh Zoom meeting!');
        
        // Refresh timetable list
        if (timetableCourse) {
          const refreshRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/classes`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
          });
          if (refreshRes.data.success) {
            const filtered = refreshRes.data.data.filter(c => (c.courseId?._id || c.courseId) === timetableCourse._id);
            setTimetableClasses(filtered);
          }
        }
        fetchCourses();

        setTimeout(() => {
          setIsRescheduleOpen(false);
          setRescheduleMsg('');
        }, 1400);
      }
    } catch (err) {
      console.error('Error rescheduling class:', err);
      setRescheduleMsg(err.response?.data?.message || 'Error rescheduling class.');
    } finally {
      setRescheduling(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/admin/courses/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
        });
        fetchCourses();
      } catch (err) {
        console.error("Error deleting course", err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    
    let computedDurationMonths = 1;
    if (formData.startDate && formData.endDate) {
      const sDate = new Date(formData.startDate);
      const eDate = new Date(formData.endDate);
      const months = (eDate.getFullYear() - sDate.getFullYear()) * 12 + (eDate.getMonth() - sDate.getMonth());
      computedDurationMonths = months > 0 ? months : 1;
    }
    
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'whatYouWillLearn') {
          const array = formData.whatYouWillLearn.split('\n').map(item => item.trim()).filter(item => item !== '');
          data.append('whatYouWillLearn', JSON.stringify(array));
        } else if (key === 'topics') {
          const array = formData.topics.split('\n').map(item => item.trim()).filter(item => item !== '');
          data.append('topics', JSON.stringify(array));
        } else if (key === 'selectedSessionDates') {
          data.append('selectedSessionDates', JSON.stringify(formData.selectedSessionDates));
        } else if (key === 'durationMonths') {
          data.append('durationMonths', computedDurationMonths);
        } else if (key === 'price') {
          data.append('price', formData.price !== undefined && formData.price !== '' ? formData.price : 0);
        } else {
          data.append(key, formData[key]);
        }
      });
      if (thumbnailFile) data.append('thumbnail', thumbnailFile);

      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const headers = { 
        Authorization: `Bearer ${token}`
      };

      if (editingCourse) {
        await axios.put(`${import.meta.env.VITE_API_BASE_URL}/admin/courses/${editingCourse._id}`, data, { headers });
      } else {
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/admin/courses`, data, { headers });
      }

      setIsModalOpen(false);
      fetchCourses();
    } catch (err) {
      console.error("Error saving course", err);
      const errMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Error saving course.';
      alert(errMsg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8 pb-24 md:pb-8 font-inter">
      
      {/* Top Banner Header */}
      <div className="bg-white/60 backdrop-blur-2xl rounded-[2.5rem] p-6 lg:p-8 border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-green/10 text-brand-green-dark text-xs font-bold uppercase tracking-wider mb-2">
            Curriculum & Programs
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">Course Management</h1>
          <p className="text-gray-500 text-sm mt-1">
            Configure programs, assign lead instructors & moderators, manage daily class timetables, and reschedule sessions with Zoom.
          </p>
        </div>
        
        <button
          onClick={() => handleOpenModal()}
          className="bg-brand-green hover:bg-brand-green-dark text-white font-bold py-3.5 px-6 rounded-2xl shadow-[0_6px_20px_rgba(41,120,56,0.3)] transition-all flex items-center gap-2.5 w-max text-xs lg:text-sm group cursor-pointer"
        >
          <FaPlus size={12} className="group-hover:rotate-90 transition-transform" />
          <span>Create New Course</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
          {courses.map(course => {
            const assignedInstructorName = course.instructorId?.name || course.instructor;
            const assignedInstructorSpeciality = course.instructorId?.speciality;
            const assignedModeratorName = course.moderatorId?.name || course.moderator;

            return (
              <motion.div 
                key={course._id}
                initial={{ opacity: 0, scale: 0.96 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/75 backdrop-blur-2xl rounded-[2.25rem] border border-white/80 flex flex-col shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-300 overflow-hidden group"
              >
                {/* Image Section */}
                <div className="relative h-48 w-full bg-gray-100/80 overflow-hidden p-3 pb-0">
                  <div className="w-full h-full rounded-2xl overflow-hidden relative">
                    {course.thumbnailUrl ? (
                      <img
                        src={getCourseImageUrl(course.thumbnailUrl)}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        onError={(e) => { e.currentTarget.src = '/assets/course_yoga.png'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-100"><FaImage size={32} /></div>
                    )}
                    <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-extrabold text-brand-green shadow-xs uppercase tracking-wider">
                      {course.category}
                    </div>

                    {/* Batch Timing Tag */}
                    {(course.timings || course.startTime) && (
                      <div className="absolute bottom-2.5 left-2.5 bg-black/75 backdrop-blur-md px-3 py-1 rounded-xl text-[11px] font-bold text-white shadow-xs flex items-center gap-1.5">
                        <FaClock size={10} className="text-emerald-400" />
                        <span>{course.timings || `${course.startTime} - ${course.endTime}`}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Structured Content Section */}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-base lg:text-lg font-black text-gray-900 leading-snug line-clamp-2 group-hover:text-brand-green transition-colors">
                      {course.title}
                    </h3>
                  </div>

                  {/* Assigned Faculty and Moderator Badges */}
                  <div className="space-y-2 mb-4">
                    <div className="p-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200/80 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <FaChalkboardTeacher className="text-brand-green shrink-0" size={13} />
                        <div className="min-w-0">
                          <span className="font-bold text-emerald-950 truncate block">
                            {assignedInstructorName ? `Guru: ${assignedInstructorName}` : 'Instructor: Not Assigned'}
                          </span>
                          {assignedInstructorSpeciality && (
                            <span className="text-[10px] text-emerald-800 truncate block">
                              {assignedInstructorSpeciality}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-200/60 text-emerald-900 shrink-0">
                        Faculty
                      </span>
                    </div>

                    {assignedModeratorName && (
                      <div className="p-2 rounded-xl bg-teal-50/80 border border-teal-200/60 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <FaShieldAlt className="text-teal-700 shrink-0" size={12} />
                          <span className="font-bold text-teal-950 truncate">
                            Moderator: {assignedModeratorName}
                          </span>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-teal-200/60 text-teal-900 shrink-0">
                          Supervision
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-6 bg-[#FAF7F2] p-3.5 rounded-2xl border border-gray-200/50">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Fee</span>
                      <span className="font-black text-brand-green-dark text-sm">₹{course.price || 0}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Level</span>
                      <span className="font-bold text-gray-800">{course.level || 'All Levels'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Language</span>
                      <span className="font-bold text-gray-800 truncate block">{course.language || 'English'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Sessions</span>
                      <span className="font-bold text-brand-green-dark">
                        {course.sessionDates?.length || 0} Live Classes
                      </span>
                    </div>
                  </div>
                  
                  {/* Actions Footer */}
                  <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => handleViewEnrollments(course)} 
                        className="px-3 py-1.5 bg-brand-green/10 text-brand-green hover:bg-brand-green hover:text-white transition-all rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Students
                      </button>
                      <button 
                        onClick={() => handleOpenTimetable(course)} 
                        className="px-3 py-1.5 bg-emerald-100/80 text-emerald-950 hover:bg-emerald-700 hover:text-white transition-all rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer border border-emerald-300/60"
                        title="Manage Sessions & Reschedule Classes"
                      >
                        <FaCalendarAlt size={10} />
                        <span>Timetable</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => handleOpenModal(course)} 
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 hover:bg-brand-green hover:text-white transition-all shadow-xs cursor-pointer" 
                        title="Edit Course"
                      >
                        <FaEdit size={12} />
                      </button>
                      <button 
                        onClick={() => handleDelete(course._id)} 
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-xs cursor-pointer" 
                        title="Delete Course"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {courses.length === 0 && (
            <div className="col-span-full py-16 text-center text-gray-400 bg-white/40 backdrop-blur-md rounded-3xl border border-dashed border-gray-300">
              No courses found. Click "Create New Course" to add your first program.
            </div>
          )}
        </div>
      )}

      {/* Enrolled Users Drawer */}
      <AnimatePresence>
        {isEnrolledModalOpen && (
          <div className="fixed inset-0 z-40 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-green-dark/20 backdrop-blur-sm"
              onClick={() => setIsEnrolledModalOpen(false)}
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="bg-white/40 backdrop-blur-3xl border-l border-white/60 shadow-[-20px_0_40px_rgba(0,0,0,0.08)] w-full max-w-md h-full overflow-y-auto relative z-10 p-6 flex flex-col"
            >
              <button 
                onClick={() => setIsEnrolledModalOpen(false)}
                className="absolute top-6 right-6 text-gray-500 hover:text-brand-green bg-white/60 backdrop-blur-md p-2.5 rounded-full border border-white/50 shadow-sm transition-all z-20 cursor-pointer"
              >
                <FaTimes />
              </button>
              
              <h2 className="text-xl font-bold text-gray-800 mb-2 mt-2">Enrolled Students</h2>
              <p className="text-brand-green font-semibold text-sm mb-6 line-clamp-1">{enrolledCourse?.title}</p>
              
              <div className="flex-1 overflow-y-auto pr-2">
                {loadingEnrollments ? (
                  <div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-brand-green border-t-transparent rounded-full animate-spin"></div></div>
                ) : enrolledUsers.length === 0 ? (
                  <div className="text-center text-gray-500 py-8 bg-white/50 rounded-xl border border-dashed border-gray-300 text-sm">
                    No students are currently enrolled in this course.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {enrolledUsers.map(enrollment => (
                      <div key={enrollment._id} className="bg-white/80 p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-1">
                        <span className="font-bold text-gray-800 text-sm">{enrollment.studentEmail}</span>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-gray-500">Paid: <span className="font-semibold text-brand-green">₹{enrollment.amountPaid}</span></span>
                          <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">Progress: {enrollment.progress}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Course Timetable & Rescheduling Drawer */}
      <AnimatePresence>
        {isTimetableOpen && (
          <div className="fixed inset-0 z-40 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-green-dark/20 backdrop-blur-sm"
              onClick={() => setIsTimetableOpen(false)}
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="bg-white/50 backdrop-blur-3xl border-l border-white/60 shadow-[-20px_0_40px_rgba(0,0,0,0.08)] w-full max-w-2xl h-full overflow-y-auto relative z-10 p-6 md:p-8 flex flex-col"
            >
              <button 
                onClick={() => setIsTimetableOpen(false)}
                className="absolute top-6 right-6 text-gray-500 hover:text-brand-green bg-white/60 backdrop-blur-md p-2.5 rounded-full border border-white/50 shadow-sm transition-all z-20 cursor-pointer"
              >
                <FaTimes />
              </button>

              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-green/10 text-brand-green-dark text-[11px] font-bold uppercase tracking-wider mb-2">
                  <FaCalendarAlt size={10} /> Live Sessions Schedule
                </div>
                <h2 className="text-xl md:text-2xl font-black text-gray-900 leading-tight">Class Timetable & Sessions</h2>
                <p className="text-brand-green font-bold text-sm mt-0.5 line-clamp-1">{timetableCourse?.title}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Reschedule any individual class session to a new date/time. A new Zoom meeting link will be automatically generated.
                </p>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                {loadingTimetable ? (
                  <div className="flex justify-center p-12"><div className="w-8 h-8 border-3 border-brand-green border-t-transparent rounded-full animate-spin"></div></div>
                ) : timetableClasses.length === 0 ? (
                  <div className="text-center text-gray-500 py-12 bg-white/60 rounded-2xl border border-dashed border-gray-300 text-sm">
                    No individual class sessions found for this course.
                  </div>
                ) : (
                  timetableClasses.map((cls, idx) => {
                    const d = new Date(cls.date);
                    const formattedDate = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', weekday: 'short' });

                    return (
                      <div 
                        key={cls._id}
                        className="bg-white/80 backdrop-blur-md p-4 md:p-5 rounded-2xl border border-white/90 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                              Session {idx + 1}
                            </span>
                            <span className="text-xs text-gray-500 font-semibold">
                              {formattedDate} • {cls.time || '06:00 AM'}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-sm text-gray-900 leading-tight line-clamp-2">
                            {cls.title}
                          </h4>
                          {cls.zoomMeetingId && (
                            <span className="text-[11px] text-gray-400 block font-mono">
                              Zoom ID: {cls.zoomMeetingId}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {cls.zoomLink && (
                            <a
                              href={cls.zoomLink}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
                              title="Preview Zoom Link"
                            >
                              <FaExternalLinkAlt size={12} />
                            </a>
                          )}
                          <button
                            onClick={() => handleOpenRescheduleModal(cls)}
                            className="px-4 py-2.5 bg-brand-green hover:bg-brand-green-dark text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <FaSyncAlt size={11} />
                            <span>Reschedule</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reschedule Single Class Modal */}
      <AnimatePresence>
        {isRescheduleOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !rescheduling && setIsRescheduleOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white w-full max-w-lg rounded-[2.25rem] p-6 md:p-8 shadow-2xl z-10"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                <div>
                  <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                    <FaClock className="text-brand-green" /> Reschedule Class Session
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{selectedClassToReschedule?.title}</p>
                </div>
                <button 
                  onClick={() => !rescheduling && setIsRescheduleOpen(false)}
                  className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 cursor-pointer"
                >
                  <FaTimes size={14} />
                </button>
              </div>

              {rescheduleMsg && (
                <div className={`mb-4 p-3.5 rounded-2xl text-xs font-bold ${rescheduleMsg.includes('successfully') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {rescheduleMsg}
                </div>
              )}

              <form onSubmit={handleRescheduleSubmit} className="space-y-4">
                
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                    Session Title / Topic
                  </label>
                  <input 
                    type="text" 
                    required
                    value={rescheduleForm.newTitle} 
                    onChange={e => setRescheduleForm({ ...rescheduleForm, newTitle: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-brand-green/20 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                      New Date *
                    </label>
                    <input 
                      type="date" 
                      required
                      value={rescheduleForm.newDate} 
                      onChange={e => setRescheduleForm({ ...rescheduleForm, newDate: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-brand-green/20 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                      New Start Time *
                    </label>
                    <input 
                      type="time" 
                      required
                      value={rescheduleForm.newTime} 
                      onChange={e => setRescheduleForm({ ...rescheduleForm, newTime: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-brand-green/20 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                    Duration (Minutes)
                  </label>
                  <select 
                    value={rescheduleForm.durationMinutes}
                    onChange={e => setRescheduleForm({ ...rescheduleForm, durationMinutes: parseInt(e.target.value, 10) })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-brand-green/20 outline-none"
                  >
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes (1 Hour)</option>
                    <option value={75}>75 Minutes (1 Hour 15 Mins)</option>
                    <option value={90}>90 Minutes (1.5 Hours)</option>
                    <option value={120}>120 Minutes (2 Hours)</option>
                  </select>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-[11px] leading-relaxed">
                  ⚡ <strong>Automated Zoom Meeting:</strong> Rescheduling will automatically replace the old session's Zoom meeting with a new live room and notify enrolled students.
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <button 
                    type="button"
                    disabled={rescheduling}
                    onClick={() => setIsRescheduleOpen(false)}
                    className="px-5 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={rescheduling}
                    className="px-7 py-3 rounded-2xl bg-brand-green hover:bg-brand-green-dark text-white font-extrabold text-xs shadow-md disabled:opacity-60 flex items-center gap-2 cursor-pointer"
                  >
                    {rescheduling ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Generating New Zoom Meeting...</>
                    ) : 'Confirm & Reschedule'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Course Form Drawer */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-40 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-green-dark/20 backdrop-blur-sm"
              onClick={() => !uploading && setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="bg-white/40 backdrop-blur-3xl border-l border-white/60 shadow-[-20px_0_40px_rgba(0,0,0,0.08)] w-full max-w-2xl h-full overflow-y-auto relative z-10 p-6 md:p-10 flex flex-col overflow-x-hidden"
            >
              {/* Glassmorphism background refraction blobs */}
              <div className="absolute top-[-5%] right-[-10%] w-72 h-72 bg-brand-green/30 rounded-full blur-[90px] pointer-events-none"></div>
              <div className="absolute bottom-[20%] left-[-10%] w-64 h-64 bg-[#d67b22]/20 rounded-full blur-[90px] pointer-events-none"></div>

              <button 
                onClick={() => !uploading && setIsModalOpen(false)}
                className="absolute top-6 right-6 text-gray-500 hover:text-brand-green bg-white/60 backdrop-blur-md p-2.5 rounded-full border border-white/50 shadow-sm transition-all z-20 cursor-pointer"
              >
                <FaTimes />
              </button>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-6 relative z-10">{editingCourse ? 'Edit Course' : 'Create New Course'}</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                  
                  {/* Course Title */}
                  <div className="col-span-full">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Course Title *</label>
                    <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl focus:border-brand-green focus:bg-white/70 focus:ring-2 focus:ring-brand-green/20 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all font-medium" placeholder="e.g. Master Class in Asana & Pranayama" />
                  </div>

                  {/* ASSIGN INSTRUCTOR SELECTOR */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <FaChalkboardTeacher className="text-brand-green" /> Assign Lead Instructor *
                    </label>
                    <select 
                      value={formData.instructorId} 
                      onChange={e => setFormData({...formData, instructorId: e.target.value})} 
                      className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl outline-none focus:bg-white/70 focus:border-brand-green transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] font-medium"
                    >
                      <option value="">-- Select Registered Guru / Instructor --</option>
                      {instructors.map(inst => (
                        <option key={inst._id} value={inst._id}>
                          {inst.name} ({inst.speciality || 'Yoga Guru'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* ASSIGN MODERATOR SELECTOR */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <FaShieldAlt className="text-brand-green" /> Assign Platform Moderator
                    </label>
                    <select 
                      value={formData.moderatorId} 
                      onChange={e => setFormData({...formData, moderatorId: e.target.value})} 
                      className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl outline-none focus:bg-white/70 focus:border-brand-green transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] font-medium"
                    >
                      <option value="">-- Optional: Assign Platform Moderator --</option>
                      {moderators.map(mod => (
                        <option key={mod._id} value={mod._id}>
                          {mod.name} ({mod.emailOrPhone})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* WHATSAPP BATCH GROUP LINK */}
                  <div className="col-span-full">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <FaWhatsapp className="text-[#25D366]" size={16} /> Official Batch WhatsApp Group Link
                    </label>
                    <div className="relative">
                      <input 
                        type="url" 
                        value={formData.whatsappGroupLink} 
                        onChange={e => setFormData({...formData, whatsappGroupLink: e.target.value})} 
                        className="w-full p-3.5 pl-10 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl focus:border-brand-green focus:bg-white/70 focus:ring-2 focus:ring-brand-green/20 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all font-medium text-sm" 
                        placeholder="https://chat.whatsapp.com/..." 
                      />
                      <FaWhatsapp className="absolute left-3.5 top-4 text-[#25D366]" size={16} />
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Enrolled students will see this WhatsApp link in their learning portal & confirmation email to join the batch community.
                    </p>
                  </div>

                  {/* Fee */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Course Fee (₹ INR) *</label>
                    <input 
                      type="number" 
                      min="0"
                      required 
                      value={formData.price} 
                      onChange={e => setFormData({...formData, price: e.target.value})} 
                      className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl focus:border-brand-green focus:bg-white/70 focus:ring-2 focus:ring-brand-green/20 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all font-semibold" 
                      placeholder="e.g. 999" 
                    />
                  </div>
                  
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category *</label>
                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl outline-none focus:bg-white/70 focus:border-brand-green transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] font-medium">
                      <option>Yoga</option><option>Meditation</option><option>Nutrition</option><option>Ayurveda</option><option>Other</option>
                    </select>
                  </div>

                  {/* Language */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Instruction Language</label>
                    <select value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})} className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl outline-none focus:bg-white/70 focus:border-brand-green transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] font-medium">
                      <option value="English">English</option>
                      <option value="Telugu">Telugu</option>
                      <option value="English & Telugu">English & Telugu</option>
                      <option value="Hindi">Hindi</option>
                      <option value="English & Hindi">English & Hindi</option>
                    </select>
                  </div>

                  {/* Access Validity */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Access Validity After Completion</label>
                    <select value={formData.accessValidity} onChange={e => setFormData({...formData, accessValidity: e.target.value})} className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl outline-none focus:bg-white/70 focus:border-brand-green transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] font-medium">
                      <option value="1 Month">1 Month Access</option>
                      <option value="2 Months">2 Months Access</option>
                      <option value="3 Months">3 Months Access</option>
                      <option value="6 Months">6 Months Access</option>
                      <option value="1 Year">1 Year Access</option>
                      <option value="Lifetime">Lifetime Access</option>
                    </select>
                  </div>

                  {/* Level */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Proficiency Level</label>
                    <select value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})} className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl outline-none focus:bg-white/70 focus:border-brand-green transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] font-medium">
                      <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                    </select>
                  </div>

                  {/* Dates */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Start Date</label>
                    <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl outline-none focus:bg-white/70 focus:border-brand-green transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] font-medium" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">End Date</label>
                    <input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl outline-none focus:bg-white/70 focus:border-brand-green transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] font-medium" />
                  </div>

                  {/* Session Timings */}
                  <div className="col-span-full">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Daily Session Timings</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      
                      {/* Start Time Picker */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-500 w-12">Start:</span>
                        <div className="flex items-center gap-1 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl p-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                          <select 
                            value={formData.startTime ? (parseInt(formData.startTime.split(':')[0]) % 12 || 12).toString().padStart(2, '0') : '06'} 
                            onChange={e => {
                              const h = parseInt(e.target.value);
                              const isPM = formData.startTime && parseInt(formData.startTime.split(':')[0]) >= 12;
                              const min = formData.startTime ? formData.startTime.split(':')[1] : '00';
                              let newH = h;
                              if (isPM && h !== 12) newH += 12;
                              if (!isPM && h === 12) newH = 0;
                              setFormData({...formData, startTime: `${newH.toString().padStart(2, '0')}:${min}`});
                            }}
                            className="p-2 bg-transparent outline-none appearance-none cursor-pointer font-medium"
                          >
                            {[...Array(12)].map((_, i) => <option key={i+1} value={(i+1).toString().padStart(2, '0')}>{(i+1).toString().padStart(2, '0')}</option>)}
                          </select>
                          <span className="font-bold">:</span>
                          <select 
                            value={formData.startTime ? formData.startTime.split(':')[1] : '00'} 
                            onChange={e => {
                              const h = formData.startTime ? formData.startTime.split(':')[0] : '06';
                              setFormData({...formData, startTime: `${h}:${e.target.value}`});
                            }}
                            className="p-2 bg-transparent outline-none appearance-none cursor-pointer font-medium max-h-48 overflow-y-auto"
                          >
                            {[...Array(60)].map((_, i) => {
                              const m = i.toString().padStart(2, '0');
                              return <option key={m} value={m}>{m}</option>;
                            })}
                          </select>
                          <select 
                            value={formData.startTime && parseInt(formData.startTime.split(':')[0]) >= 12 ? 'PM' : 'AM'} 
                            onChange={e => {
                              const isPM = e.target.value === 'PM';
                              let h = parseInt(formData.startTime ? formData.startTime.split(':')[0] : '6');
                              const min = formData.startTime ? formData.startTime.split(':')[1] : '00';
                              if (isPM && h < 12) h += 12;
                              if (!isPM && h >= 12) h -= 12;
                              setFormData({...formData, startTime: `${h.toString().padStart(2, '0')}:${min}`});
                            }}
                            className="p-2 bg-transparent outline-none appearance-none cursor-pointer font-bold text-brand-green"
                          >
                            <option value="AM">AM</option><option value="PM">PM</option>
                          </select>
                        </div>
                      </div>

                      {/* End Time Picker */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-500 w-12">End:</span>
                        <div className="flex items-center gap-1 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl p-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                          <select 
                            value={formData.endTime ? (parseInt(formData.endTime.split(':')[0]) % 12 || 12).toString().padStart(2, '0') : '07'} 
                            onChange={e => {
                              const h = parseInt(e.target.value);
                              const isPM = formData.endTime && parseInt(formData.endTime.split(':')[0]) >= 12;
                              const min = formData.endTime ? formData.endTime.split(':')[1] : '15';
                              let newH = h;
                              if (isPM && h !== 12) newH += 12;
                              if (!isPM && h === 12) newH = 0;
                              setFormData({...formData, endTime: `${newH.toString().padStart(2, '0')}:${min}`});
                            }}
                            className="p-2 bg-transparent outline-none appearance-none cursor-pointer font-medium"
                          >
                            {[...Array(12)].map((_, i) => <option key={i+1} value={(i+1).toString().padStart(2, '0')}>{(i+1).toString().padStart(2, '0')}</option>)}
                          </select>
                          <span className="font-bold">:</span>
                          <select 
                            value={formData.endTime ? formData.endTime.split(':')[1] : '15'} 
                            onChange={e => {
                              const h = formData.endTime ? formData.endTime.split(':')[0] : '07';
                              setFormData({...formData, endTime: `${h}:${e.target.value}`});
                            }}
                            className="p-2 bg-transparent outline-none appearance-none cursor-pointer font-medium max-h-48 overflow-y-auto"
                          >
                            {[...Array(60)].map((_, i) => {
                              const m = i.toString().padStart(2, '0');
                              return <option key={m} value={m}>{m}</option>;
                            })}
                          </select>
                          <select 
                            value={formData.endTime && parseInt(formData.endTime.split(':')[0]) >= 12 ? 'PM' : 'AM'} 
                            onChange={e => {
                              const isPM = e.target.value === 'PM';
                              let h = parseInt(formData.endTime ? formData.endTime.split(':')[0] : '7');
                              const min = formData.endTime ? formData.endTime.split(':')[1] : '15';
                              if (isPM && h < 12) h += 12;
                              if (!isPM && h >= 12) h -= 12;
                              setFormData({...formData, endTime: `${h.toString().padStart(2, '0')}:${min}`});
                            }}
                            className="p-2 bg-transparent outline-none appearance-none cursor-pointer font-bold text-brand-green"
                          >
                            <option value="AM">AM</option><option value="PM">PM</option>
                          </select>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Custom Calendar for Session Dates */}
                  <div className="col-span-full bg-white/50 backdrop-blur-md border border-white/60 p-5 rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                    <label className="block text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <FaCalendarAlt className="text-brand-green" /> Select Session Dates (Generates Classroom Schedule)
                    </label>
                    {(!formData.startDate || !formData.endDate) ? (
                      <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                        Please select a <strong>Start Date</strong> and <strong>End Date</strong> first to enable the calendar.
                      </div>
                    ) : (
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 w-full md:w-[320px] shrink-0">
                          {(() => {
                            const start = new Date(formData.startDate);
                            const end = new Date(formData.endDate);
                            const displayMonth = currentMonth || new Date(start.getFullYear(), start.getMonth(), 1);
                            
                            const nextMonth = () => setCurrentMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1));
                            const prevMonth = () => setCurrentMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1));

                            const daysInMonth = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 0).getDate();
                            const firstDayOfMonth = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1).getDay();
                            
                            const days = [];
                            for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
                            for (let i = 1; i <= daysInMonth; i++) days.push(new Date(displayMonth.getFullYear(), displayMonth.getMonth(), i));

                            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

                            return (
                              <div>
                                <div className="flex justify-between items-center mb-4">
                                  <button type="button" onClick={prevMonth} className="text-gray-400 hover:text-brand-green p-1 cursor-pointer">&larr;</button>
                                  <span className="font-bold text-gray-800">{monthNames[displayMonth.getMonth()]} {displayMonth.getFullYear()}</span>
                                  <button type="button" onClick={nextMonth} className="text-gray-400 hover:text-brand-green p-1 cursor-pointer">&rarr;</button>
                                </div>
                                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => <div key={d} className={`text-xs font-bold ${i === 0 ? 'text-red-400' : 'text-gray-400'}`}>{d}</div>)}
                                </div>
                                <div className="grid grid-cols-7 gap-1 text-center">
                                  {days.map((day, idx) => {
                                    if (!day) return <div key={`empty-${idx}`} className="p-2"></div>;
                                    
                                    const dateStr = day.toISOString().split('T')[0];
                                    const isSelected = formData.selectedSessionDates.includes(dateStr);
                                    
                                    day.setHours(0,0,0,0);
                                    const startCmp = new Date(start); startCmp.setHours(0,0,0,0);
                                    const endCmp = new Date(end); endCmp.setHours(0,0,0,0);
                                    const isDisabled = day < startCmp || day > endCmp;
                                    
                                    const isHoliday = holidays[dateStr];
                                    const isSunday = day.getDay() === 0;
                                    const isSpecialDay = isHoliday || isSunday;

                                    return (
                                      <div key={dateStr} className="relative flex justify-center group">
                                        <button
                                          type="button"
                                          disabled={isDisabled}
                                          onClick={() => {
                                            if (isSelected) {
                                              handleRemoveSessionDate(dateStr);
                                            } else {
                                              setFormData({ ...formData, selectedSessionDates: [...formData.selectedSessionDates, dateStr].sort() });
                                            }
                                          }}
                                          className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors cursor-pointer ${
                                            isDisabled ? 'text-gray-300 cursor-not-allowed' :
                                            isSelected ? 'bg-brand-green text-white shadow-md' : 
                                            isSpecialDay ? 'text-red-500 bg-red-50 hover:bg-red-100' :
                                            'text-gray-700 hover:bg-gray-100'
                                          }`}
                                        >
                                          {day.getDate()}
                                        </button>
                                        {isHoliday && !isDisabled && (
                                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                                            {isHoliday}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        
                        {/* Selected Dates List */}
                        <div className="flex-1 flex flex-col">
                          <h4 className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-wider">Selected Sessions ({formData.selectedSessionDates.length})</h4>
                          <div className="flex flex-wrap gap-2 max-h-[250px] overflow-y-auto content-start">
                            {formData.selectedSessionDates.length === 0 ? (
                              <p className="text-sm text-gray-400 italic">Click dates on the calendar to select sessions.</p>
                            ) : (
                              formData.selectedSessionDates.map((date) => {
                                const d = new Date(date);
                                const dateFmt = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                                const dayName = d.toLocaleDateString('en-GB', { weekday: 'short' });
                                return (
                                  <div key={date} className="flex items-center gap-2 bg-white text-gray-700 pl-3 pr-2 py-1.5 rounded-lg text-sm font-medium border border-brand-green/20 shadow-sm">
                                    <span className="text-brand-green font-bold text-xs">{dayName}</span>
                                    <span>{dateFmt}</span>
                                    <button type="button" onClick={() => handleRemoveSessionDate(date)} className="text-gray-300 hover:text-red-500 ml-1 p-0.5 rounded transition-colors cursor-pointer"><FaTimes size={12}/></button>
                                  </div>
                                )
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="col-span-full">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">About This Course</label>
                    <textarea required rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl focus:border-brand-green focus:bg-white/70 focus:ring-2 focus:ring-brand-green/20 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all resize-none font-medium" placeholder="This course helps you relax your mind..."></textarea>
                  </div>
                  
                  <div className="col-span-full">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Topics Covered (One per line)</label>
                    <textarea required rows="3" value={formData.topics} onChange={e => setFormData({...formData, topics: e.target.value})} className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl focus:border-brand-green focus:bg-white/70 focus:ring-2 focus:ring-brand-green/20 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all resize-none font-medium" placeholder={`Introduction to Asana\nPranayama Breathing\nVedic Meditation`}></textarea>
                  </div>
                  
                  <div className="col-span-full">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">What You Will Learn (One per line)</label>
                    <textarea required rows="3" value={formData.whatYouWillLearn} onChange={e => setFormData({...formData, whatYouWillLearn: e.target.value})} className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl focus:border-brand-green focus:bg-white/70 focus:ring-2 focus:ring-brand-green/20 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all resize-none font-medium" placeholder={`Stress relief techniques\nBreathing exercises\nHolistic wellness practices`}></textarea>
                  </div>

                  {/* Media Uploads */}
                  <div className="col-span-full pt-4 mt-2 border-t border-white/40">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><FaCloudUploadAlt className="text-brand-green" /> Media Uploads</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="border border-white/60 bg-white/40 backdrop-blur-md rounded-2xl p-5 text-center hover:bg-white/60 transition-colors shadow-sm cursor-pointer group">
                        <label className="cursor-pointer block">
                          <div className="w-12 h-12 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-white group-hover:scale-110 transition-transform">
                            <FaImage className="text-brand-green/70 text-xl" />
                          </div>
                          <span className="text-sm font-semibold text-gray-700">Upload Thumbnail Image</span>
                          <p className="text-xs text-gray-500 mt-1.5">{thumbnailFile ? thumbnailFile.name : (editingCourse?.thumbnailUrl ? 'Current image saved' : 'JPG, PNG formats')}</p>
                          <input type="file" className="hidden" accept="image/*" onChange={e => setThumbnailFile(e.target.files[0])} />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 pb-24 md:pb-4 mt-auto">
                  <button type="submit" disabled={uploading} className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-bold py-4 rounded-xl shadow-[0_4px_14px_0_rgba(41,120,56,0.39)] transition-all disabled:opacity-70 flex justify-center items-center gap-2 text-lg cursor-pointer">
                    {uploading ? (
                      <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Uploading...</>
                    ) : 'Save & Publish Course'}
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

export default CourseManagement;
