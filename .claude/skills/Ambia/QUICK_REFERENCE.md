# Ambia Skill - Quick Reference Card

**Skill:** Ambia | **Version:** 1.1 (Merged & Enhanced) | **Date:** 2025-11-12

---

## Interconnection Workflows

### 🔹 Workflow 1: Log an Approval

```
Say: "Log the Part 1 approval for 2633 Jordan Ave"

Steps:
1. Search Salesforce: "2633 JORDAN"
2. Navigate to Opportunity → TaskRay Project → Related tab
3. Open "Receive and Process IX Part 1" task
4. Create New Task
5. Subject: "Interconnection: Approved"
6. Status: Completed
7. Comment: [MM-DD] – Part 1 Approval received. Documentation uploaded.
8. Save

Critical: Always log inside the IX Task, NOT on Project page.
For Part 1: Avoid using "PTO" (PTO is Part 2 only).

Reference: SKILL.md → Workflow 1
```

### 🔹 Workflow 2: Find a Project

```
Say: "Find the interconnection task for 6455 MILANO"

Steps:
1. Search: "6455 MILANO" (omit street suffix if needed)
2. Navigate to TaskRay Project
3. Click "Related" tab
4. Find "Receive and Process IX Part 1/2"
5. Review latest notes and status

Tips:
- Project format: 4 digits + 3-4 letters (e.g., 6455SEYM)
- If multiple projects: check address + zip code
- Task status: Completed, Open, Holding, Inactive, Not Required
- Holding/Open = currently active IX task

Reference: SKILL.md → Workflow 2
```

### 🔹 Workflow 3: Update Task Owner

```
Say: "Reassign Part 1 tasks to Tonia Crank"

Steps:
1. Open IX task page
2. Find "Owner" in Information section
3. Click edit icon
4. Enter: "Tonia Crank"
5. Select from dropdown
6. Save
7. DO NOT NAVIGATE AWAY FROM TASK PAGE

Supported Owners:
- Tonia Crank
- Corben Cantrell

Reference: SKILL.md → Workflow 3
```

---

## Application Prep/Submission Workflow

### 🔹 Workflow 4: Prepare Interconnection Application

```
Say: "Prepare the interconnection application for [PROJECT]"

Context Gathering (4 Phases):
1. Phase 1: Training Guide Search → Google connector (IX Team Training Guides)
2. Phase 2: Project Context Collection → Salesforce + Drive (Main, Docs, Site-Survey, CAD)
3. Phase 3: Resource/Portal Prep → Extract URLs, fetch credentials from Salesforce Utility Database
4. Phase 4: Consolidation → Build master resource list

Gemini Drive Fast-Scan:
- Sweep ALL linked project folders + IX guides
- Return Attachment Map: requirement → file → Drive link → last modified → pass/fail
- Proceed if ≥70% of required docs pass

Portal Navigation:
- Navigate using credentials from Salesforce Utility Database
- Fill forms using Page Rubric (Field Map, Attachment Map, Gaps, Validation)
- Validate before submission
- NEVER submit without explicit user approval

Reference: SKILL.md → Context Gathering
```

---

## Logging Standards

### Task Types

| Type | Status | Use For |
|------|--------|---------|
| Interconnection: Submitted | Open | Track submissions; append dated notes |
| Interconnection: Approved | Completed | Record approvals; mark done |
| Interconnection: Follow Up | Completed | Request missing docs |
| Customer Communication | Completed | Log customer notifications |

### Comment Format

```
[MM-DD] – Part [1|2] {Approval/PTO} received. Documentation uploaded.

Examples:
[09-23] – Part 1 Approval received. Documentation uploaded.
[09-24] – Part 2 PTO received. Documentation uploaded.
```

### Log Entry Format (Detailed)

```
[MM-DD] Source → Evidence → Decision → Change

Example:
[09-23] Approval email → "Your app approved" text → Log completion → Created Interconnection: Approved task
```

---

## Critical Rules

⚠️ **MUST do these things:**

1. Always log approvals inside the IX Task, NOT on Project page
2. Search addresses WITHOUT street suffix ("6455 MILANO" not "6455 MILANO ST")
3. For Part 1: Avoid using "PTO"; use "Approval" instead (PTO is Part 2 only)
4. Fetch credentials ONLY from Salesforce Utility Database
5. Never paste secrets in chat; mask all but last 3 characters
6. Never submit without explicit user approval
7. Verify task location before logging or updating
8. Document assumptions when proceeding with 70% completeness

⚠️ **NEVER do these things:**

1. Don't log on the main Project page
2. Don't store passwords in TaskRay notes
3. Don't use lookalike portal URLs (verify domain)
4. Don't guess on coordinates (use site survey or design docs)
5. Don't try multiple auth attempts in succession
6. Don't create duplicate applications (check notes/uploads first)
7. Don't navigate away after updating task owner

---

## Common Issues & Fixes

