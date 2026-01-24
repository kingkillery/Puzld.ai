# IX Pipeline Quick Start

**Use this for 80% of daily IX operations.**

---

## Platform Entry Points

| Platform | URL | Use For |
|----------|-----|---------|
| **Albatross** | `albatross.myblueraven.com/workQueue` | Queue review, project status |
| **Salesforce** | Search → Opportunity → TaskRay | Log approvals, update tasks |
| **Utility DB** | `albatross.myblueraven.com/database/utility` | Portal info, requirements |

---

## Find an IX Task in Salesforce (Golden Path)

```
1. Global Search: "[ADDRESS]" (omit street suffix)
2. Click: Opportunity result
3. Navigate: Related tab → TaskRay Projects
4. Open: The TaskRay Project
5. Click: Related tab → TaskRay Tasks
6. Filter: Look for a03US prefix (IGNORE 00T/00TD)
7. Open: Task with "IX" in name
```

**IX Task Names:** Prepare IX Part 1/2, Request IX Part 1/2, Receive and Process IX Part 1/2

---

## Priority Queues

| Queue | ID | SmartList | Action |
|-------|-----|-----------|--------|
| **IX Approval** | 38 | 2246 | Check daily |
| **PTO Follow Up** | 42 | 2251 | Check daily |
| **Needs Escalation** | 455 | 4838 | Immediate |
| **Submit IX App** | 37 | 2245 | Before submission |

**Queue URL:** `albatross.myblueraven.com/workQueue/{ID}?smartlistId={SID}`

---

## Quick Classification

| Condition | Class | Next Action |
|-----------|-------|-------------|
| Submitted, no approval date | **OPEN** | Wait for utility |
| Sent, not signed | **HOLDING** | Customer outreach |
| Status = HELD (not "Pending Utility Work") | **HOLDING** | Internal action needed |
| Meter ordered, no PTO | **OPEN** | Utility finalizing |
| Rejection in notes | **HOLDING** | Fix and resubmit |

---

## Log Entry Templates

### Approval Received
```
Subject: Interconnection: Approved
Status: Completed
Comment: [MM-DD] – Part [1|2] Approval received. Documentation uploaded.
```

### Follow Up Sent
```
Subject: Interconnection: Follow Up
Status: Completed
Comment: [MM-DD] – Follow up sent regarding [item]. Waiting on response.
```

---

## Safety Checks (ALWAYS DO)

1. **Check for "Legal Involvement" tag** → DO NOT TOUCH
2. **Check notes for "DO NOT TOUCH"** → Stop and escalate
3. **Verify you're INSIDE the IX Task** → Not on Project page
4. **Get user approval before submissions** → Never auto-submit

---

## CLI Commands

```bash
# Quick status check
python -m ix_agent.cli status

# Project lookup
python -m ix_agent.cli lookup "<address or ID>" --json

# Full rundown
python -m ix_agent.cli rundown "<address or ID>" --json

# AI recommendations
python -m ix_agent.cli assist "<address or ID>" --json
```

---

## When to Go Deeper

| Need | Go To |
|------|-------|
| Full workflow steps | `SKILL.md` Part 4 |
| Browser automation code | `DOM_SELECTORS.md` |
| Utility-specific rules | `.claude/domains/utilities/` |
| Rejection troubleshooting | `RESEARCH_FINDINGS.md` |
| Queue ID reference | `SKILL.md` Part 1 |

---

*Last Updated: 2026-01-18 | For full documentation see SKILL.md*
