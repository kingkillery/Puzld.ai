---
name: gemini-codex-claude-crush
description: Unified mega-skill that coordinates Gemini, Codex, Claude, and Crush from Factory Droid. Triggers on "use gemini-codex-claude-crush", "gccc", "mega skill", or when asking to use all tools together.
---

# Gemini + Codex + Claude + Crush (Unified Skill)

## Prerequisites

| Tool | Minimum Version | Required Env Vars |
|------|-----------------|-------------------|
| Gemini CLI | v0.25.0+ | `GEMINI_API_KEY`, `GEMINI_MODEL` |
| Codex CLI | v0.23.0+ | `OPENAI_API_KEY` |
| Claude CLI | Latest | `ANTHROPIC_API_KEY` |
| Crush CLI | Latest | (Optional) `CRUSH_CONFIG` |
| **Droid** | Latest | Use **minimax-v2.1** (custom version) |

## Configuration (Optional)

```bash
# Set in environment or .env
MAX_TOTAL_TOKENS=100000      # Stop if estimated cost exceeds
MAX_ITERATIONS=3             # Critic loop limit (circuit breaker)
CHECKPOINT_ENABLED=true      # Save state for resume
PROGRESS_REPORTING=true      # Print phase status
FALLBACK_TO_GEMINI=true      # If Claude fails for planning
```

## When to Use
Complex tasks requiring: multi-modal analysis → structured planning → diff generation → terminal automation.

---

# ARCHITECTURE: Planner-Centric with Multi-Turn Consensus

Claude acts as **supervisor** orchestrating the pipeline with iterative refinement:

```
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1: ARCHITECT (Claude as Architect)                       │
│  - Analyze requirements, define strategy                         │
│  - Output: structured plan with risks, steps                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 2: CONTEXT (Gemini as Context Gatherer)                  │
│  - Deep codebase analysis with LSP/MCP                           │
│  - Multi-modal support (images, diagrams)                        │
│  - Output: compressed summary + affected files                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 3: GENERATION (Codex as Generator)                        │
│  - Generate diff patches from plan                               │
│  - Token-efficient implementation                                │
│  - Output: git-style unified diffs                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 4: CRITIQUE (Claude as Reviewer)                          │
│  - Review diffs for correctness, risks                           │
│  - If issues: iterate back to Phase 3                            │
│  - Until: consensus reached OR max iterations                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 5: EXECUTION (Droid + Crush)                              │
│  - Droid applies patches (minimax-v2.1)                          │
│  - Crush runs: install → lint → test                             │
│  - Output: verified, working code                                │
└─────────────────────────────────────────────────────────────────┘
```

## SOTA Patterns Applied

| Pattern | Implementation |
|---------|----------------|
| **Planner-Centric** | Claude orchestrates; separates planning from execution |
| **Multi-Turn Consensus** | Codex generates → Claude critiques → Codex refines (repeat) |
| **Phase Personas** | Architect → Context Gatherer → Generator → Reviewer |
| **Context Compression** | Gemini output summarized before passing to Codex |
| **Circuit Breaker** | Max iterations limit prevents infinite loops |
| **Cost Budgeting** | Token tracking with abort on budget exceeded |
| **Checkpoint/Resume** | Save state, resume after interruption |

## Tool Selection Guide

| Role | Task | Tool | Reason |
|------|------|------|--------|
| **Supervisor** | Orchestration, critique | **Claude** | Structured JSON, safety, reasoning |
| **Context Gatherer** | Large codebase, multi-modal | **Gemini** | 1M token context, LSP/MCP |
| **Generator** | Diff/patch generation | **Codex** | GPT-5.2-Codex, token-efficient |
| **Automator** | Terminal commands | **Crush** | Fast local, `--yolo` mode |
| **Fallback** | Planning if Claude fails | **Gemini** | Can also produce plans |

## Quick CLI Reference

### Claude (Supervisor)
| Mode | Command |
|------|---------|
| Architect | `claude -p --output-format json --max-tokens 8192 "You are an Architect. Plan <task>"` |
| Critic | `claude -p --output-format json "Review these diffs for correctness: <diff>"` |
| Orchestrate | `claude -p --output-format json "Coordinate: Gemini analyze, Codex generate, report status"` |

