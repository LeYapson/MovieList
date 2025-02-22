// src/screens/main/HomeScreen.jsx
import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import MovieList from '../../components/movies/MovieList';
import { getPopularMovies, getNowPlayingMovies, getTopRatedMovies } from '../../services/movieService';
import { useTheme } from '../../context/ThemeContext';

const HomeScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [popularMovies, setPopularMovies] = useState([]);
  const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadMovies().finally(() => setRefreshing(false));
  }, []);

  const handleMoviePress = (movie) => {
    navigation.navigate('MovieDetail', { movieId: movie.id });
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.primary}
        />
      }
    >
      <MovieList
        title="Films Populaires"
        movies={popularMovies}
        onMoviePress={handleMoviePress}
        theme={theme}
      />
      <MovieList
        title="À l'affiche"
        movies={nowPlayingMovies}
        onMoviePress={handleMoviePress}
        theme={theme}
      />
      <MovieList
        title="Les mieux notés"
        movies={topRatedMovies}
        onMoviePress={handleMoviePress}
        theme={theme}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HomeScreen;