import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { DeviceFrame } from './src/components/DeviceFrame';
import { SplashScreen } from './src/screens/splash/SplashScreen';
import { notificationService } from './src/services/notificationService';
import { cacheService } from './src/services/cacheService';
import { courseService } from './src/services/courseService';

export const navigationRef = createNavigationContainerRef();

export default function App() {
  const [isSplashActive, setIsSplashActive] = useState(true);

  useEffect(() => {
    // Pre-warm cache and images immediately at app startup
    cacheService.initCache().then(() => {
      courseService.getPublicCourses().then((res) => {
        if (res?.data) {
          cacheService.setCourses(res.data);
        }
      }).catch(() => {});
    });

    notificationService.init();
    notificationService.requestPermissions();

    // Listen for notification clicks when user taps an active notification
    let responseSubscription = null;
    try {
      const Notifications = require('expo-notifications');
      if (Notifications?.addNotificationResponseReceivedListener) {
        responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
          if (response?.notification && navigationRef.isReady()) {
            navigationRef.navigate('Notifications');
          }
        });
      }
    } catch (e) {
      console.warn('Error setting notification click listener:', e);
    }

    return () => {
      if (responseSubscription) {
        responseSubscription.remove();
      }
    };
  }, []);

  const handleNavReady = () => {
    // Navigation container ready - do not auto-redirect
  };

  return (
    <DeviceFrame>
      <SafeAreaProvider>
        <LanguageProvider>
          <AuthProvider>
            <StatusBar
              style={isSplashActive ? 'light' : 'dark'}
              backgroundColor={isSplashActive ? '#0a140d' : '#ffffff'}
            />
            {isSplashActive ? (
              <SplashScreen onFinish={() => setIsSplashActive(false)} />
            ) : (
              <NavigationContainer ref={navigationRef} onReady={handleNavReady}>
                <RootNavigator />
              </NavigationContainer>
            )}
          </AuthProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </DeviceFrame>
  );
}
