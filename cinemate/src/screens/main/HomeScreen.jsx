import React from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { MovieCard } from '../../components/movies/MovieCard';

const HomeScreen = ({ navigation }) => {
  // Données de test
  const movies = [
    {
      id: 1,
      title: "Spider-Man: Across the Spider-Verse",
      posterPath: "/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
      releaseDate: "2023-06-02"
    },
    {
      id: 2,
      title: "Oppenheimer",
      posterPath: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
      releaseDate: "2023-07-21"
    }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Populaires</Text>
        {movies.map(movie => (
          <MovieCard
            key={movie.id}
            title={movie.title}
            posterPath={movie.posterPath}
            releaseDate={movie.releaseDate}
            onPress={() => navigation.navigate('MovieDetail', { movieId: movie.id })}
          />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tendances</Text>
        {movies.map(movie => (
          <MovieCard
            key={movie.id}
            title={movie.title}
            posterPath={movie.posterPath}
            releaseDate={movie.releaseDate}
            onPress={() => navigation.navigate('MovieDetail', { movieId: movie.id })}
          />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
    marginBottom: 8,
  },
});

export default HomeScreen;

