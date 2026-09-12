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
