import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaAward } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';

const Certificates = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [certificateData, setCertificateData] = useState({
    userName: '',
    courseName: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');

      // Fetch user profile and enrollments in parallel
      const [profileRes, enrollmentsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/auth/profile`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/payments/history`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      let userName = 'Student';
      if (profileRes.data.success && profileRes.data.data) {
        const { firstName, lastName, emailOrPhone } = profileRes.data.data;
        if (firstName) {
          userName = `${firstName} ${lastName || ''}`.trim();
        } else if (emailOrPhone && emailOrPhone.includes('@')) {
          const extractedName = emailOrPhone.split('@')[0];
          userName = extractedName.charAt(0).toUpperCase() + extractedName.slice(1);
        } else {
          userName = 'Student';
        }
      }

      let courseName = '';
      if (enrollmentsRes.data.success && enrollmentsRes.data.data) {
        const completedCourses = enrollmentsRes.data.data.filter(e => e.progress === 100);
        if (completedCourses.length > 0) {
          courseName = completedCourses[0].course?.title || 'Unknown Course';
        }
      }

      setCertificateData({ userName, courseName });
    } catch (err) {
      console.error('Error fetching certificate data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
     return <div className="min-h-screen flex items-center justify-center bg-bg-cream"><div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="min-h-screen bg-bg-cream flex flex-col px-5 py-4 font-inter">
      {/* Header */}
      <div className="flex items-center mb-8 mt-2">
        <button onClick={() => navigate(-1)} className="mr-4 text-brand-green">
          <FaArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-brand-green">Certificates</h1>
      </div>

      {certificateData.courseName ? (
        <div className="flex-1 flex flex-col items-center justify-center py-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-white p-2 md:p-4 rounded-md shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-100 relative overflow-hidden flex flex-col items-center text-center mb-10 aspect-[3/4]"
          >
            {/* Outer Border */}
            <div className="absolute inset-2 border-2 border-[#d4af37] pointer-events-none rounded-[2px]" />
            {/* Inner Border */}
            <div className="absolute inset-4 border border-[#d4af37] pointer-events-none rounded-[1px] opacity-50" />
            
            {/* Background pattern (subtle) */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#d4af37 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

            <div className="flex-1 flex flex-col items-center justify-center w-full px-6 py-12 z-10">
              <h2 className="text-3xl md:text-4xl font-serif italic text-brand-green-dark mb-1 font-medium leading-tight">
                Certificate
              </h2>
              <h3 className="text-xl md:text-2xl font-serif italic text-brand-green-dark mb-8 leading-tight">
                of Completion
              </h3>

              <div className="w-16 h-px bg-[#d4af37] mb-6"></div>

              <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-widest mb-4">
                This is to certify that
              </p>

              <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-800 mb-6 py-2 border-b border-gray-200 px-8 w-full max-w-full break-words leading-snug">
                {certificateData.userName}
              </h1>

              <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-widest mb-6">
                has successfully completed
              </p>

              <h4 className="text-xl md:text-2xl font-bold text-brand-green-dark mb-12">
                {certificateData.courseName}
              </h4>

              <div className="flex justify-between items-end w-full px-4 mt-auto">
                {/* Gold Seal */}
                <div className="text-[#d4af37] flex items-center justify-center drop-shadow-md">
                  <FaAward size={70} className="md:w-20 md:h-20" />
                </div>
                
                {/* Signature */}
                <div className="flex flex-col items-center w-32">
                  <div className="font-serif italic text-2xl text-gray-800 border-b border-gray-400 px-2 w-full text-center leading-none pb-1" style={{ fontFamily: "'Brush Script MT', cursive, serif" }}>
                    A. Director
                  </div>
                  <span className="text-[9px] text-gray-500 mt-2 uppercase tracking-widest font-semibold">
                    SDF LMS Director
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Download Button */}
          <button className="w-full max-w-md py-4 bg-brand-green hover:bg-brand-green-dark text-white font-bold rounded-2xl shadow-lg transition-transform hover:-translate-y-1 text-lg flex items-center justify-center gap-2">
            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="20" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Download Certificate
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <div className="bg-white/60 backdrop-blur-md rounded-3xl p-10 max-w-md shadow-sm border border-white">
            <FaAward className="mx-auto text-gray-300 mb-4" size={60} />
            <h2 className="text-xl font-bold text-gray-800 mb-2">No Certificates Earned Yet</h2>
            <p className="text-gray-500 text-sm mb-6">Complete a course to 100% to unlock and view your certificate of completion here.</p>
            <button 
              onClick={() => navigate('/learning')}
              className="bg-brand-green text-white px-6 py-2.5 rounded-full font-medium hover:bg-brand-green-dark transition-colors shadow-sm"
            >
              Continue Learning
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Certificates;
