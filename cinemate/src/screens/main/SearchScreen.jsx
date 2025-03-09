import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  FlatList, 
  Text, 
  TouchableOpacity, 
  ScrollView,
  Keyboard,
  ActivityIndicator,
  Animated,
  Dimensions,
  StatusBar,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import tmdbService from '../../services/tmdbService';
import { debounce } from 'lodash';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 48 = padding (16) * 2 + space between (16)

// Composant de carte de film intégré directement (pour éviter les problèmes d'import)
const InlineMovieCard = ({ movie, onPress }) => {
  const { theme } = useTheme();
  const posterUrl = movie.poster_path 
    ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
    : 'https://via.placeholder.com/342x513?text=No+Image';

  return (
    <TouchableOpacity 
      style={[styles.movieCard, { backgroundColor: theme.card }]}
      onPress={() => onPress(movie.id)}
      activeOpacity={0.7}
    >
      <Image 
        source={{ uri: posterUrl }}
        style={styles.poster}
        resizeMode="cover"
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
  );
};

// Composant pour les filtres (genres) - memoizé
const GenreFilter = React.memo(({ genres, selectedGenres, onToggleGenre, theme }) => {
  const scrollViewRef = useRef();
  
  // Animation d'entrée
  const translateY = useRef(new Animated.Value(50)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  }, []);
  
  // useMemo pour éviter des recalculs
  const renderGenres = useMemo(() => {
    return genres.map(genre => (
      <TouchableOpacity
        key={genre.id}
        style={[
          styles.genreChip,
          selectedGenres.includes(genre.id) 
            ? { backgroundColor: theme.primary } 
            : { backgroundColor: theme.card }
        ]}
        onPress={() => onToggleGenre(genre.id)}
      >
        <Text 
          style={[
            styles.genreText, 
            { color: selectedGenres.includes(genre.id) ? '#fff' : theme.text }
          ]}
        >
          {genre.name}
        </Text>
      </TouchableOpacity>
    ));
  }, [genres, selectedGenres, theme, onToggleGenre]);
  
  return (
    <Animated.View 
      style={[
        styles.genreFilterContainer, 
        { 
          opacity, 
          transform: [{ translateY }] 
        }
      ]}
    >
      <ScrollView 
        ref={scrollViewRef}
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.genreScrollContent}
      >
        {renderGenres}
      </ScrollView>
    </Animated.View>
  );
});

// Composant pour les options de tri - memoizé
const SortOptions = React.memo(({ currentSort, onSortChange, theme }) => {
  const sortOptions = [
    { id: 'popularity.desc', label: 'Popularité', icon: 'flame' },
    { id: 'vote_average.desc', label: 'Note', icon: 'star' },
    { id: 'release_date.desc', label: 'Date', icon: 'calendar' },
  ];
  
  // Utiliser useMemo pour éviter les re-renders inutiles
  const sortButtons = useMemo(() => {
    return sortOptions.map(option => (
      <TouchableOpacity
        key={option.id}
        style={[
          styles.sortOption,
          currentSort === option.id 
            ? { backgroundColor: theme.primary } 
            : { backgroundColor: theme.card }
        ]}
        onPress={() => onSortChange(option.id)}
      >
        <Ionicons 
          name={option.icon} 
          size={16} 
          color={currentSort === option.id ? '#fff' : theme.text} 
        />
        <Text 
          style={[
            styles.sortLabel, 
            { color: currentSort === option.id ? '#fff' : theme.text }
          ]}
        >
          {option.label}
        </Text>
      </TouchableOpacity>
    ));
  }, [currentSort, theme, onSortChange]);
  
  return (
    <View style={styles.sortContainer}>
      {sortButtons}
    </View>
  );
});

