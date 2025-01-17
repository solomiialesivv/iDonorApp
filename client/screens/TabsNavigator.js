import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { View, Text, StyleSheet } from 'react-native';

// Import your screens
import AuthScreen from './AuthScreen';
import AuthenticatedScreen from './AuthenticatedScreen';
import ProtectScreen from './ProtectScreen';
import HomeScreen from './HomeScreen';

const Tab = createBottomTabNavigator();

export default function TabsNavigator() {
    return (
        <NavigationContainer>
        <Tab.Navigator
            screenOptions={({ route }) => ({
            tabBarIcon: ({ color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = 'home'; // Ionicons "home" icon
            } else if (route.name === 'Protect') {
              iconName = 'shield'; // Ionicons "shield" icon
            }

            return <Icon name={iconName} size={size} color={color} />;
            },
            tabBarStyle: { backgroundColor: '#f8f8f8' }, // Customize tab bar style
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Protect" component={ProtectScreen} />
        </Tab.Navigator>
        </NavigationContainer>
    );
}
