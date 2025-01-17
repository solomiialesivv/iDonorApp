import 'react-native-gesture-handler';

import React from 'react';
import ProtectScreen from './screens/ProtectScreen';
import AppLoading from 'expo-app-loading';
import { useFonts } from 'expo-font';
import TabsNavigator from './screens/TabsNavigator';

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
    <TabsNavigator />
  );
}