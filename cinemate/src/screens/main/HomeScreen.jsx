// src/screens/main/HomeScreen.jsx
import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import MovieList from '../../components/movies/MovieList';
import { getPopularMovies, getNowPlayingMovies, getTopRatedMovies } from '../../services/movieService';

const HomeScreen = ({ navigation }) => {
  const [popularMovies, setPopularMovies] = useState([]);
  const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async () => {
    try {
      setIsLoading(true);
      const [popular, nowPlaying, topRated] = await Promise.all([
        getPopularMovies(),
        getNowPlayingMovies(),
        getTopRatedMovies()
      ]);

      setPopularMovies(popular);
      setNowPlayingMovies(nowPlaying);
      setTopRatedMovies(topRated);
    } catch (error) {
      console.error('Erreur chargement films:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoviePress = (movie) => {
    navigation.navigate('MovieDetail', { movieId: movie.id });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <MovieList
        title="Films Populaires"
        movies={popularMovies}
        onMoviePress={handleMoviePress}
      />
      <MovieList
        title="En ce moment"
        movies={nowPlayingMovies}
        onMoviePress={handleMoviePress}
      />
      <MovieList
        title="Les mieux notés"
        movies={topRatedMovies}
        onMoviePress={handleMoviePress}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HomeScreen;