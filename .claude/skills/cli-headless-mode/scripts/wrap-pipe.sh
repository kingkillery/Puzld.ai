#!/bin/bash
# wrap-pipe.sh - Pipe-based CLI wrapper with security hardening
# Reads from stdin and passes to AI CLI tool

set -euo pipefail

# Configuration
TIMEOUT_SECONDS="${CLI_TIMEOUT:-60}"
MAX_INPUT_BYTES="${CLI_MAX_INPUT:-10485760}"  # 10MB default

usage() {
    echo "Usage: echo 'input' | $0 <tool> [context_prompt]"
    echo "Tools: gemini, claude, ollama, crush"
    exit 1
}

validate_tool() {
    local tool="$1"
    if [[ ! "$tool" =~ ^[a-zA-Z0-9_-]+$ ]]; then
        echo "Error: Invalid tool name" >&2
        exit 1
    fi
}

validate_env() {
    local var_name="$1"
    local var_value="${!var_name:-}"
    if [[ -n "$var_value" && ! "$var_value" =~ ^[a-zA-Z0-9._-]+$ ]]; then
        echo "Error: Invalid $var_name value" >&2
        exit 1
    fi
}

[[ $# -lt 1 ]] && usage

TOOL="$1"
CONTEXT="${2:-Analyze the following:}"
validate_tool "$TOOL"

# Read stdin with size limit
INPUT=$(head -c "$MAX_INPUT_BYTES")
INPUT_SIZE=${#INPUT}

if [[ $INPUT_SIZE -ge $MAX_INPUT_BYTES ]]; then
    echo "Warning: Input truncated to ${MAX_INPUT_BYTES} bytes" >&2
fi

if [[ -z "$INPUT" ]]; then
    echo "Error: No input provided via stdin" >&2
    exit 1
fi

# Build command based on tool
case "$TOOL" in
    gemini)
        CMD=(gemini -p "$CONTEXT")
        ;;
    claude)
        CMD=(claude -p "$CONTEXT")
        ;;
    ollama)
        validate_env "OLLAMA_MODEL"
        MODEL="${OLLAMA_MODEL:-llama2}"
        CMD=(ollama run "$MODEL" "$CONTEXT")
        ;;
    crush)
        CMD=(crush -p "$CONTEXT")
        ;;
    *)
        echo "Error: Unknown tool: $TOOL" >&2
        echo "Supported for piping: gemini, claude, ollama, crush" >&2
        exit 1
        ;;
esac

# Execute with timeout, using printf for safe input
timeout "$TIMEOUT_SECONDS" "${CMD[@]}" <<< "$INPUT" || {
    exit_code=$?
    if [[ $exit_code -eq 124 ]]; then
        echo "Error: Command timed out after ${TIMEOUT_SECONDS}s" >&2
    fi
    exit $exit_code
}
