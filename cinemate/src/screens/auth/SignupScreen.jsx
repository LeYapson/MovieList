// src/screens/auth/SignupScreen.jsx
import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Button } from '../../components/ui/Button';
import { createAccount } from '../../services/authService';
import { useTheme } from '../../context/ThemeContext';

const SignupScreen = ({ navigation }) => {
 const { theme } = useTheme();
 const [isLoading, setIsLoading] = useState(false);
 const [formData, setFormData] = useState({
   username: '',
   email: '',
   password: '',
   confirmPassword: '',
 });
 const [errors, setErrors] = useState({});

 const validateForm = () => {
   const newErrors = {};

   // Validation du nom d'utilisateur
   if (!formData.username.trim()) {
     newErrors.username = 'Nom d\'utilisateur requis';
   } else if (formData.username.length < 3) {
     newErrors.username = 'Le nom d\'utilisateur doit faire au moins 3 caractères';
   }

   // Validation de l'email
   if (!formData.email.trim()) {
     newErrors.email = 'Email requis';
   } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
     newErrors.email = 'Format d\'email invalide';
   }

   // Validation du mot de passe
   if (!formData.password) {
     newErrors.password = 'Mot de passe requis';
   } else if (formData.password.length < 8) {
     newErrors.password = 'Le mot de passe doit faire au moins 8 caractères';
   } else if (!/\d/.test(formData.password)) {
     newErrors.password = 'Le mot de passe doit contenir au moins un chiffre';
   }

   // Validation de la confirmation du mot de passe
   if (formData.password !== formData.confirmPassword) {
     newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
   }

   setErrors(newErrors);
   return Object.keys(newErrors).length === 0;
 };

 const handleSignup = async () => {
   if (!validateForm()) return;

   setIsLoading(true);
   try {
     await createAccount(formData.username, formData.email, formData.password);
     Alert.alert(
       'Succès',
       'Votre compte a été créé avec succès ! Vous pouvez maintenant vous connecter.',
       [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
     );
   } catch (error) {
    console.error('Signup Error:', error);
    Alert.alert(
      'Erreur de création de compte',
      `Détails: ${error.message}`
    );
   } finally {
     setIsLoading(false);
   }
 };

 const renderInput = (field, placeholder, secureTextEntry = false, keyboardType = 'default') => (
   <View style={styles.inputContainer}>
     <TextInput
       style={[
         styles.input,
         { backgroundColor: theme.card, color: theme.text },
         errors[field] && styles.inputError
       ]}
       placeholder={placeholder}
       placeholderTextColor={theme.textSecondary}
       value={formData[field]}
       onChangeText={(text) => setFormData({...formData, [field]: text})}
       secureTextEntry={secureTextEntry}
       autoCapitalize="none"
       keyboardType={keyboardType}
     />
     {errors[field] && (
       <Text style={styles.errorText}>{errors[field]}</Text>
     )}
   </View>
 );

 return (
   <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
     <View style={styles.header}>
       <Text style={[styles.title, { color: theme.text }]}>Créer un compte</Text>
       <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
         Rejoignez Cinemate pour suivre vos films préférés
       </Text>
     </View>

     <View style={styles.formContainer}>
       {renderInput('username', 'Nom d\'utilisateur')}
       {renderInput('email', 'Email', false, 'email-address')}
       {renderInput('password', 'Mot de passe', true)}
       {renderInput('confirmPassword', 'Confirmer le mot de passe', true)}

       <Button
         title={isLoading ? 'Création en cours...' : 'S\'inscrire'}
         onPress={handleSignup}
         variant="primary"
         disabled={isLoading}
       />

       <Button
         title="Déjà un compte ? Se connecter"
         onPress={() => navigation.navigate('Login')}
         variant="secondary"
         disabled={isLoading}
       />
     </View>
   </ScrollView>
 );
};

const styles = StyleSheet.create({
 container: {
   flex: 1,
 },
 header: {
   padding: 20,
   marginTop: 50,
 },
 title: {
   fontSize: 28,
   fontWeight: 'bold',
   marginBottom: 10,
 },
 subtitle: {
   fontSize: 16,
   marginBottom: 20,
 },
 formContainer: {
   padding: 20,
   gap: 15,
 },
 inputContainer: {
   marginBottom: 15,
 },
 input: {
   padding: 15,
   borderRadius: 8,
   fontSize: 16,
   borderWidth: 1,
   borderColor: '#ddd',
 },
 inputError: {
   borderColor: '#FF3B30',
   borderWidth: 1,
 },
 errorText: {
   color: '#FF3B30',
   fontSize: 12,
   marginTop: 5,
   marginLeft: 5,
 }
});

export default SignupScreen;