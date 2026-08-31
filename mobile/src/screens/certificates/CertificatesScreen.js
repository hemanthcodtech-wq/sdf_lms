import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Share,
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
import { useAuth } from '../../context/AuthContext';
import { courseService } from '../../services/courseService';
import { API_BASE_URL } from '../../services/api';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';

export const CertificatesScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

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

  const handleDownloadCert = async (item) => {
    if (!item) return;
    const certItemId = item._id || item.id || item.certificateId;
    try {
      setDownloadingId(certItemId);
      const token = await AsyncStorage.getItem('token');
      const certId = item.certificateId || `SDF-CERT-${item._id?.slice(-6)?.toUpperCase() || 'OFFICIAL'}`;
      const fileName = `Certificate-${certId}.pdf`;
      
      // Determine download URL with authentication query token
      const downloadUrl = `${API_BASE_URL}/courses/certificate/${item._id || item.id}/download?token=${token || ''}`;

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        // Direct browser download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Native mobile download directly via expo-file-system
        try {
          const fileUri = `${FileSystem.documentDirectory}${fileName}`;
          const downloadRes = await FileSystem.downloadAsync(downloadUrl, fileUri);

          if (downloadRes.status === 200) {
            const canShare = await Sharing.isAvailableAsync();
            if (canShare) {
              await Sharing.shareAsync(downloadRes.uri, {
                mimeType: 'application/pdf',
                dialogTitle: `Download Certificate - ${certId}`,
                UTI: 'com.adobe.pdf',
              });
            } else {
              await WebBrowser.openBrowserAsync(downloadUrl);
            }
          } else {
            // Fallback to opening authenticated URL directly in browser
            await WebBrowser.openBrowserAsync(downloadUrl);
          }
        } catch (fsErr) {
          console.warn('FileSystem download fallback:', fsErr);
          await WebBrowser.openBrowserAsync(downloadUrl);
        }
      }
    } catch (err) {
      console.error('Download certificate error:', err);
      Alert.alert(
        'Download Notice',
        'Could not complete direct download. Please ensure you are connected to the internet.'
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const handleShareCert = (cert) => {
    const title = cert.course?.title || cert.courseTitle || 'Yoga Course';
    const certId = cert.certificateId || 'SDF-CERT';
    Share.share({
      message: `🏆 I have successfully earned my verified Certificate of Completion in "${title}" from Swamy Dwija Foundation! Certificate ID: ${certId}`,
    }).catch(() => {});
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
                </View>

                <View style={styles.certActionRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, isDownloading && { opacity: 0.7 }]}
                    onPress={() => handleDownloadCert(item)}
                    disabled={isDownloading}
                    activeOpacity={0.8}
                  >
                    {isDownloading ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Ionicons name="download-outline" size={18} color={colors.primary} />
                    )}
                    <Text style={styles.actionBtnText}>
                      {isDownloading ? 'Downloading...' : 'Download PDF'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.shareBtn]}
                    onPress={() => handleShareCert(item)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="share-social-outline" size={18} color="#fff" />
                    <Text style={[styles.actionBtnText, { color: '#fff' }]}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
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
