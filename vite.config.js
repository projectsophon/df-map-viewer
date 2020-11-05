module.exports = {
  alias: {
    // 'react': '@pika/react',
    // 'react-dom': '@pika/react-dom',
    'crypto': 'crypto-browserify',
    'http': 'http-browserify',
    'https': 'https-browserify',
    'stream': 'stream-browserify',
    'zlib': 'browserify-zlib',
  },
  optimizeDeps: {
    include: ['simple-websocket/simplewebsocket.min.js'],
    exclude: ['simple-websocket']
  },
  env: {
    VITE_DB_CONNECTION_URL: 'ws://map.projectsophon.com/ws'
  },
  rollupInputOptions: {
    external: [
      '/vendor/level-range-emitter-browser.js',
      '/vendor/multileveldown-browser.js',
    ],
  },
};
