// src/screens/auth/SignupScreen.jsx
import React from 'react';
import { View, StyleSheet, Text, ScrollView, Alert, TouchableOpacity, Linking, Image } from 'react-native';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../context/ThemeContext';

const SignupScreen = ({ navigation }) => {
 const { theme } = useTheme();

 const openTMDBSignupPage = () => {
   const url = 'https://www.themoviedb.org/signup';
   Linking.canOpenURL(url)
     .then(supported => {
       if (supported) {
         Linking.openURL(url);
       } else {
         Alert.alert("Erreur", "Impossible d'ouvrir la page d'inscription TMDB");
       }
     })
     .catch(err => console.error('An error occurred', err));
 };

 return (
   <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
     <View style={styles.header}>
       <Text style={[styles.title, { color: theme.text }]}>Créer un compte</Text>
       <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
         Rejoignez Cinemate pour suivre vos films préférés
       </Text>
     </View>

     <View style={styles.formContainer}>
       <View style={styles.infoBox}>
         <Text style={[styles.infoText, { color: theme.text }]}>
           Cinemate utilise The Movie Database (TMDB) pour gérer les comptes utilisateurs.
           Pour vous inscrire, vous serez redirigé vers le site TMDB.
         </Text>
       </View>

       <View style={styles.tmdbLogoContainer}>
         <Image 
           source={{ uri: 'https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fb228cf3ded904ef09b136fe3fec72548ebc1fea3fbbd1ad9e36364db38b.svg' }} 
           style={styles.tmdbLogo}
           resizeMode="contain"
         />
       </View>

       <Button
         title="S'inscrire sur TMDB"
         onPress={openTMDBSignupPage}
         variant="primary"
       />
       
       <Button
         title="Déjà un compte TMDB ? Se connecter"
         onPress={() => navigation.navigate('Login')}
         variant="secondary"
       />
       
       <TouchableOpacity 
         style={styles.helpLink} 
         onPress={() => Linking.openURL('https://www.themoviedb.org/about')}
       >
         <Text style={[styles.helpLinkText, { color: theme.accent }]}>
           Qu'est-ce que TMDB ?
         </Text>
       </TouchableOpacity>
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
 infoBox: {
   backgroundColor: 'rgba(0,0,0,0.05)',
   padding: 15,
   borderRadius: 8,
   marginBottom: 20,
 },
 infoText: {
   fontSize: 15,
   lineHeight: 22,
 },
 tmdbLogoContainer: {
   alignItems: 'center',
   marginVertical: 20,
 },
 tmdbLogo: {
   width: 150,
   height: 150,
 },
 helpLink: {
   alignItems: 'center',
   marginTop: 20,
   padding: 10,
 },
 helpLinkText: {
   fontSize: 16,
   fontWeight: '500',
   textDecorationLine: 'underline',
 }
});

export default SignupScreen;