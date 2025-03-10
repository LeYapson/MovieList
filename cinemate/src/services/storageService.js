// src/services/storageService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// Clés de stockage - compatibles avec l'existant
const SESSION_ID_KEY = 'sessionId';
const USERNAME_KEY = 'tmdb_username';
const ACCOUNT_ID_KEY = 'tmdb_account_id';
const USER_PREFERENCES_KEY = 'user_preferences';

// Méthodes existantes - conservées avec compatibilité
export const storeSessionId = async (sessionId) => {
  try {
    await AsyncStorage.setItem(SESSION_ID_KEY, sessionId); // Utiliser SESSION_ID_KEY
  } catch (error) {
    console.error('Erreur stockage sessionId:', error);
  }
};

export const getSessionId = async () => {
  try {
    const sessionId = await AsyncStorage.getItem(SESSION_ID_KEY); // Utiliser SESSION_ID_KEY
    console.log('Recovered Session ID:', sessionId); // Log pour vérifier le sessionId récupéré
    return sessionId;
  } catch (error) {
    console.error('Erreur récupération sessionId:', error);
    return null;
  }
};


export const removeSessionId = async () => {
  try {
    await AsyncStorage.removeItem(SESSION_ID_KEY);
  } catch (error) {
    console.error('Erreur suppression sessionId:', error);
  }
};

// Alias pour compatibilité avec le code précédent
export const saveSessionId = storeSessionId;

// Nouvelles méthodes pour l'utilisateur
export const saveUsername = async (username) => {
  try {
    await AsyncStorage.setItem(USERNAME_KEY, username);
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du nom d\'utilisateur:', error);
    return false;
  }
};

export const getUsername = async () => {
  try {
    return await AsyncStorage.getItem(USERNAME_KEY);
  } catch (error) {
    console.error('Erreur lors de la récupération du nom d\'utilisateur:', error);
    return null;
  }
};

export const removeUsername = async () => {
  try {
    await AsyncStorage.removeItem(USERNAME_KEY);
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression du nom d\'utilisateur:', error);
    return false;
  }
};

// Gestion de l'ID du compte
export const saveAccountId = async (accountId) => {
  try {
    await AsyncStorage.setItem(ACCOUNT_ID_KEY, accountId.toString());
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de l\'ID du compte:', error);
    return false;
  }
};

export const getAccountId = async () => {
  try {
    const accountId = await AsyncStorage.getItem(ACCOUNT_ID_KEY);
    return accountId ? parseInt(accountId, 10) : null;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'ID du compte:', error);
    return null;
  }
};

// Gestion des préférences utilisateur
export const saveUserPreferences = async (preferences) => {
  try {
    const jsonValue = JSON.stringify(preferences);
    await AsyncStorage.setItem(USER_PREFERENCES_KEY, jsonValue);
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des préférences:', error);
    return false;
  }
};

export const getUserPreferences = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(USER_PREFERENCES_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Erreur lors de la récupération des préférences:', error);
    return null;
  }
};

// Déconnexion complète
export const clearAllUserData = async () => {
  try {
    const keys = [SESSION_ID_KEY, USERNAME_KEY, ACCOUNT_ID_KEY, USER_PREFERENCES_KEY];
    await AsyncStorage.multiRemove(keys);
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression des données utilisateur:', error);
    return false;
  }
};

// Vérifier si l'utilisateur est connecté
export const isLoggedIn = async () => {
  try {
    const sessionId = await getSessionId();
    return sessionId !== null;
  } catch (error) {
    console.error('Erreur lors de la vérification de connexion:', error);
    return false;
  }
};

export default {
  storeSessionId,
  saveSessionId,
  getSessionId,
  removeSessionId,
  saveUsername,
  getUsername,
  removeUsername,
  saveAccountId,
  getAccountId,
  saveUserPreferences,
  getUserPreferences,
  clearAllUserData,
  isLoggedIn
};