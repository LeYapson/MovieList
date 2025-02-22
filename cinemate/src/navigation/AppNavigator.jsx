// src/navigation/AppNavigator.jsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';

// Main Screens
import HomeScreen from '../screens/main/HomeScreen';
import SearchScreen from '../screens/main/SearchScreen';
import WatchlistScreen from '../screens/main/WatchlistScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import SettingsScreen from '../screens/main/SettingsScreen';

// Tab Navigator
const Tab = createBottomTabNavigator();
const TabNavigator = () => {
 return (
   <Tab.Navigator
     screenOptions={{
       headerStyle: {
         backgroundColor: '#2196F3',
       },
       headerTintColor: '#fff',
       tabBarStyle: {
         backgroundColor: '#fff',
         paddingBottom: 5,
         height: 55,
       },
       tabBarActiveTintColor: '#2196F3',
       tabBarInactiveTintColor: 'gray',
     }}
   >
     <Tab.Screen 
       name="Home" 
       component={HomeScreen}
       options={{
         title: 'Accueil',
         tabBarIcon: ({ color, size }) => (
           <Ionicons name="home" size={size} color={color} />
         ),
       }}
     />
     <Tab.Screen 
       name="Search" 
       component={SearchScreen}
       options={{
         title: 'Recherche',
         tabBarIcon: ({ color, size }) => (
           <Ionicons name="search" size={size} color={color} />
         ),
       }}
     />
     <Tab.Screen 
       name="Watchlist" 
       component={WatchlistScreen}
       options={{
         title: 'Ma Liste',
         tabBarIcon: ({ color, size }) => (
           <Ionicons name="bookmark" size={size} color={color} />
         ),
       }}
     />
     <Tab.Screen 
       name="Profile" 
       component={ProfileScreen}
       options={{
         title: 'Profil',
         tabBarIcon: ({ color, size }) => (
           <Ionicons name="person" size={size} color={color} />
         ),
       }}
     />
     <Tab.Screen 
       name="Settings" 
       component={SettingsScreen}
       options={{
         title: 'Paramètres',
         tabBarIcon: ({ color, size }) => (
           <Ionicons name="settings" size={size} color={color} />
         ),
       }}
     />
   </Tab.Navigator>
 );
};

// Stack Navigator
const Stack = createNativeStackNavigator();
const AppNavigator = () => {
 const [isLoading, setIsLoading] = React.useState(true);
 const [initialRoute, setInitialRoute] = React.useState('Login');

 React.useEffect(() => {
   // Vérifier le token de session au démarrage
   checkSession();
 }, []);

 const checkSession = async () => {
   try {
     // Vérification du token à implémenter
     setInitialRoute('Login');
   } catch (error) {
     console.error('Erreur vérification session:', error);
   } finally {
     setIsLoading(false);
   }
 };

 if (isLoading) {
   return null; // Ou un écran de chargement
 }

 return (
   <NavigationContainer>
     <Stack.Navigator 
       initialRouteName={initialRoute}
       screenOptions={{ 
         headerShown: false,
         animation: 'slide_from_right'
       }}
     >
       <Stack.Screen name="Login" component={LoginScreen} />
       <Stack.Screen name="Signup" component={SignupScreen} />
       <Stack.Screen name="MainTabs" component={TabNavigator} />
     </Stack.Navigator>
   </NavigationContainer>
 );
};

export default AppNavigator;