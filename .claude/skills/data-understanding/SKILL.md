---
name: data-understanding
description: >
  Quick orientation on IX data: locate sources, check freshness, summarize portfolio signals.
  WHEN: "Is data current?", "What do we know?", before running prioritization or workflows.
  WHEN NOT: Taking action on projects (use ix-workflows), portal work (use browser-agent).
version: 1.1.0
---

# Data Understanding Skill

Quickly orient on IX data, verify freshness, and summarize portfolio signals before acting.

## Quick Start

### 1. Check Freshness
```bash
python -m ix_agent.cli status
# → Shows data age and sources
```

### 2. Get Portfolio Snapshot
```bash
python -m ix_agent.cli change-feed --digest-only --json
# → Summary of changes since last review
```

### 3. Lookup Specific Project
```bash
python -m ix_agent.cli rundown "PROJECT_ID"
# → Full status with notes and recommendations
```

---

## When to Use

| Question | Use This? | Alternative |
|----------|-----------|-------------|
| "Is the data current?" | Yes | - |
| "What's in the pipeline?" | Yes | - |
| "Status of project X?" | Yes | `rundown` |
| "Submit to portal" | No | `browser-agent` |
| "Prioritize work" | No | `project-prioritization` |

---

## Data Sources

### Primary (CLI)
| Command | Data | Freshness Check |
|---------|------|-----------------|
| `status` | All sources | Built-in |
| `lookup` | Project records | Via `status` |
| `rundown` | Full project detail | Via `status` |
| `change-feed` | Delta detection | Built-in |

### Files (when needed)
| Location | Content |
|----------|---------|
| `data_output/gsheet_exports/` | Google Sheets pipeline data |
| `workspace_data/datasets/powerclerk/` | PowerClerk portal exports |
| `workspace_data/` | Project JSON/CSV artifacts |

---

## Minimal Analysis Flow

```
1. Check freshness → python -m ix_agent.cli status
2. Get snapshot → python -m ix_agent.cli change-feed --digest-only
3. Slice by need → filter by utility, stage, or holding status
4. Summarize → headline counts, then breakdowns
5. Hand off → route to ix-workflows or project-prioritization
```

---

## Freshness Guidelines

| Age | Status | Action |
|-----|--------|--------|
| < 4 hours | Fresh | Proceed |
| 4-24 hours | OK | Note age in output |
| > 24 hours | Stale | Refresh first |

### Refresh Commands
```bash
# All sources
python -m ix_agent.cli refresh

# Specific source
python -m ix_agent.cli refresh --gsheets
python -m ix_agent.cli refresh --powerclerk
```

---

## Output Pattern

```markdown
## Data Snapshot (2026-01-14 14:00)
- Sheets: 2h old (OK)
- PowerClerk: 6h old (OK)

### Key Signals
- 18 projects changed in last 24h
- 5 blockers detected (2 P1)

### Breakdowns
- PSE: 45 active, 12 holding
- Duke: 23 active, 8 holding

### Next Actions
- Review 2 P1 blockers
- Follow up on 3 stale projects
```

---

## Key Data Fields

### Pipeline Status
| Field | Signal |
|-------|--------|
| `Project: Status` | Active/Held/Blocked |
| `List` | Current queue |
| `Task Name` | Current task |
| `Days in Queue` | Stall indicator |

### Milestones
| Field | Stage |
|-------|-------|
| `IXP1 Application Submitted` | IXP1 in progress |
| `IXP1 Application Approved` | IXP1 complete |
| `IXP2 Application Submitted` | IXP2 in progress |
| `IXP2 Application Approved` | IXP2 complete |

### Blockers
| Field | Meaning |
|-------|---------|
| `Request IXP1 Reason unable to submit` | IXP1 blocker |
| `IXP1 Rejection Reason` | Rejection cause |
| `Active Process Steps` | Current blockers |

---

## Safety

- **Do not assume freshness** - always check file mtimes or run `status`
- **Do not submit portal actions** - this skill is for understanding only
- **For portal work** - switch to `ix-workflows` + `browser-agent`

---

## See Also

- `status` - Built-in freshness check
- `change-feed` - Portfolio delta detection
- `project-prioritization` - Task ranking
- `ix-workflows` - Taking action