| Problem | Solution |
|---------|----------|
| Can't find project | Search by address without suffix; try project code (4 digits + 3-4 letters) |
| Found wrong project | Check zip code and opportunity details; verify address matches |
| Logged on wrong page | Verify you're on IX Task (with "IX" in name), not Project page |
| Portal login fails | Check credentials in Salesforce; attempt 1 reset only |
| Document illegible | Request rescan from customer with DPI requirements |
| Task owner won't update | Ensure exact name match from dropdown; refresh and retry |
| Missing documents | Create Request for customer; log what's missing and where you looked |

---

## Salesforce Pages and Their Uses

### TaskRay Project Page
Main project page, where we can see 'events' or 'tasks'. The TaskRay Project itself is called the "Project". Use the "Related" tab to access all IX tasks.

### Opportunity Page
Base for the account as a whole. Contains links to relevant information from the sale (proposal, agreement) and links to Google Drive docs.

### IX Task Pages
Tasks containing "IX" in the name:
- Prepare IX Part 1
- Request IX Part 1
- Receive and Process IX Part 1
- Prepare IX Part 2
- Request IX Part 2
- Receive and Process IX Part 2

**Task Statuses**: Completed, Inactive, Holding, Not Required, Open
- **Holding**: Action immediately needed
- **Open/Holding**: Currently active IX task with most up-to-date notes

---

## File Locations

| File | Location | Purpose |
|------|----------|---------|
| Main Workflows | SKILL.md | Complete workflows with decision tree |
| Quick Start | SKILL.md → Core Workflows | Overview + Decision Tree |
| Full Docs | README.md | Detailed usage and best practices |
| This Card | QUICK_REFERENCE.md | You are here |

---

## When to Use This Skill

✓ **Use for:**
- Logging interconnection approvals (Part 1 or Part 2)
- Finding customer projects in Salesforce
- Updating task owners
- Gathering application context
- Preparing interconnection applications
- Navigating utility portals
- Document management and organization

✗ **Don't use for:**
- General Salesforce queries (use Salesforce tools directly)
- Email composition (use email tools)
- Phone call notes (use note-taking tools)
- Non-interconnection tasks (use appropriate tools)

---

## Commands Cheat Sheet

### Interconnection Approvals
```
"Log Part 1 approval for [ADDRESS]"
"Log Part 2 PTO for [ADDRESS]"
"Record approval in TaskRay for project [ID]"
"Process the approval for [PROJECT]"
```

### Project Navigation
```
"Find interconnection task for [ADDRESS]"
"Show me the project at [ADDRESS]"
"Where is project [PROJECT_CODE]?"
"Locate the IX task for [IDENTIFIER]"
```

### Task Management
```
"Update task owner to [NAME]"
"Reassign Part 1 tasks to [NAME]"
"Change owner for [PROJECT]"
"Assign [TASK] to [OWNER]"
```

### Context & Documents
```
"Gather documents for [PROJECT]"
"Create attachment map for [PROJECT]"
"Show me what's missing for [PROJECT]"
"Prepare application context for [PROJECT]"
```

### Application Preparation
```
"Prepare the interconnection application for [PROJECT]"
"Gather application data from [PROJECT]"
"Check what documents are needed for [UTILITY]"
```

### Log Review Extraction
```
"Extract all log reviews for [PROJECT]"
"Get the project history for [ADDRESS]"
"What's the current status of [PROJECT]?"
```

---

## Advanced Features (New in v1.1)

### ✨ Gemini Drive Fast-Scan Queries

When gathering documents, use these Gemini search templates:
```
Q1: project:{OpportunityName OR street + ZIP} type:pdf OR type:png OR type:jpg
Q2: name:(utility OR bill) (png|pdf)
Q3: name:(insurance OR HOI OR COI) (pdf)
Q4: name:(one-line OR single line OR SLD OR diagram) (pdf)
Q5: name:(placard OR placards) (pdf|png)
Q6: site survey OR site-survey OR survey (folder|pdf)
```

### ✨ TaskRay URL Patterns (Critical)

**For IX Task Extraction** - Always use this URL pattern:
- `/related/TASKRAY__Tasks__r/view` - This is the correct related list
- Filter by task ID prefix: `a03US` (TaskRay Project Tasks)
- Ignore: `00T` or `00TD` (standard Salesforce Tasks)

### ✨ Tool Preambles (Every Tool Call)

Before each significant action, state:
- **Purpose**: One line explanation
- **Inputs**: Exact IDs/paths/URLs
- **Expected output**: What to expect
- **Success check**: Verifiable condition

After: **Pass/Fail** in ≤2 lines with evidence

### ✨ Reasoning Effort Levels

- **Minimal**: Read-only, single-field updates, log notes
- **Medium** (default): Multi-field updates, single portal page
- **High**: Missing docs, conflicts, multi-page filings

### ✨ Idempotence & Duplicate Defense

- **Read-before-write**: Check current state before updating
- **Duplicate check**: Search notes for prior Application IDs
- **Log no-op**: If unchanged, log and skip

