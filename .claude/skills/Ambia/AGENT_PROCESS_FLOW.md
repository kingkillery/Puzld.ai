# Ambia Agent Process Flow

## High-Level Agent Decision Tree

```
┌─────────────────────────────────────────────────────────────┐
│              USER REQUEST RECEIVED                          │
│   "Log approval for 2633 Jordan"                           │
│   "Find project 3763MORR"                                  │
│   "Prepare IX application for [address]"                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          WORKFLOW SELECTION (Table Lookup)                  │
│                                                             │
│  Pattern Match:                                             │
│  ├─ "log approval/PTO" → Workflow 1: Log Approval          │
│  ├─ "check status/find" → Workflow 2: Search               │
│  ├─ "reassign/change owner" → Workflow 3: Update Owner     │
│  ├─ "gather docs" → Workflow 4: Context Gathering          │
│  ├─ "prepare/submit app" → Workflow 4: Full App Prep       │
│  └─ "extract log reviews" → Workflow 5: Extract Logs       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
   ┏━━━━━━━━━━━━━━┓         ┏━━━━━━━━━━━━━━┓
   ┃  SIMPLE      ┃         ┃  COMPLEX     ┃
   ┃  WORKFLOWS   ┃         ┃  WORKFLOWS   ┃
   ┃  (1,2,3,5)   ┃         ┃  (4)         ┃
   ┗━━━━━┯━━━━━━━━┛         ┗━━━━━━┯━━━━━━━┛
         │                         │
         │                         │
         └────────┬────────────────┘
                  │
                  ▼
```

---

## Workflow 1: Log Approval (Simple - 5 Steps)

```
START: "Log the Part 1 approval for 2633 Jordan"
  │
  ▼
┌──────────────────────────────────────────┐
│ 1. VALIDATE REFERENCE                   │
│    - Review link/reference provided      │
│    - Match to email/project details      │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│ 2. SALESFORCE SEARCH                     │
│    - Global search: "2633 JORDAN"        │
│    - Find Opportunity                    │
│    - Navigate to TaskRay Project         │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│ 3. NAVIGATE TO IX TASK                   │
│    - Related tab → TaskRay Tasks         │
│    - Filter by a03US prefix              │
│    - Open "Receive & Process IX Part 1"  │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│ 4. CREATE APPROVED TASK                  │
│    - Activity panel → New Task           │
│    - Subject: "Interconnection: Approved"│
│    - Status: Completed                   │
│    - Comment: [MM-DD] - Part 1 Approval  │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│ 5. LOG & REPORT                          │
│    - Save task                           │
│    - Return confirmation to user         │
└──────────────────────────────────────────┘
  │
  ▼
END: "Part 1 approval logged successfully"
```

---

## Workflow 2: Salesforce Search (Simple - 4 Steps)

```
START: "Find the project for 3763 Morrison"
  │
  ▼
┌──────────────────────────────────────────┐
│ 1. SEARCH SALESFORCE                     │
│    - Global search: "3763 MORR"          │
│    - (Omit street suffix)                │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│ 2. IDENTIFY CORRECT PROJECT              │
│    - Look for pattern: 4 digits + 3-4    │
│      letters (e.g., "3763MORR")          │
│    - Verify address/zip match            │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│ 3. NAVIGATE TO IX TASK                   │
│    - Related → TaskRay Tasks             │
│    - Filter by a03US prefix              │
│    - Find task with "IX" in name         │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│ 4. REVIEW & REPORT STATUS                │
│    - Check task status (Open/Holding)    │
│    - Review recent log entries           │
│    - Return summary to user              │
└──────────────────────────────────────────┘
  │
  ▼
END: "Project found: 3763MORR - Status: Holding"
```

---

## Workflow 3: Update Task Owner (Simple - 3 Steps)

