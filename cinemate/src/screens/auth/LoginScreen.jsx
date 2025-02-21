// src/screens/auth/LoginScreen.jsx
import React, { useState, useContext } from 'react';
import { View, TextInput, StyleSheet, Image, Text, Alert } from 'react-native';
import { Button } from '../../components/ui/Button';
import { AuthContext } from '../../context/AuthContext'; // Nous allons créer ce contexte

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { signIn } = useContext(AuthContext); // Utilisation du contexte d'authentification

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      await signIn(username, password);
      // La navigation sera gérée automatiquement par le contexte
    } catch (error) {
      Alert.alert(
        'Erreur de connexion',
        'Identifiants incorrects ou problème de connexion'
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          // Correction du chemin de l'image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
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
          autoCorrect={false}
          returnKeyType="next"
        />

        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          returnKeyType="done"
          onSubmitEditing={handleLogin}
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
    borderWidth: 1,
    borderColor: '#ddd',
  },
});

export default LoginScreen;