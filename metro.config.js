const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver for Node.js modules
config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    // Polyfills for Node modules
    http: require.resolve('@tradle/react-native-http'),
    https: require.resolve('https-browserify'),
    net: require.resolve('react-native-tcp'),
    tls: require.resolve('react-native-tcp'),
    fs: require.resolve('react-native-fs'),
    path: require.resolve('path-browserify'),
    stream: require.resolve('stream-browserify'),
    crypto: require.resolve('react-native-crypto'),
    zlib: require.resolve('browserify-zlib'),
    // Add any other Node.js core modules your app uses
  }
};

module.exports = config;