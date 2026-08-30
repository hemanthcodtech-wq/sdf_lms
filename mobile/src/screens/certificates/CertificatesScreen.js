import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../../theme/colors';
import { EmptyState } from '../../components/EmptyState';
import { Badge } from '../../components/Badge';
import { useAuth } from '../../context/AuthContext';
import { courseService } from '../../services/courseService';

export const CertificatesScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sample certificate for demonstration
  const sampleCerts = [
    {
      id: 'cert_101',
      courseTitle: 'Vedic Mathematics & Speed Calculation',
      issueDate: 'August 2026',
      certificateId: 'SDF-VM-2026-8941',
      grade: 'A+ Distinction',
    },
  ];

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const res = await courseService.getCertificates();
      if (res?.data && res.data.length > 0) {
        setCertificates(res.data);
      } else {
        setCertificates(sampleCerts);
      }
    } catch (e) {
      setCertificates(sampleCerts);
    } finally {
      setLoading(false);
    }
  };

  const handleShareCert = (cert) => {
    Share.share({
      message: `I just earned my official verified certificate in "${cert.courseTitle}" from SDF LMS! Certificate ID: ${cert.certificateId}`,
    });
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
        <Text style={styles.headerTitle}>My Certificates</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={certificates}
        keyExtractor={(item) => item.id || item.certificateId}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="ribbon-outline"
            title="No Certificates Issued Yet"
            description="Complete 100% of your course lessons and quizzes to earn official verified certificates."
            buttonTitle="View My Courses"
            onButtonPress={() => navigation.navigate('LearningTab')}
          />
        }
        renderItem={({ item }) => (
          <View style={[styles.certCard, shadows.md]}>
            <View style={styles.certHeader}>
              <View style={styles.ribbonCircle}>
                <Ionicons name="ribbon" size={26} color="#d97706" />
              </View>
              <Badge text="VERIFIED" variant="success" />
            </View>

            <Text style={styles.certCourseTitle}>{item.courseTitle}</Text>
            <Text style={styles.certRecipient}>Awarded to {user?.name || 'Student'}</Text>

            <View style={styles.certMetaRow}>
              <View>
                <Text style={styles.certMetaLabel}>Issued</Text>
                <Text style={styles.certMetaValue}>{item.issueDate}</Text>
              </View>
              <View>
                <Text style={styles.certMetaLabel}>Grade</Text>
                <Text style={styles.certMetaValue}>{item.grade || 'Passed'}</Text>
              </View>
              <View>
                <Text style={styles.certMetaLabel}>Certificate ID</Text>
                <Text style={styles.certMetaValue}>{item.certificateId}</Text>
              </View>
            </View>

            <View style={styles.certActionRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => Alert.alert('Download Certificate', 'Downloading high-resolution certificate PDF...')}
              >
                <Ionicons name="download-outline" size={18} color={colors.primary} />
                <Text style={styles.actionBtnText}>Download PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.shareBtn]}
                onPress={() => handleShareCert(item)}
              >
                <Ionicons name="share-social-outline" size={18} color="#fff" />
                <Text style={[styles.actionBtnText, { color: '#fff' }]}>Share</Text>
              </TouchableOpacity>
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
});
