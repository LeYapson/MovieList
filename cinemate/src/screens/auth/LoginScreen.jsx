// Écran de connexion avec auto-login via compte TMDB par défaut
// Position: cinemate/src/screens/auth/LoginScreen.jsx

import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Image, Text, Alert, ActivityIndicator } from 'react-native';
import { Button } from '../../components/ui/Button';
import { createRequestToken, validateRequestToken, createSession, getAccountDetails } from '../../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_KEY, TMDB_DEFAULT_USERNAME, TMDB_DEFAULT_PASSWORD, AUTO_LOGIN } from '@env';

// Définition des clés de stockage
const SESSION_ID_KEY = 'sessionId';
const USERNAME_KEY = 'tmdb_username';
const ACCOUNT_ID_KEY = 'tmdb_account_id';
const USER_PREFERENCES_KEY = 'user_preferences';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Vérification de la session existante au chargement de l'écran
  useEffect(() => {
    checkExistingSession();
  }, []);

  // Fonction pour vérifier si une session existe déjà
  const checkExistingSession = async () => {
    try {
      const sessionId = await AsyncStorage.getItem(SESSION_ID_KEY);
      const savedUsername = await AsyncStorage.getItem(USERNAME_KEY);
      const accountId = await AsyncStorage.getItem(ACCOUNT_ID_KEY);
      
      if (sessionId && savedUsername && accountId) {
        console.log('Session existante trouvée, connexion automatique...');
        // Redirection vers l'écran principal
        navigation.replace('MainTabs');
        return;
      }

      // Si pas de session existante et AUTO_LOGIN activé, se connecter avec les identifiants par défaut
      if (AUTO_LOGIN === 'true' && TMDB_DEFAULT_USERNAME && TMDB_DEFAULT_PASSWORD) {
        console.log('Auto-login activé, connexion avec le compte par défaut...');
        await performAutoLogin();
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de session:', error);
      setIsLoading(false);
    }
  };

  // Fonction pour effectuer la connexion automatique
  const performAutoLogin = async () => {
    try {
      const requestToken = await createRequestToken();
      console.log('Request Token créé pour auto-login');

      await validateRequestToken(requestToken, TMDB_DEFAULT_USERNAME, TMDB_DEFAULT_PASSWORD);
      console.log('Token validé pour auto-login');

      const sessionId = await createSession(requestToken);
      console.log('Session créée pour auto-login');
      
      // Récupérer les détails du compte
      const accountDetails = await getAccountDetails(sessionId);
      console.log('Account Details récupérés:', accountDetails);
      
      // Sauvegarder les informations de session
      await saveUserSession(sessionId, TMDB_DEFAULT_USERNAME, accountDetails.id);

      console.log('Auto-login réussi!');
      navigation.replace('MainTabs');
    } catch (error) {
      console.error('Erreur lors de l\'auto-login:', error);
      Alert.alert(
        'Erreur Auto-Login',
        'Impossible de se connecter automatiquement. Veuillez saisir vos identifiants.',
        [{ text: 'OK' }]
      );
      setIsLoading(false);
    }
  };

  // Fonction pour sauvegarder les informations de session
  const saveUserSession = async (sessionId, username, accountId) => {
    try {
      await AsyncStorage.setItem(SESSION_ID_KEY, sessionId);
      await AsyncStorage.setItem(USERNAME_KEY, username);
      await AsyncStorage.setItem(ACCOUNT_ID_KEY, accountId.toString());
      
      // Initialiser les préférences utilisateur si elles n'existent pas
      const preferences = await AsyncStorage.getItem(USER_PREFERENCES_KEY);
      if (!preferences) {
        await AsyncStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify({
          darkMode: false,
          notifications: true,
          language: 'fr'
        }));
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la session:', error);
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);
    try {
      const requestToken = await createRequestToken();
      console.log('Request Token:', requestToken);

      await validateRequestToken(requestToken, username, password);
      console.log('Token validé');

      const sessionId = await createSession(requestToken);
      console.log('Session ID:', sessionId);
      
      // Récupérer les détails du compte pour obtenir l'account_id
      const accountDetails = await getAccountDetails(sessionId);
      console.log('Account Details:', accountDetails);
      
      // Sauvegarder les informations de session
      await saveUserSession(sessionId, username, accountDetails.id);

      Alert.alert('Succès', 'Connexion réussie!');
      navigation.replace('MainTabs');
    } catch (error) {
      console.error('Erreur de connexion:', error);
      Alert.alert(
        'Erreur de connexion',
        'Identifiants incorrects ou problème de connexion'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Afficher un indicateur de chargement pendant la vérification de session ou l'auto-login
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>
          {AUTO_LOGIN === 'true' ? 'Connexion automatique...' : 'Vérification de votre session...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.title}>Cinemate</Text>
        {AUTO_LOGIN === 'true' && (
          <Text style={styles.subtitle}>Connexion automatique configurée</Text>
        )}
      </View>

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nom d'utilisateur TMDB"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
        />

        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isLoading}
        />

        <Button
          title={isLoading ? "Connexion en cours..." : "Se connecter"}
          onPress={handleLogin}
          variant="primary"
          disabled={isLoading}
        />

        <Button
          title="Créer un compte"
          onPress={() => navigation.navigate('Signup')}
          variant="secondary"
          disabled={isLoading}
        />

        {AUTO_LOGIN === 'true' && (
          <Text style={styles.infoText}>
            ℹ️ L'application utilise un compte par défaut pour l'auto-login
          </Text>
        )}
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 100,
    marginBottom: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  formContainer: {
    gap: 15,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
});

export default LoginScreen;