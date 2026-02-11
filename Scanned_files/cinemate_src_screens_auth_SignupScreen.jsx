// SignupScreen avec gestion flexible de la réponse API
// Position: cinemate/src/screens/auth/SignupScreen.jsx

import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  Text, 
  Alert, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { Button } from '../../components/ui/Button';
import apiService from '../../services/apiService';
import { storeTokens, saveUserData } from '../../services/storageService';
import { Ionicons } from '@expo/vector-icons';

const SignupScreen = ({ navigation }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = () => {
    if (!firstName.trim()) {
      Alert.alert('Erreur', 'Le prénom est requis');
      return false;
    }

    if (!lastName.trim()) {
      Alert.alert('Erreur', 'Le nom est requis');
      return false;
    }

    if (!username.trim()) {
      Alert.alert('Erreur', 'Le nom d\'utilisateur est requis');
      return false;
    }
    if (username.length < 3) {
      Alert.alert('Erreur', 'Le nom d\'utilisateur doit contenir au moins 3 caractères');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      Alert.alert('Erreur', 'L\'email est requis');
      return false;
    }
    if (!emailRegex.test(email)) {
      Alert.alert('Erreur', 'L\'email n\'est pas valide');
      return false;
    }

    if (!password) {
      Alert.alert('Erreur', 'Le mot de passe est requis');
      return false;
    }
    if (password.length < 8) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 8 caractères');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return false;
    }

    return true;
  };

  const checkAvailability = async (type, value) => {
    try {
      if (type === 'email' && value.includes('@')) {
        const response = await apiService.checkAvailability(value, null);
        if (!response.available) {
          Alert.alert('Email déjà utilisé', 'Cet email est déjà associé à un compte');
        }
      } else if (type === 'username' && value.length >= 3) {
        const response = await apiService.checkAvailability(null, value);
        if (!response.available) {
          Alert.alert('Username déjà pris', 'Ce nom d\'utilisateur est déjà utilisé');
        }
      }
    } catch (error) {
      console.log('Erreur vérification disponibilité:', error);
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

  const handleSignup = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('📝 Tentative d\'inscription...');

      const userData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password: password,
      };

      if (birthDate) {
        userData.birthDate = new Date(birthDate).toISOString();
      }
      if (phoneNumber) {
        userData.phoneNumber = phoneNumber.trim();
      }

      const response = await apiService.register(userData);
      
      console.log('✅ Inscription réussie');

      // Extraire les tokens (gestion flexible)
      const { accessToken, refreshToken, user } = extractTokensFromResponse(response);
      
      if (!accessToken) {
        console.error('❌ Structure de réponse:', response);
        throw new Error(
          'Token d\'accès manquant. Vérifiez la structure de réponse de votre API.'
        );
      }

      // Sauvegarder les tokens
      await storeTokens(accessToken, refreshToken);
      console.log('✅ Tokens sauvegardés');

      // Sauvegarder les données utilisateur si disponibles
      if (user) {
        await saveUserData(user);
        console.log('✅ Données utilisateur sauvegardées');
      }

      Alert.alert(
        'Inscription réussie !',
        `Bienvenue sur Cinemate, ${firstName} !`,
        [
          {
            text: 'Commencer',
            onPress: () => navigation.replace('MainTabs')
          }
        ]
      );

    } catch (error) {
      console.error('❌ Erreur d\'inscription:', error);
      
      let errorMessage = 'Une erreur est survenue lors de l\'inscription';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 409) {
          errorMessage = 'Cet email ou nom d\'utilisateur est déjà utilisé';
        } else if (status === 400) {
          errorMessage = data?.message || 'Données invalides';
        } else if (data?.message) {
          errorMessage = data.message;
        }
      } else if (error.request) {
        errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion internet.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Erreur d\'inscription', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#2196F3" />
          </TouchableOpacity>
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>Rejoignez Cinemate dès maintenant</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Prénom *</Text>
            <TextInput
              style={styles.input}
              placeholder="Jean"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nom *</Text>
            <TextInput
              style={styles.input}
              placeholder="Dupont"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nom d'utilisateur *</Text>
            <TextInput
              style={styles.input}
              placeholder="jeandupont"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSubmitting}
              onBlur={() => checkAvailability('username', username)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="jean.dupont@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSubmitting}
              onBlur={() => checkAvailability('email', email)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mot de passe *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Min. 8 caractères"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!isSubmitting}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons 
                  name={showPassword ? "eye-off" : "eye"} 
                  size={24} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirmer le mot de passe *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Re-saisir le mot de passe"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                editable={!isSubmitting}
              />
              <TouchableOpacity 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-off" : "eye"} 
                  size={24} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Date de naissance (optionnel)</Text>
            <TextInput
              style={styles.input}
              placeholder="JJ/MM/AAAA"
              value={birthDate}
              onChangeText={setBirthDate}
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Téléphone (optionnel)</Text>
            <TextInput
              style={styles.input}
              placeholder="+33 6 12 34 56 78"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              editable={!isSubmitting}
            />
          </View>

          <Button
            title={isSubmitting ? "Inscription en cours..." : "S'inscrire"}
            onPress={handleSignup}
            variant="primary"
            disabled={isSubmitting}
          />

          <TouchableOpacity 
            style={styles.loginLinkContainer}
            onPress={() => navigation.navigate('Login')}
            disabled={isSubmitting}
          >
            <Text style={styles.loginLinkText}>
              Déjà un compte ? <Text style={styles.loginLink}>Se connecter</Text>
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
    paddingBottom: 40,
  },
  header: {
    marginTop: 40,
    marginBottom: 30,
  },
  backButton: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  formContainer: {
    gap: 16,
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  eyeButton: {
    padding: 10,
  },
  loginLinkContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loginLinkText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    color: '#2196F3',
    fontWeight: '600',
  },
});

export default SignupScreen;