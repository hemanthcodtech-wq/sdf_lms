import React from 'react';
import { Link } from 'react-router-dom';
import { FaUndoAlt, FaArrowLeft, FaClock, FaCheckCircle, FaMoneyCheckAlt, FaTruck, FaEnvelope } from 'react-icons/fa';
import { motion } from 'framer-motion';

const RefundPolicy = () => {
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
            <FaUndoAlt size={12} /> Payment & Cancellation Terms
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Refund & Cancellation Policy</h1>
          <p className="text-gray-500 text-sm md:text-base mt-2">
            Last Updated: August 20, 2026 • Swamy Dwija Foundation (SDF)
          </p>

          <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-100 text-xs font-bold text-gray-600">
            <Link to="/terms" className="px-3.5 py-1.5 rounded-full bg-gray-100 hover:bg-brand-green hover:text-white transition-colors">Terms & Conditions ↗</Link>
            <Link to="/privacy" className="px-3.5 py-1.5 rounded-full bg-gray-100 hover:bg-brand-green hover:text-white transition-colors">Privacy Policy ↗</Link>
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
          {/* Quick Summary Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-[#FAF7F2] rounded-2xl border border-gray-200/60 flex flex-col justify-between">
              <div>
                <FaClock className="text-brand-green text-xl mb-2" />
                <h4 className="font-extrabold text-gray-900 text-sm">Cancellation Window</h4>
                <p className="text-xs text-gray-500 mt-1">Up to 24 hours prior to Course Session 1.</p>
              </div>
              <span className="text-brand-green font-bold text-xs mt-3">Full Refund / Batch Transfer</span>
            </div>

            <div className="p-5 bg-[#FAF7F2] rounded-2xl border border-gray-200/60 flex flex-col justify-between">
              <div>
                <FaMoneyCheckAlt className="text-brand-green text-xl mb-2" />
                <h4 className="font-extrabold text-gray-900 text-sm">Refund Timeline</h4>
                <p className="text-xs text-gray-500 mt-1">Direct credit to original payment source.</p>
              </div>
              <span className="text-brand-green font-bold text-xs mt-3">5 to 7 Working Days</span>
            </div>

            <div className="p-5 bg-[#FAF7F2] rounded-2xl border border-gray-200/60 flex flex-col justify-between">
              <div>
                <FaTruck className="text-brand-green text-xl mb-2" />
                <h4 className="font-extrabold text-gray-900 text-sm">Delivery Policy</h4>
                <p className="text-xs text-gray-500 mt-1">100% digital service & instant access.</p>
              </div>
              <span className="text-brand-green font-bold text-xs mt-3">Instant Dashboard Delivery</span>
            </div>
          </div>

          {/* 1. Digital Services & Online Courses */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-brand-green text-white text-xs flex items-center justify-center font-black">1</span>
              Nature of Digital Services & Live Batches
            </h2>
            <p className="text-sm">
              Swamy Dwija Foundation delivers online educational services, live interactive yoga training, meditation workshops, and on-demand digital learning materials. Because each batch has capped participant seating to ensure personal instructor attention, our refund and cancellation policy balances learner fairness with instructor planning.
            </p>
          </section>

          {/* 2. Cancellation Prior to Batch Start */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-brand-green text-white text-xs flex items-center justify-center font-black">2</span>
              Cancellations Before Batch Commencement
            </h2>
            <ul className="space-y-2 text-sm list-disc pl-5">
              <li><strong>Prior to 24 Hours:</strong> If you cancel your enrollment at least 24 hours before the scheduled start date/time of Session 1, you are eligible for a <strong>100% full refund</strong> or a free transfer to a future batch of your choice.</li>
              <li><strong>Within 24 Hours of Start:</strong> If cancelled within 24 hours of Session 1, a batch transfer credit will be issued to ensure you do not lose course eligibility.</li>
            </ul>
          </section>

          {/* 3. Post-Commencement Policy */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-brand-green text-white text-xs flex items-center justify-center font-black">3</span>
              Policy After Course Commencement
            </h2>
            <p className="text-sm">
              Once a course batch has commenced and session recordings or materials have been accessed, direct monetary refunds are generally not permitted. However, in cases of verified medical emergencies or genuine personal hardships, students may request:
            </p>
            <ul className="space-y-1.5 text-xs list-disc pl-5 text-gray-600">
              <li>A batch rollover credit to attend the same curriculum in the upcoming calendar month.</li>
              <li>An extended access validity period to review all recorded sessions and study guides at your own pace.</li>
            </ul>
          </section>

          {/* 4. Refund Processing Method & Timelines */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-brand-green text-white text-xs flex items-center justify-center font-black">4</span>
              Refund Processing Method & Timelines
            </h2>
            <p className="text-sm">
              Approved refunds are initiated immediately by our billing department and returned directly to the original mode of payment:
            </p>
            <ul className="space-y-1.5 text-xs list-disc pl-5 text-gray-600">
              <li><strong>UPI / Net Banking / Debit Card:</strong> Reflected in your bank account within <strong>5 to 7 business days</strong> (depending on your issuing bank's clearing cycle).</li>
              <li><strong>Credit Card:</strong> Credited within <strong>5 to 7 working days</strong>, appearing on your next monthly credit card billing statement.</li>
            </ul>
          </section>

          {/* 5. Shipping & Digital Delivery Policy */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-brand-green text-white text-xs flex items-center justify-center font-black">5</span>
              Shipping & Delivery Policy (Digital Goods)
            </h2>
            <div className="p-4 bg-blue-50/80 border border-blue-200/80 rounded-2xl text-blue-950 text-sm space-y-1.5">
              <p className="font-bold flex items-center gap-1.5 text-blue-900">
                <FaCheckCircle className="text-blue-600 shrink-0" /> Zero Shipping Charges • Instant Delivery
              </p>
              <p className="text-xs leading-relaxed text-blue-800">
                All services offered on Swamy Dwija Foundation are purely electronic/digital. No physical goods or packages are shipped. Upon successful payment verification, your course access, daily timetable, Zoom meeting credentials, and digital materials are unlocked instantaneously in your <strong>Student Dashboard</strong> (<Link to="/dashboard/learning" className="underline font-bold">My Learning</Link>) and confirmed via email.
              </p>
            </div>
          </section>

          {/* 6. How to Request a Refund or Batch Transfer */}
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-brand-green text-white text-xs flex items-center justify-center font-black">6</span>
              How to Submit a Cancellation Request
            </h2>
            <p className="text-sm">
              To request a cancellation or batch change, simply provide your <strong>Registered Email, Course Title, and Order/Invoice ID</strong> through any of the following channels:
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a 
                href="mailto:support@swamydwija.org?subject=Refund%20or%20Cancellation%20Request"
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-brand-green text-white text-xs font-bold hover:bg-brand-green-dark transition-all shadow-xs"
              >
                <FaEnvelope /> Email Support (support@swamydwija.org)
              </a>
              <Link 
                to="/dashboard/support"
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white border border-gray-200/80 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-all shadow-xs"
              >
                Submit Dashboard Ticket
              </Link>
            </div>
          </section>

        </motion.div>

      </div>
    </div>
  );
};

export default RefundPolicy;
