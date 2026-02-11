// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import { createRequestToken, validateRequestToken, createSession, getAccountDetails } from '../services/authService';
import { getSessionId, storeSessionId, removeSessionId, saveAccountId, getAccountId, clearAllUserData } from '../services/storageService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [accountId, setAccountId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Vérifier s'il existe déjà une session
  useEffect(() => {
    const checkLoginState = async () => {
      try {
        const storedSessionId = await getSessionId();
        const storedAccountId = await getAccountId();
        
        if (storedSessionId) {
          // On pourrait ajouter une validation de session ici si nécessaire
          setUserToken(storedSessionId);
          setIsAuthenticated(true);
          
          if (storedAccountId) {
            setAccountId(storedAccountId);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'état de connexion:', error);
      } finally {
        setLoading(false);
      }
    };

    checkLoginState();
  }, []);

  const signIn = async (username, password) => {
    try {
      setLoading(true);
      const requestToken = await createRequestToken();
      await validateRequestToken(requestToken, username, password);
      const sessionId = await createSession(requestToken);
      
      setUserToken(sessionId);
      setIsAuthenticated(true);
      
      // Récupérer les détails du compte
      try {
        const accountDetails = await getAccountDetails(sessionId);
        if (accountDetails && accountDetails.id) {
          setAccountId(accountDetails.id);
          await saveAccountId(accountDetails.id);
        }
      } catch (accountError) {
        console.error('Erreur lors de la récupération des détails du compte:', accountError);
        // Continuer malgré l'erreur car l'authentification a réussi
      }
      
      return true;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      // On pourrait ajouter une déconnexion de l'API ici si nécessaire
      
      setUserToken(null);
      setIsAuthenticated(false);
      setAccountId(null);
      
      // Nettoyer le stockage
      await clearAllUserData();
      
      return true;
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      userToken,
      accountId,
      loading,
      signIn, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;