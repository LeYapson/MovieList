// Service de stockage local pour tokens JWT et données utilisateur
// Position: cinemate/src/services/storageService.js

import AsyncStorage from '@react-native-async-storage/async-storage';

// Clés de stockage
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_DATA_KEY = 'user_data';
const USER_PREFERENCES_KEY = 'user_preferences';

// Clés TMDB (pour compatibilité avec le code existant)
const TMDB_SESSION_ID_KEY = 'tmdb_session_id';
const TMDB_ACCOUNT_ID_KEY = 'tmdb_account_id';

// ========================================
// GESTION DES TOKENS JWT (API NestJS)
// ========================================

/**
 * Sauvegarder les tokens d'accès et refresh
 */
export const storeTokens = async (accessToken, refreshToken) => {
  try {
    await AsyncStorage.multiSet([
      [ACCESS_TOKEN_KEY, accessToken],
      [REFRESH_TOKEN_KEY, refreshToken]
    ]);
    console.log('✅ Tokens sauvegardés');
    return true;
  } catch (error) {
    console.error('❌ Erreur sauvegarde tokens:', error);
    return false;
  }
};

/**
 * Récupérer le token d'accès
 */
export const getAccessToken = async () => {
  try {
    return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error('❌ Erreur récupération access token:', error);
    return null;
  }
};

/**
 * Récupérer le refresh token
 */
export const getRefreshToken = async () => {
  try {
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('❌ Erreur récupération refresh token:', error);
    return null;
  }
};

/**
 * Supprimer les tokens
 */
export const removeTokens = async () => {
  try {
    await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
    console.log('✅ Tokens supprimés');
    return true;
  } catch (error) {
    console.error('❌ Erreur suppression tokens:', error);
    return false;
  }
};

// ========================================
// GESTION DES DONNÉES UTILISATEUR
// ========================================

/**
 * Sauvegarder les données utilisateur
 */
export const saveUserData = async (userData) => {
  try {
    const jsonValue = JSON.stringify(userData);
    await AsyncStorage.setItem(USER_DATA_KEY, jsonValue);
    console.log('✅ Données utilisateur sauvegardées');
    return true;
  } catch (error) {
    console.error('❌ Erreur sauvegarde user data:', error);
    return false;
  }
};

/**
 * Récupérer les données utilisateur
 */
export const getUserData = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(USER_DATA_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('❌ Erreur récupération user data:', error);
    return null;
  }
};

/**
 * Supprimer les données utilisateur
 */
export const removeUserData = async () => {
  try {
    await AsyncStorage.removeItem(USER_DATA_KEY);
    console.log('✅ Données utilisateur supprimées');
    return true;
  } catch (error) {
    console.error('❌ Erreur suppression user data:', error);
    return false;
  }
};

// ========================================
// GESTION DES PRÉFÉRENCES UTILISATEUR
// ========================================

/**
 * Sauvegarder les préférences utilisateur
 */
export const saveUserPreferences = async (preferences) => {
  try {
    const jsonValue = JSON.stringify(preferences);
    await AsyncStorage.setItem(USER_PREFERENCES_KEY, jsonValue);
    return true;
  } catch (error) {
    console.error('❌ Erreur sauvegarde préférences:', error);
    return false;
  }
};

/**
 * Récupérer les préférences utilisateur
 */
export const getUserPreferences = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(USER_PREFERENCES_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('❌ Erreur récupération préférences:', error);
    return null;
  }
};

// ========================================
// GESTION SESSION TMDB (Pour compatibilité)
// ========================================

/**
 * Sauvegarder le session ID TMDB
 */
export const storeTMDBSessionId = async (sessionId) => {
  try {
    await AsyncStorage.setItem(TMDB_SESSION_ID_KEY, sessionId);
    return true;
  } catch (error) {
    console.error('❌ Erreur sauvegarde TMDB session:', error);
    return false;
  }
};

/**
 * Récupérer le session ID TMDB
 */
export const getTMDBSessionId = async () => {
  try {
    return await AsyncStorage.getItem(TMDB_SESSION_ID_KEY);
  } catch (error) {
    console.error('❌ Erreur récupération TMDB session:', error);
    return null;
  }
};

