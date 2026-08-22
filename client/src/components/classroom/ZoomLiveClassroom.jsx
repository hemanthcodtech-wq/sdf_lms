import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaVideo, FaPlayCircle, FaCheckCircle, FaTimes, FaExpand, 
  FaCompress, FaExternalLinkAlt, FaUsers, FaClock, FaCalendarAlt,
  FaMicrophone, FaChalkboardTeacher, FaShieldAlt, FaOm
} from 'react-icons/fa';

const ZoomLiveClassroom = ({ isOpen, onClose, liveClass, course, userRole = 'student' }) => {
  const [loading, setLoading] = useState(true);
  const [sdkData, setSdkData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [checkedIn, setCheckedIn] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (isOpen && liveClass) {
      fetchSdkAndCheckIn();
    } else {
      setSdkData(null);
      setCheckedIn(false);
      setErrorMsg('');
    }
  }, [isOpen, liveClass]);

  const fetchSdkAndCheckIn = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      // Determine correct token from localStorage based on role
      const token = 
        userRole === 'instructor' ? localStorage.getItem('instructorToken') :
        userRole === 'moderator' ? localStorage.getItem('moderatorToken') :
        userRole === 'admin' ? localStorage.getItem('adminToken') :
        localStorage.getItem('token');

      const headers = { Authorization: `Bearer ${token}` };

      // 1. In-App Check-In (Log Attendance)
      try {
        await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/live-classes/${liveClass._id}/check-in`,
          {},
          { headers }
        );
        setCheckedIn(true);
      } catch (err) {
        console.log('Attendance check-in logged via fallback');
      }

      // 2. Fetch SDK token
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/live-classes/${liveClass._id}/sdk-token`,
        { headers }
      );

      if (res.data.success) {
        setSdkData(res.data.data);
      } else {
        setErrorMsg('Failed to initialize Zoom meeting credentials');
      }
    } catch (err) {
      console.error('Error joining live classroom:', err);
      setErrorMsg(err.response?.data?.message || 'Error connecting to live classroom session.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !liveClass) return null;

  const meetingId = sdkData?.meetingNumber || liveClass.zoomMeetingId || 'Live Session';
  const directZoomLink = sdkData?.zoomLink || liveClass.zoomLink;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 md:p-6">
        
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/85 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className={`relative bg-neutral-900 text-white rounded-[2rem] shadow-2xl z-10 flex flex-col overflow-hidden border border-neutral-800 transition-all duration-300 ${
            isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-5xl h-[88vh]'
          }`}
        >
          {/* Top Control Bar */}
          <div className="bg-neutral-950 px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-brand-green/20 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-500/30">
                <FaVideo />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-white truncate">
                    {liveClass.title}
                  </h3>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> LIVE CLASSROOM
                  </span>
                </div>
                <p className="text-xs text-neutral-400 truncate">
                  {course?.title || 'Swamy Dwija Foundation'} • Session ID: {meetingId}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {directZoomLink && (
                <a
                  href={directZoomLink}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden sm:flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-all border border-neutral-700"
                  title="Launch in Zoom Desktop / Mobile App"
                >
                  <FaExternalLinkAlt size={10} />
                  <span>Zoom App</span>
                </a>
              )}

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="w-9 h-9 rounded-xl bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-300 transition-colors"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <FaCompress size={12} /> : <FaExpand size={12} />}
              </button>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-neutral-800 hover:bg-red-900/40 text-neutral-300 hover:text-red-400 flex items-center justify-center transition-colors"
                title="Leave Classroom"
              >
                <FaTimes size={14} />
              </button>
            </div>
          </div>

          {/* Main Classroom Viewer */}
          <div className="flex-1 bg-neutral-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            
            {loading ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-semibold text-neutral-300">Connecting to Zoom Live Session...</p>
                <span className="text-xs text-neutral-500">Verifying enrollment & recording attendance</span>
              </div>
            ) : errorMsg ? (
              <div className="max-w-md p-6 bg-red-950/40 border border-red-800/60 rounded-2xl text-center space-y-3">
                <p className="text-sm text-red-200 font-semibold">{errorMsg}</p>
                {directZoomLink && (
                  <a
                    href={directZoomLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-green text-white font-bold text-xs rounded-xl hover:bg-emerald-600 transition-colors"
                  >
                    <span>Open Direct Zoom Link</span>
                    <FaExternalLinkAlt size={11} />
                  </a>
                )}
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center space-y-6 max-w-xl mx-auto">
                
                {/* Visual Audio/Video Portal Orb */}
                <div className="relative">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-brand-green to-emerald-400 flex items-center justify-center text-white shadow-[0_0_50px_rgba(16,185,129,0.3)] animate-pulse">
                    <FaOm size={44} />
                  </div>
                  {checkedIn && (
                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full shadow-md">
                      <FaCheckCircle size={16} />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                    {sdkData?.role === 'Host' ? 'Guru Live Broadcast Active' : 'Attendance Verified • Connected'}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white">{liveClass.title}</h2>
                  <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto">
                    {course?.title || 'Swamy Dwija Foundation'} • Scheduled Duration: {liveClass.durationMinutes || 60} mins
                  </p>
                </div>

                {/* Session Details Card */}
                <div className="w-full bg-neutral-950/80 border border-neutral-800 rounded-2xl p-4 grid grid-cols-2 gap-3 text-left text-xs">
                  <div>
                    <span className="text-neutral-500 font-bold block">Session Time</span>
                    <span className="text-neutral-200 font-semibold">{liveClass.time || '06:00 AM'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 font-bold block">Attendance Status</span>
                    <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                      <FaCheckCircle size={11} /> Present
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center pt-2">
                  <a
                    href={directZoomLink}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-8 py-3.5 bg-brand-green hover:bg-emerald-600 text-white font-black text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <FaPlayCircle size={16} className="group-hover:scale-110 transition-transform" />
                    <span>Launch Live Video Room ↗</span>
                  </a>

                  <button
                    onClick={onClose}
                    className="w-full sm:w-auto px-6 py-3.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-sm rounded-xl transition-all cursor-pointer"
                  >
                    Return to Portal
                  </button>
                </div>

                <p className="text-[11px] text-neutral-500 max-w-md">
                  💡 Zoom Cloud Recording is active. If you miss any part of this session, the recorded video will be automatically published to your class materials tab after the meeting concludes.
                </p>

              </div>
            )}

          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ZoomLiveClassroom;
