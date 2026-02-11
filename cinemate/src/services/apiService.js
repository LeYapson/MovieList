// Service de communication avec l'API NestJS pour l'authentification
// Position: cinemate/src/services/apiService.js

import axios from 'axios';
import { API_BASE_URL } from '@env';
import { getAccessToken, getRefreshToken, storeTokens, removeTokens } from './storageService';

// Configuration de base pour axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'accès à chaque requête
api.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer le refresh token automatique
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si erreur 401 et pas déjà retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await getRefreshToken();
        
        if (!refreshToken) {
          // Pas de refresh token, rediriger vers login
          throw new Error('NO_REFRESH_TOKEN');
        }

        // Tenter de rafraîchir le token
        const response = await axios.post(
          `${API_BASE_URL}/api/v1/auth/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`
            }
          }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        // Sauvegarder les nouveaux tokens
        await storeTokens(accessToken, newRefreshToken);
        
        // Réessayer la requête originale avec le nouveau token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Si le refresh échoue, déconnecter l'utilisateur
        await removeTokens();
        throw new Error('TOKEN_REFRESH_FAILED');
      }
    }

    return Promise.reject(error);
  }
);

const apiService = {
  // ========================================
  // AUTHENTIFICATION
  // ========================================

  /**
   * Inscription d'un nouvel utilisateur
   * @param {Object} userData - Données de l'utilisateur
   * @returns {Promise<Object>} Tokens d'accès et refresh
   */
  register: async (userData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/auth/register`,
        userData
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Connexion d'un utilisateur
   * @param {string} username - Nom d'utilisateur ou email
   * @param {string} password - Mot de passe
   * @returns {Promise<Object>} Tokens d'accès et refresh
   */
  login: async (username, password) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/auth/login`,
        { username, password }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la connexion:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Déconnexion de l'utilisateur
   * @returns {Promise<void>}
   */
  logout: async () => {
    try {
      const refreshToken = await getRefreshToken();
      
      if (refreshToken) {
        await axios.post(
          `${API_BASE_URL}/api/v1/auth/logout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`
            }
          }
        );
      }
      
      // Supprimer les tokens localement
      await removeTokens();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error.response?.data || error.message);
      // Même en cas d'erreur, supprimer les tokens localement
      await removeTokens();
    }
  },

  /**
   * Rafraîchir le token d'accès
   * @returns {Promise<Object>} Nouveaux tokens
   */
  refreshToken: async () => {
    try {
      const refreshToken = await getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('Aucun refresh token disponible');
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/v1/auth/refresh`,
        {},
        {
          headers: {
            Authorization: `Bearer ${refreshToken}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors du refresh du token:', error.response?.data || error.message);
      throw error;
    }
  },

  // ========================================
  // UTILISATEUR
  // ========================================

  /**
   * Récupérer le profil de l'utilisateur connecté
   * @returns {Promise<Object>} Données du profil utilisateur
   */
  getMyProfile: async () => {
    try {
      const response = await api.get('/api/v1/users/me');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Mettre à jour le profil de l'utilisateur connecté
   * @param {Object} userData - Données à mettre à jour
   * @returns {Promise<Object>} Profil mis à jour
   */
  updateMyProfile: async (userData) => {
    try {
      const response = await api.patch('/api/v1/users/me', userData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Supprimer le compte de l'utilisateur connecté
   * @returns {Promise<void>}
   */
  deleteMyAccount: async () => {
    try {
      await api.delete('/api/v1/users/me');
      await removeTokens();
    } catch (error) {
      console.error('Erreur lors de la suppression du compte:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Vérifier la disponibilité d'un email ou username
   * @param {string} email - Email à vérifier (optionnel)
   * @param {string} username - Username à vérifier (optionnel)
   * @returns {Promise<Object>} Statut de disponibilité
   */
  checkAvailability: async (email = null, username = null) => {
    try {
      const params = {};
      if (email) params.email = email;
      if (username) params.username = username;

      const response = await axios.get(
        `${API_BASE_URL}/api/v1/auth/check-availability`,
        { params }
      );
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la vérification de disponibilité:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Lister tous les utilisateurs (admin)
   * @returns {Promise<Array>} Liste des utilisateurs
   */
  getAllUsers: async () => {
    try {
      const response = await api.get('/api/v1/users');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error.response?.data || error.message);
      throw error;
    }
  },
};

export default apiService;