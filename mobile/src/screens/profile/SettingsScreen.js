import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../../theme/colors';
import { useLanguage } from '../../context/LanguageContext';

export const SettingsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { language, changeLanguage, t } = useLanguage();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [downloadOverWifi, setDownloadOverWifi] = React.useState(true);

  const languages = [
    { code: 'en', label: 'English (Default)' },
    { code: 'te', label: 'తెలుగు (Telugu)' },
    { code: 'hi', label: 'हिन्दी (Hindi)' },
  ];

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
        <Text style={styles.headerTitle}>{t('settings')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Language Selection */}
        <View style={[styles.sectionCard, shadows.sm]}>
          <Text style={styles.sectionTitle}>{t('appLanguage')}</Text>
          {languages.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langRow, isSelected && styles.langRowActive]}
                onPress={() => changeLanguage(lang.code)}
                activeOpacity={0.7}
              >
                <Text style={[styles.langLabel, isSelected && styles.langLabelActive]}>
                  {lang.label}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Legal & Policy Links */}
        <View style={[styles.sectionCard, shadows.sm]}>
          <Text style={styles.sectionTitle}>{t('aboutLegal')}</Text>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate('PolicyViewer', { policyType: 'terms' })}
            activeOpacity={0.7}
          >
            <Text style={styles.linkLabel}>{t('termsConditions')}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate('PolicyViewer', { policyType: 'privacy' })}
            activeOpacity={0.7}
          >
            <Text style={styles.linkLabel}>{t('privacyPolicy')}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate('PolicyViewer', { policyType: 'refund' })}
            activeOpacity={0.7}
          >
            <Text style={styles.linkLabel}>{t('refundPolicy')}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
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
    gap: 16,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  langRowActive: {
    backgroundColor: colors.primaryLight + '08',
  },
  langLabel: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  langLabelActive: {
    fontWeight: '700',
    color: colors.primary,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  switchSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 8,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  linkLabel: {
    fontSize: 14,
    color: colors.textPrimary,
  },
});