### Gemini (Context)
| Mode | Command |
|------|---------|
| Read-only | `gemini --approval-mode default --output-format json --model gemini-1.5-pro "..."` |
| With files | `gemini --file src/auth.ts --file screenshot.png "Analyze"` |
| Summary output | `gemini --output-format json "Summarize: <context>" > temp/summary.json` |
| Fallback planning | `gemini --output-format json "Plan <task> as Claude would"` |

### Codex (Generator)
| Mode | Command |
|------|---------|
| Generate diffs | `codex exec --skip-git-repo-check "Generate diffs for <task>. Output git-style unified diff only."` |
| Refine | `codex exec --skip-git-repo-check "Refine: <critique>. Output git-style diff only."` |
| Dry-run | `codex exec --skip-git-repo-check --sandbox read-only "Analyze and suggest changes (no writes)"` |

### Crush (Automator)
| Mode | Command |
|------|---------|
| Execute | `crush --yolo --cwd . --timeout 300000 "..."` |
| Non-interactive | `crush --no-prompt --confirm "npm test"` |

---

# DECISION TREE

```
Task complexity?
|
├─ Simple (<3 files, clear reqs)
│  └─→ Codex directly
│
├─ Medium (3–10 files)
│  ├─→ Need plan + critique? → Claude → Codex → Claude critique
│  └─→ Just diffs? → Codex
│
└─ Complex (10+ files)
   ├─→ Multi-modal? → Claude → Gemini → Codex → Claude critique → Crush
   ├──→ Falls back to Gemini → Codex if Claude fails
   └─→ Full SOTA pipeline → Claude (Architect) → Gemini → Codex → Claude (Critic) → Crush
```

---

# PROGRESS REPORTING

Print status at each phase:

```bash
echo "[PHASE 1/5] ARCHITECT: Planning task..."
claude -p "Plan <task>" --output-format json > temp/plan.json
echo "[PHASE 1/5] ARCHITECT: ✓ Plan complete ($(wc -c < temp/plan.json) bytes)"

echo "[PHASE 2/5] CONTEXT: Analyzing codebase..."
gemini --output-format json "Analyze for <task>" > temp/context.json
echo "[PHASE 2/5] CONTEXT: ✓ Analysis complete ($(wc -c < temp/context.json) bytes)"

echo "[PHASE 3/5] GENERATION: Creating diffs..."
codex exec --format diff "Implement" > temp/patch.diff
echo "[PHASE 3/5] GENERATION: ✓ Diffs ready ($(wc -l < temp/patch.diff) lines)"

echo "[PHASE 4/5] CRITIQUE: Reviewing (iteration $iter/$MAX_ITERATIONS)..."
claude -p "Critique temp/patch.diff" --output-format json > temp/critique.json
echo "[PHASE 4/5] CRITIQUE: $(cat temp/critique.json | jq -r '.status')"

echo "[PHASE 5/5] EXECUTION: Applying and testing..."
Droid applies; crush "npm test"
echo "[PHASE 5/5] EXECUTION: ✓ Complete"
```

---

# MONITORING & PEEK CAPABILITY

Monitor long-running commands and peek at progress:

## Real-Time Progress with Timeout and Output Peek

