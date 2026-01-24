---
name: project-prioritization
description: >
  Transform project data into prioritized task lists grouped by complexity (FAST/MED/HIGH).
  WHEN: Daily triage, weekly planning, identifying bottlenecks, creating engineering plans.
  WHEN NOT: Looking up single project (use rundown), portal automation (use browser-agent).
version: 1.1.0
---

# Project Prioritization Skill

Transform interconnection project data into actionable task lists and insights dashboards.

## Quick Start

### 1. Get Portfolio Summary
```bash
# Via CLI (preferred)
python -m ix_agent.cli change-feed --json

# Or via Code Mode
ix.lookup_search("", utility="PSE", limit=50)
```

### 2. Apply Priority Framework
| Priority | Criteria | Action |
|----------|----------|--------|
| **P0** | Blocked, deadline imminent | Immediate |
| **P1** | Aging >14 days, SLA risk | This week |
| **P2** | Standard workflow | Next batch |
| **P3** | No deadline | When capacity |

### 3. Group by Complexity
| Bucket | Time | Examples |
|--------|------|----------|
| **FAST** | 5-30 min | Status update, quick email |
| **MED** | 30-120 min | Portal submission, doc gathering |
| **HIGH** | 120+ min | Utility escalation, resubmission |

---

## When to Use

| Task | Use This? | Alternative |
|------|-----------|-------------|
| Daily triage / standup | Yes | - |
| Weekly planning | Yes | - |
| Identify bottlenecks | Yes | - |
| Create engineering plan | Yes | - |
| Single project lookup | No | `rundown` |
| Portal automation | No | `browser-agent` |

---

## Priority Signals

| Signal | Priority Impact |
|--------|-----------------|
| Status = "Blocked" / "On Hold" | +100 (P0) |
| Days Since Update > 30 | +80 |
| Days Since Update > 14 | +40 |
| Missing Documents | +30 |
| Utility SLA at risk | +50 (P1) |
| Larger system size (kW) | +20 |

---

## Output Format

### Machine-Readable (JSON)
```json
{
  "title": "IX Triage - 2026-01-14",
  "sum": "18 blocked projects, 5 need immediate action",
  "buckets": {
    "fast": [{"id":"F1","t":"Upload bill","p":"P0","own":"IX","min":15}],
    "med":  [{"id":"M1","t":"Resubmit IXP1","p":"P1","own":"IX","min":60}],
    "high": [{"id":"H1","t":"Utility escalation","p":"P1","own":"IX","min":180}]
  }
}
```

### Human-Readable (Markdown)
```markdown
### IX Triage - 2026-01-14
**Summary:** 18 blocked, 5 need action

#### Super Fast Tasks
| ID | P | Task | Min |
|----|---|------|-----|
| F1 | P0 | Upload bill | 15 |

#### Medium Tasks
| ID | P | Task | Min |
|----|---|------|-----|
| M1 | P1 | Resubmit IXP1 | 60 |

#### High-Effort Tasks
| ID | P | Task | Min |
|----|---|------|-----|
| H1 | P1 | Utility escalation | 180 |
```

---

## Analysis Workflow

### Step 1: Get Data
```bash
# Check freshness first
python -m ix_agent.cli status

# Get change feed (preferred)
python -m ix_agent.cli change-feed --since-hours 24 --json

# Or portfolio summary via MCP
portfolio_summary with utility: "PSE"
```

### Step 2: Calculate Priorities
```python
def calculate_priority(project):
    score = 0
    if 'blocked' in project.get('status', '').lower():
        score += 100
    if project.get('days_since_update', 0) > 14:
        score += 40
    if project.get('missing_docs'):
        score += 30
    return score
```

### Step 3: Group by Complexity
```python
def assign_bucket(task):
    if task['estimated_minutes'] <= 30:
        return 'fast'
    elif task['estimated_minutes'] <= 120:
        return 'med'
    return 'high'
```

---

## Dashboard Metrics

### Pipeline Health
- Total active projects
- Projects by status (Active/Held/Blocked)
- Aging distribution (0-7, 8-14, 15-30, 30+ days)

### Bottlenecks
- Awaiting utility response
- Missing customer signatures
- Incomplete documents

### Velocity
- Average days per stage
- Submissions this week vs last
- Approvals this week vs last

---

## Owner Codes

| Code | Meaning |
|------|---------|
| **IX** | Interconnection team |
| **OPS** | Operations |
| **QA** | Quality assurance |
| **DATA** | Data/analytics |

---

## Complexity Guide

| Bucket | Time | Risk | Examples |
|--------|------|------|----------|
| FAST | 5-30 min | Low | Upload doc, update status, send email |
| MED | 30-120 min | Medium | Submit app, gather docs, portal work |
| HIGH | 120+ min | High | Escalation, resubmission, complex debug |

---

## Usage Examples

```bash
# Daily triage
"Analyze today's data, create prioritized task list for IX team"

# Utility focus
"Analyze PSE projects needing immediate attention, group by complexity"

# Weekly dashboard
"Generate pipeline health dashboard with bottleneck analysis"
```

---

## See Also

- `change-feed` - Portfolio-level change detection
- `rundown` - Single project status
- `assist` - Recommendations for blocked projects
- `albatross-pipeline-review` - OPEN vs HOLDING classification
