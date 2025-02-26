import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Button } from '../../components/ui/Button';
import { getAccountDetails } from '../../services/authService';
import { getSessionId, removeSessionId, isLoggedIn } from '../../services/storageService';

const ProfileScreen = ({ navigation }) => {
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLoginAndFetchDetails = async () => {
      const isLogged = await isLoggedIn();
      if (isLogged) {
        try {
          const sessionId = await getSessionId();
          const details = await getAccountDetails(sessionId);
          setUserDetails(details);
        } catch (error) {
          Alert.alert('Erreur', 'Problème lors de la récupération des détails du profil.');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        Alert.alert('Erreur', 'Vous devez être connecté pour voir les détails du profil.');
      }
    };

    checkLoginAndFetchDetails();
  }, []);

  const handleLogout = async () => {
    try {
      await removeSessionId();
      Alert.alert('Succès', 'Vous êtes déconnecté');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      Alert.alert('Erreur', 'Problème lors de la déconnexion');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profil</Text>
      </View>

      {userDetails ? (
        <View style={styles.userInfo}>
          <Text style={styles.label}>Nom d'utilisateur TMDB</Text>
          <Text style={styles.value}>{userDetails.username}</Text>

          <Text style={styles.label}>Inclure les contenus adultes</Text>
          <Text style={styles.value}>{userDetails.include_adult ? 'Oui' : 'Non'}</Text>
        </View>
      ) : (
        <Text>Aucune information de profil disponible.</Text>
      )}

      <View style={styles.actions}>
        <Button
          title="Déconnexion"
          onPress={handleLogout}
          variant="secondary"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 20,
  },
  userInfo: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  value: {
    fontSize: 18,
    marginBottom: 20,
  },
  actions: {
    gap: 15,
  },
});

export default ProfileScreen;
