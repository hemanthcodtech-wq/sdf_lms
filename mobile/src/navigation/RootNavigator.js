import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabNavigator } from './MainTabNavigator';
import { AuthNavigator } from './AuthNavigator';
import { useAuth } from '../context/AuthContext';

// Staff & Faculty Portals
import { InstructorDashboardScreen } from '../screens/instructor/InstructorDashboardScreen';
import { ModeratorDashboardScreen } from '../screens/moderator/ModeratorDashboardScreen';

// Modals & Detail screens
import { CourseDetailsScreen } from '../screens/courses/CourseDetailsScreen';
import { CheckoutScreen } from '../screens/courses/CheckoutScreen';
import { StudentClassesScreen } from '../screens/learning/StudentClassesScreen';
import { CertificatesScreen } from '../screens/certificates/CertificatesScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';
import { PaymentHistoryScreen } from '../screens/profile/PaymentHistoryScreen';
import { HelpSupportScreen } from '../screens/profile/HelpSupportScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';

const RootStack = createNativeStackNavigator();

export const RootNavigator = () => {
  const { isAuthenticated, user } = useAuth();

  const getInitialRoute = () => {
    if (!isAuthenticated) return 'Auth';
    if (user?.role === 'instructor') return 'InstructorDashboard';
    if (user?.role === 'moderator') return 'ModeratorDashboard';
    return 'Main';
  };

  return (
    <RootStack.Navigator
      initialRouteName={getInitialRoute()}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* Auth Portal Gateway (Student, Instructor, Moderator) */}
      <RootStack.Screen name="Auth" component={AuthNavigator} />

      {/* Main Student Dashboard & Tabs */}
      <RootStack.Screen name="Main" component={MainTabNavigator} />

      {/* Dedicated Staff & Faculty Portals */}
      <RootStack.Screen name="InstructorDashboard" component={InstructorDashboardScreen} />
      <RootStack.Screen name="ModeratorDashboard" component={ModeratorDashboardScreen} />

      {/* Course Flow */}
      <RootStack.Screen name="CourseDetails" component={CourseDetailsScreen} />
      <RootStack.Screen name="Checkout" component={CheckoutScreen} />
      <RootStack.Screen name="StudentClasses" component={StudentClassesScreen} />

      {/* Notifications */}
      <RootStack.Screen name="Notifications" component={NotificationsScreen} />

      {/* Profile Flow */}
      <RootStack.Screen name="Certificates" component={CertificatesScreen} />
      <RootStack.Screen name="Settings" component={SettingsScreen} />
      <RootStack.Screen name="PaymentHistory" component={PaymentHistoryScreen} />
      <RootStack.Screen name="HelpSupport" component={HelpSupportScreen} />
    </RootStack.Navigator>
  );
};
