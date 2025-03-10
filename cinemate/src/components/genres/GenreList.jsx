import React, { useEffect, useState } from 'react';
import GenreTag from './GenreTag';
import { fetchGenres, fetchMovieGenres } from '../../services/tmdbService';

// Composant pour afficher les genres d'un film
const MovieGenres = ({ movieId }) => {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getMovieGenres = async () => {
      try {
        setLoading(true);
        const movieData = await fetchMovieGenres(movieId);
        setGenres(movieData.genres || []);
        setLoading(false);
      } catch (err) {
        setError("Impossible de charger les genres");
        setLoading(false);
      }
    };

    if (movieId) {
      getMovieGenres();
    }
  }, [movieId]);

  if (loading) return <div className="genres-loading">Chargement...</div>;
  if (error) return <div className="genres-error">{error}</div>;
  if (genres.length === 0) return <div className="no-genres">Aucun genre disponible</div>;

  return (
    <div className="movie-genres">
      {genres.map(genre => (
        <GenreTag key={genre.id} genre={genre} />
      ))}
    </div>
  );
};

// Composant pour afficher tous les genres disponibles (par exemple dans un filtre)
const AllGenres = ({ onGenreClick }) => {
  const [allGenres, setAllGenres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getAllGenres = async () => {
      try {
        const genresData = await fetchGenres();
        setAllGenres(genresData);
        setLoading(false);
      } catch (err) {
        console.error("Erreur lors du chargement des genres", err);
        setLoading(false);
      }
    };

    getAllGenres();
  }, []);

  if (loading) return <div>Chargement des genres...</div>;

  return (
    <div className="all-genres-container">
      {allGenres.map(genre => (
        <div 
          key={genre.id} 
          onClick={() => onGenreClick && onGenreClick(genre)}
          className="clickable-genre"
        >
          <GenreTag genre={genre} />
        </div>
      ))}
    </div>
  );
};

export { MovieGenres, AllGenres };