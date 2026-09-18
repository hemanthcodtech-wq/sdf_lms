import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaFileContract, FaCheckCircle } from 'react-icons/fa';
import axios from 'axios';

const formatPolicyText = (rawText) => {
  if (!rawText) return '';
  return rawText
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^(\s*)\*\s+/gm, '$1• ')
    .replace(/^#+\s*/gm, '')
    .trim();
};

export const TermsModal = ({ isOpen, onClose, onAccept, role = 'user' }) => {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');

  const getTitle = () => {
    if (role === 'instructor') return 'Instructor Terms & Conditions';
    if (role === 'moderator') return 'Moderator Terms & Conditions';
    return 'Terms & Conditions';
  };

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/settings/policies`)
        .then((res) => {
          if (res.data.success && res.data.data) {
            let text = '';
            if (role === 'instructor') {
              text = res.data.data.instructorTerms || res.data.data.termsAndConditions || '';
            } else if (role === 'moderator') {
              text = res.data.data.moderatorTerms || res.data.data.termsAndConditions || '';
            } else {
              text = res.data.data.termsAndConditions || '';
            }
            setContent(formatPolicyText(text));
          }
        })
        .catch((err) => {
          console.error('Error loading policies:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, role]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl p-6 lg:p-8 max-w-2xl w-full shadow-2xl border border-gray-100 max-h-[88vh] flex flex-col"
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-brand-green">
                  <FaFileContract size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900">{getTitle()}</h2>
                  <p className="text-xs text-gray-500 font-medium">Swamy Dwija Foundation</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <FaTimes size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 pr-1 my-2 text-xs md:text-sm text-gray-700 leading-relaxed space-y-3 whitespace-pre-line font-sans">
              {loading ? (
                <div className="py-16 text-center text-gray-400">
                  <div className="w-8 h-8 border-3 border-brand-green border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="font-bold text-xs">Loading Terms & Conditions...</p>
                </div>
              ) : (
                <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100">
                  {content || 'Terms and Conditions are currently unavailable.'}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
              {onAccept && (
                <button
                  type="button"
                  onClick={() => {
                    onAccept();
                    onClose();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <FaCheckCircle />
                  <span>I Agree & Accept</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
