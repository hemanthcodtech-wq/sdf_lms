import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabNavigator } from './MainTabNavigator';
import { AuthNavigator } from './AuthNavigator';
import { useAuth } from '../context/AuthContext';

// Modals & Detail screens
import { CourseDetailsScreen } from '../screens/courses/CourseDetailsScreen';
import { CheckoutScreen } from '../screens/courses/CheckoutScreen';
import { StudentClassesScreen } from '../screens/learning/StudentClassesScreen';
import { CertificatesScreen } from '../screens/certificates/CertificatesScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';
import { PaymentHistoryScreen } from '../screens/profile/PaymentHistoryScreen';
import { HelpSupportScreen } from '../screens/profile/HelpSupportScreen';

const RootStack = createNativeStackNavigator();

export const RootNavigator = () => {
  const { isAuthenticated } = useAuth();

  return (
    <RootStack.Navigator
      initialRouteName={isAuthenticated ? 'Main' : 'Auth'}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* Auth Portal Gateway (Student, Instructor, Moderator) */}
      <RootStack.Screen name="Auth" component={AuthNavigator} />

      {/* Main Dashboard & Tabs */}
      <RootStack.Screen name="Main" component={MainTabNavigator} />

      {/* Course Flow */}
      <RootStack.Screen name="CourseDetails" component={CourseDetailsScreen} />
      <RootStack.Screen name="Checkout" component={CheckoutScreen} />
      <RootStack.Screen name="StudentClasses" component={StudentClassesScreen} />

      {/* Profile Flow */}
      <RootStack.Screen name="Certificates" component={CertificatesScreen} />
      <RootStack.Screen name="Settings" component={SettingsScreen} />
      <RootStack.Screen name="PaymentHistory" component={PaymentHistoryScreen} />
      <RootStack.Screen name="HelpSupport" component={HelpSupportScreen} />
    </RootStack.Navigator>
  );
};
