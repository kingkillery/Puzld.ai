# IX Pipeline Management - Quick Reference

## Platform URLs

| Platform | URL Pattern | Purpose |
|----------|-------------|---------|
| Albatross Project | `/project/{ID}/status` | Project details |
| Albatross Queue | `/workQueue/{ID}?smartlistId={SID}` | Queue view |
| Albatross Utility | `/database/utility/{ID}/details` | Utility info |
| SF Opportunity | `/lightning/r/Opportunity/{ID}/view` | Customer record |
| SF TaskRay Project | `/lightning/r/TASKRAY__Project__c/{ID}/view` | Project container |
| SF TaskRay Task | `/lightning/r/TASKRAY__Task__c/{ID}/view` | IX task |

---

## Critical Queue IDs

### High Priority Monitoring

| Queue | ID | SmartList |
|-------|-----|-----------|
| Ready for IX approval | 38 | 2246 |
| Needs immediate escalation | 455 | 4838 |
| Post-FIV Pre-FC Pipeline | 428 | 4531 |
| Ready for PTO follow up | 42 | 2251 |

### Full IX Application Flow

| Queue | ID | SmartList |
|-------|-----|-----------|
| Utility bill verification | 35 | 2141 |
| Send IX application | 36 | 2211 |
| Submit IX application | 37 | 2245 |
| IX approval | 38 | 2246 |
| IX resubmission | 39 | 2208 |
| IX signature verification | 136 | 2068 |

---

## Status Quick Guide

### HELD (Our Action)
- `IX Resubmission Hold (Signature)` → Customer outreach
- `Pending Design Rework` → Design team
- `IX Resubmission Hold (Revision/Rework)` → Fix & resubmit
- `Pending HOI Renewal` → Customer insurance

### ACTIVE (Flowing)
- `Active` → Being worked
- `Pending IX Application Approval` → Waiting utility

### Tags to Watch
- **`Legal Involvement`** → DO NOT TOUCH
- **`Escalated`** → Prioritize
- **`Post SC 270+`** → Expedite

---

## Salesforce IX Task Navigation

```
1. Search: "[ADDRESS]" (no street suffix)
2. Click: Opportunity → TaskRay Projects
3. Open: TaskRay Project
4. Click: Related tab → TaskRay Tasks
5. Filter: a03US prefix (ignore 00T/00TD)
6. Open: Task with "IX" in name
```

**IX Task Names:**
- Prepare IX Part 1 / Part 2
- Request IX Part 1 / Part 2
- Receive and Process IX Part 1 / Part 2

---

## Log Entry Format

### Approval Log
```
Subject: "Interconnection: Approved"
Status: Completed
Comment: [MM-DD] – Part [1|2] Approval received. Documentation uploaded.
```

### Follow Up Log
```
Subject: "Interconnection: Follow Up"
Status: Completed
Comment: [MM-DD] - Follow up sent regarding {item}. Waiting on response.
```

---

## Classification Quick Rules

| Condition | Classification |
|-----------|----------------|
| Submitted, not approved | **OPEN** |
| Sent, not signed | **HOLDING** |
| Status = HELD (not "Pending Utility Work") | **HOLDING** |
| Meter ordered, no PTO | **OPEN** |
| Rejection in notes | **HOLDING** |

---

## CLI Commands

```bash
# Project lookup
python -m ix_agent.cli lookup "<project>" --json

# Full rundown
python -m ix_agent.cli rundown "<project>" --json

# AI recommendations
python -m ix_agent.cli assist "<project>" --json

# Data freshness
python -m ix_agent.cli status

# Refresh
python -m ix_agent.cli refresh
```

---

## Safety Checklist

Before any action:
- [ ] Verified correct platform (Albatross vs Salesforce)
- [ ] Confirmed project/task ID
- [ ] Checked for "Legal Involvement" tag
- [ ] Inside IX Task (not Project page) for Salesforce
- [ ] User approval obtained for submissions

---

## Common Mistakes to Avoid

1. ❌ Logging on Project page → ✅ Log inside IX Task
2. ❌ Using "PTO" for Part 1 → ✅ Use "Approval"
3. ❌ Searching "123 Main St" → ✅ Search "123 Main"
4. ❌ Using 00TD task IDs → ✅ Filter for a03US
5. ❌ Auto-submitting applications → ✅ Get user approval
