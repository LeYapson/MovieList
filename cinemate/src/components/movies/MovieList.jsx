// src/components/movies/MovieList.jsx
import React from 'react';
import { View, ScrollView, Image, Text, TouchableOpacity, StyleSheet } from 'react-native';

const MovieList = ({ title, movies, onMoviePress }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {movies.map((movie) => (
          <TouchableOpacity
            key={movie.id}
            style={styles.movieCard}
            onPress={() => onMoviePress(movie)}
          >
            <Image
              style={styles.poster}
              source={{
                uri: `https://image.tmdb.org/t/p/w500${movie.poster_path}`
              }}
            />
            <Text style={styles.movieTitle} numberOfLines={2}>
              {movie.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
    marginBottom: 10,
  },
  movieCard: {
    width: 140,
    marginHorizontal: 5,
  },
  poster: {
    width: 140,
    height: 210,
    borderRadius: 8,
  },
  movieTitle: {
    marginTop: 5,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default MovieList;