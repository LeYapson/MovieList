// src/services/movieService.js
import axios from 'axios';
import { API_KEY } from '@env';

const BASE_URL = 'https://api.themoviedb.org/3';

// Films populaires
export const getPopularMovies = async () => {
  const response = await axios.get(
    `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=fr-FR`
  );
  return response.data.results;
};

// Films à l'affiche
export const getNowPlayingMovies = async () => {
  const response = await axios.get(
    `${BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=fr-FR`
  );
  return response.data.results;
};

// Films les mieux notés
export const getTopRatedMovies = async () => {
  const response = await axios.get(
    `${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=fr-FR`
  );
  return response.data.results;
};

// Films à venir
export const getUpcomingMovies = async () => {
  const response = await axios.get(
    `${BASE_URL}/movie/upcoming?api_key=${API_KEY}&language=fr-FR`
  );
  return response.data.results;
};

// Obtenir la watchlist
export const getWatchlist = async (accountId, sessionId, page = 1) => {
  try {
    // Si l'accountId n'est pas fourni, utiliser auto-identification par session
    const endpoint = accountId 
      ? `${BASE_URL}/account/${accountId}/watchlist/movies` 
      : `${BASE_URL}/account/watchlist/movies`;

    const response = await axios.get(endpoint, {
      params: {
        api_key: API_KEY,
        session_id: sessionId,
        language: 'fr-FR',
        page,
        sort_by: 'created_at.desc'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération de la watchlist:', error);
    // Retourner un objet vide mais valide pour éviter les erreurs
    return { results: [], page: 1, total_pages: 1 };
  }
};

// Ajouter/retirer un film de la watchlist
export const toggleWatchlist = async (accountId, sessionId, movieId, addToWatchlist = true) => {
  try {
    // Si l'accountId n'est pas fourni, utiliser auto-identification par session
    const endpoint = accountId 
      ? `${BASE_URL}/account/${accountId}/watchlist` 
      : `${BASE_URL}/account/watchlist`;
    
    const response = await axios.post(
      endpoint,
      {
        media_type: 'movie',
        media_id: movieId,
        watchlist: addToWatchlist
      },
      {
        params: {
          api_key: API_KEY,
          session_id: sessionId
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de ${addToWatchlist ? 'l\'ajout à' : 'la suppression de'} la watchlist:`, error);
    throw error;
  }
};

// Ajouter un film à la watchlist (pour simplicité d'utilisation)
export const addToWatchlist = async (accountId, sessionId, movieId) => {
  return toggleWatchlist(accountId, sessionId, movieId, true);
};

// Retirer un film de la watchlist (pour simplicité d'utilisation)
export const removeFromWatchlist = async (accountId, sessionId, movieId) => {
  return toggleWatchlist(accountId, sessionId, movieId, false);
};

// Détails d'un film
export const getMovieDetails = async (movieId) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=fr-FR&append_to_response=credits,videos,similar`
    );
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des détails du film:', error);
    throw error;
  }
};

// Recherche de films
export const searchMovies = async (query, page = 1) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/search/movie`,
      {
        params: {
          api_key: API_KEY,
          language: 'fr-FR',
          query,
          page,
          include_adult: false
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la recherche de films:', error);
    return { results: [], page: 1, total_pages: 1 };
  }
};

export default {
  getPopularMovies,
  getNowPlayingMovies,
  getTopRatedMovies,
  getUpcomingMovies,
  getWatchlist,
  toggleWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  getMovieDetails,
  searchMovies
};