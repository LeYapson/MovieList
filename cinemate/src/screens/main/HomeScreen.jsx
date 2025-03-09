// src/screens/main/HomeScreen.jsx
import React, { useState, useRef, useEffect } from 'react';
import { View , FlatList , StyleSheet , ActivityIndicator , Dimensions , Animated , Easing, Text } from 'react-native';
import MovieList from '../../components/movies/MovieList';
import tmdbService from '../../services/tmdbService';
import { useTheme } from '../../context/ThemeContext';

const CATEGORIES = [
  { id: 'popular', title: 'Films Populaires', fetch: tmdbService.getPopularMovies },
  { id: 'nowPlaying', title: 'Actuellement au cinéma', fetch: tmdbService.getNowPlayingMovies },
  { id: 'topRated', title: 'Les mieux notés', fetch: tmdbService.getTopRatedMovies },
  { id: 'upcoming', title: 'Prochainement', fetch: tmdbService.getUpcomingMovies },
  { id: 'action', title: 'Films d\'Action', fetch: tmdbService.getActionMovies },
  { id: 'comedy', title: 'Comédies', fetch: tmdbService.getComedyMovies },
  { id: 'horror', title: 'Films d\'Horreur', fetch: tmdbService.getHorrorMovies },
];

const WINDOW_HEIGHT = Dimensions.get('window').height;
const VISIBLE_CATEGORIES_COUNT = 3;

// Composant de loader avec animation de pulsation
const PulseLoader = ({ color }) => {
  const pulseAnim = useRef(new Animated.Value(0.8)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 400,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);
  
  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <ActivityIndicator size="large" color={color} />
    </Animated.View>
  );
};

const HomeScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [moviesByCategory, setMoviesByCategory] = useState({});
  const [loadingCategories, setLoadingCategories] = useState(new Set([]));
  const [initialLoad, setInitialLoad] = useState(true);
  const flatListRef = useRef(null);
  const scrollPosition = useRef(0);
  const lastVisibleItems = useRef([]);
  
  // Références pour les animations
  const fadeAnims = useRef({});
  const slideAnims = useRef({});
  const scaleAnims = useRef({});
  
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 20,
    minimumViewTime: 300,
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
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnims.current[categoryId], {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims.current[categoryId], {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      })
    ]).start();
  };

  // Chargement initial uniquement de la première catégorie
  useEffect(() => {
    if (initialLoad) {
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
    if (flatListRef.current && scrollPosition.current > 0) {
      setTimeout(() => {
        flatListRef.current.scrollToOffset({ 
          offset: scrollPosition.current,
          animated: false
        });
      }, 50);
    }
  }, [moviesByCategory]);

  const onScroll = (event) => {
    scrollPosition.current = event.nativeEvent.contentOffset.y;
  };

  // Gérer les éléments visibles
  const onViewableItemsChanged = React.useCallback(({ viewableItems }) => {
    const visibleIds = viewableItems.map(item => item.item.id);
    lastVisibleItems.current = visibleIds;
    
    // Limiter aux VISIBLE_CATEGORIES_COUNT catégories
    const categoriesToLoad = visibleIds.slice(0, VISIBLE_CATEGORIES_COUNT);
    
    categoriesToLoad.forEach(id => {
      loadCategory(id);
    });
    
    // Décharger catégories non visibles (sauf 'popular')
    Object.keys(moviesByCategory).forEach(id => {
      if (id !== 'popular' && !visibleIds.includes(id) && 
          !loadingCategories.has(id)) {
        setMoviesByCategory(prev => {
          const newState = { ...prev };
          delete newState[id];
          return newState;
        });
      }
    });
  }, [moviesByCategory, loadingCategories]);

  const renderCategory = ({ item }) => {
    const isLoading = loadingCategories.has(item.id);
    const movies = moviesByCategory[item.id] || [];
    const isVisible = lastVisibleItems.current.includes(item.id);
    
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
    
    return (
      <Animated.View style={[styles.categoryContainer, animatedStyle]}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <PulseLoader color={theme.primary} />
          </View>
        ) : (
          <View style={styles.categoryContent}>
            {isVisible && movies.length > 0 ? (
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
    <FlatList
      ref={flatListRef}
      data={CATEGORIES}
      renderItem={renderCategory}
      keyExtractor={item => item.id}
      style={[styles.container, { backgroundColor: theme.background }]}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig.current}
      removeClippedSubviews={false}
      maxToRenderPerBatch={2}
      windowSize={5}
      initialNumToRender={1}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      maintainVisibleContentPosition={{ 
        minIndexForVisible: 0,
      }}
      ListEmptyComponent={renderEmptyList}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 10,
  },
  categoryContainer: {
    height: 290,
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  categoryContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 300,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 20,
    fontWeight: '600',
  },
});

export default HomeScreen;