// Configuration Babel pour React Native avec gestion des variables d'environnement
// Position: cinemate/babel.config.js

module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
        // Lister explicitement les variables autorisées pour plus de sécurité
        allowlist: [
          'API_KEY',
          'TMDB_DEFAULT_USERNAME',
          'TMDB_DEFAULT_PASSWORD',
          'AUTO_LOGIN'
        ],
        safe: false,
        allowUndefined: true
      }]
    ]
  };
};