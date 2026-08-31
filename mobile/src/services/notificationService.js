import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const NOTIFICATIONS_STORAGE_KEY = '@sdf_app_notifications_v1';
const DISMISSED_STORAGE_KEY = '@sdf_dismissed_notifications_v1';

export const notificationService = {
  /**
   * Initialize foreground handler and Android Notification Channels
   */
  init: async () => {
    try {
      const Notifications = require('expo-notifications');
      if (Notifications) {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          }),
        });

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Swami Dwija Live Classes',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#0D5C31',
            sound: 'default',
            enableVibrate: true,
            showBadge: true,
          });
        }
      }
    } catch (e) {
      // Graceful fallback
    }
  },

  /**
   * Request system notification permissions
   */
  requestPermissions: async () => {
    try {
      const Notifications = require('expo-notifications');
      if (Notifications?.requestPermissionsAsync) {
        const { status } = await Notifications.requestPermissionsAsync();
        return status === 'granted';
      }
    } catch (e) {}
    return false;
  },

  /**
   * Send external system notification immediately to Android status bar / tray
   */
  sendInstantNotification: async (title, body, data = {}) => {
    try {
      const Notifications = require('expo-notifications');
      if (Notifications?.scheduleNotificationAsync) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: title || '🔔 Swamy Dwija Foundation',
            body: body || 'Live interactive session starting. Tap to join.',
            data,
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority?.MAX,
            channelId: 'default',
          },
          trigger: null, // Instant trigger to Android notification drawer
        });
      }
    } catch (e) {
      console.warn('Could not fire external notification:', e.message);
    }
  },

  /**
   * Schedule a local notification
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
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority?.HIGH,
            channelId: 'default',
          },
          trigger: triggerDate instanceof Date ? triggerDate : { seconds: 5 },
        });
      }
    } catch (e) {
      console.warn('Could not schedule local notification:', e.message);
    }
  },

  /**
   * Get all stored in-app notifications (filtering out swiped/dismissed ones)
   */
  getNotifications: async (user, liveClasses = [], myCourses = []) => {
    try {
      const [raw, dismissedRaw] = await Promise.all([
        AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY),
        AsyncStorage.getItem(DISMISSED_STORAGE_KEY),
      ]);

      let list = raw ? JSON.parse(raw) : [];
      const dismissedIds = new Set(dismissedRaw ? JSON.parse(dismissedRaw) : []);

      const dynamicLiveNotifications = [];
      const now = new Date();

      if (Array.isArray(liveClasses)) {
        liveClasses.forEach((cls) => {
          if (cls.date) {
            const classTime = new Date(cls.date);
            const diffMinutes = Math.round((classTime - now) / (1000 * 60));

            if (diffMinutes >= -60 && diffMinutes <= 1440) {
              const isUrgent = diffMinutes <= 15 && diffMinutes >= -30;
              const notifId = `live_${cls._id || cls.id}_${cls.date}`;

              if (!dismissedIds.has(notifId)) {
                dynamicLiveNotifications.push({
                  id: notifId,
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
          }
        });
      }

      if (Array.isArray(myCourses) && myCourses.length > 0) {
        myCourses.slice(0, 3).forEach((enroll) => {
          const courseTitle = enroll.course?.title || enroll.title || 'Your Course';
          const courseId = enroll.course?._id || enroll._id;
          const notifId = `enroll_${courseId}`;

          if (!dismissedIds.has(notifId)) {
            dynamicLiveNotifications.push({
              id: notifId,
              type: 'course_enrolled',
              title: '🎓 Course Access Active',
              message: `You are enrolled in "${courseTitle}". All daily live classes & recordings are unlocked.`,
              time: 'Enrolled',
              unread: false,
              createdAt: enroll.createdAt || new Date().toISOString(),
            });
          }
        });
      }

      // Merge and deduplicate
      const map = new Map();
      [...dynamicLiveNotifications, ...list].forEach((item) => {
        if (!dismissedIds.has(item.id) && !map.has(item.id)) {
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
   * Delete / swipe clear single notification
   */
  removeNotification: async (id) => {
    try {
      const [raw, dismissedRaw] = await Promise.all([
        AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY),
        AsyncStorage.getItem(DISMISSED_STORAGE_KEY),
      ]);

      if (raw) {
        const list = JSON.parse(raw).filter((n) => n.id !== id);
        await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list));
      }

      const dismissedList = dismissedRaw ? JSON.parse(dismissedRaw) : [];
      if (!dismissedList.includes(id)) {
        dismissedList.push(id);
        await AsyncStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(dismissedList));
      }
    } catch (e) {}
  },

  /**
   * Clear all notifications
   */
  clearAll: async (currentIds = []) => {
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify([]));
      const dismissedRaw = await AsyncStorage.getItem(DISMISSED_STORAGE_KEY);
      const dismissedList = dismissedRaw ? JSON.parse(dismissedRaw) : [];
      const updated = Array.from(new Set([...dismissedList, ...currentIds]));
      await AsyncStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
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
   * Add a new custom notification
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

      // Trigger external OS notification
      notificationService.sendInstantNotification(item.title, item.message, item);
      return item;
    } catch (e) {
      console.error('Error adding notification:', e);
    }
  },
};
