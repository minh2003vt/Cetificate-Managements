const { getDefaultConfig } = require('@expo/metro-config');
const defaultConfig = getDefaultConfig(__dirname);

defaultConfig.resolver.sourceExts.push('jsx', 'js', 'ts', 'tsx');
defaultConfig.transformer.minifierConfig = {
  keep_classnames: true,
  keep_fnames: true,
  mangle: {
    keep_classnames: true,
    keep_fnames: true,
  },
};

module.exports = {
  ...defaultConfig,
  server: {
    ...defaultConfig.server,
    enhanceMiddleware: (middleware) => {
      return (req, res, next) => {
        // Add the correct MIME type for JavaScript files
        if (req.url.endsWith('.bundle')) {
          res.setHeader('Content-Type', 'application/javascript');
        }
        return middleware(req, res, next);
      };
    },
  },
}; 