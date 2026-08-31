import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../../theme/colors';
import { CustomButton } from '../../components/CustomButton';
import { useAuth } from '../../context/AuthContext';
import { paymentService } from '../../services/paymentService';
import { getCourseImageUrl } from '../../utils/imageHelper';

// Conditionally load react-native-webview on native platforms
let WebView = null;
if (Platform.OS !== 'web') {
  try {
    WebView = require('react-native-webview').WebView;
  } catch (e) {
    console.warn('WebView load warning:', e);
  }
}

// Dynamic bulletproof Razorpay Checkout SDK loader for Web
const loadRazorpaySDK = () => {
  return new Promise((resolve) => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof document === 'undefined') {
      return resolve(false);
    }
    if (window.Razorpay) {
      return resolve(true);
    }

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

export const CheckoutScreen = ({ route, navigation }) => {
  const { course } = route.params;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi', 'card', 'netbanking'
  const [loading, setLoading] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(true);

  // In-App native modal payment state
  const [nativePaymentVisible, setNativePaymentVisible] = useState(false);
  const [nativePaymentData, setNativePaymentData] = useState(null);

  const price = Number(course?.price || 0);
  const gst = Math.round(price * 0.18);
  const total = price + gst;

  // Preload Razorpay Checkout SDK on Web mount
  useEffect(() => {
    loadRazorpaySDK().catch((err) => console.log('SDK pre-load notice:', err));
  }, []);

  const handlePay = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to complete your enrollment.', [
        { text: 'Login', onPress: () => navigation.navigate('Auth') },
      ]);
      return;
    }

    if (!termsAgreed) {
      Alert.alert('Terms & Conditions', 'Please accept the terms to proceed with payment.');
      return;
    }

    try {
      setLoading(true);

      // Handle Free Courses directly without payment gateway
      if (total <= 0) {
        const verifyRes = await paymentService.verifyPayment({
          courseId: course._id,
          amountPaid: 0,
          studentEmail: user?.email || user?.emailOrPhone,
          isFree: true,
        });

        if (verifyRes.success) {
          Alert.alert(
            'Enrollment Successful! 🎉',
            `You have been enrolled into ${course.title}.`,
            [
              {
                text: 'Go to Class',
                onPress: () => navigation.replace('StudentClasses', { course }),
              },
            ]
          );
        }
        return;
      }

      // 1. Create real order on backend
      const orderRes = await paymentService.createOrder(course._id, total);

      if (!orderRes.success || !orderRes.order) {
        throw new Error(orderRes.message || 'Failed to initialize payment gateway');
      }

      const { order, key } = orderRes;
      const razorpayKey = key || 'rzp_live_TVzQGEkYQFMh9I';

      // 2A. On Web Platform - Open standard in-page Razorpay Checkout
      if (Platform.OS === 'web') {
        const isSdkLoaded = await loadRazorpaySDK();
        if (typeof window !== 'undefined' && (window.Razorpay || isSdkLoaded)) {
          const options = {
            key: razorpayKey,
            amount: order.amount,
            currency: order.currency || 'INR',
            name: 'Swamy Dwija Foundation',
            description: `Enrollment for ${course.title}`,
            image: '/logo.png',
            order_id: order.id,
            prefill: {
              name: user?.name || user?.firstName || 'Student',
              email: user?.email || user?.emailOrPhone || '',
              contact: user?.phone || '',
            },
            theme: {
              color: '#0d5c31',
            },
            handler: async function (response) {
              try {
                setLoading(true);
                const verifyRes = await paymentService.verifyPayment({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  courseId: course._id,
                  amountPaid: total,
                  studentEmail: user?.email || user?.emailOrPhone,
                });

                if (verifyRes.success) {
                  if (typeof window !== 'undefined') {
                    window.alert(`🎉 Payment Successful!\n\nYou are now enrolled into ${course.title}.`);
                  }
                  navigation.replace('StudentClasses', { course });
                }
              } catch (vErr) {
                console.error('Payment verification error:', vErr);
                Alert.alert('Verification Error', 'Payment was completed but verification failed. Please contact support.');
              } finally {
                setLoading(false);
              }
            },
            modal: {
              ondismiss: function () {
                setLoading(false);
              },
            },
          };

          const rzp = new window.Razorpay(options);
          rzp.on('payment.failed', function (response) {
            console.error('Payment failed event:', response?.error);
            Alert.alert(
              'Payment Failed',
              response?.error?.description || response?.error?.reason || 'Transaction was declined.'
            );
            setLoading(false);
          });
          rzp.open();
          return;
        }
      }

      // 2B. On Native Mobile (Android APK / iOS) - Open 100% In-App Razorpay Checkout Modal
      if (Platform.OS !== 'web') {
        setNativePaymentData({ order, key: razorpayKey });
        setNativePaymentVisible(true);
        return;
      }

      Alert.alert(
        'Payment Gateway Notice',
        'Payment gateway could not be loaded directly. Please verify your internet connection and retry.'
      );
    } catch (error) {
      console.error('Payment launch error:', error);
      Alert.alert(
        'Payment Gateway Error',
        error?.response?.data?.message || error.message || 'Could not launch payment gateway. Please check your connection.'
      );
    } finally {
      if (Platform.OS === 'web') {
        setLoading(false);
      }
    }
  };

  // Generate In-App Razorpay HTML for native WebView with high performance & cross-origin iframe support
  const generateRazorpayHtml = (data) => {
    if (!data) return '';
    const { order, key } = data;
    const studentName = (user?.name || user?.firstName || 'Student').replace(/["\\]/g, '');
    const studentEmail = (user?.email || user?.emailOrPhone || '').replace(/["\\]/g, '');
    const studentPhone = (user?.phone || '').replace(/["\\]/g, '');
    const courseTitle = (course?.title || 'Course Enrollment').replace(/["\\]/g, '');

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <title>Razorpay Secure Checkout</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            html, body {
              width: 100%;
              height: 100%;
              background-color: #ffffff;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              overflow: hidden;
            }
            .loader-container {
              position: fixed;
              inset: 0;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              background-color: #ffffff;
              z-index: 10;
              transition: opacity 0.2s ease;
            }
            .spinner {
              width: 48px;
              height: 48px;
              border: 4px solid rgba(13, 92, 49, 0.15);
              border-top-color: #0d5c31;
              border-radius: 50%;
              animation: spin 0.8s linear infinite;
              margin-bottom: 16px;
            }
            .title {
              font-size: 16px;
              font-weight: 700;
              color: #0f172a;
              margin-bottom: 6px;
            }
            .subtitle {
              font-size: 13px;
              color: #64748b;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
          <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        </head>
        <body>
          <div id="loader" class="loader-container">
            <div class="spinner"></div>
            <div class="title">Connecting to Razorpay...</div>
            <div class="subtitle">Swamy Dwija Foundation Secure Checkout</div>
          </div>

          <script>
            window.onerror = function(msg, url, line) {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'PAYMENT_ERROR',
                  message: msg
                }));
              }
            };

            function launchRazorpay() {
              try {
                if (!window.Razorpay) {
                  setTimeout(launchRazorpay, 100);
                  return;
                }

                var options = {
                  key: "${key}",
                  amount: ${order.amount},
                  currency: "${order.currency || 'INR'}",
                  name: "Swamy Dwija Foundation",
                  description: "${courseTitle}",
                  image: "https://swamidwijafoundation.com/logo.png",
                  order_id: "${order.id}",
                  prefill: {
                    name: "${studentName}",
                    email: "${studentEmail}",
                    contact: "${studentPhone}"
                  },
                  theme: {
                    color: "#0d5c31"
                  },
                  handler: function (response) {
                    if (window.ReactNativeWebView) {
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'PAYMENT_SUCCESS',
                        response: response
                      }));
                    }
                  },
                  modal: {
                    ondismiss: function () {
                      if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                          type: 'PAYMENT_CANCELLED'
                        }));
                      }
                    }
                  }
                };

                var rzp = new window.Razorpay(options);
                rzp.on('payment.failed', function (response) {
                  if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'PAYMENT_FAILED',
                      error: response.error
                    }));
                  }
                });

                // Hide our loader when Razorpay initiates
                var loader = document.getElementById('loader');
                if (loader) loader.style.display = 'none';

                rzp.open();
              } catch (err) {
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'PAYMENT_ERROR',
                    message: err.message || 'Razorpay initialization failed'
                  }));
                }
              }
            }

            if (document.readyState === 'complete' || document.readyState === 'interactive') {
              launchRazorpay();
            } else {
              document.addEventListener('DOMContentLoaded', launchRazorpay);
              window.onload = launchRazorpay;
            }
          </script>
        </body>
      </html>
    `;
  };

  // Handle messages from In-App native WebView checkout
  const handleWebViewMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'PAYMENT_SUCCESS') {
        setNativePaymentVisible(false);
        setLoading(true);
        const verifyRes = await paymentService.verifyPayment({
          razorpay_order_id: data.response.razorpay_order_id,
          razorpay_payment_id: data.response.razorpay_payment_id,
          razorpay_signature: data.response.razorpay_signature,
          courseId: course._id,
          amountPaid: total,
          studentEmail: user?.email || user?.emailOrPhone,
        });

        if (verifyRes.success) {
          Alert.alert(
            'Payment Successful! 🎉',
            `Congratulations! You have been enrolled into ${course.title}.`,
            [
              {
                text: 'Go to Class',
                onPress: () => navigation.replace('StudentClasses', { course }),
              },
            ]
          );
        }
      } else if (data.type === 'PAYMENT_CANCELLED') {
        setNativePaymentVisible(false);
        setLoading(false);
      } else if (data.type === 'PAYMENT_FAILED') {
        setNativePaymentVisible(false);
        setLoading(false);
        Alert.alert(
          'Payment Failed',
          data.error?.description || data.error?.reason || 'Transaction was declined.'
        );
      } else if (data.type === 'PAYMENT_ERROR') {
        setNativePaymentVisible(false);
        setLoading(false);
        Alert.alert('Payment Notice', data.message || 'Payment window closed.');
      }
    } catch (err) {
      console.error('WebView message parsing error:', err);
      setNativePaymentVisible(false);
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout & Payment</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Course Summary Card */}
        <View style={[styles.card, shadows.sm]}>
          <View style={styles.courseRow}>
            {course.thumbnailUrl ? (
              <Image source={{ uri: getCourseImageUrl(course.thumbnailUrl) }} style={styles.courseThumb} />
            ) : (
              <View style={[styles.courseThumb, styles.courseThumbFallback]}>
                <Ionicons name="book" size={24} color={colors.primary} />
              </View>
            )}
            <View style={styles.courseInfo}>
              <Text style={styles.courseCategory}>{course.category || 'Vedic Science'}</Text>
              <Text style={styles.courseTitle} numberOfLines={2}>
                {course.title}
              </Text>
              <Text style={styles.instructorText}>By {course.instructor || 'Swamy Dwija Foundation'}</Text>
            </View>
          </View>
        </View>

        {/* Razorpay Environment Badge */}
        <View style={styles.gatewayBadge}>
          <View style={styles.gatewayBadgeHeader}>
            <Ionicons name="shield-checkmark" size={18} color="#0d5c31" />
            <Text style={styles.gatewayBadgeTitle}>Official Razorpay Secure Checkout</Text>
          </View>
          <Text style={styles.gatewayBadgeSub}>
            Supports Google Pay, PhonePe, UPI Apps, QR Code, Credit/Debit Cards, NetBanking & Wallets.
          </Text>
        </View>

        {/* Student Profile Info */}
        <View style={[styles.card, shadows.sm]}>
          <Text style={styles.sectionTitle}>Billing Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Learner Name</Text>
            <Text style={styles.detailValue}>{user?.name || 'Student'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email / Account</Text>
            <Text style={styles.detailValue}>{user?.email || user?.emailOrPhone || 'student@sdflms.org'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Access Validity</Text>
            <Text style={styles.detailValue}>{course.accessValidity || 'Lifetime / 2 Months'}</Text>
          </View>
        </View>

        {/* Price Breakdown Card */}
        <View style={[styles.card, shadows.sm]}>
          <Text style={styles.sectionTitle}>Price Breakdown</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Course Fee</Text>
            <Text style={styles.priceValue}>₹{price}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>GST (18% Included)</Text>
            <Text style={styles.priceValue}>₹{gst}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalAmount}>₹{total}</Text>
          </View>
        </View>

        {/* Terms & Conditions Agreement */}
        <TouchableOpacity
          style={styles.termsRow}
          onPress={() => setTermsAgreed(!termsAgreed)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={termsAgreed ? 'checkbox' : 'square-outline'}
            size={22}
            color={termsAgreed ? colors.primary : colors.textMuted}
          />
          <Text style={styles.termsText}>
            I accept the <Text style={{ color: colors.primary, fontWeight: '700' }}>Terms of Service</Text> and{' '}
            <Text style={{ color: colors.primary, fontWeight: '700' }}>Refund Policy</Text>.
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Sticky Payment Action Bar */}
      <View style={[styles.bottomBar, shadows.lg, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.bottomBarInfo}>
          <Text style={styles.bottomTotalLabel}>Total Amount</Text>
          <Text style={styles.bottomTotalValue}>₹{total}</Text>
        </View>
        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={handlePay}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <View style={styles.payBtnContent}>
              <Ionicons name="lock-closed" size={16} color="#ffffff" />
              <Text style={styles.payButtonText}>Pay ₹{total} via Razorpay</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* 100% In-App Razorpay Checkout Native Modal */}
      {Platform.OS !== 'web' && WebView && (
        <Modal
          visible={nativePaymentVisible}
          animationType="slide"
          onRequestClose={() => {
            setNativePaymentVisible(false);
            setLoading(false);
          }}
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalHeader, { paddingTop: insets.top + 8 }]}>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => {
                  setNativePaymentVisible(false);
                  setLoading(false);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle}>Razorpay Secure Payment</Text>
              <View style={{ width: 40 }} />
            </View>
            {nativePaymentData && (
              <WebView
                source={{
                  html: generateRazorpayHtml(nativePaymentData),
                  baseUrl: 'https://swamidwijafoundation.com',
                }}
                onMessage={handleWebViewMessage}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                originWhitelist={['*']}
                mixedContentMode="always"
                thirdPartyCookiesEnabled={true}
                sharedCookiesEnabled={true}
                allowFileAccess={true}
                allowUniversalAccessFromFileURLs={true}
                setSupportMultipleWindows={false}
                javaScriptCanOpenWindowsAutomatically={true}
                userAgent="Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
                startInLoadingState={false}
                style={{ flex: 1, backgroundColor: '#ffffff' }}
              />
            )}
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  courseRow: {
    flexDirection: 'row',
    gap: 12,
  },
  courseThumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  courseThumbFallback: {
    backgroundColor: 'rgba(13, 92, 49, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  courseCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: 4,
  },
  instructorText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  gatewayBadge: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  gatewayBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gatewayBadgeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0d5c31',
  },
  gatewayBadgeSub: {
    fontSize: 11,
    color: '#065f46',
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  priceLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  priceValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  bottomBarInfo: {
    justifyContent: 'center',
  },
  bottomTotalLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  bottomTotalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  payButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    minWidth: 190,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
