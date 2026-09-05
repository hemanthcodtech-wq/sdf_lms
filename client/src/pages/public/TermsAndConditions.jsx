import React from 'react';
import { Link } from 'react-router-dom';
import { FaFileContract, FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';
import { motion } from 'framer-motion';

const TermsAndConditions = () => {
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
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Terms & Conditions</h1>
          <p className="text-gray-500 text-sm md:text-base mt-2">
            Last Updated: August 20, 2026 • Swamy Dwija Foundation (SDF)
          </p>

          <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-100 text-xs font-bold text-gray-600">
            <Link to="/privacy" className="px-3.5 py-1.5 rounded-full bg-gray-100 hover:bg-brand-green hover:text-white transition-colors">Privacy Policy ↗</Link>
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
          {/* 1. Introduction */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-brand-green text-white text-xs flex items-center justify-center font-black">1</span>
              Acceptance of Terms
            </h2>
            <p className="text-sm">
              Welcome to <strong>Swamy Dwija Foundation ("SDF", "we", "us", or "our")</strong>. By accessing our website (<a href="https://swamydwija.org" className="text-brand-green font-semibold underline">swamydwija.org</a>), registering an account, or enrolling in any live yoga program, meditation course, or digital workshop, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions.
            </p>
          </section>

          {/* 2. Educational & Wellness Disclaimer */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-brand-green text-white text-xs flex items-center justify-center font-black">2</span>
              Health & Wellness Advisory Disclaimer
            </h2>
            <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-amber-900 text-sm space-y-2">
              <p className="font-bold flex items-center gap-1.5">
                <FaExclamationTriangle className="text-amber-600 shrink-0" /> Important Health Notice:
              </p>
              <p className="text-xs leading-relaxed text-amber-800">
                All yoga sessions, pranayama, asanas, and wellness guidance provided by Swamy Dwija Foundation are designed for educational and holistic well-being purposes only. They do not constitute formal medical diagnosis, treatment, or clinical prescription. Please consult your physician prior to commencing any physical exercise program if you have pre-existing medical conditions, pregnancy, or physical injuries.
              </p>
            </div>
          </section>

          {/* 3. Account Registration & Security */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-brand-green text-white text-xs flex items-center justify-center font-black">3</span>
              Learner Account & Password Security
            </h2>
            <p className="text-sm">
              To enroll in courses and access live Zoom classes, you must maintain an accurate and registered student account. You are responsible for safeguarding your login credentials. Account sharing, credential distribution, or unauthorized third-party access to live meetings is strictly prohibited.
            </p>
          </section>

          {/* 4. Course Enrollment, Fees & Payments */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-brand-green text-white text-xs flex items-center justify-center font-black">4</span>
              Course Fees, Pricing & Payment Terms
            </h2>
            <ul className="space-y-2 text-sm list-disc pl-5">
              <li>All course fees are listed in <strong>Indian National Rupees (₹ INR)</strong> unless explicitly stated otherwise.</li>
              <li>Payments are processed securely via RBI-compliant, 256-bit encrypted payment gateways (such as Razorpay, UPI, Netbanking, Debit/Credit Cards).</li>
              <li>Upon successful transaction verification, digital course access is granted immediately to your student dashboard.</li>
              <li>Swamy Dwija Foundation reserves the right to revise curriculum fees or introduce promotional discounts without retroactive price adjustments for previous enrollments.</li>
            </ul>
          </section>

          {/* 5. Access Validity & Materials */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-brand-green text-white text-xs flex items-center justify-center font-black">5</span>
              Course Access Validity & Class Timings
            </h2>
            <p className="text-sm">
              Each course specifies an access validity timeframe (e.g., <strong>1 Month or 2 Months access after course completion</strong>). During this period, students retain on-demand access to recorded video sessions, class notes, and revision materials. Access expires automatically upon conclusion of the specified validity window.
            </p>
          </section>

          {/* 6. Intellectual Property */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-brand-green text-white text-xs flex items-center justify-center font-black">6</span>
              Intellectual Property Rights
            </h2>
            <p className="text-sm">
              All proprietary video recordings, instructional curriculum, PDF guides, trademarks, and logos displayed on this platform are the intellectual property of Swamy Dwija Foundation. Unauthorized recording, downloading, commercial re-distribution, or public broadcast of session materials is strictly prohibited and subject to legal action under the Indian Copyright Act, 1957.
            </p>
          </section>

          {/* 7. Code of Conduct in Live Zoom Sessions */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-brand-green text-white text-xs flex items-center justify-center font-black">7</span>
              Live Session Code of Conduct
            </h2>
            <p className="text-sm">
              Learners are required to maintain a respectful, peaceful, and constructive environment during live interactive video calls. Disruptive behavior, harassment, vulgarity, or unsolicited advertising will result in immediate expulsion from the session and potential revocation of account privileges without refund.
            </p>
          </section>

          {/* 8. Dispute Resolution & Jurisdiction */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-brand-green text-white text-xs flex items-center justify-center font-black">8</span>
              Governing Law & Jurisdiction
            </h2>
            <p className="text-sm">
              These terms shall be governed by and construed in accordance with the laws of the Republic of India. Any disputes arising out of or in connection with these terms shall be subject to the exclusive jurisdiction of the competent courts in <strong>Telangana / Hyderabad, India</strong>.
            </p>
          </section>

          {/* Contact information */}
          <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-50/80 p-6 rounded-2xl">
            <div>
              <h4 className="font-extrabold text-gray-900 text-sm">Have Questions Regarding Our Terms?</h4>
              <p className="text-xs text-gray-500 mt-0.5">Reach out to our legal and support compliance team.</p>
            </div>
            <a 
              href="mailto:support@swamydwija.org"
              className="px-5 py-2.5 bg-brand-green text-white text-xs font-bold rounded-xl hover:bg-brand-green-dark transition-all shadow-xs shrink-0"
            >
              Contact Support
            </a>
          </div>

        </motion.div>

      </div>
    </div>
  );
};

export default TermsAndConditions;
