// src/navigation/AppNavigator.jsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';

// Main Screens
import HomeScreen from '../screens/main/HomeScreen';
import SearchScreen from '../screens/main/SearchScreen';
import WatchlistScreen from '../screens/main/WatchlistScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2196F3',
        },
        headerTintColor: '#fff',
        tabBarStyle: {
          backgroundColor: '#fff',
        },
      }}>
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          title: 'Accueil'
        }}
      />
      <Tab.Screen 
        name="Search" 
        component={SearchScreen}
        options={{
          title: 'Rechercher'
        }}
      />
      <Tab.Screen 
        name="Watchlist" 
        component={WatchlistScreen}
        options={{
          title: 'Ma Liste'
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Profil'
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const isAuthenticated = false; // À remplacer par votre logique d'auth

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!isAuthenticated ? (
          // Stack Auth
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Signup" 
              component={SignupScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          // Stack Main
          <Stack.Screen
            name="MainApp"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;