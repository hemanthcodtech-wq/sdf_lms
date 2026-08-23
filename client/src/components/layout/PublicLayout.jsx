import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import axios from 'axios';
import PublicNavbar from './PublicNavbar';
import TopNav from './TopNav';
import BottomNav from './BottomNav';
import { useLanguage } from '../../context/LanguageContext';
import { 
  FaMapMarkerAlt, FaEnvelope, FaPhoneAlt, FaShieldAlt, 
  FaAward, FaYoutube, FaInstagram, FaFacebookF, FaLinkedinIn, 
  FaWhatsapp, FaLock, FaHeart, FaArrowRight
} from 'react-icons/fa';

const PublicLayout = () => {
  const { t } = useLanguage();
  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;

  const [livePrograms, setLivePrograms] = useState([]);

  useEffect(() => {
    const fetchLivePrograms = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/courses/public`);
        if (res.data.success && Array.isArray(res.data.data)) {
          setLivePrograms(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching live courses for footer:', err);
      }
    };
    fetchLivePrograms();
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-inter bg-[#FAF7F2]">
      {isLoggedIn ? <TopNav /> : <PublicNavbar />}
      
      {/* Main Content Area */}
      <main className="flex-grow pt-18 md:pt-20 pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* 🌟 Premium Institutional Footer */}
      <footer className={`bg-[#0F172A] text-white pt-16 pb-12 border-t-2 border-[#D4AF37]/30 relative overflow-hidden ${isLoggedIn ? 'mb-16 md:mb-0' : ''}`}>
        
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0A4F2A]/15 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Top Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-14 border-b border-gray-800/80">
            
            {/* Column 1: Organization Branding (4 cols) */}
            <div className="lg:col-span-4 space-y-5">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2.5 rounded-2xl shadow-md shrink-0">
                  <img src="/logo.png" alt="Swamy Dwija Foundation" className="h-10 w-auto" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-wider text-white">SWAMY DWIJA FOUNDATION</h3>
                  <p className="text-[11px] font-bold text-[#D4AF37] tracking-widest uppercase">ACADEMY OF YOGA & VEDIC SCIENCES</p>
                </div>
              </div>

              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed max-w-sm">
                Empowering seekers and practitioners worldwide through authentic Himalayan lineages, live masterclasses, personalized pranayama, and accredited digital certifications.
              </p>

              {/* Contact Info List */}
              <div className="space-y-2.5 text-xs text-gray-300 pt-1">
                <div className="flex items-start gap-2.5">
                  <FaMapMarkerAlt className="text-[#D4AF37] shrink-0 mt-0.5" size={13} />
                  <span className="leading-relaxed">
                    B Block - 505, Northface Grandeur Apartments, Opposite Ayyappa Swamy Temple, Gollapudi, NTR District, Andhra Pradesh - 521225
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <FaEnvelope className="text-[#D4AF37] shrink-0" size={13} />
                  <a href="mailto:support@swamydwija.org" className="hover:text-white transition-colors">support@swamydwija.org</a>
                </div>
                <div className="flex items-center gap-2.5">
                  <FaPhoneAlt className="text-[#D4AF37] shrink-0" size={12} />
                  <a href="tel:+919640275275" className="hover:text-white transition-colors">+91 9640275275 (Mon - Sat, 6 AM - 8 PM IST)</a>
                </div>
              </div>

              {/* Social Channels */}
              <div className="flex items-center gap-2.5 pt-2">
                <a href="https://www.instagram.com/swamidwijafoundation?utm_source=qr&igsi=MTI3MXdpZHhmbjkyNQ==" target="_blank" rel="noreferrer" title="Instagram" className="w-9 h-9 rounded-xl bg-gray-800/90 hover:bg-[#E1306C] text-gray-300 hover:text-white flex items-center justify-center transition-all duration-300 shadow-xs">
                  <FaInstagram size={14} />
                </a>
                <a href="https://www.facebook.com/share/193dnDH32C/" target="_blank" rel="noreferrer" title="Facebook" className="w-9 h-9 rounded-xl bg-gray-800/90 hover:bg-[#1877F2] text-gray-300 hover:text-white flex items-center justify-center transition-all duration-300 shadow-xs">
                  <FaFacebookF size={13} />
                </a>
                <a href="https://wa.me/919640275275?text=Hello%20Swamy%20Dwija%20Foundation,%20I%20would%20like%20more%20information%20about%20your%20courses." target="_blank" rel="noreferrer" title="WhatsApp" className="w-9 h-9 rounded-xl bg-gray-800/90 hover:bg-[#25D366] text-gray-300 hover:text-white flex items-center justify-center transition-all duration-300 shadow-xs">
                  <FaWhatsapp size={15} />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noreferrer" title="YouTube" className="w-9 h-9 rounded-xl bg-gray-800/90 hover:bg-[#FF0000] text-gray-300 hover:text-white flex items-center justify-center transition-all duration-300 shadow-xs">
                  <FaYoutube size={14} />
                </a>
              </div>
            </div>

            {/* Column 2: Live Programs (Fetched Dynamically from Courses API) (3 cols) */}
            <div className="lg:col-span-3 space-y-4">
              <h4 className="text-sm font-extrabold text-white tracking-wider uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
                Live Programs
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm text-gray-400 font-medium">
                {livePrograms.length > 0 ? (
                  livePrograms.slice(0, 5).map((course) => (
                    <li key={course._id}>
                      <Link 
                        to={`/courses/${course.slug || course._id}`} 
                        className="hover:text-[#D4AF37] transition-colors flex items-center gap-2 group"
                        title={course.title}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]/50 group-hover:bg-[#D4AF37] shrink-0 transition-colors"></span>
                        <span className="truncate">{course.title}</span>
                      </Link>
                    </li>
                  ))
                ) : (
                  <li>
                    <Link to="/courses" className="hover:text-[#D4AF37] transition-colors flex items-center gap-1.5">
                      Explore All Courses
                    </Link>
                  </li>
                )}
                <li className="pt-1">
                  <Link 
                    to="/courses" 
                    className="text-[#D4AF37] hover:underline text-xs font-bold inline-flex items-center gap-1"
                  >
                    <span>View All Programs</span>
                    <FaArrowRight size={10} />
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Quick Navigation (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              <h4 className="text-sm font-extrabold text-white tracking-wider uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
                Navigation
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm text-gray-400 font-medium">
                <li><Link to="/" className="hover:text-[#D4AF37] transition-colors">{t('nav_home')}</Link></li>
                <li><Link to="/about" className="hover:text-[#D4AF37] transition-colors">{t('nav_about')}</Link></li>
                <li><Link to="/courses" className="hover:text-[#D4AF37] transition-colors">{t('nav_courses')}</Link></li>
                <li><Link to="/contact" className="hover:text-[#D4AF37] transition-colors">{t('nav_contact')}</Link></li>
                <li><Link to="/admin/login" className="text-gray-500 hover:text-gray-300 transition-colors">Admin Portal</Link></li>
              </ul>
            </div>

            {/* Column 4: Legal & Accreditations (3 cols) */}
            <div className="lg:col-span-3 space-y-4">
              <h4 className="text-sm font-extrabold text-white tracking-wider uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
                Compliance & Trust
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm text-gray-400 font-medium">
                <li><Link to="/terms" className="hover:text-[#D4AF37] transition-colors">Terms & Conditions</Link></li>
                <li><Link to="/privacy" className="hover:text-[#D4AF37] transition-colors">Privacy & Data Policy</Link></li>
                <li><Link to="/refund-policy" className="hover:text-[#D4AF37] transition-colors">Refund & Cancellation Policy</Link></li>
                <li><Link to="/dashboard/certificates" className="hover:text-[#D4AF37] transition-colors flex items-center gap-1.5"><FaAward className="text-[#D4AF37]" /> Official Certificates</Link></li>
              </ul>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400 font-medium">
            <p>
              &copy; {new Date().getFullYear()} <strong className="text-white font-bold">Swamy Dwija Foundation</strong>. All rights reserved.
            </p>
            <div className="flex items-center gap-1 text-gray-400">
              <span>Nurturing body, mind & consciousness with</span>
              <FaHeart className="text-red-500 mx-1" size={11} />
              <span>worldwide.</span>
            </div>
          </div>

        </div>
      </footer>

      {isLoggedIn && <BottomNav />}
    </div>
  );
};

export default PublicLayout;