```bash
# Run command with progress and ability to peek at output
run_with_monitor() {
  local cmd="$1"
  local name="$2"
  local timeout="${3:-120}"
  local log_file="temp/${name}.log"

  echo "[$name] Starting... (timeout: ${timeout}s)"

  # Run in background, write to log file
  eval "$cmd" > "$log_file" 2>&1 &
  local pid=$!

  local elapsed=0
  local last_size=0

  while kill -0 $pid 2>/dev/null; do
    local current_size=$(wc -c < "$log_file" 2>/dev/null || echo 0)

    # Show progress every 10 seconds
    if [ $((elapsed % 10)) -eq 0 ] && [ $elapsed -gt 0 ]; then
      echo "[$name] Running... ${elapsed}s elapsed, output: ${current_size} bytes"
      echo "[$name] Latest output:"
      tail -5 "$log_file" | sed 's/^/  /'
    fi

    # Peek at output if it's growing
    if [ "$current_size" -gt "$last_size" ]; then
      echo "[$name] Activity detected ($((current_size - last_size)) bytes new)"
    fi
    last_size=$current_size

    sleep 5
    elapsed=$((elapsed + 5))

    if [ $elapsed -ge $timeout ]; then
      echo "[$name] ⚠ TIMEOUT approaching (${elapsed}s)"
      echo "[$name] Current output preview:"
      tail -20 "$log_file" | sed 's/^/  /'
      read -p "[$name] Continue? (y/n): " -n 1 -r
      echo
      if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        kill $pid 2>/dev/null
        echo "[$name] Cancelled by user"
        return 1
      fi
    fi
  done

  wait $pid
  local exit_code=$?

  echo "[$name] Complete (${elapsed}s, exit: $exit_code)"
  echo "[$name] Final output:"
  tail -10 "$log_file" | sed 's/^/  /'

  return $exit_code
}

# Usage examples
run_with_monitor "claude -p --output-format json 'Plan task' > temp/plan.json" "ARCHITECT" 90
run_with_monitor "codex exec --skip-git-repo-check 'Generate diffs' > temp/patch.diff" "CODEX" 120
run_with_monitor "gemini --output-format json 'Analyze' > temp/context.json" "GEMINI" 90
```

## Quick Status Check

```bash
# Check status of all temp files
check_pipeline_status() {
  echo "=== Pipeline Status ==="
  echo "Plan:      $([ -f temp/plan.json ] && echo "✓ ($(wc -c < temp/plan.json 2>/dev/null || echo 0) bytes)" || echo "✗ missing")"
  echo "Context:   $([ -f temp/context.json ] && echo "✓ ($(wc -c < temp/context.json 2>/dev/null || echo 0) bytes)" || echo "✗ missing")"
  echo "Patch:     $([ -f temp/patch.diff ] && echo "✓ ($(wc -l < temp/patch.diff 2>/dev/null || echo 0) lines)" || echo "✗ missing")"
  echo "Critique:  $([ -f temp/critique.json ] && echo "✓ ($(wc -c < temp/critique.json 2>/dev/null || echo 0) bytes)" || echo "✗ missing")"
  echo "Checkpoint: $([ -f temp/pipeline_state.json ] && echo "✓ exists" || echo "✗ missing")"
  echo "Token usage: $([ -f temp/token_usage.json ] && echo "$(wc -l < temp/token_usage.json) entries" || echo "none")"
  echo ""
  echo "=== Last Modified ==="
  ls -la temp/*.json temp/*.diff 2>/dev/null | tail -5
}

# Run it
check_pipeline_status
```

## Tail Output in Real-Time

```bash
# Tail the log file while command runs
tail_log() {
  local log_file="$1"
  local name="${2:-output}"

  if [ ! -f "$log_file" ]; then
    echo "[$name] Log file not found: $log_file"
    return 1
  fi

  echo "[$name] Tailing $log_file (Ctrl+C to stop):"
  tail -f "$log_file"
}

# Usage: tail_log "temp/codex.log"
```

## Estimate Time Remaining

```bash
estimate_remaining() {
  local current_phase="$1"
  local phase_count=5

  # Average times (tune based on experience)
  local avg_times=("30" "45" "60" "30" "30")  # seconds per phase

  local total=0
  local elapsed=0

  for i in "${!avg_times[@]}"; do
    total=$((total + ${avg_times[$i]}))
    if [ $i -lt $((current_phase - 1)) ]; then
      elapsed=$((elapsed + ${avg_times[$i]}))
    fi
  done

  local remaining=$((total - elapsed))

  echo "Phase $current_phase/$phase_count"
  echo "Estimated time remaining: ${remaining}s (${((remaining / 60))}min)"
  echo "Estimated total time: ${total}s (${((total / 60))}min)"
}
```

## Monitor with Alerts

