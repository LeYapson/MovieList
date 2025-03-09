// src/utils/streamingUtils.js
import { Linking, Platform } from 'react-native';

/**
 * Map des identifiants de fournisseurs TMDB vers leurs URLs et apps
 */
const PROVIDER_URLS = {
  // Netflix
  8: {
    name: 'Netflix',
    web: 'https://www.netflix.com/search?q=',
    ios: 'netflix://',
    android: 'netflix://'
  },
  // Amazon Prime Video
  9: {
    name: 'Amazon Prime',
    web: 'https://www.primevideo.com/search/?query=',
    ios: 'amzn://apps/android?p=com.amazon.avod',
    android: 'amzn://apps/android?p=com.amazon.avod'
  },
  // Disney+
  337: {
    name: 'Disney+',
    web: 'https://www.disneyplus.com/search?q=',
    ios: 'disneyplus://',
    android: 'disneyplus://'
  },
  // Canal+
  381: {
    name: 'Canal+',
    web: 'https://www.canalplus.com/recherche?q=',
    ios: 'canalplus://',
    android: 'canalplus://'
  },
  // Apple TV+
  350: {
    name: 'Apple TV+',
    web: 'https://tv.apple.com/search?term=',
    ios: 'videos://search?term=',
    android: 'https://tv.apple.com/search?term='
  },
  // OCS
  56: {
    name: 'OCS',
    web: 'https://www.ocs.fr/recherche?q=',
    ios: 'ocs://',
    android: 'ocs://'
  }
  // Ajoutez d'autres fournisseurs au besoin
};

// Fonction pour formater le titre du film pour les recherches
const formatMovieTitle = (title) => {
  return encodeURIComponent(title.trim());
};

/**
 * Tente d'ouvrir l'application native du service de streaming
 * ou se rabat sur le site web si l'app n'est pas disponible
 * 
 * @param {Object} provider - L'objet fournisseur de TMDB
 * @param {string} movieTitle - Le titre du film
 * @returns {Promise<boolean>} - true si l'ouverture a réussi
 */
export const openStreamingService = async (provider, movieTitle) => {
  try {
    if (!provider || !provider.provider_id) {
      console.error('Provider information missing');
      return false;
    }
    
    const providerId = provider.provider_id;
    const providerInfo = PROVIDER_URLS[providerId];
    
    if (!providerInfo) {
      // Provider non reconnu, ouvrir la recherche Google
      const googleSearchUrl = `https://www.google.com/search?q=${formatMovieTitle(movieTitle)}+${provider.provider_name}`;
      await Linking.openURL(googleSearchUrl);
      return true;
    }
    
    // Essayer d'ouvrir l'app native
    const appScheme = Platform.OS === 'ios' ? providerInfo.ios : providerInfo.android;
    
    if (appScheme) {
      try {
        // Vérifier si l'app peut être ouverte
        const canOpen = await Linking.canOpenURL(appScheme);
        
        if (canOpen) {
          await Linking.openURL(appScheme);
          return true;
        }
      } catch (error) {
        console.log('App not installed, falling back to web', error);
      }
    }
    
    // Fallback: ouvrir le site web
    const webUrl = `${providerInfo.web}${formatMovieTitle(movieTitle)}`;
    await Linking.openURL(webUrl);
    return true;
    
  } catch (error) {
    console.error('Error opening streaming service:', error);
    return false;
  }
};

export default {
  openStreamingService
};