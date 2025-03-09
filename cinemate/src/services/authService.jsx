// src/services/authService.jsx
import axios from 'axios';
import { storeSessionId, saveUsername, saveAccountId } from './storageService';

const API_KEY = "b5b127c27b05cc748d56999e632af5dc";
const BASE_URL = 'https://api.themoviedb.org/3';

// Créer un nouveau token de requête
export const createRequestToken = async () => {
  try {
    const response = await axios.get(
      `${BASE_URL}/authentication/token/new?api_key=${API_KEY}`
    );
    return response.data.request_token;
  } catch (error) {
    console.error('Erreur lors de la création du token de requête:', error);
    throw error;
  }
};

// Valider le token de requête avec les identifiants
export const validateRequestToken = async (requestToken, username, password) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/authentication/token/validate_with_login?api_key=${API_KEY}`,
      {
        username,
        password,
        request_token: requestToken
      }
    );
    
    if (response.data.success) {
      // Sauvegarder le nom d'utilisateur
      await saveUsername(username);
    }
    
    return response.data.success;
  } catch (error) {
    console.error('Erreur lors de la validation du token:', error);
    throw error;
  }
};

// Créer une nouvelle session
export const createSession = async (requestToken) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/authentication/session/new?api_key=${API_KEY}`,
      {
        request_token: requestToken
      }
    );
    
    const sessionId = response.data.session_id;
    console.log('Session ID:', sessionId); // Log pour vérifier le sessionId
    
    // Sauvegarder le sessionId
    await storeSessionId(sessionId);
    
    return sessionId;
  } catch (error) {
    console.error('Erreur lors de la création de la session:', error);
    throw error;
  }
};

// Obtenir les détails du compte utilisateur
export const getAccountDetails = async (sessionId) => {
  try {
    console.log('Récupération des détails du compte avec sessionId:', sessionId);
    
    const response = await axios.get(`${BASE_URL}/account`, {
      params: { 
        api_key: API_KEY, 
        session_id: sessionId 
      }
    });
    
    // Sauvegarder l'ID du compte
    if (response.data && response.data.id) {
      await saveAccountId(response.data.id);
    }
    
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des détails du compte:', error);
    throw error;
  }
};

// Déconnexion (en supprimant la session TMDB)
export const logout = async (sessionId) => {
  try {
    await axios.delete(`${BASE_URL}/authentication/session`, {
      params: { api_key: API_KEY },
      data: { session_id: sessionId }
    });
    return true;
  } catch (error) {
    console.error('Erreur lors de la déconnexion TMDB:', error);
    // Retourner true quand même pour permettre la déconnexion locale
    return true;
  }
};

export default {
  createRequestToken,
  validateRequestToken,
  createSession,
  getAccountDetails,
  logout
};