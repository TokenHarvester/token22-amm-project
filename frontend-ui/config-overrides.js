const webpack = require('webpack');

module.exports = function override(config, env) {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
    "assert": require.resolve("assert"),
    "http": require.resolve("stream-http"),
    "https": require.resolve("https-browserify"),
    "os": require.resolve("os-browserify"),
    "url": require.resolve("url"),
    "zlib": require.resolve("browserify-zlib"),
    "events": require.resolve("events"),
    "buffer": require.resolve("buffer"),
    "util": require.resolve("util"),
    "process": require.resolve("process/browser"),
  };
  
  config.plugins.push(
    new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"],
    })
  );
  
  config.ignoreWarnings = [/Failed to parse source map/];
  config.module.rules.push({
    test: /\.m?js/,
    resolve: {
      fullySpecified: false
    }
  });
  
  return config;
};