```bash
# Alert on completion or failure
run_with_alert() {
  local cmd="$1"
  local name="$2"
  local sound="${3:-default}"

  echo "[$name] Starting with alert on complete..."

  eval "$cmd"
  local result=$?

  if [ $result -eq 0 ]; then
    echo "[$name] ✓ Success!"
    # macOS: afplay /System/Library/Sounds/Ping.aiff
    # Linux: paplay /usr/share/sounds/ubuntu/stereo/message.ogg
  else
    echo "[$name] ✗ Failed (exit: $result)"
  fi

  return $result
}
```

---

# CORE PATTERNS

## Pattern 1: Simple (Codex Direct)
```
1. codex exec --format diff "Generate diffs for <task>" > temp/patch.diff
2. Droid applies patch (minimax-v2.1)
3. bash "test"
4. Quality Gate: ✓ Tests pass? → SUCCESS
```

## Pattern 2: Medium (Plan + Critique)
```
1. claude -p "Plan <task>" --output-format json > temp/plan.json
   FALLBACK: If fail → gemini --output-format json "Plan <task>" > temp/plan.json

2. codex exec --format diff "Implement temp/plan.json" > temp/patch.diff

3. ITERATION=1
   while [ $ITERATION -le $MAX_ITERATIONS ]; do
     claude -p "Critique temp/patch.diff" --output-format json > temp/critique.json
     STATUS=$(jq -r '.status' temp/critique.json)
     if [ "$STATUS" = "CLEAN" ]; then break; fi
     codex exec --format diff "Fix: $(jq -r '.issues[]' temp/critique.json)" > temp/patch.diff
     ITERATION=$((ITERATION + 1))
   done

4. Droid applies patch
5. bash "test"
6. Quality Gate: ✓ Tests pass? ✓ Lint clean? → SUCCESS
```

## Pattern 3: Full SOTA Pipeline (Multi-Turn Consensus)

```bash
#!/bin/bash
# Full pipeline with cost tracking, checkpoints, progress

# === SETUP ===
MAX_ITERATIONS=3
MAX_TOKENS=100000
PROGRESS_REPORTING=true
CHECKPOINT_FILE="temp/pipeline_state.json"

# === COST TRACKING ===
track_tokens() {
  echo "{\"phase\":\"$1\",\"tokens\":$2,\"timestamp\":\"$(date -Iseconds)\"}" >> temp/token_usage.json
}

# === CHECKPOINT ===
save_checkpoint() {
  cat > "$CHECKPOINT_FILE" <<EOF
{
  "phase": "$PHASE",
  "iteration": $ITERATION,
  "timestamp": "$(date -Iseconds)",
  "files": {
    "plan": "temp/plan.json",
    "context": "temp/context.json",
    "patch": "temp/patch.diff",
    "critique": "temp/critique.json"
  }
}
EOF
}

# === RESUME FROM CHECKPOINT ===
resume_checkpoint() {
  if [ -f "$CHECKPOINT_FILE" ]; then
    echo "[RESUME] Found checkpoint, continuing from $PHASE..."
    PHASE=$(jq -r '.phase' "$CHECKPOINT_FILE")
    ITERATION=$(jq -r '.iteration // 1' "$CHECKPOINT_FILE")
  fi
}

# === MAIN PIPELINE ===
PHASE=1

while [ $PHASE -le 5 ]; do
  case $PHASE in
    1) # ARCHITECT
      echo "[PHASE 1/5] ARCHITECT: Planning..."
      claude -p "You are an Architect. Plan <task>. Include: steps, risks, test plan." --output-format json > temp/plan.json
      track_tokens "architect" $(wc -c < temp/plan.json)
      if [ ! -s temp/plan.json ]; then
        echo "[FALLBACK] Claude failed, using Gemini..."
        gemini --output-format json "Plan <task>" > temp/plan.json
      fi
      save_checkpoint; PHASE=2;;

    2) # CONTEXT
      echo "[PHASE 2/5] CONTEXT: Analyzing..."
      gemini --output-format json "Analyze codebase for plan in temp/plan.json" > temp/context.json
      track_tokens "context" $(wc -c < temp/context.json)
      save_checkpoint; PHASE=3;;

    3) # GENERATION
      echo "[PHASE 3/5] GENERATION: Creating diffs..."
      codex exec --format diff "Implement temp/plan.json with temp/context.json" > temp/patch.diff
      track_tokens "generation" $(wc -c < temp/patch.diff)
      save_checkpoint; PHASE=4;;

    4) # CRITIQUE (Multi-Turn Consensus)
      echo "[PHASE 4/5] CRITIQUE: Reviewing..."
      ITERATION=1
      while [ $ITERATION -le $MAX_ITERATIONS ]; do
        echo "  [Critique iteration $ITERATION/$MAX_ITERATIONS]"
        claude -p "Review temp/patch.diff. Issues? Respond {\"status\":\"CLEAN\"} or {\"status\":\"ISSUES\",\"issues\":[...]}" --output-format json > temp/critique.json
        STATUS=$(jq -r '.status' temp/critique.json)
        if [ "$STATUS" = "CLEAN" ]; then
          echo "  [Critique] ✓ CLEAN - consensus reached"
          break
        fi
        echo "  [Critique] Issues found, refining..."
        codex exec --format diff "Fix: $(jq -r '.issues[]' temp/critique.json | tr '\n' ' ')" > temp/patch.diff
        ITERATION=$((ITERATION + 1))
      done
      if [ $ITERATION -gt $MAX_ITERATIONS ]; then
        echo "[ABORT] Circuit breaker: max iterations exceeded"
        exit 1
      fi
      save_checkpoint; PHASE=5;;

    5) # EXECUTION
      echo "[PHASE 5/5] EXECUTION: Applying and testing..."
      Droid applies patch (minimax-v2.1)
      crush --cwd . "npm install && npm run lint && npm test"
      track_tokens "execution" 0
      PHASE=6;;
  esac
done

echo "[SUCCESS] Pipeline complete"
```

