// src/services/tmdbService.js
import axios from 'axios';
import { API_KEY} from '@env';

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



const tmdbService = {
  // === MÉTHODES D'AUTHENTIFICATION ===
  
  // Créer un token de demande (étape 1 de l'authentification)
  createRequestToken: async () => {
    const response = await api.get('/authentication/token/new');
    return response.data;
  },
  
  // Valider le token avec nom d'utilisateur et mot de passe (étape 2)
  validateRequestToken: async (username, password, requestToken) => {
    const response = await api.post('/authentication/token/validate_with_login', {
      username,
      password,
      request_token: requestToken
    });
    return response.data;
  },
  
  // Créer une session (étape 3)
  createSession: async (requestToken) => {
    const response = await api.post('/authentication/session/new', {
      request_token: requestToken
    });
    return response.data;
  },
  
  // Déconnecter une session
  logout: async (sessionId) => {
    try {
      const response = await api.delete('/authentication/session', {
        data: { session_id: sessionId }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Ne pas relancer l'erreur pour permettre la déconnexion locale
    }
  },
  
  // === MÉTHODES DE PROFIL UTILISATEUR ===
  
  // Obtenir les détails du compte
  getAccountDetails: async (sessionId) => {
    const response = await api.get('/account', {
      params: { session_id: sessionId }
    });
    return response.data;
  },
  

  

  getMovieWatchProviders: async (movieId) => {
    try {
      const response = await api.get(`/movie/${movieId}/watch/providers`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des plateformes pour le film ${movieId}:`, error);
      return { results: {} };
    }
  },

  // Obtenir les films favoris de l'utilisateur
  getFavoriteMovies: async (accountId, sessionId, page = 1) => {
    try {
      const response = await api.get(`/account/${accountId}/favorite/movies`, {
        params: {
          session_id: sessionId,
          page
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des favoris:', error);
      return { results: [] };
    }
  },
  
  // Obtenir la watchlist de l'utilisateur
  getWatchlist: async (accountId, sessionId, page = 1) => {
    try {
      const response = await api.get(`/account/${accountId}/watchlist/movies`, {
        params: {
          session_id: sessionId,
          page
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de la watchlist:', error);
      return { results: [] };
    }
  },
  
  // Ajouter/supprimer un film des favoris
  toggleFavorite: async (accountId, sessionId, mediaId, isFavorite) => {
    const response = await api.post(`/account/${accountId}/favorite`, {
      media_type: 'movie',
      media_id: mediaId,
      favorite: isFavorite
    }, {
      params: { session_id: sessionId }
    });
    return response.data;
  },
  
  // Ajouter/supprimer un film de la watchlist
  toggleWatchlist: async (accountId, sessionId, mediaId, onWatchlist) => {
    const response = await api.post(`/account/${accountId}/watchlist`, {
      media_type: 'movie',
      media_id: mediaId,
      watchlist: onWatchlist
    }, {
      params: { session_id: sessionId }
    });
    return response.data;
  },
  
  // Obtenir les films notés par l'utilisateur
  getRatedMovies: async (accountId, sessionId, page = 1) => {
    try {
      const response = await api.get(`/account/${accountId}/rated/movies`, {
        params: {
          session_id: sessionId,
          page
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des films notés:', error);
      return { results: [] };
    }
  },
  
  // Noter un film
  rateMovie: async (movieId, sessionId, rating) => {
    const response = await api.post(`/movie/${movieId}/rating`, {
      value: rating
    }, {
      params: { session_id: sessionId }
    });
    return response.data;
  },
  
  // Supprimer la note d'un film
  deleteRating: async (movieId, sessionId) => {
    const response = await api.delete(`/movie/${movieId}/rating`, {
      params: { session_id: sessionId }
    });
    return response.data;
  },

  // === MÉTHODES POUR LES FILMS ===
  
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

  // Recherche de films
  searchMovies: async (query, page = 1) => {
    const response = await api.get('/search/movie', {
      params: {
        query,
        page,
        include_adult: false
      }
    });
    return response.data;
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
  },

  // Vidéos d'un film (bandes-annonces, etc.)
  getMovieVideos: async (movieId) => {
    const response = await api.get(`/movie/${movieId}/videos`);
    return response.data;
  },

  // Films similaires
  getSimilarMovies: async (movieId, page = 1) => {
    const response = await api.get(`/movie/${movieId}/similar`, {
      params: { page }
    });
    return response.data;
  },

  // Recommandations de films
  getRecommendedMovies: async (movieId, page = 1) => {
    const response = await api.get(`/movie/${movieId}/recommendations`, {
      params: { page }
    });
    return response.data;
  },

  // Récupérer les détails d'une personne (acteur, réalisateur, etc.)
  getPersonDetails: async (personId) => {
    try {
      const response = await api.get(`/person/${personId}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des détails de la personne ${personId}:`, error);
      throw error;
    }
  },

  // Récupérer les crédits de films d'une personne
  getPersonMovieCredits: async (personId) => {
    try {
      const response = await api.get(`/person/${personId}/movie_credits`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des crédits de films de la personne ${personId}:`, error);
      throw error;
    }
  },

  // Récupérer les crédits TV d'une personne (séries)
  getPersonTVCredits: async (personId) => {
    try {
      const response = await api.get(`/person/${personId}/tv_credits`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des crédits TV de la personne ${personId}:`, error);
      throw error;
    }
  },

  // Récupérer les images d'une personne
  getPersonImages: async (personId) => {
    try {
      const response = await api.get(`/person/${personId}/images`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des images de la personne ${personId}:`, error);
      throw error;
    }
  },

  // recuperer les videos d'un film
  getMovieVideos: async (movieId) => {
    try {
      const response = await axios.get(`${BASE_URL}/movie/${movieId}/videos`, {
        params: { api_key: API_KEY }
      });
      return response.data.results;
    } catch (error) {
      console.error('Erreur lors de la récupération des vidéos du film:', error);
      throw error;
    }
  },
};

export default tmdbService;