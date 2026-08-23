import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaWhatsapp, 
  FaInstagram, FaFacebookF, FaPaperPlane, FaCheckCircle, 
  FaClock
} from 'react-icons/fa';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';

const Contact = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const res = await axios.post(`${apiBase}/contact/submit`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        queryType: 'Contact Page Inquiry',
        message: formData.message
      });

      if (res.data.success) {
        setStatus({
          type: 'success',
          message: 'Thank you! Your message has been sent successfully. We will reply to your email shortly.'
        });
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        setStatus({
          type: 'error',
          message: res.data.message || 'Failed to send message. Please try WhatsApp or calling us directly.'
        });
      }
    } catch (err) {
      console.error('Contact form submission error:', err);
      setStatus({
        type: 'error',
        message: err.response?.data?.message || 'Could not send message right now. Please reach us via WhatsApp or Phone.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FAF7F2] pb-16 min-h-screen font-inter">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <span className="text-xs font-black tracking-widest text-[#D4AF37] uppercase bg-[#0A4F2A]/10 px-4 py-1.5 rounded-full inline-block mb-3">
            Himalayan Lineage & Vedic Sciences Academy
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-3">
            {t('contact_title')}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base max-w-xl mx-auto">
            {t('contact_subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.04)] overflow-hidden border border-gray-100">
          
          {/* Left Column: Contact & Campus Info (5 cols) */}
          <div className="lg:col-span-5 bg-[#0A4F2A] p-8 sm:p-10 md:p-12 text-white relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute top-10 right-10 w-40 h-40 bg-[#D4AF37]/20 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="relative z-10 space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">{t('contact_info')}</h2>
                <p className="text-xs text-green-100/80 leading-relaxed">
                  Connect directly with our wellness counselors, faculty gurus, and admissions department.
                </p>
              </div>
              
              <div className="space-y-6 pt-2">
                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 backdrop-blur-md shadow-xs">
                    <FaPhoneAlt size={16} className="text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-green-200 uppercase tracking-wider">{t('contact_call')}</p>
                    <a href="tel:+919640275275" className="font-bold text-sm sm:text-base text-white hover:text-[#D4AF37] transition-colors block mt-0.5">
                      +91 9640275275
                    </a>
                    <span className="text-[11px] text-green-200/80 block mt-0.5">Mon - Sat: 6:00 AM - 8:00 PM IST</span>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 backdrop-blur-md shadow-xs">
                    <FaEnvelope size={16} className="text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-green-200 uppercase tracking-wider">{t('contact_email_us')}</p>
                    <a href="mailto:support@swamydwija.org" className="font-bold text-sm sm:text-base text-white hover:text-[#D4AF37] transition-colors block mt-0.5">
                      support@swamydwija.org
                    </a>
                    <span className="text-[11px] text-green-200/80 block mt-0.5">24/7 Electronic Helpdesk Support</span>
                  </div>
                </div>
                
                {/* Location */}
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 backdrop-blur-md shadow-xs">
                    <FaMapMarkerAlt size={18} className="text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-green-200 uppercase tracking-wider">{t('contact_location_label')}</p>
                    <p className="font-medium text-xs sm:text-sm text-white/95 leading-relaxed mt-1">
                      B Block - 505, Northface Grandeur Apartments,<br />
                      Opposite Ayyappa Swamy Temple, Gollapudi,<br />
                      NTR District, Andhra Pradesh - 521225
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Channels in Contact Card */}
            <div className="relative z-10 pt-8 border-t border-white/15 mt-8 space-y-3">
              <p className="text-xs font-bold text-green-200 uppercase tracking-wider">Official Social Channels</p>
              <div className="flex items-center gap-3">
                <a 
                  href="https://www.instagram.com/swamidwijafoundation?utm_source=qr&igsi=MTI3MXdpZHhmbjkyNQ==" 
                  target="_blank" 
                  rel="noreferrer" 
                  title="Instagram"
                  className="w-10 h-10 rounded-2xl bg-white/15 hover:bg-[#E1306C] text-white flex items-center justify-center transition-all duration-300 shadow-xs hover:scale-105"
                >
                  <FaInstagram size={17} />
                </a>
                <a 
                  href="https://www.facebook.com/share/193dnDH32C/" 
                  target="_blank" 
                  rel="noreferrer" 
                  title="Facebook"
                  className="w-10 h-10 rounded-2xl bg-white/15 hover:bg-[#1877F2] text-white flex items-center justify-center transition-all duration-300 shadow-xs hover:scale-105"
                >
                  <FaFacebookF size={15} />
                </a>
                <a 
                  href="https://wa.me/919640275275?text=Hello%20Swamy%20Dwija%20Foundation,%20I%20need%20assistance%20with%20courses." 
                  target="_blank" 
                  rel="noreferrer" 
                  title="WhatsApp"
                  className="w-10 h-10 rounded-2xl bg-white/15 hover:bg-[#25D366] text-white flex items-center justify-center transition-all duration-300 shadow-xs hover:scale-105"
                >
                  <FaWhatsapp size={18} />
                </a>
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Contact Form (7 cols) */}
          <div className="lg:col-span-7 p-8 sm:p-10 md:p-12 flex flex-col justify-center">
            <div className="mb-6">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">{t('contact_send_title')}</h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Fill in your details below. Our admissions team will get back to you promptly.</p>
            </div>

            <AnimatePresence>
              {status.message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`p-4 rounded-2xl mb-6 text-xs sm:text-sm font-bold flex items-center gap-3 ${
                    status.type === 'success' 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {status.type === 'success' && <FaCheckCircle className="text-emerald-600 shrink-0 text-base" />}
                  <span>{status.message}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">{t('contact_name')} *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Rama Raju"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0A4F2A]/20 focus:border-[#0A4F2A] outline-none text-sm text-gray-900 font-medium transition-all"
                  />
                </div>
                
                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Mobile Number</label>
                  <input 
                    type="tel"
                    placeholder="e.g. 9640275275"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0A4F2A]/20 focus:border-[#0A4F2A] outline-none text-sm text-gray-900 font-medium transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">{t('contact_email_label')} *</label>
                <input 
                  type="email" 
                  required
                  placeholder="e.g. yourname@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0A4F2A]/20 focus:border-[#0A4F2A] outline-none text-sm text-gray-900 font-medium transition-all"
                />
              </div>

              {/* Message */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">{t('contact_message')} *</label>
                <textarea 
                  required 
                  rows="4"
                  placeholder="How can we assist you with your yoga or pranayama learning goals?"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0A4F2A]/20 focus:border-[#0A4F2A] outline-none text-sm text-gray-900 font-medium transition-all resize-none"
                ></textarea>
              </div>

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl bg-[#0A4F2A] hover:bg-[#07391E] text-white font-extrabold text-sm sm:text-base transition-all duration-300 shadow-lg shadow-[#0A4F2A]/25 hover:shadow-[#0A4F2A]/40 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Sending Inquiry & Emails...</span>
                  </>
                ) : (
                  <>
                    <FaPaperPlane size={14} />
                    <span>{t('contact_send_btn')}</span>
                  </>
                )}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Contact;

