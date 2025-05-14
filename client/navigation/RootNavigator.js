import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

// Screens
import AuthScreen from '../screens/AuthScreen';
import TabsNavigator from './TabsNavigator';
import EmailVerification from '../screens/EmailVerification';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#f5f5f5' }
        }}
      >
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="EmailVerification" component={EmailVerification} />
        <Stack.Screen name="Authenticated" component={TabsNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
} 