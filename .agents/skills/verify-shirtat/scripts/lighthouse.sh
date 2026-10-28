#!/usr/bin/env bash
# Median-of-3 Lighthouse, mobile + desktop. Writes $OUT/lighthouse/summary.json and checks targets.
set -uo pipefail
B="$1"; OUT="$2"; L="$OUT/lighthouse"; mkdir -p "$L"
CHROME_PATH="$(command -v google-chrome)"; export CHROME_PATH
LH="$(dirname "$LHCI")/../lighthouse/cli/index.js"
[ -f "$LH" ] || LH="$(find "$(dirname "$LHCI")/.." -path '*lighthouse/cli/index.js' | head -1)"
PAGES="${VERIFY_LH_PAGES:-/ /ar /products/ana-ibn-jala-t-shirt}"
for form in mobile desktop; do for p in $PAGES; do for i in 1 2 3; do
  n="$(echo "$form$p" | tr '/' '_')-$i"
  extra=""; [ $form = desktop ] && extra="--preset=desktop"
  if [ -n "${VERCEL_JWT:-}" ]; then  # protected preview: fresh Chrome per run, cookie set over CDP, no storage reset
    port=$((9300 + RANDOM % 500)); prof="$(mktemp -d)"
    google-chrome --headless=new --no-sandbox --remote-debugging-port=$port --user-data-dir="$prof" about:blank >/dev/null 2>&1 & cpid=$!
    sleep 3; node "$(dirname "$0")/set-cookie.mjs" $port "$B" || echo "cookie fail $n"
    node "$LH" "$B$p" $extra --port=$port --disable-storage-reset --quiet --output=json --output-path="$L/$n.json" \
      --only-categories=performance,accessibility,best-practices,seo >/dev/null 2>&1 || echo "lh fail $n"
    kill $cpid 2>/dev/null; wait $cpid 2>/dev/null; rm -rf "$prof"
  else
    node "$LH" "$B$p" $extra --quiet --output=json --output-path="$L/$n.json" \
      --only-categories=performance,accessibility,best-practices,seo \
      --chrome-flags="--headless=new --no-sandbox" >/dev/null 2>&1 || echo "lh fail $n"
  fi
done; done; done
node "$(dirname "$0")/lh-summary.mjs" "$L" "$(dirname "$0")/../baseline.json"
