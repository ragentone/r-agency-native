const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

/**
 * Der Mesh-Client importiert Capacitor-Plugins. Auf iOS/Android werden sie durch eigene
 * Implementierungen ersetzt, auf Web bleiben die Capacitor-Web-Versionen aktiv.
 */
const NATIVE_SHIMS = {
  '@capacitor/device': path.resolve(__dirname, 'src/core/mesh/platform/capacitor.device.ts'),
  '@capacitor/network': path.resolve(__dirname, 'src/core/mesh/platform/capacitor.network.ts'),
};

/**
 * tslib (u. a. von Apollo genutzt): Über "exports" landet Metro bei `tslib/modules/index.js`,
 * das `tslib.js` (UMD) per Default-Import lädt – unter Metro ist der `undefined`
 * ("Cannot destructure property '__extends' of 'tslib.default'"). Die reine ESM-Datei
 * exportiert alles direkt.
 */
const TSLIB_ESM = require.resolve('tslib/tslib.es6.mjs');

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'tslib') {
    return { type: 'sourceFile', filePath: TSLIB_ESM };
  }
  if (platform !== 'web' && NATIVE_SHIMS[moduleName]) {
    return { type: 'sourceFile', filePath: NATIVE_SHIMS[moduleName] };
  }
  return (defaultResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './src/global.css', inlineRem: 16 });
