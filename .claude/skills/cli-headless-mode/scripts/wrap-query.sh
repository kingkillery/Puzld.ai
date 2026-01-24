#!/bin/bash
# wrap-query.sh - Universal CLI query wrapper with security hardening
# Supports: gemini, claude, ollama, codex, crush, droid

set -euo pipefail

# Configuration
TIMEOUT_SECONDS="${CLI_TIMEOUT:-60}"
MAX_PROMPT_LENGTH="${CLI_MAX_PROMPT:-100000}"

usage() {
    echo "Usage: $0 <tool> [options] <prompt>"
    echo "Tools: gemini, claude, ollama, codex, crush, droid"
    echo "Options:"
    echo "  --json        Output as JSON"
    echo "  --stream      Output as streaming JSON"
    echo "  --timeout N   Timeout in seconds (default: 60)"
    exit 1
}

# Validate tool name (alphanumeric only)
validate_tool() {
    local tool="$1"
    if [[ ! "$tool" =~ ^[a-zA-Z0-9_-]+$ ]]; then
        echo "Error: Invalid tool name" >&2
        exit 1
    fi
}

# Validate environment variables
validate_env() {
    local var_name="$1"
    local var_value="${!var_name:-}"
    if [[ -n "$var_value" && ! "$var_value" =~ ^[a-zA-Z0-9._-]+$ ]]; then
        echo "Error: Invalid $var_name value" >&2
        exit 1
    fi
}

[[ $# -lt 2 ]] && usage

TOOL="$1"
shift
validate_tool "$TOOL"

OUTPUT_FORMAT="text"
while [[ $# -gt 0 ]]; do
    case $1 in
        --json) OUTPUT_FORMAT="json"; shift ;;
        --stream) OUTPUT_FORMAT="stream"; shift ;;
        --timeout) TIMEOUT_SECONDS="$2"; shift 2 ;;
        -*) echo "Unknown option: $1" >&2; usage ;;
        *) break ;;
    esac
done

PROMPT="$*"
[[ -z "$PROMPT" ]] && { echo "Error: No prompt provided" >&2; exit 1; }

# Validate prompt length
if [[ ${#PROMPT} -gt $MAX_PROMPT_LENGTH ]]; then
    echo "Error: Prompt exceeds maximum length ($MAX_PROMPT_LENGTH)" >&2
    exit 1
fi

# Build command based on tool
case "$TOOL" in
    gemini)
        CMD=(gemini -p)
        [[ "$OUTPUT_FORMAT" == "json" ]] && CMD+=(--output-format json)
        [[ "$OUTPUT_FORMAT" == "stream" ]] && CMD+=(--output-format stream-json)
        ;;
    claude)
        CMD=(claude -p)
        [[ "$OUTPUT_FORMAT" == "json" ]] && CMD+=(--output-format json)
        [[ "$OUTPUT_FORMAT" == "stream" ]] && CMD+=(--output-format stream-json)
        ;;
    ollama)
        validate_env "OLLAMA_MODEL"
        MODEL="${OLLAMA_MODEL:-llama2}"
        CMD=(ollama run "$MODEL")
        [[ "$OUTPUT_FORMAT" == "json" ]] && CMD+=(--format json)
        ;;
    codex)
        CMD=(codex --approval-mode full-auto)
        ;;
    crush)
        CMD=(crush -p)
        [[ "$OUTPUT_FORMAT" == "json" ]] && CMD+=(--output-format json)
        ;;
    droid)
        CMD=(droid --non-interactive)
        ;;
    *)
        echo "Error: Unknown tool: $TOOL" >&2
        echo "Supported: gemini, claude, ollama, codex, crush, droid" >&2
        exit 1
        ;;
esac

# Execute with timeout using printf for safe input handling
CMD+=("$PROMPT")
timeout "$TIMEOUT_SECONDS" "${CMD[@]}" || {
    exit_code=$?
    if [[ $exit_code -eq 124 ]]; then
        echo "Error: Command timed out after ${TIMEOUT_SECONDS}s" >&2
    fi
    exit $exit_code
}