---

# QUALITY GATES

Define explicit pass/fail criteria:

| Gate | Criteria | Action on Fail |
|------|----------|----------------|
| Plan Valid | Claude/Gemini output is valid JSON | Retry or fallback |
| Diffs Generated | temp/patch.diff exists, >0 lines | Re-run Codex |
| Critique Clean | Claude status = CLEAN | Iterate (max 3x) |
| Tests Pass | `npm test` exit 0 | Fix and retry |
| Lint Clean | `npm run lint` exit 0 | Auto-fix or abort |
| Token Budget | Total < MAX_TOKENS | Abort with cost report |

```bash
# Quality gate script
quality_gate() {
  local gate_name="$1"
  local condition="$2"
  local fail_action="$3"

  if eval "$condition"; then
    echo "[GATE ✓] $gate_name passed"
    return 0
  else
    echo "[GATE ✗] $gate_name FAILED"
    eval "$fail_action"
    return 1
  fi
}

# Usage
quality_gate "Diffs exist" "[ -s temp/patch.diff ]" "echo 'No diffs generated'; exit 1"
quality_gate "Tests pass" "npm test" "echo 'Tests failed'; exit 1"
```

---

# ABORT CONDITIONS

Stop and notify user when:

| Condition | Threshold | Action |
|-----------|-----------|--------|
| Max iterations | `$ITERATION > $MAX_ITERATIONS` | Abort with "circuit breaker" |
| Token budget | `total_tokens > $MAX_TOKENS` | Abort with cost report |
| Claude/Gemini fails | Exit non-zero after retry | Fallback or abort |
| Tests fail | After 3 retries | Abort, dump logs |
| User interruption | Ctrl+C detected | Save checkpoint, exit |

```bash
abort_on_budget() {
  local total=$(cat temp/token_usage.json 2>/dev/null | jq '[.tokens] | add' || echo 0)
  if [ "$total" -gt "$MAX_TOKENS" ]; then
    echo "[ABORT] Token budget exceeded: $total / $MAX_TOKENS"
    echo "Estimated cost: $(python3 -c "print(f'${total/1000*0.01:.2f}')")"
    exit 1
  fi
}
```

---

# FALLBACK STRATEGIES

| Primary Fails | Fallback |
|--------------|----------|
| Claude (Architect) | Gemini `--output-format json "Plan <task>"` |
| Claude (Critic) | Use Gemini for critique instead |
| Claude (Orchestrate) | Manual step-by-step with Droid |
| Gemini (Context) | Use Claude with reduced context |
| Codex | Use Gemini to generate diffs (less efficient) |
| All providers fail | Abort with detailed error report |

