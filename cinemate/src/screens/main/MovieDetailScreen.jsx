// src/screens/main/MovieDetailScreen.jsx
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
  Button, 
  Alert,
  NativeModules,
  Dimensions,
  Animated
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import tmdbService from '../../services/tmdbService';
import { WebView } from 'react-native-webview';
import { getSessionId, isLoggedIn } from '../../services/storageService';
import * as ScreenOrientation from 'expo-screen-orientation';
import StreamingProviderItem from '../../components/movies/StreamingProviderItem';

const { UIManager } = NativeModules;

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
  const [isPaisajeMode, setIsPaisajeMode] = useState(false);
  const [scrollStartOffset, setScrollStartOffset] = useState(0);
  const [providers, setProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [showPosterOverlay, setShowPosterOverlay] = useState(false);
  
  // Animations
  const fadeAnimation = useRef(new Animated.Value(1)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  
  const scrollViewRef = useRef(null);
  const scrollOffsetY = useRef(0);
  const isAtTopOfPage = useRef(true);
  const lastPullTriggeredTime = useRef(0);
  const lastTrailerTriggerTime = useRef(0);
  const posterAnimTimeout = useRef(null);
  const trailerLoadTimeout = useRef(null);

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
    loadProviders();
    if (sessionId) {
      checkMovieStatus();
    }
  }, [movieId, sessionId]);

  // Rétablir l'orientation par défaut lors du démontage du composant
  useEffect(() => {
    return () => {
      // Remettre en mode portrait lorsqu'on quitte l'écran
      setOrientationPortrait();
      
      // Nettoyer les timeouts
      if (posterAnimTimeout.current) {
        clearTimeout(posterAnimTimeout.current);
      }
      if (trailerLoadTimeout.current) {
        clearTimeout(trailerLoadTimeout.current);
      }
    };
  }, []);

  // Ajoutez ou remplacez cette fonction dans MovieDetailScreen.jsx
  const loadProviders = async () => {
    try {
      const watchProviders = await tmdbService.getMovieWatchProviders(movieId);
      console.log(`Données de providers pour le film ${movieId}:`, watchProviders);
      
      // Utiliser la région FR ou à défaut US
      const regionData = watchProviders.results?.FR || watchProviders.results?.US || {};
      
      // Log la page JustWatch si disponible
      if (regionData.link) {
        console.log("Lien JustWatch:", regionData.link);
      }
      
      // Récupérer les plateformes flatrate (SVoD)
      const flatrateProviders = regionData.flatrate || [];
      // Récupérer les plateformes de location
      const rentalProviders = regionData.rent || [];
      // Récupérer les plateformes d'achat
      const buyProviders = regionData.buy || [];
      
      // Combinaison de toutes les plateformes en ajoutant un type et le lien JustWatch
      const allProviders = [
        ...flatrateProviders.map(p => ({...p, type: 'SVoD', link: regionData.link})),
        ...rentalProviders.map(p => ({...p, type: 'Location', link: regionData.link})),
        ...buyProviders.map(p => ({...p, type: 'Achat', link: regionData.link}))
      ];
      
      // Éliminer les doublons (une plateforme peut être disponible en SVoD et en achat)
      // En gardant la priorité: SVoD > Location > Achat
      const uniqueProviders = [];
      const providerIds = new Set();
      
      allProviders.forEach(provider => {
        if (!providerIds.has(provider.provider_id)) {
          providerIds.add(provider.provider_id);
          uniqueProviders.push(provider);
        }
      });
      
      // Vérifier si nous avons trouvé des providers spécifiques
      if (uniqueProviders.length > 0) {
        console.log(`${uniqueProviders.length} services de streaming trouvés:`, 
          uniqueProviders.map(p => p.provider_name).join(', '));
      } else {
        console.log("Aucun service de streaming trouvé pour ce film");
      }
      
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
      setCast(credits.cast.slice(0, 10)); // Les 10 premiers acteurs
      
      // Traitement des vidéos
      if (videos && videos.length > 0) {
        // Chercher d'abord un trailer officiel
        let trailer = videos.find(video => 
          video.type === 'Trailer' && video.official === true
        );
        
        // Si aucun trailer officiel n'est trouvé, prendre n'importe quel trailer
        if (!trailer) {
          trailer = videos.find(video => video.type === 'Trailer');
        }
        
        // Si toujours rien, prendre n'importe quelle vidéo de type Clip
        if (!trailer) {
          trailer = videos.find(video => video.type === 'Clip');
        }
        
        // En dernier recours, prendre la première vidéo YouTube
        if (!trailer) {
          trailer = videos.find(video => video.site === 'YouTube');
        }
        
        if (trailer) {
          console.log("Trailer trouvé:", trailer.name, "Key:", trailer.key);
          // Paramètres YouTube améliorés pour qualité maximale et plein écran:
          // autoplay=1: lecture auto
          // fs=1: bouton plein écran
          // modestbranding=1: branding minimal
          // rel=0: pas de vidéos suggérées
          // showinfo=0: masque les infos vidéo
          // vq=hd1080: force qualité HD 1080p
          // cc_load_policy=0: désactive sous-titres par défaut
          // iv_load_policy=3: masque annotations
          setTrailerUrl(`https://www.youtube.com/embed/${trailer.key}?autoplay=1&fs=1&modestbranding=1&rel=0&showinfo=0&vq=hd1080&cc_load_policy=0&iv_load_policy=3`);
        } else {
          console.log("Aucun trailer disponible pour ce film malgré les vidéos disponibles");
        }
      } else {
        console.log("Aucune vidéo disponible pour ce film");
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Erreur lors du chargement des détails:", error);
      setIsLoading(false);
    }
  };

  const setOrientationLandscape = async () => {
    try {
      setIsPaisajeMode(true);
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    } catch (error) {
      console.error("Erreur lors du passage en mode paysage:", error);
    }
  };

  const setOrientationPortrait = async () => {
    try {
      setIsPaisajeMode(false);
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
    } catch (error) {
      console.error("Erreur lors du passage en mode portrait:", error);
    }
  };

  const handlePlayTrailer = async () => {
    // Vérifier si un trailer a été récemment lancé
    const now = Date.now();
    if (now - lastTrailerTriggerTime.current < 2000) {
      console.log("Ignoré - Trailer déjà déclenché récemment");
      return;
    }
    
    if (trailerUrl) {
      console.log("Lancement du trailer avec animation améliorée:", trailerUrl);
      lastTrailerTriggerTime.current = now;
      
      // Réinitialiser les animations
      fadeAnimation.setValue(1);
      scaleAnimation.setValue(1);
      
      try {
        // Afficher l'overlay avec le poster
        setShowPosterOverlay(true);
        await setOrientationLandscape();
        
        // Animation améliorée et plus visible
        Animated.sequence([
          // D'abord un petit zoom out
          Animated.timing(scaleAnimation, {
            toValue: 0.9,
            duration: 200,
            useNativeDriver: true,
          }),
          // Ensuite un zoom in plus marqué
          Animated.timing(scaleAnimation, {
            toValue: 1.4,
            duration: 400,
            useNativeDriver: true,
          })
        ]).start();
        
        // Planifier le fondu et l'affichage du trailer
        setTimeout(() => {
          Animated.timing(fadeAnimation, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start();
          
          // S'assurer que la transition vers le trailer se produit
          setTimeout(() => {
            console.log("Affichage du modal trailer...");
            setShowPosterOverlay(false);
            setShowTrailerModal(true);
          }, 350); // Attendre juste après la fin du fade
        }, 600);
      } catch (error) {
        console.error("Erreur lors de l'animation:", error);
        // Fallback en cas d'erreur - afficher directement le trailer
        setShowPosterOverlay(false);
        setShowTrailerModal(true);
      }
    } else {
      Alert.alert('Trailer non disponible', 'Aucun trailer trouvé pour ce film.');
    }
  };

  const handleCloseTrailer = async () => {
    console.log("Fermeture du trailer");
    setShowTrailerModal(false);
    
    // Attendre un court instant pour éviter les problèmes de transition
    setTimeout(async () => {
      try {
        await setOrientationPortrait();
        console.log("Orientation remise en portrait");
      } catch (error) {
        console.error("Erreur lors du retour en mode portrait:", error);
      }
    }, 100);
    
    // Nettoyer les timeouts
    if (posterAnimTimeout.current) {
      clearTimeout(posterAnimTimeout.current);
    }
    if (trailerLoadTimeout.current) {
      clearTimeout(trailerLoadTimeout.current);
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

  // Fonction pour suivre la position de défilement
  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    scrollOffsetY.current = offsetY;
    
    // Déterminer si on est au sommet de la page
    isAtTopOfPage.current = offsetY <= 0;
  };

  // Fonction appelée au début du scroll
  const handleScrollBeginDrag = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setScrollStartOffset(offsetY);
    console.log("Début du scroll à l'offset Y:", offsetY);
  };

  // Fonction appelée lors du relâchement du scroll - version plus sensible
  const handleScrollEndDrag = (event) => {
    const currentOffsetY = event.nativeEvent.contentOffset.y;
    const scrollDistance = currentOffsetY - scrollStartOffset;
    
    console.log("Fin du scroll - distance:", scrollDistance, "départ:", scrollStartOffset, "fin:", currentOffsetY);
    
    // Détection plus sensible - seuil de distance réduit à -20 au lieu de -50
    // Et acceptation de toute position jusqu'à 20px du haut
    if (currentOffsetY <= 20 && scrollDistance < -20) {
      console.log("Swipe down détecté au sommet - lancement du trailer");
      if (trailerUrl) {
        // Ajouter un petit délai pour éviter les problèmes d'interaction
        setTimeout(() => {
          handlePlayTrailer();
        }, 100);
      } else {
        Alert.alert('Trailer non disponible', 'Aucun trailer trouvé pour ce film.');
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
    <>
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

          {/* Indice de tirage pour lancer le trailer */}
          <View style={styles.pullHintContainer}>
            <Ionicons name="arrow-down" size={20} color={theme.textSecondary} />
            <Text style={[styles.pullHintText, { color: theme.textSecondary }]}>
              Tirez vers le bas pour lancer le trailer
            </Text>
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
          
          {/* Plateformes de streaming (scrollable) */}
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

          {/* Play Trailer */}
          <TouchableOpacity
            style={[styles.trailerButton, { backgroundColor: theme.primary }]}
            onPress={handlePlayTrailer}
          >
            <Ionicons name="play-circle-outline" size={20} color="#fff" style={styles.trailerIcon} />
            <Text style={styles.trailerButtonText}>Jouer le Trailer</Text>
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
      </ScrollView>

      {/* Overlay pour l'animation du poster en plein écran */}
      {showPosterOverlay && (
        <Animated.View style={[
          styles.posterOverlay,
          { 
            opacity: fadeAnimation,
            backgroundColor: 'black'
          }
        ]}>
          <Animated.Image
            source={{ uri: `https://image.tmdb.org/t/p/original${movie.backdrop_path || movie.poster_path}` }}
            style={[
              styles.fullscreenPoster,
              {
                transform: [{ scale: scaleAnimation }]
              }
            ]}
            resizeMode="contain"
          />
        </Animated.View>
      )}

      {/* Trailer Modal - lecture automatique */}
      <Modal
        animationType="none"
        transparent={true}
        visible={showTrailerModal}
        onRequestClose={handleCloseTrailer}
        supportedOrientations={['landscape']}
        statusBarTranslucent={true}
      >
        <View style={styles.modalContainer}>
          <WebView
            source={{ uri: trailerUrl }}
            style={styles.fullscreenVideo}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsFullscreenVideo={true}
            mediaPlaybackRequiresUserAction={false}
            scrollEnabled={false}
            bounces={false}
            onLoad={() => {
              console.log("WebView chargée, le trailer devrait démarrer");
            }}
            onError={(error) => {
              console.error("Erreur WebView:", error);
            }}
            onLoadStart={() => console.log("Début du chargement de la WebView")}
            onLoadEnd={() => console.log("Fin du chargement de la WebView")}
          />
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={handleCloseTrailer}
          >
            <Ionicons name="close-circle" size={40} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>
    </>
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
  pullHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    opacity: 0.7,
  },
  pullHintText: {
    marginLeft: 8,
    fontSize: 14,
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
  trailerButton: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  trailerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  trailerIcon: {
    marginRight: 8,
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
  fullscreenVideo: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 5,
  },
  posterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  fullscreenPoster: {
    width: '100%',
    height: '100%',
    borderRadius: 8,  // Léger arrondi
    shadowColor: "#fff",  // Ombre blanche pour l'effet de lueur
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
});

export default MovieDetailScreen;