//this code is for the different API calls linked with authetification
import axios from 'axios';

//get the TMDB_API_KEY from the .env file
const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;


//Créer un Jetons de Requête (Request Token)
export const createRequestToken = () => {
    return axios
        .get(`https://api.themoviedb.org/3/authentication/token/new?api_key=${TMDB_API_KEY}`)
        .then(response => {
            return response.data.request_token
        })
}

//Valider le Jetons de Requête (Validate Request Token)
export const validateRequestToken = (requestToken) => {
    return axios
        .post(`https://api.themoviedb.org/3/authentication/token/validate_with_login?api_key=${TMDB_API_KEY}`, {
            username: 'username',
            password: 'password',
            request_token: requestToken
        })
        .then(response => {
            return response.data.request_token
        })
}

//Créer une Session (Create Session)
export const createSession = (requestToken) => {
    return axios
        .post(`https://api.themoviedb.org/3/authentication/session/new?api_key=${TMDB_API_KEY}`, {
            request_token: requestToken
        })
        .then(response => {
            return response.data.session_id
        })
}

//Obtenir les Détails du Compte (Get Account Details)
export const getAccountDetails = (sessionId) => {
    return axios
        .get(`https://api.themoviedb.org/3/account?api_key=${TMDB_API_KEY}&session_id=${sessionId}`)
        .then(response => {
            return response.data
        })
}