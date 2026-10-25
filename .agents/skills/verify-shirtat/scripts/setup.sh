#!/usr/bin/env bash
# Installs verification tooling OUTSIDE the repo (no package.json changes).
set -euo pipefail
T="${VERIFY_TOOLS:-$HOME/.cache/verify-shirtat}"
mkdir -p "$T"; cd "$T"
[ -f package.json ] || npm init -y >/dev/null
[ -d node_modules/playwright-core ] && [ -x node_modules/.bin/lhci ] || npm i playwright-core @lhci/cli >/dev/null 2>&1
echo "tools ready in $T"
