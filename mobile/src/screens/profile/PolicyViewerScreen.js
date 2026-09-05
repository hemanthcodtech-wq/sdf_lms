import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../../theme/colors';
import { policyService } from '../../services/policyService';
import { useLanguage } from '../../context/LanguageContext';

export const PolicyViewerScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const policyType = route.params?.policyType || 'terms'; // 'terms' | 'privacy' | 'refund'

  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState(null);

  useEffect(() => {
    let mounted = true;
    policyService.getPolicies().then((res) => {
      if (mounted) {
        setPolicies(res);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const getTitle = () => {
    if (policyType === 'terms') return t('termsConditions');
    if (policyType === 'privacy') return t('privacyPolicy');
    if (policyType === 'refund') return t('refundPolicy');
    return t('termsConditions');
  };

  const getContent = () => {
    if (!policies) return '';
    if (policyType === 'terms') return policies.termsAndConditions;
    if (policyType === 'privacy') return policies.privacyPolicy;
    if (policyType === 'refund') return policies.refundPolicy;
    return policies.termsAndConditions;
  };

  const contactPhone = policies?.contactPhone || '+91 98765 43210';
  const contactEmail = policies?.contactEmail || 'support@sdflms.org';

  const handleCall = () => {
    const cleanNumber = contactPhone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanNumber}`).catch(() => {
      Alert.alert('Notice', 'Phone dialer could not be launched on this device.');
    });
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Inquiry regarding ${getTitle()}`);
    Linking.openURL(`mailto:${contactEmail}?subject=${subject}`).catch(() => {
      Alert.alert('Notice', 'Email client is not configured on this device.');
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? 14 : Math.max(insets.top, 20) }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {getTitle()}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 36 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Policy Document Card */}
          <View style={[styles.card, shadows.sm]}>
            <View style={styles.badgeRow}>
              <Text style={styles.dateText}>Swamy Dwija Foundation</Text>
            </View>

            <Text style={styles.policyBody}>{getContent()}</Text>
          </View>

          {/* Dedicated Contact & Inquiry Card */}
          <View style={[styles.contactCard, shadows.md]}>
            <Text style={styles.contactCardTitle}>Questions about this policy?</Text>
            <Text style={styles.contactCardSub}>
              Reach our student support desk directly through call or email.
            </Text>

            <View style={styles.btnRow}>
              {/* Call Button */}
              <TouchableOpacity
                style={[styles.actionBtn, styles.callBtn]}
                onPress={handleCall}
                activeOpacity={0.8}
              >
                <Ionicons name="call" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <View>
                  <Text style={styles.btnLabel}>Call Us</Text>
                  <Text style={styles.btnSub}>{contactPhone}</Text>
                </View>
              </TouchableOpacity>

              {/* Email Button */}
              <TouchableOpacity
                style={[styles.actionBtn, styles.emailBtn]}
                onPress={handleEmail}
                activeOpacity={0.8}
              >
                <Ionicons name="mail" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <View>
                  <Text style={styles.btnLabel}>Email Us</Text>
                  <Text style={styles.btnSub}>{contactEmail}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f4ea',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D5C31',
  },
  dateText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  policyBody: {
    fontSize: 14,
    lineHeight: 24,
    color: '#334155',
  },
  contactCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  contactCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  contactCardSub: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 18,
  },
  btnRow: {
    flexDirection: 'column',
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  callBtn: {
    backgroundColor: '#0D5C31',
  },
  emailBtn: {
    backgroundColor: '#1e293b',
  },
  btnLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  btnSub: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '500',
  },
});