```
START: "Reassign Part 1 tasks to Tonia Crank"
  │
  ▼
┌──────────────────────────────────────────┐
│ 1. NAVIGATE TO IX TASK                   │
│    - Find project via Workflow 2         │
│    - Related → TaskRay Tasks → Open task │
│    - Verify task ID prefix = a03US       │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│ 2. EDIT OWNER FIELD                      │
│    - Information section → Owner field   │
│    - Click edit icon                     │
│    - Select "Tonia Crank" from dropdown  │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│ 3. SAVE & CONFIRM                        │
│    - Save changes                        │
│    - DO NOT navigate away                │
│    - Return confirmation to user         │
└──────────────────────────────────────────┘
  │
  ▼
END: "Owner updated to Tonia Crank"
```

---

## Workflow 4: Prepare Application (Complex - 4 Phases)

```
START: "Prepare the interconnection application for [PROJECT]"
  │
  ▼
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ CONTEXT GATHERING MODE (4 Phases)       ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  │
  ├─────────────────────────────────────────┐
  │                                         │
  ▼                                         │
┌──────────────────────────────────────┐   │
│ PHASE 1: Training Guide Search       │   │
│ ⏱️ 5 min budget | Max 2 tool calls    │   │
│                                       │   │
│ - Use Google Drive connector          │   │
│ - Find utility-specific training      │   │
│   guide (e.g., Ameren Illinois)       │   │
│ - Extract: Portal URL, fees, docs,    │   │
│   timeline, contact info              │   │
│                                       │   │
│ OUTPUT: Training guide summary        │   │
└────────────┬──────────────────────────┘   │
             │                              │
             ▼                              │
┌──────────────────────────────────────┐   │
│ PHASE 2: Project Context Collection  │   │
│ ⏱️ 5 min budget | Max 2 tool calls    │   │
│                                       │   │
│ - Search Salesforce → Opportunity     │   │
│ - Access linked Google Drive folders: │   │
│   • Main project folder               │   │
│   • "Docs" folder                     │   │
│   • "Site-Survey" folder              │   │
│   • "CAD" folder                      │   │
│                                       │   │
│ OUTPUT: Project context summary       │   │
└────────────┬──────────────────────────┘   │
             │                              │
             ▼                              │
┌──────────────────────────────────────┐   │
│ PHASE 3: Resource & Portal Prep      │   │
│ ⏱️ 30 min TOTAL | 5 min per item      │   │
│                                       │   │
│ Extract (with concrete steps):        │   │
│ 1. Portal URL (Ctrl+F: "portal")      │   │
│ 2. Document checklist (Ctrl+F:        │   │
│    "required documents")              │   │
│ 3. Submission process (Ctrl+F:        │   │
│    "submission process")              │   │
│ 4. Fee schedule (Ctrl+F: "fee")       │   │
│ 5. Credentials (from Salesforce       │   │
│    Utility Database ONLY)             │   │
│                                       │   │
│ ⚠️ For each item:                     │   │
│ - Primary search (tool call 1)        │   │
│ - Fallback search (tool call 2)       │   │
│ - If not found → Document Assumption  │   │
│   (with validation checklist)         │   │
│                                       │   │
│ OUTPUT: Resource list with 70%        │   │
│ completeness + 3 critical items       │   │
└────────────┬──────────────────────────┘   │
             │                              │
             ▼                              │
┌──────────────────────────────────────┐   │
│ PHASE 4: Consolidation                │   │
│ ⏱️ 5 min budget | Max 2 tool calls    │   │
│                                       │   │
│ Build master resource list:           │   │
│ - Portal login (masked)               │   │
│ - Customer/property details           │   │
│ - System specifications               │   │
│ - Required documents checklist        │   │
│                                       │   │
│ OUTPUT: Master resource list          │   │
└────────────┬──────────────────────────┘   │
             │                              │
             ▼                              │
┌──────────────────────────────────────┐   │
│ COMPLETENESS CHECK                    │   │
│                                       │   │
│ ✅ 70% threshold met?                 │   │
│ ✅ All 3 critical items present?      │   │
│    1. Portal URL                      │   │
│    2. Document checklist (50%+ docs)  │   │
│    3. Utility credentials reference   │   │
│                                       │   │
│ IF YES → Proceed to Gemini scan       │   │
│ IF NO → Decision tree:                │   │
│   - Blocked? → Refinement Pass        │   │
│   - Still blocked? → Follow Up task   │   │
│   - Not blocked? → Proceed anyway     │   │
└────────────┬──────────────────────────┘   │
             │                              │
             ▼                              │
┌──────────────────────────────────────┐   │
│ GEMINI DRIVE FAST-SCAN                │   │
│                                       │   │
│ Use Gemini for Google Workspace:      │   │
│                                       │   │
│ Q1: project:{name} type:pdf|png|jpg   │   │
│ Q2: name:(utility OR bill) (png|pdf)  │   │
│ Q3: name:(insurance OR HOI) (pdf)     │   │
│ Q4: name:(one-line OR SLD) (pdf)      │   │
│ Q5: name:(placard) (pdf|png)          │   │
│ Q6: site survey (folder|pdf)          │   │
│                                       │   │
│ OUTPUT: Attachment Map                │   │
│ requirement → file → link → status    │   │
└────────────┬──────────────────────────┘   │
             │                              │
             ▼                              │
┌──────────────────────────────────────┐   │
│ ATTACHMENT VALIDATION                 │   │
│                                       │   │
│ ✅ ≥70% required docs present?        │   │
│ ✅ All docs legible?                  │   │
│ ✅ All docs match customer?           │   │
│                                       │   │
│ IF YES → Proceed to portal            │   │
│ IF NO → Create Follow Up              │   │
└────────────┬──────────────────────────┘   │
             │                              │
             └──────────────────────────────┘
             │
             ▼
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ PORTAL NAVIGATION & SUBMISSION        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  │
  ▼
┌──────────────────────────────────────┐
│ 1. PORTAL GUARD CHECK                │
│    - Verify URL matches allowed      │
│      domain (e.g., amerenillinois    │
│      interconnect.powerclerk.com)    │
│    - Reject lookalikes               │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ 2. AUTHENTICATION                    │
│    - Fetch credentials from          │
│      Salesforce Utility Database     │
│    - Mask secrets (show last 3 chars)│
│    - Login to portal                 │
│    - If auth fails: 1 reset attempt  │
│    - Still fails? → Follow Up        │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ 3. NAVIGATE TO APPLICATION FORM      │
│    - Follow portal UI                │
│    - Locate interconnection app      │
│      section                         │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ 4. FILL FORM (PAGE RUBRIC)           │
│    For EACH portal page:             │
│                                      │
│    A. FIELD MAP:                     │
│       portal_field → value →         │
│       source (SF field OR Drive doc) │
│                                      │
│    B. ATTACHMENT MAP:                │
│       requirement → file →           │
│       Drive link → upload status     │
│                                      │
│    C. GAPS:                          │
│       missing → retrieval plan →     │
│       Assumption line                │
│                                      │
│    D. VALIDATION:                    │
│       Rule satisfied? yes/no         │
│       Evidence: label/text visible   │
│                                      │
│    ⚠️ Prefer Salesforce values       │
│    ⚠️ Coordinates only from site     │
│       survey or stamped design docs  │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ 5. SUBMISSION GATE (HARD STOP)       │
│    ⛔ NEVER submit without user      │
│       approval                       │
│                                      │
│    Present checklist:                │
│    ☐ Attachment Map = all required   │
│      docs present & legible          │
│    ☐ Fees reviewed                   │
│    ☐ Final Field Map diffs listed    │
│                                      │
│    IF any = "no" → HALT              │
│       → Create Follow Up             │
│                                      │
│    IF all = "yes" → Wait for user    │
│       confirmation                   │
└────────────┬─────────────────────────┘
             │
             ▼ (User says "Yes, submit")
┌──────────────────────────────────────┐
│ 6. SUBMIT APPLICATION                │
│    - Click Submit button             │
│    - Capture confirmation            │
│    - Save Application ID/REF#        │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ 7. LOG SUBMISSION IN SALESFORCE      │
│    - Navigate to IX task             │
│    - Create "Interconnection:        │
│      Submitted" task (Open status)   │
│    - Log: [MM-DD] - Part [1|2]       │
│      submitted. App ID: [REF#]       │
└──────────────────────────────────────┘
  │
  ▼
END: "Application submitted. REF#: DER-12345"
```

