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
    DB_CONNECTION_URL: 'ws://157.230.184.36'
  },
};
