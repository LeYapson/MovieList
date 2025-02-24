// src/components/movies/VisibilityWrapper.jsx
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useInView } from 'react-native-intersection-observer';

const VisibilityWrapper = ({ children, onVisibilityChange, categoryId }) => {
  const { inView, ref } = useInView({
    threshold: 0.1 // La section est considérée visible si 10% est visible
  });

  useEffect(() => {
    onVisibilityChange(categoryId, inView);
  }, [inView, categoryId]);

  return (
    <View ref={ref} style={{ minHeight: 100 }}>
      {children}
    </View>
  );
};

export default VisibilityWrapper;