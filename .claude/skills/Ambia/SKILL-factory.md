---
name: Ambia
description: >
  Coordinate solar interconnection across Salesforce/TaskRay and utility portals.
  WHEN: Logging approvals, updating tasks, preparing applications, extracting log reviews.
  WHEN NOT: Data lookup (use ix-codemode), browser automation details (use browser-agent).
---

# Ambia Skill

Coordinate end-to-end interconnection lifecycle. **Act autonomously but never submit without user approval.**

## Workflow Router

| User Says | Do This | Required Inputs |
|-----------|---------|-----------------|
| "Check on [project]" | Search SF > Navigate to IX task > Review status | Customer name OR project ID |
| "Log the approval" / "Log Part 1" / "Log PTO" | [Workflow 1: Log Approval](#workflow-1-log-approval) | Customer name, Part number (1 or 2) |
| "Reassign to [name]" | [Workflow 3: Update Owner](#workflow-3-update-owner) | Customer name, New owner name |
| "Prepare application for [project]" | [Workflow 4: Prepare Application](#workflow-4-prepare-application) | Customer name, Utility name |
| "Extract log reviews" | [Workflow 5: Extract Logs](#workflow-5-extract-log-reviews) | Customer name OR project ID |

**If unclear**, ask: "Would you like me to (1) check status, (2) log approval, (3) update owner, (4) gather docs, or (5) extract logs?"

**Missing inputs?** Ask before proceeding. Example: "I need the Part number (1 or 2) to log the approval. Which part?"

---

## Safety Gates

| Action | Requirement |
|--------|-------------|
| Portal submission | **STOP. USER APPROVAL REQUIRED.** |
| Sending emails | **STOP. USER APPROVAL REQUIRED.** |
| Data deletion | **STOP. USER APPROVAL REQUIRED.** |
| Credentials | Fetch ONLY from Salesforce Utility Database. Never echo secrets. |

### Never Do

- Log approvals on the main Project page (always use IX Task)
- Store passwords in TaskRay notes
- Use lookalike portal URLs (verify domain first)
- Guess coordinates (use site survey or design docs)
- Create duplicate applications (check notes/uploads first)
- Submit without explicit user confirmation

---

## Critical Navigation Rule

**For ALL IX task work**: Related tab -> TaskRay Tasks list (URL contains `/related/TASKRAY__Tasks__r/view`)

Filter by task ID prefix `a03US` (TaskRay tasks). Ignore `00T`/`00TD` (standard SF Tasks).

---

## Workflow 1: Log Approval

**Trigger**: "Log approval", "Log Part 1", "Log PTO"

1. Search Salesforce for customer/project
2. Navigate: Opportunity -> TaskRay Projects -> Project -> Related -> TaskRay Tasks
3. Open "Receive and Process IX Part [1/2]" task
4. **CHECKPOINT**: Confirm with user: "Found [Task Name] for [Customer]. Log Part [1/2] approval?"
5. Create Activity: Subject="Interconnection: Approved", Status=Completed
6. Comment: `[MM-DD] - Part [1/2] Approval received. Documentation uploaded.`

**Part 1 = Approval. Part 2 = PTO.** Don't mix them.

---

## Workflow 2: Salesforce Search

1. Global search: customer identifier (omit street suffix: "6455 MILANO" not "6455 MILANO ST")
2. Find Opportunity or TaskRay Project in results
3. Navigate to TaskRay Project page
4. Related tab -> TaskRay Tasks -> Filter by `a03US` prefix
5. Find IX task (name contains "IX")

---

## Workflow 3: Update Owner

1. Navigate to IX task page (via Related -> TaskRay Tasks)
2. Verify task ID starts with `a03US`
3. Click edit on Owner field (Information section)
4. Select new owner, save
5. **Don't navigate away**

Owners: Tonia Crank (Part 1), Corben Cantrell (Part 2)

---

## Workflow 4: Prepare Application

**Trigger**: "Prepare application for [project]"

**Budget**: 45 min total

| Phase | Time | Action |
|-------|------|--------|
| 1. Training Guide | 5 min | Search IX guides for utility requirements |
| 2. Project Context | 5 min | Collect from SF Opportunity + Drive |
| 3. Resource Prep | 30 min | Extract portal URL, doc checklist, credentials reference |
| 4. Consolidation | 5 min | Build master resource list |

**Stop criteria**: 70% completeness OR all 3 critical items (portal URL, doc checklist, credentials reference).

**CHECKPOINT** (before any portal work): Present resource list to user: "Ready to proceed with [Utility] portal. Confirm?"

**CHECKPOINT** (before submission): "Application ready. **USER APPROVAL REQUIRED** to submit."

**For detailed extraction steps**, see [docs/AMBIA_WORKFLOWS.md](docs/AMBIA_WORKFLOWS.md).

---

## Workflow 5: Extract Log Reviews

1. Navigate to TaskRay Project -> Related -> TaskRay Tasks
2. For EACH task with "IX" in name:
   - Open individual task page
   - Extract from Activity Timeline: date, subject, description, author
3. Consolidate chronologically
4. Summarize current state and next action

**Output format**:
```
Account: [Name]
IX Tasks Found:
1. [Task Name] (Status: [status], ID: [a03US...])
   - [Date]: [Subject] - [Description]
Current Status: [Summary]
Next Action: [What's needed]
```

---

## Log Entry Format

```
[MM-DD] - Part [1/2] {Approval/PTO} received. Documentation uploaded.
```

Examples:
- `[11-12] - Part 1 Approval received. Documentation uploaded.`
- `[11-13] - Part 2 PTO received. Documentation uploaded.`
- `[11-14] - Follow up sent regarding missing HOI. Waiting on response.`

### Task Types

| Type | Status | Use For |
|------|--------|---------|
| Interconnection: Submitted | Open | Track submissions |
| Interconnection: Approved | Completed | Record approvals |
| Interconnection: Follow Up | Completed | Request missing docs |

---

## Error Handling

| Error | Action |
|-------|--------|
| **RecordNotFound** | Try alternates (address without suffix, project code). If still not found, create Follow Up with search details. |
| **DocMissing** | Create Request for customer. Log what's missing and where you looked. |
| **Portal login fails** | Check credentials in Salesforce Utility Database. Max 1 reset attempt, then create Follow Up. |
| **TaskRay Tasks not found** | Verify you're on TaskRay Project page (not Opportunity). Check Related tab is expanded. |

---

## Context Gathering (Stop Criteria)

Proceed when you have **70% completeness** with these 3 critical items:
1. Portal URL (or documented assumption with search evidence)
2. Document checklist (min 50% of required docs identified)
3. Credentials reference from Salesforce Utility Database

If blocked on portal URL after checking training guide + `/docs/references/`, create Follow Up and stop.

---

## Quick Reference

### Verify TaskRay Project Page

- URL contains `/TASKRAY__Project__c/`
- Header shows "TaskRay Project: [ID]"
- Related tab visible

### IX Task Names

- Prepare IX Part 1/2
- Request IX Part 1/2
- Receive and Process IX Part 1/2

### Task Status Meanings

| Status | Meaning |
|--------|---------|
| Open | Actively working |
| Holding | Blocked, needs action |
| Completed | Done |

---

## Extended Documentation

| Topic | Location |
|-------|----------|
| Full workflow details | [docs/AMBIA_WORKFLOWS.md](docs/AMBIA_WORKFLOWS.md) |
| IX Task data model | [docs/AMBIA_REFERENCE.md](docs/AMBIA_REFERENCE.md) |
| DSPy templates | [docs/DSPY_PROMPTS.md](docs/DSPY_PROMPTS.md) |
| Utility profiles | [.claude/domains/utilities/](.claude/domains/utilities/) |
