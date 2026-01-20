# The Execution Loop

**For developers building the plugin harness.**

> **Note:** This document contains **illustrative pseudocode** showing the conceptual flow of the
> campaign loop. It is NOT a literal LangGraph implementation. The actual orchestration is handled
> by Claude Code's native agent system (Task tool) combined with file-based state persistence.
> If you need a production state machine, implement using your preferred framework (LangGraph,
> XState, or custom async loop) following these patterns.

The plugin acts as the "Operating System" (HAWK Workflow Layer). It manages context and orchestrates agent modes.

---

## Pseudocode Implementation

```python
def plugin_main_loop():
    """
    The core loop that drives the Synthetic Engineer.
    This is the HARNESS - the rigid infrastructure binding agents together.
    """

    # 1. LOAD STATE (File-based persistence)
    state = load_json(".campaign/state.json")

    if state.status == "PLANNING":
        # ═══════════════════════════════════════
        # MODE A: ARCHITECT
        # ═══════════════════════════════════════

        # CONTEXT STRATEGY: Repo Map only (90% token reduction)
        repo_map = generate_repo_map(".")  # Tree + signatures, NO bodies

        # Invoke Architect with constrained context
        new_plan = architect_agent.call(
            system_prompt=ARCHITECT_PROMPT,
            input={
                "goal": state.project_goal,
                "repo_map": repo_map,
                "failed_logs": state.logs if state.logs else None
            }
        )

        # Update state
        state.plan = new_plan
        state.status = "EXECUTING"
        state.logs = None
        state.retry_counter = 0
        save_state(state)

    elif state.status == "EXECUTING":
        # ═══════════════════════════════════════
        # MODE B: WORKER
        # ═══════════════════════════════════════

        # Find next runnable task (dependencies satisfied)
        task = get_next_task(state.plan)

        if not task:
            state.status = "COMPLETED"
            save_state(state)
            notify_user("Campaign complete!")
            return

        # FRESH START: Prune context aggressively
        # DO NOT send chat history! Only task-specific files.
        file_contents = read_files(task.files)

        # Invoke Worker with PARC loop
        result = worker_agent.call(
            system_prompt=WORKER_PROMPT,
            input={
                "task": task.description,
                "hints": task.step_hints,
                "files": file_contents,
                "entry_criteria": task.entry_criteria,
                "exit_criteria": task.exit_criteria
            }
        )

        if result.success:
            # GIT PERSISTENCE - The true memory
            git.add(".")
            git.commit(f"feat({task.id}): {task.description}")

            task.status = "COMPLETED"
            state.retry_counter = 0
            state.metrics.tasks_completed += 1

        else:
            # REFLECTION & RECOVERY (PARC pattern)
            state.retry_counter += 1

            if state.retry_counter > 3:
                # CIRCUIT BREAKER: Escalate to Architect
                state.status = "PLANNING"
                state.logs = result.error_log  # Pass stderr for analysis
                task.status = "FAILED"
                state.metrics.tasks_failed += 1
            else:
                # Retry with alternate model
                task.model = get_fallback_model(task.model)

        save_state(state)

        # DRIFT CHECK at milestones
        if should_check_drift(state):
            run_drift_check(state)


def get_next_task(plan):
    """Find first PENDING task with all dependencies COMPLETED."""
    for task in plan.tasks:
        if task.status != "PENDING":
            continue
        if all(dep_completed(d, plan) for d in task.dependencies):
            return task
    return None


def should_check_drift(state):
    """Check drift at 25%, 50%, 75% milestones."""
    completed = state.metrics.tasks_completed
    total = state.metrics.tasks_total
    if total == 0:
        return False
    progress = completed / total
    return progress in [0.25, 0.50, 0.75]


def run_drift_check(state):
    """MANDATORY drift prevention."""
    reflector = reflector_agent.call(
        input={
            "original_goal": state.project_goal,
            "completed_tasks": [t for t in state.plan.tasks if t.status == "COMPLETED"],
            "question": "Does the completed work serve the original goal?"
        }
    )
    if not reflector.aligned:
        state.status = "PLANNING"
        state.logs = "DRIFT DETECTED: " + reflector.reason
        save_state(state)
        notify_user("Campaign drifted from goal. Re-planning...")
```

---

## Key Implementation Notes

### 1. State is File-Based
```
.campaign/
├── state.json      # The brain on disk
├── repo-map.md     # Compressed codebase view
└── logs/           # Session logs for debugging
```

### 2. Context Window Management

| Mode | Context Contains | Context Excludes |
|------|-----------------|------------------|
| Architect | Repo Map, Goal, Failed Logs | File contents, Chat history |
| Worker | Task files only, Hints | Other files, Previous tasks |

### 3. Git as Memory

```python
# Reality check: What actually happened?
git_log = git.log(n=10)
git_diff = git.diff("HEAD~1")

# These are the source of truth, NOT conversation history
```

### 4. Model Routing

```python
ROUTING = {
    "ui": "minimax-m2.1",
    "data": "glm-4.7",
    "infra": "glm-4.7",
    "test": "minimax-m2.1",
    "devops": "gemini-cli"
}

def get_model_for_task(task):
    return ROUTING.get(task.domain, "minimax-m2.1")

def get_fallback_model(current):
    return "glm-4.7" if current == "minimax-m2.1" else "minimax-m2.1"
```

---

## Safety Checklist

- [ ] Agent NEVER works on main/master branch
- [ ] Network access whitelisted to package repos only
- [ ] Filesystem scoped to workspace only
- [ ] Max 3 retries before escalation
- [ ] Drift check at 25% intervals
- [ ] All changes committed to Git (audit trail)
