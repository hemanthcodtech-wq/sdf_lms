import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../../theme/colors';

export const PortalSelectionScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const portals = [
    {
      id: 'student',
      title: 'Student / User Login',
      subtitle: 'Access enrolled courses, live Zoom classes & certificates',
      icon: 'school-outline',
      badge: 'LEARNER PORTAL',
      badgeColor: colors.primary,
      accentColor: colors.primary,
      bgTint: 'rgba(13, 92, 49, 0.08)',
      borderColor: colors.primary,
      onPress: () => navigation.navigate('Login'),
    },
    {
      id: 'instructor',
      title: 'Instructor Portal Login',
      subtitle: 'Manage assigned batches, schedules & host live sessions',
      icon: 'easel-outline',
      badge: 'FACULTY & TEACHERS',
      badgeColor: colors.secondary,
      accentColor: colors.secondary,
      bgTint: 'rgba(234, 122, 40, 0.08)',
      borderColor: colors.secondary,
      onPress: () => navigation.navigate('InstructorLogin'),
    },
    {
      id: 'moderator',
      title: 'Moderator Portal Login',
      subtitle: 'Monitor student queries, live attendance & batch reviews',
      icon: 'shield-checkmark-outline',
      badge: 'BATCH MODERATORS',
      badgeColor: '#2563eb',
      accentColor: '#2563eb',
      bgTint: 'rgba(37, 99, 235, 0.08)',
      borderColor: '#2563eb',
      onPress: () => navigation.navigate('ModeratorLogin'),
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Platform.OS === 'web' ? 24 : Math.max(insets.top, 24),
            paddingBottom: insets.bottom + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.header}>
          <View style={[styles.logoBadge, shadows.brandGlow]}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Swamy Dwija Foundation</Text>
          <Text style={styles.subtitle}>Select your portal to log in and get started</Text>
        </View>

        {/* Portal Options */}
        <View style={styles.portalsContainer}>
          {portals.map((portal) => (
            <TouchableOpacity
              key={portal.id}
              style={[
                styles.portalCard,
                { backgroundColor: '#ffffff', borderColor: portal.borderColor },
                shadows.md,
              ]}
              onPress={portal.onPress}
              activeOpacity={0.82}
            >
              <View style={styles.portalCardTop}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: portal.bgTint },
                  ]}
                >
                  <Ionicons name={portal.icon} size={28} color={portal.accentColor} />
                </View>
                <View style={[styles.badge, { backgroundColor: portal.bgTint }]}>
                  <Text style={[styles.badgeText, { color: portal.accentColor }]}>
                    {portal.badge}
                  </Text>
                </View>
              </View>

              <Text style={styles.portalTitle}>{portal.title}</Text>
              <Text style={styles.portalSubtitle}>{portal.subtitle}</Text>

              <View style={styles.portalActionRow}>
                <Text style={[styles.actionText, { color: portal.accentColor }]}>
                  Proceed to Login
                </Text>
                <Ionicons name="arrow-forward" size={16} color={portal.accentColor} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Guest Exploration Option */}
        <View style={styles.guestSection}>
          <TouchableOpacity
            style={styles.guestButton}
            onPress={() => navigation.navigate('Main')}
            activeOpacity={0.7}
          >
            <Text style={styles.guestButtonText}>Browse & Explore Courses as Guest</Text>
            <Ionicons name="compass-outline" size={18} color={colors.textSecondary} />
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    overflow: 'hidden',
  },
  logoImage: {
    width: 70,
    height: 70,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primaryDark,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  portalsContainer: {
    gap: 14,
    marginBottom: 20,
  },
  portalCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
  },
  portalCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  portalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  portalSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  portalActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  guestSection: {
    alignItems: 'center',
    marginTop: 8,
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  guestButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
