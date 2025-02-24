// src/components/movies/MovieListLazy.jsx
import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import MovieList from './MovieList';

const MovieListLazy = ({ 
  title, 
  fetchMovies, 
  onMoviePress, 
  theme,
  onVisibilityChange,
  isVisible 
}) => {
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les films uniquement quand la section devient visible
  useEffect(() => {
    let isMounted = true;

    const loadMovies = async () => {
      if (isVisible && movies.length === 0) {
        try {
          setIsLoading(true);
          const data = await fetchMovies();
          if (isMounted) {
            setMovies(data.results);
          }
        } catch (error) {
          console.error(`Erreur chargement ${title}:`, error);
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      }
    };

    loadMovies();

    return () => {
      isMounted = false;
    };
  }, [isVisible]);

  // Décharger les films quand la section n'est plus visible
  useEffect(() => {
    if (!isVisible && movies.length > 0) {
      setMovies([]); // Libérer la mémoire
    }
  }, [isVisible]);

  return (
    <View>
      <MovieList
        title={title}
        movies={movies}
        onMoviePress={onMoviePress}
        theme={theme}
        isLoading={isLoading}
      />
    </View>
  );
};

export default MovieListLazy;