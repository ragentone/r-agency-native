#!/usr/bin/env bash
#
# Richtet das Git-Repository ein und schiebt es nach GitHub.
# Kann gefahrlos mehrfach ausgeführt werden.
#
set -euo pipefail

cd "$(dirname "$0")/.."

REMOTE_URL="https://github.com/ragentone/r-agency-native.git"
BRANCH="main"
MESSAGE="${1:-Initial commit}"

# Repository nur anlegen, wenn es noch keins gibt.
[[ -d .git ]] || git init

# Remote anlegen oder (falls vorhanden) auf die richtige URL setzen.
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REMOTE_URL"
else
  git remote add origin "$REMOTE_URL"
fi

git branch -M "$BRANCH" 2>/dev/null || git symbolic-ref HEAD "refs/heads/$BRANCH"

# Sicherheitsnetz: der Release-Keystore darf nie ins Repository.
git rm -r --cached --quiet --ignore-unmatch credentials >/dev/null

git add -A

# Nur committen, wenn es etwas zu committen gibt (oder noch gar kein Commit existiert).
if ! git rev-parse --verify HEAD >/dev/null 2>&1 || ! git diff --cached --quiet; then
  git commit -m "$MESSAGE"
else
  echo "Nichts Neues zu committen."
fi

git push -u origin "$BRANCH"
