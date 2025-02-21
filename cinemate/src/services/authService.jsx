import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
//get the api key from the .env file
//import { TMDB_API_KEY } from '@env';

const API_KEY = "b5b127c27b05cc748d56999e632af5dc";

const BASE_URL = 'https://api.themoviedb.org/3';

export const createRequestToken = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/authentication/token/new`, {
      params: { api_key: API_KEY },
    });
    return response.data.request_token;
  } catch (error) {
    console.error('Erreur lors de la création du jeton de requête:', error);
    throw error;
  }
};

export const validateRequestToken = async (requestToken, username, password) => {
  try {
    await axios.post(`${BASE_URL}/authentication/token/validate_with_login`, null, {
      params: { api_key: API_KEY, request_token: requestToken, username, password },
    });
    return true;
  } catch (error) {
    console.error('Erreur lors de la validation du jeton de requête:', error);
    throw error;
  }
};

export const createSession = async (requestToken) => {
  try {
    const response = await axios.post(`${BASE_URL}/authentication/session/new`, null, {
      params: { api_key: API_KEY, request_token: requestToken },
    });
    await AsyncStorage.setItem('session_id', response.data.session_id);
    return response.data.session_id;
  } catch (error) {
    console.error('Erreur lors de la création de la session:', error);
    throw error;
  }
};

export const signup = async (username, email, password) => {
  try {
    // Simuler l'inscription en enregistrant les informations localement
    await AsyncStorage.setItem('user', JSON.stringify({ username, email, password }));
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    throw error;
  }
};