---

## Workflow 5: Extract Log Reviews (Simple - 6 Steps)

```
START: "Extract all log reviews for [PROJECT]"
  │
  ▼
┌──────────────────────────────────────┐
│ 1. NAVIGATE TO TASKRAY PROJECT       │
│    - Search Salesforce               │
│    - Open TaskRay Project page       │
│    - Verify on correct project       │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ 2. ACCESS TASKRAY TASKS LIST         │
│    - Click Related tab               │
│    - Click "TaskRay Tasks" link      │
│      (URL: /related/TASKRAY__Tasks   │
│       __r/view)                      │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ 3. IDENTIFY ALL IX TASKS             │
│    - Filter by ID prefix: a03US      │
│    - Find tasks with "IX" in name:   │
│      • Prepare IX Part 1/2           │
│      • Request IX Part 1/2           │
│      • Receive & Process IX Part 1/2 │
│    - Ignore 00T/00TD tasks           │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ 4. EXTRACT FROM EACH IX TASK         │
│    FOR EACH task found:              │
│                                      │
│    A. Open individual task page      │
│    B. Locate Activity Timeline       │
│    C. Extract each log review:       │
│       - Date (MM-DD format)          │
│       - Subject (e.g., "Inter-       │
│         connection: Approved")       │
│       - Description (full text)      │
│       - Author                       │
│       - Key decision/action          │
│       - Blockers/gaps                │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ 5. CONSOLIDATE & SUMMARIZE           │
│    - Create chronological summary    │
│      across ALL IX tasks             │
│    - Identify most recent/active     │
│      task (Holding or Open status)   │
│    - Summarize current state:        │
│      • Current blocker?              │
│      • Next action needed?           │
│      • Last activity date?           │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ 6. QUALITY CHECK & REPORT            │
│    ✅ Extracted from task pages,     │
│       not Project page?              │
│    ✅ All Open/Holding tasks checked?│
│    ✅ Task IDs = a03US (not 00T)?    │
│    ✅ Descriptions complete?         │
│                                      │
│    OUTPUT: Consolidated log review   │
│    report with project status        │
└──────────────────────────────────────┘
  │
  ▼
END: "Extracted 12 log reviews from 3 IX tasks"
```

