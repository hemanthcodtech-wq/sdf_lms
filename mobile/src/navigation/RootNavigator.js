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
import { PolicyViewerScreen } from '../screens/profile/PolicyViewerScreen';

const RootStack = createNativeStackNavigator();

export const RootNavigator = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  // When not logged in, STRICTLY show Auth Flow only (No guest learner mode)
  if (!isAuthenticated) {
    return (
      <RootStack.Navigator
        key="unauthenticated-auth-stack"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <RootStack.Screen name="Auth" component={AuthNavigator} />
        <RootStack.Screen name="PolicyViewer" component={PolicyViewerScreen} />
      </RootStack.Navigator>
    );
  }

  const getInitialRoute = () => {
    if (user?.role === 'instructor') return 'InstructorDashboard';
    if (user?.role === 'moderator') return 'ModeratorDashboard';
    return 'Main';
  };

  return (
    <RootStack.Navigator
      key={`authenticated-${user?.role || 'student'}`}
      initialRouteName={getInitialRoute()}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* Role-isolated Portal Screens */}
      {user?.role === 'moderator' ? (
        <RootStack.Screen name="ModeratorDashboard" component={ModeratorDashboardScreen} />
      ) : user?.role === 'instructor' ? (
        <RootStack.Screen name="InstructorDashboard" component={InstructorDashboardScreen} />
      ) : (
        <RootStack.Screen name="Main" component={MainTabNavigator} />
      )}

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
      <RootStack.Screen name="PolicyViewer" component={PolicyViewerScreen} />
    </RootStack.Navigator>
  );
};