```bash
# Fallback example for Architect phase
claude -p "Plan <task>" --output-format json > temp/plan.json 2>/dev/null
if [ ! -s temp/plan.json ]; then
  echo "[FALLBACK] Claude Architect failed, trying Gemini..."
  gemini --output-format json "Plan <task> as a software architect would" > temp/plan.json
fi
```

---

# PARALLEL EXECUTION

Some steps can run concurrently:

```bash
# Parallel: Context analysis + Crush prep (install deps)
(
  gemini --output-format json "Analyze codebase for <task>" > temp/context.json
) &
PID1=$!

(
  crush --cwd . "npm install --prefer-offline" > /dev/null 2>&1
) &
PID2=$!

wait $PID1 $PID2
echo "[PARALLEL] Context ready, deps installed"
```

---

# DATA HANDOFF WITH COMPRESSION

Always persist and compress output between phases:

```bash
# Phase 1: Claude (Architect)
claude -p "Plan <task>" --output-format json > temp/plan.json

# Phase 2: Gemini (Context) - summarize to avoid bloat
gemini --output-format json "Summarize codebase context for: <task>" > temp/context_summary.json

# Phase 3: Codex (Generator)
codex exec --format diff "Implement temp/plan.json with context temp/context_summary.json" > temp/patch.diff

# Phase 4: Claude (Critic) - consensus check
claude -p "Critique temp/patch.diff. Issues? Respond YES/NO." --output-format json
# If YES: Codex refines; loop back to Phase 4

# Phase 5: Droid + Crush
# Droid applies patch (minimax-v2.1); crush runs tests
```

---

# PROMPT TEMPLATES

### Claude (Architect)
```
You are a software architect planning a code change.
Goal: <requirement>
Files: <list>
Requirements:
- Numbered implementation steps
- Test plan for each step
- Risk assessment
- Affected files (new + modified)
Format: JSON with keys: steps, tests, risks, files.
```

### Claude (Critic)
```
You are a code reviewer. Critique this diff:
<diff>

Check for:
- Syntax errors
- Logic bugs
- Missing edge cases
- Style violations
- Security issues

Respond JSON:
{
  "status": "CLEAN" | "ISSUES",
  "issues": ["list of issues if any"],
  "suggestions": ["fix suggestions"]
}
```

### Claude (Fallback Architect)
```
You are a software architect. Plan this task concisely:
<task>

Output JSON:
{"steps": ["step 1", "step 2"], "files": ["file1", "file2"], "risks": []}
```

### Gemini (Context)
```
Analyze <files/context> for implementing this plan:
<plan>

Focus on:
- Affected code paths
- Dependencies
- Potential conflicts
- Testing requirements

Output compressed summary (max 500 words):
- Key findings
- Implementation notes
- Edge cases to handle
```

### Codex (Generator)
```
Generate unified diff patches for:
Plan: <plan>
Context: <summary>
Files to modify: <list>

Constraints:
- Minimal changes
- Preserve code style
- Include new files in diffs
- Handle all edge cases from context

Format: git-style unified diff.
```

### Crush (Automator)
```
Run these steps in <working directory>:
1. npm install
2. npm run lint
3. npm test

Timeout: 300000ms
Confirm each step. Print concise summary.
```

---

# DROID EDIT WORKFLOW

Droid applies all changes (never let providers write directly):

1. **Generate diffs** - Providers output diff format
2. **Claude critic approves** - Multi-turn consensus reached
3. **Droid reviews** - Check diffs in minimax-v2.1
4. **Apply via Edit** - Use Droid's Edit/Write tools
5. **Rollback if needed** - `Edit` with original or `bash "git checkout -- <file>"`

---

# ERROR HANDLING