---

## Key Decision Points Across All Workflows

```
┌───────────────────────────────────────────────────────┐
│             CRITICAL DECISION GATES                   │
└───────────────────────────────────────────────────────┘

1. WORKFLOW SELECTION
   ├─ Pattern match user request
   ├─ If unclear → Ask clarifying question
   └─ Select correct workflow (1-5)

2. TASK IDENTIFICATION (Workflows 1,2,3,5)
   ├─ Always navigate: Related → TaskRay Tasks
   ├─ Filter by ID prefix: a03US (not 00T/00TD)
   └─ Verify task has "IX" in name

3. COMPLETENESS CHECK (Workflow 4 only)
   ├─ 70% threshold met?
   ├─ All 3 critical items present?
   │  1. Portal URL
   │  2. Document checklist (50%+ docs)
   │  3. Utility credentials
   ├─ Blocked from portal navigation?
   │  ├─ YES → Refinement Pass (1 attempt)
   │  │  └─ Still blocked? → Follow Up task
   │  └─ NO → Proceed with assumptions
   └─ Document all gaps with Assumption lines

4. SUBMISSION GATE (Workflow 4 only)
   ⛔ HARD STOP - Never submit without user approval
   ├─ Present checklist
   ├─ All items = "yes"?
   │  ├─ YES → Wait for user confirmation
   │  └─ NO → HALT, create Follow Up
   └─ User confirms → Submit

5. AUTHENTICATION FAILURE (Workflow 4)
   ├─ Attempt 1 reset/MFA
   ├─ Still fails?
   └─ → STOP, create Follow Up with timestamp & URL

6. TIME-BOXING (Workflow 4 Phase 3)
   ├─ Per item: 5 min max
   ├─ Total Phase 3: 30 min max
   ├─ Exceeded?
   └─ → Document Assumption, escalate if needed
```

