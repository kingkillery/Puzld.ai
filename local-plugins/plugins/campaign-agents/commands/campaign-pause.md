---
name: campaign-pause
description: Checkpoint campaign state and pause all workers
allowed-tools: ["Read", "Write"]
---

Pause the active campaign and create a checkpoint for later resumption.

## What You Will Do

1. **Find Active Campaign**:
   - Scan `${CLAUDE_PLUGIN_ROOT}/state/campaigns/` for active campaigns
   - Read campaign.json to find status == "active"
   - If no active campaign, inform user

2. **Create Checkpoint**:
   - Generate checkpoint ID
   - Save complete state snapshot
   - Record pause timestamp and reason

3. **Update Campaign Status**:
   - Set status to "paused" in campaign.json
   - Update last_activity timestamp

4. **Log Pause Event**:
   - Append to logs/decisions.jsonl
   - Record any in-progress tasks

## Checkpoint Format

Add to campaign.json checkpoints array:
```json
{
  "id": "cp-<uuid>",
  "created_at": "<ISO timestamp>",
  "reason": "user_requested",
  "tasks_snapshot": {
    "completed": 23,
    "in_progress": 3,
    "pending": 19,
    "failed": 2,
    "blocked": 1
  },
  "active_branches": [
    "campaign/migrate-solid/T12",
    "campaign/migrate-solid/T15"
  ]
}
```

## Output to User

```
=== Campaign Paused ===

Campaign: migrate-solid-to-react
Checkpoint: cp-abc123
Created: 2024-01-15T18:30:00Z

Progress at pause:
- 23/45 tasks completed (51%)
- 3 tasks in progress (will resume)
- 2 tasks failed (pending review)

To resume: /campaign-resume

Note: In-progress tasks on branches:
- campaign/migrate-solid/T12
- campaign/migrate-solid/T15
- campaign/migrate-solid/T18

These branches are preserved and work will continue from where it stopped.
```

## Handle In-Progress Tasks

For tasks currently in_progress:
- Do NOT mark as failed or reset
- Keep their status as in_progress
- Record their branch names in checkpoint
- On resume, planner will reassess and continue
