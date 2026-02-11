import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Button } from '../../components/ui/Button';
import { getAccountDetails } from '../../services/authService';
import { getSessionId, removeSessionId, isLoggedIn } from '../../services/storageService';
import { useTheme } from '../../context/ThemeContext';

const ProfileScreen = ({ navigation }) => {
  const { theme } = useTheme();
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
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.primary }]}>Profil</Text>
      </View>

      {userDetails ? (
        <View style={styles.userInfo}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Nom d'utilisateur TMDB</Text>
          <Text style={[styles.value, { color: theme.text }]}>{userDetails.username}</Text>

          <Text style={[styles.label, { color: theme.textSecondary }]}>Inclure les contenus adultes</Text>
          <Text style={[styles.value, { color: theme.text }]}>{userDetails.include_adult ? 'Oui' : 'Non'}</Text>
        </View>
      ) : (
        <Text style={{ color: theme.text }}>Aucune information de profil disponible.</Text>
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
    padding: 20,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  userInfo: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
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