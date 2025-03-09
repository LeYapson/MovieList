// src/screens/main/HomeScreen.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  Dimensions, 
  Animated, 
  Easing,
  StatusBar,
  TouchableOpacity,
  Image
} from 'react-native';
import MovieList from '../../components/movies/MovieList';
import tmdbService from '../../services/tmdbService';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const CATEGORIES = [
  { id: 'popular', title: 'Films Populaires', fetch: tmdbService.getPopularMovies },
  { id: 'nowPlaying', title: 'Actuellement au cinéma', fetch: tmdbService.getNowPlayingMovies },
  { id: 'topRated', title: 'Les mieux notés', fetch: tmdbService.getTopRatedMovies },
  { id: 'upcoming', title: 'Prochainement', fetch: tmdbService.getUpcomingMovies },
  { id: 'action', title: 'Films d\'Action', fetch: tmdbService.getActionMovies },
  { id: 'comedy', title: 'Comédies', fetch: tmdbService.getComedyMovies },
  { id: 'horror', title: 'Films d\'Horreur', fetch: tmdbService.getHorrorMovies },
];

const VISIBLE_CATEGORIES_COUNT = 4;

// Composant de loader avec animation de pulsation améliorée
const PulseLoader = ({ color }) => {
  const pulseAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0.6)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease)
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.8,
            duration: 600,
            useNativeDriver: true,
            easing: Easing.in(Easing.ease)
          })
        ]),
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.6,
            duration: 600,
            useNativeDriver: true,
          })
        ])
      ])
    ).start();
  }, []);
  
  return (
    <Animated.View 
      style={{ 
        transform: [{ scale: pulseAnim }],
        opacity: opacityAnim
      }}
    >
      <ActivityIndicator size="large" color={color} />
    </Animated.View>
  );
};

