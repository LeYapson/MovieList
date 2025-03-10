import React from 'react';
import '../styles/genres.css';

const GenreTag = ({ genre }) => {
  return (
    <span 
      className="genre-tag" 
      data-genre-id={genre.id}
      style={{ backgroundColor: getGenreColor(genre.id) }}
    >
      {genre.name}
    </span>
  );
};

// Fonction pour associer une couleur à chaque genre selon son ID
const getGenreColor = (genreId) => {
  const colors = {
    28: '#e53935',    // Action
    12: '#ff9800',    // Aventure
    16: '#8bc34a',    // Animation
    35: '#ffc107',    // Comédie
    80: '#607d8b',    // Crime
    99: '#795548',    // Documentaire
    18: '#673ab7',    // Drame
    10751: '#4caf50', // Famille
    14: '#9c27b0',    // Fantastique
    36: '#a1887f',    // Histoire
    27: '#d32f2f',    // Horreur
    10402: '#f44336', // Musique
    9648: '#455a64',  // Mystère
    10749: '#ec407a', // Romance
    878: '#03a9f4',   // Science-Fiction
    10770: '#9e9e9e', // Téléfilm
    53: '#ff5722',    // Thriller
    10752: '#8d6e63', // Guerre
    37: '#bf360c'     // Western
  };
  
  return colors[genreId] || '#2196F3'; // Couleur par défaut si genre inconnu
};

export default GenreTag;