import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  FlatList,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../../theme/colors';
import { CourseCard } from '../../components/CourseCard';
import { Badge } from '../../components/Badge';
import { CustomButton } from '../../components/CustomButton';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { courseService } from '../../services/courseService';

import { API_BASE_URL } from '../../services/api';
import { getAvatarUrl, getCourseImageUrl } from '../../utils/imageHelper';

export const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t, language, changeLanguage } = useLanguage();

  const [refreshing, setRefreshing] = useState(false);
  const [courses, setCourses] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const userAvatarUri = getAvatarUrl(user?.avatar);

  const categories = ['All', 'Spiritual', 'Personality', 'Skill Development', 'Vedic Science', 'Language'];

  const loadData = useCallback(async () => {
    try {
      const promises = [courseService.getPublicCourses()];
      if (user) {
        promises.push(courseService.getStudentClasses());
        promises.push(courseService.getMyCourses());
      }

      const results = await Promise.allSettled(promises);

      // Handle Public Courses
      if (results[0].status === 'fulfilled' && results[0].value?.data) {
        setCourses(results[0].value.data);
        // Prefetch course images in parallel
        if (Platform.OS !== 'web') {
          results[0].value.data.forEach((c) => {
            const img = getCourseImageUrl(c.thumbnailUrl || c.image);
            if (img) {
              Image.prefetch(img).catch(() => {});
            }
          });
        }
      }

      // Handle User Specific Data
      if (user) {
        if (results[1]?.status === 'fulfilled' && results[1].value?.data) {
          setLiveClasses(results[1].value.data);
        }
        if (results[2]?.status === 'fulfilled' && results[2].value?.data) {
          setMyCourses(results[2].value.data);
        }
      }
    } catch (error) {
      console.error('Error loading home data:', error);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleJoinClass = (liveClass) => {
    const link =
      liveClass?.zoomLink ||
      liveClass?.zoomJoinUrl ||
      liveClass?.courseId?.zoomMeetingLink ||
      liveClass?.link ||
      (liveClass?.zoomMeetingId ? `https://zoom.us/j/${liveClass.zoomMeetingId}` : 'https://zoom.us/join');

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(link, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(link).catch(() => {
        Alert.alert('Error', 'Unable to open Zoom. Please verify your Zoom app.');
      });
    }
  };

  const handleOpenWhatsapp = (whatsappLink) => {
    if (whatsappLink) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(whatsappLink, '_blank', 'noopener,noreferrer');
      } else {
        Linking.openURL(whatsappLink).catch(() => {
          Alert.alert('Error', 'Could not open WhatsApp.');
        });
      }
    }
  };

  const filteredCourses = selectedCategory === 'All'
    ? courses
    : courses.filter((c) => c.category?.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? 14 : Math.max(insets.top, 20) }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.userInfo}
            onPress={() => navigation.navigate('ProfileTab')}
            activeOpacity={0.7}
          >
            <View style={styles.avatarCircle}>
              {userAvatarUri ? (
                <Image source={{ uri: userAvatarUri, cache: 'force-cache' }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarText}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </Text>
              )}
            </View>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.name || 'Guest Learner'}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.langBtn}
              onPress={() => {
                const langs = ['en', 'te', 'hi'];
                const next = (langs.indexOf(language) + 1) % langs.length;
                changeLanguage(langs[next]);
              }}
            >
              <Text style={styles.langBtnText}>{language.toUpperCase()}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.notificationBtn}
              onPress={() => navigation.navigate('Notifications')}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
              {liveClasses.length > 0 && (
                <View style={styles.badgeDot} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar Trigger */}
        <TouchableOpacity
          style={styles.searchBar}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('CoursesTab')}
        >
          <Ionicons name="search-outline" size={20} color={colors.textMuted} />
          <Text style={styles.searchPlaceholder}>{t('searchCourses')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollBody}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Banner Hero Card */}
        <View style={[styles.heroCard, shadows.brandGlow]}>
          <View style={styles.heroContent}>
            <Badge text="DISCOVER EXCELLENCE" variant="secondary" />
            <Text style={styles.heroTitle}>Master Ancient Wisdom & Modern Skills</Text>
            <Text style={styles.heroSub}>
              Join interactive live sessions with verified master mentors.
            </Text>
            <TouchableOpacity
              style={styles.heroActionBtn}
              onPress={() => navigation.navigate('CoursesTab')}
              activeOpacity={0.8}
            >
              <Text style={styles.heroActionText}>Browse Courses</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.primaryDark} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Classes Banner if available */}
        {liveClasses.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.liveIndicatorRow}>
                <View style={styles.livePulseDot} />
                <Text style={styles.sectionTitle}>{t('upcomingClasses')}</Text>
              </View>
            </View>

            {liveClasses.slice(0, 2).map((item, idx) => (
              <View key={item._id || idx} style={[styles.liveClassCard, shadows.md]}>
                <View style={styles.liveClassTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.liveCourseTitle} numberOfLines={1}>
                      {item.courseId?.title || item.title || 'Live Class Session'}
                    </Text>
                    <Text style={styles.liveTimeText}>
                      📅 {item.date || 'Today'} • ⏰ {item.time || item.courseId?.timings || 'Live Now'}
                    </Text>
                  </View>
                  <Badge text="LIVE ZOOM" variant="warning" />
                </View>

                <View style={styles.liveActionsRow}>
                  <CustomButton
                    title={t('joinClass')}
                    onPress={() => handleJoinClass(item)}
                    variant="primary"
                    size="sm"
                    icon={<Ionicons name="videocam" size={16} color="#fff" />}
                    style={{ flex: 1 }}
                  />
                  {item.courseId?.whatsappGroupLink ? (
                    <TouchableOpacity
                      style={styles.whatsappBtn}
                      onPress={() => handleOpenWhatsapp(item.courseId.whatsappGroupLink)}
                    >
                      <Ionicons name="logo-whatsapp" size={18} color="#16a34a" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Continue Learning (If enrolled) */}
        {myCourses.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('continueLearning')}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('LearningTab')}>
                <Text style={styles.seeAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            <CourseCard
              course={myCourses[0].course || myCourses[0]}
              showProgress
              progress={myCourses[0].progress || 35}
              onPress={(c) => navigation.navigate('StudentClasses', { course: c })}
            />
          </View>
        )}

        {/* Categories Bar */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={[
                    styles.categoryChip,
                    isSelected && styles.categoryChipActive,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      isSelected && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Featured Courses Carousel */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('featuredCourses')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CoursesTab')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {filteredCourses.length === 0 ? (
            <Text style={styles.emptyText}>{t('noCoursesFound')}</Text>
          ) : (
            <FlatList
              data={filteredCourses.slice(0, 5)}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, index) => item._id || item.id || String(index)}
              renderItem={({ item }) => (
                <CourseCard
                  course={item}
                  horizontal
                  onPress={(course) =>
                    navigation.navigate('CourseDetails', {
                      slug: course.slug || course._id,
                      course,
                    })
                  }
                />
              )}
            />
          )}
        </View>

        {/* All Courses Vertical List Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Mentorships</Text>
          {filteredCourses.slice(0, 4).map((course, idx) => (
            <CourseCard
              key={course._id || idx}
              course={course}
              onPress={(c) =>
                navigation.navigate('CourseDetails', {
                  slug: c.slug || c._id,
                  course: c,
                })
              }
            />
          ))}
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
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  greeting: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langBtn: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  langBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  notificationBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#ef4444',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchPlaceholder: {
    color: colors.textMuted,
    fontSize: 14,
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  heroContent: {
    gap: 8,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textLight,
    lineHeight: 26,
    marginTop: 4,
  },
  heroSub: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  heroActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#fbf9f2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    marginTop: 8,
  },
  heroActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  livePulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.error,
  },
  liveClassCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  liveClassTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  liveCourseTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  liveTimeText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  liveActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  whatsappBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  categoryScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    marginVertical: 10,
  },
});
