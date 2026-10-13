const { withAppBuildGradle, withGradleProperties } = require('expo/config-plugins');

/**
 * Kleinere Android-APKs:
 *
 * 1. Baut nur echte Geräte-Architekturen (arm64-v8a, armeabi-v7a) – die Emulator-ABIs
 *    x86/x86_64 fallen weg. Überschreibbar mit -PreactNativeArchitectures=… (z. B. für
 *    einen Emulator-Build: -PreactNativeArchitectures=x86_64).
 * 2. ABI-Splits: pro Architektur eine eigene APK statt einer großen mit allen.
 *    → android/app/build/outputs/apk/release/app-<abi>-release.apk
 *
 * Für den Play Store (AAB) spielt das keine Rolle – dort verteilt Google ohnehin pro Gerät.
 */

const DEVICE_ABIS = 'armeabi-v7a,arm64-v8a';
const MARKER = '// @r-agency abi-splits';

const SPLITS_BLOCK = `
    ${MARKER}
    splits {
        abi {
            enable true
            reset()
            include(*((findProperty('reactNativeArchitectures') ?: '${DEVICE_ABIS}').split(',').collect { it.trim() }))
            universalApk false
        }
    }
`;

const withDeviceAbisOnly = config =>
  withGradleProperties(config, config => {
    const props = config.modResults;
    const existing = props.find(item => item.type === 'property' && item.key === 'reactNativeArchitectures');
    if (existing) existing.value = DEVICE_ABIS;
    else props.push({ type: 'property', key: 'reactNativeArchitectures', value: DEVICE_ABIS });
    return config;
  });

const withSplits = config =>
  withAppBuildGradle(config, config => {
    const gradle = config.modResults.contents;
    if (gradle.includes(MARKER)) return config;
    const androidBlock = /^android\s*\{\n/m;
    if (!androidBlock.test(gradle)) {
      throw new Error('[with-abi-splits] android { … } in app/build.gradle nicht gefunden.');
    }
    config.modResults.contents = gradle.replace(androidBlock, match => match + SPLITS_BLOCK);
    return config;
  });

module.exports = function withAbiSplits(config) {
  return withSplits(withDeviceAbisOnly(config));
};