---

## Error Handling Flow

```
ERROR ENCOUNTERED
  │
  ├─────────────────┬─────────────────┬──────────────────┐
  │                 │                 │                  │
  ▼                 ▼                 ▼                  ▼
┌─────────┐   ┌──────────┐   ┌──────────┐   ┌────────────────┐
│ Record  │   │ Doc      │   │ Conflict │   │ TaskRay Tasks  │
│ Not     │   │ Missing  │   │          │   │ List Not Found │
│ Found   │   │          │   │          │   │                │
└────┬────┘   └────┬─────┘   └────┬─────┘   └────┬───────────┘
     │             │              │              │
     ▼             ▼              ▼              ▼
Try alternate  Create       Prefer most    Check you're on
search terms   "Request"    recent source  TaskRay Project
(omit suffix)  for customer Log both with  page, not Opp
               List missing timestamps     Expand Related
               items                       tab if collapsed
               Where looked                Search DOM for
     │             │              │        /related/TASKRAY
     │             │              │        __Tasks__r/view
     ▼             ▼              ▼              │
Still fails?  Missing critical  Logged with      ▼
     │        items blocking?    evidence    Still not found?
     │             │              │              │
     ▼             ▼              ▼              ▼
Create        STOP workflow  Continue    Report error:
Follow Up     Create         with       "TaskRay Tasks
with search   Follow Up      resolution  related list not
details       Request user               found - expected
              to provide                 URL pattern"
```

---

## Tool Preamble Pattern (Used Throughout)

```
BEFORE each significant tool call:

┌──────────────────────────────────────┐
│ TOOL PREAMBLE (Contract)             │
│                                      │
│ 1. PURPOSE:                          │
│    What we're trying to do           │
│                                      │
│ 2. INPUTS:                           │
│    Exact IDs/paths/URLs being used   │
│                                      │
│ 3. EXPECTED OUTPUT:                  │
│    What we expect to see             │
│                                      │
│ 4. SUCCESS CHECK:                    │
│    Verifiable condition              │
└──────────────────────────────────────┘
           │
           ▼
    [Execute tool call]
           │
           ▼
┌──────────────────────────────────────┐
│ RESULT VALIDATION                    │
│                                      │
│ PASS/FAIL in ≤2 lines with evidence: │
│ - Record link                        │
│ - URL                                │
│ - On-page label                      │
└──────────────────────────────────────┘
```

---

## Summary: Agent Mental Model

```
┌─────────────────────────────────────────────────────────┐
│  AMBIA AGENT CORE LOOP                                  │
│                                                         │
│  1. Receive request                                     │
│  2. Match pattern → Select workflow                     │
│  3. Execute workflow steps                              │
│  4. At each decision gate:                              │
│     - Validate state                                    │
│     - Check thresholds                                  │
│     - Document assumptions                              │
│     - Escalate if blocked                               │
│  5. Never submit without user approval                  │
│  6. Log all actions in Salesforce                       │
│  7. Report back to user with evidence and any new tools │
│  required to do the work.                               │
│  Reasoning Levels:                                      │
│  - Minimal: Read-only, single-field updates             │
│  - Medium: Multi-field updates, single portal page      │
│  - High: Missing docs, conflicts, multi-page filings    │
│                                                         │
│  Verbosity:                                             │
│  - Low by default                                       │
│  - Medium for summaries and plans                       │
│  - High for Field/Attachment Maps only                  │
└─────────────────────────────────────────────────────────┘
```
