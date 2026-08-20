import React from 'react';
import { Link } from 'react-router-dom';
import { FaUserShield, FaArrowLeft, FaLock, FaDatabase, FaCookieBite, FaEnvelope } from 'react-icons/fa';
import { motion } from 'framer-motion';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-[#FAF7F2] font-inter py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Back navigation */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-brand-green transition-colors"
        >
          <FaArrowLeft size={12} />
          <span>Back to Home</span>
        </Link>

        {/* Header Glass Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 backdrop-blur-2xl rounded-3xl p-8 md:p-10 border border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] relative overflow-hidden"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-green/10 text-brand-green-dark text-xs font-bold uppercase tracking-wider mb-3">
            <FaUserShield size={12} /> User Data Protection
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Privacy Policy</h1>
          <p className="text-gray-500 text-sm md:text-base mt-2">
            Last Updated: August 20, 2026 • Swamy Dwija Foundation (SDF)
          </p>

          <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-100 text-xs font-bold text-gray-600">
            <Link to="/terms" className="px-3.5 py-1.5 rounded-full bg-gray-100 hover:bg-brand-green hover:text-white transition-colors">Terms & Conditions ↗</Link>
            <Link to="/refund-policy" className="px-3.5 py-1.5 rounded-full bg-gray-100 hover:bg-brand-green hover:text-white transition-colors">Refund & Return Policy ↗</Link>
            <Link to="/contact" className="px-3.5 py-1.5 rounded-full bg-gray-100 hover:bg-brand-green hover:text-white transition-colors">Help & Contact ↗</Link>
          </div>
        </motion.div>

        {/* Content Sections */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-2xl rounded-3xl p-8 md:p-12 border border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] space-y-8 text-gray-700 leading-relaxed"
        >
          {/* 1. Commitment */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-brand-green text-white text-xs flex items-center justify-center font-black">1</span>
              Our Commitment to Your Privacy
            </h2>
            <p className="text-sm">
              Swamy Dwija Foundation respects the privacy of our students and visitors. This Privacy Policy outlines how we collect, store, utilize, and protect personal data when you interact with our platform, mobile interfaces, and live learning services.
            </p>
          </section>

          {/* 2. Information We Collect */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-brand-green text-white text-xs flex items-center justify-center font-black">2</span>
              Information We Collect
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-gray-200/60 space-y-1.5">
                <span className="font-bold text-gray-900 flex items-center gap-1.5"><FaDatabase className="text-brand-green" /> Account Information</span>
                <p className="text-gray-600">Full Name, Email Address, Mobile Phone Number, Profile Photo, and preferred language.</p>
              </div>
              <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-gray-200/60 space-y-1.5">
                <span className="font-bold text-gray-900 flex items-center gap-1.5"><FaLock className="text-brand-green" /> Payment & Billing Logs</span>
                <p className="text-gray-600">Transaction ID, payment status, amount paid, and invoice details. (Card numbers/UPI PINs are never stored by SDF).</p>
              </div>
              <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-gray-200/60 space-y-1.5">
                <span className="font-bold text-gray-900 flex items-center gap-1.5"><FaUserShield className="text-brand-green" /> Learning Activity</span>
                <p className="text-gray-600">Course enrollments, class attendance records, wishlist items, and certificate generation data.</p>
              </div>
              <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-gray-200/60 space-y-1.5">
                <span className="font-bold text-gray-900 flex items-center gap-1.5"><FaCookieBite className="text-brand-green" /> Technical & Session Data</span>
                <p className="text-gray-600">Device browser type, IP address, timezone, and authentication cookies for session persistence.</p>
              </div>
            </div>
          </section>

          {/* 3. Payment Processing Security */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-brand-green text-white text-xs flex items-center justify-center font-black">3</span>
              Payment Processing & Data Security
            </h2>
            <div className="p-4 bg-green-50/80 border border-green-200/80 rounded-2xl text-green-950 text-sm space-y-2">
              <p className="font-bold flex items-center gap-1.5">
                <FaLock className="text-green-700 shrink-0" /> 100% PCI-DSS Compliant Encryption:
              </p>
              <p className="text-xs leading-relaxed text-green-800">
                Payment transactions on Swamy Dwija Foundation are processed via certified, PCI-DSS compliant third-party payment gateways (including Razorpay / UPI / Net Banking). Sensitive payment credentials (such as CVV or banking passwords) are never transmitted to or retained on our application servers.
              </p>
            </div>
          </section>

          {/* 4. How We Use Your Information */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-brand-green text-white text-xs flex items-center justify-center font-black">4</span>
              How We Use Your Information
            </h2>
            <ul className="space-y-2 text-sm list-disc pl-5">
              <li>To provide instant dashboard access to your enrolled yoga batches and course materials.</li>
              <li>To dispatch automated class schedules, Zoom join links, and timetable reminders.</li>
              <li>To generate official digital course completion certificates and payment receipts.</li>
              <li>To provide prompt student customer support and resolve technical queries.</li>
              <li>To prevent fraudulent activity and preserve platform security.</li>
            </ul>
          </section>

          {/* 5. Data Sharing & Third Parties */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-brand-green text-white text-xs flex items-center justify-center font-black">5</span>
              Third-Party Services & Zero Data Sale Guarantee
            </h2>
            <p className="text-sm">
              We <strong>NEVER</strong> sell, rent, or trade your personal information to third-party advertisers or data brokers. We share data only with verified service providers essential to operational fulfillment:
            </p>
            <ul className="space-y-1 text-xs list-disc pl-5 text-gray-600">
              <li><strong>Zoom Video Communications</strong>: To facilitate live interactive class sessions.</li>
              <li><strong>Razorpay / Payment Partners</strong>: To verify and settle course fee transactions.</li>
              <li><strong>Google Drive & Cloud Providers</strong>: To stream on-demand recorded practice materials.</li>
            </ul>
          </section>

          {/* 6. User Rights & Account Deletion */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-brand-green text-white text-xs flex items-center justify-center font-black">6</span>
              Your Rights & Data Access
            </h2>
            <p className="text-sm">
              You have the right to inspect, update, or request the deletion of your personal account data at any time via your <strong>Dashboard Settings</strong> or by emailing <a href="mailto:support@swamydwija.org" className="text-brand-green font-semibold underline">support@swamydwija.org</a>.
            </p>
          </section>

          {/* Grievance Officer */}
          <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-50/80 p-6 rounded-2xl">
            <div>
              <h4 className="font-extrabold text-gray-900 text-sm">Privacy Grievance Officer</h4>
              <p className="text-xs text-gray-500 mt-0.5">Swamy Dwija Foundation, Telangana, India</p>
              <p className="text-xs text-brand-green font-bold mt-1">support@swamydwija.org</p>
            </div>
            <a 
              href="mailto:support@swamydwija.org"
              className="px-5 py-2.5 bg-brand-green text-white text-xs font-bold rounded-xl hover:bg-brand-green-dark transition-all shadow-xs shrink-0 flex items-center gap-2"
            >
              <FaEnvelope size={11} /> Contact Officer
            </a>
          </div>

        </motion.div>

      </div>
    </div>
  );
};

export default PrivacyPolicy;
