import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaLock, FaShieldAlt, FaCreditCard, FaCheckCircle } from 'react-icons/fa';
import { getCourseImageUrl } from '../../utils/imageHelper';

const Checkout = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [email, setEmail] = useState(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        return JSON.parse(userStr).emailOrPhone || '';
      }
    } catch(e) {}
    return '';
  });

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

  // Helper to dynamically load Razorpay SDK reliably
  const loadRazorpaySDK = () => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') return resolve(false);
      if (window.Razorpay) return resolve(true);

      const scriptId = 'razorpay-checkout-sdk';
      let script = document.getElementById(scriptId);
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
      }

      let resolved = false;
      script.onload = () => {
        if (!resolved) {
          resolved = true;
          resolve(true);
        }
      };
      script.onerror = () => {
        if (!resolved) {
          resolved = true;
          resolve(false);
        }
      };

      let checks = 0;
      const interval = setInterval(() => {
        checks++;
        if (window.Razorpay) {
          clearInterval(interval);
          if (!resolved) {
            resolved = true;
            resolve(true);
          }
        } else if (checks > 30) {
          clearInterval(interval);
          if (!resolved) {
            resolved = true;
            resolve(false);
          }
        }
      }, 150);
    });
  };

  useEffect(() => {
    loadRazorpaySDK().catch(console.error);
  }, []);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!agreed) {
      alert('Please accept the Terms & Conditions and Refund Policy to proceed with checkout.');
      return;
    }
    setProcessing(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to continue checkout.');
        navigate('/login');
        return;
      }

      // Handle free courses directly
      if (Number(course?.price || 0) <= 0) {
        const verifyRes = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/payments/verify-payment`,
          {
            courseId: course._id,
            amountPaid: 0,
            studentEmail: email,
            isFree: true
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (verifyRes.data.success) {
          setSuccess(true);
          setTimeout(() => {
            navigate(`/dashboard/learning/${course._id}`);
          }, 2000);
        }
        return;
      }

      // 1. Create order on server
      const orderRes = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/payments/create-order`,
        { courseId: course._id, amount: course.price },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { order, key } = orderRes.data;
      const razorpayKey = key || 'rzp_live_TVzQGEkYQFMh9I';

      // 2. Ensure Razorpay SDK is ready
      const sdkReady = await loadRazorpaySDK();
      if (!window.Razorpay && !sdkReady) {
        throw new Error('Payment gateway SDK could not be loaded. Please check your connection.');
      }

      // 3. Initialize Razorpay checkout
      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Swamy Dwija Foundation',
        description: `Enrollment for ${course.title}`,
        image: '/logo.png',
        order_id: order.id,
        handler: async function (response) {
          try {
            // 4. Verify payment on server
            const verifyRes = await axios.post(
              `${import.meta.env.VITE_API_BASE_URL}/payments/verify-payment`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                courseId: course._id,
                amountPaid: course.price,
                studentEmail: email
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (verifyRes.data.success) {
              setSuccess(true);
              setTimeout(() => {
                navigate(`/dashboard/learning/${course._id}`);
              }, 2500);
            }
          } catch (verifyError) {
            console.error('Payment verification failed:', verifyError);
            alert('Payment verification failed. Please contact support.');
          } finally {
            setProcessing(false);
          }
        },
        prefill: {
          email: email,
          contact: ''
        },
        theme: {
          color: '#297838'
        },
        modal: {
          ondismiss: function() {
            setProcessing(false);
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function (response) {
        console.error('Payment failed event:', response?.error);
        alert(response?.error?.description || 'Payment was declined or cancelled.');
        setProcessing(false);
      });
      paymentObject.open();

    } catch (error) {
      console.error('Checkout error:', error);
      alert(error.response?.data?.message || error.message || 'Error initializing checkout');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-bg-cream">
        <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-bg-cream flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
            <FaCheckCircle size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">You have been enrolled into {course?.title}. Redirecting you to your schedule...</p>
          <div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin mx-auto"></div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-cream py-12 px-4 sm:px-6 lg:px-8 font-inter">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green">
            <FaLock size={16} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Secure Checkout</h1>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 flex flex-col md:flex-row">
          
          {/* Payment Form */}
          <div className="flex-1 p-8 md:p-12">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Information</h2>
            
            <form onSubmit={handleCheckout} className="space-y-6">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Registered Student Account</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="student@example.com" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all outline-none text-sm font-medium" />
              </div>

              {/* Payment Terms Agreement Checkbox */}
              <label className="flex items-start gap-2.5 text-xs text-gray-600 cursor-pointer select-none bg-gray-50/80 p-3.5 rounded-xl border border-gray-200">
                <input 
                  type="checkbox" 
                  checked={agreed} 
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 rounded border-gray-300 text-brand-green focus:ring-brand-green/20 w-4 h-4 cursor-pointer" 
                />
                <span className="leading-relaxed">
                  I have read and agree to the <Link to="/terms" target="_blank" className="text-brand-green font-bold hover:underline">Terms of Service</Link>, <Link to="/privacy" target="_blank" className="text-brand-green font-bold hover:underline">Privacy Policy</Link>, and <Link to="/refund-policy" target="_blank" className="text-brand-green font-bold hover:underline">Refund & Cancellation Policy</Link>.
                </span>
              </label>

              <div className="pt-2">
                <button disabled={processing} type="submit" className="w-full py-4 bg-brand-green hover:bg-brand-green-dark text-white text-lg font-bold rounded-xl shadow-lg shadow-brand-green/30 hover:shadow-brand-green/50 transition-all duration-300 disabled:opacity-70 flex justify-center items-center gap-3">
                  {processing ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Processing...</> : (
                    <>
                      Proceed to Pay ₹{course?.price}
                    </>
                  )}
                </button>
              </div>
              
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-4 font-medium">
                <FaShieldAlt className="text-green-600" /> 256-bit SSL encrypted • Instant course access
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="md:w-96 bg-gray-50 p-8 md:p-12 border-t md:border-t-0 md:border-l border-gray-100 flex flex-col">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
            
            <div className="flex gap-4 mb-8">
              <div className="w-24 h-16 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                {course?.thumbnailUrl ? (
                  <img
                    src={getCourseImageUrl(course.thumbnailUrl)}
                    alt={course.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { 
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/images/morning_yoga.png'; 
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-brand-green/10 flex items-center justify-center text-xs font-bold text-brand-green">SDF</div>
                )}
              </div>
              <div>
                <h4 className="font-bold text-gray-900 line-clamp-2 leading-tight text-sm">{course?.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{course?.instructor}</p>
              </div>
            </div>

            <div className="space-y-4 mb-8 flex-1">
              <div className="flex justify-between text-gray-600">
                <span>Original Price</span>
                <span>₹{course?.price}</span>
              </div>
              <div className="flex justify-between text-green-600 font-medium">
                <span>Discount</span>
                <span>-₹0.00</span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-900 font-bold">Total</span>
                <span className="text-3xl font-black text-gray-900">₹{course?.price}</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Checkout;
