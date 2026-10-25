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
  node "$LH" "$B$p" $extra --quiet --output=json --output-path="$L/$n.json" \
    --only-categories=performance,accessibility,best-practices,seo \
    --chrome-flags="--headless=new --no-sandbox" >/dev/null 2>&1 || echo "lh fail $n"
done; done; done
node "$(dirname "$0")/lh-summary.mjs" "$L" "$(dirname "$0")/../baseline.json"
