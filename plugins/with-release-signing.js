const { withAppBuildGradle } = require('expo/config-plugins');

/**
 * Signiert Android-Release-Builds mit einem eigenen Keystore (ohne Expo-Konto / EAS).
 *
 * Erwartet `credentials/keystore.properties` im Projekt (wird von scripts/build-apk.sh
 * angelegt):
 *   storeFile=release.keystore        (relativ zu credentials/)
 *   storePassword=…
 *   keyAlias=…
 *   keyPassword=…
 *
 * Fehlt die Datei, bleibt es beim Debug-Schlüssel der Vorlage (Build funktioniert trotzdem).
 * `android/` wird bei jedem `expo prebuild` neu erzeugt – deshalb als Config-Plugin.
 */

const MARKER = '// @r-agency release-signing';

const HEADER = `${MARKER}
def releaseSigningPropsFile = rootProject.file("../credentials/keystore.properties")
def releaseSigningProps = new Properties()
if (releaseSigningPropsFile.exists()) {
    releaseSigningPropsFile.withInputStream { releaseSigningProps.load(it) }
}
`;

const RELEASE_SIGNING_CONFIG = `
        release {
            if (releaseSigningPropsFile.exists()) {
                storeFile rootProject.file("../credentials/" + releaseSigningProps['storeFile'])
                storePassword releaseSigningProps['storePassword']
                keyAlias releaseSigningProps['keyAlias']
                keyPassword releaseSigningProps['keyPassword']
            }
        }`;

const applyReleaseSigning = gradle => {
  if (gradle.includes(MARKER)) return gradle;

  const signingConfigs = /signingConfigs\s*\{/;
  // signingConfig der release-Variante innerhalb von buildTypes { … release { … } }
  const releaseBuildType =
    /(buildTypes\s*\{[\s\S]*?\brelease\s*\{[\s\S]*?)signingConfig\s+signingConfigs\.debug/;

  if (!signingConfigs.test(gradle) || !releaseBuildType.test(gradle)) {
    throw new Error(
      '[with-release-signing] android/app/build.gradle hat ein unerwartetes Format – Signierung nicht eingetragen.'
    );
  }

  return (
    HEADER +
    gradle
      .replace(signingConfigs, match => match + RELEASE_SIGNING_CONFIG)
      .replace(
        releaseBuildType,
        '$1signingConfig releaseSigningPropsFile.exists() ? signingConfigs.release : signingConfigs.debug'
      )
  );
};

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, config => {
    if (config.modResults.language !== 'groovy') {
      throw new Error('[with-release-signing] Nur build.gradle (Groovy) wird unterstützt.');
    }
    config.modResults.contents = applyReleaseSigning(config.modResults.contents);
    return config;
  });
};
