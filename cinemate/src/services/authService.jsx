import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
//get the api key from the .env file
//import { TMDB_API_KEY } from '@env';

const API_KEY = "b5b127c27b05cc748d56999e632af5dc";

const BASE_URL = 'https://api.themoviedb.org/3';

export const createRequestToken = async () => {
  const response = await axios.get(
    `${BASE_URL}/authentication/token/new?api_key=${API_KEY}`
  );
  return response.data.request_token;
};

export const validateRequestToken = async (requestToken, username, password) => {
  const response = await axios.post(
    `${BASE_URL}/authentication/token/validate_with_login?api_key=${API_KEY}`,
    {
      username,
      password,
      request_token: requestToken
    }
  );
  return response.data.success;
};

export const createSession = async (requestToken) => {
  const response = await axios.post(
    `${BASE_URL}/authentication/session/new?api_key=${API_KEY}`,
    {
      request_token: requestToken
    }
  );
  return response.data.session_id;
};