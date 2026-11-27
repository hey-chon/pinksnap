#!/usr/bin/env bash
set -e

# Configuration: defaults to April 1 to June 30, 2026
START_DATE="${1:-2026-04-01}"
END_DATE="${2:-2026-06-30}"

echo "=========================================================="
echo " GitHub Contribution Randomizer                           "
echo " Range: $START_DATE to $END_DATE                          "
echo " Target: Diversify 1-commit days into varied shades (1-4) "
echo " Commit Message: 'backfill'                               "
echo "=========================================================="

echo "Analyzing existing commit counts per date..."
declare -A COMMIT_COUNTS

while read -r count date; do
  if [ -n "$date" ]; then
    COMMIT_COUNTS["$date"]=$count
  fi
done < <(git log --all --format="%ad" --date=format:"%Y-%m-%d" | sort | uniq -c)

# Cross-platform date advancement helper
advance_one_day() {
  local d="$1"
  if date -d "2020-01-01 + 1 day" >/dev/null 2>&1; then
    date -d "$d + 1 day" +%Y-%m-%d
  else
    date -j -v+1d -f "%Y-%m-%d" "$d" +%Y-%m-%d
  fi
}

CURRENT_DATE="$START_DATE"
DAYS_MODIFIED=0
DAYS_LEFT_AS_ONE=0
BLANK_DAYS_PRESERVED=0
EXTRA_COMMITS_TOTAL=0

while true; do
  if [[ "$CURRENT_DATE" > "$END_DATE" ]]; then
    break
  fi

  EXISTING_COUNT="${COMMIT_COUNTS["$CURRENT_DATE"]:-0}"

  if [ "$EXISTING_COUNT" -eq 0 ]; then
    # Keep blank days untouched
    BLANK_DAYS_PRESERVED=$((BLANK_DAYS_PRESERVED + 1))
    CURRENT_DATE=$(advance_one_day "$CURRENT_DATE")
    continue
  fi

  # For days that currently have 1 commit, randomly add 0 to 3 extra commits
  # (Total per day will be 1 to 4 commits, realistic varied shades)
  if [ "$EXISTING_COUNT" -eq 1 ]; then
    ROLL=$((RANDOM % 100))
    if [ "$ROLL" -lt 25 ]; then
      EXTRA=0  # stays at 1 commit (light green)
    elif [ "$ROLL" -lt 60 ]; then
      EXTRA=1  # 2 commits total (medium-light green)
    elif [ "$ROLL" -lt 85 ]; then
      EXTRA=2  # 3 commits total (medium green)
    else
      EXTRA=3  # 4 commits total (dark green)
    fi
  elif [ "$EXISTING_COUNT" -eq 2 ]; then
    ROLL=$((RANDOM % 100))
    if [ "$ROLL" -lt 50 ]; then
      EXTRA=0
    else
      EXTRA=1
    fi
  else
    EXTRA=0
  fi

  if [ "$EXTRA" -eq 0 ]; then
    DAYS_LEFT_AS_ONE=$((DAYS_LEFT_AS_ONE + 1))
    CURRENT_DATE=$(advance_one_day "$CURRENT_DATE")
    continue
  fi

  NEW_TOTAL=$((EXISTING_COUNT + EXTRA))
  echo "[VARIED] $CURRENT_DATE: adding +$EXTRA commit(s) (Total will be $NEW_TOTAL)"

  for (( i=1; i<=EXTRA; i++ )); do
    # Realistic daytime timestamps between 09:00 and 20:59
    HOUR=$(( 9 + (RANDOM % 12) ))
    MIN=$(( RANDOM % 60 ))
    SEC=$(( RANDOM % 60 ))
    TIME_STR=$(printf "%02d:%02d:%02d" "$HOUR" "$MIN" "$SEC")
    COMMIT_DATETIME="${CURRENT_DATE} ${TIME_STR}"

    GIT_AUTHOR_DATE="$COMMIT_DATETIME" \
    GIT_COMMITTER_DATE="$COMMIT_DATETIME" \
    git commit --allow-empty -m "backfill" --quiet

    EXTRA_COMMITS_TOTAL=$((EXTRA_COMMITS_TOTAL + 1))
  done

  DAYS_MODIFIED=$((DAYS_MODIFIED + 1))
  CURRENT_DATE=$(advance_one_day "$CURRENT_DATE")
done

echo ""
echo "=========================================================="
echo "Randomization Complete!"
echo "Days upgraded to higher shades (2-4 commits): $DAYS_MODIFIED"
echo "Days kept at 1 commit (subtle green):         $DAYS_LEFT_AS_ONE"
echo "Blank days preserved (zero commits):          $BLANK_DAYS_PRESERVED"
echo "Total extra 'backfill' commits added:         $EXTRA_COMMITS_TOTAL"
echo "=========================================================="
echo "Push to GitHub to see the new varied heatmap:"
echo "  git push origin $(git branch --show-current)"
