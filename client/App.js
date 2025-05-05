import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase/firebase';

// Screens
import AuthScreen from './screens/AuthScreen';
import TabsNavigator from './screens/TabsNavigator';
import PhoneVerification from './screens/PhoneVerification';

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [userVerified, setUserVerified] = useState(false);

  // Load fonts
  const [loaded] = useFonts({
    'e-Ukraine-L': require('./assets/fonts/e-Ukraine-Light.otf'),
    'e-Ukraine-R': require('./assets/fonts/e-Ukraine-Regular.otf'),
    'e-Ukraine-M': require('./assets/fonts/e-Ukraine-Medium.otf'),
    'e-Ukraine-B': require('./assets/fonts/e-Ukraine-Bold.otf'),
  });

  // Check if the user has verified their phone number
  const checkPhoneVerification = async (user) => {
    if (!user) {
      setUserVerified(false);
      return false;
    }
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        // Для тестування, встановлюємо телефон як верифікований завжди
        // В реальному додатку розкоментуйте наступний рядок і видаліть рядок після нього:
        // const isVerified = userDoc.data().phoneVerified === true;
        const isVerified = true; // Для тестування
        
        setUserVerified(isVerified);
        return isVerified;
      } else {
        setUserVerified(false);
        return false;
      }
    } catch (error) {
      console.error("Error checking phone verification:", error);
      setUserVerified(false);
      return false;
    }
  };

  // Handle auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        await checkPhoneVerification(currentUser);
      }
      
      if (initializing) setInitializing(false);
    });

    // Cleanup subscription
    return unsubscribe;
  }, [initializing]);

  useEffect(() => {
    if (loaded) {
      setFontsLoaded(true);
      // Hide splash screen after fonts loaded
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
    <>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#f5f5f5' }
          }}
        >
          {user ? (
            // User is signed in
            userVerified ? (
              // User is verified, show main app
              <Stack.Screen name="Authenticated" component={TabsNavigator} />
            ) : (
              // User is not verified, show verification screen
              <Stack.Screen name="PhoneVerification" component={PhoneVerification} />
            )
          ) : (
            // No user is signed in
            <>
              <Stack.Screen name="Auth" component={AuthScreen} />
              <Stack.Screen name="PhoneVerification" component={PhoneVerification} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </>
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

// import React, { useState, useEffect } from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import { StatusBar } from 'expo-status-bar';
// import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
// import { useFonts } from 'expo-font';
// import * as SplashScreen from 'expo-splash-screen';
// import { onAuthStateChanged } from 'firebase/auth';
// import { doc, getDoc } from 'firebase/firestore';
// import { auth, db } from './firebase/firebase';

// // Screens
// import AuthScreen from './screens/AuthScreen';
// import TabsNavigator from './screens/TabsNavigator';
// import PhoneVerification from './screens/PhoneVerification';

// // Keep splash screen visible while loading fonts
// SplashScreen.preventAutoHideAsync();

// const Stack = createNativeStackNavigator();

// export default function App() {
//   const [fontsLoaded, setFontsLoaded] = useState(false);
//   const [initializing, setInitializing] = useState(true);
//   const [user, setUser] = useState(null);
//   const [userVerified, setUserVerified] = useState(false);

//   // Load fonts
//   const [loaded] = useFonts({
//     'e-Ukraine-L': require('./assets/fonts/e-Ukraine-Light.otf'),
//     'e-Ukraine-R': require('./assets/fonts/e-Ukraine-Regular.otf'),
//     'e-Ukraine-M': require('./assets/fonts/e-Ukraine-Medium.otf'),
//     'e-Ukraine-B': require('./assets/fonts/e-Ukraine-Bold.otf'),
//   });

//   // Check if the user has verified their phone number
//   const checkPhoneVerification = async (user) => {
//     if (!user) {
//       setUserVerified(false);
//       return false;
//     }
    
//     try {
//       const userDoc = await getDoc(doc(db, 'users', user.uid));
//       if (userDoc.exists() && userDoc.data().phoneVerified) {
//         setUserVerified(true);
//         return true;
//       } else {
//         setUserVerified(false);
//         return false;
//       }
//     } catch (error) {
//       console.error("Error checking phone verification:", error);
//       setUserVerified(false);
//       return false;
//     }
//   };

//   // Handle auth state changes
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
//       setUser(currentUser);
      
//       if (currentUser) {
//         await checkPhoneVerification(currentUser);
//       }
      
//       if (initializing) setInitializing(false);
//     });

//     // Cleanup subscription
//     return unsubscribe;
//   }, [initializing]);

//   useEffect(() => {
//     if (loaded) {
//       setFontsLoaded(true);
//       // Hide splash screen after fonts loaded
//       SplashScreen.hideAsync();
//     }
//   }, [loaded]);

//   if (!fontsLoaded || initializing) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#e53935" />
//       </View>
//     );
//   }

//   return (
//     <>
//       <StatusBar style="dark" />
//       <NavigationContainer>
//         <Stack.Navigator
//           screenOptions={{
//             headerShown: false,
//             contentStyle: { backgroundColor: '#f5f5f5' }
//           }}
//         >
//           {user ? (
//             // User is signed in
//             userVerified ? (
//               // User is verified, show main app
//               <Stack.Screen name="Authenticated" component={TabsNavigator} />
//             ) : (
//               // User is not verified, show verification screen
//               <Stack.Screen name="PhoneVerification" component={PhoneVerification} />
//             )
//           ) : (
//             // No user is signed in
//             <>
//               <Stack.Screen name="Auth" component={AuthScreen} />
//               <Stack.Screen name="PhoneVerification" component={PhoneVerification} />
//             </>
//           )}
//         </Stack.Navigator>
//       </NavigationContainer>
//     </>
//   );
// }

// const styles = StyleSheet.create({
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f5f5f5',
//   },
// });