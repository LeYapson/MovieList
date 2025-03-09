import React from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext'; // Ajoutez le chemin correct vers votre contexte

export const MovieCard = ({ title, posterPath, releaseDate, onPress, theme: propTheme }) => {
  // Utiliser le thème fourni par les props ou le hook useTheme()
  const { theme: contextTheme } = useTheme();
  const theme = propTheme || contextTheme;
  
  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        { 
          backgroundColor: theme.card,
          shadowColor: theme.shadow || '#000',
        }
      ]} 
      onPress={onPress}
    >
      <Image
        style={styles.poster}
        source={{ uri: `https://image.tmdb.org/t/p/w500${posterPath}` }}
      />
      <View style={styles.info}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>{title}</Text>
        <Text style={[styles.date, { color: theme.textSecondary }]}>{releaseDate}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  poster: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  info: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
  },
});