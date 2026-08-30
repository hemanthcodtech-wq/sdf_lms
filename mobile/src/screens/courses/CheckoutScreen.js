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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../../theme/colors';
import { CustomButton } from '../../components/CustomButton';
import { useAuth } from '../../context/AuthContext';
import { paymentService } from '../../services/paymentService';
import { getCourseImageUrl } from '../../utils/imageHelper';

export const CheckoutScreen = ({ route, navigation }) => {
  const { course } = route.params;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi', 'card', 'netbanking'
  const [loading, setLoading] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(true);

  const price = Number(course?.price || 0);
  const gst = Math.round(price * 0.18);
  const total = price + gst;

  // Load official Razorpay Checkout SDK dynamically on Web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const scriptId = 'razorpay-checkout-sdk';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, []);

  const handlePay = async () => {
    if (!termsAgreed) {
      Alert.alert('Terms & Conditions', 'Please accept the terms to proceed with payment.');
      return;
    }

    try {
      setLoading(true);

      // 1. Create real order on backend
      const orderRes = await paymentService.createOrder(course._id, total);

      if (!orderRes.success || !orderRes.order) {
        throw new Error(orderRes.message || 'Failed to initialize payment gateway');
      }

      const { order, key } = orderRes;

      // 2. Open official Razorpay Checkout modal on Web
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.Razorpay) {
        const options = {
          key: key || 'rzp_test_TRw3GVdqXu1bwb',
          amount: order.amount,
          currency: order.currency || 'INR',
          name: 'Swamy Dwija Foundation',
          description: `Enrollment for ${course.title}`,
          image: '/logo.png',
          order_id: order.id,
          prefill: {
            name: user?.name || '',
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
                if (Platform.OS === 'web' && typeof window !== 'undefined') {
                  window.alert(`🎉 Payment Successful!\n\nYou are now enrolled into ${course.title}.`);
                  navigation.replace('StudentClasses', { course });
                } else {
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
          Alert.alert('Payment Failed', response?.error?.description || 'Transaction was declined.');
          setLoading(false);
        });
        rzp.open();
        return;
      }

      // Fallback if Razorpay object is still loading
      Alert.alert(
        'Connecting Payment Gateway',
        'Razorpay checkout is preparing. Please tap Pay again in a moment.'
      );
    } catch (error) {
      console.error('Payment launch error:', error);
      Alert.alert(
        'Payment Gateway Notice',
        error?.response?.data?.message || error.message || 'Could not launch payment gateway. Please check your connection.'
      );
    } finally {
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
});
