#!/bin/bash
# wrap-extract.sh - Structured data extraction with schema validation
# Extracts structured JSON using AI CLI tools with schema enforcement

set -euo pipefail

# Configuration
TIMEOUT_SECONDS="${CLI_TIMEOUT:-120}"
MAX_INPUT_BYTES="${CLI_MAX_INPUT:-10485760}"
ALLOWED_SCHEMA_DIR="${CLI_SCHEMA_DIR:-.}"

usage() {
    echo "Usage: $0 <tool> <schema_file> [input or use stdin]"
    echo "Tools: gemini, claude, ollama"
    echo ""
    echo "Example:"
    echo "  $0 gemini ./schemas/person.json 'John is 30 years old'"
    echo "  cat data.txt | $0 gemini ./schemas/person.json"
    exit 1
}

validate_tool() {
    local tool="$1"
    if [[ ! "$tool" =~ ^[a-zA-Z0-9_-]+$ ]]; then
        echo "Error: Invalid tool name" >&2
        exit 1
    fi
}

validate_schema_path() {
    local schema_path="$1"
    local resolved_path
    local allowed_dir
    
    # Resolve to absolute paths
    resolved_path=$(realpath "$schema_path" 2>/dev/null) || {
        echo "Error: Schema file not found: $schema_path" >&2
        exit 1
    }
    allowed_dir=$(realpath "$ALLOWED_SCHEMA_DIR" 2>/dev/null) || allowed_dir="$PWD"
    
    # Check path traversal
    if [[ "$resolved_path" != "$allowed_dir"* ]]; then
        echo "Error: Schema must be within allowed directory: $allowed_dir" >&2
        exit 1
    fi
    
    echo "$resolved_path"
}

[[ $# -lt 2 ]] && usage

TOOL="$1"
SCHEMA_FILE="$2"
shift 2

validate_tool "$TOOL"
VALIDATED_SCHEMA=$(validate_schema_path "$SCHEMA_FILE")
SCHEMA=$(cat "$VALIDATED_SCHEMA")

# Get input from argument or stdin
if [[ $# -gt 0 ]]; then
    INPUT="$*"
else
    INPUT=$(head -c "$MAX_INPUT_BYTES")
fi

if [[ -z "$INPUT" ]]; then
    echo "Error: No input provided" >&2
    exit 1
fi

PROMPT="Extract structured data from this input according to the schema. Input: $INPUT"

# Build command based on tool
case "$TOOL" in
    gemini)
        timeout "$TIMEOUT_SECONDS" gemini -p --output-format json --schema "$SCHEMA" "$PROMPT"
        ;;
    claude)
        timeout "$TIMEOUT_SECONDS" claude -p --output-format json "$PROMPT

Schema to follow: $SCHEMA"
        ;;
    ollama)
        MODEL="${OLLAMA_MODEL:-llama2}"
        timeout "$TIMEOUT_SECONDS" ollama run "$MODEL" --format json "$PROMPT

Output must match this JSON schema: $SCHEMA"
        ;;
    *)
        echo "Error: Extraction not supported for: $TOOL" >&2
        echo "Supported: gemini, claude, ollama" >&2
        exit 1
        ;;
esac