| Error | Solution |
|-------|----------|
| Tool not found | Verify PATH, adapter config |
| `Not inside a trusted directory` | Add `--skip-git-repo-check` |
| Claude critic finds issues | Iterate: Codex refines, Claude re-reviews |
| Noisy output | Add `--output-format json` flag |
| Context bloat | Use Gemini summary mode, pass compressed output |
| Tool timeout | Narrow scope, use Claude to break into smaller tasks |
| `permission denied` | Check API keys in env vars |
| Circuit breaker triggered | Review and manually continue or abort |
| Token budget exceeded | Abort with cost report, reduce scope |
| `unknown argument: --format` | Use `--output-format` (not `--format`) for Gemini |
| `unknown argument: --output` | Use `--output-format` (not `--output`) for Claude |
| Claude timeout | Reduce prompt complexity, use shorter output, try monitoring |
| Codex timeout | Simplify prompt, reduce scope, use `--skip-git-repo-check` |

---

# BEST PRACTICES

- **Droid owns edits/tests** - Use **minimax-v2.1** for Droid (custom version)
- **Claude supervises** - Architect plans, Critic reviews, orchestrates handoffs
- **Multi-turn consensus** - Never skip Claude critique phase for complex tasks
- **Phase personas** - Each tool has a specific role (don't use Gemini for planning)
- **Context compression** - Summarize before passing between tools
- **All edits via Droid** - Providers stay read-only, generate diffs only
- **Iterate until clean** - Claude critic loop until status = CLEAN
- **Track costs** - Monitor token usage, abort on budget
- **Set circuit breaker** - Max iterations prevents infinite loops
- **Save checkpoints** - Enable resume after interruption
- **Quality gates** - Explicit pass/fail criteria at each phase
- **Use fallbacks** - Gemini for planning if Claude fails

---

# EXAMPLE WORKFLOWS

### Bugfix (Medium Complexity)
```
1. glob "**/*bug*.js"
2. grep "bug symptom" src/
3. claude -p "Plan fix for <file>" --output-format json > temp/plan.json
   # Fallback if fails: gemini --output-format json "Plan fix"
4. codex exec --format diff "Implement temp/plan.json" > temp/patch.diff
5. claude -p "Critique temp/patch.diff" --output-format json
   # Loop if issues (max 3x)
6. Droid applies patch (minimax-v2.1)
7. bash "npm test"
8. Quality Gate: ✓ Tests pass? → SUCCESS
```

### Feature (Full SOTA Pipeline)
```
# ARCHITECT
claude -p "Plan auth feature: OAuth2 + refresh tokens" --output-format json > temp/plan.json
track_tokens "architect"

# CONTEXT  
gemini --output-format json "Analyze auth flow for plan in temp/plan.json" > temp/context.json
track_tokens "context"

# GENERATOR
codex exec --format diff "Implement temp/plan.json with temp/context.json" > temp/patch.diff
track_tokens "generation"

# CRITIC - MULTI-TURN
ITERATION=1
while [ $ITERATION -le 3 ]; do
  claude -p "Critique temp/patch.diff" --output-format json > temp/critique.json
  if [ "$(jq -r '.status' temp/critique.json)" = "CLEAN" ]; then break; fi
  codex exec --format diff "Fix: $(jq -r '.issues[]' temp/critique.json)" > temp/patch.diff
  ITERATION=$((ITERATION + 1))
done

# EXECUTE
Droid applies patch
crush --cwd . "npm install && npm run lint && npm test"

# QUALITY GATES
quality_gate "Tests pass" "npm test" "exit 1"
quality_gate "Lint clean" "npm run lint" "exit 1"
```

### Multi-Modal Analysis
```
1. claude -p "Plan UI implementation from design" --output-format json > temp/plan.json
2. gemini --file src/ui.tsx --file screenshots/design.png "Analyze with plan"
3. codex exec --format diff "Implement temp/plan.json" > temp/patch.diff
4. claude -p "Critique diff for UI correctness" --output-format json
5. Droid applies; crush --cwd . "npm run build && npm test"
```

### Resuming Interrupted Pipeline
```bash
# After interruption, check for checkpoint
if [ -f temp/pipeline_state.json ]; then
  echo "[RESUME] Found checkpoint, continuing..."
  # Script auto-detects phase and iteration from checkpoint
else
  echo "[START] Fresh pipeline"
fi
```
