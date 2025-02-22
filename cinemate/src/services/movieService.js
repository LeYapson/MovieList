import axios from 'axios';

const API_KEY = 'b5b127c27b05cc748d56999e632af5dc';
const BASE_URL = 'https://api.themoviedb.org/3';

export const getPopularMovies = async () => {
  const response = await axios.get(
    `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=fr-FR`
  );
  return response.data.results;
};

export const getNowPlayingMovies = async () => {
  const response = await axios.get(
    `${BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=fr-FR`
  );
  return response.data.results;
};

export const getTopRatedMovies = async () => {
  const response = await axios.get(
    `${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=fr-FR`
  );
  return response.data.results;
};