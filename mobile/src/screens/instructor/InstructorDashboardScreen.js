import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  useWindowDimensions,
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
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 600;
  const horizontalSafe = Math.max(insets.left, insets.right, isTablet ? 24 : 16);
  const bottomSafe = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 20);

  const { user, logout, updateUserProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('batches'); // 'batches', 'students', 'classes', 'materials', 'profile'
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Student search & filter state
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState('ALL');

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

  // Edit WhatsApp Link Modal State
  const [isWhatsappModalVisible, setIsWhatsappModalVisible] = useState(false);
  const [whatsappCourse, setWhatsappCourse] = useState(null);
  const [whatsappInput, setWhatsappInput] = useState('');
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);

  const fetchDashboard = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent && !dashboardData) {
        setLoading(true);
      }
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
        }
      }
    } catch (err) {
      console.error('Error fetching instructor dashboard stats:', err);
      if (!dashboardData) {
        Alert.alert('Error', 'Unable to load instructor dashboard. Please verify your session.');
      }
    } finally {
      setLoading(false);
    }
  }, [dashboardData]);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard(true);
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

  const handleOpenWhatsappModal = (course) => {
    setWhatsappCourse(course);
    setWhatsappInput(course?.whatsappGroupLink || '');
    setIsWhatsappModalVisible(true);
  };

  const handleSaveWhatsappLink = async () => {
    if (!whatsappCourse?._id) return;
    try {
      setSavingWhatsapp(true);
      const res = await instructorService.updateCourseWhatsappLink(whatsappCourse._id, whatsappInput);
      if (res?.success) {
        Alert.alert('Success', 'Official WhatsApp group/channel link updated successfully! Enrolled students will now see this link to join.');
        setIsWhatsappModalVisible(false);
        if (selectedCourse?._id === whatsappCourse._id) {
          setSelectedCourse({ ...selectedCourse, whatsappGroupLink: whatsappInput.trim() });
        }
        await fetchDashboard(true);
      }
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || err.message || 'Failed to update WhatsApp link');
    } finally {
      setSavingWhatsapp(false);
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

  const allEnrolledStudents = useMemo(() => {
    if (dashboardData?.allStudents && dashboardData.allStudents.length > 0) {
      return dashboardData.allStudents;
    }
    const list = [];
    assignedCourses.forEach(c => {
      if (c.students && Array.isArray(c.students)) {
        c.students.forEach(s => {
          list.push({ ...s, courseTitle: c.title, courseCategory: c.category });
        });
      }
    });
    return list;
  }, [dashboardData, assignedCourses]);

  const filteredStudents = useMemo(() => {
    let list = allEnrolledStudents;
    if (selectedBatchFilter !== 'ALL') {
      list = list.filter(s => {
        const cId = s.course?._id || s.course;
        return cId?.toString() === selectedBatchFilter.toString();
      });
    }
    if (studentSearch.trim()) {
      const q = studentSearch.trim().toLowerCase();
      list = list.filter(s => {
        const name = (s.studentName || '').toLowerCase();
        const email = (s.studentEmail || '').toLowerCase();
        const phone = (s.studentPhone || '').toLowerCase();
        return name.includes(q) || email.includes(q) || phone.includes(q);
      });
    }
    return list;
  }, [allEnrolledStudents, selectedBatchFilter, studentSearch]);

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Platform.OS === 'web' ? 14 : Math.max(insets.top, 20),
            paddingLeft: horizontalSafe,
            paddingRight: horizontalSafe,
          },
        ]}
      >
        <View style={styles.responsiveContainer}>
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
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => setActiveTab('students')}
              activeOpacity={0.8}
            >
              <Text style={[styles.statNumber, { color: '#2563eb' }]}>
                {stats.totalStudents || allEnrolledStudents.length}
              </Text>
              <Text style={styles.statLabel}>Students</Text>
            </TouchableOpacity>
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
              { id: 'students', label: `Students (${stats.totalStudents || allEnrolledStudents.length})`, icon: 'people-outline' },
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
      </View>

      {/* Main Content Area */}
      <ScrollView
        contentContainerStyle={[
          styles.contentArea,
          {
            paddingBottom: bottomSafe + 30,
            paddingLeft: horizontalSafe,
            paddingRight: horizontalSafe,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.secondary]} />
        }
      >
        <View style={styles.responsiveContainer}>
          {(!dashboardData && loading) ? (
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
                        source={{
                          uri: getCourseImageUrl(c.thumbnail || c.thumbnailUrl || c.image),
                          cache: 'force-cache',
                        }}
                        style={styles.courseThumb}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.courseTitle} numberOfLines={2}>{c.title}</Text>
                        <Text style={styles.courseCategory}>{c.category || 'Yoga / Wellness'}</Text>
                        <Text style={styles.courseTimings}>⏰ {c.timings || 'Schedule in details'}</Text>
                      </View>
                    </View>

                    <View style={styles.courseMetricsRow}>
                      <TouchableOpacity
                        style={[styles.metricPill, { backgroundColor: '#eff6ff' }]}
                        onPress={() => {
                          setSelectedBatchFilter(c._id);
                          setActiveTab('students');
                        }}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="people" size={14} color="#2563eb" />
                        <Text style={[styles.metricPillText, { color: '#1d4ed8', fontWeight: '800' }]}>
                          {c.students?.length || c.enrolledStudentsCount || 0} Students ↗
                        </Text>
                      </TouchableOpacity>
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

                        {/* Official Batch WhatsApp Group / Channel Link */}
                        <View style={styles.whatsappCardContainer}>
                          <View style={styles.whatsappHeaderRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                              <Ionicons name="logo-whatsapp" size={16} color="#16a34a" />
                              <Text style={styles.whatsappCardTitle}>Batch WhatsApp Community:</Text>
                            </View>
                            <TouchableOpacity
                              style={styles.editWhatsappChip}
                              onPress={() => handleOpenWhatsappModal(c)}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="create-outline" size={13} color="#0d5c31" />
                              <Text style={styles.editWhatsappChipText}>
                                {c.whatsappGroupLink ? 'Change' : '+ Add'}
                              </Text>
                            </TouchableOpacity>
                          </View>

                          {c.whatsappGroupLink ? (
                            <TouchableOpacity
                              style={styles.whatsappBtn}
                              onPress={() => Linking.openURL(c.whatsappGroupLink)}
                              activeOpacity={0.85}
                            >
                              <Ionicons name="logo-whatsapp" size={16} color="#ffffff" />
                              <Text style={styles.whatsappBtnText} numberOfLines={1}>Open Batch WhatsApp Group</Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              style={styles.addWhatsappBtn}
                              onPress={() => handleOpenWhatsappModal(c)}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="add-circle-outline" size={15} color="#0d5c31" />
                              <Text style={styles.addWhatsappBtnText}>Set WhatsApp Channel / Group Link</Text>
                            </TouchableOpacity>
                          )}
                        </View>

                        {/* Enrolled Students Preview for this batch */}
                        <View style={styles.studentsBatchSection}>
                          <View style={styles.studentsBatchHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Ionicons name="people" size={16} color="#2563eb" />
                              <Text style={styles.studentsBatchTitle}>
                                Enrolled Students ({c.students?.length || c.enrolledStudentsCount || 0})
                              </Text>
                            </View>
                            <TouchableOpacity
                              onPress={() => {
                                setSelectedBatchFilter(c._id);
                                setActiveTab('students');
                              }}
                              style={styles.viewAllStudentsChip}
                              activeOpacity={0.8}
                            >
                              <Text style={styles.viewAllStudentsChipText}>View Roster ↗</Text>
                            </TouchableOpacity>
                          </View>

                          {c.students && c.students.length > 0 ? (
                            <View style={{ gap: 8, marginTop: 8 }}>
                              {c.students.slice(0, 4).map((st, sIdx) => {
                                const initials = (st.studentName || 'Student')
                                  .split(' ')
                                  .map(p => p[0])
                                  .slice(0, 2)
                                  .join('')
                                  .toUpperCase() || 'ST';
                                const cleanPhone = (st.studentPhone || '').replace(/\D/g, '');
                                const waNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

                                return (
                                  <View key={st._id || sIdx} style={styles.miniStudentCard}>
                                    <View style={styles.miniStudentAvatar}>
                                      <Text style={styles.miniStudentAvatarText}>{initials}</Text>
                                    </View>
                                    <View style={{ flex: 1, minWidth: 0 }}>
                                      <Text style={styles.miniStudentName} numberOfLines={1}>
                                        {st.studentName || 'Student Learner'}
                                      </Text>
                                      <Text style={styles.miniStudentEmail} numberOfLines={1}>
                                        {st.studentEmail}
                                      </Text>
                                      {st.studentPhone ? (
                                        <Text style={styles.miniStudentPhone}>
                                          📞 {st.studentPhone}
                                        </Text>
                                      ) : null}
                                      <View style={styles.miniProgressBarTrack}>
                                        <View style={[styles.miniProgressBarFill, { width: `${Math.min(100, Math.max(0, st.progress || 0))}%` }]} />
                                      </View>
                                    </View>
                                    <View style={styles.miniStudentActions}>
                                      {st.studentPhone ? (
                                        <>
                                          <TouchableOpacity
                                            style={styles.miniActionBtnCall}
                                            onPress={() => Linking.openURL(`tel:${st.studentPhone}`)}
                                            activeOpacity={0.8}
                                          >
                                            <Ionicons name="call" size={12} color="#ffffff" />
                                          </TouchableOpacity>
                                          <TouchableOpacity
                                            style={styles.miniActionBtnWa}
                                            onPress={() => Linking.openURL(`https://wa.me/${waNumber}`)}
                                            activeOpacity={0.8}
                                          >
                                            <Ionicons name="logo-whatsapp" size={13} color="#ffffff" />
                                          </TouchableOpacity>
                                        </>
                                      ) : (
                                        <TouchableOpacity
                                          style={styles.miniActionBtnMail}
                                          onPress={() => Linking.openURL(`mailto:${st.studentEmail}`)}
                                          activeOpacity={0.8}
                                        >
                                          <Ionicons name="mail" size={12} color="#ffffff" />
                                        </TouchableOpacity>
                                      )}
                                    </View>
                                  </View>
                                );
                              })}
                              {c.students.length > 4 && (
                                <TouchableOpacity
                                  style={styles.seeMoreStudentsBtn}
                                  onPress={() => {
                                    setSelectedBatchFilter(c._id);
                                    setActiveTab('students');
                                  }}
                                  activeOpacity={0.8}
                                >
                                  <Text style={styles.seeMoreStudentsText}>
                                    + {c.students.length - 4} more learners (Tap to view full roster)
                                  </Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          ) : (
                            <Text style={styles.noStudentsText}>
                              No student details loaded yet for this batch.
                            </Text>
                          )}
                        </View>

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
          ) : activeTab === 'students' ? (
            /* Tab: Dedicated Enrolled Student Roster */
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Enrolled Student Roster</Text>
                  <Text style={styles.sectionSubtitle}>
                    Learner profiles, course progress, and quick Call / WhatsApp actions
                  </Text>
                </View>
                <View style={styles.studentCountBadge}>
                  <Text style={styles.studentCountBadgeText}>
                    {filteredStudents.length} Students
                  </Text>
                </View>
              </View>

              {/* Batch Filter Chips */}
              {assignedCourses.length > 1 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterChipScroll}
                >
                  <TouchableOpacity
                    style={[styles.filterChip, selectedBatchFilter === 'ALL' && styles.filterChipActive]}
                    onPress={() => setSelectedBatchFilter('ALL')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.filterChipText, selectedBatchFilter === 'ALL' && styles.filterChipTextActive]}>
                      All Batches ({allEnrolledStudents.length})
                    </Text>
                  </TouchableOpacity>
                  {assignedCourses.map((c) => (
                    <TouchableOpacity
                      key={c._id}
                      style={[styles.filterChip, selectedBatchFilter === c._id && styles.filterChipActive]}
                      onPress={() => setSelectedBatchFilter(c._id)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.filterChipText, selectedBatchFilter === c._id && styles.filterChipTextActive]} numberOfLines={1}>
                        {c.title} ({c.students?.length || c.enrolledStudentsCount || 0})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* Search Bar */}
              <View style={styles.searchBarContainer}>
                <Ionicons name="search" size={16} color={colors.textMuted} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search student by name, email, or phone..."
                  placeholderTextColor={colors.textMuted}
                  value={studentSearch}
                  onChangeText={setStudentSearch}
                  returnKeyType="search"
                />
                {studentSearch ? (
                  <TouchableOpacity onPress={() => setStudentSearch('')} style={styles.clearSearchBtn}>
                    <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Students List */}
              {filteredStudents.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="people-outline" size={44} color={colors.textMuted} />
                  <Text style={styles.emptyTitle}>No Students Found</Text>
                  <Text style={styles.emptySubtitle}>
                    {studentSearch ? `No student matches "${studentSearch}"` : 'No learners enrolled in this batch yet.'}
                  </Text>
                </View>
              ) : (
                <View style={styles.studentGrid}>
                  {filteredStudents.map((st, idx) => {
                    const initials = (st.studentName || 'Student')
                      .split(' ')
                      .map(p => p[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase() || 'ST';
                    const cleanPhone = (st.studentPhone || '').replace(/\D/g, '');
                    const waNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                    const enrolledDate = st.createdAt || st.enrolledAt;

                    return (
                      <View key={st._id || idx} style={[styles.fullStudentCard, shadows.sm]}>
                        <View style={styles.fullStudentTopRow}>
                          <View style={styles.fullStudentAvatar}>
                            <Text style={styles.fullStudentAvatarText}>{initials}</Text>
                          </View>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <Text style={styles.fullStudentName} numberOfLines={1}>
                                {st.studentName || 'Enrolled Student'}
                              </Text>
                              <View style={styles.learnerNumBadge}>
                                <Text style={styles.learnerNumText}>Learner #{idx + 1}</Text>
                              </View>
                              {st.amountPaid > 0 && (
                                <View style={styles.paidBadge}>
                                  <Text style={styles.paidBadgeText}>₹{st.amountPaid} Paid</Text>
                                </View>
                              )}
                            </View>
                            {st.courseTitle ? (
                              <Text style={styles.fullStudentBatch} numberOfLines={1}>
                                📚 {st.courseTitle}
                              </Text>
                            ) : null}
                          </View>
                        </View>

                        {/* Contact Info Row */}
                        <View style={styles.fullStudentContactRow}>
                          <TouchableOpacity
                            style={styles.contactChip}
                            onPress={() => Linking.openURL(`mailto:${st.studentEmail}`)}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="mail" size={13} color={colors.textSecondary} />
                            <Text style={styles.contactChipText} numberOfLines={1}>{st.studentEmail}</Text>
                          </TouchableOpacity>

                          {st.studentPhone ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <TouchableOpacity
                                style={styles.contactChip}
                                onPress={() => Linking.openURL(`tel:${st.studentPhone}`)}
                                activeOpacity={0.8}
                              >
                                <Ionicons name="call" size={13} color={colors.textSecondary} />
                                <Text style={styles.contactChipText}>{st.studentPhone}</Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={styles.whatsappActionChip}
                                onPress={() => Linking.openURL(`https://wa.me/${waNumber}`)}
                                activeOpacity={0.85}
                              >
                                <Ionicons name="logo-whatsapp" size={14} color="#ffffff" />
                                <Text style={styles.whatsappActionText}>WhatsApp</Text>
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <Text style={styles.noPhoneNotice}>No phone number registered</Text>
                          )}
                        </View>

                        {/* Progress and Date Footer */}
                        <View style={styles.fullStudentFooter}>
                          <View style={{ flex: 1, marginRight: 12 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                              <Text style={styles.progressLabel}>Course Progress</Text>
                              <Text style={styles.progressPercentText}>{st.progress || 0}%</Text>
                            </View>
                            <View style={styles.fullProgressBarTrack}>
                              <View style={[styles.fullProgressBarFill, { width: `${Math.min(100, Math.max(0, st.progress || 0))}%` }]} />
                            </View>
                          </View>

                          {enrolledDate ? (
                            <Text style={styles.enrolledDateText}>
                              📅 {new Date(enrolledDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                </View>
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
        </View>
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

      {/* Update WhatsApp Channel Link Modal */}
      <Modal visible={isWhatsappModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, shadows.lg]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="logo-whatsapp" size={22} color="#16a34a" />
                <Text style={styles.modalTitle}>Batch WhatsApp Link</Text>
              </View>
              <TouchableOpacity onPress={() => setIsWhatsappModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Course</Text>
            <Text style={[styles.courseTimings, { marginBottom: 12, fontWeight: '700', color: colors.textPrimary }]}>
              {whatsappCourse?.title}
            </Text>

            <Text style={styles.inputLabel}>Official WhatsApp Group / Channel URL *</Text>
            <TextInput
              style={styles.input}
              placeholder="https://chat.whatsapp.com/... or channel link"
              value={whatsappInput}
              onChangeText={setWhatsappInput}
              autoCapitalize="none"
              keyboardType="url"
            />
            <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4, marginBottom: 16 }}>
              Enrolled students will see this WhatsApp link in their classroom portal & confirmation email to join the batch community.
            </Text>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#f3f4f6', alignItems: 'center' }}
                onPress={() => setIsWhatsappModalVisible(false)}
              >
                <Text style={{ color: '#4b5563', fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 2, paddingVertical: 12, borderRadius: 12, backgroundColor: '#16a34a', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
                onPress={handleSaveWhatsappLink}
                disabled={savingWhatsapp}
              >
                {savingWhatsapp ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={16} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '700' }}>Save WhatsApp Link</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
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
  responsiveContainer: {
    width: '100%',
    maxWidth: 1080,
    alignSelf: 'center',
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
  whatsappCardContainer: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 14,
    padding: 12,
    marginTop: 4,
    marginBottom: 10,
    gap: 10,
  },
  whatsappHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  whatsappCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  editWhatsappChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  editWhatsappChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0d5c31',
  },
  addWhatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#16a34a',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  addWhatsappBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0d5c31',
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    paddingVertical: 9,
    borderRadius: 10,
    marginBottom: 4,
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

  // Batch enrolled students preview styles
  studentsBatchSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  studentsBatchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  studentsBatchTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  viewAllStudentsChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
  },
  viewAllStudentsChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  miniStudentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  miniStudentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0d5c31',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniStudentAvatarText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  miniStudentName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  miniStudentEmail: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  miniStudentPhone: {
    fontSize: 11,
    color: '#0d5c31',
    fontWeight: '600',
    marginTop: 1,
  },
  miniProgressBarTrack: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  miniProgressBarFill: {
    height: '100%',
    backgroundColor: '#16a34a',
    borderRadius: 2,
  },
  miniStudentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniActionBtnCall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniActionBtnWa: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniActionBtnMail: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeMoreStudentsBtn: {
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    marginTop: 4,
  },
  seeMoreStudentsText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  noStudentsText: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },

  // Dedicated Students Roster Tab styles
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  studentCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  studentCountBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#166534',
  },
  filterChipScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  filterChipActive: {
    backgroundColor: '#0d5c31',
    borderColor: '#0d5c31',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    height: 44,
    marginVertical: 4,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  studentGrid: {
    gap: 12,
  },
  fullStudentCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 12,
  },
  fullStudentTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fullStudentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0d5c31',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullStudentAvatarText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  fullStudentName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  learnerNumBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  learnerNumText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
  },
  paidBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#fef3c7',
  },
  paidBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400e',
  },
  fullStudentBatch: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: '600',
    marginTop: 2,
  },
  fullStudentContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  contactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  contactChipText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  whatsappActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#16a34a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  whatsappActionText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
  },
  noPhoneNotice: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  fullStudentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  progressPercentText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#16a34a',
  },
  fullProgressBarTrack: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fullProgressBarFill: {
    height: '100%',
    backgroundColor: '#16a34a',
    borderRadius: 3,
  },
  enrolledDateText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
