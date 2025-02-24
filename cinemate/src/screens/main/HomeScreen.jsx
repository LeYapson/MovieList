// src/screens/main/HomeScreen.jsx
import React, { useState, useRef, useEffect } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
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

const HomeScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [moviesByCategory, setMoviesByCategory] = useState({});
  const [loadingCategories, setLoadingCategories] = useState(new Set(['popular']));
  const [visibleCategories, setVisibleCategories] = useState(new Set(['popular']));
  const flatListRef = useRef(null);
  const scrollPosition = useRef(0);
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 20,
    minimumViewTime: 300,
  });

  // Charger la catégorie populaire au démarrage
  useEffect(() => {
    loadCategory('popular');
  }, []);

  const loadCategory = async (categoryId) => {
    if (moviesByCategory[categoryId] || loadingCategories.has(categoryId)) return;

    try {
      setLoadingCategories(prev => new Set([...prev, categoryId]));
      const category = CATEGORIES.find(c => c.id === categoryId);
      const response = await category.fetch();
      
      // Enregistrer la position de défilement actuelle
      if (flatListRef.current) {
        flatListRef.current.getScrollOffset && flatListRef.current.getScrollOffset((offset) => {
          scrollPosition.current = offset;
        });
      }
      
      setMoviesByCategory(prev => ({
        ...prev,
        [categoryId]: response.results
      }));
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

  // Restaurer la position de défilement après le rendu
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
    // Sauvegarder la position de défilement actuelle
    scrollPosition.current = event.nativeEvent.contentOffset.y;
  };

  const onViewableItemsChanged = React.useCallback(({ viewableItems }) => {
    const newVisibleCategories = new Set(viewableItems.map(item => item.item.id));
    setVisibleCategories(newVisibleCategories);

    // Charger les catégories visibles
    viewableItems.forEach(({ item }) => {
      loadCategory(item.id);
    });

    // Ne pas décharger les catégories pour éviter les problèmes de recalcul de taille
    // La gestion de la mémoire peut être améliorée par d'autres moyens si nécessaire
  }, [moviesByCategory]);

  const renderCategory = ({ item }) => {
    const isLoading = loadingCategories.has(item.id);
    const movies = moviesByCategory[item.id] || [];
    const isVisible = visibleCategories.has(item.id);

    // Utiliser un placeholder avec une hauteur fixe pour maintenir la taille
    return (
      <View style={styles.categoryContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
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
              // Placeholder pour maintenir la taille
              <View style={styles.placeholderContainer} />
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <FlatList
      ref={flatListRef}
      data={CATEGORIES}
      renderItem={renderCategory}
      keyExtractor={item => item.id}
      style={[styles.container, { backgroundColor: theme.background }]}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig.current}
      removeClippedSubviews={false} // Changé à false pour éviter les problèmes de recalcul
      maxToRenderPerBatch={3}
      windowSize={5}
      initialNumToRender={2}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      maintainVisibleContentPosition={{ // Aide à maintenir la position de défilement
        minIndexForVisible: 0,
      }}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingVertical: -10,
    marginTop: -290
  },
  categoryContainer: {
    height: 290, // Hauteur fixe pour éviter les recalculs
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
});

export default HomeScreen;