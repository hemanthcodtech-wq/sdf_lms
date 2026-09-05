import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const NOTIFICATIONS_STORAGE_KEY = '@sdf_app_notifications_v1';
const DISMISSED_STORAGE_KEY = '@sdf_dismissed_notifications_v1';
const LAST_CLEARED_TIMESTAMP_KEY = '@sdf_last_cleared_notifications_v1';

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
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            bypassDnd: true,
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
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        return finalStatus === 'granted';
      }
    } catch (e) {
      console.warn('Notification permission request error:', e);
    }
    return false;
  },

  /**
   * Send external system notification immediately to Android status bar / tray
   */
  sendInstantNotification: async (title, body, data = {}) => {
    try {
      const Notifications = require('expo-notifications');
      if (Notifications?.scheduleNotificationAsync) {
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Swami Dwija Live Classes',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#0D5C31',
            sound: 'default',
            enableVibrate: true,
            showBadge: true,
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          });
        }

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
   * Sync upcoming live class alarms into Android system NotificationManager
   */
  syncUpcomingClassReminders: async (liveClasses = []) => {
    try {
      const Notifications = require('expo-notifications');
      if (!Notifications?.scheduleNotificationAsync) return;

      // Cancel old scheduled alarms to prevent duplicates
      await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});

      const now = new Date();
      for (const cls of liveClasses) {
        if (!cls.date) continue;
        const datePart = new Date(cls.date).toISOString().split('T')[0];
        let h = 6, m = 0;
        if (cls.time) {
          const parts = cls.time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
          if (parts) {
            let hour = parseInt(parts[1], 10);
            const min = parseInt(parts[2], 10);
            const ampm = parts[3] ? parts[3].toUpperCase() : null;
            if (ampm === 'PM' && hour < 12) hour += 12;
            if (ampm === 'AM' && hour === 12) hour = 0;
            h = hour;
            m = min;
          }
        }
        const timePart = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00+05:30`;
        const sessionStart = new Date(`${datePart}T${timePart}`);

        // 1. Schedule 2 minutes before session start
        const reminderTime2Min = new Date(sessionStart.getTime() - 2 * 60 * 1000);
        if (reminderTime2Min > now) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `🔴 Live Session Starting in 2 Minutes!`,
              body: `"${cls.title}" starts in 2 minutes. Tap to join Zoom now!`,
              data: { zoomLink: cls.zoomLink || cls.zoomJoinUrl, classId: cls._id },
              sound: 'default',
              channelId: 'default',
              priority: Notifications.AndroidNotificationPriority?.MAX,
            },
            trigger: reminderTime2Min,
          }).catch(() => {});
        }

        // 2. Schedule 15 minutes before if in the future
        const reminderTime15 = new Date(sessionStart.getTime() - 15 * 60 * 1000);
        if (reminderTime15 > now) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `⏰ Live Class in 15 Minutes!`,
              body: `"${cls.title}" is starting soon. Get ready to join your live session on Zoom!`,
              data: { zoomLink: cls.zoomLink || cls.zoomJoinUrl, classId: cls._id },
              sound: 'default',
              channelId: 'default',
              priority: Notifications.AndroidNotificationPriority?.HIGH,
            },
            trigger: reminderTime15,
          }).catch(() => {});
        }

        // 3. Schedule at start time if in the future
        if (sessionStart > now) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `🔴 Live Session Starting Now!`,
              body: `"${cls.title}" has started. Tap to join Zoom immediately!`,
              data: { zoomLink: cls.zoomLink || cls.zoomJoinUrl, classId: cls._id },
              sound: 'default',
              channelId: 'default',
              priority: Notifications.AndroidNotificationPriority?.MAX,
            },
            trigger: sessionStart,
          }).catch(() => {});
        }
      }
    } catch (e) {
      console.warn('Error syncing class reminders:', e);
    }
  },

  /**
   * Get all stored in-app notifications (filtering out swiped/dismissed ones)
   */
  getNotifications: async (user, liveClasses = [], myCourses = []) => {
    try {
      const [raw, dismissedRaw, lastClearedRaw] = await Promise.all([
        AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY),
        AsyncStorage.getItem(DISMISSED_STORAGE_KEY),
        AsyncStorage.getItem(LAST_CLEARED_TIMESTAMP_KEY),
      ]);

      const lastClearedTime = lastClearedRaw ? parseInt(lastClearedRaw, 10) : 0;
      let list = raw ? JSON.parse(raw) : [];
      const dismissedIds = new Set(dismissedRaw ? JSON.parse(dismissedRaw) : []);

      // Filter stored notifications: must be created AFTER lastClearedTime and not dismissed
      list = list.filter((item) => {
        if (!item || !item.id || dismissedIds.has(item.id)) return false;
        if (item.createdAt) {
          const itemTime = new Date(item.createdAt).getTime();
          if (itemTime <= lastClearedTime) return false;
        }
        return true;
      });

      const dynamicLiveNotifications = [];
      const now = new Date();

      if (Array.isArray(liveClasses)) {
        liveClasses.forEach((cls) => {
          if (!cls || !cls.date) return;

          let sessionStart = new Date(cls.date);
          let sessionEnd = new Date(sessionStart.getTime() + (cls.durationMinutes || 60) * 60 * 1000);

          if (cls.time) {
            const parts = cls.time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
            if (parts) {
              let hour = parseInt(parts[1], 10);
              const min = parseInt(parts[2], 10);
              const ampm = parts[3] ? parts[3].toUpperCase() : null;
              if (ampm === 'PM' && hour < 12) hour += 12;
              if (ampm === 'AM' && hour === 12) hour = 0;

              const rawDate = typeof cls.date === 'string'
                ? (cls.date.includes('T') ? cls.date.split('T')[0] : cls.date)
                : new Date(cls.date).toISOString().split('T')[0];
              const [y, m, d] = rawDate.split('-').map(Number);
              if (y && m && d) {
                sessionStart = new Date(y, m - 1, d, hour, min, 0, 0);
                sessionEnd = new Date(sessionStart.getTime() + (cls.durationMinutes || 60) * 60 * 1000);
              }
            }
          }

          // Do not show notification for completed sessions
          if (now > sessionEnd) return;

          // If the session was scheduled before the user cleared all notifications, do NOT show
          if (sessionStart.getTime() <= lastClearedTime) return;

          const diffMinutes = Math.round((sessionStart - now) / (1000 * 60));

          // Only show for upcoming sessions within 24 hours or ongoing up to 60 mins
          if (diffMinutes >= -60 && diffMinutes <= 1440) {
            const isUrgent = diffMinutes <= 15 && diffMinutes >= -15;
            const notifId = `live_${cls._id || cls.id}`;

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
                createdAt: sessionStart.toISOString(),
              });
            }
          }
        });
      }

      if (Array.isArray(myCourses) && myCourses.length > 0) {
        myCourses.forEach((enroll) => {
          if (!enroll) return;
          const courseTitle = enroll.course?.title || enroll.title || 'Your Course';
          const courseId = enroll.course?._id || enroll._id;
          if (!courseId) return;

          // Certificate notification if course is completed
          if (enroll.completed || enroll.certificateId) {
            const certNotifId = `cert_${courseId}`;
            const certDate = enroll.completedAt || enroll.updatedAt;
            const certTime = certDate ? new Date(certDate).getTime() : 0;

            if (certTime > lastClearedTime && !dismissedIds.has(certNotifId)) {
              dynamicLiveNotifications.push({
                id: certNotifId,
                type: 'certificate',
                title: '🏆 Certificate of Completion Issued!',
                message: `Congratulations! Your official certificate for "${courseTitle}" has been issued and is available in your account.`,
                time: 'Certificate Ready',
                unread: true,
                urgent: false,
                createdAt: certDate || new Date().toISOString(),
              });
            }
          }

          // Enrollment notification: ONLY if enrolled freshly (after lastClearedTime AND within last 48 hours)
          const enrollDate = enroll.createdAt;
          const enrollTime = enrollDate ? new Date(enrollDate).getTime() : 0;
          const isRecentEnrollment = enrollTime > 0 && (Date.now() - enrollTime) < 48 * 60 * 60 * 1000;

          if (isRecentEnrollment && enrollTime > lastClearedTime) {
            const notifId = `enroll_${courseId}`;
            if (!dismissedIds.has(notifId)) {
              dynamicLiveNotifications.push({
                id: notifId,
                type: 'course_enrolled',
                title: '🎓 Course Access Active',
                message: `You are enrolled in "${courseTitle}". All daily live classes & recordings are unlocked.`,
                time: 'Enrolled',
                unread: false,
                createdAt: enrollDate,
              });
            }
          }
        });
      }

      // Merge and deduplicate
      const map = new Map();
      [...dynamicLiveNotifications, ...list].forEach((item) => {
        if (item && item.id && !dismissedIds.has(item.id) && !map.has(item.id)) {
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
    } catch (e) {
      console.error('Error in removeNotification:', e);
    }
  },

  /**
   * Clear all notifications
   */
  clearAll: async (currentIds = []) => {
    try {
      const now = Date.now();
      await AsyncStorage.setItem(LAST_CLEARED_TIMESTAMP_KEY, String(now));
      await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify([]));
      const dismissedRaw = await AsyncStorage.getItem(DISMISSED_STORAGE_KEY);
      const dismissedList = dismissedRaw ? JSON.parse(dismissedRaw) : [];
      const updated = Array.from(new Set([...dismissedList, ...currentIds]));
      await AsyncStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error in clearAll notifications:', e);
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
