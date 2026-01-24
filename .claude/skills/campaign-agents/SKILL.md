---
name: campaign-agents
description: |
  Master skill for the Campaign Agents system.
  Provides patterns for autonomous coding loops, planning, and conflict resolution.
version: 1.0.0
---

# Campaign Agents Skill

This skill provides the core logic and patterns for long-running coding campaigns in Factory.ai Droid.

## Core Agents

- **campaign-planner**: Orchestrates the entire campaign.
- **domain-planner**: Breaks down domain-specific goals.
- **conflict-integrator**: Reconciles divergent branches.
- **task-reflector**: Reviews completed work for quality.

## Commands

- `/campaign-init`: Start a new campaign.
- `/campaign-status`: Check progress.
- `/campaign-pause`: Save state.
- `/campaign-resume`: Continue work.

## Integration Patterns

### The Planning Loop
1. **Analyze**: Explore the codebase to find patterns.
2. **Breakdown**: Create a task graph in `prd.json`.
3. **Dispatch**: Spawn workers for independent tasks.
4. **Merge**: Reconcile changes using the conflict-integrator.
5. **Review**: Validate work with the task-reflector.

### State Management
State is persisted in `~/.factory/state/campaigns/`. Each campaign has its own directory with metadata and task tracking files.
