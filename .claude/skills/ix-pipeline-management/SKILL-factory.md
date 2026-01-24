---
name: ix-pipeline-management
description: >
  Unified skill for managing solar interconnection (IX) pipeline across Albatross and Salesforce.
  WHEN: Managing IX projects, reviewing queues, logging approvals, submitting applications, or coordinating between platforms.
  WHEN NOT: Single-platform operations (use platform-specific skills), data refresh (use ix-codemode).
allowed-tools: Read, Grep, Glob, Bash, Task
---

# IX Pipeline Management Skill

## Start Here (Progressive Disclosure)

| Need | Document | Use When |
|------|----------|----------|
| **Daily operations** | `QUICKSTART.md` | Queue checks, logging, quick lookups |
| **Utility-specific info** | `UTILITY_LOOKUP.md` | Finding portal URLs, IX requirements |
| **Full reference** | This file (`SKILL.md`) | Learning workflows, complex cases |
| **Browser automation** | `DOM_SELECTORS.md` | Building/debugging automation |
| **Deep research** | `RESEARCH_FINDINGS.md` | Rejection analysis, API patterns |

### Key Principle: Platform Separation

```
ALBATROSS = View & Monitor (queues, status, milestones)
SALESFORCE = Log & Update (activities, ownership, tasks)
UTILITY PORTAL = Submit & Track (applications, approvals)
```

**Rule:** Log ALL IX activity in Salesforce TaskRay Tasks, NOT Albatross notes.

---

## Overview

This skill provides unified guidance for managing the solar interconnection pipeline across **two primary platforms**:

1. **Albatross** (`https://albatross.myblueraven.com`) - SunPower/Blue Raven's project management and IX operations platform
2. **Salesforce/TaskRay** - CRM with TaskRay project/task management for IX workflows

The skill enables any compatible agent to:
- Navigate both platforms efficiently
- Understand project status across systems
- Execute IX workflows (approvals, submissions, reviews)
- Maintain data consistency between platforms

### Utility Knowledge Base

**358 utility guides** available at `.claude/domains/utilities/`

To find utility-specific IX requirements:
1. Get utility name from project lookup
2. Load guide: `.claude/domains/utilities/{utility-slug}.md`
3. See `UTILITY_LOOKUP.md` for detailed lookup process

---

## Quick Reference

### Platform URLs

| Platform | Base URL | Primary Purpose |
|----------|----------|-----------------|
| **Albatross** | `albatross.myblueraven.com` | Queue management, project status, utility tracking |
| **Salesforce** | `*.lightning.force.com` | TaskRay projects, IX task workflows, document management |

### Key Navigation Patterns

| Action | Albatross | Salesforce/TaskRay |
|--------|-----------|-------------------|
| Find Project | `/project/{ID}/status` | Global Search → Opportunity → TaskRay Project |
| View Queue | `/workQueue/{ID}?smartlistId={SID}` | N/A (use Albatross) |
| IX Task | N/A | Related tab → TaskRay Tasks → Filter `a03US` |
| Utility Info | `/database/utility/{ID}/details` | Salesforce Utility Database |

---

## Part 1: Albatross Operations

### 1.1 Core Navigation

```
Work Queue:     /workQueue
Project:        /project/{PROJECT_ID}/status
Utility DB:     /database/utility
SmartLists:     /smartlist/mine
Dashboard:      /companyDashboard
```

### 1.2 Work Queue System

#### IX Application Flow Queues

| Queue | ID | SmartList | Target | Time |
|-------|-----|-----------|--------|------|
| Ready for utility bill verification | 35 | 2141 | 75% | 5 Days |
| Ready to send IX application | 36 | 2211 | 75% | 3 Days |
| Ready to submit IX application | 37 | 2245 | 75% | 3 Days |
| Ready for IX approval | 38 | 2246 | 70% | 2 Weeks |
| Ready for IX application resubmission | 39 | 2208 | 75% | 3 Days |
| Ready for IX signature verification | 136 | 2068 | 60% | 5 Days |
| Pending hold resolution | 496 | 5339 | - | - |
| Ready for application revision | 200 | 2247 | - | - |

#### Post-Approval Queues

| Queue | ID | SmartList | Target | Time |
|-------|-----|-----------|--------|------|
| Ready to send inspection results | 40 | 2248 | 75% | 3 Days |
| Ready for utility meter follow up | 41 | 2249 | 70% | 7 Days |
| Ready for PTO follow up | 42 | 2251 | 80% | 11 Days |
| Ready to schedule utility work | 498 | 5361 | 75% | 3 Days |
| Pending utility work | 497 | 5350 | - | - |
| Needs utility re-inspection | 81 | 2254 | 65% | 14 Days |

