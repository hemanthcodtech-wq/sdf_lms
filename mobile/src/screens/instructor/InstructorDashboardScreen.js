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
  Modal,
  Alert,
  Linking,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { instructorService } from '../../services/instructorService';
import { getCourseImageUrl } from '../../utils/imageHelper';
import { CustomButton } from '../../components/CustomButton';

const getClassStatus = (cls) => {
  if (cls.status) return cls.status;
  const now = new Date();
  const classDate = new Date(cls.date);

  let startHour = 6, startMin = 0;
  if (cls.time) {
    const parts = cls.time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (parts) {
      let h = parseInt(parts[1], 10);
      const m = parseInt(parts[2], 10);
      const ampm = parts[3] ? parts[3].toUpperCase() : null;
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      startHour = h;
      startMin = m;
    }
  }

  const sessionStart = new Date(classDate);
  sessionStart.setHours(startHour, startMin, 0, 0);
  const duration = cls.durationMinutes || 60;
  const sessionEnd = new Date(sessionStart.getTime() + duration * 60 * 1000);

  if (now > sessionEnd) {
    return 'COMPLETED';
  }
  if (now >= new Date(sessionStart.getTime() - 15 * 60 * 1000) && now <= sessionEnd) {
    return 'LIVE NOW';
  }
  return 'UPCOMING';
};

