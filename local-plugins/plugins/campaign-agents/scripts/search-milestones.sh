#!/bin/bash
# search-milestones.sh - Search milestone library for relevant step hints
# Usage: search-milestones.sh <domain> [keywords...]
#
# Returns matching milestone patterns as JSON for injection into task specs

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(dirname "$SCRIPT_DIR")"
MILESTONES_DIR="$PLUGIN_ROOT/milestones"

DOMAIN="${1:-}"
shift || true
KEYWORDS="$*"

if [[ -z "$DOMAIN" ]]; then
    echo "Usage: search-milestones.sh <domain> [keywords...]"
    echo "  domain: ui, data, infra, test, devops, docs"
    echo "  keywords: space-separated search terms"
    exit 1
fi

# Find matching milestone files
MATCHES=""

for file in "$MILESTONES_DIR"/*.md; do
    [[ -f "$file" ]] || continue
    [[ "$(basename "$file")" == "README.md" ]] && continue

    # Extract frontmatter domain
    FILE_DOMAIN=$(grep -A1 "^---" "$file" | grep "^domain:" | cut -d: -f2 | tr -d ' ' || echo "")

    # Check domain match
    if [[ "$FILE_DOMAIN" == "$DOMAIN" ]] || [[ "$DOMAIN" == "all" ]]; then
        # If keywords provided, check for matches
        if [[ -n "$KEYWORDS" ]]; then
            MATCHED="false"
            for kw in $KEYWORDS; do
                if grep -qi "$kw" "$file"; then
                    MATCHED="true"
                    break
                fi
            done
            [[ "$MATCHED" == "true" ]] || continue
        fi

        # Extract steps section
        STEPS=$(sed -n '/^## Steps/,/^##/p' "$file" | grep -E '^\d+\.' | sed 's/^[0-9]*\. //' || echo "")

        if [[ -n "$STEPS" ]]; then
            FILENAME=$(basename "$file" .md)
            if [[ -n "$MATCHES" ]]; then
                MATCHES="$MATCHES,"
            fi
            # Escape for JSON
            STEPS_JSON=$(echo "$STEPS" | jq -R -s 'split("\n") | map(select(length > 0))')
            MATCHES="$MATCHES{\"source\":\"$FILENAME\",\"steps\":$STEPS_JSON}"
        fi
    fi
done

# Output as JSON
if [[ -n "$MATCHES" ]]; then
    echo "[$MATCHES]"
else
    echo "[]"
fi
