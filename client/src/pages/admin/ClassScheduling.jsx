import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaTimes, FaCalendarAlt, FaClock, FaVideo, FaLink, FaTrash, FaEdit, FaEnvelope } from 'react-icons/fa';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Calendar localization setup
const locales = {
  'en-US': enUS,
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const ClassScheduling = () => {
  const [scheduledClasses, setScheduledClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [filterCourseId, setFilterCourseId] = useState('all');

  const [formData, setFormData] = useState({
    title: '',
    courseId: '',
    date: '',
    time: '10:00',
    durationMinutes: 60,
    isRecurring: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classesRes, coursesRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/classes`),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/courses/public`)
      ]);
      setScheduledClasses(classesRes.data.data);
      setCourses(coursesRes.data.data);
    } catch (err) {
      console.error("Error fetching scheduling data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await axios.put(`${import.meta.env.VITE_API_BASE_URL}/classes/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
        });
      } else {
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/classes`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
        });
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ title: '', courseId: '', date: '', time: '10:00', durationMinutes: 60, isRecurring: false });
      fetchData();
    } catch (err) {
      console.error("Error saving class:", err);
      alert('Error saving class schedule.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (cls) => {
    setFormData({
      title: cls.title || '',
      courseId: typeof cls.courseId === 'object' ? cls.courseId._id : cls.courseId,
      date: cls.date.split('T')[0],
      time: cls.time,
      durationMinutes: cls.durationMinutes,
      isRecurring: cls.isRecurring || false
    });
    setEditingId(cls._id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to cancel this class?")) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/classes/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
        });
        fetchData();
      } catch (err) {
        console.error("Error deleting class:", err);
      }
    }
  };

  // Filter classes by course
  const filteredClasses = filterCourseId === 'all' 
    ? scheduledClasses 
    : scheduledClasses.filter(cls => (typeof cls.courseId === 'object' ? cls.courseId._id : cls.courseId) === filterCourseId);

  // Format events for calendar
  const events = filteredClasses.map(cls => {
    const startDate = new Date(`${cls.date.split('T')[0]}T${cls.time}:00`);
    const endDate = new Date(startDate.getTime() + cls.durationMinutes * 60000);
    return {
      id: cls._id,
      title: cls.title || cls.courseId?.title || 'Class',
      start: startDate,
      end: endDate,
      resource: cls
    };
  });

  const handleSendReminder = async (id) => {
    if (window.confirm("Send reminder email to all enrolled students?")) {
      try {
        const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/classes/${id}/remind`, {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
        });
        alert(res.data.message || 'Reminders sent.');
      } catch (err) {
        console.error("Error sending reminders:", err);
        alert('Failed to send reminders.');
      }
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8 h-[calc(100vh-64px)] flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Class Scheduling</h1>
          <p className="text-gray-500 mt-1">Manage live sessions and Zoom meetings.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={filterCourseId} 
            onChange={(e) => setFilterCourseId(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 bg-white shadow-sm outline-none focus:border-brand-green"
          >
            <option value="all">All Courses</option>
            {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
          </select>

          <div className="bg-white rounded-lg p-1 border border-gray-200 shadow-sm flex items-center">
            <button 
              onClick={() => setViewMode('list')}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${viewMode === 'list' ? 'bg-brand-green/10 text-brand-green' : 'text-gray-500 hover:text-gray-700'}`}
            >
              List
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${viewMode === 'calendar' ? 'bg-brand-green/10 text-brand-green' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Calendar
            </button>
          </div>
          <button 
            onClick={() => {
              setEditingId(null);
              setFormData({ title: '', courseId: '', date: '', time: '10:00', durationMinutes: 60, isRecurring: false });
              setIsModalOpen(true);
            }}
            className="bg-brand-green hover:bg-brand-green-dark text-white font-semibold py-2 px-5 rounded-lg shadow-[0_4px_14px_0_rgba(41,120,56,0.39)] transition-all flex items-center gap-2"
          >
            <FaPlus /> Schedule
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div></div>
      ) : viewMode === 'list' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden shrink-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm font-semibold uppercase tracking-wide">
                  <th className="p-4 pl-6">Topic / Course</th>
                  <th className="p-4">Schedule</th>
                  <th className="p-4 text-center">Duration</th>
                  <th className="p-4">Zoom Link</th>
                  <th className="p-4 text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredClasses.map((cls) => (
                  <tr key={cls._id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="font-semibold text-gray-800">{cls.title || cls.courseId?.title}</div>
                      <div className="text-xs text-brand-green font-bold">{cls.courseId?.category}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5"><FaCalendarAlt className="text-gray-400"/> {new Date(cls.date).toLocaleDateString()}</span>
                        <span className="text-sm text-gray-500 flex items-center gap-1.5"><FaClock className="text-gray-400"/> {cls.time}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center font-medium text-gray-600">
                      {cls.durationMinutes} mins
                    </td>
                    <td className="p-4">
                      {cls.zoomLink ? (
                        <a href={cls.zoomLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1.5 bg-blue-50 w-max px-2.5 py-1 rounded-md border border-blue-100">
                          <FaVideo /> Join Meeting
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm italic">Not generated</span>
                      )}
                    </td>
                    <td className="p-4 pr-6 text-right flex justify-end gap-2">
                      <button 
                        onClick={() => handleSendReminder(cls._id)}
                        className="text-amber-500 hover:text-amber-700 p-2 border border-amber-100 rounded-lg hover:bg-amber-50 transition-all"
                        title="Send Reminder"
                      >
                        <FaEnvelope />
                      </button>
                      <button 
                        onClick={() => handleEdit(cls)}
                        className="text-blue-500 hover:text-blue-700 p-2 border border-blue-100 rounded-lg hover:bg-blue-50 transition-all"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        onClick={() => handleDelete(cls._id)}
                        className="text-red-500 hover:text-red-700 p-2 border border-red-100 rounded-lg hover:bg-red-50 transition-all"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredClasses.length === 0 && (
                  <tr><td colSpan="5" className="p-8 text-center text-gray-500">No scheduled classes found for the selected filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex-1 min-h-[500px]">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            views={['month', 'week', 'day']}
            eventPropGetter={(event) => ({
              style: {
                backgroundColor: '#297838', // brand-green
                borderRadius: '4px',
                opacity: 0.9,
                color: 'white',
                border: '0px',
                display: 'block',
                fontWeight: 'bold',
                fontSize: '12px'
              }
            })}
          />
        </div>
      )}

      {/* Schedule Form Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-40 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-green-dark/20 backdrop-blur-sm"
              onClick={() => !submitting && setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="bg-white/40 backdrop-blur-3xl border-l border-white/60 shadow-[-20px_0_40px_rgba(0,0,0,0.08)] w-full max-w-2xl h-full overflow-y-auto relative z-10 p-6 md:p-10 flex flex-col overflow-x-hidden"
            >
              {/* Glassmorphism background refraction blobs */}
              <div className="absolute top-[-5%] right-[-10%] w-72 h-72 bg-brand-green/30 rounded-full blur-[90px] pointer-events-none"></div>
              <div className="absolute bottom-[20%] left-[-10%] w-64 h-64 bg-[#d67b22]/20 rounded-full blur-[90px] pointer-events-none"></div>

              <button 
                onClick={() => {
                  if (!submitting) {
                    setIsModalOpen(false);
                    setEditingId(null);
                    setFormData({ title: '', courseId: '', date: '', time: '10:00', durationMinutes: 60, isRecurring: false });
                  }
                }}
                className="absolute top-6 right-6 text-gray-500 hover:text-brand-green bg-white/60 backdrop-blur-md p-2.5 rounded-full border border-white/50 shadow-sm transition-all z-20"
              >
                <FaTimes />
              </button>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-6 relative z-10 flex items-center gap-2">
                <FaCalendarAlt className="text-brand-green"/> {editingId ? 'Edit Class Schedule' : 'Schedule Class'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                  <div className="col-span-full">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Linked Course</label>
                    <select required value={formData.courseId} onChange={e => setFormData({...formData, courseId: e.target.value})} className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl outline-none focus:bg-white/70 focus:border-brand-green transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                      <option value="">Select a course...</option>
                      {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                    </select>
                  </div>

                  <div className="col-span-full">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Meeting Topic (Optional)</label>
                    <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl focus:border-brand-green focus:bg-white/70 focus:ring-2 focus:ring-brand-green/20 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all" placeholder="Leave blank to use course title" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date</label>
                    <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl focus:border-brand-green focus:bg-white/70 focus:ring-2 focus:ring-brand-green/20 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Time</label>
                    <input type="time" required value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl focus:border-brand-green focus:bg-white/70 focus:ring-2 focus:ring-brand-green/20 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Duration (Mins)</label>
                    <input type="number" required min="15" value={formData.durationMinutes} onChange={e => setFormData({...formData, durationMinutes: e.target.value === '' ? '' : parseInt(e.target.value)})} className="w-full p-3.5 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl focus:border-brand-green focus:bg-white/70 focus:ring-2 focus:ring-brand-green/20 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all" />
                  </div>
                  <div className="flex items-center pt-8">
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700">
                      <input type="checkbox" checked={formData.isRecurring} onChange={e => setFormData({...formData, isRecurring: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-brand-green focus:ring-brand-green" />
                      Recurring Meeting
                    </label>
                  </div>
                  
                  <div className="col-span-full pt-4 mt-2 border-t border-white/40">
                    <div className="bg-blue-50/70 backdrop-blur-sm border border-blue-100/50 rounded-lg p-3 text-sm text-blue-800 flex items-start gap-2 shadow-sm">
                      <FaLink className="mt-1 shrink-0" />
                      <p>A Zoom meeting link will be automatically generated and attached to this class.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-8 pb-24 md:pb-4 mt-auto">
                  <button type="submit" disabled={submitting} className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-bold py-4 rounded-xl shadow-[0_4px_14px_0_rgba(41,120,56,0.39)] transition-all disabled:opacity-70 flex justify-center items-center gap-2 text-lg">
                    {submitting ? (
                      <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Processing...</>
                    ) : editingId ? 'Update Class Schedule' : 'Schedule & Generate Zoom Link'}
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

export default ClassScheduling;
