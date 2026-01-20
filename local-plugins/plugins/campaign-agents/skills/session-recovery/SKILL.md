---
name: session-recovery
description: This skill provides patterns for restoring campaign context across Claude sessions. Use when resuming campaigns or recovering from interruptions.
---

# Session Recovery Patterns

Strategies for restoring context and continuing campaigns across sessions.

## Context Recovery Process

### 1. Load Campaign State
```
${CLAUDE_PLUGIN_ROOT}/state/campaigns/<id>/
├── campaign.json    # Campaign metadata
├── tasks.json       # Task board
└── logs/
    ├── decisions.jsonl    # Decision history
    ├── errors.jsonl       # Error history
    └── session-*.log      # Session logs
```

### 2. Reconstruct Context

Read in order:
1. campaign.json - Goal, status, metrics
2. tasks.json - Current task board state
3. Latest checkpoint - State at pause
4. Recent decisions - Why certain paths taken
5. Error history - What failed and why

### 3. Assess Current State

For each in_progress task:
- Check git branch exists
- Check for uncommitted changes
- Check test status
- Determine resume vs restart

## State File Formats

### campaign.json
```json
{
  "id": "campaign-uuid",
  "name": "campaign-name",
  "goal": "Original goal text",
  "status": "active|paused|completed",
  "created_at": "ISO timestamp",
  "last_activity": "ISO timestamp",
  "project_path": "/path/to/project",
  "base_branch": "main",
  "checkpoints": [...],
  "metrics": {...}
}
```

### tasks.json
```json
{
  "tasks": [
    {
      "id": "T1",
      "status": "pending|in_progress|completed|failed|blocked|escalated",
      "branch": "campaign/<campaign-id>/T1",
      ...
    }
  ]
}
```

**Task ID Format:** Always `T<number>` (T1, T2, T3...).

### decisions.jsonl
```json
{"timestamp": "...", "type": "priority_change", "task": "T1", "reason": "..."}
{"timestamp": "...", "type": "retry", "task": "T5", "model": "glm-4.7"}
{"timestamp": "...", "type": "escalation", "task": "T8", "reason": "..."}
```

## Recovery Scenarios

### Scenario 1: Clean Pause
Campaign was paused with /campaign-pause.
- State is consistent
- Checkpoint exists
- Resume from checkpoint

### Scenario 2: Interrupted Session
Claude session ended without pause.
- Check last_activity timestamp
- Scan for in_progress tasks
- Check branch state for each
- Determine what completed

### Scenario 3: Failed Worker
Worker crashed mid-task.
- Task still in_progress in state
- Branch may have partial work
- Decide: continue or restart
- Update retry count

### Scenario 4: Base Branch Updated
Main branch changed during pause.
- Compare base_branch to current
- Identify conflicts
- May need rebase
- Spawn conflict-integrator

## Context Summary Template

Generate context summary for planner:

```
=== Campaign Recovery Context ===

Campaign: <name>
Goal: <goal>
Created: <date>
Last Active: <date>

Progress Summary:
- Total tasks: N
- Completed: X (Y%)
- In Progress: Z
- Failed: W
- Blocked: V
- Pending: U

Recent Activity:
- [timestamp] Completed T1: <title>
- [timestamp] Failed T5: <error>
- [timestamp] Started T8: <title>

Current Blockers:
- T5 failed 3x: <reason>
- T12 blocked by T8

Recommendation:
- Continue with in_progress tasks
- Retry T5 with alternate model
- Monitor T8 for completion

Git State:
- Active branches: 3
- Uncommitted changes: 1 branch
- Conflicts: none
```

## Recovery Commands

### Check Branch State
```bash
# List campaign branches
git branch --list "campaign/*"

# Check for uncommitted changes
git status --porcelain

# Check branch ahead/behind
git rev-list --left-right --count main...branch
```

### Recover Partial Work
```bash
# Stash uncommitted changes
git stash

# Check stash
git stash list

# Apply stash
git stash pop
```

## Best Practices

### 1. Log Decisions
Always log why decisions are made:
- Priority changes
- Retry attempts
- Escalations
- Strategy adjustments

### 2. Checkpoint Frequently
Create checkpoints at:
- Every 25% progress milestone
- Before risky operations
- When changing strategy
- Before user-requested pause

### 3. Validate State
Before continuing:
- Verify file state matches expected
- Run quick health check
- Confirm git state is clean
- Check for external changes

### 4. Preserve Context
In every log entry:
- Timestamp
- Task ID
- Action taken
- Reason for action
- Outcome
