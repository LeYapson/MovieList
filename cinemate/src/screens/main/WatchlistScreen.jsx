import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  RefreshControl, 
  TouchableOpacity, 
  Alert,
  Image,
  Animated,
  Dimensions,
  StatusBar,
  Easing
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getSessionId, isLoggedIn } from '../../services/storageService';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 48 = padding (16) * 2 + space between (16)

// MovieCard avec animations
const MovieCard = ({ movie, onPress, onLongPress, index, listType }) => {
  const { theme } = useTheme();
  const posterUrl = movie.poster_path 
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : 'https://via.placeholder.com/500x750?text=No+Image';

  // Animation pour l'apparition progressive
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Décalage de l'animation en fonction de l'index (effet cascade)
    const delay = index * 80;
    
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5))
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: true
      })
    ]).start();
  }, []);

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
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.8}
      >
        <Image 
          source={{ uri: posterUrl }}
          style={styles.poster}
          resizeMode="cover"
        />
        <View style={[styles.titleContainer, { backgroundColor: theme.card }]}>
          <Text 
            style={[styles.title, { color: theme.text }]}
            numberOfLines={2}
          >
            {movie.title}
          </Text>
          {movie.release_date && (
            <Text style={[styles.date, { color: theme.textSecondary }]}>
              {new Date(movie.release_date).getFullYear()}
            </Text>
          )}
        </View>
        
        {/* Badge indiquant le type de liste */}
        <View style={[
          styles.badgeContainer, 
          { backgroundColor: listType === 'watchlist' ? theme.primary : '#ff6b6b' }
        ]}>
          <Ionicons 
            name={listType === 'watchlist' ? 'bookmark' : 'heart'} 
            size={12} 
            color="#fff" 
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Composant pour les onglets (Watchlist/Favoris)
const TabSelector = ({ activeTab, onChangeTab }) => {
  const { theme } = useTheme();
  
  // Animation pour l'indicateur
  const translateX = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Animation de transition entre les onglets
    Animated.spring(translateX, {
      toValue: activeTab === 'watchlist' ? 0 : width / 2,
      useNativeDriver: true,
      friction: 20,
      tension: 120
    }).start();
  }, [activeTab]);

  return (
    <View style={[styles.tabContainer, { backgroundColor: theme.card }]}>
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => onChangeTab('watchlist')}
      >
        <Text style={[
          styles.tabText, 
          { color: activeTab === 'watchlist' ? theme.primary : theme.textSecondary }
        ]}>
          <Ionicons name="bookmark" size={16} /> À Voir
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => onChangeTab('favorites')}
      >
        <Text style={[
          styles.tabText, 
          { color: activeTab === 'favorites' ? theme.primary : theme.textSecondary }
        ]}>
          <Ionicons name="heart" size={16} /> Favoris
        </Text>
      </TouchableOpacity>
      
      {/* Indicateur animé */}
      <Animated.View 
        style={[
          styles.tabIndicator, 
          { 
            backgroundColor: theme.primary,
            transform: [{ translateX }],
            width: width / 2 - 16,
          }
        ]} 
      />
    </View>
  );
};