#### Critical Pipeline Queues

| Queue | ID | SmartList | Notes |
|-------|-----|-----------|-------|
| Post-FIV Pre-FC Pipeline | 428 | 4531 | Largest queue (~700+ projects) |
| Needs immediate escalation | 455 | 4838 | HIGH PRIORITY |
| Pending IX approval for PTO | 303 | 2918 | - |
| Needs multiple failed IX review | 656 | 7912 | - |

### 1.3 Project Status Types

#### HELD Statuses (Our Action Needed)

| Status | Meaning | Action |
|--------|---------|--------|
| `IX Resubmission Hold (Signature)` | Customer signature needed | Outreach |
| `Pending Design Rework` | Design rejected | Design team |
| `IX Resubmission Hold (Revision/Rework)` | Utility rejected | Fix & resubmit |
| `Pending HOI Renewal` | Insurance expired | Customer |
| `Needs Resolution - Utilities` | Utility issue | Coordinator |

#### ACTIVE Statuses (In Progress)

| Status | Meaning |
|--------|---------|
| `Active` | Being worked |
| `Pending IX Application Approval` | Submitted, waiting utility |
| `Pending Utility Bill Verification` | Waiting verification |

### 1.4 Project Tags (Priority Indicators)

| Tag | Priority | Action |
|-----|----------|--------|
| `Legal Involvement` | **CRITICAL** | **DO NOT TOUCH** |
| `Escalated` | HIGH | Prioritize |
| `Post SC 270+` | HIGH | Expedite |
| `ITC` | MEDIUM | Track tax deadlines |
| `Backup Battery Only` | MEDIUM | Different IX process |

### 1.5 Project Detail Page (3-Panel Layout)

**Left Sidebar** (15+ sections):
- General: Project Manager, AHJ, Utility, Metro Area
- Milestones: Workflow stage tracking
- **Utilities**: Account info, **IX Application ID**, Meter/Premise numbers
- Permitting: Permit numbers, approval dates
- Documents: Uploaded files

**Center Panel** (8-Stage Pipeline):
```
Project Consultation → Qualification → Design → Installation Prep
→ Installation → Inspection → Energization → Energized
```

**Right Panel** (Notes & Activities):
- Timeline / Topic tabs
- Tags: #interconnection, #work-order, #credit, #permitting
- Search and filter capabilities

### 1.6 Data Extraction (JavaScript)

```javascript
// Quick project data extraction
JSON.stringify({
  projectId: document.querySelector('.project-id')?.textContent?.trim(),
  stage: document.querySelector('.project-stage')?.textContent?.trim(),
  status: document.querySelector('.status-badge')?.textContent?.trim(),
  owner: document.querySelector('.owner-name')?.textContent?.trim(),
  utility: document.querySelector('.utility-company')?.textContent?.trim()
});
```

---

## Part 2: Salesforce/TaskRay Operations

### 2.1 Core Navigation

```
Opportunity:     /lightning/r/Opportunity/{ID}/view
TaskRay Project: /lightning/r/TASKRAY__Project__c/{ID}/view
TaskRay Task:    /lightning/r/TASKRAY__Task__c/{ID}/view
```

### 2.2 Finding IX Tasks (Critical Path)

**ALWAYS follow this pattern for IX task work:**

1. Navigate to TaskRay Project page
2. Click **Related** tab
3. Click **TaskRay Tasks** link (URL: `/related/TASKRAY__Tasks__r/view`)
4. Filter by task ID prefix `a03US` (ignore `00T`/`00TD`)
5. Find task with "IX" in name

**IX Task Names:**
- Prepare IX Part 1 / Part 2
- Request IX Part 1 / Part 2
- Receive and Process IX Part 1 / Part 2

### 2.3 IX Task Structure

#### Key Date Fields

| Field | Purpose |
|-------|---------|
| Open Date | Task created |
| Most Recent Open Date | Last reopened |
| Task Due | Target completion |
| Estimated End Date | Projected end |
| Actual Completion Date | When completed |

#### IXP1/IXP2 Details Section

| Field | Purpose |
|-------|---------|
| IXP1 Application Prepared | Date prepared |
| IXP1 Application Submitted | Date submitted |
| IXP1 Application Approved | Date approved |
| IXP1 Application Fee | Fee amount |
| IXP1 Application REF# | Utility reference |
| IXP1 Application Expiration | Approval expires |

### 2.4 Task Status Values

| Status | Meaning |
|--------|---------|
| **Open** | Actively being worked |
| **Holding** | Awaiting info/external action |
| **Reopened** | Returned for additional work |
| **Completed** | Task finished |
| **Inactive** | Not currently active |
| **Not Applicable** | Doesn't apply |

