#!/usr/bin/env bash
#
# Installiert UI-Komponenten von React Native Reusables (https://reactnativereusables.com)
# über die offizielle CLI nach src/components/ui.
#
#   bash scripts/add-reusables.sh                     # alle Komponenten
#   bash scripts/add-reusables.sh dialog select       # nur bestimmte Komponenten
#   bash scripts/add-reusables.sh --overwrite         # vorhandene Dateien überschreiben
#   bash scripts/add-reusables.sh --list              # verfügbare Komponenten anzeigen
#
# Ohne --overwrite bleiben vorhandene Dateien (z. B. button.tsx, text.tsx) unverändert.
#
set -euo pipefail

cd "$(dirname "$0")/.."

# Stand der CLI (@react-native-reusables/cli, PROJECT_MANIFEST.components)
COMPONENTS=(
  accordion alert-dialog alert aspect-ratio avatar badge button card checkbox collapsible
  context-menu dialog dropdown-menu hover-card input label menubar popover progress
  radio-group select separator skeleton switch tabs text textarea toggle-group toggle tooltip
)

CLI="@react-native-reusables/cli@latest"
OVERWRITE=()
SELECTED=()

for arg in "$@"; do
  case "$arg" in
    -o|--overwrite) OVERWRITE=(--overwrite) ;;
    -l|--list) printf '%s\n' "${COMPONENTS[@]}"; exit 0 ;;
    -h|--help) sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    -*) echo "✖ Unbekannte Option: $arg" >&2; exit 1 ;;
    *) SELECTED+=("$arg") ;;
  esac
done

step() { echo; echo "▶ $*"; }

[[ -f components.json ]] || { echo "✖ components.json fehlt – im Projekt-Root ausführen." >&2; exit 1; }

# Sicherheitsnetz: vorher den Stand der UI-Komponenten sichern.
if [[ -d src/components/ui ]]; then
  BACKUP="build/reusables-backup-$(date +%Y%m%d-%H%M%S)"
  mkdir -p "$BACKUP"
  cp -R src/components/ui "$BACKUP/"
  cp package.json package-lock.json "$BACKUP/" 2>/dev/null || true
  echo "ℹ Sicherung: $BACKUP"
fi

# ── 1. Komponenten hinzufügen ──────────────────────────────────────────────────
if [[ ${#SELECTED[@]} -eq 0 ]]; then
  step "Füge alle ${#COMPONENTS[@]} Komponenten hinzu"
  npx --yes "$CLI" add --all --yes ${OVERWRITE[@]+"${OVERWRITE[@]}"} --styling-library nativewind
else
  for component in "${SELECTED[@]}"; do
    if [[ ! " ${COMPONENTS[*]} " == *" $component "* ]]; then
      echo "⚠ '$component' ist nicht in der bekannten Liste (--list) – versuche es trotzdem."
    fi
  done
  step "Füge hinzu: ${SELECTED[*]}"
  npx --yes "$CLI" add "${SELECTED[@]}" --yes ${OVERWRITE[@]+"${OVERWRITE[@]}"} --styling-library nativewind
fi

# ── 2. Native Pakete auf Expo-SDK-kompatible Versionen bringen ─────────────────
step "Gleiche Paketversionen mit dem Expo SDK ab (expo install --fix)"
npx expo install --fix || echo "⚠ expo install --fix meldete Probleme – bitte Ausgabe prüfen."

# ── 3. PortalHost im Root-Layout (für Dialog, Popover, Select, Tooltip …) ──────
LAYOUT="src/app/_layout.tsx"
if [[ -d node_modules/@rn-primitives/portal && -f "$LAYOUT" ]] && ! grep -q "<PortalHost" "$LAYOUT"; then
  step "Ergänze <PortalHost /> in $LAYOUT"
  node - "$LAYOUT" <<'NODE'
const fs = require('fs');
const file = process.argv[2];
let src = fs.readFileSync(file, 'utf8');
// Import nach dem letzten Import einfügen
const imports = [...src.matchAll(/^import .*;$/gm)];
const last = imports[imports.length - 1];
const at = last.index + last[0].length;
src = src.slice(0, at) + "\nimport { PortalHost } from '@rn-primitives/portal';" + src.slice(at);
// PortalHost als letztes Kind des äußersten Providers im RootLayout
if (src.includes('<RootNavigator />')) {
  src = src.replace('<RootNavigator />', '<RootNavigator />\n        <PortalHost />');
} else {
  console.error('⚠ Konnte die Stelle für <PortalHost /> nicht finden – bitte manuell ergänzen.');
  process.exit(0);
}
fs.writeFileSync(file, src);
NODE
fi

# ── 4. Prüfen ──────────────────────────────────────────────────────────────────
step "TypeScript prüfen"
if npx tsc --noEmit; then
  echo "✔ TypeScript ok"
else
  echo "⚠ TypeScript-Fehler – siehe oben (Sicherung: ${BACKUP:-keine})."
fi

step "Fertig. Installierte Komponenten:"
ls src/components/ui | sed 's/\.tsx$//' | tr '\n' ' '
echo
echo
echo "ℹ Neue native Pakete (z. B. react-native-svg für Icons) brauchen einen neuen Build:"
echo "  npx expo start -c   bzw.   npm run build:apk"
