import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaFileInvoiceDollar, FaDownload, FaCheckCircle } from 'react-icons/fa';

const PaymentHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleDownloadReceipt = (record) => {
    // In a real app, this would generate a PDF or fetch it from the backend
    const receiptContent = `
RECEIPT
====================
Course: ${record.course?.title}
Amount Paid: $${record.amountPaid}
Date: ${new Date(record.createdAt).toLocaleString()}
Status: ${record.paymentStatus.toUpperCase()}
Email: ${record.studentEmail}
Transaction ID: ${record._id}
    `;
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt_${record._id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24 md:pb-8 px-4 md:px-0">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Payment History</h1>
        <p className="text-gray-500 mt-2">View your past transactions and download receipts.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div></div>
      ) : history.length > 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm font-bold uppercase tracking-wider">
                  <th className="p-5 pl-6">Course</th>
                  <th className="p-5">Date</th>
                  <th className="p-5">Amount</th>
                  <th className="p-5">Status</th>
                  <th className="p-5 text-right pr-6">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {history.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-5 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center shrink-0">
                          <FaFileInvoiceDollar size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{record.course?.title || 'Unknown Course'}</p>
                          <p className="text-xs font-medium text-gray-500">{record.course?.category || 'General'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 text-gray-600 text-sm font-medium">
                      {new Date(record.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-5 font-bold text-gray-900">
                      ${record.amountPaid}
                    </td>
                    <td className="p-5">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-lg w-max uppercase tracking-wide">
                        <FaCheckCircle /> {record.paymentStatus}
                      </span>
                    </td>
                    <td className="p-5 pr-6 text-right">
                      <button 
                        onClick={() => handleDownloadReceipt(record)}
                        className="text-gray-500 hover:text-brand-green p-2.5 border border-gray-200 hover:border-brand-green/30 rounded-xl hover:bg-brand-green/10 transition-all shadow-sm"
                        title="Download Receipt"
                      >
                        <FaDownload />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : (
        <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm mt-4">
          <div className="w-20 h-20 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
            <FaFileInvoiceDollar />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">No transaction history</h3>
          <p className="text-gray-500 max-w-md mx-auto">You haven't made any purchases or enrolled in any courses yet.</p>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
