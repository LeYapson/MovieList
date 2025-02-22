import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
//get the api key from the .env file
//import { TMDB_API_KEY } from '@env';

const API_KEY = "b5b127c27b05cc748d56999e632af5dc";

const BASE_URL = 'https://api.themoviedb.org/3';


//create a new request token
export const createRequestToken = async () => {
  const response = await axios.get(
    `${BASE_URL}/authentication/token/new?api_key=${API_KEY}`
  );
  return response.data.request_token;
};

//validate the request token
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

//create a new session
export const createSession = async (requestToken) => {
  const response = await axios.post(
    `${BASE_URL}/authentication/session/new?api_key=${API_KEY}`,
    {
      request_token: requestToken
    }
  );
  return response.data.session_id;
};

//get the user account details
export const getAccountDetails = async (sessionId) => {
  const response = await axios.get(
    `${BASE_URL}/account?api_key=${API_KEY}&session_id=${sessionId}`
  );
  return response.data;
};

//sign up a new user
export const signup = async (username, email, password) => {
  const response = await axios.post(
    `${BASE_URL}/authentication/token/new?api_key=${API_KEY}`
  );
  const requestToken = response.data.request_token;

  await axios.post(
    `${BASE_URL}/authentication/register?api_key=${API_KEY}`,
    {
      username,
      password,
      email,
      request_token: requestToken
    }
  );
};