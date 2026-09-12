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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../../theme/colors';
import { policyService } from '../../services/policyService';
import { useLanguage } from '../../context/LanguageContext';

export const HelpSupportScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [contactPhone, setContactPhone] = useState('+91 9989551305');
  const [contactEmail, setContactEmail] = useState('swamidwijafoundation@gmail.com');
  const [faqs, setFaqs] = useState([]);
  const [loadingFaqs, setLoadingFaqs] = useState(true);
  const [expandedIdx, setExpandedIdx] = useState(0);

  useEffect(() => {
    let isMounted = true;
    policyService.getPolicies()
      .then((res) => {
        if (!isMounted) return;
        if (res?.contactPhone) setContactPhone(res.contactPhone);
        if (res?.contactEmail) setContactEmail(res.contactEmail);
        if (Array.isArray(res?.faqs)) {
          setFaqs(res.faqs);
        }
      })
      .finally(() => {
        if (isMounted) setLoadingFaqs(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCall = () => {
    const cleanNumber = contactPhone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanNumber}`).catch(() => {
      Alert.alert('Notice', 'Phone calling is not supported on this device.');
    });
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${contactEmail}`).catch(() => {
      Alert.alert('Notice', 'Email client is not configured.');
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
        <Text style={styles.headerTitle}>{t('helpSupport')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Contact Cards */}
        <View style={styles.contactRow}>
          <TouchableOpacity
            style={[styles.contactCard, shadows.sm]}
            onPress={handleCall}
            activeOpacity={0.7}
          >
            <View style={[styles.contactIcon, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="call" size={22} color="#2563eb" />
            </View>
            <Text style={styles.contactTitle}>Call Us</Text>
            <Text style={styles.contactSub}>{contactPhone}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.contactCard, shadows.sm]}
            onPress={handleEmail}
            activeOpacity={0.7}
          >
            <View style={[styles.contactIcon, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="mail" size={22} color="#16a34a" />
            </View>
            <Text style={styles.contactTitle}>Email Support</Text>
            <Text style={styles.contactSub}>{contactEmail}</Text>
          </TouchableOpacity>
        </View>

        {/* FAQs */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {loadingFaqs ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : faqs.length > 0 ? (
          faqs.map((faq, idx) => {
            const isExpanded = expandedIdx === idx;
            const questionText = faq.q || faq.question || '';
            const answerText = faq.a || faq.answer || '';
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.faqCard, shadows.sm]}
                onPress={() => setExpandedIdx(isExpanded ? null : idx)}
                activeOpacity={0.7}
              >
                <View style={styles.faqHeader}>
                  <Ionicons name="help-circle" size={20} color={colors.primary} />
                  <Text style={styles.faqQuestion}>{questionText}</Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.textTertiary}
                  />
                </View>
                {isExpanded && (
                  <Text style={styles.faqAnswer}>{answerText}</Text>
                )}
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No questions available right now.</Text>
          </View>
        )}
      </ScrollView>
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
  scrollContent: {
    padding: 16,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  contactCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  contactSub: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 14,
  },
  faqCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  faqAnswer: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginLeft: 28,
  },
  loadingContainer: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textTertiary,
  },
});

