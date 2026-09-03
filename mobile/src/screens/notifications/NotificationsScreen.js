import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Alert,
  Platform,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { courseService } from '../../services/courseService';
import { notificationService } from '../../services/notificationService';

const SCREEN_WIDTH = Dimensions.get('window').width;

const SwipeableNotificationItem = ({ item, onDismiss, onAction }) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const isLive = item.type === 'live_class';
  const isUrgent = item.urgent;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 12 && Math.abs(gestureState.dy) < 15;
      },
      onPanResponderMove: (_, gestureState) => {
        pan.setValue({ x: gestureState.dx, y: 0 });
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 100 || gestureState.vx > 0.5) {
          // Swiped Right -> Dismiss
          Animated.timing(pan, {
            toValue: { x: SCREEN_WIDTH + 50, y: 0 },
            duration: 180,
            useNativeDriver: true,
          }).start(() => onDismiss(item.id));
        } else if (gestureState.dx < -100 || gestureState.vx < -0.5) {
          // Swiped Left -> Dismiss
          Animated.timing(pan, {
            toValue: { x: -SCREEN_WIDTH - 50, y: 0 },
            duration: 180,
            useNativeDriver: true,
          }).start(() => onDismiss(item.id));
        } else {
          // Spring back
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View style={styles.swipeContainer}>
      {/* Red Background Behind Card on Swipe */}
      <View style={styles.swipeBackground}>
        <View style={styles.swipeBgSide}>
          <Ionicons name="trash" size={20} color="#dc2626" />
          <Text style={styles.swipeBgText}>Dismiss</Text>
        </View>
        <View style={[styles.swipeBgSide, { alignItems: 'flex-end' }]}>
          <Ionicons name="trash" size={20} color="#dc2626" />
          <Text style={styles.swipeBgText}>Dismiss</Text>
        </View>
      </View>

      {/* Swipeable Card Foreground */}
      <Animated.View
        style={[
          styles.card,
          item.unread && styles.unreadCard,
          isUrgent && styles.urgentCard,
          shadows.sm,
          {
            transform: [{ translateX: pan.x }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.cardInner}
          onPress={() => onAction(item)}
          activeOpacity={0.9}
        >
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: isUrgent
                  ? 'rgba(239, 68, 68, 0.12)'
                  : isLive
                  ? 'rgba(13, 92, 49, 0.12)'
                  : 'rgba(234, 122, 40, 0.12)',
              },
            ]}
          >
            <Ionicons
              name={
                isUrgent
                  ? 'videocam'
                  : isLive
                  ? 'videocam-outline'
                  : item.type === 'course_enrolled'
                  ? 'school-outline'
                  : 'notifications-outline'
              }
              size={22}
              color={isUrgent ? '#ef4444' : isLive ? colors.primary : colors.secondary}
            />
          </View>

          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, isUrgent && { color: '#dc2626' }]}>
                {item.title}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {item.unread && <View style={styles.unreadDot} />}
                <TouchableOpacity
                  onPress={() => onDismiss(item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.cardMessage}>{item.message}</Text>

            {isLive && item.zoomLink && (
              <TouchableOpacity
                style={[styles.joinBtn, isUrgent && styles.joinBtnUrgent]}
                onPress={() => onAction(item)}
                activeOpacity={0.8}
              >
                <Ionicons name="videocam" size={14} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.joinBtnText}>
                  {isUrgent ? 'Join Live Zoom (Starting Now)' : 'Open Zoom Link'}
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.cardFooter}>
              <Text style={styles.timeText}>{item.time || 'Recent'}</Text>
              <Text style={styles.swipeHintText}>Swipe to clear ↔</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export const NotificationsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    try {
      let liveClasses = [];
      let myCourses = [];

      if (user) {
        try {
          const [classRes, enrollRes] = await Promise.all([
            courseService.getStudentClasses(),
            courseService.getMyCourses(),
          ]);
          if (classRes?.data) liveClasses = classRes.data;
          if (enrollRes?.data) myCourses = enrollRes.data;
        } catch (e) {}
      }

      if (liveClasses.length > 0) {
        notificationService.syncUpcomingClassReminders(liveClasses);
      }

      const list = await notificationService.getNotifications(user, liveClasses, myCourses);
      setNotifications(list);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
    notificationService.requestPermissions();
  }, [loadNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleDismiss = async (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await notificationService.removeNotification(id);
  };

  const handleClearAll = () => {
    if (notifications.length === 0) return;
    Alert.alert('Clear Notifications', 'Are you sure you want to clear all notifications?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: async () => {
          const ids = notifications.map((n) => n.id);
          setNotifications([]);
          await notificationService.clearAll(ids);
        },
      },
    ]);
  };

  const handleAction = (item) => {
    if (item.type === 'live_class' && item.zoomLink) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(item.zoomLink, '_blank', 'noopener,noreferrer');
      } else {
        Linking.openURL(item.zoomLink).catch(() => {
          Alert.alert('Error', 'Unable to open Zoom link.');
        });
      }
    } else if (item.type === 'course_enrolled') {
      navigation.navigate('LearningTab');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === 'web' ? 14 : Math.max(insets.top, 20) },
        ]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={handleClearAll}
          activeOpacity={0.7}
        >
          <Text style={styles.clearBtnText}>Clear all</Text>
        </TouchableOpacity>
      </View>

      {/* Test External Notification Banner */}
      <TouchableOpacity
        style={styles.testNotificationBtn}
        onPress={async () => {
          const granted = await notificationService.requestPermissions();
          if (!granted) {
            Alert.alert('Permission Needed', 'Please enable notifications for Swamy Dwija in your device settings.');
            return;
          }
          await notificationService.sendInstantNotification(
            '🔔 Swamy Dwija Live Session',
            'Your device external notification is working! You will receive live class reminders even when the app is closed.'
          );
          Alert.alert('Notification Sent', 'An external notification has been dispatched to your device status bar / tray.');
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="notifications-circle" size={20} color="#0d5c31" />
        <Text style={styles.testNotificationBtnText}>Test Device Notification (External Status Bar)</Text>
        <Ionicons name="arrow-forward" size={14} color="#0d5c31" />
      </TouchableOpacity>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SwipeableNotificationItem
            item={item}
            onDismiss={handleDismiss}
            onAction={handleAction}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="notifications-off-outline" size={38} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptySubtitle}>
                You have caught up with all live class alerts and course updates.
              </Text>
            </View>
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  clearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  listContent: {
    padding: 16,
  },
  swipeContainer: {
    marginBottom: 12,
    position: 'relative',
  },
  swipeBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fee2e2',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  swipeBgSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  swipeBgText: {
    color: '#dc2626',
    fontWeight: '700',
    fontSize: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardInner: {
    flexDirection: 'row',
    padding: 14,
  },
  unreadCard: {
    backgroundColor: '#ffffff',
    borderColor: colors.primary,
  },
  urgentCard: {
    backgroundColor: '#fff5f5',
    borderColor: '#ef4444',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  cardMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  joinBtnUrgent: {
    backgroundColor: '#ef4444',
  },
  joinBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  swipeHintText: {
    fontSize: 10,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 30,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(13, 92, 49, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  testNotificationBtn: {
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  testNotificationBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065f46',
    flex: 1,
    marginLeft: 8,
  },
});
