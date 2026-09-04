import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../../theme/colors';
import { EmptyState } from '../../components/EmptyState';
import { Badge } from '../../components/Badge';
import { InAppPdfViewerModal } from '../../components/InAppPdfViewerModal';
import { downloadFileToDeviceStorage, shareFile } from '../../utils/fileDownloader';
import { useAuth } from '../../context/AuthContext';
import { courseService } from '../../services/courseService';
import { API_BASE_URL } from '../../services/api';

export const CertificatesScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [viewingCert, setViewingCert] = useState(null);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const res = await courseService.getMyCertificates();
      if (res?.data && res.data.length > 0) {
        setCertificates(res.data);
      } else {
        setCertificates([]);
      }
    } catch (e) {
      console.error('Error fetching certificates:', e);
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  const getCertDownloadUrl = async (item) => {
    const token = await AsyncStorage.getItem('token');
    return `${API_BASE_URL}/courses/certificate/${item._id || item.id}/download?token=${token || ''}`;
  };

  const handleViewCert = async (item) => {
    if (!item) return;
    const certId = item.certificateId || `SDF-CERT-${item._id?.slice(-6)?.toUpperCase() || 'OFFICIAL'}`;
    const courseTitle = item.course?.title || item.courseTitle || 'Course Certificate';
    const downloadUrl = await getCertDownloadUrl(item);

    setViewingCert({
      title: `${courseTitle} Certificate`,
      documentId: certId,
      pdfUrl: downloadUrl,
      downloadUrl,
      fileName: `Certificate-${certId}.pdf`,
    });
  };

  const handleDownloadCert = async (item) => {
    if (!item) return;
    const certItemId = item._id || item.id || item.certificateId;
    try {
      setDownloadingId(certItemId);
      const certId = item.certificateId || `SDF-CERT-${item._id?.slice(-6)?.toUpperCase() || 'OFFICIAL'}`;
      const fileName = `Certificate-${certId}.pdf`;
      const downloadUrl = await getCertDownloadUrl(item);

      await downloadFileToDeviceStorage(downloadUrl, fileName, 'application/pdf');
    } catch (err) {
      console.error('Download certificate error:', err);
      Alert.alert(
        'Download Notice',
        'Could not complete download. Please check your internet connection.'
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const handleShareCert = async (item) => {
    if (!item) return;
    const certId = item.certificateId || `SDF-CERT-${item._id?.slice(-6)?.toUpperCase() || 'OFFICIAL'}`;
    const fileName = `Certificate-${certId}.pdf`;
    const downloadUrl = await getCertDownloadUrl(item);

    await shareFile(
      downloadUrl,
      fileName,
      'application/pdf',
      `Certificate - ${certId}`
    );
  };

  const studentDisplayName = user?.name || (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Student');

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
        <Text style={styles.headerTitle}>My Certificates</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading certificates...</Text>
        </View>
      ) : (
        <FlatList
          data={certificates}
          keyExtractor={(item) => item._id || item.id || item.certificateId}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="ribbon-outline"
              title="No Certificates Issued Yet"
              description="Complete 100% of your course sessions to earn official verified certificates."
              buttonTitle="View My Courses"
              onButtonPress={() => navigation.navigate('LearningTab')}
            />
          }
          renderItem={({ item }) => {
            const courseTitle = item.course?.title || item.courseTitle || 'Vedic Yoga & Wellness';
            const certId = item.certificateId || `SDF-CERT-${item._id?.slice(-6)?.toUpperCase() || '2026'}`;
            const issueDate = item.completionDate 
              ? new Date(item.completionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
              : (item.issueDate || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }));
            const recipient = item.studentName || studentDisplayName;
            const isDownloading = downloadingId === (item._id || item.id || item.certificateId);

            return (
              <View style={[styles.certCard, shadows.md]}>
                <View style={styles.certHeader}>
                  <View style={styles.ribbonCircle}>
                    <Ionicons name="ribbon" size={26} color="#d97706" />
                  </View>
                  <Badge text="VERIFIED" variant="success" />
                </View>

                <Text style={styles.certCourseTitle} numberOfLines={2}>{courseTitle}</Text>
                <Text style={styles.certRecipient} numberOfLines={1}>Awarded to {recipient}</Text>

                <View style={styles.certMetaRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.certMetaLabel}>Issued On</Text>
                    <Text style={styles.certMetaValue} numberOfLines={1}>{issueDate}</Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={styles.certMetaLabel}>Status</Text>
                    <Text style={[styles.certMetaValue, { color: colors.primary }]}>Completed</Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={styles.certMetaLabel}>Certificate ID</Text>
                    <Text style={styles.certMetaValue} numberOfLines={1}>{certId}</Text>
                  </View>
                <View style={styles.certActionRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.viewBtn]}
                    onPress={() => handleViewCert(item)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="eye-outline" size={16} color="#065f46" />
                    <Text style={[styles.actionBtnText, { color: '#065f46' }]}>View</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, isDownloading && { opacity: 0.7 }]}
                    onPress={() => handleDownloadCert(item)}
                    disabled={isDownloading}
                    activeOpacity={0.8}
                  >
                    {isDownloading ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Ionicons name="download-outline" size={16} color={colors.primary} />
                    )}
                    <Text style={styles.actionBtnText}>
                      {isDownloading ? 'Saving...' : 'Download'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.shareBtn]}
                    onPress={() => handleShareCert(item)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="share-social-outline" size={16} color="#fff" />
                    <Text style={[styles.actionBtnText, { color: '#fff' }]}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* In-App PDF Viewer Modal */}
      {viewingCert && (
        <InAppPdfViewerModal
          visible={Boolean(viewingCert)}
          onClose={() => setViewingCert(null)}
          title={viewingCert.title}
          documentId={viewingCert.documentId}
          pdfUrl={viewingCert.pdfUrl}
          onDownload={() => downloadFileToDeviceStorage(viewingCert.downloadUrl, viewingCert.fileName, 'application/pdf')}
          onShare={() => shareFile(viewingCert.downloadUrl, viewingCert.fileName, 'application/pdf', viewingCert.title)}
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
  listContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  certCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#fef3c7',
    marginBottom: 16,
  },
  certHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  ribbonCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  certCourseTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  certRecipient: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  certMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceAlt,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  certMetaLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  certMetaValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  certActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  viewBtn: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  shareBtn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
