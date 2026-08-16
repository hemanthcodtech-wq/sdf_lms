import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Dummy submit
    alert("Message sent successfully!");
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <div className="bg-bg-cream pt-24 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold font-outfit text-gray-900 mb-4">Get In Touch</h1>
          <p className="text-gray-600 font-inter text-lg">We'd love to hear from you. Drop us a message!</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-gray-100">
          
          {/* Contact Info */}
          <div className="bg-brand-green p-10 md:p-12 text-white relative overflow-hidden">
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute top-10 right-10 w-32 h-32 bg-brand-orange/20 rounded-full blur-xl"></div>
            
            <h2 className="text-3xl font-bold font-outfit mb-8 relative z-10">Contact Information</h2>
            
            <div className="space-y-8 relative z-10">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <FaPhoneAlt size={20} />
                </div>
                <div>
                  <p className="font-outfit text-sm text-green-100">Call Us</p>
                  <p className="font-inter font-semibold">+91 98765 43210</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <FaEnvelope size={20} />
                </div>
                <div>
                  <p className="font-outfit text-sm text-green-100">Email Us</p>
                  <p className="font-inter font-semibold">contact@sdf.org</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <FaMapMarkerAlt size={20} />
                </div>
                <div>
                  <p className="font-outfit text-sm text-green-100">Location</p>
                  <p className="font-inter font-semibold">123 Wellness Avenue, Bangalore, India</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="p-10 md:p-12">
            <h3 className="text-2xl font-bold font-outfit text-gray-900 mb-6">Send us a Message</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="custom-input flex flex-col p-2 shadow-sm">
                <label className="text-[13px] font-semibold text-gray-500 ml-2 mb-1">Your Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-transparent border-none outline-none px-2 py-1 text-gray-800 font-inter"
                />
              </div>
              
              <div className="custom-input flex flex-col p-2 shadow-sm">
                <label className="text-[13px] font-semibold text-gray-500 ml-2 mb-1">Your Email</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-transparent border-none outline-none px-2 py-1 text-gray-800 font-inter"
                />
              </div>

              <div className="custom-input flex flex-col p-2 shadow-sm">
                <label className="text-[13px] font-semibold text-gray-500 ml-2 mb-1">Message</label>
                <textarea 
                  required
                  rows="4"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full bg-transparent border-none outline-none px-2 py-1 text-gray-800 font-inter resize-none"
                ></textarea>
              </div>

              <button 
                type="submit"
                className="w-full py-4 rounded-xl bg-brand-green text-white font-bold font-outfit text-lg hover:bg-brand-green-dark transition-all shadow-[0_4px_14px_0_rgba(13,92,49,0.39)] hover:shadow-[0_6px_20px_rgba(13,92,49,0.23)] hover:-translate-y-0.5"
              >
                Send Message
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Contact;
