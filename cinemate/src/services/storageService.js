// src/services/storageService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeSessionId = async (sessionId) => {
  try {
    await AsyncStorage.setItem('sessionId', sessionId);
  } catch (error) {
    console.error('Erreur stockage sessionId:', error);
  }
};

export const getSessionId = async () => {
  try {
    return await AsyncStorage.getItem('sessionId');
  } catch (error) {
    console.error('Erreur récupération sessionId:', error);
    return null;
  }
};

export const removeSessionId = async () => {
  try {
    await AsyncStorage.removeItem('sessionId');
  } catch (error) {
    console.error('Erreur suppression sessionId:', error);
  }
};