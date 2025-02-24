// src/screens/main/MovieDetailScreen.jsx
import React, { useState, useEffect } from 'react';
import { View , ScrollView , Image , Text , StyleSheet , ActivityIndicator , TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import tmdbService from '../../services/tmdbService';


const MovieDetailScreen = ({ route, navigation }) => {
  const { movieId } = route.params;
  const { theme } = useTheme();
  const [movie, setMovie] = useState(null);
  const [cast, setCast] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMovieDetails();
  }, [movieId]);

  const loadMovieDetails = async () => {
    try {
      const [movieData, credits] = await Promise.all([
        tmdbService.getMovieDetails(movieId),
        tmdbService.getMovieCredits(movieId)
      ]);
      setMovie(movieData);
      setCast(credits.cast.slice(0, 10)); // Les 10 premiers acteurs
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  if (isLoading || !movie) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header avec bouton retour */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: theme.card }]}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Poster et infos principales */}
      <Image
        source={{ uri: `https://image.tmdb.org/t/p/w500${movie.poster_path}` }}
        style={styles.poster}
      />

      <View style={styles.infoContainer}>
        <Text style={[styles.title, { color: theme.text }]}>{movie.title}</Text>
        <Text style={[styles.year, { color: theme.textSecondary }]}>
          {new Date(movie.release_date).getFullYear()}
        </Text>

        {/* Genres */}
        <View style={styles.genresContainer}>
          {movie.genres.map(genre => (
            <View 
              key={genre.id} 
              style={[styles.genreTag, { backgroundColor: theme.primary }]}
            >
              <Text style={[styles.genreText, { color: '#fff' }]}>
                {genre.name}
              </Text>
            </View>
          ))}
        </View>

        {/* Note et durée */}
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Ionicons name="star" size={20} color="#FFD700" />
            <Text style={[styles.statText, { color: theme.text }]}>
              {movie.vote_average.toFixed(1)}/10
            </Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="time-outline" size={20} color={theme.text} />
            <Text style={[styles.statText, { color: theme.text }]}>
              {movie.runtime} min
            </Text>
          </View>
        </View>

        {/* Synopsis */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Synopsis</Text>
        <Text style={[styles.overview, { color: theme.text }]}>
          {movie.overview}
        </Text>

        {/* Distribution */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Distribution</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {cast.map(actor => (
            <View key={actor.id} style={styles.actorCard}>
              <Image
                source={{ 
                  uri: actor.profile_path 
                    ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                    : 'https://via.placeholder.com/185x278'
                }}
                style={styles.actorImage}
              />
              <Text style={[styles.actorName, { color: theme.text }]}>
                {actor.name}
              </Text>
              <Text style={[styles.character, { color: theme.textSecondary }]}>
                {actor.character}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  poster: {
    width: '100%',
    height: 500,
    resizeMode: 'cover',
  },
  infoContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  year: {
    fontSize: 18,
    marginBottom: 16,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  genreTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  genreText: {
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 24,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  overview: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  actorCard: {
    width: 120,
    marginRight: 16,
  },
  actorImage: {
    width: 120,
    height: 180,
    borderRadius: 8,
    marginBottom: 8,
  },
  actorName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  character: {
    fontSize: 12,
  }
});

export default MovieDetailScreen;