### 2.5 Activity Log Subjects

| Subject | Purpose |
|---------|---------|
| Interconnection: Payment | Payment updates |
| Interconnection: Submitted | Submission confirmations |
| Interconnection: Approved | Approval notifications |
| Interconnection: Follow Up | Follow-up actions |
| Interconnection: Utility Communication | Utility comms |

---

## Part 3: Unified Workflows

### 3.1 Workflow Selection Guide

| User Request | Workflow | Platform |
|--------------|----------|----------|
| "Check queue health" | Pipeline Review | Albatross |
| "Find project [X]" | Project Lookup | Both |
| "Log approval for [X]" | Log Approval | Salesforce |
| "Update task owner" | Task Update | Salesforce |
| "Prepare IX application" | Application Prep | Both |
| "Extract log reviews" | Log Extraction | Salesforce |
| "Export queue data" | Queue Export | Albatross |

### 3.2 Pipeline Review Workflow

**Goal**: Classify projects as OPEN (utility action) or HOLDING (our action)

**Classification Rules:**

```
OPEN (In Utility Hands):
- Application submitted, awaiting response
- Inspection results sent, awaiting meter order
- Meter ordered, awaiting PTO
- No internal blockers

HOLDING (Our Action Needed):
- Waiting for customer signature
- Document fixes needed (HOI, bill verification)
- Rejection received, needs resubmission
- Design rework required
```

**Decision Tree:**
```
Start
  ├─ Status = HELD?
  │   ├─ "Pending Utility Work" → OPEN
  │   └─ Anything else → HOLDING
  ├─ Submitted date without approval?
  │   └─ Yes → OPEN
  ├─ Sent date without signed date?
  │   └─ Yes → HOLDING (signature needed)
  └─ Approved but no next step?
      └─ Yes → HOLDING
```

### 3.3 Log Approval Workflow (Salesforce)

```
1. Search Salesforce: "[ADDRESS]" (omit street suffix)
2. Navigate: Opportunity → TaskRay Project → Related tab
3. Open: "Receive and Process IX Part [1|2]" task
4. Create New Task in Activity panel:
   - Subject: "Interconnection: Approved"
   - Status: Completed
   - Comment: [MM-DD] – Part [1|2] Approval received. Documentation uploaded.
5. Save

⚠️ CRITICAL: Log INSIDE the IX Task, NOT on Project page
⚠️ Part 1 = "Approval" (never use "PTO" for Part 1)
⚠️ Part 2 = "PTO"
```

### 3.4 Application Preparation Workflow

**Phase 1: Training Guide Search** (5 min)
- Find utility-specific training guide
- Extract: Portal URL, fees, required docs

**Phase 2: Project Context Collection** (5 min)
- Salesforce Opportunity → Google Drive folders
- Collect: Customer info, system specs

**Phase 3: Resource & Portal Prep** (30 min total)
- Extract credentials from Salesforce Utility Database
- Verify portal URL matches approved domain
- Build document checklist

**Phase 4: Gemini Drive Fast-Scan**
```
Q1: project:{name} type:pdf|png|jpg
Q2: name:(utility OR bill) (png|pdf)
Q3: name:(insurance OR HOI) (pdf)
Q4: name:(one-line OR SLD) (pdf)
Q5: name:(placard) (pdf|png)
```

**Submission Gate** (HARD STOP):
- ⛔ NEVER submit without explicit user approval
- Checklist: All docs present? Fees reviewed? Field map complete?

### 3.5 Extract Log Reviews Workflow (Salesforce)

```
1. Navigate to TaskRay Project → Related → TaskRay Tasks
2. Filter by a03US prefix (ignore 00T/00TD)
3. For EACH IX task:
   - Open individual task page
   - Extract Activity Timeline entries:
     * Date, Subject, Description, Author
     * Blockers, actions, status changes
4. Consolidate chronologically
5. Summarize current project state
```

---

## Part 4: Cross-Platform Data Mapping

### Milestone Field Mapping (Albatross → Canonical)

| Albatross CSV | Canonical Field |
|---------------|-----------------|
| `fdc_date` | `project_accepted` |
| `utility_bill_verified` | `bill_verified` |
| `ia_sent_to_ho` | `ixp1_prepared` |
| `ia_submitted` | `ixp1_submitted` |
| `ia_signed` | `ixp1_signed` |
| `ia_approved` | `ixp1_approved` |
| `fi_verified` | `electrical_fin_received` |
| `fc_date` | `install_complete` |
| `eto_insp_passed` | `inspections_complete` |
| `fi_submitted` | `ixp2_submitted` |
| `fi_received` | `ixp2_approved` |
| `meter_ordered` | `meter_ordered` |
| `rebate_app_approved` | `pto_granted` |

