#!/bin/bash
# Ralph - Autonomous AI Coding Loop
# Spawns fresh Claude instances until all PRD stories complete
set -e

MAX_ITERATIONS=${1:-10}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="${2:-$(pwd)}"
RALPH_DIR="$PROJECT_DIR/scripts/ralph"
LOG_FILE="$RALPH_DIR/last_run.log"

echo "=========================================="
echo "  Ralph - Autonomous Coding Loop"
echo "=========================================="
echo "Max iterations: $MAX_ITERATIONS"
echo "Project dir: $PROJECT_DIR"
echo "Ralph dir: $RALPH_DIR"
echo ""

# Verify Ralph is initialized
if [ ! -f "$RALPH_DIR/prd.json" ]; then
  echo "Error: Ralph not initialized. Run /ralph init first."
  echo "Missing: $RALPH_DIR/prd.json"
  exit 1
fi

if [ ! -f "$RALPH_DIR/prompt.md" ]; then
  echo "Error: Missing prompt.md"
  echo "Missing: $RALPH_DIR/prompt.md"
  exit 1
fi

if [ ! -f "$RALPH_DIR/progress.txt" ]; then
  echo "Error: Missing progress.txt"
  echo "Missing: $RALPH_DIR/progress.txt"
  exit 1
fi

# Check for incomplete stories
INCOMPLETE=$(cat "$RALPH_DIR/prd.json" | grep -c '"passes": false' || echo "0")
if [ "$INCOMPLETE" -eq 0 ]; then
  echo "All stories already complete!"
  exit 0
fi

echo "Incomplete stories: $INCOMPLETE"
echo ""
echo "Starting loop..."
echo ""

# Clear log file
> "$LOG_FILE"

for i in $(seq 1 $MAX_ITERATIONS); do
  echo "═══════════════════════════════════════"
  echo "  Iteration $i of $MAX_ITERATIONS"
  echo "═══════════════════════════════════════"
  echo "[$(date +%Y-%m-%dT%H:%M:%S)] Starting iteration $i" >> "$LOG_FILE"

  OUTPUT=""
  for attempt in 1 2 3; do
    echo "[$(date +%Y-%m-%dT%H:%M:%S)] Running Claude (attempt $attempt/3)..."

    TMP_OUT=$(mktemp)
    set +e

    # Run Claude with the prompt, piping prompt.md content
    (cd "$PROJECT_DIR" && cat "$RALPH_DIR/prompt.md" | claude -p --dangerously-skip-permissions --fallback-model sonnet) >"$TMP_OUT" 2>&1 &
    CLAUDE_PID=$!
    set -e

    # Monitor Claude process
    while kill -0 "$CLAUDE_PID" 2>/dev/null; do
      echo "[$(date +%Y-%m-%dT%H:%M:%S)] Claude still running..."
      sleep 30
    done

    # Get exit status
    set +e
    wait "$CLAUDE_PID"
    CLAUDE_STATUS=$?
    set -e

    OUTPUT=$(cat "$TMP_OUT")
    rm -f "$TMP_OUT"

    # Log output
    echo "[$(date +%Y-%m-%dT%H:%M:%S)] Claude exited with status $CLAUDE_STATUS" >> "$LOG_FILE"
    echo "$OUTPUT" >> "$LOG_FILE"
    echo "---" >> "$LOG_FILE"

    # Show truncated output
    if [ -n "$OUTPUT" ]; then
      echo "$OUTPUT" | head -100
      LINES=$(echo "$OUTPUT" | wc -l)
      if [ "$LINES" -gt 100 ]; then
        echo "... (truncated, see $LOG_FILE for full output)"
      fi
    fi

    # Check for success
    if [ $CLAUDE_STATUS -eq 0 ]; then
      break
    fi

    # Check for transient errors worth retrying
    if echo "$OUTPUT" | grep -qiE "unavailable:|tls: bad record mac|rate.limit|overloaded"; then
      echo "[$(date +%Y-%m-%dT%H:%M:%S)] Transient error (attempt $attempt/3). Retrying in 10s..."
      sleep 10
      continue
    fi

    # Non-transient error, break retry loop
    break
  done

  # Check for completion signal
  if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then
    echo ""
    echo "=========================================="
    echo "  All stories complete!"
    echo "=========================================="
    echo "[$(date +%Y-%m-%dT%H:%M:%S)] COMPLETE - All stories done" >> "$LOG_FILE"
    exit 0
  fi

  # Brief pause between iterations
  echo ""
  echo "Iteration $i complete. Pausing before next..."
  sleep 5
done

echo ""
echo "=========================================="
echo "  Max iterations reached ($MAX_ITERATIONS)"
echo "=========================================="
echo "Some stories may still be incomplete."
echo "Check: cat $RALPH_DIR/prd.json | grep passes"
echo "[$(date +%Y-%m-%dT%H:%M:%S)] Max iterations reached" >> "$LOG_FILE"
exit 1
