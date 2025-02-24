// src/screens/main/ActorDetailScreen.jsx
import React, { useState, useEffect } from 'react';
import { View, ScrollView, Image, Text, StyleSheet, ActivityIndicator, TouchableOpacity, FlatList } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import tmdbService from '../../services/tmdbService';

const ActorDetailScreen = ({ route, navigation }) => {
  const { actorId } = route.params;
  const { theme } = useTheme();
  const [actor, setActor] = useState(null);
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadActorDetails();
  }, [actorId]);

  const loadActorDetails = async () => {
    try {
      const [personData, creditsData] = await Promise.all([
        tmdbService.getPersonDetails(actorId),
        tmdbService.getPersonMovieCredits(actorId)
      ]);
      setActor(personData);
      
      // Trier les films par date de sortie (du plus récent au plus ancien)
      const sortedMovies = creditsData.cast.sort((a, b) => {
        if (!a.release_date) return 1;
        if (!b.release_date) return -1;
        return new Date(b.release_date) - new Date(a.release_date);
      });
      
      setMovies(sortedMovies);
      setIsLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des détails de l\'acteur:', error);
      setIsLoading(false);
    }
  };

  const formatBirthDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const calculateAge = (birthDate, deathDate) => {
    if (!birthDate) return null;
    
    const birth = new Date(birthDate);
    const end = deathDate ? new Date(deathDate) : new Date();
    
    let age = end.getFullYear() - birth.getFullYear();
    const monthDiff = end.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const renderMovieItem = ({ item }) => {
    if (!item.poster_path && !item.title) return null;

    return (
      <TouchableOpacity 
        style={styles.movieCard}
        onPress={() => navigation.navigate('MovieDetail', { movieId: item.id })}
      >
        <Image
          source={{ 
            uri: item.poster_path 
              ? `https://image.tmdb.org/t/p/w185${item.poster_path}`
              : 'https://via.placeholder.com/185x278'
          }}
          style={styles.moviePoster}
        />
        <View style={styles.movieInfo}>
          <Text style={[styles.movieTitle, { color: theme.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[styles.movieRole, { color: theme.textSecondary }]} numberOfLines={2}>
            {item.character || 'Rôle inconnu'}
          </Text>
          <Text style={[styles.movieYear, { color: theme.textSecondary }]}>
            {item.release_date ? new Date(item.release_date).getFullYear() : 'Date inconnue'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading || !actor) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const age = calculateAge(actor.birthday, actor.deathday);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header avec bouton retour */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: theme.card }]}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView>
        <View style={styles.profileHeader}>
          <Image
            source={{ 
              uri: actor.profile_path 
                ? `https://image.tmdb.org/t/p/w342${actor.profile_path}`
                : 'https://via.placeholder.com/342x513'
            }}
            style={styles.profileImage}
          />
          
          <View style={styles.nameContainer}>
            <Text style={[styles.name, { color: theme.text }]}>{actor.name}</Text>
            {actor.place_of_birth && (
              <Text style={[styles.birthplace, { color: theme.textSecondary }]}>
                <Ionicons name="location-outline" size={16} color={theme.textSecondary} />
                {' '}{actor.place_of_birth}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.infoContainer}>
          {/* Informations personnelles */}
          <View style={styles.personalInfo}>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Né(e) le</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{formatBirthDate(actor.birthday)}</Text>
            </View>
            
            {actor.deathday && (
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Décès</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>{formatBirthDate(actor.deathday)}</Text>
              </View>
            )}
            
            {age !== null && (
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Âge</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {age} ans {actor.deathday ? '(à son décès)' : ''}
                </Text>
              </View>
            )}
            
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Métier</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {actor.known_for_department || 'Non spécifié'}
              </Text>
            </View>
          </View>

          {/* Biographie */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Biographie</Text>
          {actor.biography ? (
            <Text style={[styles.biography, { color: theme.text }]}>
              {actor.biography}
            </Text>
          ) : (
            <Text style={[styles.noBio, { color: theme.textSecondary }]}>
              Aucune biographie disponible pour cet acteur.
            </Text>
          )}

          {/* Filmographie */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Filmographie</Text>
          <Text style={[styles.filmCount, { color: theme.textSecondary }]}>
            {movies.length} films
          </Text>
          
          <FlatList
            data={movies}
            renderItem={renderMovieItem}
            keyExtractor={(item) => `${item.id}-${item.credit_id}`}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 20,
  },
  profileImage: {
    width: 200,
    height: 300,
    borderRadius: 10,
  },
  nameContainer: {
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  birthplace: {
    fontSize: 16,
    textAlign: 'center',
  },
  infoContainer: {
    padding: 20,
  },
  personalInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  biography: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  noBio: {
    fontSize: 16,
    fontStyle: 'italic',
    marginBottom: 24,
  },
  filmCount: {
    fontSize: 16,
    marginBottom: 16,
  },
  movieCard: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  moviePoster: {
    width: 80,
    height: 120,
  },
  movieInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  movieRole: {
    fontSize: 14,
    marginBottom: 4,
  },
  movieYear: {
    fontSize: 14,
  },
});

export default ActorDetailScreen;