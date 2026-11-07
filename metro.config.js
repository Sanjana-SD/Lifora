const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite's web implementation loads a WebAssembly binary
// (wa-sqlite.wasm) from a worker. Metro treats unknown extensions as
// source by default, so .wasm must be registered as a binary asset
// (served as a URL) rather than parsed as JavaScript.
config.resolver.assetExts.push('wasm');

// Required for expo-sqlite's web worker (SharedArrayBuffer / OPFS)
// to work: the page must be cross-origin isolated.
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    return middleware(req, res, next);
  };
};

module.exports = config;
