#!/usr/bin/env bash
#
# Baut eine signierte Release-APK lokal – ohne Expo-Konto/EAS.
#
#   npm run build:apk                          # je eine APK für arm64-v8a und armeabi-v7a
#   APK_ARCH=arm64-v8a npm run build:apk       # nur moderne Handys (schneller)
#   APK_ARCH=x86_64 npm run build:apk          # für den Android-Emulator
#
# Voraussetzungen (einmalig): Android Studio (Android SDK) und JDK 17.
# Ergebnis: build/r-agency-<version>-<architektur>.apk (pro Architektur eine Datei,
# siehe plugins/with-abi-splits.js)
#
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$PWD"
CRED_DIR="$ROOT/credentials"
PROPS="$CRED_DIR/keystore.properties"

fail() { echo "✖ $*" >&2; exit 1; }
step() { echo; echo "▶ $*"; }

# ── 1. Werkzeuge prüfen ────────────────────────────────────────────────────────
step "Prüfe Java und Android SDK"

if [[ -z "${JAVA_HOME:-}" && -x /usr/libexec/java_home ]]; then
  JAVA_HOME="$(/usr/libexec/java_home -v 17 2>/dev/null || true)"
  [[ -n "$JAVA_HOME" ]] && export JAVA_HOME
fi
command -v java >/dev/null || fail "Java fehlt. Installiere JDK 17, z. B.: brew install --cask zulu@17"
JAVA_MAJOR="$(java -version 2>&1 | grep -m1 'version "' | sed -E 's/.*version "([0-9]+).*/\1/' || true)"
[[ "$JAVA_MAJOR" == "17" ]] || echo "⚠ Java $JAVA_MAJOR gefunden – empfohlen ist JDK 17 (brew install --cask zulu@17)."

export ANDROID_HOME="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}}"
[[ -d "$ANDROID_HOME" ]] || fail "Android SDK nicht gefunden ($ANDROID_HOME). Android Studio installieren und einmal starten, oder ANDROID_HOME setzen."

# ── 2. Release-Keystore (einmalig) ─────────────────────────────────────────────
if [[ ! -f "$PROPS" ]]; then
  step "Erzeuge Release-Keystore in credentials/"
  mkdir -p "$CRED_DIR"
  PASS="$(openssl rand -hex 16)"
  keytool -genkeypair -noprompt -storetype PKCS12 \
    -keystore "$CRED_DIR/release.keystore" -alias r-agency \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass "$PASS" -keypass "$PASS" \
    -dname "CN=R-Agency, O=R-Agency, C=DE"
  cat > "$PROPS" <<PROPS
storeFile=release.keystore
storePassword=$PASS
keyAlias=r-agency
keyPassword=$PASS
PROPS
  chmod 600 "$PROPS" "$CRED_DIR/release.keystore"
  echo "⚠ WICHTIG: credentials/ sichern (z. B. Passwort-Manager)! Ohne diesen Schlüssel"
  echo "  lassen sich installierte Apps nicht mehr per Update überschreiben."
fi

# ── 3. android/ neu erzeugen ───────────────────────────────────────────────────
step "Erzeuge android/ (expo prebuild)"
rm -rf android
# prebuild schreibt die Skripte "android"/"ios" in package.json um – Original behalten.
cp package.json package.json.prebuild-backup
trap 'mv -f package.json.prebuild-backup package.json 2>/dev/null || true' EXIT
CI=1 npx expo prebuild --platform android --no-install
mv -f package.json.prebuild-backup package.json
trap - EXIT

# ── 4. APK bauen ───────────────────────────────────────────────────────────────
step "Baue Release-APK (Gradle) – beim ersten Mal dauert das einige Minuten"
GRADLE_ARGS=(assembleRelease)
[[ -n "${APK_ARCH:-}" ]] && GRADLE_ARGS+=("-PreactNativeArchitectures=$APK_ARCH")
(cd android && NODE_ENV=production ./gradlew "${GRADLE_ARGS[@]}")

# ── 5. Ergebnis ────────────────────────────────────────────────────────────────
VERSION="$(node -p "require('./app.json').expo.version")"
mkdir -p build
rm -f build/r-agency-"$VERSION"*.apk

shopt -s nullglob
APKS=(android/app/build/outputs/apk/release/app-*-release.apk)
[[ ${#APKS[@]} -gt 0 ]] || APKS=(android/app/build/outputs/apk/release/app-release.apk)

step "Fertig:"
for APK in "${APKS[@]}"; do
  ABI="$(basename "$APK" | sed -E 's/^app-(.*)-release\.apk$/\1/; s/^app-release\.apk$/universal/')"
  OUT="build/r-agency-$VERSION-$ABI.apk"
  cp "$APK" "$OUT"
  echo "  $OUT ($(du -h "$OUT" | cut -f1))"
done
echo
echo "  Welche Datei? Fast alle aktuellen Handys: arm64-v8a. Sehr alte Geräte: armeabi-v7a."
echo "  Architektur des Handys:  adb shell getprop ro.product.cpu.abi"
echo "  Installieren per USB:    adb install -r build/r-agency-$VERSION-arm64-v8a.apk"
