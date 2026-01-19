// Position: cinemate/App.js
import React, { useEffect } from 'react';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { StatusBar } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  useEffect(() => {
    // Permettre toutes les orientations (portrait et paysage)
    async function enableAllOrientations() {
      await ScreenOrientation.unlockAsync();
    }
    
    enableAllOrientations();
    
    // Nettoyer lors du démontage de l'application
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StatusBar 
          translucent 
          backgroundColor="transparent"
          barStyle="light-content"
        />
        <AppNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}