export const InstructorDashboardScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, logout, updateUserProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('batches'); // 'batches', 'classes', 'materials', 'profile'
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Material Upload Modal State
  const [isMaterialModalVisible, setIsMaterialModalVisible] = useState(false);
  const [materialForm, setMaterialForm] = useState({
    courseId: '',
    topicsCovered: '',
    driveLink: '',
    materialType: 'Recording',
  });
  const [submittingMaterial, setSubmittingMaterial] = useState(false);

  // Edit Profile State
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    bio: '',
    speciality: '',
    experience: '',
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await instructorService.getDashboardStats();
      if (res?.data) {
        setDashboardData(res.data);
        if (res.data.profile) {
          setProfileForm({
            name: res.data.profile.name || '',
            phone: res.data.profile.phone || '',
            bio: res.data.profile.bio || '',
            speciality: res.data.profile.speciality || '',
            experience: res.data.profile.experience || '',
          });
          if (updateUserProfile && res.data.profile.name) {
            updateUserProfile({
              name: res.data.profile.name,
              phone: res.data.profile.phone,
              bio: res.data.profile.bio,
              speciality: res.data.profile.speciality,
              experience: res.data.profile.experience,
            });
          }
        }
      }
    } catch (err) {
      console.error('Error fetching instructor dashboard stats:', err);
      Alert.alert('Error', 'Unable to load instructor dashboard. Please verify your session.');
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
    Alert.alert('Logout', 'Are you sure you want to log out of the Instructor Portal?', [
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

  const handleStartZoom = (zoomUrl) => {
    if (!zoomUrl) {
      Alert.alert('Notice', 'Zoom meeting link has not been configured yet.');
      return;
    }
    // For instructors, open via /s/ (start) instead of /j/ (join) to launch as Host
    let launchUrl = zoomUrl;
    if (launchUrl.includes('/j/')) {
      launchUrl = launchUrl.replace('/j/', '/s/');
    }
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(launchUrl, '_blank');
    } else {
      Linking.openURL(launchUrl).catch(() => {
        Alert.alert('Error', 'Unable to open Zoom application. Please check link validity.');
      });
    }
  };

  const handleCreateMaterial = async () => {
    if (!materialForm.courseId) {
      Alert.alert('Missing Field', 'Please select a batch/course for this material.');
      return;
    }
    if (!materialForm.topicsCovered.trim()) {
      Alert.alert('Missing Field', 'Please enter topics covered / session title.');
      return;
    }
    if (!materialForm.driveLink.trim()) {
      Alert.alert('Missing Field', 'Please enter Google Drive or recording link.');
      return;
    }

    try {
      setSubmittingMaterial(true);
      await instructorService.addCourseMaterial(materialForm.courseId, {
        topicsCovered: materialForm.topicsCovered.trim(),
        driveLink: materialForm.driveLink.trim(),
        materialType: materialForm.materialType,
        date: new Date().toISOString(),
      });
      Alert.alert('Success', 'Class study material / recording published successfully!');
      setIsMaterialModalVisible(false);
      setMaterialForm({
        courseId: '',
        topicsCovered: '',
        driveLink: '',
        materialType: 'Recording',
      });
      await fetchDashboard();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to upload study material.');
    } finally {
      setSubmittingMaterial(false);
    }
  };

  const handleDeleteMaterial = (courseId, materialId) => {
    Alert.alert('Delete Material', 'Are you sure you want to remove this published material?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await instructorService.deleteCourseMaterial(courseId, materialId);
            Alert.alert('Deleted', 'Material removed successfully.');
            await fetchDashboard();
          } catch (e) {
            Alert.alert('Error', 'Unable to delete material.');
          }
        },
      },
    ]);
  };

  const handleUpdateProfile = async () => {
    if (!profileForm.name.trim()) {
      Alert.alert('Missing Field', 'Please enter your full name.');
      return;
    }
    try {
      setUpdatingProfile(true);
      const res = await instructorService.updateProfile(profileForm);
      if (res?.data) {
        setDashboardData((prev) => prev ? {
          ...prev,
          profile: {
            ...(prev.profile || {}),
            ...res.data,
          }
        } : prev);

        if (updateUserProfile) {
          await updateUserProfile({
            name: res.data.name,
            phone: res.data.phone,
            bio: res.data.bio,
            speciality: res.data.speciality,
            experience: res.data.experience,
          });
        }
      }
      Alert.alert('Success', 'Faculty profile updated successfully!');
      await fetchDashboard();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update profile.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const stats = dashboardData?.stats || {
    totalCourses: 0,
    totalClasses: 0,
    upcomingClassesCount: 0,
    totalStudents: 0,
  };
  const assignedCourses = dashboardData?.assignedCourses || [];
  const upcomingClasses = dashboardData?.upcomingClasses || [];
  const allClasses = dashboardData?.allClasses || [];

  const displayClasses = (allClasses && allClasses.length > 0)
    ? allClasses
    : (upcomingClasses || []);
  const realUpcomingCount = displayClasses.filter((c) => getClassStatus(c) !== 'COMPLETED').length;

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? 14 : Math.max(insets.top, 20) }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.brandIconWrap}>
              <Ionicons name="easel" size={22} color="#ffffff" />
            </View>
            <View>
              <View style={styles.badgeRow}>
                <Text style={styles.badgeText}>FACULTY & INSTRUCTOR</Text>
              </View>
              <Text style={styles.instructorName} numberOfLines={1}>
                {dashboardData?.profile?.name || user?.name || profileForm.name || 'Faculty Member'}
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
            <Text style={styles.statNumber}>{stats.totalCourses}</Text>
            <Text style={styles.statLabel}>Batches</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: colors.secondary }]}>
              {stats.upcomingClassesCount !== undefined ? stats.upcomingClassesCount : realUpcomingCount}
            </Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#2563eb' }]}>{stats.totalStudents}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalClasses || displayClasses.length}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
        </View>

        {/* Tab Navigation */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
        >
          {[
            { id: 'batches', label: 'My Batches', icon: 'book-outline' },
            { id: 'classes', label: 'Live Sessions', icon: 'videocam-outline' },
            { id: 'materials', label: 'Upload Materials', icon: 'document-text-outline' },
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.secondary]} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.secondary} />
            <Text style={styles.loadingText}>Loading Instructor Portal...</Text>
          </View>
        ) : activeTab === 'batches' ? (
          /* Tab 1: Assigned Batches */
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Assigned Batches & Courses ({assignedCourses.length})</Text>
            </View>

            {assignedCourses.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="folder-open-outline" size={44} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No Assigned Batches Yet</Text>
                <Text style={styles.emptySubtitle}>
                  You have not been assigned to any course batch yet. Check with admin.
                </Text>
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
                      <Text style={styles.courseCategory}>{c.category || 'Yoga / Wellness'}</Text>
                      <Text style={styles.courseTimings}>⏰ {c.timings || 'Schedule in details'}</Text>
                    </View>
                  </View>

                  <View style={styles.courseMetricsRow}>
                    <View style={styles.metricPill}>
                      <Ionicons name="people" size={14} color="#2563eb" />
                      <Text style={styles.metricPillText}>{c.enrolledStudentsCount} Students</Text>
                    </View>
                    <View style={styles.metricPill}>
                      <Ionicons name="calendar" size={14} color={colors.secondary} />
                      <Text style={styles.metricPillText}>{c.totalSessionsCount} Sessions</Text>
                    </View>
                    <View style={styles.metricPill}>
                      <Ionicons name="document-text" size={14} color="#16a34a" />
                      <Text style={styles.metricPillText}>{c.materials?.length || 0} Materials</Text>
                    </View>
                  </View>

                  {/* Expanded Course Details */}
                  {selectedCourse?._id === c._id && (
                    <View style={styles.expandedDetails}>
                      <View style={styles.divider} />
                      <Text style={styles.expandedHeading}>Moderator Information:</Text>
                      <Text style={styles.expandedText}>
                        {c.moderatorId?.name ? `${c.moderatorId.name} (${c.moderatorId.emailOrPhone || c.moderatorId.phone})` : 'Not assigned specifically'}
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
                          onPress={() => handleStartZoom(c.zoomMeetingLink)}
                        >
                          <Ionicons name="videocam" size={18} color="#ffffff" />
                          <Text style={styles.zoomLaunchBtnText}>Launch Live Zoom Room</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        ) : activeTab === 'classes' ? (
          /* Tab 2: Live Sessions */
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Classroom Timetable & Live Sessions ({displayClasses.length})</Text>
            </View>

            {displayClasses.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="calendar-outline" size={44} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No Live Sessions Scheduled</Text>
                <Text style={styles.emptySubtitle}>Scheduled batch sessions will appear here.</Text>
              </View>
            ) : (
              displayClasses.map((cl, idx) => {
                const status = getClassStatus(cl);
                const isCompleted = status === 'COMPLETED';
                const isLive = status === 'LIVE NOW';

                return (
                  <View key={cl._id || idx} style={[styles.sessionCard, shadows.sm, isCompleted && { opacity: 0.9 }]}>
                    <View style={styles.sessionBadgeRow}>
                      <View style={styles.sessionNumberTag}>
                        <Text style={styles.sessionNumberTagText}>SESSION {cl.sessionNumber || idx + 1}</Text>
                      </View>
                      <View
                        style={[
                          styles.statusPill,
                          isCompleted
                            ? styles.statusPillCompleted
                            : isLive
                            ? styles.statusPillLive
                            : styles.statusPillUpcoming,
                        ]}
                      >
                        {isLive && <View style={styles.pulsingDot} />}
                        <Text
                          style={[
                            styles.statusPillText,
                            isCompleted
                              ? styles.statusPillTextCompleted
                              : isLive
                              ? styles.statusPillTextLive
                              : styles.statusPillTextUpcoming,
                          ]}
                        >
                          {status}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.sessionCardHeader}>
                      <View style={[styles.sessionIconWrap, isCompleted && { backgroundColor: '#f3f4f6' }]}>
                        <Ionicons
                          name={isCompleted ? 'play-circle-outline' : 'videocam'}
                          size={20}
                          color={isCompleted ? '#6b7280' : isLive ? '#16a34a' : colors.secondary}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.sessionTitle}>{cl.title}</Text>
                        <Text style={styles.sessionCourseName}>
                          {cl.courseId?.title || 'Batch Session'}
                        </Text>
                        <Text style={styles.sessionMeta}>
                          📅 {new Date(cl.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} • ⏰ {cl.time || cl.courseId?.startTime || 'Live'} ({cl.durationMinutes || 60}m)
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.hostZoomBtn,
                        isCompleted
                          ? styles.hostZoomBtnCompleted
                          : isLive
                          ? styles.hostZoomBtnLive
                          : styles.hostZoomBtnUpcoming,
                      ]}
                      onPress={() => handleStartZoom(cl.zoomStartUrl || cl.zoomHostUrl || cl.zoomLink || cl.courseId?.zoomMeetingLink)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={isCompleted ? 'play-circle-outline' : 'videocam'}
                        size={16}
                        color={isCompleted ? '#374151' : '#ffffff'}
                      />
                      <Text
                        style={[
                          styles.hostZoomBtnText,
                          isCompleted && { color: '#374151' },
                        ]}
                      >
                        {isCompleted
                          ? 'Replay / Enter Session ↗'
                          : 'Start Session ↗'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        ) : activeTab === 'materials' ? (
          /* Tab 3: Study Materials & Recordings */
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Uploaded Study Materials</Text>
              <TouchableOpacity
                style={styles.addMaterialBtn}
                onPress={() => {
                  if (assignedCourses.length > 0) {
                    setMaterialForm((prev) => ({ ...prev, courseId: assignedCourses[0]._id }));
                  }
                  setIsMaterialModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={18} color="#ffffff" />
                <Text style={styles.addMaterialBtnText}>Upload New</Text>
              </TouchableOpacity>
            </View>

            {assignedCourses.every((c) => !c.materials || c.materials.length === 0) ? (
              <View style={styles.emptyCard}>
                <Ionicons name="cloud-upload-outline" size={44} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No Materials Uploaded Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Publish Google Drive links, Zoom recordings, or PDF notes for your students.
                </Text>
              </View>
            ) : (
              assignedCourses.map((c) =>
                c.materials && c.materials.length > 0 ? (
                  <View key={c._id} style={styles.materialCourseBlock}>
                    <Text style={styles.materialCourseHeader}>📚 {c.title}</Text>
                    {c.materials.map((m) => (
                      <View key={m._id} style={[styles.materialCard, shadows.sm]}>
                        <View style={styles.materialIcon}>
                          <Ionicons
                            name={m.materialType === 'Recording' ? 'film-outline' : 'document-text-outline'}
                            size={22}
                            color={colors.secondary}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.materialTitle}>{m.topicsCovered}</Text>
                          <Text style={styles.materialMeta}>
                            {m.materialType} • {new Date(m.date).toLocaleDateString('en-IN')}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.openLinkBtn}
                          onPress={() => Linking.openURL(m.driveLink)}
                        >
                          <Ionicons name="open-outline" size={18} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteMaterialBtn}
                          onPress={() => handleDeleteMaterial(c._id, m._id)}
                        >
                          <Ionicons name="trash-outline" size={18} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ) : null
              )
            )}
          </View>
        ) : (
          /* Tab 4: Faculty Profile */
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Faculty Information</Text>
            <View style={[styles.profileCard, shadows.sm]}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={profileForm.name}
                onChangeText={(text) => setProfileForm((p) => ({ ...p, name: text }))}
                placeholder="Faculty Name"
              />

              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={profileForm.phone}
                onChangeText={(text) => setProfileForm((p) => ({ ...p, phone: text }))}
                placeholder="Phone Number"
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>Speciality / Area of Expertise</Text>
              <TextInput
                style={styles.input}
                value={profileForm.speciality}
                onChangeText={(text) => setProfileForm((p) => ({ ...p, speciality: text }))}
                placeholder="e.g. Hatha Yoga, Pranayama, Meditation"
              />

              <Text style={styles.inputLabel}>Experience</Text>
              <TextInput
                style={styles.input}
                value={profileForm.experience}
                onChangeText={(text) => setProfileForm((p) => ({ ...p, experience: text }))}
                placeholder="e.g. 8+ Years Certified Master"
              />

              <Text style={styles.inputLabel}>About / Bio</Text>
              <TextInput
                style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
                value={profileForm.bio}
                onChangeText={(text) => setProfileForm((p) => ({ ...p, bio: text }))}
                placeholder="Short bio about teaching philosophy"
                multiline
              />

              <CustomButton
                title="Save Profile Updates"
                onPress={handleUpdateProfile}
                loading={updatingProfile}
                variant="secondary"
                size="md"
                style={{ marginTop: 12 }}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Upload Material Modal */}
      <Modal visible={isMaterialModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, shadows.lg]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Publish Study Material</Text>
              <TouchableOpacity onPress={() => setIsMaterialModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Select Batch / Course</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {assignedCourses.map((c) => (
                <TouchableOpacity
                  key={c._id}
                  style={[
                    styles.courseSelectChip,
                    materialForm.courseId === c._id && styles.courseSelectChipActive,
                  ]}
                  onPress={() => setMaterialForm((p) => ({ ...p, courseId: c._id }))}
                >
                  <Text
                    style={[
                      styles.courseSelectChipText,
                      materialForm.courseId === c._id && styles.courseSelectChipTextActive,
                    ]}
                  >
                    {c.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Topic / Session Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Pranayama Breathwork Session 1 Recording"
              value={materialForm.topicsCovered}
              onChangeText={(text) => setMaterialForm((p) => ({ ...p, topicsCovered: text }))}
            />

            <Text style={styles.inputLabel}>Google Drive / Recording Link *</Text>
            <TextInput
              style={styles.input}
              placeholder="https://drive.google.com/..."
              value={materialForm.driveLink}
              onChangeText={(text) => setMaterialForm((p) => ({ ...p, driveLink: text }))}
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Material Type</Text>
            <View style={styles.typeSelectorRow}>
              {['Recording', 'Notes / PDF', 'Resource'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeChip,
                    materialForm.materialType === type && styles.typeChipActive,
                  ]}
                  onPress={() => setMaterialForm((p) => ({ ...p, materialType: type }))}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      materialForm.materialType === type && styles.typeChipTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <CustomButton
              title="Publish to Students"
              onPress={handleCreateMaterial}
              loading={submittingMaterial}
              variant="secondary"
              size="lg"
              style={{ marginTop: 16 }}
            />
          </View>
        </View>
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
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    backgroundColor: 'rgba(234, 122, 40, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.secondary,
    letterSpacing: 0.5,
  },
  instructorName: {
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
    backgroundColor: colors.secondary,
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
  courseCategory: {
    fontSize: 12,
    color: colors.secondary,
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
    backgroundColor: colors.secondary,
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
  sessionBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  sessionNumberTag: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  sessionNumberTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065f46',
    letterSpacing: 0.5,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusPillCompleted: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statusPillLive: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  statusPillUpcoming: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusPillTextCompleted: {
    color: '#6b7280',
  },
  statusPillTextLive: {
    color: '#15803d',
  },
  statusPillTextUpcoming: {
    color: '#b45309',
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
  },
  sessionCardHeader: {
    flexDirection: 'row',
    gap: 10,
  },
  sessionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(234, 122, 40, 0.12)',
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
    color: colors.secondary,
    fontWeight: '600',
    marginTop: 1,
  },
  sessionMeta: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 3,
  },
  hostZoomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  hostZoomBtnCompleted: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  hostZoomBtnLive: {
    backgroundColor: '#16a34a',
  },
  hostZoomBtnUpcoming: {
    backgroundColor: colors.secondary,
  },
  hostZoomBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  addMaterialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addMaterialBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  materialCourseBlock: {
    gap: 8,
    marginBottom: 10,
  },
  materialCourseHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryDark,
    marginTop: 4,
  },
  materialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 10,
  },
  materialIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(234, 122, 40, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  materialMeta: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  openLinkBtn: {
    padding: 6,
  },
  deleteMaterialBtn: {
    padding: 6,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  courseSelectChip: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginRight: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  courseSelectChipActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  courseSelectChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  courseSelectChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  typeChip: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  typeChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
