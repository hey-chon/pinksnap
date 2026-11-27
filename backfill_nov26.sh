#!/usr/bin/env bash
set -e

TIMES=(
  "2026-11-26 10:15:32"
  "2026-11-26 11:42:19"
  "2026-11-26 14:23:45"
  "2026-11-26 16:08:12"
  "2026-11-26 19:34:50"
  "2026-11-26 21:15:08"
)

echo "Creating 6 backfill commits for November 26, 2026..."

for t in "${TIMES[@]}"; do
  GIT_AUTHOR_DATE="$t" GIT_COMMITTER_DATE="$t" git commit --allow-empty -m "backfill" --quiet
  echo "Committed at $t"
done

echo ""
echo "Recent commits:"
git log -n 6 --format="%h %ad %s" --date=format:"%Y-%m-%d %H:%M:%S"
