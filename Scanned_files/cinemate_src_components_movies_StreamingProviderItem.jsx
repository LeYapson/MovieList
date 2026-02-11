// src/components/movies/StreamingProviderItem.jsx
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { openStreamingService } from '../../utils/streamingUtils';

const StreamingProviderItem = ({ provider, movieTitle, theme }) => {
  const handlePress = async () => {
    await openStreamingService(provider, movieTitle);
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Image 
        source={{ uri: `https://image.tmdb.org/t/p/original${provider.logo_path}` }}
        style={styles.logo}
      />
      <Text 
        style={[styles.type, { color: theme.textSecondary }]}
        numberOfLines={1}
      >
        {provider.type}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: 16,
    width: 70,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginBottom: 4,
  },
  type: {
    fontSize: 10,
    textAlign: 'center',
    width: '100%',
  },
});

export default StreamingProviderItem;