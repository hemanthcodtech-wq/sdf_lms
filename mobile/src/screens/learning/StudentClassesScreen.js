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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../../theme/colors';
import { CustomButton } from '../../components/CustomButton';
import { Badge } from '../../components/Badge';
import { ProgressBar } from '../../components/Badge';
import { courseService } from '../../services/courseService';
import { getCourseImageUrl } from '../../utils/imageHelper';

export const StudentClassesScreen = ({ route, navigation }) => {
  const { course } = route.params;
  const insets = useSafeAreaInsets();

  const [classes, setClasses] = useState([]);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [completedLessons, setCompletedLessons] = useState([0]);
  const [activeTab, setActiveTab] = useState('lessons'); // 'lessons', 'materials', 'community'

  // Default sample lessons if backend hasn't populated class sessions yet
  const defaultLessons = [
    {
      id: 1,
      title: 'Session 1: Orientation & Foundations',
      duration: '45 mins',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      completed: true,
    },
    {
      id: 2,
      title: 'Session 2: Core Principles & Methodology',
      duration: '50 mins',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      completed: false,
    },
    {
      id: 3,
      title: 'Session 3: Live Case Studies & Practice',
      duration: '60 mins',
      videoUrl: '',
      completed: false,
    },
    {
      id: 4,
      title: 'Session 4: Advanced Mastery & Q&A',
      duration: '55 mins',
      videoUrl: '',
      completed: false,
    },
  ];

  const lessons = classes.length > 0 ? classes : defaultLessons;
  const currentLesson = lessons[activeLessonIndex] || lessons[0];
  const progressPercent = Math.round((completedLessons.length / lessons.length) * 100);

  const toggleComplete = (idx) => {
    if (completedLessons.includes(idx)) {
      setCompletedLessons(completedLessons.filter((i) => i !== idx));
    } else {
      setCompletedLessons([...completedLessons, idx]);
    }
  };

  const handleJoinZoom = (lessonItem) => {
    const target = lessonItem || currentLesson;
    const link =
      target?.zoomLink ||
      target?.zoomJoinUrl ||
      course?.zoomMeetingLink ||
      target?.courseId?.zoomMeetingLink ||
      (target?.zoomMeetingId ? `https://zoom.us/j/${target.zoomMeetingId}` : 'https://zoom.us/join');

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(link, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(link).catch(() => {
        Alert.alert('Error', 'Unable to open Zoom link. Please verify your Zoom app.');
      });
    }
  };

  const handleOpenWhatsApp = () => {
    const waLink = course?.whatsappGroupLink || currentLesson?.courseId?.whatsappGroupLink;
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
          }}
          style={styles.playerThumbnail}
        />
        <View style={styles.playerOverlay}>
          <TouchableOpacity
            style={styles.playCenterButton}
            onPress={handleJoinZoom}
            activeOpacity={0.8}
          >
            <Ionicons name="play" size={32} color="#fff" />
          </TouchableOpacity>
          <View style={styles.playerBottomInfo}>
            <Text style={styles.playerLessonTitle} numberOfLines={1}>
              {currentLesson?.title || 'Lesson Overview'}
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
          { id: 'lessons', label: 'Sessions' },
          { id: 'materials', label: 'Materials & Notes' },
          { id: 'community', label: 'Live & Community' },
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
            {lessons.map((lesson, idx) => {
              const isActive = activeLessonIndex === idx;
              const isDone = completedLessons.includes(idx);
              return (
                <TouchableOpacity
                  key={lesson.id || idx}
                  style={[
                    styles.lessonCard,
                    isActive && styles.lessonCardActive,
                    shadows.sm,
                  ]}
                  onPress={() => setActiveLessonIndex(idx)}
                  activeOpacity={0.7}
                >
                  <TouchableOpacity
                    style={[styles.checkCircle, isDone && styles.checkCircleDone]}
                    onPress={() => toggleComplete(idx)}
                  >
                    {isDone && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </TouchableOpacity>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.lessonTitle, isActive && styles.lessonTitleActive]}
                    >
                      {lesson.title}
                    </Text>
                    <Text style={styles.lessonDuration}>
                      ⏳ {lesson.duration || '45 mins'}
                    </Text>
                  </View>

                  <Ionicons
                    name={isActive ? 'volume-high' : 'play-circle-outline'}
                    size={22}
                    color={isActive ? colors.primary : colors.textSecondary}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {activeTab === 'materials' && (
          <View style={styles.materialsSection}>
            <View style={[styles.materialCard, shadows.sm]}>
              <Ionicons name="document-text" size={28} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.materialTitle}>Course Syllabus & Handbook (PDF)</Text>
                <Text style={styles.materialSize}>2.4 MB • Updated this week</Text>
              </View>
              <TouchableOpacity
                style={styles.downloadBtn}
                onPress={() => Alert.alert('Download', 'Downloading PDF to device storage...')}
              >
                <Ionicons name="cloud-download-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.materialCard, shadows.sm]}>
              <Ionicons name="folder-outline" size={28} color={colors.secondary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.materialTitle}>Session Practice Sheets & Formulas</Text>
                <Text style={styles.materialSize}>1.1 MB • Exercise Files</Text>
              </View>
              <TouchableOpacity
                style={styles.downloadBtn}
                onPress={() => Alert.alert('Download', 'Downloading exercise files...')}
              >
                <Ionicons name="cloud-download-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'community' && (
          <View style={styles.communitySection}>
            {/* Live Zoom Action */}
            <View style={[styles.actionCard, shadows.sm]}>
              <View style={styles.actionCardHeader}>
                <Ionicons name="videocam" size={24} color={colors.primary} />
                <Text style={styles.actionCardTitle}>Live Class Room</Text>
              </View>
              <Text style={styles.actionCardDesc}>
                Timings: {course?.timings || 'Check scheduled batch hours'}
              </Text>
              <CustomButton
                title="Launch Zoom Session"
                onPress={handleJoinZoom}
                variant="primary"
                size="md"
                style={{ marginTop: 10 }}
              />
            </View>

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
            ) : null}
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabNavItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabNavItemActive: {
    borderBottomColor: colors.primary,
  },
  tabNavText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabNavTextActive: {
    color: colors.primary,
    fontWeight: '700',
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
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
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
  lessonDuration: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
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
});
