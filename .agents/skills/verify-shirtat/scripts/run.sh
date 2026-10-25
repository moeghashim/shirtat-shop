#!/usr/bin/env bash
# usage: run.sh [BASE_URL] [--no-lighthouse]
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; B="${1:-https://shirtat.co}"; shift || true
T="${VERIFY_TOOLS:-$HOME/.cache/verify-shirtat}"
OUT="${VERIFY_OUT:-/workspace/verify-shirtat-evidence/$(date +%Y%m%d-%H%M%S)}"; mkdir -p "$OUT"
bash "$HERE/setup.sh" >/dev/null
bash "$HERE/doctor.sh" "$B" > "$OUT/doctor.txt" || { cat "$OUT/doctor.txt"; echo "doctor failed; aborting"; exit 2; }; cat "$OUT/doctor.txt"
rc=0
NODE_PATH="$T/node_modules" node "$HERE/journeys.mjs" "$B" "$OUT" || rc=1
if [[ " $* " != *" --no-lighthouse "* ]]; then
  NODE_PATH="$T/node_modules" LHCI="$T/node_modules/.bin/lhci" bash "$HERE/lighthouse.sh" "$B" "$OUT" || rc=1
fi
echo "evidence: $OUT"; [ $rc = 0 ] && echo "VERIFY PASS" || echo "VERIFY FAIL"; exit $rc
