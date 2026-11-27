#!/usr/bin/env bash
set -e

echo "=========================================================="
echo " Boosting Backfill Commits to 10+ (Randomized 10-14)       "
echo " Safe Additive Commits - NO reset, NO force push          "
echo " Strict Scope: Backfill days ONLY (Real commits untouched)"
echo "=========================================================="

# 1. Collect all real commit dates to guarantee they are never touched
echo "Scanning real project commits..."
REAL_DATES=$(git log --invert-grep --grep='^backfill$' --all --format="%ad" --date=format:"%Y-%m-%d" | sort -u)

is_real_date() {
  local d="$1"
  echo "$REAL_DATES" | grep -qx "$d"
}

# 2. Collect current backfill commit counts per date
declare -A BACKFILL_COUNTS
while read -r count date; do
  if [ -n "$date" ]; then
    BACKFILL_COUNTS["$date"]=$count
  fi
done < <(git log --all --grep='^backfill$' --format="%ad" --date=format:"%Y-%m-%d" | sort | uniq -c)

TOTAL_DAYS=${#BACKFILL_COUNTS[@]}
echo "Found $TOTAL_DAYS backfilled days to boost."

COMMITS_ADDED=0
DAYS_BOOSTED=0

for DATE in $(echo "${!BACKFILL_COUNTS[@]}" | tr ' ' '\n' | sort); do
  # Strictly guard real commit dates
  if is_real_date "$DATE"; then
    echo "[SKIP] $DATE has real commits - strictly untouched!"
    continue
  fi

  CURRENT="${BACKFILL_COUNTS["$DATE"]}"

  # Target 10 to 14 total commits randomly (10, 11, 12, 13, 14)
  TARGET=$(( 10 + (RANDOM % 5) ))

  if [ "$CURRENT" -lt "$TARGET" ]; then
    ADD=$(( TARGET - CURRENT ))
    NEW_TOTAL=$TARGET
    echo "[BOOST] $DATE: currently $CURRENT -> adding +$ADD commits (New total: $NEW_TOTAL)"

    for (( i=1; i<=ADD; i++ )); do
      # Realistic timestamps spread out from 9 AM to 10 PM
      HOUR=$(( 9 + (RANDOM % 14) ))
      MIN=$(( RANDOM % 60 ))
      SEC=$(( RANDOM % 60 ))
      TIME_STR=$(printf "%02d:%02d:%02d" "$HOUR" "$MIN" "$SEC")
      COMMIT_DATETIME="${DATE} ${TIME_STR}"

      GIT_AUTHOR_DATE="$COMMIT_DATETIME" \
      GIT_COMMITTER_DATE="$COMMIT_DATETIME" \
      git commit --allow-empty -m "backfill" --quiet

      COMMITS_ADDED=$((COMMITS_ADDED + 1))
    done
    DAYS_BOOSTED=$((DAYS_BOOSTED + 1))
  else
    echo "[KEEP]  $DATE already has $CURRENT commits"
  fi
done

echo ""
echo "=========================================================="
echo "Boost Complete!"
echo "Backfilled days upgraded:    $DAYS_BOOSTED"
echo "Total extra commits added:   $COMMITS_ADDED"
echo "Real commit history:         100% UNTOUCHED"
echo "=========================================================="
echo "To publish your boosted contribution graph, run:"
echo "  git push origin $(git branch --show-current)"
