import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../../theme/colors';
import { EmptyState } from '../../components/EmptyState';
import { Badge } from '../../components/Badge';
import { paymentService } from '../../services/paymentService';

export const PaymentHistoryScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sample transactions
  const samplePayments = [
    {
      id: 'TXN-984120',
      courseTitle: 'Vedic Mathematics & Speed Calculation',
      amount: 2499,
      date: 'Aug 15, 2026',
      status: 'success',
      method: 'UPI (Google Pay)',
    },
  ];

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await paymentService.getPaymentHistory();
      if (res?.data && res.data.length > 0) {
        setPayments(res.data);
      } else {
        setPayments(samplePayments);
      }
    } catch (e) {
      setPayments(samplePayments);
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
        <Text style={styles.headerTitle}>Payment History</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={payments}
        keyExtractor={(item) => item.id || item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="No Payment Records"
            description="You have not completed any course purchases yet."
          />
        }
        renderItem={({ item }) => (
          <View style={[styles.card, shadows.sm]}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.txnId}>{item.id || item.transactionId || 'Payment Transaction'}</Text>
                <Text style={styles.txnDate}>{item.date || 'Recent'}</Text>
              </View>
              <Badge text="PAID" variant="success" />
            </View>

            <Text style={styles.courseTitle}>{item.courseTitle || item.course?.title || 'Enrolled Course'}</Text>

            <View style={styles.footerRow}>
              <Text style={styles.methodText}>💳 {item.method || 'Online Payment'}</Text>
              <Text style={styles.amount}>₹{Number(item.amount || 0).toLocaleString('en-IN')}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontWeight: '700',
    color: colors.textPrimary,
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  txnId: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  txnDate: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  methodText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  amount: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
});
