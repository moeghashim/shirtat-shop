#!/usr/bin/env bash
# Read-only: is this URL worth driving?  usage: doctor.sh [BASE_URL]
set -uo pipefail
B="${1:-https://shirtat.co}"; fail=0
for p in / /ar /collections/kids /collections/baby /making-of /roadmap /cart; do
  c=$(curl -s -o /dev/null -w '%{http_code}' -L "$B$p"); echo "$c $p"; [ "$c" = 200 ] || fail=1
done
command -v google-chrome >/dev/null || { echo "google-chrome missing"; fail=1; }
[ $fail = 0 ] && echo DOCTOR OK || echo "DOCTOR FAIL (protected preview? see SKILL.md)"; exit $fail
