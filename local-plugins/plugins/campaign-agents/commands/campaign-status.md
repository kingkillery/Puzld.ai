---
name: campaign-status
description: Show current campaign progress, task board, and blockers
allowed-tools: ["Read", "Glob"]
argument-hint: "[--verbose]"
---

Display the current status of the active campaign.

## What You Will Do

1. **Find Active Campaign**:
   - Scan `${CLAUDE_PLUGIN_ROOT}/state/campaigns/` for active campaigns
   - Read campaign.json to find status == "active"
   - If no active campaign, inform user

2. **Load Campaign State**:
   - Read campaign.json for metadata
   - Read tasks.json for task board

3. **Generate Status Report**:
   - Display campaign overview
   - Show task board grouped by status
   - Calculate progress metrics
   - List any blockers

## Status Report Format

```
=== Campaign Status ===

Campaign: <name>
Goal: <goal>
Status: <status>
Started: <created_at>
Last Activity: <last_activity>

=== Progress ===

[==========----------] 50% complete

Tasks: 23/45 completed | 2 failed | 1 blocked | 19 pending

=== Task Board ===

IN PROGRESS (3):
  - [T12] Migrate Header component (ui)
  - [T15] Update API endpoints (data)
  - [T18] Add integration tests (test)

BLOCKED (1):
  - [T22] Database migration - blocked by: T15

FAILED (2):
  - [T8] Migrate Sidebar component - retries: 3/3
  - [T11] Update auth service - retries: 2/3

PENDING (19):
  - [T23] Migrate Footer component (ui)
  - [T24] Update cache layer (data)
  ... and 17 more

COMPLETED (23):
  - [T1] Set up React dependencies ✓
  - [T2] Create component templates ✓
  ... and 21 more

=== Blockers ===

1. T8: Sidebar component migration failed after 3 retries
   Last error: Type mismatch in useAuth hook
   Recommendation: Manual review needed

2. T22: Waiting on T15 (API endpoints)
   Estimated unblock: When T15 completes

=== Git Branches ===

Active branches: 3
- campaign/migrate-solid/T12 (in progress)
- campaign/migrate-solid/T15 (in progress)
- campaign/migrate-solid/T18 (in progress)

Merged branches: 23 (ready for cleanup)
```

## Verbose Mode

If --verbose flag is provided:
- Show full task descriptions
- Include file lists per task
- Show commit history per task
- Display log excerpts for failed tasks

## Output Metrics

Calculate and display:
- Completion percentage: (completed / total) * 100
- Velocity: tasks completed per session
- Failure rate: (failed / attempted) * 100
- Average retries: total_retries / attempted_tasks
