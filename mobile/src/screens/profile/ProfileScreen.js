import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../../theme/colors';
import { Badge } from '../../components/Badge';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { courseService } from '../../services/courseService';
import { paymentService } from '../../services/paymentService';
import { authService } from '../../services/authService';
import { API_BASE_URL } from '../../services/api';
import { getAvatarUrl } from '../../utils/imageHelper';

export const ProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, logout, wishlist, updateUserProfile } = useAuth();
  const { t } = useLanguage();

  const fileInputRef = React.useRef(null);
  const [stats, setStats] = useState({
    enrolledCount: 0,
    certificatesCount: 0,
    paymentsCount: 0,
  });
  const [detailedProfile, setDetailedProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    try {
      setLoading(true);

      const [profRes, enrollRes, certRes, payRes] = await Promise.allSettled([
        authService.getProfile(),
        courseService.getEnrolledCourses(),
        courseService.getMyCertificates(),
        paymentService.getPaymentHistory(),
      ]);

      if (profRes.status === 'fulfilled' && profRes.value?.data) {
        setDetailedProfile(profRes.value.data);
      }

      const enrolledCount = enrollRes.status === 'fulfilled' && enrollRes.value?.data ? enrollRes.value.data.length : 0;
      const certificatesCount = certRes.status === 'fulfilled' && certRes.value?.data ? certRes.value.data.length : 0;
      const paymentsCount = payRes.status === 'fulfilled' && payRes.value?.data ? payRes.value.data.length : 0;

      setStats({
        enrolledCount,
        certificatesCount,
        paymentsCount,
      });
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadAvatar = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = handleFileChange;
      input.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      setUploadSuccess(false);
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await authService.uploadAvatar(formData);
      if (res.success && res.avatar) {
        setDetailedProfile((prev) => ({ ...prev, avatar: res.avatar }));
        if (updateUserProfile) {
          await updateUserProfile({ avatar: res.avatar });
        }
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        throw new Error(res.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Avatar upload error:', err);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(err?.response?.data?.message || err.message || 'Failed to update profile photo.');
      } else {
        Alert.alert('Upload Error', err?.response?.data?.message || err.message || 'Failed to update profile photo.');
      }
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (Platform.OS === 'web') {
        const ok =
          typeof window !== 'undefined' && window.confirm
            ? window.confirm('Are you sure you want to log out?')
            : true;
        if (ok) {
          await logout();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Auth' }],
          });
        }
      } else {
        Alert.alert('Logout', 'Are you sure you want to log out?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: async () => {
              await logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Auth' }],
              });
            },
          },
        ]);
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const effectiveUser = detailedProfile || user;
  const avatarUri = getAvatarUrl(effectiveUser?.avatar);

  const menuItems = [
    {
      id: 'certificates',
      title: 'My Certificates',
      subtitle: `${stats.certificatesCount} earned certificates`,
      icon: 'ribbon-outline',
      color: '#f59e0b',
      onPress: () => navigation.navigate('Certificates'),
    },
    {
      id: 'payments',
      title: 'Payment History',
      subtitle: `${stats.paymentsCount} orders & invoices`,
      icon: 'receipt-outline',
      color: colors.primary,
      onPress: () => navigation.navigate('PaymentHistory'),
    },
    {
      id: 'learning',
      title: 'My Enrollments',
      subtitle: `${stats.enrolledCount} active courses`,
      icon: 'book-outline',
      color: colors.secondary,
      onPress: () => navigation.navigate('LearningTab'),
    },
    {
      id: 'settings',
      title: t('settings'),
      subtitle: 'App preferences & language selection',
      icon: 'settings-outline',
      color: '#6366f1',
      onPress: () => navigation.navigate('Settings'),
    },
    {
      id: 'help',
      title: t('helpSupport'),
      subtitle: 'FAQ, contact info & direct guidance',
      icon: 'help-circle-outline',
      color: '#0284c7',
      onPress: () => navigation.navigate('HelpSupport'),
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? 14 : Math.max(insets.top, 20) }]}>
        <Text style={styles.headerTitle}>{t('profile')}</Text>
        {user && (
          <TouchableOpacity onPress={loadProfileData} style={styles.refreshBtn} activeOpacity={0.7}>
            <Ionicons name="refresh" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 36 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Card */}
        {user ? (
          <View style={[styles.profileCard, shadows.md]}>
            {Platform.OS === 'web' && (
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleFileChange}
              />
            )}
            {/* Avatar with Interactive Upload Camera Badge */}
            <View style={styles.avatarWrapper}>
              <TouchableOpacity
                onPress={handleUploadAvatar}
                disabled={uploadingAvatar}
                activeOpacity={0.8}
                style={styles.avatarContainer}
              >
                {avatarUri ? (
                  <Image source={{ uri: avatarUri, cache: 'force-cache' }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarLarge}>
                    <Text style={styles.avatarLargeText}>
                      {effectiveUser?.name ? effectiveUser.name.charAt(0).toUpperCase() : 'U'}
                    </Text>
                  </View>
                )}

                {/* Camera Icon Overlay */}
                <View style={styles.cameraBadge}>
                  {uploadingAvatar ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Ionicons name="camera" size={14} color="#ffffff" />
                  )}
                </View>
              </TouchableOpacity>
            </View>

            {uploadSuccess && (
              <View style={styles.uploadSuccessBadge}>
                <Ionicons name="checkmark-circle" size={13} color="#0d5c31" />
                <Text style={styles.uploadSuccessText}>Profile photo updated!</Text>
              </View>
            )}

            <TouchableOpacity onPress={handleUploadAvatar} activeOpacity={0.7}>
              <Text style={styles.changePhotoPrompt}>Tap avatar to change photo</Text>
            </TouchableOpacity>

            <Text style={styles.userName}>{effectiveUser?.name || 'Student'}</Text>
            <Text style={styles.userEmail}>
              {effectiveUser?.email || effectiveUser?.emailOrPhone || 'student@sdflms.org'}
            </Text>
            <View style={styles.roleBadgeWrap}>
              <Badge text={(effectiveUser?.role || 'STUDENT').toUpperCase()} variant="primary" />
            </View>

            {/* Quick Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.enrolledCount}</Text>
                <Text style={styles.statLabel}>Enrolled</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.certificatesCount}</Text>
                <Text style={styles.statLabel}>Certificates</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{wishlist?.length || 0}</Text>
                <Text style={styles.statLabel}>Wishlist</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.profileCard, shadows.md]}>
            <View style={styles.avatarLarge}>
              <Ionicons name="person" size={32} color="#fff" />
            </View>
            <Text style={styles.userName}>Guest Learner</Text>
            <Text style={styles.userEmail}>Sign in to access all courses & dashboard</Text>
            <TouchableOpacity
              style={styles.loginCardBtn}
              onPress={() => navigation.navigate('Auth')}
            >
              <Text style={styles.loginCardBtnText}>Login / Sign Up</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Detailed Student Information Card */}
        {user && (
          <View style={[styles.infoCard, shadows.sm]}>
            <Text style={styles.sectionHeaderTitle}>Student Details</Text>

            {/* Full Name */}
            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}>
                <Ionicons name="person-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Full Name</Text>
                <Text style={styles.infoValue}>{effectiveUser?.name || 'Not provided'}</Text>
              </View>
            </View>

            {/* Email Address */}
            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}>
                <Ionicons name="mail-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email Address</Text>
                <Text style={styles.infoValue}>
                  {effectiveUser?.email || effectiveUser?.emailOrPhone || 'Not provided'}
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
            </View>

            {/* Phone Number */}
            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}>
                <Ionicons name="call-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>WhatsApp / Phone Number</Text>
                <Text style={styles.infoValue}>
                  {effectiveUser?.phone || effectiveUser?.emailOrPhone || 'Not provided'}
                </Text>
              </View>
            </View>

            {/* Member Since / Registration */}
            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Account Created</Text>
                <Text style={styles.infoValue}>
                  {effectiveUser?.createdAt
                    ? new Date(effectiveUser.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Active Student'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Menu Options */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionHeaderTitle}>Account & Services</Text>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, shadows.sm]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon} size={22} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Option */}
        {user && (
          <TouchableOpacity
            style={[styles.logoutBtn, shadows.sm]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={22} color={colors.error} />
            <Text style={styles.logoutText}>{t('logout')}</Text>
          </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  refreshBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarLarge: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  avatarImg: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  avatarLargeText: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '800',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    ...shadows.sm,
  },
  changePhotoPrompt: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
  },
  uploadSuccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
    marginBottom: 8,
  },
  uploadSuccessText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0d5c31',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 10,
    textAlign: 'center',
  },
  roleBadgeWrap: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 12,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 12,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(13, 92, 49, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 1,
  },
  menuSection: {
    gap: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 12,
  },
  menuIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  menuSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  loginCardBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 12,
  },
  loginCardBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.errorLight,
    padding: 14,
    borderRadius: 16,
    gap: 8,
  },
  logoutText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: '700',
  },
});
