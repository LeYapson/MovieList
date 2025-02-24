// src/services/tmdbService.js
import axios from 'axios';

const API_KEY = 'b5b127c27b05cc748d56999e632af5dc';
const BASE_URL = 'https://api.themoviedb.org/3';

const api = axios.create({
  baseURL: BASE_URL,
  params: {
    api_key: API_KEY,
    language: 'fr-FR',
  },
});

// Définition des IDs de genres TMDB
const GENRES = {
  ACTION: 28,
  COMEDY: 35,
  HORROR: 27,
  DOCUMENTARY: 99,
  ANIMATION: 16,
  SCIENCE_FICTION: 878
};

export const tmdbService = {
  // Films populaires
  getPopularMovies: async (page = 1) => {
    const response = await api.get('/movie/popular', { params: { page } });
    return response.data;
  },

  // Films à l'affiche
  getNowPlayingMovies: async (page = 1) => {
    const response = await api.get('/movie/now_playing', { params: { page } });
    return response.data;
  },

  // Films les mieux notés
  getTopRatedMovies: async (page = 1) => {
    const response = await api.get('/movie/top_rated', { params: { page } });
    return response.data;
  },

  // Films à venir
  getUpcomingMovies: async (page = 1) => {
    const response = await api.get('/movie/upcoming', { params: { page } });
    return response.data;
  },

  // Obtenir les films par genre
  getMoviesByGenre: async (genreId, page = 1) => {
    const response = await api.get('/discover/movie', {
      params: {
        page,
        with_genres: genreId,
        sort_by: 'popularity.desc' // Trier par popularité
      }
    });
    return response.data;
  },

  // Méthodes spécifiques pour chaque genre
  getActionMovies: async (page = 1) => {
    return tmdbService.getMoviesByGenre(GENRES.ACTION, page);
  },

  getComedyMovies: async (page = 1) => {
    return tmdbService.getMoviesByGenre(GENRES.COMEDY, page);
  },

  getHorrorMovies: async (page = 1) => {
    return tmdbService.getMoviesByGenre(GENRES.HORROR, page);
  },

  getDocumentaryMovies: async (page = 1) => {
    return tmdbService.getMoviesByGenre(GENRES.DOCUMENTARY, page);
  },

  getAnimationMovies: async (page = 1) => {
    return tmdbService.getMoviesByGenre(GENRES.ANIMATION, page);
  },

  getSciFiMovies: async (page = 1) => {
    return tmdbService.getMoviesByGenre(GENRES.SCIENCE_FICTION, page);
  },

  // Détails d'un film
  getMovieDetails: async (movieId) => {
    const response = await api.get(`/movie/${movieId}`);
    return response.data;
  },

  // Crédits d'un film
  getMovieCredits: async (movieId) => {
    const response = await api.get(`/movie/${movieId}/credits`);
    return response.data;
  }
};

export default tmdbService;