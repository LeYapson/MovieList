import React, { memo, useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Composant MovieCard optimisé avec memo pour éviter les re-renders inutiles
const AnimatedMovieCard = memo(({ movie, onPress, index, delay = 0, theme }) => {
  const posterUrl = movie.poster_path 
    ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` // Utiliser w342 au lieu de w500 pour charger plus rapidement
    : 'https://via.placeholder.com/342x513?text=No+Image';

  // Animation pour l'apparition progressive
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation avec délai basé sur l'index
    const animDelay = delay + Math.min(index * 50, 500); // Limiter le délai max à 500ms
    
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 250, // Réduit à 250ms
        delay: animDelay,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 250, // Réduit à 250ms
        delay: animDelay,
        useNativeDriver: true,
      })
    ]).start();
  }, [movie.id]); // Dépendance sur movie.id au lieu de []

  return (
    <Animated.View 
      style={[
        styles.movieCardContainer,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <TouchableOpacity 
        style={[styles.movieCard, { backgroundColor: theme.card }]}
        onPress={() => onPress(movie.id)}
        activeOpacity={0.7}
      >
        <Image 
          source={{ uri: posterUrl }}
          style={styles.poster}
          resizeMode="cover"
          // Ajout de props pour optimiser le chargement des images
          progressiveRenderingEnabled={true}
          fadeDuration={300}
        />
        <View style={[styles.titleContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.movieTitle, { color: theme.text }]} numberOfLines={2}>
            {movie.title}
          </Text>
          {movie.release_date ? (
            <Text style={[styles.dateText, { color: theme.textSecondary }]}>
              {new Date(movie.release_date).getFullYear()}
            </Text>
          ) : null}
          {movie.vote_average > 0 ? (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={[styles.ratingText, { color: theme.text }]}>
                {movie.vote_average.toFixed(1)}
              </Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}, (prevProps, nextProps) => {
  // Fonction de comparaison personnalisée pour memo
  // Ne re-render que si l'ID du film change
  return prevProps.movie.id === nextProps.movie.id;
});

const styles = StyleSheet.create({
  movieCardContainer: {
    margin: 8,
    flex: 1, // Remplace width fixe pour mieux s'adapter
    maxWidth: '50%',
  },
  movieCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  poster: {
    width: '100%',
    aspectRatio: 2/3, // Utiliser aspectRatio au lieu de hauteur fixe
    borderRadius: 16,
  },
  titleContainer: {
    padding: 12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  movieTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default AnimatedMovieCard;