### IX-Agent CLI Integration

```bash
# Check data freshness
python -m ix_agent.cli status

# Project lookup (supports both platforms)
python -m ix_agent.cli lookup "<project_id>" --json

# Full rundown with milestones
python -m ix_agent.cli rundown "<project_id>" --json

# AI recommendations
python -m ix_agent.cli assist "<project_id>" --json

# Refresh data
python -m ix_agent.cli refresh
```

---

## Part 5: Safety Rules & Best Practices

### ✅ ALWAYS Do

1. Log approvals **INSIDE the IX Task**, not Project page
2. Search addresses **WITHOUT street suffix** ("6455 MILANO" not "6455 MILANO ST")
3. For Part 1: Use **"Approval"** (never "PTO")
4. Fetch credentials **ONLY from Salesforce Utility Database**
5. **Mask secrets** (show only last 3 chars)
6. **Never submit without user approval**
7. Navigate to **Related → TaskRay Tasks** for IX work
8. Filter by **`a03US`** prefix for TaskRay tasks

### ❌ NEVER Do

1. Don't log on the main Project page
2. Don't store passwords in TaskRay notes
3. Don't use lookalike portal URLs
4. Don't guess coordinates (use site survey)
5. Don't create duplicate applications
6. Don't confuse `00T`/`00TD` with `a03US` task IDs
7. Don't touch projects tagged **"Legal Involvement"**

### Critical Patterns to Detect

| Pattern | Action |
|---------|--------|
| "DO NOT TOUCH" | **Never automate** |
| "Legal Involvement" | **Requires approval** |
| "DO NOT FOLLOW UP" | Skip automation |
| "SALES ENABLEMENT TAKING OVER" | Monitor only |

---

## Part 6: Related Skills & Resources

| Skill | Purpose |
|-------|---------|
| `albatross-navigation.md` | Queue IDs, URL patterns |
| `albatross-exploration.md` | Fast extraction methodology |
| `albatross-data-extraction.md` | JavaScript techniques |
| `albatross-knowledge-base` | Read-only reference |
| `Ambia` | Full Salesforce/TaskRay workflows |
| `browser-agent/workflows/albatross.md` | Browser automation |
| `browser-agent/workflows/salesforce.md` | SF automation |

### Utility Knowledge Base

Location: `.claude/domains/utilities/`

350+ utilities documented with:
- Portal type (PowerClerk, Native)
- Application fees
- Timeline expectations
- Bill verification requirements
- Common rejection reasons

### Supporting Documentation (This Skill)

| File | Contents |
|------|----------|
| `SKILL.md` | This file - Main skill documentation |
| `QUICKSTART.md` | 80% use cases, daily operations |
| `UTILITY_LOOKUP.md` | Utility guide access + platform separation |
| `UTILITY_SKILL_IMPROVEMENT.md` | Self-improvement roadmap (CASCADE, Reflexion) |
| `DOM_SELECTORS.md` | Live-captured Albatross DOM structure |
| `RESEARCH_FINDINGS.md` | Deep research on IX topics |
| `skill_metrics.yaml` | Per-utility validation metrics |

### Utility Skill Improvement

**Problem**: 96% of utility guides (343/358) have placeholder text "See raw SOP file for details".

**Solution**: Self-improving agent patterns based on state-of-the-art research:

1. **CASCADE Pattern**: Skill library with DRAFT → LEARNING → VERIFIED states
2. **Reflexion Pattern**: Learn from rejection outcomes and update guides
3. **SEAgent Pattern**: Observe → Analyze → Update feedback loop

**Tools**:
- `scripts/enrich_utility_guide.py` - LLM-powered guide enrichment
- `scripts/log_ix_outcome.py` - Track submission outcomes (TODO)
- `skill_metrics.yaml` - Validation status per utility

**Workflow**:
```bash
# Enrich a single utility guide
python scripts/enrich_utility_guide.py --utility-id 383

# Batch enrich top 5 priority utilities
python scripts/enrich_utility_guide.py --batch --limit 5 --dry-run
```

See `UTILITY_SKILL_IMPROVEMENT.md` for full implementation roadmap.

---

## Version History

- **2026-01-18 (v1.2)**: Added utility skill improvement system with self-improving agent patterns
- **2026-01-18 (v1.1)**: Added RESEARCH_FINDINGS.md with deep research on TaskRay DOM, PowerClerk API, utility portals, and rejection analysis
- **2026-01-18 (v1.0)**: Initial unified skill consolidating Albatross + Salesforce operations
- Sources: albatross-navigation, albatross-knowledge-base, Ambia, browser-agent workflows, web research
