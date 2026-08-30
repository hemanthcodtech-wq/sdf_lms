import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PortalSelectionScreen } from '../screens/auth/PortalSelectionScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { InstructorLoginScreen } from '../screens/auth/InstructorLoginScreen';
import { ModeratorLoginScreen } from '../screens/auth/ModeratorLoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';

const Stack = createNativeStackNavigator();

export const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="PortalSelection"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="PortalSelection" component={PortalSelectionScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="InstructorLogin" component={InstructorLoginScreen} />
      <Stack.Screen name="ModeratorLogin" component={ModeratorLoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
};
