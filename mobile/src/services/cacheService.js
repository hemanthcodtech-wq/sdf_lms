import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image, Platform } from 'react-native';
import { getCourseImageUrl, getAvatarUrl } from '../utils/imageHelper';

// In-memory synchronous cache store for zero-delay (0ms) reads across tabs & screens
const memoryCache = {
  publicCourses: [],
  myCourses: [],
  studentClasses: [],
  userProfile: null,
  userStats: { enrolledCount: 0, certificatesCount: 0, paymentsCount: 0 },
  courseClasses: {},
  courseMaterials: {},
};

const STORAGE_KEYS = {
  PUBLIC_COURSES: '@sdf_cached_public_courses',
  MY_COURSES: '@sdf_cached_my_courses',
  STUDENT_CLASSES: '@sdf_cached_student_classes',
  USER_PROFILE: '@sdf_cached_user_profile',
  USER_STATS: '@sdf_cached_user_stats',
  CLASSES_PREFIX: '@sdf_cached_classes_',
  MATERIALS_PREFIX: '@sdf_cached_materials_',
};

export const cacheService = {
  /**
   * Initializes cache into memory synchronously from AsyncStorage during splash/app launch
   */
  initCache: async () => {
    try {
      const keys = [
        STORAGE_KEYS.PUBLIC_COURSES,
        STORAGE_KEYS.MY_COURSES,
        STORAGE_KEYS.STUDENT_CLASSES,
        STORAGE_KEYS.USER_PROFILE,
        STORAGE_KEYS.USER_STATS,
      ];

      const stores = await AsyncStorage.multiGet(keys);
      stores.forEach(([key, value]) => {
        if (!value) return;
        try {
          const parsed = JSON.parse(value);
          if (key === STORAGE_KEYS.PUBLIC_COURSES && Array.isArray(parsed)) {
            memoryCache.publicCourses = parsed;
          } else if (key === STORAGE_KEYS.MY_COURSES && Array.isArray(parsed)) {
            memoryCache.myCourses = parsed;
          } else if (key === STORAGE_KEYS.STUDENT_CLASSES && Array.isArray(parsed)) {
            memoryCache.studentClasses = parsed;
          } else if (key === STORAGE_KEYS.USER_PROFILE && parsed) {
            memoryCache.userProfile = parsed;
          } else if (key === STORAGE_KEYS.USER_STATS && parsed) {
            memoryCache.userStats = parsed;
          }
        } catch (e) {
          // ignore corrupted single key
        }
      });

      // Trigger parallel prefetching of cached images right away
      if (Platform.OS !== 'web') {
        cacheService.prefetchCachedImages();
      }
      return true;
    } catch (err) {
      console.warn('Cache initialization error:', err);
      return false;
    }
  },

  // --- Synchronous Getters (Instant 0ms retrieval) ---
  getCourses: () => memoryCache.publicCourses,
  getMyCourses: () => memoryCache.myCourses,
  getStudentClasses: () => memoryCache.studentClasses,
  getUserProfile: () => memoryCache.userProfile,
  getUserStats: () => memoryCache.userStats,
  getCourseClasses: (courseId) => memoryCache.courseClasses[courseId] || [],
  getCourseMaterials: (courseId) => memoryCache.courseMaterials[courseId] || [],

  // --- Asynchronous Setters (Write to Memory + Persist to Disk) ---
  setCourses: async (courses) => {
    if (!Array.isArray(courses)) return;
    memoryCache.publicCourses = courses;
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PUBLIC_COURSES, JSON.stringify(courses));
      if (Platform.OS !== 'web') {
        courses.slice(0, 20).forEach((c) => {
          const url = getCourseImageUrl(c.thumbnail || c.thumbnailUrl || c.image);
          if (url) Image.prefetch(url).catch(() => {});
        });
      }
    } catch (e) {}
  },

  setMyCourses: async (myCourses) => {
    if (!Array.isArray(myCourses)) return;
    memoryCache.myCourses = myCourses;
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MY_COURSES, JSON.stringify(myCourses));
    } catch (e) {}
  },

  setStudentClasses: async (classes) => {
    if (!Array.isArray(classes)) return;
    memoryCache.studentClasses = classes;
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.STUDENT_CLASSES, JSON.stringify(classes));
    } catch (e) {}
  },

  setUserProfile: async (profile) => {
    if (!profile) return;
    memoryCache.userProfile = profile;
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
      const avatarUrl = getAvatarUrl(profile.avatar || profile.profileImage);
      if (avatarUrl && Platform.OS !== 'web') {
        Image.prefetch(avatarUrl).catch(() => {});
      }
    } catch (e) {}
  },

  setUserStats: async (stats) => {
    if (!stats) return;
    memoryCache.userStats = stats;
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_STATS, JSON.stringify(stats));
    } catch (e) {}
  },

  setCourseClasses: async (courseId, classes) => {
    if (!courseId || !Array.isArray(classes)) return;
    memoryCache.courseClasses[courseId] = classes;
    try {
      await AsyncStorage.setItem(`${STORAGE_KEYS.CLASSES_PREFIX}${courseId}`, JSON.stringify(classes));
    } catch (e) {}
  },

  setCourseMaterials: async (courseId, materials) => {
    if (!courseId || !Array.isArray(materials)) return;
    memoryCache.courseMaterials[courseId] = materials;
    try {
      await AsyncStorage.setItem(`${STORAGE_KEYS.MATERIALS_PREFIX}${courseId}`, JSON.stringify(materials));
    } catch (e) {}
  },

  /**
   * Prefetch multiple images into native disk/memory cache
   */
  prefetchImages: (urls = []) => {
    if (Platform.OS === 'web' || !Array.isArray(urls)) return;
    urls.filter(Boolean).forEach((url) => {
      try {
        Image.prefetch(url).catch(() => {});
      } catch (e) {}
    });
  },

  /**
   * Prefetches all cached course images and user avatar for 0-delay display
   */
  prefetchCachedImages: () => {
    if (Platform.OS === 'web') return;

    // 1. Prefetch user avatar
    if (memoryCache.userProfile) {
      const avatar = getAvatarUrl(
        memoryCache.userProfile.avatar ||
        memoryCache.userProfile.profileImage ||
        memoryCache.userProfile.photoURL
      );
      if (avatar) Image.prefetch(avatar).catch(() => {});
    }

    // 2. Prefetch course thumbnails
    if (Array.isArray(memoryCache.publicCourses)) {
      memoryCache.publicCourses.slice(0, 15).forEach((c) => {
        const url = getCourseImageUrl(c.thumbnail || c.thumbnailUrl || c.image);
        if (url) Image.prefetch(url).catch(() => {});
      });
    }

    // 3. Prefetch enrolled course thumbnails
    if (Array.isArray(memoryCache.myCourses)) {
      memoryCache.myCourses.forEach((mc) => {
        const c = mc.course || mc;
        const url = getCourseImageUrl(c.thumbnail || c.thumbnailUrl || c.image);
        if (url) Image.prefetch(url).catch(() => {});
      });
    }
  },

  /**
   * Clear user-specific cache on logout
   */
  clearUserCache: async () => {
    memoryCache.myCourses = [];
    memoryCache.studentClasses = [];
    memoryCache.userProfile = null;
    memoryCache.userStats = { enrolledCount: 0, certificatesCount: 0, paymentsCount: 0 };
    memoryCache.courseClasses = {};
    memoryCache.courseMaterials = {};
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.MY_COURSES,
        STORAGE_KEYS.STUDENT_CLASSES,
        STORAGE_KEYS.USER_PROFILE,
        STORAGE_KEYS.USER_STATS,
      ]);
    } catch (e) {}
  },
};
