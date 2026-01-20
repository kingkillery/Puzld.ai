#!/bin/bash
# cleanup-branches.sh - Git branch cleanup for completed campaign tasks
# Usage: cleanup-branches.sh <project_path> [campaign_id]

set -e

PROJECT_PATH="$1"
CAMPAIGN_ID="$2"

if [[ -z "$PROJECT_PATH" ]]; then
    echo "Usage: cleanup-branches.sh <project_path> [campaign_id]"
    exit 1
fi

cd "$PROJECT_PATH"

echo "=== Campaign Branch Cleanup ==="
echo "Project: $PROJECT_PATH"
echo "Campaign: ${CAMPAIGN_ID:-all}"
echo "==============================="

# Get list of campaign branches
if [[ -n "$CAMPAIGN_ID" ]]; then
    PATTERN="campaign/${CAMPAIGN_ID}/task-*"
else
    PATTERN="campaign/*/task-*"
fi

BRANCHES=$(git branch --list "$PATTERN" 2>/dev/null || true)

if [[ -z "$BRANCHES" ]]; then
    echo "No campaign branches found matching pattern: $PATTERN"
    exit 0
fi

echo ""
echo "Found campaign branches:"
echo "$BRANCHES"
echo ""

# Check which branches are merged
MERGED_BRANCHES=$(git branch --merged main --list "$PATTERN" 2>/dev/null || true)

if [[ -z "$MERGED_BRANCHES" ]]; then
    echo "No merged branches to clean up."
    exit 0
fi

echo "Merged branches (safe to delete):"
echo "$MERGED_BRANCHES"
echo ""

# Confirm deletion
read -p "Delete these merged branches? [y/N] " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "$MERGED_BRANCHES" | while read -r branch; do
        branch=$(echo "$branch" | tr -d ' *')
        if [[ -n "$branch" ]]; then
            echo "Deleting: $branch"
            git branch -d "$branch"
        fi
    done
    echo ""
    echo "Cleanup complete."
else
    echo "Cleanup cancelled."
fi
