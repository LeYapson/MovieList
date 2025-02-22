// src/context/AuthContext.js
import React, { createContext, useState } from 'react';
import { createRequestToken, validateRequestToken, createSession } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userToken, setUserToken] = useState(null);

  const signIn = async (username, password) => {
    try {
      const requestToken = await createRequestToken();
      await validateRequestToken(requestToken, username, password);
      const sessionId = await createSession(requestToken);
      
      setUserToken(sessionId);
      setIsAuthenticated(true);
    } catch (error) {
      throw error;
    }
  };

  const signOut = () => {
    setUserToken(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userToken, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};