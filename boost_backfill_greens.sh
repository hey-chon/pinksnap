#!/usr/bin/env bash
set -e

echo "=========================================================="
echo " Boosting Backfill Green Shades                           "
echo " (Safe additive commits - NO reset, NO force push)        "
echo " Commit Message: 'backfill'                               "
echo "=========================================================="

# 1. Collect all real commit dates (to strictly protect them)
echo "Scanning real project commit history..."
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
DAYS_BOOSTED=0

for DATE in $(echo "${!BACKFILL_COUNTS[@]}" | tr ' ' '\n' | sort); do
  # Strictly skip if it is a real commit date
  if is_real_date "$DATE"; then
    echo "[KEEP] $DATE has your real commits - untouched!"
    continue
  fi

  CURRENT="${BACKFILL_COUNTS["$DATE"]}"

  # If it currently only has 1 commit, boost it with +1 or +2 commits
  # so it turns into a vibrant, aesthetic healthy green!
  if [ "$CURRENT" -eq 1 ]; then
    ROLL=$((RANDOM % 100))
    if [ "$ROLL" -lt 50 ]; then
      ADD=1   # becomes 2 commits
    else
      ADD=2   # becomes 3 commits
    fi
  elif [ "$CURRENT" -eq 2 ]; then
    ROLL=$((RANDOM % 100))
    if [ "$ROLL" -lt 40 ]; then
      ADD=1   # becomes 3 commits
    else
      ADD=0   # stays at 2 commits
    fi
  else
    ADD=0     # already 3 or 4, keep as is (not so many)
  fi

  if [ "$ADD" -gt 0 ]; then
    NEW_TOTAL=$((CURRENT + ADD))
    echo "[BOOST] $DATE: currently $CURRENT -> adding +$ADD commit(s) (New: $NEW_TOTAL)"

    for (( i=1; i<=ADD; i++ )); do
      HOUR=$(( 9 + (RANDOM % 12) ))
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
  fi
done

echo ""
echo "=========================================================="
echo "Boost Complete!"
echo "Backfilled days upgraded:    $DAYS_BOOSTED"
echo "Total extra commits added:   $COMMITS_ADDED"
echo "Real commit history:         100% UNTOUCHED"
echo "=========================================================="
echo "Normal push to GitHub (no force push needed):"
echo "  git push origin $(git branch --show-current)"
