import React from 'react';
import '../styles/genres.css';

const GenreTag = ({ genre, onClick }) => {
  return (
    <span 
      className="genre-tag clickable-genre" 
      onClick={() => onClick(genre.id)}
    >
      {genre.name}
    </span>
  );
};

export default GenreTag;