/**
 * Sauvegarder l'account ID TMDB
 */
export const saveTMDBAccountId = async (accountId) => {
  try {
    await AsyncStorage.setItem(TMDB_ACCOUNT_ID_KEY, accountId.toString());
    return true;
  } catch (error) {
    console.error('❌ Erreur sauvegarde TMDB account ID:', error);
    return false;
  }
};

/**
 * Récupérer l'account ID TMDB
 */
export const getTMDBAccountId = async () => {
  try {
    const accountId = await AsyncStorage.getItem(TMDB_ACCOUNT_ID_KEY);
    return accountId ? parseInt(accountId, 10) : null;
  } catch (error) {
    console.error('❌ Erreur récupération TMDB account ID:', error);
    return null;
  }
};

// ========================================
// UTILITAIRES
// ========================================

/**
 * Vérifier si l'utilisateur est connecté
 */
export const isLoggedIn = async () => {
  try {
    const accessToken = await getAccessToken();
    return accessToken !== null;
  } catch (error) {
    console.error('❌ Erreur vérification connexion:', error);
    return false;
  }
};

/**
 * Supprimer toutes les données utilisateur (déconnexion complète)
 */
export const clearAllUserData = async () => {
  try {
    const keys = [
      ACCESS_TOKEN_KEY,
      REFRESH_TOKEN_KEY,
      USER_DATA_KEY,
      USER_PREFERENCES_KEY,
      TMDB_SESSION_ID_KEY,
      TMDB_ACCOUNT_ID_KEY
    ];
    await AsyncStorage.multiRemove(keys);
    console.log('✅ Toutes les données supprimées');
    return true;
  } catch (error) {
    console.error('❌ Erreur suppression données:', error);
    return false;
  }
};

/**
 * Afficher toutes les clés stockées (debug)
 */
export const debugStorage = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    console.log('📦 Clés stockées:', keys);
    
    const values = await AsyncStorage.multiGet(keys);
    console.log('📦 Valeurs:', values);
    
    return { keys, values };
  } catch (error) {
    console.error('❌ Erreur debug storage:', error);
    return null;
  }
};

// Exports pour compatibilité avec l'ancien code
export const storeSessionId = storeTMDBSessionId;
export const getSessionId = getTMDBSessionId;
export const saveSessionId = storeTMDBSessionId;
export const removeSessionId = async () => {
  try {
    await AsyncStorage.removeItem(TMDB_SESSION_ID_KEY);
    return true;
  } catch (error) {
    console.error('❌ Erreur suppression TMDB session:', error);
    return false;
  }
};

export const saveAccountId = saveTMDBAccountId;
export const getAccountId = getTMDBAccountId;
export const saveUsername = async (username) => {
  try {
    const userData = await getUserData();
    await saveUserData({ ...userData, username });
    return true;
  } catch (error) {
    console.error('❌ Erreur sauvegarde username:', error);
    return false;
  }
};

export const getUsername = async () => {
  try {
    const userData = await getUserData();
    return userData?.username || null;
  } catch (error) {
    console.error('❌ Erreur récupération username:', error);
    return null;
  }
};

export const removeUsername = async () => {
  try {
    const userData = await getUserData();
    if (userData) {
      delete userData.username;
      await saveUserData(userData);
    }
    return true;
  } catch (error) {
    console.error('❌ Erreur suppression username:', error);
    return false;
  }
};

export default {
  // Tokens JWT
  storeTokens,
  getAccessToken,
  getRefreshToken,
  removeTokens,
  
  // Données utilisateur
  saveUserData,
  getUserData,
  removeUserData,
  
  // Préférences
  saveUserPreferences,
  getUserPreferences,
  
  // TMDB (compatibilité)
  storeTMDBSessionId,
  getTMDBSessionId,
  saveTMDBAccountId,
  getTMDBAccountId,
  storeSessionId,
  getSessionId,
  saveSessionId,
  removeSessionId,
  saveAccountId,
  getAccountId,
  saveUsername,
  getUsername,
  removeUsername,
  
  // Utilitaires
  isLoggedIn,
  clearAllUserData,
  debugStorage
};