import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Image, Text, Alert } from 'react-native';
import { Button } from '../../components/ui/Button';
import { createRequestToken, validateRequestToken, createSession } from '../../services/authService';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const requestToken = await createRequestToken();
      await validateRequestToken(requestToken, username, password);
      await createSession(requestToken);
      Alert.alert('Succès', 'Connexion réussie!');
      // Naviguer vers l'écran principal ou dashboard
      navigation.navigate('Home');
    } catch (error) {
      Alert.alert('Erreur', 'Échec de la connexion. Vérifiez vos identifiants.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={'../../assets/images/logo.png'}
          style={styles.logo}
        />
        <Text style={styles.title}>Cinemate</Text>
      </View>

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nom d'utilisateur TMDB"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Button
          title="Se connecter"
          onPress={handleLogin}
          variant="primary"
        />

        <Button
          title="Créer un compte"
          onPress={() => navigation.navigate('Signup')}
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
  logoContainer: {
    alignItems: 'center',
    marginTop: 100,
    marginBottom: 50,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  formContainer: {
    gap: 15,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
  },
});

export default LoginScreen;
