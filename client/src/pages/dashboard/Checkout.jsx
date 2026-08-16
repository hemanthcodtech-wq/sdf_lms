import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaLock, FaShieldAlt, FaCreditCard, FaCheckCircle } from 'react-icons/fa';

const Checkout = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/courses/public/${id}`);
        setCourse(data.data);
      } catch (error) {
        console.error('Error fetching course for checkout:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!email) return alert('Please enter your email address to continue.');
    
    setProcessing(true);
    
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/payments/mock-checkout`, {
        courseId: id,
        email,
        amount: course.price
      });
      
      setProcessing(false);
      setSuccess(true);
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
      
    } catch (error) {
      setProcessing(false);
      alert('Payment processing failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full text-center"
        >
          <FaCheckCircle className="text-6xl text-brand-green mx-auto mb-6" />
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-500 mb-8">You are now enrolled in <strong>{course?.title}</strong>. Check your email for access instructions.</p>
          <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-green rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-400 mt-4">Redirecting to your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex items-center justify-center gap-3">
          <FaLock className="text-gray-400" />
          <h1 className="text-2xl font-bold text-gray-800">Secure Checkout</h1>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 flex flex-col md:flex-row">
          
          {/* Payment Form */}
          <div className="flex-1 p-8 md:p-12">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Information</h2>
            
            <form onSubmit={handleCheckout} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="student@example.com" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all outline-none" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Card Details <span className="text-gray-400 font-normal">(Mock Payment)</span></label>
                <div className="relative">
                  <FaCreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="4242 4242 4242 4242" className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-brand-green outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <input type="text" placeholder="MM/YY" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-brand-green outline-none" />
                  <input type="text" placeholder="CVC" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-brand-green outline-none" />
                </div>
              </div>

              <div className="pt-4">
                <button disabled={processing} type="submit" className="w-full py-4 bg-gray-900 hover:bg-brand-green text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-brand-green/30 transition-all duration-300 disabled:opacity-70 flex justify-center items-center gap-2">
                  {processing ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Processing...</> : `Pay $${course?.price}`}
                </button>
              </div>
              
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mt-6 font-medium">
                <FaShieldAlt className="text-green-500" /> Guaranteed safe & secure checkout
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="md:w-96 bg-gray-50 p-8 md:p-12 border-t md:border-t-0 md:border-l border-gray-100 flex flex-col">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
            
            <div className="flex gap-4 mb-8">
              <div className="w-24 h-16 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                {course?.thumbnailUrl ? <img src={course.thumbnailUrl} className="w-full h-full object-cover" /> : null}
              </div>
              <div>
                <h4 className="font-bold text-gray-900 line-clamp-2 leading-tight text-sm">{course?.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{course?.instructor}</p>
              </div>
            </div>

            <div className="space-y-4 mb-8 flex-1">
              <div className="flex justify-between text-gray-600">
                <span>Original Price</span>
                <span>${course?.price}</span>
              </div>
              <div className="flex justify-between text-green-600 font-medium">
                <span>Discount</span>
                <span>-$0.00</span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-900 font-bold">Total</span>
                <span className="text-3xl font-black text-gray-900">${course?.price}</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Checkout;
