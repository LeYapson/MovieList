// src/screens/auth/LoginScreen.jsx
import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Image, Text, Alert } from 'react-native';
import { Button } from '../../components/ui/Button';
import { createRequestToken, validateRequestToken, createSession } from '../../services/authService';

const LoginScreen = ({ navigation }) => {
 const [username, setUsername] = useState('');
 const [password, setPassword] = useState('');


 const handleLogin = async () => {
   if (!username || !password) {
     Alert.alert('Erreur', 'Veuillez remplir tous les champs');
     return;
   }

   try {
     const requestToken = await createRequestToken();
     console.log('Request Token:', requestToken);

     await validateRequestToken(requestToken, username, password);
     console.log('Token validé');

     const sessionId = await createSession(requestToken);
     console.log('Session ID:', sessionId);

     Alert.alert('Succès', 'Connexion réussie!');
     navigation.navigate('MainTabs');
   } catch (error) {
     console.error('Erreur de connexion:', error);
     Alert.alert(
       'Erreur de connexion',
       'Identifiants incorrects ou problème de connexion'
     );
   }
 };

 return (
   <View style={styles.container}>
     <View style={styles.logoContainer}>
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