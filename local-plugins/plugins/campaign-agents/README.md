# Campaign Agents

Hierarchical agent system for long-running autonomous coding campaigns, implementing HiPlan, PARC, and HAWK research patterns.

**Research basis:**
- [Cursor's scaling agents](https://cursor.com/blog/scaling-agents)
- HiPlan: Hierarchical Planning with Milestone Libraries
- PARC: Parallel Autonomous Robust Coding (self-reflection)
- HAWK: Hierarchical Agent Workflow (governance layers)

## Overview

This plugin enables multi-day, autonomous coding campaigns using a strict planner/worker hierarchy. The key insight from research: **prompts matter more than elaborate orchestration**.

Core principles:
- **Separation of concerns**: Planners think, workers execute, reflectors assess
- **Fresh start pattern**: Agents ground in Git state, not conversation memory
- **Entry/exit criteria**: Every task has verifiable preconditions and success conditions
- **Circuit breakers**: Loop detection prevents runaway token consumption

## Architecture

```
[User] → /campaign-init
            ↓
[Claude Opus 4.5] → Campaign Planner (strategic, uses Repo Map)
            ↓
[Claude Opus 4.5] → Domain Planners (task breakdown per domain)
            ↓
[pk-puzldai/droid] → Workers (minimax-m2.1 / GLM-4.7 / Gemini CLI)
            ↓
[Claude Sonnet] → Task Reflector (PARC-style independent assessment)
            ↓
[Claude Sonnet] → Conflict Integrator (merge resolution if needed)
```

## Commands

| Command | Description |
|---------|-------------|
| `/campaign-init <goal>` | Start a new coding campaign |
| `/campaign-status` | View campaign progress and task board |
| `/campaign-pause` | Checkpoint and pause the campaign |
| `/campaign-resume` | Resume from last checkpoint |

## Model Configuration

| Role | Provider | Model |
|------|----------|-------|
| Campaign Planner | Claude Code | Opus 4.5 |
| Domain Planner | Claude Code | Opus 4.5 |
| Worker (Primary) | pk-puzldai/droid | minimax-m2.1 |
| Worker (Fallback) | pk-puzldai/droid | GLM-4.7 |
| Conflict Integrator | Claude Code | Sonnet |

## Git Workflow

Each task runs on its own branch:
- Branch pattern: `campaign/<campaign-id>/T<number>` (e.g., `campaign/migrate-solid/T1`)
- Atomic commits with conventional commit format
- Automatic test/lint runs before completion
- Conflict integrator handles merge conflicts

## State Management

Campaign state is stored in `~/.claude/plugins/campaign-agents/state/`:

```
state/
└── campaigns/
    └── <campaign-id>/
        ├── campaign.json    # Campaign metadata
        ├── tasks.json       # Task board
        └── logs/            # Session logs
```

## Prerequisites

- Claude Code CLI
- pk-puzldai/droid CLI with configured models
- Git

## Installation

1. Copy plugin to `~/.claude/plugins/local/campaign-agents/`
2. Enable plugin in Claude Code settings
3. Configure droid models in `config/droid-models.json`

## Usage Example

```bash
# Start a migration campaign
/campaign-init "Migrate all Solid.js components to React with TypeScript"

# Check progress
/campaign-status

# Pause for the day
/campaign-pause

# Resume next session
/campaign-resume
```

## Key Features

- **Multi-session persistence**: Continue campaigns across Claude sessions
- **Automatic retries**: Workers retry with alternate models on failure
- **Drift prevention**: Planners validate against original goal at checkpoints
- **Conflict resolution**: Automatic merge conflict handling
- **Branch cleanup**: Completed task branches are cleaned up automatically

## Configuration Files

| File | Purpose |
|------|---------|
| `config/worker-config.json` | Worker behavior, retry strategies |
| `config/droid-models.json` | Model definitions (minimax, GLM) |
| `config/routing-rules.json` | Domain-based model routing |
| `config/circuit-breakers.json` | Loop detection, resource limits |
| `config/task-schema.json` | HiPlan task specification with entry/exit criteria |
| `config/security-policy.json` | Sandbox network/resource policies |

## Key Research Patterns Implemented

### HiPlan: Global-Local Guidance
- Repo Map for context compression (90% token reduction)
- Entry/exit criteria for objective task assessment
- Step hints from milestone library

### PARC: Self-Reflection Loop
- Independent `task-reflector` agent (context-isolated from workers)
- Failure categorization: SYNTAX, LOGIC, INTEGRATION, STRATEGIC
- Escalation vs retry decision matrix

### HAWK: Governance Layers
- Workflow layer (campaign state in JSON)
- Operator layer (task routing per domain)
- Agent layer (specialized workers)
- Resource layer (security policy, sandboxing)

### Fresh Start Protocol
- Agents discard conversation memory each invocation
- Ground all decisions in Git state
- Prevents drift and hallucination loops

## Design Decisions

### Why File-Based State (Not SQL)?

This plugin uses JSON files for state persistence intentionally:

| Design Choice | Rationale |
|--------------|-----------|
| **No external dependencies** | Plugins should work without database setup |
| **Human-readable state** | Debug campaigns by reading JSON directly |
| **Git-trackable history** | Campaign state can be versioned with code |
| **Portable** | Works on any system with a filesystem |

For production systems requiring SQL persistence, implement a persistence adapter
that reads/writes the `state-schema.json` format to your database.

### Why Not LangGraph?

The execution loop in `docs/EXECUTION_LOOP.md` is **illustrative pseudocode**.
The actual orchestration uses Claude Code's native Task tool and agent system.
This approach:
- Avoids Python dependencies in a JS/shell plugin
- Leverages Claude Code's built-in parallelization
- Stays lightweight and auditable

### Milestone Library (RAG Lite)

Instead of a full vector database, the `milestones/` directory provides
file-based pattern retrieval. Use `scripts/search-milestones.sh` to find
relevant step hints by domain and keywords. Scale to vector search when needed.

## License

MIT
