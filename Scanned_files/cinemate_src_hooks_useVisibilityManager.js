// src/hooks/useVisibilityManager.js
import { useState, useCallback } from 'react';

export const useVisibilityManager = (categories) => {
  // Garder la trace des catégories visibles
  const [visibleSections, setVisibleSections] = useState(new Set(['popular'])); // Toujours charger la première catégorie

  // Gérer la visibilité d'une section
  const handleVisibilityChange = useCallback((categoryId, isVisible) => {
    setVisibleSections(prev => {
      const newSet = new Set(prev);
      if (isVisible) {
        newSet.add(categoryId);
      } else {
        newSet.delete(categoryId);
      }
      return newSet;
    });
  }, []);

  // Vérifier si une catégorie est visible
  const isCategoryVisible = useCallback((categoryId) => {
    return visibleSections.has(categoryId);
  }, [visibleSections]);

  return {
    isCategoryVisible,
    handleVisibilityChange
  };
};