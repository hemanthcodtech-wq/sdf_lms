import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaWhatsapp, FaEnvelope, FaPhoneAlt, FaChevronDown, FaPaperPlane, FaCheckCircle, FaQuestionCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const HelpSupport = () => {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', queryType: 'General', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const faqs = [
    {
      q: "How do I join my live daily Zoom classes?",
      a: "Go to 'My Enrollments' in your dashboard or click 'Learning' from the bottom menu. Select your active course, and on each class day you will see an active 'Join Live Class' button with the Zoom link, Meeting ID, and Passcode."
    },
    {
      q: "What if I miss a live class session?",
      a: "Don't worry! After each class finishes, our instructors upload the session recording and class practice notes to 'View Materials' inside your course dashboard so you can practice anytime."
    },
    {
      q: "How long is my course access valid after completion?",
      a: "Course access validity varies by program (typically 1 to 2 months after completion or lifetime access as specified on the course enrollment page). You can practice all uploaded materials during this entire validity period."
    },
    {
      q: "Will I receive a course completion certificate?",
      a: "Yes! Upon successfully completing your 1-month live course attendance and practice, an official verified certificate from Swamy Dwija Foundation will be generated in your 'Certificates' tab."
    },
    {
      q: "How do I download my payment invoice / receipt?",
      a: "Visit 'Payment History' from your Profile menu. You can view full transaction records and download an official PDF receipt for each course purchase."
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      await axios.post(`${apiBase}/contact/submit`, {
        name: formData.name,
        email: formData.email,
        queryType: formData.queryType,
        message: formData.message
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setFormData({ name: '', email: '', queryType: 'General', message: '' });
      }, 5000);
    } catch (err) {
      console.error('Help support form submit error:', err);
      alert('Could not submit message. Please contact support via WhatsApp or Email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24 md:pb-12 px-4 md:px-0 font-inter">
      
      {/* Mobile Header */}
      <div className="flex items-center mb-6 mt-2 md:hidden">
        <button onClick={() => navigate(-1)} className="mr-4 text-brand-green-dark">
          <FaArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold text-brand-green-dark">Help & Support</h1>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block mb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Help & Support</h1>
        <p className="text-gray-500 mt-1 text-base">We are here to assist you with your classes, payments, and learning experience.</p>
      </div>

      {/* Quick Contact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* WhatsApp Support */}
        <a
          href="https://wa.me/919640275275?text=Hello%20Swamy%20Dwija%20Foundation,%20I%20need%20assistance%20with%20my%20classes."
          target="_blank"
          rel="noreferrer"
          className="bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 p-6 rounded-3xl flex flex-col items-center text-center transition-all group shadow-sm"
        >
          <div className="w-14 h-14 bg-[#25D366] text-white rounded-2xl flex items-center justify-center text-2xl mb-3 shadow-md group-hover:scale-110 transition-transform">
            <FaWhatsapp />
          </div>
          <h3 className="font-bold text-gray-900 text-base">WhatsApp Support</h3>
          <p className="text-xs text-gray-500 mt-1">Instant chat with student support</p>
          <span className="mt-3 text-xs font-bold text-[#1e9e4d] bg-white px-3 py-1 rounded-full shadow-xs">Chat Now &rarr;</span>
        </a>

        {/* Email Support */}
        <a
          href="mailto:support@swamydwija.org"
          className="bg-brand-green/10 hover:bg-brand-green/20 border border-brand-green/30 p-6 rounded-3xl flex flex-col items-center text-center transition-all group shadow-sm"
        >
          <div className="w-14 h-14 bg-brand-green text-white rounded-2xl flex items-center justify-center text-2xl mb-3 shadow-md group-hover:scale-110 transition-transform">
            <FaEnvelope />
          </div>
          <h3 className="font-bold text-gray-900 text-base">Email Support</h3>
          <p className="text-xs text-gray-500 mt-1">support@swamydwija.org</p>
          <span className="mt-3 text-xs font-bold text-brand-green bg-white px-3 py-1 rounded-full shadow-xs">Send Email &rarr;</span>
        </a>

        {/* Helpline Support */}
        <a
          href="tel:+919640275275"
          className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 p-6 rounded-3xl flex flex-col items-center text-center shadow-sm transition-all block"
        >
          <div className="w-14 h-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center text-2xl mb-3 shadow-md mx-auto">
            <FaPhoneAlt />
          </div>
          <h3 className="font-bold text-gray-900 text-base">Helpline Hours</h3>
          <p className="text-xs text-gray-500 mt-1">Mon - Sat: 6:00 AM - 8:00 PM</p>
          <span className="mt-3 text-xs font-bold text-amber-700 bg-white px-3 py-1 rounded-full shadow-xs inline-block">+91 9640275275</span>
        </a>
      </div>

      {/* Main Grid: FAQs & Ticket Form */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Left Column: FAQs (3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <FaQuestionCircle className="text-brand-green text-xl" />
            <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div key={index} className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-xs">
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full px-5 py-4 text-left font-bold text-gray-800 flex justify-between items-center gap-4 hover:bg-gray-50/70 transition-colors"
                  >
                    <span className="text-sm md:text-base">{faq.q}</span>
                    <FaChevronDown className={`text-gray-400 text-xs transition-transform duration-300 ${isOpen ? 'rotate-180 text-brand-green' : ''}`} />
                  </button>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Contact Form (2 Cols) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 md:p-8 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-1">Send us a Message</h3>
            <p className="text-xs text-gray-500 mb-6">Our support team will reply within 24 hours.</p>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 bg-green-50 border border-green-200 rounded-2xl text-center text-green-800 space-y-2"
              >
                <FaCheckCircle className="text-3xl text-green-600 mx-auto" />
                <h4 className="font-bold text-base">Message Sent Successfully!</h4>
                <p className="text-xs text-green-700">Thank you for reaching out. We will get back to you shortly.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Anjali Sharma"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-brand-green outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email or Phone</label>
                  <input
                    type="text"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="anjali@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-brand-green outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Query Topic</label>
                  <select
                    value={formData.queryType}
                    onChange={(e) => setFormData({ ...formData, queryType: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-brand-green outline-none text-sm cursor-pointer"
                  >
                    <option value="General">General Inquiry</option>
                    <option value="Classes">Live Zoom Classes & Schedule</option>
                    <option value="Payment">Payment & Invoices</option>
                    <option value="Certificates">Certificates</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Message</label>
                  <textarea
                    required
                    rows="4"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe how we can help you..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-brand-green outline-none text-sm resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-brand-green hover:bg-brand-green-dark text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-[0_4px_12px_rgba(41,120,56,0.3)]"
                >
                  <FaPaperPlane size={13} /> Submit Message
                </button>
              </form>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default HelpSupport;
