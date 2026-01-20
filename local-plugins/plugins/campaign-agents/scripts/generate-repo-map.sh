#!/bin/bash
# generate-repo-map.sh - Generate compressed AST representation for planners
# Usage: generate-repo-map.sh <project_path> [output_file]
#
# Creates a "Repo Map" - a lightweight representation of the codebase
# containing file tree, class names, function signatures, and docstrings.
# This allows planners to understand large codebases without token overflow.

set -e

PROJECT_PATH="${1:-.}"
OUTPUT_FILE="${2:-repo-map.md}"

cd "$PROJECT_PATH"

echo "# Repository Map" > "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "Generated: $(date -Iseconds)" >> "$OUTPUT_FILE"
echo "Project: $(basename $(pwd))" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# ============================================
# SECTION 1: Directory Structure
# ============================================
echo "## Directory Structure" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo '```' >> "$OUTPUT_FILE"

# Use tree if available, otherwise find
if command -v tree &> /dev/null; then
    tree -I 'node_modules|.git|__pycache__|.venv|dist|build|*.pyc' --dirsfirst -L 4 >> "$OUTPUT_FILE"
else
    find . -type f \
        -not -path '*/node_modules/*' \
        -not -path '*/.git/*' \
        -not -path '*/__pycache__/*' \
        -not -path '*/.venv/*' \
        -not -name '*.pyc' \
        | head -200 \
        | sort >> "$OUTPUT_FILE"
fi

echo '```' >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# ============================================
# SECTION 2: Python Signatures (if Python project)
# ============================================
if ls *.py &> /dev/null || ls **/*.py &> /dev/null 2>/dev/null; then
    echo "## Python Module Signatures" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"

    find . -name "*.py" -not -path '*/.*' -not -path '*/__pycache__/*' -not -path '*/.venv/*' | while read -r pyfile; do
        echo "### \`$pyfile\`" >> "$OUTPUT_FILE"
        echo '```python' >> "$OUTPUT_FILE"

        # Extract class definitions and function signatures
        grep -E "^(class |def |async def |    def |    async def )" "$pyfile" 2>/dev/null | head -50 >> "$OUTPUT_FILE" || true

        echo '```' >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
    done
fi

# ============================================
# SECTION 3: TypeScript/JavaScript Signatures
# ============================================
if ls *.ts &> /dev/null || ls **/*.ts &> /dev/null 2>/dev/null || ls *.tsx &> /dev/null 2>/dev/null; then
    echo "## TypeScript/JavaScript Signatures" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"

    find . \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
        -not -path '*/node_modules/*' \
        -not -path '*/dist/*' \
        -not -path '*/.next/*' | while read -r tsfile; do

        echo "### \`$tsfile\`" >> "$OUTPUT_FILE"
        echo '```typescript' >> "$OUTPUT_FILE"

        # Extract exports, interfaces, types, functions, classes
        grep -E "^(export |interface |type |class |function |const .* = |async function )" "$tsfile" 2>/dev/null | head -50 >> "$OUTPUT_FILE" || true

        echo '```' >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
    done
fi

# ============================================
# SECTION 4: Package Dependencies
# ============================================
echo "## Dependencies" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Python dependencies
if [ -f "requirements.txt" ]; then
    echo "### Python (requirements.txt)" >> "$OUTPUT_FILE"
    echo '```' >> "$OUTPUT_FILE"
    cat requirements.txt | head -30 >> "$OUTPUT_FILE"
    echo '```' >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
fi

if [ -f "pyproject.toml" ]; then
    echo "### Python (pyproject.toml)" >> "$OUTPUT_FILE"
    echo '```toml' >> "$OUTPUT_FILE"
    grep -A 50 "\[project.dependencies\]" pyproject.toml 2>/dev/null | head -30 >> "$OUTPUT_FILE" || true
    echo '```' >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
fi

# Node dependencies
if [ -f "package.json" ]; then
    echo "### Node.js (package.json)" >> "$OUTPUT_FILE"
    echo '```json' >> "$OUTPUT_FILE"
    # Extract just dependencies section
    python3 -c "import json; d=json.load(open('package.json')); print(json.dumps({k:d.get(k,{}) for k in ['dependencies','devDependencies']}, indent=2))" 2>/dev/null >> "$OUTPUT_FILE" || cat package.json | head -50 >> "$OUTPUT_FILE"
    echo '```' >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
fi

# ============================================
# SECTION 5: Key Configuration Files
# ============================================
echo "## Configuration Files" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

for config in tsconfig.json .eslintrc* .prettierrc* Dockerfile docker-compose.yml .env.example; do
    if [ -f "$config" ]; then
        echo "### \`$config\`" >> "$OUTPUT_FILE"
        echo '```' >> "$OUTPUT_FILE"
        head -30 "$config" >> "$OUTPUT_FILE"
        echo '```' >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
    fi
done

# ============================================
# SECTION 6: Test Structure
# ============================================
echo "## Test Files" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo '```' >> "$OUTPUT_FILE"
find . \( -name "test_*.py" -o -name "*_test.py" -o -name "*.test.ts" -o -name "*.spec.ts" \) \
    -not -path '*/node_modules/*' 2>/dev/null | head -30 >> "$OUTPUT_FILE" || echo "No test files found" >> "$OUTPUT_FILE"
echo '```' >> "$OUTPUT_FILE"

# ============================================
# SECTION 7: Summary Statistics
# ============================================
echo "" >> "$OUTPUT_FILE"
echo "## Statistics" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

PY_COUNT=$(find . -name "*.py" -not -path '*/.*' -not -path '*/__pycache__/*' 2>/dev/null | wc -l)
TS_COUNT=$(find . \( -name "*.ts" -o -name "*.tsx" \) -not -path '*/node_modules/*' 2>/dev/null | wc -l)
JS_COUNT=$(find . \( -name "*.js" -o -name "*.jsx" \) -not -path '*/node_modules/*' 2>/dev/null | wc -l)
TOTAL_LINES=$(find . \( -name "*.py" -o -name "*.ts" -o -name "*.tsx" -o -name "*.js" \) -not -path '*/node_modules/*' -not -path '*/__pycache__/*' -exec cat {} \; 2>/dev/null | wc -l)

echo "| Metric | Count |" >> "$OUTPUT_FILE"
echo "|--------|-------|" >> "$OUTPUT_FILE"
echo "| Python files | $PY_COUNT |" >> "$OUTPUT_FILE"
echo "| TypeScript files | $TS_COUNT |" >> "$OUTPUT_FILE"
echo "| JavaScript files | $JS_COUNT |" >> "$OUTPUT_FILE"
echo "| Total source lines | $TOTAL_LINES |" >> "$OUTPUT_FILE"

echo ""
echo "Repo map generated: $OUTPUT_FILE"
echo "Size: $(wc -c < "$OUTPUT_FILE") bytes"
