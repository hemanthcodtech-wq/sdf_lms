import React, { useState, useEffect, useCallback } from 'react';
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
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../../theme/colors';
import { Badge } from '../../components/Badge';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { courseService } from '../../services/courseService';
import { paymentService } from '../../services/paymentService';
import { authService } from '../../services/authService';
import { getAvatarUrl } from '../../utils/imageHelper';
import { cacheService } from '../../services/cacheService';

export const ProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, logout, wishlist, updateUserProfile } = useAuth();
  const { t } = useLanguage();

  const [stats, setStats] = useState(() => cacheService.getUserStats());
  const [detailedProfile, setDetailedProfile] = useState(() => cacheService.getUserProfile());
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Edit Profile Details State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const handleOpenEditModal = () => {
    const current = detailedProfile || user;
    setEditName(current?.name || '');
    setEditPhone(current?.phone || (current?.emailOrPhone && !current.emailOrPhone.includes('@') ? current.emailOrPhone : ''));
    setEditEmail(current?.email || (current?.emailOrPhone && current.emailOrPhone.includes('@') ? current.emailOrPhone : ''));
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Name Required', 'Please enter your legal name.');
      return;
    }

    try {
      setSavingProfile(true);
      const payload = {
        name: editName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim(),
      };

      const res = await authService.updateProfile(payload);
      if (res && (res.success || res.name)) {
        const updatedName = res.name || editName.trim();
        const updatedPhone = res.phone || editPhone.trim();
        const updatedEmail = res.email || editEmail.trim();

        if (updateUserProfile) {
          await updateUserProfile({
            name: updatedName,
            phone: updatedPhone,
            email: updatedEmail,
          });
        }
        setDetailedProfile(prev => ({
          ...(prev || {}),
          name: updatedName,
          phone: updatedPhone,
          email: updatedEmail,
        }));
        setIsEditModalVisible(false);
        Alert.alert(
          'Profile Updated',
          'Your profile details and certificate legal name have been updated successfully!'
        );
      } else {
        throw new Error(res?.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Update profile error:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to update profile. Please try again.';
      Alert.alert('Update Failed', errMsg);
    } finally {
      setSavingProfile(false);
    }
  };

  const loadProfileData = useCallback(async () => {
    try {
      // Only show spinner if we don't have any cached profile yet
      if (!cacheService.getUserProfile()) {
        setLoading(true);
      }

      // Single payment history call provides enrollments, certificates & payment count
      const [profRes, payRes] = await Promise.allSettled([
        authService.getProfile(),
        paymentService.getPaymentHistory(),
      ]);

      if (profRes.status === 'fulfilled' && profRes.value?.data) {
        setDetailedProfile(profRes.value.data);
        cacheService.setUserProfile(profRes.value.data);
      }

      let paymentsList = [];
      if (payRes.status === 'fulfilled' && Array.isArray(payRes.value?.data)) {
        paymentsList = payRes.value.data;
      }

      const enrolledCount = paymentsList.length;
      const certificatesCount = paymentsList.filter((e) => e.completed || e.certificateId).length;
      const paymentsCount = paymentsList.length;

      const newStats = {
        enrolledCount,
        certificatesCount,
        paymentsCount,
      };

      setStats(newStats);
      cacheService.setUserStats(newStats);
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadProfileData();
      }
    }, [user, loadProfileData])
  );

  const handleUploadAvatar = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Needed',
            'Please grant permission to access your photo library to update your profile photo.'
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const selectedAsset = result.assets[0];
      setUploadingAvatar(true);
      setUploadSuccess(false);

      const formData = new FormData();
      if (Platform.OS === 'web') {
        const fetchRes = await fetch(selectedAsset.uri);
        const blob = await fetchRes.blob();
        formData.append('avatar', blob, 'avatar.jpg');
      } else {
        const uri = selectedAsset.uri;
        const uriParts = uri.split('/');
        const fileName = selectedAsset.fileName || uriParts[uriParts.length - 1] || `avatar_${Date.now()}.jpg`;
        const match = /\.(\w+)$/.exec(fileName);
        const type = selectedAsset.mimeType || (match ? `image/${match[1]}` : 'image/jpeg');

        formData.append('avatar', {
          uri,
          name: fileName,
          type,
        });
      }

      const res = await authService.uploadAvatar(formData);
      if (res && res.success && res.avatar) {
        setDetailedProfile((prev) => ({ ...prev, avatar: res.avatar }));
        if (updateUserProfile) {
          await updateUserProfile({ avatar: res.avatar });
        }
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        throw new Error(res?.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Avatar upload error:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to update profile photo.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(errMsg);
      } else {
        Alert.alert('Upload Error', errMsg);
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
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const effectiveUser = detailedProfile || user;
  const avatarUri = getAvatarUrl(effectiveUser?.avatar);

  const menuItems = [
    {
      id: 'wishlist',
      title: t('myWishlist') || 'My Wishlist',
      subtitle: `${wishlist?.length || 0} saved courses`,
      icon: 'heart-outline',
      color: '#ef4444',
      badge: wishlist?.length > 0 ? wishlist.length.toString() : null,
      onPress: () => navigation.navigate('WishlistTab'),
    },
    {
      id: 'learning',
      title: t('myEnrollments') || 'My Enrollments',
      subtitle: `${stats.enrolledCount} active courses`,
      icon: 'book-outline',
      color: colors.primary,
      badge: stats.enrolledCount > 0 ? stats.enrolledCount.toString() : null,
      onPress: () => navigation.navigate('LearningTab'),
    },
    {
      id: 'payments',
      title: t('paymentHistory') || 'Payment History',
      subtitle: `${stats.paymentsCount} transactions`,
      icon: 'card-outline',
      color: colors.secondary,
      onPress: () => navigation.navigate('PaymentHistory'),
    },
    {
      id: 'certificates',
      title: t('myCertificates') || 'My Certificates',
      subtitle: `${stats.certificatesCount} certificates earned`,
      icon: 'ribbon-outline',
      color: '#f59e0b',
      badge: stats.certificatesCount > 0 ? stats.certificatesCount.toString() : null,
      onPress: () => navigation.navigate('Certificates'),
    },
    {
      id: 'settings',
      title: t('settings') || 'Settings',
      subtitle: 'App preferences & language selection',
      icon: 'settings-outline',
      color: '#6366f1',
      onPress: () => navigation.navigate('Settings'),
    },
    {
      id: 'help',
      title: t('helpSupport') || 'Help & Support',
      subtitle: 'FAQ, contact info & direct guidance',
      icon: 'help-circle-outline',
      color: '#0284c7',
      onPress: () => navigation.navigate('HelpSupport'),
    },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? 14 : Math.max(insets.top, 20) }]}>
        <Text style={styles.headerTitle}>{t('profile')}</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 36 }]}
        showsVerticalScrollIndicator={false}
      >
        {user ? (
          <View style={[styles.profileCard, shadows.md]}>
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
              <Badge
                text={effectiveUser?.role ? effectiveUser.role.toUpperCase() : 'STUDENT'}
                variant={effectiveUser?.role === 'admin' ? 'danger' : 'primary'}
              />
            </View>

            <TouchableOpacity
              style={styles.cardEditProfileBtn}
              onPress={handleOpenEditModal}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={14} color={colors.primary} />
              <Text style={styles.cardEditProfileText}>Edit Profile Details</Text>
            </TouchableOpacity>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.enrolledCount}</Text>
                <Text style={styles.statLabel}>{t('courses') || 'Courses'}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.certificatesCount}</Text>
                <Text style={styles.statLabel}>{t('certificates') || 'Certificates'}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.paymentsCount}</Text>
                <Text style={styles.statLabel}>Paid</Text>
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

        {user && (
          <View style={[styles.infoCard, shadows.sm]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>Student Details</Text>
              <TouchableOpacity
                style={styles.editProfileBtn}
                onPress={handleOpenEditModal}
                activeOpacity={0.7}
              >
                <Ionicons name="create-outline" size={14} color={colors.primary} />
                <Text style={styles.editProfileBtnText}>Edit</Text>
              </TouchableOpacity>
            </View>

            {/* Full Name */}
            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}>
                <Ionicons name="person-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Full Legal Name</Text>
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

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContainer, shadows.lg]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.modalIconWrap}>
                  <Ionicons name="person-circle-outline" size={24} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Edit Profile Details</Text>
                  <Text style={styles.modalSubtitle}>Updates legal name on all certificates</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setIsEditModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              {/* Full Legal Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Full Legal Name <Text style={{ color: '#ef4444' }}>*</Text>
                </Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="person-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="e.g. Ramesh Kumar"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="words"
                  />
                </View>
                <Text style={styles.inputHelper}>
                  ✨ This legal name will be automatically printed on all your course certificates.
                </Text>
              </View>

              {/* WhatsApp / Phone Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone / WhatsApp Number</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="call-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={editPhone}
                    onChangeText={setEditPhone}
                    placeholder="e.g. +91 9876543210"
                    placeholderTextColor="#9ca3af"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Email Address */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="mail-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={editEmail}
                    onChangeText={setEditEmail}
                    placeholder="student@example.com"
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsEditModalVisible(false)}
                disabled={savingProfile}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, savingProfile && { opacity: 0.7 }]}
                onPress={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                    <Text style={styles.modalSaveBtnText}>Save Changes</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  cardEditProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    marginTop: 10,
    marginBottom: 4,
  },
  cardEditProfileText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  editProfileBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 16,
  },
  modalIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  inputHelper: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 15,
  },
  modalActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  modalSaveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  modalSaveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
});
