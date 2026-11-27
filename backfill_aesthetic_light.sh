#!/usr/bin/env bash
set -e

# Configuration
YEAR="${1:-2026}"
START_DATE="${2:-${YEAR}-04-01}"
END_DATE="${3:-${YEAR}-09-30}"

echo "=========================================================="
echo " GitHub Aesthetic Light-Green Backfill                   "
echo " Range: $START_DATE to $END_DATE                          "
echo " Target: Sweet-spot medium-light green (mostly 2 commits) "
echo " No dark green: Capped at max 2 commits per day           "
echo " Commit Message: 'backfill'                               "
echo "=========================================================="

# 1. Collect all real non-backfill commit dates in history
echo "Scanning real project commit history..."
REAL_COMMIT_DATES=$(git log --invert-grep --grep='^backfill$' --all --format="%ad" --date=format:"%Y-%m-%d" | sort -u)

has_real_commit() {
  local target_date="$1"
  echo "$REAL_COMMIT_DATES" | grep -qx "$target_date"
}

advance_one_day() {
  local d="$1"
  if date -d "2020-01-01 + 1 day" >/dev/null 2>&1; then
    date -d "$d + 1 day" +%Y-%m-%d
  else
    date -j -v+1d -f "%Y-%m-%d" "$d" +%Y-%m-%d
  fi
}

get_day_of_week() {
  local d="$1"
  if date -d "2020-01-01" +%u >/dev/null 2>&1; then
    date -d "$d" +%u
  else
    date -j -f "%Y-%m-%d" "$d" +%u
  fi
}

CURRENT_DATE="$START_DATE"
REAL_DAYS_SKIPPED=0
NATURAL_BLANKS=0
ACTIVE_DAYS=0
TOTAL_COMMITS=0

while true; do
  if [[ "$CURRENT_DATE" > "$END_DATE" ]]; then
    break
  fi

  # 1. Strictly keep real project commit days untouched
  if has_real_commit "$CURRENT_DATE"; then
    echo "[REAL] $CURRENT_DATE has real project commits - keeping untouched"
    REAL_DAYS_SKIPPED=$((REAL_DAYS_SKIPPED + 1))
    CURRENT_DATE=$(advance_one_day "$CURRENT_DATE")
    continue
  fi

  DOW=$(get_day_of_week "$CURRENT_DATE")
  ROLL=$((RANDOM % 100))

  # Natural scatter: Weekdays ~75% active, Weekends ~40% active
  if [ "$DOW" -ge 6 ]; then
    CHANCE=40
  else
    CHANCE=75
  fi

  if [ "$ROLL" -ge "$CHANCE" ]; then
    echo "[BLANK] $CURRENT_DATE left blank (natural rest day)"
    NATURAL_BLANKS=$((NATURAL_BLANKS + 1))
    CURRENT_DATE=$(advance_one_day "$CURRENT_DATE")
    continue
  fi

  # Active day count:
  # 80% chance of 2 commits (the perfect medium-light green level)
  # 20% chance of 1 commit (subtle soft green)
  # Never 3 or 4+ commits -> ensures it NEVER turns dark!
  NUM_ROLL=$((RANDOM % 100))
  if [ "$NUM_ROLL" -lt 20 ]; then
    COMMITS_FOR_DAY=1
  else
    COMMITS_FOR_DAY=2
  fi

  echo "[LIGHT-GREEN] $CURRENT_DATE -> $COMMITS_FOR_DAY commit(s)"

  for (( i=1; i<=COMMITS_FOR_DAY; i++ )); do
    # Daytime hours between 10:00 and 19:00
    HOUR=$(( 10 + (RANDOM % 9) ))
    MIN=$(( RANDOM % 60 ))
    SEC=$(( RANDOM % 60 ))
    TIME_STR=$(printf "%02d:%02d:%02d" "$HOUR" "$MIN" "$SEC")
    COMMIT_DATETIME="${CURRENT_DATE} ${TIME_STR}"

    GIT_AUTHOR_DATE="$COMMIT_DATETIME" \
    GIT_COMMITTER_DATE="$COMMIT_DATETIME" \
    git commit --allow-empty -m "backfill" --quiet

    TOTAL_COMMITS=$((TOTAL_COMMITS + 1))
  done

  ACTIVE_DAYS=$((ACTIVE_DAYS + 1))
  CURRENT_DATE=$(advance_one_day "$CURRENT_DATE")
done

echo ""
echo "=========================================================="
echo "Aesthetic Light Backfill Completed!"
echo "Real project days preserved:  $REAL_DAYS_SKIPPED"
echo "Natural blank rest days:      $NATURAL_BLANKS"
echo "Active light-green days:      $ACTIVE_DAYS"
echo "Total 'backfill' commits:     $TOTAL_COMMITS"
echo "=========================================================="
echo "Next step: push force to replace the dark commits on GitHub:"
echo "  git push --force origin $(git branch --show-current)"
