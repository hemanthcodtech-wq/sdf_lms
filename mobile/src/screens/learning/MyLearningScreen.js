import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { CourseCard } from '../../components/CourseCard';
import { EmptyState } from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { courseService } from '../../services/courseService';

export const MyLearningScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState('ongoing'); // 'ongoing', 'completed'
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEnrollments = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await courseService.getMyCourses();
      if (res?.data) {
        setEnrollments(res.data);
      }
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchEnrollments();
    }, [fetchEnrollments])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEnrollments();
    setRefreshing(false);
  };

  const isCourseCompleted = (item) => {
    return Boolean(item.completed === true || item.certificateId);
  };

  const getEnrollmentProgress = (item) => {
    if (isCourseCompleted(item)) return 100;

    const courseObj = (item && typeof item.course === 'object' && item.course !== null)
      ? item.course
      : item;

    // Check if course has sessions or sessionDates
    const dates = courseObj?.sessionDates || [];
    const classes = courseObj?.classes || courseObj?.liveClasses || courseObj?.sessions || [];
    const topics = courseObj?.topics || [];
    const totalCount = dates.length > 0 ? dates.length : (classes.length > 0 ? classes.length : topics.length);

    if (totalCount > 0) {
      const now = new Date();
      let completedCount = 0;

      for (let idx = 0; idx < totalCount; idx++) {
        const dateStr = dates[idx] || (classes[idx] && classes[idx].date) || courseObj?.startDate;
        const timeStr = (classes[idx] && classes[idx].time) || courseObj?.startTime || (courseObj?.timings ? courseObj.timings.split(' to ')[0] : '06:00');
        const endTimeStr = courseObj?.endTime || (courseObj?.timings && courseObj.timings.includes(' to ') ? courseObj.timings.split(' to ')[1] : null);

        if (dateStr) {
          try {
            const rawDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
            const [y, m, d] = rawDate.split('-').map(Number);
            if (y && m && d) {
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
                const durMins = (classes[idx] && classes[idx].durationMinutes) || 60;
                sessionEnd = new Date(new Date(y, m - 1, d, startH, startM, 0, 0).getTime() + durMins * 60 * 1000);
              }

              if (now > sessionEnd) {
                completedCount++;
              }
            }
          } catch (e) {}
        }
      }

      if (completedCount > 0) {
        return Math.min(100, Math.round((completedCount / totalCount) * 100));
      }
    }

    if (typeof item.progress === 'number' && item.progress > 0 && item.progress < 100) {
      return item.progress;
    }
    return 0;
  };

  const ongoingEnrollments = enrollments.filter((item) => !isCourseCompleted(item));
  const completedEnrollments = enrollments.filter((item) => isCourseCompleted(item));
  const filteredEnrollments = activeTab === 'completed' ? completedEnrollments : ongoingEnrollments;

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? 14 : Math.max(insets.top, 20) }]}>
          <Text style={styles.headerTitle}>{t('myLearning')}</Text>
        </View>
        <EmptyState
          icon="lock-closed-outline"
          title="Login to View Your Learning"
          description="Track your enrolled courses, live class schedules, and certificate progress."
          buttonTitle="Login / Sign Up"
          onButtonPress={() => navigation.navigate('Auth')}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? 14 : Math.max(insets.top, 20) }]}>
        <Text style={styles.headerTitle}>{t('myLearning')}</Text>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'ongoing' && styles.tabBtnActive]}
            onPress={() => setActiveTab('ongoing')}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === 'ongoing' && styles.tabBtnTextActive,
              ]}
            >
              Ongoing Courses {ongoingEnrollments.length > 0 ? `(${ongoingEnrollments.length})` : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'completed' && styles.tabBtnActive]}
            onPress={() => setActiveTab('completed')}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === 'completed' && styles.tabBtnTextActive,
              ]}
            >
              Completed {completedEnrollments.length > 0 ? `(${completedEnrollments.length})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredEnrollments}
          keyExtractor={(item, index) => item._id || item.course?._id || String(index)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="school-outline"
              title={
                activeTab === 'completed'
                  ? 'No Completed Courses Yet'
                  : t('noEnrolledCourses')
              }
              description={
                activeTab === 'completed'
                  ? 'Keep learning to complete your modules and unlock certificates.'
                  : 'Explore our catalog to start your learning journey with world-class faculty.'
              }
              buttonTitle={t('exploreCourses')}
              onButtonPress={() => navigation.navigate('CoursesTab')}
            />
          }
          renderItem={({ item }) => {
            const courseObj = (item && typeof item.course === 'object' && item.course !== null)
              ? { ...item, ...item.course, title: item.course.title || item.title, thumbnailUrl: item.course.thumbnailUrl || item.course.thumbnail || item.thumbnailUrl }
              : item;
            const progressVal = getEnrollmentProgress(item);
            const isExpired = Boolean(item.isExpired);
            const validityLabel = item.validityLabel || (courseObj.accessValidity ? `${courseObj.accessValidity} Access` : '2 Months Access');

            return (
              <View style={{ marginBottom: 14 }}>
                {/* Access Validity Pill */}
                <View style={[styles.validityBadgeContainer, isExpired ? styles.validityBadgeExpired : styles.validityBadgeActive]}>
                  <Ionicons name={isExpired ? "lock-closed" : "time"} size={12} color={isExpired ? "#b91c1c" : "#047857"} />
                  <Text style={[styles.validityBadgeText, isExpired ? styles.validityTextExpired : styles.validityTextActive]}>
                    {validityLabel}
                  </Text>
                </View>

                <CourseCard
                  course={courseObj}
                  showProgress
                  progress={progressVal}
                  onPress={() =>
                    navigation.navigate('StudentClasses', {
                      course: courseObj,
                      enrollment: item,
                    })
                  }
                />
                {(item.completed || item.certificateId || progressVal >= 1) && (
                  <TouchableOpacity
                    style={styles.myLearningCertBtn}
                    onPress={() => navigation.navigate('Certificates')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="ribbon-outline" size={16} color="#d97706" />
                    <Text style={styles.myLearningCertText}>Certificate Ready • Tap to View & Download</Text>
                    <Ionicons name="chevron-forward" size={14} color="#d97706" />
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}
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
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabBtnTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  myLearningCertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
    marginHorizontal: 2,
  },
  myLearningCertText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400e',
    flex: 1,
    marginLeft: 8,
  },
  validityBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 6,
    marginHorizontal: 2,
    borderWidth: 1,
    gap: 5,
  },
  validityBadgeActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  validityBadgeExpired: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  validityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  validityTextActive: {
    color: '#065f46',
  },
  validityTextExpired: {
    color: '#991b1b',
  },
});
