import 'react-native-gesture-handler';

import React from 'react';
import AppLoading from 'expo-app-loading';
import { useFonts } from 'expo-font';
import AuthScreen from './screens/AuthScreen';
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import TabsNavigator from './screens/TabsNavigator';

const Stack = createStackNavigator();

export default App = () => {
  const [fontsLoaded] = useFonts({
    'e-Ukraine-L': require('./assets/fonts/e-Ukraine-Light.otf'),
    'e-Ukraine-R': require('./assets/fonts/e-Ukraine-Regular.otf'),
    'e-Ukraine-M': require('./assets/fonts/e-Ukraine-Medium.otf'),
    'e-Ukraine-B': require('./assets/fonts/e-Ukraine-Bold.otf')
  });


  if (!fontsLoaded){
    return <AppLoading />
  }
  return(
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Auth" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Authenticated" component={TabsNavigator} />
        {/* <Stack.Screen name="NeedsScreen" component={NeedsScreen} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  )
}