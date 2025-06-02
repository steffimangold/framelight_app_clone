// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for additional file extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, "mjs", "cjs"];

// Allow require context (from your existing config)
config.transformer.unstable_allowRequireContext = true;

// Add the Stack Overflow solution to fix default export issues
config.resolver.unstable_enablePackageExports = false;

// Add additional configuration that might help with export resolution
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // This is the default implementation
  return context.resolveRequest(context, moduleName, platform);
};

// Export the config with NativeWind
module.exports = withNativeWind(config, { input: "./app/globals.css" });