### ✨ Page Rubric for Portal Pages

For each portal page, track:
- **Field Map**: `portal_field → value → source`
- **Attachment Map**: `requirement → file → Drive link → status`
- **Gaps**: `missing → retrieval plan → Assumption`
- **Validation**: Rule satisfied? (yes/no with evidence)

### ✨ Workflow 5: Extract Log Reviews (Advanced)

**Use when**: Auditing project history, analyzing blockers, reporting status

**Command**: "Extract all log reviews for [PROJECT]"

**Key Steps**:
1. Navigate to TaskRay Project → Related tab → TaskRay Tasks
2. Filter by `a03US` prefix (TaskRay Project Tasks only)
3. Open EACH IX task individually
4. Extract log reviews from Activity Timeline
5. Consolidate chronologically
6. Identify blockers and current status

**Critical**: Extract from INDIVIDUAL task pages, NOT Project page

**Output Format**:
```
Account: [Name]
Project ID: [ID]

IX Tasks Found:
1. [Task Name] (Status: [status], Owner: [owner])
   - Latest Log Review: [Date] - [Summary]
   - Current Blocker: [Summary]

Overall Status: [Summary]
Next Action: [Required action]
```

---

## Key Contacts & Owners

### Task Owners (for reassignment)
- **Tonia Crank** - Part 1 specialist
- **Corben Cantrell** - Part 2 specialist

### Utilities
- **Ameren Illinois** - Portal: `https://amerenillinoisinterconnect.powerclerk.com/`
  - Allowed domain: `https://amerenillinoisinterconnect.powerclerk.com/*`

### Reference Materials
- **Training Guides** - Google Drive (linked from projects)
- **Utility Requirements** - In training guides
- **Credentials** - Salesforce Utility Database (secure)

---

## Quick Status Check

### Before Logging an Approval:
- [ ] I have customer identifier (address or project ID)
- [ ] I have approval notification with details
- [ ] I'm logged into Salesforce
- [ ] I can see the correct TaskRay project
- [ ] I found the correct IX Task (Part 1 or Part 2)
- [ ] The task is in "Open" or "Holding" status
- [ ] I'm INSIDE the IX Task page, not on Project page

### Before Updating Task Owner:
- [ ] I'm on the IX Task page
- [ ] Owner field is visible
- [ ] New owner is in supported list (Tonia/Corben)
- [ ] I can see the edit icon
- [ ] I won't navigate away after saving

### Before Submitting Application:
- [ ] Attachment Map = all required present and legible
- [ ] Fees reviewed
- [ ] Final Field Map diffs listed
- [ ] User has explicitly approved submission
- [ ] All required documents validated (≥70% pass rate)

---

## Pro Tips

1. **Search Refinement**: If search doesn't work, remove street suffix and retry
2. **Project Code Format**: Look for 4 numbers + 3-4 letters (e.g., 3763MORR)
3. **Verification**: Always check address and zip code match before updating
4. **Logging**: Use consistent date format [MM-DD] for easy sorting
5. **Documentation**: Log assumptions when docs are incomplete (70% threshold)
6. **Security**: Always mask credentials when echoing (show only last 3 chars)
7. **Task Location**: Always verify you're in the IX Task, not Project page
8. **Part 1 vs Part 2**: Remember PTO is Part 2 only; use "Approval" for Part 1

---

## Response Format

All responses should include:

1. **Goal**: What we're trying to accomplish
2. **Plan**: Brief ordered plan before acting
3. **Actions**: What was done with tool preambles (Purpose, Inputs, Expected Output, Success Check)
4. **Log Review Entry**: Format: `[MM-DD] Source→Evidence→Decision→Change`
5. **Next Steps**: What comes next or what's needed

## Templates

### Action Plan Template
- Locate Opportunity by {identifier}
- Open TaskRay project
- Open Receive and Process Part {1_or_2}
- Update **Interconnection: Submitted** with dated note
- Create **Interconnection: Approved** as **Completed**

### Log Note Templates

**Submitted**: `[MM-DD] - Part {1_or_2} Approval or PTO received. Documentation uploaded.`

**Followup**: `[MM-DD] - Follow up sent regarding {item}. Waiting on response.`

**Customer Communication**: `[MM-DD] - Customer notified about {topic}. Summary recorded.`

**Assumption Line**: `Assumption — {statement}. Source — {source_ref}.`

---

## More Info

Full details in:
- **SKILL.md**: Main workflows with decision tree and procedures
- **README.md**: Complete documentation and best practices
- **This Card**: Quick reference for common workflows

---

**Ready to automate? Tell Claude what you need—it knows the workflows!**

Examples:
- "Log the approval for 2633 Jordan"
- "Find the project at 6455 Milano"
- "Update Part 1 tasks to Tonia Crank"
- "Gather documents for the solar project"
- "Prepare the interconnection application for [PROJECT]"
