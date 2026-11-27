#!/usr/bin/env bash
set -e

echo "=========================================================="
echo " Selective & Random Backfill Booster                      "
echo " - Majority stays as is (light greens: 2-4 commits)       "
echo " - Random ~25% boosted to 9-11 commits (darken greens)    "
echo " - Random ~20% boosted to 5-7 commits (medium greens)     "
echo " - Real commits: 100% untouched                           "
echo " - Blank days: 100% untouched                             "
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

COMMITS_ADDED=0
STAY_AS_IS=0
MEDIUM_BOOSTED=0
DARKEN_BOOSTED=0

for DATE in $(echo "${!BACKFILL_COUNTS[@]}" | tr ' ' '\n' | sort); do
  # Strictly guard real commit dates
  if is_real_date "$DATE"; then
    continue
  fi

  CURRENT="${BACKFILL_COUNTS["$DATE"]}"
  ROLL=$((RANDOM % 100))

  if [ "$ROLL" -lt 25 ]; then
    # ~25% chance: Darken green (Target 9-11 commits)
    TARGET=$(( 9 + (RANDOM % 3) ))
    ADD=$(( TARGET - CURRENT ))
    if [ "$ADD" -gt 0 ]; then
      echo "[DARKEN]  $DATE: currently $CURRENT -> adding +$ADD (New total: $TARGET)"
      DARKEN_BOOSTED=$((DARKEN_BOOSTED + 1))
    else
      ADD=0
      STAY_AS_IS=$((STAY_AS_IS + 1))
    fi
  elif [ "$ROLL" -lt 45 ]; then
    # ~20% chance: Medium green (Target 5-7 commits)
    TARGET=$(( 5 + (RANDOM % 3) ))
    ADD=$(( TARGET - CURRENT ))
    if [ "$ADD" -gt 0 ]; then
      echo "[MEDIUM]  $DATE: currently $CURRENT -> adding +$ADD (New total: $TARGET)"
      MEDIUM_BOOSTED=$((MEDIUM_BOOSTED + 1))
    else
      ADD=0
      STAY_AS_IS=$((STAY_AS_IS + 1))
    fi
  else
    # ~55% chance: Stay as is!
    ADD=0
    echo "[AS IS]   $DATE: stays at $CURRENT commits"
    STAY_AS_IS=$((STAY_AS_IS + 1))
  fi

  if [ "$ADD" -gt 0 ]; then
    for (( i=1; i<=ADD; i++ )); do
      HOUR=$(( 9 + (RANDOM % 13) ))
      MIN=$(( RANDOM % 60 ))
      SEC=$(( RANDOM % 60 ))
      TIME_STR=$(printf "%02d:%02d:%02d" "$HOUR" "$MIN" "$SEC")
      COMMIT_DATETIME="${DATE} ${TIME_STR}"

      GIT_AUTHOR_DATE="$COMMIT_DATETIME" \
      GIT_COMMITTER_DATE="$COMMIT_DATETIME" \
      git commit --allow-empty -m "backfill" --quiet

      COMMITS_ADDED=$((COMMITS_ADDED + 1))
    done
  fi
done

echo ""
echo "=========================================================="
echo "Selective Boost Complete!"
echo "Days stayed as is (2-4 commits): $STAY_AS_IS"
echo "Days medium boosted (5-7 commits): $MEDIUM_BOOSTED"
echo "Days darkened (9-11 commits):     $DARKEN_BOOSTED"
echo "Total extra commits added:        $COMMITS_ADDED"
echo "Real commits:                     100% UNTOUCHED"
echo "=========================================================="
echo "To push to GitHub, run:"
echo "  git push origin $(git branch --show-current)"
