import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../../theme/colors';
import { Badge } from '../../components/Badge';
import { CustomButton } from '../../components/CustomButton';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { courseService } from '../../services/courseService';
import { getCourseImageUrl } from '../../utils/imageHelper';
import { cacheService } from '../../services/cacheService';

export const CourseDetailsScreen = ({ route, navigation }) => {
  const { slug, course: initialCourse } = route.params;
  const insets = useSafeAreaInsets();
  const { user, isInWishlist, toggleWishlist } = useAuth();
  const { t } = useLanguage();

  const targetId = (initialCourse?._id || slug)?.toString();
  const initialEnrolled = Boolean(
    user &&
    cacheService.getMyCourses().some(
      (e) => (e.course?._id || e.course || e._id || '').toString() === targetId
    )
  );

  const [course, setCourse] = useState(initialCourse || null);
  const [loading, setLoading] = useState(!initialCourse);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'curriculum', 'instructor'
  const [isEnrolled, setIsEnrolled] = useState(initialEnrolled);

  useEffect(() => {
    fetchCourseDetails();
  }, [slug]);

  const fetchCourseDetails = async () => {
    try {
      if (!initialCourse) setLoading(true);
      const res = await courseService.getCourseDetails(slug);
      if (res?.data) {
        setCourse(res.data);
      }
      // Check enrollment
      if (user) {
        const cached = cacheService.getMyCourses();
        if (cached && cached.length > 0) {
          const found = cached.some(
            (e) => (e.course?._id || e.course || e._id || '').toString() === (res?.data?._id || targetId)
          );
          setIsEnrolled(found);
        } else {
          const enrollRes = await courseService.getMyCourses();
          if (enrollRes?.data) {
            cacheService.setMyCourses(enrollRes.data);
            const found = enrollRes.data.some(
              (e) => (e.course?._id || e.course || e._id || '').toString() === (res?.data?._id || targetId)
            );
            setIsEnrolled(found);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching course details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this course: ${course?.title || 'SDF LMS Course'} on SDF LMS!`,
      });
    } catch (error) {}
  };

  const handleEnrollOrOpen = () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to enroll in this course.', [
        { text: 'Cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Auth') },
      ]);
      return;
    }

    if (isEnrolled) {
      navigation.navigate('StudentClasses', { course });
    } else {
      navigation.navigate('Checkout', { course });
    }
  };

  if (loading || !course) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const wishlisted = isInWishlist(course._id);
  const fallbackThumbnail = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800';

  return (
    <View style={styles.container}>
      {/* Top Floating Header */}
      <View style={[styles.floatingHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Ionicons name="share-social-outline" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => toggleWishlist(course)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={wishlisted ? 'heart' : 'heart-outline'}
              size={20}
              color={wishlisted ? colors.error : colors.textPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: getCourseImageUrl(course.thumbnail || course.thumbnailUrl || course.image), cache: 'force-cache' }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.body}>
          {/* Metadata badges */}
          <View style={styles.badgeRow}>
            {course.category ? <Badge text={course.category} variant="primary" /> : null}
            {course.level ? <Badge text={course.level} variant="secondary" /> : null}
            <Badge text={course.language || 'English'} variant="dark" />
          </View>

          <Text style={styles.title}>{course.title}</Text>

          {/* Quick Info Grid */}
          <View style={[styles.infoGrid, shadows.sm]}>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={styles.infoLabel}>Duration</Text>
              <Text style={styles.infoValue}>
                {course.duration || (course.durationMonths ? `${course.durationMonths} Months` : 'Self-Paced')}
              </Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Ionicons name="videocam-outline" size={20} color={colors.primary} />
              <Text style={styles.infoLabel}>Live Sessions</Text>
              <Text style={styles.infoValue}>{course.timings || 'Weekly Live'}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Ionicons name="ribbon-outline" size={20} color={colors.primary} />
              <Text style={styles.infoLabel}>Certificate</Text>
              <Text style={styles.infoValue}>Included</Text>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabBar}>
            {['overview', 'curriculum', 'instructor'].map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              >
                <Text
                  style={[styles.tabText, activeTab === tab && styles.tabTextActive]}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionHeading}>About this Course</Text>
              <Text style={styles.descriptionText}>
                {course.description || 'Comprehensive interactive course designed by experts to elevate your skills and spiritual wisdom.'}
              </Text>

              {course.whatYouWillLearn && course.whatYouWillLearn.length > 0 && (
                <View style={styles.learnSection}>
                  <Text style={styles.sectionHeading}>What You Will Learn</Text>
                  {course.whatYouWillLearn.map((item, idx) => (
                    <View key={idx} style={styles.learnRow}>
                      <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                      <Text style={styles.learnText}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {activeTab === 'curriculum' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionHeading}>Course Topics & Sessions</Text>
              {course.topics && course.topics.length > 0 ? (
                course.topics.map((topic, idx) => (
                  <View key={idx} style={[styles.topicCard, shadows.sm]}>
                    <View style={styles.topicNumber}>
                      <Text style={styles.topicNumberText}>{idx + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.topicTitle}>{topic.title || topic}</Text>
                      {topic.description ? (
                        <Text style={styles.topicDesc}>{topic.description}</Text>
                      ) : null}
                    </View>
                    <Ionicons name="play-circle-outline" size={24} color={colors.secondary} />
                  </View>
                ))
              ) : (
                <Text style={styles.emptyTabNote}>Curriculum details will be shared during live orientation.</Text>
              )}
            </View>
          )}

          {activeTab === 'instructor' && (
            <View style={styles.tabContent}>
              <View style={styles.instructorProfile}>
                <View style={styles.instructorAvatar}>
                  <Ionicons name="person" size={32} color="#fff" />
                </View>
                <View>
                  <Text style={styles.instructorName}>
                    {course.instructor || course.instructorId?.name || 'Senior Faculty'}
                  </Text>
                  <Text style={styles.instructorSpecialty}>
                    {course.instructorId?.speciality || 'Master Teacher & Mentor'}
                  </Text>
                </View>
              </View>
              <Text style={styles.instructorBio}>
                {course.instructorId?.bio ||
                  'Experienced instructor with extensive background in delivering transformative learning experiences and personalized guidance.'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky Bottom Pricing & Action Bar */}
      <View style={[styles.stickyBottom, { paddingBottom: insets.bottom + 10 }]}>
        <View>
          <Text style={styles.bottomPriceLabel}>Course Fee</Text>
          <Text style={styles.bottomPrice}>
            {course.price && Number(course.price) > 0
              ? `₹${Number(course.price).toLocaleString('en-IN')}`
              : 'Free'}
          </Text>
        </View>

        <CustomButton
          title={isEnrolled ? 'Go to Classes' : t('enrollNow')}
          onPress={handleEnrollOrOpen}
          variant={isEnrolled ? 'secondary' : 'primary'}
          size="lg"
          style={{ flex: 1, marginLeft: 16 }}
          icon={
            <Ionicons
              name={isEnrolled ? 'play-forward' : 'flash'}
              size={18}
              color="#fff"
            />
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  circleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRightActions: {
    flexDirection: 'row',
    gap: 10,
  },
  scrollContent: {
    flexGrow: 1,
  },
  imageContainer: {
    width: '100%',
    height: 240,
    backgroundColor: '#000',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  body: {
    padding: 20,
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 28,
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 20,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  infoDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  infoLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 16,
  },
  tabBtn: {
    paddingVertical: 12,
    marginRight: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  tabContent: {
    paddingVertical: 8,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 20,
  },
  learnSection: {
    marginTop: 10,
  },
  learnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  learnText: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  topicNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  topicTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  topicDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyTabNote: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 8,
  },
  instructorProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  instructorAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructorName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  instructorSpecialty: {
    fontSize: 13,
    color: colors.secondary,
    marginTop: 2,
  },
  instructorBio: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  stickyBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomPriceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  bottomPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
});
