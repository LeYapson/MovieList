// src/screens/main/ProfileScreen.jsx
import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Button } from '../../components/ui/Button';
import { removeSessionId } from '../../services/storageService';

const ProfileScreen = ({ navigation }) => {
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

 return (
   <View style={styles.container}>
     <View style={styles.header}>
       <Text style={styles.title}>Profil</Text>
     </View>

     <View style={styles.userInfo}>
       <Text style={styles.label}>Nom d'utilisateur TMDB</Text>
       <Text style={styles.value}>John Doe</Text>

       <Text style={styles.label}>Email</Text>
       <Text style={styles.value}>john@example.com</Text>
     </View>

     <View style={styles.stats}>
       <View style={styles.statItem}>
         <Text style={styles.statValue}>24</Text>
         <Text style={styles.statLabel}>Films favoris</Text>
       </View>
       <View style={styles.statItem}>
         <Text style={styles.statValue}>12</Text>
         <Text style={styles.statLabel}>Watchlist</Text>
       </View>
     </View>

     <View style={styles.actions}>
       <Button
         title="Modifier le profil"
         onPress={() => {}}
         variant="primary"
       />
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
 },
 title: {
   fontSize: 28,
   fontWeight: 'bold',
   color: '#2196F3',
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
 stats: {
   flexDirection: 'row',
   justifyContent: 'space-around',
   marginBottom: 30,
   padding: 20,
   backgroundColor: '#f5f5f5',
   borderRadius: 10,
 },
 statItem: {
   alignItems: 'center',
 },
 statValue: {
   fontSize: 24,
   fontWeight: 'bold',
   color: '#2196F3',
 },
 statLabel: {
   fontSize: 14,
   color: '#666',
 },
 actions: {
   gap: 15,
 },
});

export default ProfileScreen;