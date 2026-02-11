// SOLUTION RAPIDE - Erreur "API_BASE_URL was not present in allowlist"
// Position: cinemate/babel.config.js

module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
        allowlist: [
          'API_BASE_URL',
          'TMDB_API_KEY',
          'TMDB_TECHNICAL_USERNAME',
          'TMDB_TECHNICAL_PASSWORD'
        ],
        safe: false,
        allowUndefined: true
      }]
    ]
  };
};