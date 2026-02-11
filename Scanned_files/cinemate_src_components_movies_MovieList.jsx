// src/components/movies/MovieList.jsx
import React, { useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image,
  Animated,
  Easing,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = 140;

// Animated Movie Card
const MovieCard = ({ movie, onPress, index, theme }) => {
  const posterUrl = movie.poster_path 
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : 'https://via.placeholder.com/500x750?text=No+Image';

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    // Stagger animation based on index
    const delay = index * 50;
    
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 280,
        delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5))
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 250,
        delay,
        useNativeDriver: true
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 280,
        delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      })
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.movieCardContainer,
        {
          opacity: opacityAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: translateYAnim }
          ]
        }
      ]}
    >
      <TouchableOpacity 
        style={[styles.movieCard, { backgroundColor: theme.card }]}
        onPress={() => onPress(movie)}
        activeOpacity={0.8}
      >
        <Image 
          source={{ uri: posterUrl }}
          style={styles.poster}
          resizeMode="cover"
          progressiveRenderingEnabled={true}
          fadeDuration={300}
        />
        <View style={[styles.titleContainer, { backgroundColor: theme.card }]}>
          <Text 
            style={[styles.movieTitle, { color: theme.text }]}
            numberOfLines={2}
          >
            {movie.title}
          </Text>
          {movie.release_date && (
            <Text style={[styles.releaseDate, { color: theme.textSecondary }]}>
              {new Date(movie.release_date).getFullYear()}
            </Text>
          )}
          {movie.vote_average > 0 && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={[styles.ratingText, { color: theme.text }]}>
                {movie.vote_average.toFixed(1)}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Title Header with animation
const SectionTitle = ({ title, theme }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      })
    ]).start();
  }, []);

  return (
    <Animated.View 
      style={{
        opacity: fadeAnim,
        transform: [{ translateX: slideAnim }]
      }}
    >
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        {title}
      </Text>
    </Animated.View>
  );
};

const MovieList = ({ title, movies, onMoviePress, theme }) => {
  // Animation for container
  const containerOpacity = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(containerOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true
    }).start();
  }, []);

  return (
    <Animated.View style={[
      styles.container,
      { opacity: containerOpacity }
    ]}>
      <SectionTitle title={title} theme={theme} />
      
      <FlatList
        data={movies}
        renderItem={({ item, index }) => (
          <MovieCard 
            movie={item}
            index={index}
            onPress={onMoviePress}
            theme={theme}
          />
        )}
        keyExtractor={(item) => `movie-${item.id}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        snapToInterval={CARD_WIDTH + 16} // Card width + margins
        decelerationRate="fast"
        initialNumToRender={5}
        maxToRenderPerBatch={8}
        removeClippedSubviews={true}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
    marginBottom: 14,
  },
  listContent: {
    paddingHorizontal: 8,
  },
  movieCardContainer: {
    width: CARD_WIDTH,
    marginHorizontal: 8,
  },
  movieCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  poster: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.5,
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
  releaseDate: {
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
  }
});

export default MovieList;