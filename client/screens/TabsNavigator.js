import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

import Colors from '../constants/Colors';
import AuthenticatedScreen from './AuthenticatedScreen';
import PlanDonationScreen from './PlanDonationScreen';
import NeedsScreen from './NeedsScreen';
import MedCentersScreen from './MedCentersScreen';

const Tab = createBottomTabNavigator();

export default function TabsNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarIcon: ({ color, size }) => {
              let iconName;

              if (route.name === 'Головна') {
                iconName = 'home';
              } else if (route.name === 'Мапи') {
                  iconName = 'map';
              }
                else if (route.name === 'Потреби') {
                  iconName = 'medkit';
              }
                else if (route.name === 'Планування') {
                  iconName = 'calendar-number';
              }

              return <Icon name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: Colors.accent500, 
              tabBarInactiveTintColor: Colors.inactiveDark, 
              tabBarStyle: { backgroundColor: Colors.inactive}, 
            })}
        >
            <Tab.Screen name="Головна" component={AuthenticatedScreen} />
            <Tab.Screen name="Потреби" component={NeedsScreen} />
            <Tab.Screen name="Планування" component={PlanDonationScreen}/>
            <Tab.Screen name="Мапи" component={MedCentersScreen} />
        </Tab.Navigator>
    );
}