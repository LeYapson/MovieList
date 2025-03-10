import React, { useEffect, useState } from 'react';
import GenreTag from './GenreTag';
import { fetchGenres, fetchMoviesByGenre } from '../../services/tmdbService';

const SearchByTag = () => {
  const [genres, setGenres] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGenres().then(setGenres);
  }, []);

  const handleGenreClick = async (genreId) => {
    setLoading(true);
    const moviesByGenre = await fetchMoviesByGenre(genreId);
    setMovies(moviesByGenre);
    setLoading(false);
  };

  return (
    <div className="search-by-tag">
      <h1>Recherche par tags</h1>
      <div className="all-genres-container">
        {genres.map((genre) => (
          <GenreTag key={genre.id} genre={genre} onClick={handleGenreClick} />
        ))}
      </div>

      {loading && <p>Chargement des films...</p>}
      <div className="movie-results">
        {movies.map((movie) => (
          <div key={movie.id} className="movie-card">
            <h3>{movie.title}</h3>
            <p>{movie.overview}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchByTag;
