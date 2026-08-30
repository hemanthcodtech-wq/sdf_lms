import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { DeviceFrame } from './src/components/DeviceFrame';
import { SplashScreen } from './src/screens/splash/SplashScreen';

export default function App() {
  const [isSplashActive, setIsSplashActive] = useState(true);

  return (
    <DeviceFrame>
      <SafeAreaProvider>
        <LanguageProvider>
          <AuthProvider>
            {isSplashActive ? (
              <SplashScreen onFinish={() => setIsSplashActive(false)} />
            ) : (
              <NavigationContainer>
                <StatusBar style="dark" />
                <RootNavigator />
              </NavigationContainer>
            )}
          </AuthProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </DeviceFrame>
  );
}
