---
name: campaign-resume
description: Resume paused campaign from last checkpoint
allowed-tools: ["Read", "Write", "Task", "Glob"]
---

Resume a paused campaign from its last checkpoint.

## What You Will Do

1. **Find Paused Campaign**:
   - Scan `${CLAUDE_PLUGIN_ROOT}/state/campaigns/` for paused campaigns
   - Read campaign.json to find status == "paused"
   - If multiple paused, list them and ask user to specify
   - If no paused campaigns, inform user

2. **Load Checkpoint**:
   - Read the most recent checkpoint from campaign.json
   - Display checkpoint summary to user
   - Confirm resumption

3. **Restore Context**:
   - Update status to "active"
   - Update last_activity timestamp
   - Log resume event

4. **Spawn Campaign Planner**:
   - Use Task tool to spawn campaign-planner agent
   - Provide full campaign context and checkpoint state
   - Planner will reassess and continue execution

## Resume Process

```
=== Campaign Resume ===

Found paused campaign:

Campaign: migrate-solid-to-react
Paused: 2024-01-15T18:30:00Z (2 hours ago)
Checkpoint: cp-abc123

Progress at checkpoint:
- 23/45 tasks completed (51%)
- 3 tasks in progress
- 19 tasks pending
- 2 tasks failed

Resuming campaign...

Status updated to: active
Last activity: <now>

Spawning campaign planner to reassess and continue...
```

## Planner Instructions on Resume

When spawning the campaign-planner after resume:

1. **Reassess In-Progress Tasks**:
   - Check branch state for each in_progress task
   - Determine if work was partially completed
   - Decide whether to continue or restart

2. **Handle Failed Tasks**:
   - Review failure reasons
   - Decide whether to retry with alternate model
   - Or escalate to user if max retries exceeded

3. **Check for External Changes**:
   - Compare base branch to checkpoint state
   - If main branch updated, may need rebase
   - Spawn conflict-integrator if needed

4. **Continue Execution**:
   - Resume dispatching workers for pending tasks
   - Monitor progress as before
   - Apply same drift prevention checks

## Multiple Paused Campaigns

If multiple campaigns are paused:

```
=== Multiple Paused Campaigns ===

Found 2 paused campaigns:

1. migrate-solid-to-react
   Paused: 2024-01-15T18:30:00Z
   Progress: 51% (23/45 tasks)

2. add-typescript-types
   Paused: 2024-01-14T12:00:00Z
   Progress: 30% (15/50 tasks)

Which campaign to resume? Enter number (1-2):
```

Use AskUserQuestion to get selection, then resume the chosen campaign.
