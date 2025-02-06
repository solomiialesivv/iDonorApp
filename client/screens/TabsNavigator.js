import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
// import { View, Text, StyleSheet } from 'react-native';

import Colors from '../constants/Colors';
import AuthenticatedScreen from './AuthenticatedScreen';
import HomeScreen from './NeedsScreen';
import NeedsScreen from './NeedsScreen';

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

              return <Icon name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: Colors.accent500, 
              tabBarInactiveTintColor: Colors.inactiveDark, 
              tabBarStyle: { backgroundColor: Colors.inactive}, 
            })}
        >
            <Tab.Screen name="Головна" component={AuthenticatedScreen} />
            <Tab.Screen name="Потреби" component={NeedsScreen} />
            <Tab.Screen name="Мапи" component={HomeScreen} />
        </Tab.Navigator>
    );
}