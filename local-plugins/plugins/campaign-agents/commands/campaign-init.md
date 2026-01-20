---
name: campaign-init
description: Initialize a new coding campaign with goal and optional name
allowed-tools: ["Read", "Write", "Bash", "Task", "Glob", "Grep", "TodoWrite"]
argument-hint: "<goal> [--name <campaign-name>]"
---

Initialize a new long-running coding campaign.

## What You Will Do

1. **Parse Arguments**:
   - Extract the campaign goal from the user's input
   - Extract optional --name parameter, or generate from goal

2. **Create Campaign State**:
   - Generate a unique campaign ID (UUID v4)
   - Create state directory: `${CLAUDE_PLUGIN_ROOT}/state/campaigns/<id>/`
   - Initialize campaign.json with metadata
   - Initialize empty tasks.json

3. **Set Up Git Branch**:
   - Create main campaign branch: `campaign/<name>`
   - Record base branch (usually main/master)

4. **Spawn Campaign Planner**:
   - Use the Task tool to spawn the campaign-planner agent
   - Pass the campaign goal and project context
   - The planner will analyze the codebase and create the task graph

## State Files to Create

### campaign.json
```json
{
  "id": "<uuid>",
  "name": "<campaign-name>",
  "goal": "<user's goal>",
  "status": "active",
  "created_at": "<ISO timestamp>",
  "last_activity": "<ISO timestamp>",
  "project_path": "<current working directory>",
  "base_branch": "main",
  "campaign_branch": "campaign/<name>",
  "checkpoints": [],
  "metrics": {
    "tasks_total": 0,
    "tasks_completed": 0,
    "tasks_failed": 0,
    "retries_total": 0
  }
}
```

### tasks.json
```json
{
  "tasks": []
}
```

## Output to User

After initialization, report:
- Campaign ID and name
- Campaign goal
- State directory location
- Next steps (planner will create task graph)

## Example Usage

User: `/campaign-init Migrate all Solid.js components to React with TypeScript`

Response:
```
Campaign initialized:
- ID: abc123-def456
- Name: migrate-solid-to-react
- Goal: Migrate all Solid.js components to React with TypeScript
- State: ~/.claude/plugins/campaign-agents/state/campaigns/abc123/

Spawning campaign planner to analyze codebase and create task graph...
```
