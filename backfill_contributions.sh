#!/usr/bin/env bash
set -e

# Configuration: defaults to 2026 (or pass a different year, e.g. ./backfill_contributions.sh 2026)
YEAR="${1:-2026}"
START_DATE="${YEAR}-04-01"
END_DATE="${YEAR}-06-30"

echo "============================================="
echo " GitHub Contribution Backfill (April - June) "
echo " Target Year: $YEAR"
echo " Range: $START_DATE to $END_DATE"
echo " Commit Message: 'backfill'"
echo "============================================="

# 1. Collect all dates that already have commits (YYYY-MM-DD)
echo "Checking existing commit dates in repository..."
EXISTING_DATES=$(git log --all --format="%ad" --date=format:"%Y-%m-%d" | sort -u)

# Function to check whether date already has commits
has_commit() {
  local target_date="$1"
  echo "$EXISTING_DATES" | grep -qx "$target_date"
}

# Cross-platform date advancement helper
advance_one_day() {
  local d="$1"
  if date -d "2020-01-01 + 1 day" >/dev/null 2>&1; then
    # GNU date (Linux, Git Bash on Windows)
    date -d "$d + 1 day" +%Y-%m-%d
  else
    # BSD date (macOS)
    date -j -v+1d -f "%Y-%m-%d" "$d" +%Y-%m-%d
  fi
}

CURRENT_DATE="$START_DATE"
COMMITS_MADE=0
SKIPPED_DAYS=0

while true; do
  # Check if we have passed the end date
  if [[ "$CURRENT_DATE" > "$END_DATE" ]]; then
    break
  fi

  if has_commit "$CURRENT_DATE"; then
    echo "[-] Skipping $CURRENT_DATE (already has commits)"
    SKIPPED_DAYS=$((SKIPPED_DAYS + 1))
  else
    echo "[+] Backfilling $CURRENT_DATE..."
    COMMIT_DATETIME="${CURRENT_DATE} 12:00:00"
    GIT_AUTHOR_DATE="$COMMIT_DATETIME" \
    GIT_COMMITTER_DATE="$COMMIT_DATETIME" \
    git commit --allow-empty -m "backfill" --quiet
    COMMITS_MADE=$((COMMITS_MADE + 1))
  fi

  CURRENT_DATE=$(advance_one_day "$CURRENT_DATE")
done

echo "============================================="
echo "Completed successfully!"
echo "New backfill commits made: $COMMITS_MADE"
echo "Existing green days skipped: $SKIPPED_DAYS"
echo "============================================="
echo "To reflect on your GitHub profile, run:"
echo "  git push origin $(git branch --show-current)"
