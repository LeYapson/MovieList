// src/screens/main/MovieDetailScreen.jsx
// SOLUTION: Ouvrir YouTube directement (plus fiable depuis les changements YouTube de juillet 2025)
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  ScrollView, 
  Image, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity, 
  Modal, 
  Alert,
  Dimensions,
  Animated,
  Linking,
  Platform
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import tmdbService from '../../services/tmdbService';
import { getSessionId, isLoggedIn } from '../../services/storageService';
import * as ScreenOrientation from 'expo-screen-orientation';
import StreamingProviderItem from '../../components/movies/StreamingProviderItem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MovieDetailScreen = ({ route, navigation }) => {
  const { movieId } = route.params;
  const { theme } = useTheme();
  const [movie, setMovie] = useState(null);
  const [cast, setCast] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [trailerKey, setTrailerKey] = useState(null);
  const [trailerThumbnail, setTrailerThumbnail] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isWatchlist, setIsWatchlist] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [scrollStartOffset, setScrollStartOffset] = useState(0);
  const [providers, setProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  
  const scrollViewRef = useRef(null);
  const scrollOffsetY = useRef(0);

  // ========================================
  // OUVRIR YOUTUBE - Solution la plus fiable
  // ========================================
  const openTrailerInYouTube = async () => {
    if (!trailerKey) {
      Alert.alert('Trailer non disponible', 'Aucun trailer trouvé pour ce film.');
      return;
    }

    const youtubeAppUrl = Platform.select({
      ios: `youtube://watch?v=${trailerKey}`,
      android: `vnd.youtube:${trailerKey}`,
    });
    const youtubeWebUrl = `https://www.youtube.com/watch?v=${trailerKey}`;

    try {
      // Essayer d'ouvrir l'app YouTube
      const canOpenApp = await Linking.canOpenURL(youtubeAppUrl);
      if (canOpenApp) {
        console.log("Ouverture dans l'app YouTube");
        await Linking.openURL(youtubeAppUrl);
      } else {
        // Fallback vers le navigateur
        console.log("Ouverture dans le navigateur");
        await Linking.openURL(youtubeWebUrl);
      }
    } catch (error) {
      console.error("Erreur ouverture YouTube:", error);
      // Dernier fallback
      try {
        await Linking.openURL(youtubeWebUrl);
      } catch (e) {
        Alert.alert('Erreur', 'Impossible d\'ouvrir YouTube');
      }
    }
  };

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

  // Charger les détails du film
  useEffect(() => {
    loadMovieDetails();
    loadProviders();
    if (sessionId) {
      checkMovieStatus();
    }
  }, [movieId, sessionId]);

  const loadProviders = async () => {
    try {
      const watchProviders = await tmdbService.getMovieWatchProviders(movieId);
      const regionData = watchProviders.results?.FR || watchProviders.results?.US || {};
      
      const flatrateProviders = regionData.flatrate || [];
      const rentalProviders = regionData.rent || [];
      const buyProviders = regionData.buy || [];
      
      const allProviders = [
        ...flatrateProviders.map(p => ({...p, type: 'SVoD', link: regionData.link})),
        ...rentalProviders.map(p => ({...p, type: 'Location', link: regionData.link})),
        ...buyProviders.map(p => ({...p, type: 'Achat', link: regionData.link}))
      ];
      
      const uniqueProviders = [];
      const providerIds = new Set();
      
      allProviders.forEach(provider => {
        if (!providerIds.has(provider.provider_id)) {
          providerIds.add(provider.provider_id);
          uniqueProviders.push(provider);
        }
      });
      
      setProviders(uniqueProviders);
    } catch (error) {
      console.error("Erreur lors du chargement des plateformes:", error);
    } finally {
      setLoadingProviders(false);
    }
  };

  const loadMovieDetails = async () => {
    try {
      const [movieData, credits, videos] = await Promise.all([
        tmdbService.getMovieDetails(movieId),
        tmdbService.getMovieCredits(movieId),
        tmdbService.getMovieVideos(movieId)
      ]);
      setMovie(movieData);
      setCast(credits.cast.slice(0, 10));
      
      if (videos && videos.length > 0) {
        // Chercher un trailer YouTube
        let trailer = videos.find(video => 
          video.type === 'Trailer' && video.official === true && video.site === 'YouTube'
        );
        
        if (!trailer) {
          trailer = videos.find(video => video.type === 'Trailer' && video.site === 'YouTube');
        }
        
        if (!trailer) {
          trailer = videos.find(video => video.type === 'Clip' && video.site === 'YouTube');
        }
        
        if (!trailer) {
          trailer = videos.find(video => video.site === 'YouTube');
        }
        
        if (trailer) {
          console.log("Trailer trouvé:", trailer.name, "Key:", trailer.key);
          setTrailerKey(trailer.key);
          // Thumbnail YouTube
          setTrailerThumbnail(`https://img.youtube.com/vi/${trailer.key}/hqdefault.jpg`);
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Erreur lors du chargement des détails:", error);
      setIsLoading(false);
    }
  };

  const checkMovieStatus = async () => {
    if (!sessionId) return;
    
    try {
      const response = await tmdbService.getFavoriteMovies(null, sessionId);
      const favorites = response.results || [];
      setIsFavorite(favorites.some(movie => movie.id === movieId));
      
      const watchlistResponse = await tmdbService.getWatchlist(null, sessionId);
      const watchlist = watchlistResponse.results || [];
      setIsWatchlist(watchlist.some(movie => movie.id === movieId));
    } catch (error) {
      console.error('Erreur lors de la vérification du statut du film:', error);
    }
  };

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
        isFavorite ? 'Film retiré de vos favoris' : 'Film ajouté à vos favoris'
      );
    } catch (error) {
      console.error('Erreur lors de la modification des favoris:', error);
      Alert.alert('Erreur', 'Impossible de modifier vos favoris.');
    }
  };

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
        isWatchlist ? 'Film retiré de votre liste' : 'Film ajouté à votre liste'
      );
    } catch (error) {
      console.error('Erreur lors de la modification de la watchlist:', error);
      Alert.alert('Erreur', 'Impossible de modifier votre liste.');
    }
  };

  const handleScroll = (event) => {
    scrollOffsetY.current = event.nativeEvent.contentOffset.y;
  };

  const handleScrollBeginDrag = (event) => {
    setScrollStartOffset(event.nativeEvent.contentOffset.y);
  };

  const handleScrollEndDrag = (event) => {
    const currentOffsetY = event.nativeEvent.contentOffset.y;
    const scrollDistance = currentOffsetY - scrollStartOffset;
    
    // Swipe down au sommet = ouvrir trailer
    if (currentOffsetY <= 20 && scrollDistance < -30) {
      if (trailerKey) {
        openTrailerInYouTube();
      }
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
    <ScrollView 
      ref={scrollViewRef}
      style={[styles.container, { backgroundColor: theme.background }]}
      onScroll={handleScroll}
      onScrollBeginDrag={handleScrollBeginDrag}
      onScrollEndDrag={handleScrollEndDrag}
      scrollEventThrottle={16}
    >
      {/* Header avec bouton retour */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: theme.card }]}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>
      
      {/* Poster du film */}
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
          
          {/* Boutons favoris/watchlist */}
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

        {/* ========================================
            SECTION TRAILER - Carte cliquable
        ======================================== */}
        {trailerKey && (
          <TouchableOpacity 
            style={styles.trailerCard}
            onPress={openTrailerInYouTube}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: trailerThumbnail || `https://img.youtube.com/vi/${trailerKey}/hqdefault.jpg` }}
              style={styles.trailerThumbnail}
            />
            <View style={styles.trailerOverlay}>
              <View style={styles.playButtonCircle}>
                <Ionicons name="play" size={40} color="#fff" />
              </View>
              <Text style={styles.trailerText}>Regarder le trailer</Text>
              <View style={styles.youtubeTag}>
                <Ionicons name="logo-youtube" size={16} color="#fff" />
                <Text style={styles.youtubeTagText}>YouTube</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Hint swipe down */}
        {trailerKey && (
          <View style={styles.pullHintContainer}>
            <Ionicons name="arrow-down" size={16} color={theme.textSecondary} />
            <Text style={[styles.pullHintText, { color: theme.textSecondary }]}>
              ou tirez vers le bas pour lancer le trailer
            </Text>
          </View>
        )}

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
        
        {/* Plateformes de streaming */}
        {providers.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Disponible sur</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.providersScrollContainer}
              contentContainerStyle={styles.providersScrollContent}
            >
              {providers.map(provider => (
                <StreamingProviderItem 
                  key={provider.provider_id}
                  provider={provider}
                  movieTitle={movie.title}
                  theme={theme}
                />
              ))}
            </ScrollView>
          </>
        )}

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
    marginBottom: 16,
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
  // ========================================
  // STYLES TRAILER CARD
  // ========================================
  trailerCard: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#000',
  },
  trailerThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  trailerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    // Ombre
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  trailerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  youtubeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,0,0,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  youtubeTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  pullHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    opacity: 0.6,
  },
  pullHintText: {
    marginLeft: 6,
    fontSize: 12,
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
  providersScrollContainer: {
    marginBottom: 20,
  },
  providersScrollContent: {
    paddingRight: 20,
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
});

export default MovieDetailScreen;