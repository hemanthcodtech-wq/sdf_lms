import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadows } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

import { HomeScreen } from '../screens/home/HomeScreen';
import { CourseListScreen } from '../screens/courses/CourseListScreen';
import { MyLearningScreen } from '../screens/learning/MyLearningScreen';
import { WishlistScreen } from '../screens/wishlist/WishlistScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

// Custom Scrollable Bottom Tab Bar
const CustomTabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const { wishlist } = useAuth();

  const getIconName = (routeName, isFocused) => {
    switch (routeName) {
      case 'HomeTab':
        return isFocused ? 'home' : 'home-outline';
      case 'CoursesTab':
        return isFocused ? 'compass' : 'compass-outline';
      case 'LearningTab':
        return isFocused ? 'school' : 'school-outline';
      case 'WishlistTab':
        return isFocused ? 'heart' : 'heart-outline';
      case 'ProfileTab':
        return isFocused ? 'person' : 'person-outline';
      default:
        return 'ellipse-outline';
    }
  };

  // Ensure safe padding for Android navigation buttons & iOS home gestures
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'web' ? 22 : 16);

  return (
    <View style={[styles.tabBarWrapper, { paddingBottom: bottomPadding }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScrollContent}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;
          const iconName = getIconName(route.name, isFocused);
          const badgeCount = route.name === 'WishlistTab' && wishlist.length > 0 ? wishlist.length : 0;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              activeOpacity={0.7}
              style={[
                styles.tabItem,
                isFocused && styles.tabItemActive,
              ]}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name={iconName}
                  size={20}
                  color={isFocused ? colors.primaryDark : colors.textSecondary}
                />
                {badgeCount > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badgeCount}</Text>
                  </View>
                ) : null}
              </View>

              <Text
                style={[
                  styles.tabLabel,
                  isFocused && styles.tabLabelActive,
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export const MainTabNavigator = () => {
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      backBehavior="history"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ tabBarLabel: t('home') }}
      />
      <Tab.Screen
        name="CoursesTab"
        component={CourseListScreen}
        options={{ tabBarLabel: t('courses') }}
      />
      <Tab.Screen
        name="LearningTab"
        component={MyLearningScreen}
        options={{ tabBarLabel: t('myLearning') }}
      />
      <Tab.Screen
        name="WishlistTab"
        component={WishlistScreen}
        options={{ tabBarLabel: t('wishlist') }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ tabBarLabel: t('profile') }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarWrapper: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 12,
  },
  tabScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 6,
    minWidth: '100%',
    justifyContent: 'space-around',
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
    backgroundColor: 'transparent',
    minWidth: 70,
  },
  tabItemActive: {
    backgroundColor: 'rgba(13, 92, 49, 0.12)',
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.secondary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
});
