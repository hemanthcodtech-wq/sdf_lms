import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { courseService } from '../../services/courseService';
import { notificationService } from '../../services/notificationService';

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

  const renderItem = ({ item }) => {
    const isLive = item.type === 'live_class';
    const isUrgent = item.urgent;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          item.unread && styles.unreadCard,
          isUrgent && styles.urgentCard,
          shadows.sm,
        ]}
        onPress={() => handleAction(item)}
        activeOpacity={0.8}
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
            {item.unread && <View style={styles.unreadDot} />}
          </View>

          <Text style={styles.cardMessage}>{item.message}</Text>

          {isLive && item.zoomLink && (
            <TouchableOpacity
              style={[styles.joinBtn, isUrgent && styles.joinBtnUrgent]}
              onPress={() => handleAction(item)}
              activeOpacity={0.8}
            >
              <Ionicons name="videocam" size={14} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.joinBtnText}>
                {isUrgent ? 'Join Live Zoom (Starting Now)' : 'Open Zoom Link'}
              </Text>
            </TouchableOpacity>
          )}

          <Text style={styles.timeText}>{item.time || 'Recent'}</Text>
        </View>
      </TouchableOpacity>
    );
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
          onPress={() => {
            notificationService.markAllAsRead();
            loadNotifications();
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.clearBtnText}>Mark read</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
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
              <Text style={styles.emptyTitle}>No Notifications Yet</Text>
              <Text style={styles.emptySubtitle}>
                Live class alerts, daily session reminders, and course updates will appear here.
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
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
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
  timeText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
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
});