// Liste statique des genres courants pour TMDB
const GENRES = [
  { id: 28, name: "Action" },
  { id: 12, name: "Aventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comédie" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentaire" },
  { id: 18, name: "Drame" },
  { id: 10751, name: "Famille" },
  { id: 14, name: "Fantastique" },
  { id: 36, name: "Histoire" },
  { id: 27, name: "Horreur" },
  { id: 10402, name: "Musique" },
  { id: 9648, name: "Mystère" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science-Fiction" },
  { id: 10770, name: "Téléfilm" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "Guerre" },
  { id: 37, name: "Western" }
];

// Composant principal
const SearchScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [currentSort, setCurrentSort] = useState('popularity.desc');
  
  // État pour savoir si c'est une recherche par texte ou une découverte par filtres
  const [searchMode, setSearchMode] = useState('text'); // 'text' ou 'discover'
  
  // Animation pour les filtres
  const filtersHeight = useRef(new Animated.Value(0)).current;
  const filtersOpacity = useRef(new Animated.Value(0)).current;
  
  // Animation pour le FAB
  const fabScale = useRef(new Animated.Value(1)).current;
  
  // Référence pour le texte de recherche
  const searchInputRef = useRef();
  
  // FlatList ref pour les optimisations
  const flatListRef = useRef();
  
  // Indicateur de premier rendu
  const isFirstRender = useRef(true);

  // Charger les films populaires au démarrage
  useEffect(() => {
    const fetchPopularMovies = async () => {
      try {
        const response = await tmdbService.getPopularMovies();
        setResults(response.results || []);
      } catch (error) {
        console.error('Error fetching popular movies:', error);
      }
    };
    
    if (isFirstRender.current) {
      fetchPopularMovies();
      isFirstRender.current = false;
    }
  }, []);

  // Fonction debounce pour la recherche - définie avec useCallback
  const performSearch = useCallback(
    debounce(async (text, genreIds = [], sortBy = 'popularity.desc', searchType = 'text') => {
      if (!text && searchType === 'text') {
        // Si aucun texte et mode recherche, charger les films populaires
        try {
          const response = await tmdbService.getPopularMovies();
          setResults(response.results || []);
          setTotalPages(response.total_pages || 1);
          setPage(1);
        } catch (error) {
          console.error('Error fetching popular movies:', error);
        }
        return;
      }
      
      setLoading(true);
      
      try {
        let response;
        
        if (searchType === 'text') {
          // Recherche classique par texte
          response = await tmdbService.searchMovies(text, 1);
        } else {
          // Pour la découverte, adapter aux endpoints disponibles
          if (genreIds.length > 0) {
            // Si au moins un genre sélectionné
            const genreId = genreIds[0]; // Premier genre comme exemple
            
            if (genreId === 28) { // Action
              response = await tmdbService.getActionMovies();
            } else if (genreId === 35) { // Comédie
              response = await tmdbService.getComedyMovies();
            } else if (genreId === 27) { // Horreur
              response = await tmdbService.getHorrorMovies();
            } else {
              // Pour les autres genres, films populaires
              response = await tmdbService.getPopularMovies();
            }
          } else {
            // Si aucun genre, films populaires
            response = await tmdbService.getPopularMovies();
          }
        }
        
        setResults(response.results || []);
        setTotalPages(response.total_pages || 1);
        setPage(1);
      } catch (error) {
        console.error('Error searching movies:', error);
      } finally {
        setLoading(false);
      }
    }, 500),
    [] // Dépendances vides car tout est passé en paramètres
  );

  // Effectuer la recherche quand les filtres ou le texte changent
  useEffect(() => {
    if (searchMode === 'text') {
      performSearch(searchQuery, [], currentSort, 'text');
    } else {
      performSearch('', selectedGenres, currentSort, 'discover');
    }
  }, [searchQuery, selectedGenres, currentSort, searchMode, performSearch]);

  // Charger plus de résultats - défini avec useCallback
  const loadMoreResults = useCallback(async () => {
    if (loading || page >= totalPages) return;
    
    setLoading(true);
    
    try {
      if (searchMode === 'text' && searchQuery) {
        const response = await tmdbService.searchMovies(searchQuery, page + 1);
        
        if (response && response.results) {
          setResults(prev => [...prev, ...response.results]);
          setPage(page + 1);
        }
      } else {
        // Simplification pour la pagination des découvertes
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading more results:', error);
    } finally {
      setLoading(false);
    }
  }, [loading, page, totalPages, searchMode, searchQuery]);

  // Gestion du toggle d'un genre - défini avec useCallback
  const handleToggleGenre = useCallback((genreId) => {
    setSelectedGenres(prev => {
      if (prev.includes(genreId)) {
        return prev.filter(id => id !== genreId);
      } else {
        return [...prev, genreId];
      }
    });
  }, []);

  // Animer le FAB - défini avec useCallback
  const animateFab = useCallback(() => {
    // Séquence d'animation pour effet de "bounce"
    Animated.sequence([
      Animated.timing(fabScale, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(fabScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, [fabScale]);

  // Changer le mode de recherche - défini avec useCallback
  const toggleSearchMode = useCallback(() => {
    // Animer le FAB
    animateFab();
    
    // Fermer le clavier
    Keyboard.dismiss();
    
    if (searchMode === 'text') {
      // Passer en mode découverte
      setSearchMode('discover');
      setSearchQuery('');
      
      // Animer le changement d'UI
      Animated.parallel([
        Animated.timing(filtersHeight, {
          toValue: 120,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(filtersOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: false,
        })
      ]).start();
    } else {
      // Revenir en mode recherche par texte
      setSearchMode('text');
      setSelectedGenres([]);
      
      // Animer le changement d'UI
      Animated.parallel([
        Animated.timing(filtersHeight, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(filtersOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        })
      ]).start(() => {
        // Focus sur la barre de recherche après l'animation
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      });
    }
  }, [searchMode, animateFab, filtersHeight, filtersOpacity]);

  // Effacer la recherche - défini avec useCallback
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Navigation vers le détail du film - défini avec useCallback
  const navigateToMovieDetail = useCallback((movieId) => {
    navigation.navigate('MovieDetail', { movieId });
  }, [navigation]);
  
  // Optimiser le rendu des items avec useCallback
  const renderMovieItem = useCallback(({ item }) => {
    return (
      <View style={styles.movieCardContainer}>
        <InlineMovieCard movie={item} onPress={navigateToMovieDetail} />
      </View>
    );
  }, [navigateToMovieDetail]);

  // Extraire la clé de façon optimisée
  const keyExtractor = useCallback((item) => `movie-${item.id}`, []);

  // Rendu du footer de la liste - memoizé
  const ListFooterComponent = useMemo(() => {
    if (loading && results.length > 0) {
      return (
        <ActivityIndicator 
          size="small" 
          color={theme.primary} 
          style={styles.paginationLoader}
        />
      );
    }
    return null;
  }, [loading, results.length, theme.primary]);

  // Rendu de l'état vide - memoizé
  const EmptyComponent = useMemo(() => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyStateContainer}>
        <Ionicons 
          name={searchMode === 'text' ? 'search' : 'options'} 
          size={60} 
          color={theme.primary} 
        />
        <Text style={[styles.emptyStateTitle, { color: theme.text }]}>
          {searchMode === 'text' 
            ? 'Aucun résultat trouvé'
            : 'Définissez des filtres pour découvrir des films'
          }
        </Text>
        <Text style={[styles.emptyStateMessage, { color: theme.textSecondary }]}>
          {searchMode === 'text'
            ? 'Essayez avec d\'autres termes de recherche'
            : 'Sélectionnez des genres pour affiner votre recherche'
          }
        </Text>
      </View>
    );
  }, [loading, searchMode, theme]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header avec barre de recherche */}
        <View style={styles.header}>
          <View style={styles.searchContainer}>
            <View style={[
              styles.inputWrapper, 
              { backgroundColor: theme.card }
            ]}>
              <Ionicons name="search" size={22} color={theme.textSecondary} style={styles.searchIcon} />
              <TextInput
                ref={searchInputRef}
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Rechercher un film..."
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {/* Section des filtres avancés (animée) */}
          <Animated.View 
            style={[
              styles.filtersSection,
              {
                height: filtersHeight,
                opacity: filtersOpacity,
                overflow: 'hidden',
              }
            ]}
          >
            <GenreFilter 
              genres={GENRES} 
              selectedGenres={selectedGenres} 
              onToggleGenre={handleToggleGenre}
              theme={theme}
            />
            
            <SortOptions 
              currentSort={currentSort} 
              onSortChange={setCurrentSort}
              theme={theme}
            />
          </Animated.View>
        </View>
        
        {/* Titre de la section */}
        <View style={styles.resultHeader}>
          <Text style={[styles.resultTitle, { color: theme.text }]}>
            {searchMode === 'text' 
              ? (searchQuery ? `Recherche: "${searchQuery}"` : 'Films populaires')
              : 'Découverte par filtres'
            }
          </Text>
          {results.length > 0 && (
            <Text style={[styles.resultCount, { color: theme.textSecondary }]}>
              {results.length} résultats
            </Text>
          )}
        </View>
        
        {/* Liste des résultats */}
        {loading && results.length === 0 ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={results}
            renderItem={renderMovieItem}
            keyExtractor={keyExtractor}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.resultsContainer}
            onEndReached={loadMoreResults}
            onEndReachedThreshold={0.5}
            ListFooterComponent={ListFooterComponent}
            ListEmptyComponent={EmptyComponent}
            
            // Optimisations de performance
            removeClippedSubviews={true}
            maxToRenderPerBatch={8}
            updateCellsBatchingPeriod={50}
            windowSize={10}
            initialNumToRender={10}
          />
        )}
        
        {/* Bouton flottant (FAB) pour les filtres */}
        <Animated.View 
          style={[
            styles.fabContainer,
            { transform: [{ scale: fabScale }] }
          ]}
        >
          <TouchableOpacity 
            style={[
              styles.fab, 
              { 
                backgroundColor: searchMode === 'discover' ? theme.primary : '#fff',
                borderColor: theme.primary,
                borderWidth: searchMode === 'discover' ? 0 : 1,
              }
            ]}
            onPress={toggleSearchMode}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={searchMode === 'discover' ? 'search' : 'options'} 
              size={24} 
              color={searchMode === 'discover' ? '#fff' : theme.primary} 
            />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 12,
    flex: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
  },
  clearButton: {
    padding: 6,
  },
  filtersSection: {
    marginTop: 12,
  },
  genreFilterContainer: {
    marginBottom: 12,
  },
  genreScrollContent: {
    paddingVertical: 8,
  },
  genreChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  genreText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultCount: {
    fontSize: 14,
  },
  resultsContainer: {
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationLoader: {
    marginVertical: 16,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 300,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 16,
    textAlign: 'center',
    maxWidth: '80%',
    lineHeight: 22,
  },
  // Styles pour les cartes de films
  movieCardContainer: {
    width: '50%',
    padding: 8,
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
    aspectRatio: 2/3,
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
  // Styles pour le FAB
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    alignItems: 'center',
    zIndex: 100,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  }
});

export default SearchScreen;