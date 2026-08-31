import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { DeviceFrame } from './src/components/DeviceFrame';
import { SplashScreen } from './src/screens/splash/SplashScreen';
import { notificationService } from './src/services/notificationService';

export default function App() {
  const [isSplashActive, setIsSplashActive] = useState(true);

  useEffect(() => {
    notificationService.init();
    notificationService.requestPermissions();
  }, []);

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
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
            )}
          </AuthProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </DeviceFrame>
  );
}
