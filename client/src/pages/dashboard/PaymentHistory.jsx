import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFileInvoiceDollar, FaDownload, FaCheckCircle, FaArrowLeft, FaTimes, FaPrint } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const PaymentHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/payments/history`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        setHistory(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching payment history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async (record) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/payments/invoice/${record._id}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${record.invoiceNumber || record._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error('Direct PDF download fallback to preview:', e);
      setSelectedReceipt(record);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24 md:pb-8 px-4 md:px-0 font-inter">
      
      {/* Mobile Header */}
      <div className="flex items-center mb-6 mt-2 md:hidden">
        <button onClick={() => navigate(-1)} className="mr-4 text-brand-green-dark">
          <FaArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold text-brand-green-dark">Payment History</h1>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block mb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Payment History</h1>
        <p className="text-gray-500 mt-1 text-base">View your transactions, invoices, and download receipts.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : history.length > 0 ? (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider">
                  <th className="p-5 pl-6">Course / Description</th>
                  <th className="p-5">Date</th>
                  <th className="p-5">Amount Paid</th>
                  <th className="p-5">Payment Status</th>
                  <th className="p-5 text-right pr-6">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="p-5 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center shrink-0">
                          <FaFileInvoiceDollar size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm md:text-base">{record.course?.title || 'Course Enrollment'}</p>
                          <p className="text-xs font-medium text-gray-500">{record.course?.category || 'Wellness'} • {record.course?.accessValidity || '2 Months'} Access</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 text-gray-600 text-sm font-medium">
                      {new Date(record.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-5 font-extrabold text-gray-900 text-base">
                      ₹{record.amountPaid}
                    </td>
                    <td className="p-5">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-100/80 px-3 py-1 rounded-full w-max uppercase tracking-wide">
                        <FaCheckCircle size={11} /> {record.paymentStatus || 'Completed'}
                      </span>
                    </td>
                    <td className="p-5 pr-6 text-right">
                      <button 
                        onClick={() => handleDownloadReceipt(record)}
                        className="px-3.5 py-2 bg-brand-green/10 hover:bg-brand-green hover:text-white text-brand-green-dark font-bold text-xs rounded-xl transition-all inline-flex items-center gap-1.5"
                      >
                        <FaDownload size={11} /> View Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : (
        <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm mt-4 p-8">
          <div className="w-20 h-20 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center text-3xl mx-auto mb-5">
            <FaFileInvoiceDollar />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">No transaction history</h3>
          <p className="text-gray-500 max-w-md mx-auto text-sm">You haven't made any course purchases yet. Enrolled courses and receipts will appear here.</p>
        </div>
      )}

      {/* Invoice / Receipt Modal */}
      <AnimatePresence>
        {selectedReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100"
            >
              {/* Modal Top Bar */}
              <div className="bg-brand-green-dark p-6 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <img src="/logo.png" alt="SDF Logo" className="h-10 w-auto bg-white/10 p-1.5 rounded-lg" />
                  <div>
                    <h3 className="font-extrabold text-base leading-tight">Swamy Dwija Foundation</h3>
                    <p className="text-xs text-brand-green-light/80">Official Payment Receipt</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  <FaTimes size={14} />
                </button>
              </div>

              {/* Receipt Content */}
              <div className="p-6 md:p-8 space-y-6 text-gray-800">
                <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                  <div>
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Receipt Number</span>
                    <span className="font-mono text-sm font-bold text-gray-800">SDF-INV-{selectedReceipt._id.slice(-6).toUpperCase()}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Date Paid</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {new Date(selectedReceipt.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Student Account:</span>
                    <span className="font-semibold text-gray-900">{selectedReceipt.studentEmail}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Course Enrolled:</span>
                    <span className="font-bold text-brand-green-dark text-right max-w-xs">{selectedReceipt.course?.title}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Course Duration / Access:</span>
                    <span className="font-semibold text-gray-800">1 Month • {selectedReceipt.course?.accessValidity || '2 Months'} Validity</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Payment Status:</span>
                    <span className="font-bold text-green-700 uppercase">{selectedReceipt.paymentStatus || 'Completed'}</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-gray-500 block font-medium">Total Amount Paid</span>
                    <span className="text-xs text-gray-400">(Inclusive of all applicable taxes)</span>
                  </div>
                  <span className="text-2xl font-black text-gray-900">₹{selectedReceipt.amountPaid}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handlePrint}
                    className="flex-1 py-3 bg-brand-green hover:bg-brand-green-dark text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-md"
                  >
                    <FaPrint size={14} /> Print / Save PDF
                  </button>
                  <button
                    onClick={() => setSelectedReceipt(null)}
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaymentHistory;