const CollectionScreen = ({ navigation }) => {
  // État pour gérer les onglets
  const [activeTab, setActiveTab] = useState('watchlist');
  
  // États pour les films
  const [watchlistMovies, setWatchlistMovies] = useState([]);
  const [favoriteMovies, setFavoriteMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // États pour la pagination
  const [watchlistPage, setWatchlistPage] = useState(1);
  const [favoritesPage, setFavoritesPage] = useState(1);
  const [hasMoreWatchlist, setHasMoreWatchlist] = useState(true);
  const [hasMoreFavorites, setHasMoreFavorites] = useState(true);
  
  // États pour l'authentification
  const [sessionId, setSessionId] = useState(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  
  // Animation pour l'en-tête
  const headerOpacity = useRef(new Animated.Value(0)).current;
  
  const { theme } = useTheme();
  
  // Vérifier si l'utilisateur est connecté et récupérer sa session
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const loggedIn = await isLoggedIn();
        setUserLoggedIn(loggedIn);
        
        if (loggedIn) {
          const storedSessionId = await getSessionId();
          console.log("Session ID récupéré:", storedSessionId);
          setSessionId(storedSessionId);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Erreur lors de la vérification du statut de connexion:", err);
        setLoading(false);
      }
    };
    
    checkLoginStatus();
    
    // Animation d'entrée pour l'en-tête
    Animated.timing(headerOpacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic)
    }).start();
  }, []);
  
  const fetchWatchlist = async (pageNumber = 1, refresh = false) => {
    if (!userLoggedIn || !sessionId) {
      setLoading(false);
      setError('Veuillez vous connecter pour voir votre liste de films à voir');
      return;
    }
    
    try {
      const tmdbService = require('../../services/tmdbService').default;
      const response = await tmdbService.getWatchlist(null, sessionId, pageNumber);
      
      if (refresh) {
        setWatchlistMovies(response.results || []);
      } else {
        setWatchlistMovies(prevMovies => [...prevMovies, ...(response.results || [])]);
      }
      
      setHasMoreWatchlist(response.page < response.total_pages);
      setWatchlistPage(response.page);
      setError(null);
    } catch (err) {
      setError('Impossible de charger votre liste de films');
      console.error('Watchlist error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const fetchFavorites = async (pageNumber = 1, refresh = false) => {
    if (!userLoggedIn || !sessionId) {
      setLoading(false);
      setError('Veuillez vous connecter pour voir vos films favoris');
      return;
    }
    
    try {
      const tmdbService = require('../../services/tmdbService').default;
      const response = await tmdbService.getFavoriteMovies(null, sessionId, pageNumber);
      
      if (refresh) {
        setFavoriteMovies(response.results || []);
      } else {
        setFavoriteMovies(prevMovies => [...prevMovies, ...(response.results || [])]);
      }
      
      setHasMoreFavorites(response.page < response.total_pages);
      setFavoritesPage(response.page);
      setError(null);
    } catch (err) {
      setError('Impossible de charger vos films favoris');
      console.error('Favorites error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    
    if (activeTab === 'watchlist') {
      setWatchlistPage(1);
      fetchWatchlist(1, true);
    } else {
      setFavoritesPage(1);
      fetchFavorites(1, true);
    }
  }, [sessionId, userLoggedIn, activeTab]);
  
  const loadMore = () => {
    if (loading) return;
    
    if (activeTab === 'watchlist' && hasMoreWatchlist) {
      fetchWatchlist(watchlistPage + 1);
    } else if (activeTab === 'favorites' && hasMoreFavorites) {
      fetchFavorites(favoritesPage + 1);
    }
  };
  
  const handleRemoveFromWatchlist = async (movieId) => {
    try {
      const tmdbService = require('../../services/tmdbService').default;
      await tmdbService.toggleWatchlist(null, sessionId, movieId, false);
      setWatchlistMovies(prevMovies => prevMovies.filter(movie => movie.id !== movieId));
      Alert.alert('Succès', 'Film retiré de votre liste');
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de retirer ce film de votre liste');
      console.error('Remove from watchlist error:', err);
    }
  };
  
  const handleRemoveFromFavorites = async (movieId) => {
    try {
      const tmdbService = require('../../services/tmdbService').default;
      await tmdbService.toggleFavorite(null, sessionId, movieId, false);
      setFavoriteMovies(prevMovies => prevMovies.filter(movie => movie.id !== movieId));
      Alert.alert('Succès', 'Film retiré de vos favoris');
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de retirer ce film de vos favoris');
      console.error('Remove from favorites error:', err);
    }
  };
  
  // Utiliser useFocusEffect pour recharger la liste chaque fois que l'écran est affiché
  useFocusEffect(
    useCallback(() => {
      if (sessionId) {
        setLoading(true);
        
        // Recharger les deux listes
        setWatchlistPage(1);
        setFavoritesPage(1);
        fetchWatchlist(1, true);
        fetchFavorites(1, true);
      }
      
      return () => {
        // Cleanup if needed
      };
    }, [sessionId, userLoggedIn])
  );
  
  const renderItem = ({ item, index }) => (
    <MovieCard 
      movie={item}
      index={index}
      listType={activeTab}
      onPress={() => navigation.navigate('MovieDetail', { movieId: item.id })}
      onLongPress={() => {
        if (activeTab === 'watchlist') {
          Alert.alert(
            'Options',
            'Que souhaitez-vous faire ?',
            [
              { 
                text: 'Retirer de ma liste', 
                onPress: () => handleRemoveFromWatchlist(item.id),
                style: 'destructive'
              },
              { text: 'Annuler', style: 'cancel' },
            ]
          );
        } else {
          Alert.alert(
            'Options',
            'Que souhaitez-vous faire ?',
            [
              { 
                text: 'Retirer des favoris', 
                onPress: () => handleRemoveFromFavorites(item.id),
                style: 'destructive'
              },
              { text: 'Annuler', style: 'cancel' },
            ]
          );
        }
      }}
    />
  );
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  if (!userLoggedIn) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
        <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Ma Collection
          </Text>
        </Animated.View>
        
        <View style={styles.emptyStateContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed" size={60} color={theme.primary} />
          </View>
          <Text style={[styles.emptyStateTitle, { color: theme.text }]}>
            Connexion requise
          </Text>
          <Text style={[styles.emptyStateMessage, { color: theme.textSecondary }]}>
            Veuillez vous connecter pour accéder à votre collection de films
          </Text>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.actionButtonText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      
      {/* En-tête animé */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Ma Collection
        </Text>
      </Animated.View>
      
      {/* Sélecteur d'onglets */}
      <TabSelector 
        activeTab={activeTab} 
        onChangeTab={handleTabChange} 
      />
      
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={60} color={theme.error || '#ff3b30'} />
          <Text style={[styles.errorText, { color: theme.error || '#ff3b30' }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: theme.primary }]} 
            onPress={onRefresh}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {!error && (
        <FlatList
          data={activeTab === 'watchlist' ? watchlistMovies : favoriteMovies}
          renderItem={renderItem}
          keyExtractor={(item) => `${activeTab}-${item.id}`}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
          ListFooterComponent={() => (
            loading && !refreshing ? (
              <ActivityIndicator 
                size="large" 
                color={theme.primary}
                style={styles.loader}
              />
            ) : null
          )}
          ListEmptyComponent={() => (
            !loading ? (
              <View style={styles.emptyStateContainer}>
                <View style={styles.iconContainer}>
                  <Ionicons 
                    name={activeTab === 'watchlist' ? 'bookmark-outline' : 'heart-outline'} 
                    size={60} 
                    color={theme.primary} 
                  />
                </View>
                <Text style={[styles.emptyStateTitle, { color: theme.text }]}>
                  {activeTab === 'watchlist' ? 'Votre liste est vide' : 'Aucun favori'}
                </Text>
                <Text style={[styles.emptyStateMessage, { color: theme.textSecondary }]}>
                  {activeTab === 'watchlist' 
                    ? 'Ajoutez des films à votre liste "À voir" pour les retrouver ici'
                    : 'Marquez des films comme favoris pour les retrouver ici'
                  }
                </Text>
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: theme.primary }]}
                  onPress={() => navigation.navigate('Home')}
                >
                  <Text style={styles.actionButtonText}>Explorer des films</Text>
                </TouchableOpacity>
              </View>
            ) : null
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50, // Pour compenser le statusBar
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 12,
    height: 48,
    position: 'relative',
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  tabText: {
    fontWeight: '600',
    fontSize: 15,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  movieCardContainer: {
    width: CARD_WIDTH,
    margin: 8,
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
    width: '100%',
    height: CARD_WIDTH * 1.5,
    borderRadius: 16,
  },
  titleContainer: {
    padding: 12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loader: {
    marginVertical: 16,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.8,
    lineHeight: 22,
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CollectionScreen;