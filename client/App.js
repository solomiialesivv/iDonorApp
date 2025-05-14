import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/firebase';
import RootNavigator from './navigation/RootNavigator';
import { UserProvider } from './store/UserContext';

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  // Load fonts
  const [loaded] = useFonts({
    'e-Ukraine-L': require('./assets/fonts/e-Ukraine-Light.otf'),
    'e-Ukraine-R': require('./assets/fonts/e-Ukraine-Regular.otf'),
    'e-Ukraine-M': require('./assets/fonts/e-Ukraine-Medium.otf'),
    'e-Ukraine-B': require('./assets/fonts/e-Ukraine-Bold.otf'),
  });

  // Handle auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, [initializing]);

  useEffect(() => {
    if (loaded) {
      setFontsLoaded(true);
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!fontsLoaded || initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e53935" />
      </View>
    );
  }

  return (
    <UserProvider>
      <StatusBar style="dark" />
      <RootNavigator user={user} />
    </UserProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});