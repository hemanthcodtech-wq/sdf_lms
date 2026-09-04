import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, shadows } from '../../theme/colors';
import { EmptyState } from '../../components/EmptyState';
import { Badge } from '../../components/Badge';
import { InAppPdfViewerModal } from '../../components/InAppPdfViewerModal';
import { downloadFileToDeviceStorage, shareFile } from '../../utils/fileDownloader';
import { paymentService } from '../../services/paymentService';
import { API_BASE_URL } from '../../services/api';

export const PaymentHistoryScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [viewingReceipt, setViewingReceipt] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await paymentService.getPaymentHistory();
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        setPayments(res.data);
      } else {
        setPayments([]);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
      setPayments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPayments();
  };

  const getInvoiceDownloadUrl = async (enrollmentId) => {
    const token = await AsyncStorage.getItem('token');
    return `${API_BASE_URL}/payments/invoice/${enrollmentId}/download?token=${token || ''}`;
  };

  const handleViewInvoice = async (item) => {
    if (!item) return;
    const enrollmentId = item._id || item.id;
    const invNumber = item.invoiceNumber || (item._id ? `INV-${String(item._id).slice(-6).toUpperCase()}` : 'RECEIPT');
    const downloadUrl = await getInvoiceDownloadUrl(enrollmentId);

    setViewingReceipt({
      title: 'Payment Receipt',
      documentId: invNumber,
      pdfUrl: item.invoiceUrl || downloadUrl,
      downloadUrl,
      fileName: `Invoice-${invNumber}.pdf`,
    });
  };

  const handleDownloadInvoice = async (item) => {
    if (!item) return;
    const enrollmentId = item._id || item.id;
    const invNumber = item.invoiceNumber || (item._id ? `INV-${String(item._id).slice(-6).toUpperCase()}` : 'RECEIPT');
    setDownloadingId(enrollmentId);

    try {
      const fileName = `Invoice-${invNumber}.pdf`;
      const downloadUrl = await getInvoiceDownloadUrl(enrollmentId);

      await downloadFileToDeviceStorage(downloadUrl, fileName, 'application/pdf');
    } catch (err) {
      console.error('Download invoice error:', err);
      Alert.alert('Notice', 'Unable to download invoice receipt right now. Please check your internet connection.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleShareInvoice = async (item) => {
    if (!item) return;
    const enrollmentId = item._id || item.id;
    const invNumber = item.invoiceNumber || (item._id ? `INV-${String(item._id).slice(-6).toUpperCase()}` : 'RECEIPT');
    const fileName = `Invoice-${invNumber}.pdf`;
    const downloadUrl = await getInvoiceDownloadUrl(enrollmentId);

    await shareFile(
      downloadUrl,
      fileName,
      'application/pdf',
      `Payment Receipt - ${invNumber}`
    );
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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading payment records...</Text>
        </View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item, idx) => item._id || item.id || item.invoiceNumber || String(idx)}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title="No Payment Records"
              description="You have not completed any course purchases yet."
            />
          }
          renderItem={({ item }) => {
            const displayAmount = (typeof item.amountPaid === 'number' && !isNaN(item.amountPaid))
              ? item.amountPaid 
              : (typeof item.amount === 'number' && !isNaN(item.amount) ? item.amount : (item.course?.price || 0));
            const displayDate = item.createdAt 
              ? new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
              : (item.date || 'Recent');
            const displayTxn = item.invoiceNumber || item.transactionId || item.id || (item._id ? `TXN-${String(item._id).slice(-8).toUpperCase()}` : 'Online Payment');
            const isDownloading = downloadingId === (item._id || item.id);

            return (
              <View style={[styles.card, shadows.sm]}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.txnId} numberOfLines={1}>{displayTxn}</Text>
                    <Text style={styles.txnDate}>{displayDate}</Text>
                  </View>
                  <Badge text="PAID" variant="success" />
                </View>

                <Text style={styles.courseTitle}>{item.courseTitle || item.course?.title || 'Enrolled Course'}</Text>

                <View style={styles.footerRow}>
                  <Text style={styles.methodText}>💳 {item.method || item.paymentMethod || 'Online Payment'}</Text>
                  <Text style={styles.amount}>₹{Number(displayAmount).toLocaleString('en-IN')}</Text>
                </View>

                {/* Actions: View, Download, Share */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.viewBtn]}
                    onPress={() => handleViewInvoice(item)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="eye-outline" size={15} color="#065f46" />
                    <Text style={[styles.actionBtnText, { color: '#065f46' }]}>View</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.downloadBtn, isDownloading && { opacity: 0.75 }]}
                    onPress={() => handleDownloadInvoice(item)}
                    disabled={isDownloading}
                    activeOpacity={0.8}
                  >
                    {isDownloading ? (
                      <ActivityIndicator size="small" color="#065f46" />
                    ) : (
                      <Ionicons name="download-outline" size={15} color="#065f46" />
                    )}
                    <Text style={[styles.actionBtnText, { color: '#065f46' }]}>
                      {isDownloading ? 'Saving...' : 'Download'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.shareBtn]}
                    onPress={() => handleShareInvoice(item)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="share-social-outline" size={15} color="#ffffff" />
                    <Text style={[styles.actionBtnText, { color: '#ffffff' }]}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* In-App Invoice / Receipt Viewer Modal */}
      {viewingReceipt && (
        <InAppPdfViewerModal
          visible={Boolean(viewingReceipt)}
          onClose={() => setViewingReceipt(null)}
          title={viewingReceipt.title}
          documentId={viewingReceipt.documentId}
          pdfUrl={viewingReceipt.pdfUrl}
          onDownload={() => downloadFileToDeviceStorage(viewingReceipt.downloadUrl, viewingReceipt.fileName, 'application/pdf')}
          onShare={() => shareFile(viewingReceipt.downloadUrl, viewingReceipt.fileName, 'application/pdf', viewingReceipt.title)}
        />
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
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
    lineHeight: 20,
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
    fontWeight: '500',
  },
  amount: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  viewBtn: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  downloadBtn: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  shareBtn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
