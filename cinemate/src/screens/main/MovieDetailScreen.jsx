import React, { useState, useEffect } from 'react';
import { View, ScrollView, Image, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Modal, Button } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import tmdbService from '../../services/tmdbService';
import { WebView } from 'react-native-webview';import { getSessionId, isLoggedIn } from '../../services/storageService';

const MovieDetailScreen = ({ route, navigation }) => {
  const { movieId } = route.params;
  const { theme } = useTheme();
  const [movie, setMovie] = useState(null);
  const [cast, setCast] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [trailerUrl, setTrailerUrl] = useState(null);
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isWatchlist, setIsWatchlist] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);

  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const loggedIn = await isLoggedIn();
        setUserLoggedIn(loggedIn);
        
        if (loggedIn) {
          const storedSessionId = await getSessionId();
          setSessionId(storedSessionId);
        }
      } catch (err) {
        console.error("Erreur lors de la vérification du statut de connexion:", err);
      }
    };
    
    checkLoginStatus();
  }, []);

  // Charger les détails du film et vérifier s'il est en favori
  useEffect(() => {
    loadMovieDetails();
    if (sessionId) {
      checkMovieStatus();
    }
  }, [movieId, sessionId]);

  const loadMovieDetails = async () => {
    try {
      const [movieData, credits, videos] = await Promise.all([
        tmdbService.getMovieDetails(movieId),
        tmdbService.getMovieCredits(movieId),
        tmdbService.getMovieVideos(movieId)
      ]);
      setMovie(movieData);
      setCast(credits.cast.slice(0, 10)); // Les 10 premiers acteurs
      const trailer = videos.find(video => video.type === 'Trailer');
      if (trailer) {
        setTrailerUrl(`https://www.youtube.com/embed/${trailer.key}`);
      }
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  const handlePlayTrailer = () => {
    if (trailerUrl) {
      setShowTrailerModal(true);
    } else {
      Alert.alert('Trailer non disponible', 'Aucun trailer trouvé pour ce film.');
    }
  };

  // Vérifier si le film est en favori ou dans la watchlist
  const checkMovieStatus = async () => {
    if (!sessionId) return;
    
    try {
      // Récupérer la liste des favoris
      const response = await tmdbService.getFavoriteMovies(null, sessionId);
      const favorites = response.results || [];
      setIsFavorite(favorites.some(movie => movie.id === movieId));
      
      // Récupérer la watchlist
      const watchlistResponse = await tmdbService.getWatchlist(null, sessionId);
      const watchlist = watchlistResponse.results || [];
      setIsWatchlist(watchlist.some(movie => movie.id === movieId));
    } catch (error) {
      console.error('Erreur lors de la vérification du statut du film:', error);
    }
  };

  // Gérer l'ajout/suppression des favoris
  const handleToggleFavorite = async () => {
    if (!userLoggedIn) {
      Alert.alert('Connexion requise', 'Veuillez vous connecter pour ajouter ce film à vos favoris.', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se connecter', onPress: () => navigation.navigate('Login') }
      ]);
      return;
    }

    try {
      await tmdbService.toggleFavorite(null, sessionId, movieId, !isFavorite);
      setIsFavorite(!isFavorite);
      
      Alert.alert(
        'Succès', 
        isFavorite 
          ? 'Film retiré de vos favoris' 
          : 'Film ajouté à vos favoris'
      );
    } catch (error) {
      console.error('Erreur lors de la modification des favoris:', error);
      Alert.alert('Erreur', 'Impossible de modifier vos favoris.');
    }
  };

  // Gérer l'ajout/suppression de la watchlist
  const handleToggleWatchlist = async () => {
    if (!userLoggedIn) {
      Alert.alert('Connexion requise', 'Veuillez vous connecter pour ajouter ce film à votre liste.', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se connecter', onPress: () => navigation.navigate('Login') }
      ]);
      return;
    }

    try {
      await tmdbService.toggleWatchlist(null, sessionId, movieId, !isWatchlist);
      setIsWatchlist(!isWatchlist);
      
      Alert.alert(
        'Succès', 
        isWatchlist 
          ? 'Film retiré de votre liste' 
          : 'Film ajouté à votre liste'
      );
    } catch (error) {
      console.error('Erreur lors de la modification de la watchlist:', error);
      Alert.alert('Erreur', 'Impossible de modifier votre liste.');
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
        <Image
          source={{ uri: `https://image.tmdb.org/t/p/w500${movie.poster_path}` }}
          style={styles.poster}
        />
      <View style={styles.infoContainer}>
        {/* Titre et année */}
        <View style={styles.titleContainer}>
          <View style={styles.titleWrapper}>
            <Text style={[styles.title, { color: theme.text }]}>{movie.title}</Text>
            <Text style={[styles.year, { color: theme.textSecondary }]}>
              {new Date(movie.release_date).getFullYear()}
            </Text>
          </View>
          
          {/* Boutons d'action */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              onPress={handleToggleFavorite}
              style={[styles.actionButton, { backgroundColor: theme.card }]}
            >
              <Ionicons 
                name={isFavorite ? "heart" : "heart-outline"} 
                size={24} 
                color={isFavorite ? "#FF6B6B" : theme.text} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleToggleWatchlist}
              style={[styles.actionButton, { backgroundColor: theme.card }]}
            >
              <Ionicons 
                name={isWatchlist ? "bookmark" : "bookmark-outline"} 
                size={24} 
                color={isWatchlist ? theme.primary : theme.text} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Genres */}
        <View style={styles.genresContainer}>
          {movie.genres && movie.genres.map(genre => (
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

        {/* Play Trailer */}
        <TouchableOpacity
          style={{ backgroundColor: theme.primary, padding: 12, borderRadius: 8, alignItems: 'center' }}
          onPress={handlePlayTrailer}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Jouer le Trailer</Text>
        </TouchableOpacity>

        {/* Distribution */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Distribution</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {cast.map(actor => (
            <TouchableOpacity
              key={actor.id}
              style={styles.actorCard}
              onPress={() => navigation.navigate('ActorDetail', { actorId: actor.id })}
            >
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
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Trailer Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showTrailerModal}
        onRequestClose={() => setShowTrailerModal(false)}
      >
        <View style={styles.modalContainer}>
          <WebView
            source={{ uri: trailerUrl }}
            style={{ flex: 1 }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
          <Button title="Fermer" onPress={() => setShowTrailerModal(false)} />
        </View>
      </Modal>
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
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleWrapper: {
    flex: 1,
    marginRight: 10,
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
});

export default MovieDetailScreen;
