import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';
import { colors, shadows } from '../../theme/colors';
import { CustomButton } from '../../components/CustomButton';
import { Badge } from '../../components/Badge';
import { ProgressBar } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { courseService } from '../../services/courseService';
import { notificationService } from '../../services/notificationService';
import { getCourseImageUrl } from '../../utils/imageHelper';

export const StudentClassesScreen = ({ route, navigation }) => {
  const { course } = route.params;
  const insets = useSafeAreaInsets();

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingMaterial, setDownloadingMaterial] = useState(false);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('lessons'); // 'lessons', 'materials', 'community'
  const [materials, setMaterials] = useState([]);
  const [claimingCert, setClaimingCert] = useState(false);
  const [certIssued, setCertIssued] = useState(Boolean(route.params?.enrollment?.completed || route.params?.enrollment?.certificateId));

  useEffect(() => {
    fetchCourseClasses();
  }, [course?._id]);

  const fetchCourseClasses = async () => {
    try {
      setLoading(true);
      const courseId = course?._id || course?.id;
      
      const [classesRes, materialsRes] = await Promise.all([
        courseService.getStudentClasses().catch(() => ({ data: [] })),
        courseId ? courseService.getCourseMaterials(courseId).catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
      ]);

      if (classesRes?.data && classesRes.data.length > 0) {
        const matchingClasses = classesRes.data.filter(
          (c) => (c.courseId?._id || c.courseId?.id || c.courseId) === courseId
        );
        setClasses(matchingClasses);
      } else {
        setClasses([]);
      }

      if (materialsRes?.data && Array.isArray(materialsRes.data)) {
        setMaterials(materialsRes.data);
      } else {
        setMaterials([]);
      }
    } catch (err) {
      console.error('Error fetching classes and materials:', err);
      setClasses([]);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  // Derive real sessions dynamically from Admin inputs (live classes OR course topics / sessionDates)
  const realSessions = [];
  if (classes.length > 0) {
    classes.forEach((cl, i) => {
      realSessions.push({
        id: cl._id || `class_${i}`,
        title: cl.title || `Session ${i + 1}`,
        duration: cl.durationMinutes ? `${cl.durationMinutes} mins` : (cl.time || 'Live Batch'),
        zoomLink: cl.zoomLink || course?.zoomMeetingLink,
        date: cl.date,
        time: cl.time,
      });
    });
  } else if (course?.topics && course.topics.length > 0) {
    course.topics.forEach((top, i) => {
      realSessions.push({
        id: `topic_${i}`,
        title: `Module ${i + 1}: ${top}`,
        duration: course?.timings || 'Scheduled Live',
        zoomLink: course?.zoomMeetingLink,
      });
    });
  } else if (course?.sessionDates && course.sessionDates.length > 0) {
    course.sessionDates.forEach((sd, i) => {
      realSessions.push({
        id: `session_${i}`,
        title: `Live Session ${i + 1} (${sd})`,
        duration: course?.timings || '1 Hour',
        zoomLink: course?.zoomMeetingLink,
      });
    });
  }

  const getSessionStatus = (lesson, idx) => {
    const dateStr = lesson.date || (course?.sessionDates && course.sessionDates[idx]) || course?.startDate;
    const timeStr = lesson.time || course?.startTime || (course?.timings ? course.timings.split(' to ')[0] : '06:00');
    const endTimeStr = course?.endTime || (course?.timings && course.timings.includes(' to ') ? course.timings.split(' to ')[1] : null);

    let displayDate = 'Scheduled';
    let displayTime = lesson.duration || 'Live Session';

    if (!dateStr) {
      return { isCompleted: false, isLiveNow: true, canJoin: true, label: 'Join Class', displayDate, displayTime };
    }

    try {
      const rawDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      const [y, m, d] = rawDate.split('-').map(Number);
      if (!y || !m || !d) {
        return { isCompleted: false, isLiveNow: true, canJoin: true, label: 'Join Class', displayDate, displayTime };
      }

      // Format Date Cleanly (Today / Tomorrow / 25 Aug)
      const dateObj = new Date(y, m - 1, d);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const isToday = dateObj.toDateString() === today.toDateString();
      const isTomorrow = dateObj.toDateString() === tomorrow.toDateString();

      displayDate = isToday
        ? 'Today'
        : isTomorrow
        ? 'Tomorrow'
        : dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

      let startH = 6, startM = 0;
      if (timeStr) {
        const cleanTime = timeStr.trim();
        const match = cleanTime.match(/(\d{1,2}):(\d{2})/);
        if (match) {
          startH = parseInt(match[1], 10);
          startM = parseInt(match[2], 10);
          if (cleanTime.toLowerCase().includes('pm') && startH < 12) startH += 12;
          if (cleanTime.toLowerCase().includes('am') && startH === 12) startH = 0;
        }
      }

      const sessionStart = new Date(y, m - 1, d, startH, startM, 0, 0);
      // Active 2 minutes before class begins
      const joinWindowStart = new Date(sessionStart.getTime() - 2 * 60 * 1000);

      let sessionEnd;
      if (endTimeStr) {
        const matchEnd = endTimeStr.match(/(\d{1,2}):(\d{2})/);
        if (matchEnd) {
          let endH = parseInt(matchEnd[1], 10);
          let endM = parseInt(matchEnd[2], 10);
          if (endTimeStr.toLowerCase().includes('pm') && endH < 12) endH += 12;
          if (endTimeStr.toLowerCase().includes('am') && endH === 12) endH = 0;
          sessionEnd = new Date(y, m - 1, d, endH, endM, 0, 0);
        }
      }
      if (!sessionEnd) {
        const durMins = lesson.durationMinutes || (parseInt(lesson.duration, 10) || 60);
        sessionEnd = new Date(sessionStart.getTime() + durMins * 60 * 1000);
      }

      const formatTime12 = (date) => {
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
      };

      displayTime = `${formatTime12(sessionStart)}`;

      const now = new Date();

      if (now > sessionEnd) {
        return { isCompleted: true, isLiveNow: false, canJoin: false, label: 'Completed', displayDate, displayTime };
      }

      if (now >= joinWindowStart && now <= sessionEnd) {
        return { isCompleted: false, isLiveNow: true, canJoin: true, label: 'Join Class', displayDate, displayTime };
      }

      // Upcoming (more than 2 mins before)
      return { isCompleted: false, isLiveNow: false, canJoin: false, label: 'Join Class', displayDate, displayTime };
    } catch (e) {
      return { isCompleted: false, isLiveNow: true, canJoin: true, label: 'Join Class', displayDate, displayTime };
    }
  };

  const currentLesson = realSessions[activeLessonIndex] || realSessions[0] || null;
  
  const completedCount = realSessions.filter((lesson, idx) => getSessionStatus(lesson, idx).isCompleted).length;
  const calculatedPercent = realSessions.length > 0
    ? Math.round((completedCount / realSessions.length) * 100)
    : 0;

  // Strict Rule: A course is ONLY completed if ALL real sessions are finished!
  const allSessionsFinished = !loading && realSessions.length > 0 && completedCount === realSessions.length;
  const isCourseCertified = Boolean(certIssued || (allSessionsFinished && route.params?.enrollment?.certificateId));

  const progressPercent = allSessionsFinished
    ? 100
    : calculatedPercent;

  const isCourseCompleted = allSessionsFinished;

  const handleClaimOrViewCert = async () => {
    if (certIssued || isCourseCertified) {
      return navigation.navigate('Certificates');
    }
    const courseId = course?._id || course?.id;
    if (!courseId) {
      return navigation.navigate('Certificates');
    }

    try {
      setClaimingCert(true);
      const res = await courseService.completeCourse(courseId);
      setCertIssued(true);
      await notificationService.sendInstantNotification(
        '🏆 Certificate of Completion Issued!',
        `Congratulations on completing "${course?.title || 'your course'}"! Your official certificate has been issued, sent to your email, and saved to your account.`
      );
      Alert.alert(
        '🏆 Certificate Generated!',
        res?.message || 'Your official Certificate of Completion has been generated and saved to your profile. You can view and download it now.',
        [
          {
            text: 'View in Profile',
            onPress: () => navigation.navigate('Certificates'),
          },
          { text: 'OK', style: 'cancel' },
        ]
      );
    } catch (e) {
      console.error('Error claiming certificate:', e);
      navigation.navigate('Certificates');
    } finally {
      setClaimingCert(false);
    }
  };

  const handleJoinZoom = (lessonItem) => {
    const target = lessonItem || currentLesson;
    const link =
      target?.zoomLink ||
      course?.zoomMeetingLink ||
      target?.courseId?.zoomMeetingLink ||
      (target?.zoomMeetingId ? `https://zoom.us/j/${target.zoomMeetingId}` : 'https://zoom.us/join');

    if (!link) {
      Alert.alert('Live Session', 'Live Zoom link has not been published yet for this session.');
      return;
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(link, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(link).catch(() => {
        Alert.alert('Error', 'Unable to open Zoom. Please ensure the Zoom app is installed on your device.');
      });
    }
  };

  const handleOpenWhatsApp = () => {
    const waLink = course?.whatsappGroupLink;
    if (waLink) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(waLink, '_blank', 'noopener,noreferrer');
      } else {
        Linking.openURL(waLink).catch(() => {
          Alert.alert('Error', 'Unable to open WhatsApp.');
        });
      }
    } else {
      Alert.alert('Community Group', 'WhatsApp community group link will be shared by your guru.');
    }
  };

  const handleDownloadMaterial = async (fileUrl, title = 'Course Material') => {
    if (!fileUrl) {
      Alert.alert('Notice', 'No file attachment available for download.');
      return;
    }
    const fullUrl = getCourseImageUrl(fileUrl);
    try {
      setDownloadingMaterial(true);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(fullUrl, '_blank');
      } else {
        const fileName = fileUrl.split('/').pop() || 'Course-Handbook.pdf';
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        const downloadRes = await FileSystem.downloadAsync(fullUrl, fileUri);

        if (downloadRes.status === 200) {
          const canShare = await Sharing.isAvailableAsync();
          if (canShare) {
            await Sharing.shareAsync(downloadRes.uri, {
              mimeType: 'application/pdf',
              dialogTitle: `Download ${title}`,
              UTI: 'com.adobe.pdf',
            });
          } else {
            await WebBrowser.openBrowserAsync(fullUrl);
          }
        } else {
          await WebBrowser.openBrowserAsync(fullUrl);
        }
      }
    } catch (e) {
      console.error('Material download error:', e);
      Linking.openURL(fullUrl).catch(() => {
        Alert.alert('Download Notice', 'Unable to download file. Please check your network connection.');
      });
    } finally {
      setDownloadingMaterial(false);
    }
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
        <Text style={styles.headerTitle} numberOfLines={1}>
          {course?.title || 'Classroom'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Video / Live Player Canvas */}
      <View style={styles.playerContainer}>
        <Image
          source={{
            uri: getCourseImageUrl(course?.thumbnailUrl),
            cache: 'force-cache',
          }}
          style={styles.playerThumbnail}
        />
        <View style={styles.playerOverlay}>
          <TouchableOpacity
            style={styles.playCenterButton}
            onPress={() => handleJoinZoom(currentLesson)}
            activeOpacity={0.8}
          >
            <Ionicons name="videocam" size={32} color="#fff" />
          </TouchableOpacity>
          <View style={styles.playerBottomInfo}>
            <Text style={styles.playerLessonTitle} numberOfLines={1}>
              {currentLesson?.title || course?.title || 'Live Interactive Class'}
            </Text>
            <Text style={styles.playerSubInfo}>
              ⏰ {course?.timings || 'Batch schedule in description'}
            </Text>
          </View>
        </View>
      </View>

      {/* Progress Strip */}
      <View style={styles.progressStrip}>
        <View style={styles.progressTextRow}>
          <Text style={styles.progressLabel}>Overall Completion</Text>
          <Text style={styles.progressValue}>{progressPercent}%</Text>
        </View>
        <ProgressBar progress={progressPercent} height={6} />
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabNav}>
        {[
          { id: 'lessons', label: `Sessions (${realSessions.length})` },
          { id: 'materials', label: 'Materials & Notes' },
          { id: 'certificate', label: 'Certificate' },
          { id: 'community', label: 'Batch Community' },
        ].map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tabNavItem, activeTab === t.id && styles.tabNavItemActive]}
            onPress={() => setActiveTab(t.id)}
          >
            <Text
              style={[
                styles.tabNavText,
                activeTab === t.id && styles.tabNavTextActive,
              ]}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.contentArea, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'lessons' && (
          <View style={styles.lessonsList}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
            ) : realSessions.length > 0 ? (
              realSessions.map((lesson, idx) => {
                const status = getSessionStatus(lesson, idx);
                const isActive = activeLessonIndex === idx;
                const isDone = status.isCompleted;

                return (
                  <TouchableOpacity
                    key={lesson.id || idx}
                    style={[
                      styles.lessonCard,
                      isActive && styles.lessonCardActive,
                      isDone && styles.lessonCardDone,
                      shadows.sm,
                    ]}
                    onPress={() => setActiveLessonIndex(idx)}
                    activeOpacity={0.85}
                  >
                    {/* Session Indicator Circle - Static Status Badge */}
                    <View
                      style={[
                        styles.checkCircle,
                        isDone && styles.checkCircleDone,
                        isActive && !isDone && styles.checkCircleActive,
                      ]}
                    >
                      {isDone ? (
                        <Ionicons name="checkmark" size={13} color="#fff" />
                      ) : (
                        <Text
                          style={[
                            styles.checkCircleNumber,
                            isActive && styles.checkCircleNumberActive,
                          ]}
                        >
                          {idx + 1}
                        </Text>
                      )}
                    </View>

                    {/* Session Title & Date/Time Information */}
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={[
                          styles.lessonTitle,
                          isActive && styles.lessonTitleActive,
                          isDone && styles.lessonTitleDone,
                        ]}
                        numberOfLines={2}
                      >
                        {lesson.title}
                      </Text>
                      <View style={styles.lessonMetaRow}>
                        <Text style={styles.lessonMetaText}>
                          📅 {status.displayDate} • ⏰ {status.displayTime}
                        </Text>
                      </View>
                    </View>

                    {/* Join Button (Active if within 2-min window, unclickable/disabled if upcoming) or Completed Badge */}
                    {isDone ? (
                      <View style={styles.completedBadge}>
                        <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
                        <Text style={styles.completedBadgeText}>Completed</Text>
                      </View>
                    ) : status.isLiveNow ? (
                      <TouchableOpacity
                        style={styles.activeJoinBtn}
                        onPress={() => handleJoinZoom(lesson)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="videocam" size={14} color="#fff" />
                        <Text style={styles.activeJoinBtnText}>Join Class</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.disabledJoinBtn}
                        onPress={() =>
                          Alert.alert(
                            'Live Class Scheduled',
                            `This session is scheduled for ${status.displayDate} at ${status.displayTime}.\n\nThe "Join Class" button will be activated 2 minutes before class starts.`
                          )
                        }
                        activeOpacity={0.7}
                      >
                        <Ionicons name="videocam-outline" size={14} color="#9ca3af" />
                        <Text style={styles.disabledJoinBtnText}>Join Class</Text>
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })
            ) : (
              <EmptyState
                icon="calendar-outline"
                title="No Live Sessions Scheduled Yet"
                description="Your instructor has not published specific session dates yet. Join the batch live meeting link or WhatsApp group below."
                buttonTitle="Join Batch Live Zoom"
                onButtonPress={() => handleJoinZoom(null)}
              />
            )}
          </View>
        )}

        {activeTab === 'materials' && (
          <View style={styles.materialsSection}>
            {/* 1. Official Course Syllabus / Handbook (if uploaded by Admin) */}
            {course?.contentUrl && (
              <View style={[styles.materialCard, shadows.sm]}>
                <Ionicons name="document-text" size={28} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.materialTitle}>Course Syllabus & Handbook (PDF)</Text>
                  <Text style={styles.materialSize}>Official Course Material • PDF Document</Text>
                </View>
                <TouchableOpacity
                  style={[styles.downloadBtn, downloadingMaterial && { opacity: 0.7 }]}
                  onPress={() => handleDownloadMaterial(course.contentUrl, 'Course Syllabus & Handbook')}
                  disabled={downloadingMaterial}
                  activeOpacity={0.8}
                >
                  {downloadingMaterial ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons name="cloud-download-outline" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* 2. Uploaded Course Materials from Admin / Instructor (Recordings, PDFs, Practice Sheets, Notes) */}
            {materials.length > 0 && (
              materials.map((mat, idx) => {
                const isDrive = mat.driveLink || mat.fileUrl || mat.url;
                const isRecording = mat.materialType === 'Recording' || (mat.topicsCovered && mat.topicsCovered.toLowerCase().includes('recording'));
                const iconName = isRecording ? 'videocam-outline' : (mat.materialType === 'Notes' ? 'reader-outline' : 'document-attach-outline');
                const matTitle = mat.topicsCovered || mat.title || `Class Material ${idx + 1}`;
                const matDate = mat.date ? new Date(mat.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

                return (
                  <View key={mat._id || idx} style={[styles.materialCard, shadows.sm]}>
                    <Ionicons name={iconName} size={28} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.materialTitle} numberOfLines={2}>{matTitle}</Text>
                      <Text style={styles.materialSize}>
                        {mat.materialType || 'Study Resource'} {matDate ? `• ${matDate}` : ''}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.downloadBtn, downloadingMaterial && { opacity: 0.7 }]}
                      onPress={() => {
                        if (isDrive) {
                          const url = mat.driveLink || mat.fileUrl || mat.url;
                          if (url.startsWith('http')) {
                            Linking.openURL(url).catch(() => Alert.alert('Error', 'Unable to open material link.'));
                          } else {
                            handleDownloadMaterial(url, matTitle);
                          }
                        } else {
                          Alert.alert('Material', 'Resource link will be available shortly.');
                        }
                      }}
                      disabled={downloadingMaterial}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={isRecording || (isDrive && isDrive.startsWith('http')) ? "open-outline" : "cloud-download-outline"}
                        size={20}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}

            {/* 3. Empty State if nothing is available */}
            {!course?.contentUrl && materials.length === 0 && (
              <EmptyState
                icon="document-outline"
                title="No Study Materials Uploaded"
                description="Your instructor has not attached additional downloadable study files for this course yet."
              />
            )}
          </View>
        )}

        {activeTab === 'certificate' && (
          <View style={styles.certTabSection}>
            <View style={[styles.certCard, shadows.md]}>
              {/* Top Certificate Header */}
              <View style={styles.certCardHeader}>
                <View style={[
                  styles.certIconBigCircle,
                  { backgroundColor: isCourseCompleted ? '#ecfdf5' : '#f8fafc' }
                ]}>
                  <Ionicons
                    name={isCourseCompleted ? (certIssued || isCourseCertified ? "ribbon" : "trophy") : "lock-closed"}
                    size={34}
                    color={isCourseCompleted ? (certIssued || isCourseCertified ? "#0d5c31" : "#d97706") : "#94a3b8"}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.certCourseTitle} numberOfLines={2}>
                    {course?.title || 'Course Certificate'}
                  </Text>
                  <Text style={styles.certFacultyText}>
                    Instructor: <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{course?.instructor || course?.instructorId?.name || 'Assigned Instructor'}</Text>
                  </Text>
                </View>
              </View>

              <View style={styles.certDivider} />

              {/* Status Box */}
              {certIssued || isCourseCertified ? (
                <View style={styles.certStatusSuccess}>
                  <Ionicons name="checkmark-circle" size={22} color="#0d5c31" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.certStatusTitleSuccess}>Certificate Issued & Verified</Text>
                    <Text style={styles.certStatusDesc}>
                      Your verified Certificate of Completion is saved to your account and has been emailed to you.
                    </Text>
                  </View>
                </View>
              ) : isCourseCompleted ? (
                <View style={styles.certStatusUnlocked}>
                  <Ionicons name="sparkles" size={22} color="#d97706" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.certStatusTitleUnlocked}>Course Completed! 🎉</Text>
                    <Text style={styles.certStatusDesc}>
                      Congratulations on completing all sessions! Tap below to generate your official certificate.
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.certStatusLocked}>
                  <Ionicons name="lock-closed" size={22} color="#64748b" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.certStatusTitleLocked}>Certificate Locked</Text>
                    <Text style={styles.certStatusDesc}>
                      Complete all {realSessions.length} sessions to unlock and generate your official Certificate of Completion.
                    </Text>
                  </View>
                </View>
              )}

              {/* Progress Bar & Details */}
              <View style={styles.certProgressBox}>
                <View style={styles.certProgressHeader}>
                  <Text style={styles.certProgressLabel}>Course Sessions Progress</Text>
                  <Text style={styles.certProgressPercent}>{completedCount}/{realSessions.length} Sessions ({progressPercent}%)</Text>
                </View>
                <ProgressBar progress={progressPercent} height={7} />
              </View>

              {/* Action Button */}
              {certIssued || isCourseCertified ? (
                <View style={{ marginTop: 16 }}>
                  <TouchableOpacity
                    style={styles.genCertBtn}
                    onPress={() => navigation.navigate('Certificates')}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="download-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.genCertBtnText}>View & Download Certificate in Profile →</Text>
                  </TouchableOpacity>
                  <Text style={styles.certLockedExplanation}>
                    Your official certificate is issued and saved. You can download the PDF anytime from Profile → My Certificates.
                  </Text>
                </View>
              ) : (
                <View style={{ marginTop: 16 }}>
                  <TouchableOpacity
                    style={[
                      styles.genCertBtn,
                      !isCourseCompleted && styles.genCertBtnDisabled
                    ]}
                    onPress={isCourseCompleted ? handleClaimOrViewCert : null}
                    disabled={!isCourseCompleted || claimingCert}
                    activeOpacity={isCourseCompleted ? 0.8 : 1}
                  >
                    {claimingCert ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <>
                        <Ionicons
                          name={isCourseCompleted ? "ribbon-outline" : "lock-closed-outline"}
                          size={18}
                          color={isCourseCompleted ? "#ffffff" : "#94a3b8"}
                          style={{ marginRight: 8 }}
                        />
                        <Text style={[
                          styles.genCertBtnText,
                          !isCourseCompleted && styles.genCertBtnTextDisabled
                        ]}>
                          {isCourseCompleted ? "Generate Certificate" : "Generate Certificate (Locked)"}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                  {!isCourseCompleted && (
                    <Text style={styles.certLockedExplanation}>
                      This button is locked and will automatically unlock once all {realSessions.length} sessions are completed.
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>
        )}

        {activeTab === 'community' && (
          <View style={styles.communitySection}>
            {/* WhatsApp Group */}
            {course?.whatsappGroupLink ? (
              <View style={[styles.actionCard, shadows.sm]}>
                <View style={styles.actionCardHeader}>
                  <Ionicons name="logo-whatsapp" size={24} color="#16a34a" />
                  <Text style={styles.actionCardTitle}>Batch WhatsApp Group</Text>
                </View>
                <Text style={styles.actionCardDesc}>
                  Connect directly with peers, moderators, and the instructor.
                </Text>
                <CustomButton
                  title="Join WhatsApp Group"
                  onPress={handleOpenWhatsApp}
                  variant="secondary"
                  size="md"
                  style={{ marginTop: 10 }}
                />
              </View>
            ) : (
              <View style={[styles.actionCard, shadows.sm]}>
                <View style={styles.actionCardHeader}>
                  <Ionicons name="people-outline" size={24} color={colors.secondary} />
                  <Text style={styles.actionCardTitle}>Community Batch</Text>
                </View>
                <Text style={styles.actionCardDesc}>
                  Interact with instructor and learners during live class sessions.
                </Text>
              </View>
            )}
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
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  playerContainer: {
    width: '100%',
    height: 210,
    backgroundColor: '#000',
    position: 'relative',
  },
  playerThumbnail: {
    width: '100%',
    height: '100%',
    opacity: 0.7,
  },
  playerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  playCenterButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  playerBottomInfo: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
  },
  playerLessonTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  progressStrip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  tabNav: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tabNavItem: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  tabNavItemActive: {
    backgroundColor: colors.primary + '14',
  },
  tabNavText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabNavTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  contentArea: {
    padding: 16,
  },
  lessonsList: {
    gap: 10,
  },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 12,
  },
  lessonCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '08',
  },
  lessonCardDone: {
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  checkCircleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '20',
  },
  checkCircleDone: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  checkCircleNumber: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
  },
  checkCircleNumberActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  lessonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  lessonTitleActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  lessonTitleDone: {
    color: '#15803d',
    fontWeight: '700',
  },
  lessonMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  lessonMetaText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  activeJoinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  activeJoinBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  disabledJoinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  disabledJoinBtnText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '700',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  completedBadgeText: {
    color: '#15803d',
    fontSize: 11,
    fontWeight: '700',
  },
  scheduledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scheduledBadgeText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  materialsSection: {
    gap: 12,
  },
  materialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 14,
  },
  materialTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  materialSize: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  downloadBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  communitySection: {
    gap: 14,
  },
  actionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  actionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  actionCardDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  playerSubInfo: {
    color: '#cbd5e1',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  joinIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  certTabSection: {
    paddingVertical: 6,
  },
  certCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  certCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  certIconBigCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  certCourseTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  certFacultyText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  certDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 16,
  },
  certStatusSuccess: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    marginBottom: 16,
  },
  certStatusTitleSuccess: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065f46',
    marginBottom: 2,
  },
  certStatusUnlocked: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    marginBottom: 16,
  },
  certStatusTitleUnlocked: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400e',
    marginBottom: 2,
  },
  certStatusLocked: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    marginBottom: 16,
  },
  certStatusTitleLocked: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 2,
  },
  certStatusDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  certProgressBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  certProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  certProgressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  certProgressPercent: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  genCertBtn: {
    backgroundColor: '#0d5c31',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    shadowColor: '#0d5c31',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  genCertBtnDisabled: {
    backgroundColor: '#e2e8f0',
    opacity: 0.55,
    shadowOpacity: 0,
    elevation: 0,
  },
  genCertBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  genCertBtnTextDisabled: {
    color: '#94a3b8',
  },
  certLockedExplanation: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 15,
  },
});
