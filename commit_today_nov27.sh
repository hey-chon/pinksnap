#!/usr/bin/env bash
set -e

TIMES=(
  "2026-11-27 10:20:15"
  "2026-11-27 12:15:40"
  "2026-11-27 14:45:10"
  "2026-11-27 16:30:22"
  "2026-11-27 18:10:05"
)

echo "Creating commits for TODAY (November 27, 2026)..."

for t in "${TIMES[@]}"; do
  GIT_AUTHOR_DATE="$t" GIT_COMMITTER_DATE="$t" git commit --allow-empty -m "backfill" --quiet
  echo "Committed at $t"
done

echo ""
echo "Recent commits:"
git log -n 5 --format="%h %ad %s" --date=format:"%Y-%m-%d %H:%M:%S"
