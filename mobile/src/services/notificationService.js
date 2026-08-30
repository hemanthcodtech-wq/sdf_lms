import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const NOTIFICATIONS_STORAGE_KEY = '@sdf_app_notifications_v1';

export const notificationService = {
  /**
   * Request system notification permissions (if available)
   */
  requestPermissions: async () => {
    try {
      const Notifications = require('expo-notifications');
      if (Notifications?.requestPermissionsAsync) {
        const { status } = await Notifications.requestPermissionsAsync();
        return status === 'granted';
      }
    } catch (e) {
      // Graceful fallback if native module is not yet linked in running dev bundle
    }
    return false;
  },

  /**
   * Schedule a local notification e.g. 5 minutes before class
   */
  scheduleClassReminder: async (title, body, triggerDate, data = {}) => {
    try {
      const Notifications = require('expo-notifications');
      if (Notifications?.scheduleNotificationAsync) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: title || '🔔 Swamy Dwija Foundation Live Class',
            body: body || 'Your live session is starting in 5 minutes! Tap to join Zoom.',
            data,
            sound: true,
            priority: Notifications.AndroidNotificationPriority?.HIGH,
          },
          trigger: triggerDate instanceof Date ? triggerDate : { seconds: 5 },
        });
      }
    } catch (e) {
      console.warn('Could not schedule local notification:', e.message);
    }
  },

  /**
   * Get all stored in-app notifications
   */
  getNotifications: async (user, liveClasses = [], myCourses = []) => {
    try {
      const raw = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      let list = raw ? JSON.parse(raw) : [];

      // Generate dynamic notifications from liveClasses (upcoming in 5-30 mins)
      const dynamicLiveNotifications = [];
      const now = new Date();

      if (Array.isArray(liveClasses)) {
        liveClasses.forEach((cls) => {
          if (cls.date) {
            const classTime = new Date(cls.date);
            const diffMinutes = Math.round((classTime - now) / (1000 * 60));

            // If class is within the next 24 hours
            if (diffMinutes >= -60 && diffMinutes <= 1440) {
              const isUrgent = diffMinutes <= 15 && diffMinutes >= -30;
              dynamicLiveNotifications.push({
                id: `live_${cls._id || cls.id}_${cls.date}`,
                type: 'live_class',
                title: isUrgent ? '🔴 Live Session Starting Now!' : '⏰ Upcoming Live Class',
                message: isUrgent
                  ? `"${cls.title}" is starting in less than 5 minutes! Tap to join the live Zoom session.`
                  : `"${cls.title}" is scheduled for ${cls.time || 'today'}. Get ready!`,
                time: cls.time || 'Today',
                date: cls.date,
                zoomLink: cls.zoomLink || cls.zoomJoinUrl,
                unread: isUrgent,
                urgent: isUrgent,
                createdAt: new Date().toISOString(),
              });
            }
          }
        });
      }

      // Generate dynamic notifications for enrolled courses
      if (Array.isArray(myCourses) && myCourses.length > 0) {
        myCourses.slice(0, 3).forEach((enroll) => {
          const courseTitle = enroll.course?.title || enroll.title || 'Your Course';
          const courseId = enroll.course?._id || enroll._id;
          dynamicLiveNotifications.push({
            id: `enroll_${courseId}`,
            type: 'course_enrolled',
            title: '🎓 Course Access Active',
            message: `You are enrolled in "${courseTitle}". All daily live classes & recordings are unlocked.`,
            time: 'Enrolled',
            unread: false,
            createdAt: enroll.createdAt || new Date().toISOString(),
          });
        });
      }

      // Merge and deduplicate by id
      const map = new Map();
      [...dynamicLiveNotifications, ...list].forEach((item) => {
        if (!map.has(item.id)) {
          map.set(item.id, item);
        }
      });

      return Array.from(map.values());
    } catch (e) {
      console.error('Error reading notifications:', e);
      return [];
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    try {
      const raw = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (raw) {
        const list = JSON.parse(raw).map((n) => ({ ...n, unread: false }));
        await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list));
      }
    } catch (e) {}
  },

  /**
   * Add a new custom in-app notification
   */
  addNotification: async (notification) => {
    try {
      const raw = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const item = {
        id: 'notif_' + Date.now(),
        unread: true,
        createdAt: new Date().toISOString(),
        ...notification,
      };
      list.unshift(item);
      await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list));
      return item;
    } catch (e) {
      console.error('Error adding notification:', e);
    }
  },
};
