# Utility Lookup Guide

**For agents: How to find and apply utility-specific IX requirements.**

---

## Quick Lookup Process

### Step 1: Identify the Utility
From project data, extract the utility name from:
- **Albatross**: Project page → Left sidebar → "Utilities" section → "Utility Company" field
- **Salesforce**: Opportunity → Account → Utility field
- **CLI**: `python -m ix_agent.cli lookup "<project>" --json` → `utility_company`

### Step 2: Load Utility Guide
```
.claude/domains/utilities/{utility-slug}.md
```

**Slug format**: lowercase, hyphens, no special chars
- "Xcel Energy MN" → `xcel-energy-mn.md`
- "Arizona Public Service (APS)" → `arizona-public-service-aps.md`
- "Duke Energy NC" → `duke-energy-nc.md`

### Step 3: If Not Found
1. Check `_index.md` for alternate names
2. Try partial match: `ls .claude/domains/utilities/*xcel*.md`
3. Fallback to `generic.md` for common patterns

---

## Utility Guide Structure

Each utility guide contains:

```markdown
# {Utility Name}

## Quick Facts
- Portal Type: PowerClerk | Native | Email
- Application Fee: $X
- Typical Timeline: X-Y weeks

## Portal Access
- URL: {portal_url}
- Credentials: See Salesforce Utility Database

## IXP1 Process (Part 1 Application)
{steps}

## IXP2 Process (Part 2 / PTO)
{steps}

## Bill Verification Requirements
{requirements}

## Common Rejection Reasons
{reasons with resolutions}

## Contacts
{DG coordinator, support emails}
```

---

## Platform Process Map

### Where Things Happen

| Process Step | Albatross | Salesforce |
|--------------|-----------|------------|
| **View queue/workload** | `/workQueue` | N/A |
| **Check project status** | `/project/{ID}/status` | Opportunity overview |
| **Log IX activity** | Notes panel (read-only ref) | **TaskRay Task** (primary) |
| **Update task owner** | N/A | TaskRay Task → Owner field |
| **Find utility info** | `/database/utility` | Utility Database object |
| **Track milestones** | Center workflow panel | TaskRay Task fields |
| **Export pipeline data** | Queue → Export button | Reports |

### Process Ownership

```
ALBATROSS owns:
├── Queue prioritization
├── Project stage tracking
├── Workflow milestones
├── Utility database (SOP info)
└── Pipeline metrics

SALESFORCE owns:
├── IX task logging (PRIMARY)
├── Task ownership
├── Activity timeline
├── Document attachments
└── Customer communication history
```

---

## IX Lifecycle by Platform

### Phase 1: Pre-Application

| Task | Platform | Location |
|------|----------|----------|
| Bill verification | Albatross | Queue 35 (SmartList 2141) |
| Prepare application | Both | Gather docs from both |
| Verify utility requirements | Albatross | `/database/utility/{ID}` |

### Phase 2: Application Submission

| Task | Platform | Location |
|------|----------|----------|
| Send for signature | Salesforce | TaskRay: "Request IX Part 1" |
| Track signature status | Albatross | Queue 136 (SmartList 2068) |
| Submit to utility | External | Utility portal (PowerClerk/Native) |
| Log submission | **Salesforce** | TaskRay Task → Log Entry |

### Phase 3: Approval Tracking

| Task | Platform | Location |
|------|----------|----------|
| Monitor approval queue | Albatross | Queue 38 (SmartList 2246) |
| Check utility portal | External | Utility-specific |
| Log approval received | **Salesforce** | TaskRay Task → Log Entry |
| Update milestone | Albatross | Auto-syncs from Salesforce |

### Phase 4: PTO/Energization

| Task | Platform | Location |
|------|----------|----------|
| Track meter installation | Albatross | Queue 41 (SmartList 2249) |
| PTO follow-up | Albatross | Queue 42 (SmartList 2251) |
| Log PTO received | **Salesforce** | TaskRay Task → Log Entry |
| Close project | Both | Stage → Energized |

---

## Agent Decision Logic

```python
def where_to_work(task_type):
    """Determine which platform to use for a given task."""

    ALBATROSS_TASKS = [
        "view_queue",
        "check_status",
        "export_pipeline",
        "lookup_utility_info",
        "check_milestones",
        "review_notes"  # read-only
    ]

    SALESFORCE_TASKS = [
        "log_activity",      # PRIMARY for all logging
        "update_owner",
        "track_task_status",
        "view_timeline",
        "attach_documents"
    ]

    EXTERNAL_TASKS = [
        "submit_application",  # Utility portal
        "check_portal_status", # Utility portal
        "download_approval"    # Utility portal
    ]

    if task_type in ALBATROSS_TASKS:
        return "albatross"
    elif task_type in SALESFORCE_TASKS:
        return "salesforce"
    elif task_type in EXTERNAL_TASKS:
        return "utility_portal"
    else:
        return "ask_user"
```

---

## Common Utility Lookup Queries

### By State (Top Markets)

| State | Major Utilities | Guide Count |
|-------|-----------------|-------------|
| TX | Oncor, CenterPoint, AEP Texas | 37 |
| CA | PG&E, SCE, SDG&E | 10 |
| FL | FPL, Duke FL, TECO | 18 |
| NC | Duke NC, Duke Progress | 25 |
| MN | Xcel MN, Connexus | 14 |

### By Portal Type

| Type | Example Utilities | Lookup |
|------|-------------------|--------|
| PowerClerk | Xcel, Duke, FPL | Check `portal_type: powerclerk` |
| Native | PG&E, SCE, APS | Utility-specific process |
| Email | Small munis, co-ops | Manual submission |

### Quick State Lookup
```bash
# Find all utilities for a state
ls .claude/domains/utilities/*.md | xargs grep -l "State: TX"

# Or use the index
grep "| TX |" .claude/domains/utilities/_index.md
```

---

## Integration with CLI

```bash
# Get utility from project lookup
python -m ix_agent.cli lookup "123 Main St" --json | jq '.utility_company'

# Then load the guide
cat ".claude/domains/utilities/$(echo 'xcel-energy-mn' | tr ' ' '-' | tr '[:upper:]' '[:lower:]').md"
```

---

## Fallback: Generic Process

If utility guide not found, use `generic.md`:

1. **Application**: Most utilities accept PDF application + one-line diagram
2. **Fee**: Typically $0-$150 for residential
3. **Timeline**: 2-4 weeks for standard residential
4. **Portal**: Check Salesforce Utility Database for URL/credentials

---

*358 utility guides available in `.claude/domains/utilities/`*
