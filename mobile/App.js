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

export const navigationRef = createNavigationContainerRef();

export default function App() {
  const [isSplashActive, setIsSplashActive] = useState(true);

  useEffect(() => {
    notificationService.init();
    notificationService.requestPermissions();

    // Listen for notification clicks when app is in foreground or background
    let responseSubscription = null;
    try {
      const Notifications = require('expo-notifications');
      if (Notifications?.addNotificationResponseReceivedListener) {
        responseSubscription = Notifications.addNotificationResponseReceivedListener(() => {
          if (navigationRef.isReady()) {
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
    // If the app was launched by tapping an external notification from killed state
    try {
      const Notifications = require('expo-notifications');
      if (Notifications?.getLastNotificationResponseAsync) {
        Notifications.getLastNotificationResponseAsync().then((response) => {
          if (response && navigationRef.isReady()) {
            navigationRef.navigate('Notifications');
          }
        });
      }
    } catch (e) {}
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
