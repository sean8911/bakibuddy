const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");
const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push("wasm", "html");
const previousBlocks = config.resolver.blockList;
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Generated exports and rapidly changing test profiles are never application modules.
config.resolver.blockList = [
  ...(Array.isArray(previousBlocks) ? previousBlocks : previousBlocks ? [previousBlocks] : []),
  ...["dist", "test-results"].map(name => new RegExp(`^${path.resolve(__dirname, name).replaceAll("\\", "/").split("/").map(escapeRegex).join("[/\\\\]")}(?:[/\\\\].*)?$`)),
];
const previous = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, server) => {
  const handler = previous ? previous(middleware, server) : middleware;
  return (req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
    handler(req, res, next);
  };
};
module.exports = config;
