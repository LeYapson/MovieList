import React, { useState } from 'react';
import { View, TextInput, StyleSheet, FlatList } from 'react-native';
import { MovieCard } from '../../components/movies/MovieCard';

const SearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Rechercher un film..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <FlatList
        data={results}
        renderItem={({ item }) => (
          <MovieCard
            title={item.title}
            posterPath={item.posterPath}
            releaseDate={item.releaseDate}
            onPress={() => navigation.navigate('MovieDetail', { movieId: item.id })}
          />
        )}
        keyExtractor={item => item.id.toString()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchInput: {
    margin: 16,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
});

export default SearchScreen;