// Composant d'en-tête animé
const AnimatedHeader = ({ theme }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.7))
      })
    ]).start();
  }, []);
  
  return (
    <Animated.View 
      style={[
        styles.header,
        {
          opacity: opacity,
          transform: [{ translateY: translateY }]
        }
      ]}
    >
      <Text style={[styles.headerTitle, { color: theme.text }]}>
        Découvrir
      </Text>
      <View style={styles.headerIcons}>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="search" size={26} color={theme.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="notifications" size={26} color={theme.primary} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// Composant pour afficher un film en vedette
const FeaturedMovie = ({ movie, onPress, theme }) => {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      })
    ]).start();
  }, []);
  
  if (!movie) return null;
  
  const backdropUrl = movie.backdrop_path 
    ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}`
    : null;
  
  return (
    <Animated.View
      style={[
        styles.featuredContainer,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={() => onPress(movie)}
        style={styles.featuredTouchable}
      >
        <Image
          source={{ uri: backdropUrl }}
          style={styles.backdropImage}
          resizeMode="cover"
        />
        <View style={styles.featuredGradient} />
        <View style={styles.featuredContent}>
          <Text style={styles.featuredTitle} numberOfLines={2}>
            {movie.title}
          </Text>
          <View style={styles.featuredMeta}>
            {movie.release_date && (
              <Text style={styles.featuredYear}>
                {new Date(movie.release_date).getFullYear()}
              </Text>
            )}
            {movie.vote_average > 0 && (
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>
                  {movie.vote_average.toFixed(1)}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.featuredActions}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.primary }]}
              activeOpacity={0.8}
            >
              <Ionicons name="play" size={18} color="#FFF" />
              <Text style={styles.actionText}>Bande Annonce</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.circleButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            >
              <Ionicons name="add" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const HomeScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [moviesByCategory, setMoviesByCategory] = useState({});
  const [loadingCategories, setLoadingCategories] = useState(new Set([]));
  const [initialLoad, setInitialLoad] = useState(true);
  const [featuredMovie, setFeaturedMovie] = useState(null);
  
  const flatListRef = useRef(null);
  const scrollPosition = useRef(0);
  const lastVisibleItems = useRef([]);
  const isFirstRender = useRef(true);
  
  // Références pour les animations
  const fadeAnims = useRef({});
  const slideAnims = useRef({});
  const scaleAnims = useRef({});
  
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 20,
    minimumViewTime: 200,
  });

  // Initialiser les animations pour une catégorie
  const initAnimations = (categoryId) => {
    if (!fadeAnims.current[categoryId]) {
      fadeAnims.current[categoryId] = new Animated.Value(0);
      slideAnims.current[categoryId] = new Animated.Value(30);
      scaleAnims.current[categoryId] = new Animated.Value(0.95);
    }
  };

  // Déclencher les animations pour une catégorie
  const animateCategory = (categoryId) => {
    initAnimations(categoryId);
    
    Animated.parallel([
      Animated.timing(fadeAnims.current[categoryId], {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      }),
      Animated.timing(slideAnims.current[categoryId], {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      }),
      Animated.timing(scaleAnims.current[categoryId], {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5))
      })
    ]).start();
  };
  
  const loadFeaturedMovie = async () => {
    try {
      const response = await tmdbService.getPopularMovies();
      if (response.results && response.results.length > 0) {
        // Prenez un film aléatoire parmi les 5 premiers
        const randomIndex = Math.floor(Math.random() * Math.min(5, response.results.length));
        setFeaturedMovie(response.results[randomIndex]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du film en vedette:', error);
    }
  };

  // Chargement initial du film en vedette et de la première catégorie
  useEffect(() => {
    if (initialLoad) {
      loadFeaturedMovie();
      loadCategory('popular');
      setInitialLoad(false);
    }
  }, [initialLoad]);

  const loadCategory = async (categoryId) => {
    if (moviesByCategory[categoryId] || loadingCategories.has(categoryId)) return;

    try {
      setLoadingCategories(prev => new Set([...prev, categoryId]));
      initAnimations(categoryId);
      
      const category = CATEGORIES.find(c => c.id === categoryId);
      
      // Enregistrer position actuelle
      if (flatListRef.current) {
        flatListRef.current.getScrollOffset && flatListRef.current.getScrollOffset((offset) => {
          scrollPosition.current = offset;
        });
      }
      
      const response = await category.fetch();
      
      setMoviesByCategory(prev => ({
        ...prev,
        [categoryId]: response.results
      }));
      
      // Déclencher l'animation
      animateCategory(categoryId);
    } catch (error) {
      console.error(`Erreur chargement catégorie ${categoryId}:`, error);
    } finally {
      setLoadingCategories(prev => {
        const newSet = new Set(prev);
        newSet.delete(categoryId);
        return newSet;
      });
    }
  };

  // Restaurer position après mise à jour
  useEffect(() => {
    if (flatListRef.current && scrollPosition.current > 0 && !isFirstRender.current) {
      setTimeout(() => {
        flatListRef.current.scrollToOffset({ 
          offset: scrollPosition.current,
          animated: false
        });
      }, 50);
    }
    isFirstRender.current = false;
  }, [moviesByCategory]);

  const onScroll = (event) => {
    scrollPosition.current = event.nativeEvent.contentOffset.y;
  };

  // Gérer les éléments visibles
  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    const visibleIds = viewableItems.map(item => item.item.id);
    lastVisibleItems.current = visibleIds;
    
    // Charger toutes les catégories visibles
    visibleIds.forEach(id => {
      loadCategory(id);
    });
    
    // Ne plus décharger les catégories non visibles pour éviter les problèmes de rechargement
    // lors du défilement vers le haut
  }, [loadingCategories]);

  // Rendu du header avec film en vedette
  const renderHeader = () => {
    return (
      <>
        <AnimatedHeader theme={theme} />
        {featuredMovie && (
          <FeaturedMovie 
            movie={featuredMovie} 
            onPress={(movie) => navigation.navigate('MovieDetail', { movieId: movie.id })}
            theme={theme}
          />
        )}
      </>
    );
  };

  const renderCategory = ({ item }) => {
    const isLoading = loadingCategories.has(item.id);
    const movies = moviesByCategory[item.id] || [];
    
    // Initialiser animations si nécessaire
    initAnimations(item.id);
    
    // Créer des styles animés
    const animatedStyle = {
      opacity: fadeAnims.current[item.id],
      transform: [
        { translateY: slideAnims.current[item.id] },
        { scale: scaleAnims.current[item.id] }
      ]
    };
    
    // Si la catégorie n'est pas chargée et n'est pas en cours de chargement, la charger
    if (!movies.length && !isLoading) {
      loadCategory(item.id);
    }
    
    return (
      <Animated.View style={[styles.categoryContainer, animatedStyle]}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <PulseLoader color={theme.primary} />
          </View>
        ) : (
          <View style={styles.categoryContent}>
            {movies.length > 0 ? (
              <MovieList
                title={item.title}
                movies={movies}
                onMoviePress={(movie) => navigation.navigate('MovieDetail', { movieId: movie.id })}
                theme={theme}
              />
            ) : (
              <View style={styles.placeholderContainer} />
            )}
          </View>
        )}
      </Animated.View>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: theme.text }]}>
        Chargement des films...
      </Text>
      <PulseLoader color={theme.primary} />
    </View>
  );

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
      
      <FlatList
        ref={flatListRef}
        data={CATEGORIES}
        renderItem={renderCategory}
        keyExtractor={item => item.id}
        style={styles.container}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig.current}
        removeClippedSubviews={false}
        maxToRenderPerBatch={3}
        windowSize={6}
        initialNumToRender={2}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        maintainVisibleContentPosition={{ 
          minIndexForVisible: 0,
        }}
        ListEmptyComponent={renderEmptyList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  listContent: {
    paddingTop: StatusBar.currentHeight || 0,
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 16,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  categoryContainer: {
    marginBottom: 8,
  },
  categoryContent: {
    flex: 1,
  },
  loadingContainer: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContainer: {
    height: 250,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 300,
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 20,
    fontWeight: '600',
  },
  featuredContainer: {
    marginHorizontal: 16,
    marginVertical: 16,
    height: 240,
    borderRadius: 18,
    overflow: 'hidden',
  },
  featuredTouchable: {
    flex: 1,
  },
  backdropImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  featuredGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    backgroundGradient: {
      colors: ['transparent', 'rgba(0,0,0,0.8)'],
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
    },
  },
  featuredContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  featuredTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featuredYear: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginRight: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  featuredActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    marginRight: 12,
  },
  actionText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default HomeScreen;