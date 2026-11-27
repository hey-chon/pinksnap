#!/usr/bin/env bash
set -e

# Configuration: defaults to 2026, June 1 to September 30
YEAR="${1:-2026}"
START_DATE="${2:-${YEAR}-06-01}"
END_DATE="${3:-${YEAR}-09-30}"

echo "=========================================================="
echo " GitHub Contribution Backfill (Realistic / Scattered)     "
echo " Target Year: $YEAR                                       "
echo " Range: $START_DATE to $END_DATE                          "
echo " Commit Message: 'backfill'                               "
echo " Mode: Natural random blanks (not 100% solid green)       "
echo "=========================================================="

# 1. Collect all dates that already have commits (YYYY-MM-DD)
echo "Scanning existing commit history to preserve green days..."
EXISTING_DATES=$(git log --all --format="%ad" --date=format:"%Y-%m-%d" | sort -u)

has_commit() {
  local target_date="$1"
  echo "$EXISTING_DATES" | grep -qx "$target_date"
}

# Cross-platform date advancement helper
advance_one_day() {
  local d="$1"
  if date -d "2020-01-01 + 1 day" >/dev/null 2>&1; then
    date -d "$d + 1 day" +%Y-%m-%d
  else
    date -j -v+1d -f "%Y-%m-%d" "$d" +%Y-%m-%d
  fi
}

# Get day of week (1=Monday ... 7=Sunday)
get_day_of_week() {
  local d="$1"
  if date -d "2020-01-01" +%u >/dev/null 2>&1; then
    date -d "$d" +%u
  else
    date -j -f "%Y-%m-%d" "$d" +%u
  fi
}

CURRENT_DATE="$START_DATE"
TOTAL_COMMITS_CREATED=0
ALREADY_COMMITTED_DAYS=0
NATURAL_BLANK_DAYS=0
BACKFILLED_DAYS=0

while true; do
  if [[ "$CURRENT_DATE" > "$END_DATE" ]]; then
    break
  fi

  # Check if day already has contributions in Git history
  if has_commit "$CURRENT_DATE"; then
    echo "[KEEP] $CURRENT_DATE already has existing commits - keeping untouched"
    ALREADY_COMMITTED_DAYS=$((ALREADY_COMMITTED_DAYS + 1))
    CURRENT_DATE=$(advance_one_day "$CURRENT_DATE")
    continue
  fi

  DOW=$(get_day_of_week "$CURRENT_DATE")
  ROLL=$((RANDOM % 100))

  # Natural contribution probability:
  # Weekdays (Mon-Fri, 1-5): ~72% chance of work, ~28% left blank
  # Weekends (Sat-Sun, 6-7): ~38% chance of work, ~62% left blank
  if [ "$DOW" -ge 6 ]; then
    CHANCE=38
  else
    CHANCE=72
  fi

  if [ "$ROLL" -ge "$CHANCE" ]; then
    echo "[SKIP] $CURRENT_DATE intentionally left blank (natural rest day)"
    NATURAL_BLANK_DAYS=$((NATURAL_BLANK_DAYS + 1))
    CURRENT_DATE=$(advance_one_day "$CURRENT_DATE")
    continue
  fi

  # Determine number of commits for this active day (1 to 3 for realistic shade depth)
  NUM_ROLL=$((RANDOM % 100))
  if [ "$NUM_ROLL" -lt 65 ]; then
    COUNT=1
  elif [ "$NUM_ROLL" -lt 88 ]; then
    COUNT=2
  else
    COUNT=3
  fi

  echo "[FILL] $CURRENT_DATE -> generating $COUNT commit(s)..."

  for (( i=1; i<=COUNT; i++ )); do
    # Generate realistic timestamps across daytime hours
    HOUR=$(( 9 + (RANDOM % 12) )) # between 09:00 and 20:59
    MIN=$(( RANDOM % 60 ))
    SEC=$(( RANDOM % 60 ))
    TIME_STR=$(printf "%02d:%02d:%02d" "$HOUR" "$MIN" "$SEC")
    COMMIT_DATETIME="${CURRENT_DATE} ${TIME_STR}"

    GIT_AUTHOR_DATE="$COMMIT_DATETIME" \
    GIT_COMMITTER_DATE="$COMMIT_DATETIME" \
    git commit --allow-empty -m "backfill" --quiet

    TOTAL_COMMITS_CREATED=$((TOTAL_COMMITS_CREATED + 1))
  done

  BACKFILLED_DAYS=$((BACKFILLED_DAYS + 1))
  CURRENT_DATE=$(advance_one_day "$CURRENT_DATE")
done

echo ""
echo "=========================================================="
echo "Backfill Complete!"
echo "Days already preserved (green): $ALREADY_COMMITTED_DAYS"
echo "Days naturally left blank:      $NATURAL_BLANK_DAYS"
echo "New active days added:          $BACKFILLED_DAYS"
echo "Total 'backfill' commits made:  $TOTAL_COMMITS_CREATED"
echo "=========================================================="
echo "Push your updates to GitHub when ready:"
echo "  git push origin $(git branch --show-current)"
