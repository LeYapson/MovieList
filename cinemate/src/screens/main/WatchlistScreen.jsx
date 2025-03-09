import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  RefreshControl, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getSessionId, isLoggedIn } from '../../services/storageService';
import { ThemeContext } from '../../context/ThemeContext';
import MovieCard from '../../components/movies/MovieCard';
import { useContext } from 'react';

const WatchlistScreen = ({ navigation }) => {
  // Debug log
  console.log('Rendering WatchlistScreen');
  
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  
  const themeContext = useContext(ThemeContext);
  const theme = themeContext?.theme || { 
    backgroundColor: '#ffffff', 
    textColor: '#000000',
    primaryColor: '#0066cc',
    errorColor: '#ff3b30'
  };
  
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
        setMovies(response.results || []);
      } else {
        setMovies(prevMovies => [...prevMovies, ...(response.results || [])]);
      }
      
      setHasMore(response.page < response.total_pages);
      setPage(response.page);
      setError(null);
    } catch (err) {
      setError('Impossible de charger votre liste de films');
      console.error('Watchlist error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchWatchlist(1, true);
  }, [sessionId, userLoggedIn]);
  
  const loadMore = () => {
    if (!loading && hasMore) {
      fetchWatchlist(page + 1);
    }
  };
  
  const handleRemoveFromWatchlist = async (movieId) => {
    try {
      const tmdbService = require('../../services/tmdbService').default;
      await tmdbService.toggleWatchlist(null, sessionId, movieId, false);
      setMovies(prevMovies => prevMovies.filter(movie => movie.id !== movieId));
      Alert.alert('Succès', 'Film retiré de votre liste');
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de retirer ce film de votre liste');
      console.error('Remove from watchlist error:', err);
    }
  };
  
  // Utiliser useFocusEffect pour recharger la liste chaque fois que l'écran est affiché
  useFocusEffect(
    useCallback(() => {
      if (sessionId) {
        setLoading(true);
        setPage(1);
        fetchWatchlist(1, true);
      }
      
      return () => {
        // Cleanup if needed
      };
    }, [sessionId, userLoggedIn])
  );
  
  const renderItem = ({ item }) => (
    <MovieCard 
      movie={item}
      onPress={() => navigation.navigate('MovieDetail', { movieId: item.id })}
      onLongPress={() => {
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
      }}
    />
  );
  
  if (!userLoggedIn) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        <View style={styles.emptyStateContainer}>
          <Text style={[styles.emptyStateTitle, { color: theme.textColor }]}>Non connecté</Text>
          <Text style={[styles.emptyStateMessage, { color: theme.textColor }]}>
            Veuillez vous connecter pour voir votre liste de films à voir
          </Text>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.primaryColor }]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.actionButtonText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <Text style={[styles.title, { color: theme.textColor }]}>Ma liste de films à voir</Text>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.errorColor }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: theme.primaryColor }]} 
            onPress={onRefresh}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {!error && (
        <FlatList
          data={movies}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[theme.primaryColor]}
              tintColor={theme.primaryColor}
            />
          }
          ListFooterComponent={() => (
            loading && !refreshing ? (
              <ActivityIndicator 
                size="large" 
                color={theme.primaryColor}
                style={styles.loader}
              />
            ) : null
          )}
          ListEmptyComponent={() => (
            !loading ? (
              <View style={styles.emptyStateContainer}>
                <Text style={[styles.emptyStateTitle, { color: theme.textColor }]}>Liste vide</Text>
                <Text style={[styles.emptyStateMessage, { color: theme.textColor }]}>
                  Vous n'avez pas encore ajouté de films à votre liste
                </Text>
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: theme.primaryColor }]}
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
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 16,
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
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
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
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default WatchlistScreen;