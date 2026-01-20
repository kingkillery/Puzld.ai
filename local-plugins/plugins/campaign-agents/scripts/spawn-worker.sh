#!/bin/bash
# spawn-worker.sh - Droid worker invocation wrapper
# Usage: spawn-worker.sh <task_spec_file> <project_path> [model]
#
# Environment variables:
#   CAMPAIGN_SANDBOX_MODE - "docker" | "host" | "auto" (default: auto)
#   CAMPAIGN_ALLOW_HOST   - "true" to allow host execution without Docker

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$PLUGIN_ROOT/config/worker-config.json"
SECURITY_POLICY="$PLUGIN_ROOT/config/security-policy.json"

# Parse arguments
TASK_SPEC_FILE="$1"
PROJECT_PATH="$2"
MODEL="${3:-minimax-m2.1}"

# Sandbox configuration
SANDBOX_MODE="${CAMPAIGN_SANDBOX_MODE:-auto}"
ALLOW_HOST="${CAMPAIGN_ALLOW_HOST:-false}"

if [[ -z "$TASK_SPEC_FILE" ]] || [[ -z "$PROJECT_PATH" ]]; then
    echo "Usage: spawn-worker.sh <task_spec_file> <project_path> [model]"
    echo "  model: minimax-m2.1 (default) or glm-4.7"
    exit 1
fi

# Read task spec
if [[ ! -f "$TASK_SPEC_FILE" ]]; then
    echo "Error: Task spec file not found: $TASK_SPEC_FILE"
    exit 1
fi

TASK_SPEC=$(cat "$TASK_SPEC_FILE")
TASK_ID=$(echo "$TASK_SPEC" | jq -r '.id')
TASK_TITLE=$(echo "$TASK_SPEC" | jq -r '.title')

echo "=== Campaign Worker Spawn ==="
echo "Task ID: $TASK_ID"
echo "Task: $TASK_TITLE"
echo "Model: $MODEL"
echo "Project: $PROJECT_PATH"
echo "============================"

# Create task branch
CAMPAIGN_ID=$(echo "$TASK_SPEC" | jq -r '.campaign_id // "default"')
BRANCH_NAME="campaign/${CAMPAIGN_ID}/task-${TASK_ID}"

cd "$PROJECT_PATH"

# Check if branch exists
if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
    echo "Switching to existing branch: $BRANCH_NAME"
    git checkout "$BRANCH_NAME"
else
    echo "Creating new branch: $BRANCH_NAME"
    git checkout -b "$BRANCH_NAME"
fi

# ===========================================
# SANDBOX ENFORCEMENT (HAWK Resource Layer)
# ===========================================

# Check security policy
DOCKER_REQUIRED="false"
DOCKER_IMAGE="campaign-worker:latest"

if [[ -f "$SECURITY_POLICY" ]]; then
    SANDBOX_RUNTIME=$(jq -r '.sandbox.runtime // "host"' "$SECURITY_POLICY")
    DOCKER_IMAGE=$(jq -r '.sandbox.image // "campaign-worker:latest"' "$SECURITY_POLICY")

    if [[ "$SANDBOX_RUNTIME" == "docker" ]]; then
        DOCKER_REQUIRED="true"
    fi
fi

# Determine execution mode
USE_DOCKER="false"

if [[ "$SANDBOX_MODE" == "docker" ]]; then
    USE_DOCKER="true"
elif [[ "$SANDBOX_MODE" == "host" ]]; then
    USE_DOCKER="false"
elif [[ "$SANDBOX_MODE" == "auto" ]]; then
    # Auto mode: use Docker if required by policy and available
    if [[ "$DOCKER_REQUIRED" == "true" ]]; then
        if command -v docker &> /dev/null; then
            USE_DOCKER="true"
        else
            echo "WARNING: Security policy requires Docker but docker is not available."
            if [[ "$ALLOW_HOST" != "true" ]]; then
                echo "ERROR: Set CAMPAIGN_ALLOW_HOST=true to proceed without Docker sandbox."
                echo "       This is a security risk for autonomous code execution."
                exit 1
            fi
            echo "Proceeding with host execution (CAMPAIGN_ALLOW_HOST=true)..."
        fi
    fi
fi

# Invoke droid worker
echo ""
echo "Invoking pk-puzldai worker..."
echo "Sandbox mode: $([ "$USE_DOCKER" == "true" ] && echo "Docker ($DOCKER_IMAGE)" || echo "Host")"
echo ""

# Set environment variables from config
export DROID_LOG_LEVEL="${DROID_LOG_LEVEL:-info}"
export DROID_TIMEOUT="${DROID_TIMEOUT:-300}"

# Run the worker (with or without Docker)
if [[ "$USE_DOCKER" == "true" ]]; then
    # Read network policy
    NETWORK_MODE=$(jq -r '.network.mode // "restricted"' "$SECURITY_POLICY")
    ALLOWED_DOMAINS=$(jq -r '.network.allowed_domains | join(",")' "$SECURITY_POLICY" 2>/dev/null || echo "")

    echo "Running in Docker sandbox..."
    docker run --rm \
        --security-opt no-new-privileges:true \
        --cap-drop ALL \
        -v "$PROJECT_PATH:/workspace:rw" \
        -v "$TASK_SPEC_FILE:/task-spec.json:ro" \
        -w /workspace \
        -e "DROID_LOG_LEVEL=$DROID_LOG_LEVEL" \
        -e "DROID_TIMEOUT=$DROID_TIMEOUT" \
        "$DOCKER_IMAGE" \
        pk-puzldai run --model "$MODEL" --task "$(cat /task-spec.json)" --cwd /workspace

    WORKER_EXIT_CODE=$?
else
    # Host execution (no sandbox)
    pk-puzldai run \
        --model "$MODEL" \
        --task "$TASK_SPEC" \
        --cwd "$PROJECT_PATH"

    WORKER_EXIT_CODE=$?
fi

# Check result
if [[ $WORKER_EXIT_CODE -eq 0 ]]; then
    echo ""
    echo "=== Worker completed successfully ==="

    # Run tests if configured
    if [[ -f "package.json" ]]; then
        echo "Running tests..."
        npm test || true
    fi

    # Run linter if configured
    if [[ -f "package.json" ]]; then
        echo "Running linter..."
        npm run lint || true
    fi

    echo "Task $TASK_ID completed on branch $BRANCH_NAME"
else
    echo ""
    echo "=== Worker failed with exit code $WORKER_EXIT_CODE ==="
    echo "Consider retrying with alternate model: glm-4.7"
fi

exit $WORKER_EXIT_CODE
