import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  TextInput,
  Alert,
  Linking,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { moderatorService } from '../../services/moderatorService';
import { getCourseImageUrl } from '../../utils/imageHelper';
import { CustomButton } from '../../components/CustomButton';

export const ModeratorDashboardScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, logout, updateUserProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('courses'); // 'courses', 'sessions', 'students', 'profile'
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Edit Profile State
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    bio: '',
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await moderatorService.getDashboardStats();
      if (res?.data) {
        setDashboardData(res.data);
        if (res.data.profile) {
          setProfileForm({
            name: res.data.profile.name || '',
            phone: res.data.profile.phone || '',
            bio: res.data.profile.bio || '',
          });
          if (updateUserProfile && res.data.profile.name) {
            updateUserProfile({
              name: res.data.profile.name,
              phone: res.data.profile.phone,
              bio: res.data.profile.bio,
            });
          }
        }
      }
    } catch (err) {
      console.error('Error fetching moderator dashboard stats:', err);
      Alert.alert('Error', 'Unable to load moderator dashboard. Please verify your session.');
    } finally {
      setLoading(false);
    }
  }, [updateUserProfile]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out of the Moderator Portal?', [
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
  };

  const handleOpenZoom = (zoomUrl) => {
    if (!zoomUrl) {
      Alert.alert('Notice', 'Zoom link is not configured for this batch session.');
      return;
    }
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(zoomUrl, '_blank');
    } else {
      Linking.openURL(zoomUrl).catch(() => {
        Alert.alert('Error', 'Unable to open Zoom application.');
      });
    }
  };

  const handleUpdateProfile = async () => {
    if (!profileForm.name.trim()) {
      Alert.alert('Missing Field', 'Please enter your full name.');
      return;
    }
    try {
      setUpdatingProfile(true);
      const res = await moderatorService.updateProfile(profileForm);
      if (res?.data && updateUserProfile) {
        await updateUserProfile({
          name: res.data.name,
          phone: res.data.phone,
          bio: res.data.bio,
        });
      }
      Alert.alert('Success', 'Moderator profile updated successfully!');
      await fetchDashboard();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update profile.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const stats = dashboardData?.stats || {
    totalUsers: 0,
    totalInstructors: 0,
    totalCourses: 0,
    totalEnrollments: 0,
  };
  const assignedCourses = dashboardData?.assignedCourses || [];
  const upcomingSessions = dashboardData?.upcomingSessions || [];
  const recentStudents = dashboardData?.recentStudents || [];

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? 14 : Math.max(insets.top, 20) }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.brandIconWrap}>
              <Ionicons name="shield-checkmark" size={22} color="#ffffff" />
            </View>
            <View>
              <View style={styles.badgeRow}>
                <Text style={styles.badgeText}>BATCH MODERATOR</Text>
              </View>
              <Text style={styles.moderatorName} numberOfLines={1}>
                {dashboardData?.profile?.name || user?.name || profileForm.name || 'Moderator Admin'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>

        {/* Top Metric Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#2563eb' }]}>{stats.totalUsers || 0}</Text>
            <Text style={styles.statLabel}>Learners</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: colors.secondary }]}>
              {stats.totalInstructors || 0}
            </Text>
            <Text style={styles.statLabel}>Faculty</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: colors.primaryDark }]}>
              {stats.assignedCoursesCount !== undefined ? stats.assignedCoursesCount : assignedCourses.length}
            </Text>
            <Text style={styles.statLabel}>Batches</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#16a34a' }]}>{stats.totalEnrollments || 0}</Text>
            <Text style={styles.statLabel}>Enrollments</Text>
          </View>
        </View>

        {/* Tab Navigation */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
        >
          {[
            { id: 'courses', label: 'Active Batches', icon: 'grid-outline' },
            { id: 'sessions', label: 'Live Monitoring', icon: 'videocam-outline' },
            { id: 'students', label: 'Registered Students', icon: 'people-outline' },
            { id: 'profile', label: 'Profile', icon: 'person-outline' },
          ].map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.tabChip, activeTab === t.id && styles.tabChipActive]}
              onPress={() => setActiveTab(t.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={t.icon}
                size={16}
                color={activeTab === t.id ? '#ffffff' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabChipText,
                  activeTab === t.id && styles.tabChipTextActive,
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Content Area */}
      <ScrollView
        contentContainerStyle={[styles.contentArea, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Loading Moderator Portal...</Text>
          </View>
        ) : activeTab === 'courses' ? (
          /* Tab 1: Active Batches */
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Batches & Cohort Review ({assignedCourses.length})</Text>
            </View>

            {assignedCourses.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="school-outline" size={44} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No Batches Found</Text>
                <Text style={styles.emptySubtitle}>There are currently no active course batches configured.</Text>
              </View>
            ) : (
              assignedCourses.map((c) => (
                <TouchableOpacity
                  key={c._id}
                  style={[styles.courseCard, shadows.sm]}
                  activeOpacity={0.9}
                  onPress={() => setSelectedCourse(selectedCourse?._id === c._id ? null : c)}
                >
                  <View style={styles.courseCardTop}>
                    <Image
                      source={{ uri: getCourseImageUrl(c.thumbnailUrl) }}
                      style={styles.courseThumb}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.courseTitle} numberOfLines={2}>{c.title}</Text>
                      <Text style={styles.instructorTag}>
                        👨‍🏫 Faculty: {c.instructorId?.name || c.instructor || 'Assigned Instructor'}
                      </Text>
                      <Text style={styles.courseTimings}>⏰ {c.timings || 'Schedule in batch details'}</Text>
                    </View>
                  </View>

                  <View style={styles.courseMetricsRow}>
                    <View style={styles.metricPill}>
                      <Ionicons name="people" size={14} color="#2563eb" />
                      <Text style={styles.metricPillText}>{c.enrolledStudentsCount} Learners</Text>
                    </View>
                    <View style={styles.metricPill}>
                      <Ionicons name="calendar" size={14} color={colors.secondary} />
                      <Text style={styles.metricPillText}>{c.totalSessionsCount} Live Sessions</Text>
                    </View>
                  </View>

                  {/* Expanded Course Info */}
                  {selectedCourse?._id === c._id && (
                    <View style={styles.expandedDetails}>
                      <View style={styles.divider} />
                      <Text style={styles.expandedHeading}>Assigned Faculty Details:</Text>
                      <Text style={styles.expandedText}>
                        {c.instructorId?.name || c.instructor || 'Faculty Master'} {c.instructorId?.phone ? `(${c.instructorId.phone})` : ''}
                      </Text>

                      {c.whatsappGroupLink ? (
                        <TouchableOpacity
                          style={styles.whatsappBtn}
                          onPress={() => Linking.openURL(c.whatsappGroupLink)}
                        >
                          <Ionicons name="logo-whatsapp" size={18} color="#ffffff" />
                          <Text style={styles.whatsappBtnText}>Open Batch WhatsApp Group</Text>
                        </TouchableOpacity>
                      ) : null}

                      {c.zoomMeetingLink ? (
                        <TouchableOpacity
                          style={styles.zoomLaunchBtn}
                          onPress={() => handleOpenZoom(c.zoomMeetingLink)}
                        >
                          <Ionicons name="videocam" size={18} color="#ffffff" />
                          <Text style={styles.zoomLaunchBtnText}>Join / Monitor Live Class</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        ) : activeTab === 'sessions' ? (
          /* Tab 2: Live Monitoring */
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Upcoming Sessions & Class Attendance ({upcomingSessions.length})</Text>
            </View>

            {upcomingSessions.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="videocam-outline" size={44} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No Live Sessions Right Now</Text>
                <Text style={styles.emptySubtitle}>Upcoming batches will appear here as schedules approach.</Text>
              </View>
            ) : (
              upcomingSessions.map((s) => (
                <View key={s._id} style={[styles.sessionCard, shadows.sm]}>
                  <View style={styles.sessionCardHeader}>
                    <View style={styles.sessionIconWrap}>
                      <Ionicons name="videocam" size={20} color="#2563eb" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sessionTitle}>{s.title}</Text>
                      <Text style={styles.sessionCourseName}>{s.courseId?.title || 'Cohort Batch'}</Text>
                      <Text style={styles.sessionMeta}>
                        📅 {new Date(s.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} • ⏰ {s.time || 'Live'}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.monitorZoomBtn}
                    onPress={() => handleOpenZoom(s.zoomLink || s.courseId?.zoomMeetingLink)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="eye-outline" size={16} color="#ffffff" />
                    <Text style={styles.monitorZoomBtnText}>Enter Room to Monitor Session</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        ) : activeTab === 'students' ? (
          /* Tab 3: Registered Students */
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recently Registered Learners ({recentStudents.length})</Text>
            </View>

            {recentStudents.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="people-outline" size={44} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No Recent Registrations</Text>
                <Text style={styles.emptySubtitle}>Student profiles will appear here upon registration.</Text>
              </View>
            ) : (
              recentStudents.map((st) => (
                <View key={st._id} style={[styles.studentCard, shadows.sm]}>
                  <View style={styles.studentAvatar}>
                    <Text style={styles.studentAvatarText}>
                      {st.name ? st.name.charAt(0).toUpperCase() : 'S'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.studentName}>{st.name || 'Registered Learner'}</Text>
                    <Text style={styles.studentContact}>{st.emailOrPhone || st.phone || 'No email'}</Text>
                    <Text style={styles.studentDate}>
                      Joined: {new Date(st.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                  <View style={styles.activePill}>
                    <Text style={styles.activePillText}>Active</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : (
          /* Tab 4: Moderator Profile */
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Moderator Profile</Text>
            <View style={[styles.profileCard, shadows.sm]}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={profileForm.name}
                onChangeText={(text) => setProfileForm((p) => ({ ...p, name: text }))}
                placeholder="Moderator Name"
              />

              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={profileForm.phone}
                onChangeText={(text) => setProfileForm((p) => ({ ...p, phone: text }))}
                placeholder="Phone Number"
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>Role Description / Notes</Text>
              <TextInput
                style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
                value={profileForm.bio}
                onChangeText={(text) => setProfileForm((p) => ({ ...p, bio: text }))}
                placeholder="Moderator responsibilities and batch notes"
                multiline
              />

              <CustomButton
                title="Save Moderator Profile"
                onPress={handleUpdateProfile}
                loading={updatingProfile}
                variant="primary"
                size="md"
                style={{ marginTop: 12, backgroundColor: '#2563eb' }}
              />
            </View>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  brandIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2563eb',
    letterSpacing: 0.5,
  },
  moderatorName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  logoutBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  tabScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
  },
  tabChipActive: {
    backgroundColor: '#2563eb',
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabChipTextActive: {
    color: '#ffffff',
  },
  contentArea: {
    padding: 16,
  },
  section: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  courseCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  courseCardTop: {
    flexDirection: 'row',
    gap: 12,
  },
  courseThumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  instructorTag: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
    marginTop: 2,
  },
  courseTimings: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  courseMetricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metricPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  expandedDetails: {
    marginTop: 10,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 8,
  },
  expandedHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  expandedText: {
    fontSize: 13,
    color: colors.textPrimary,
    marginTop: 2,
    marginBottom: 10,
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    paddingVertical: 9,
    borderRadius: 10,
    marginBottom: 8,
  },
  whatsappBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  zoomLaunchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    paddingVertical: 9,
    borderRadius: 10,
  },
  zoomLaunchBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  sessionCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 12,
  },
  sessionCardHeader: {
    flexDirection: 'row',
    gap: 10,
  },
  sessionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sessionCourseName: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
    marginTop: 1,
  },
  sessionMeta: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 3,
  },
  monitorZoomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    borderRadius: 10,
  },
  monitorZoomBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 12,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563eb',
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  studentContact: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  studentDate: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  activePill: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: colors.textPrimary,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  loadingContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 10,
  },
});
