#!/bin/bash
# ci-pipeline.sh - Example CI/CD integration with CLI tools

set -e

echo "=== CI Pipeline with LLM Code Review ==="

# Step 1: Get changed files
CHANGED_FILES=$(git diff --name-only HEAD~1 -- '*.py' '*.ts' '*.js' 2>/dev/null || echo "")

if [[ -z "$CHANGED_FILES" ]]; then
    echo "No code files changed, skipping review"
    exit 0
fi

echo "Changed files:"
echo "$CHANGED_FILES"

# Step 2: Review each file
ISSUES_FOUND=0

for file in $CHANGED_FILES; do
    if [[ ! -f "$file" ]]; then
        continue
    fi
    
    echo ""
    echo "--- Reviewing: $file ---"
    
    # Use gemini in headless mode for code review
    REVIEW=$(cat "$file" | timeout 60 gemini -p --output-format json --schema '{
        "type": "object",
        "properties": {
            "issues": {"type": "array", "items": {"type": "string"}},
            "severity": {"type": "string", "enum": ["none", "low", "medium", "high"]},
            "suggestions": {"type": "array", "items": {"type": "string"}}
        }
    }' "Review this code for bugs, security issues, and best practices violations. Be concise.")
    
    # Parse results
    SEVERITY=$(echo "$REVIEW" | jq -r '.severity')
    
    echo "Severity: $SEVERITY"
    echo "Issues: $(echo "$REVIEW" | jq -r '.issues | join(", ")')"
    
    if [[ "$SEVERITY" == "high" ]]; then
        echo "::error file=$file::High severity issues found"
        ISSUES_FOUND=1
    elif [[ "$SEVERITY" == "medium" ]]; then
        echo "::warning file=$file::Medium severity issues found"
    fi
done

# Step 3: Generate summary
echo ""
echo "=== Review Summary ==="

if [[ $ISSUES_FOUND -eq 1 ]]; then
    echo "FAILED: High severity issues detected"
    exit 1
else
    echo "PASSED: No blocking issues"
    exit 0
fi
