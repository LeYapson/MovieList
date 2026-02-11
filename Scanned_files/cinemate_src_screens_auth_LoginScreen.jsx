// LoginScreen avec gestion flexible de la réponse API
// Position: cinemate/src/screens/auth/LoginScreen.jsx

import React, { useState, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  Text, 
  Alert, 
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Button } from '../../components/ui/Button';
import apiService from '../../services/apiService';
import { 
  storeTokens, 
  saveUserData, 
  isLoggedIn,
  clearAllUserData 
} from '../../services/storageService';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const loggedIn = await isLoggedIn();
      
      if (loggedIn) {
        console.log('✅ Session existante trouvée');
        
        try {
          await apiService.getMyProfile();
          console.log('✅ Token valide, redirection...');
          navigation.replace('MainTabs');
          return;
        } catch (error) {
          console.log('⚠️ Token expiré, suppression de la session');
          await clearAllUserData();
        }
      }
    } catch (error) {
      console.error('❌ Erreur vérification session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Extraire les tokens de la réponse API (gestion flexible)
   */
  const extractTokensFromResponse = (response) => {
    console.log('📦 RÉPONSE COMPLÈTE:', JSON.stringify(response, null, 2));
    
    let accessToken, refreshToken, user;
    
    // Cas 1 : Réponse directe avec camelCase
    if (response.accessToken) {
      accessToken = response.accessToken;
      refreshToken = response.refreshToken;
      user = response.user;
    }
    // Cas 2 : Réponse avec snake_case
    else if (response.access_token) {
      accessToken = response.access_token;
      refreshToken = response.refresh_token;
      user = response.user;
    }
    // Cas 3 : Réponse dans un sous-objet 'data'
    else if (response.data) {
      if (response.data.accessToken) {
        accessToken = response.data.accessToken;
        refreshToken = response.data.refreshToken;
        user = response.data.user;
      } else if (response.data.access_token) {
        accessToken = response.data.access_token;
        refreshToken = response.data.refresh_token;
        user = response.data.user;
      }
    }
    // Cas 4 : Un seul token appelé 'token'
    else if (response.token) {
      accessToken = response.token;
      refreshToken = response.token;
      user = response.user;
    }
    
    // Utiliser accessToken comme refreshToken si manquant
    if (accessToken && !refreshToken) {
      console.log('⚠️ Pas de refresh token, utilisation de l\'access token');
      refreshToken = accessToken;
    }
    
    return { accessToken, refreshToken, user };
  };

  const handleLogin = async () => {
    // Validation
    if (!username || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🔐 Tentative de connexion...');
      
      // Connexion via l'API
      const response = await apiService.login(username, password);
      
      console.log('✅ Connexion réussie');
      
      // Extraire les tokens (gestion flexible)
      const { accessToken, refreshToken, user } = extractTokensFromResponse(response);
      
      // Vérification
      if (!accessToken) {
        console.error('❌ Structure de réponse:', response);
        throw new Error(
          'Token d\'accès manquant. Vérifiez la structure de réponse de votre API.'
        );
      }

      // Sauvegarder les tokens
      await storeTokens(accessToken, refreshToken);
      console.log('✅ Tokens sauvegardés');
      console.log('   - Access Token:', accessToken.substring(0, 20) + '...');
      if (refreshToken !== accessToken) {
        console.log('   - Refresh Token:', refreshToken.substring(0, 20) + '...');
      }

      // Sauvegarder les données utilisateur si disponibles
      if (user) {
        await saveUserData(user);
        console.log('✅ Données utilisateur sauvegardées');
        console.log('   - User:', JSON.stringify(user, null, 2));
      } else {
        console.log('⚠️ Pas de données utilisateur dans la réponse');
      }

      // Message de succès
      const userName = user?.firstName || user?.username || username;
      
      Alert.alert(
        'Bienvenue !',
        `Connexion réussie. Bienvenue ${userName} !`,
        [
          {
            text: 'OK',
            onPress: () => navigation.replace('MainTabs')
          }
        ]
      );

    } catch (error) {
      console.error('❌ Erreur de connexion:', error);
      
      let errorMessage = 'Identifiants incorrects ou problème de connexion';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        console.error('❌ Erreur API:', {
          status,
          data,
          headers: error.response.headers
        });
        
        if (status === 401) {
          errorMessage = 'Identifiants incorrects';
        } else if (status === 429) {
          errorMessage = 'Trop de tentatives. Veuillez réessayer plus tard.';
        } else if (data?.message) {
          errorMessage = data.message;
        }
      } else if (error.request) {
        console.error('❌ Pas de réponse:', error.request);
        errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion internet.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Erreur de connexion', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNavigateToSignup = () => {
    navigation.navigate('Signup');
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Vérification de votre session...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Text style={styles.title}>Cinemate</Text>
          <Text style={styles.subtitle}>Découvrez vos films préférés</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nom d'utilisateur ou Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Entrez votre identifiant"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSubmitting}
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              style={styles.input}
              placeholder="Entrez votre mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isSubmitting}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
          </View>

          <Button
            title={isSubmitting ? "Connexion en cours..." : "Se connecter"}
            onPress={handleLogin}
            variant="primary"
            disabled={isSubmitting}
          />

          <View style={styles.separatorContainer}>
            <View style={styles.separator} />
            <Text style={styles.separatorText}>OU</Text>
            <View style={styles.separator} />
          </View>

          <Button
            title="Créer un compte"
            onPress={handleNavigateToSignup}
            variant="secondary"
            disabled={isSubmitting}
          />

          <TouchableOpacity 
            style={styles.forgotPasswordContainer}
            onPress={() => Alert.alert('Info', 'Fonctionnalité en cours de développement')}
          >
            <Text style={styles.forgotPasswordText}>
              Mot de passe oublié ?
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
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
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  formContainer: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  separator: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  separatorText: {
    marginHorizontal: 10,
    color: '#666',
    fontSize: 14,
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  forgotPasswordText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default LoginScreen;