# Ambia - Interconnection Project Coordinator Skill

Comprehensive skill for coordinating end-to-end interconnection lifecycle across Salesforce + TaskRay and external utility portals. This skill enables agents to find resources fast, reason about project state, and take correct actions with minimal guidance.

## What This Skill Provides

### Core Capabilities
- **Interconnection Application Coordination**: Prepare and submit interconnection applications to utility portals
- **Salesforce/TaskRay Management**: Navigate Salesforce, locate projects, update task owners, log approvals
- **Context Gathering**: Retrieve and summarize key information from Salesforce, TaskRay, and Google Drive
- **Document Management**: Find and organize required documents from Google Drive using Gemini for Google Workspace
- **Utility Portal Navigation**: Safely navigate PowerClerk and utility web portals
- **Approval Workflows**: Process Part 1 and Part 2 interconnection approvals with proper logging

### Key Workflows

| Workflow | Purpose | Key Steps |
|----------|---------|-----------|
| **Application Prep/Submission** | Prepare and submit interconnection applications | Context Gathering (4 phases) → Plan → Act in portal → Validate → Log |
| **Process Approval** | Log interconnection approvals (Part 1 or Part 2) | Validate Reference → Locate Task → Create Approved Task → Log Entry |
| **Salesforce Search** | Find customer projects and tasks | Search by Address/ID → Navigate to IX Task → Verify Project |
| **Update Task Owner** | Reassign interconnection tasks | Open IX Task → Edit Owner → Select New Owner → Save |
| **Document Gathering** | Collect required documents from Drive | Google Drive Search → Gemini Fast-Scan → Attachment Map |

## Quick Start Examples

### Example 1: Log an Interconnection Approval

**User**: "Log the Part 1 approval for 2633 Jordan Ave"

**Process**:
1. Search Salesforce for "2633 JORDAN"
2. Navigate to "Receive and Process IX Part 1" task
3. Create new task: Subject="Interconnection: Approved", Status=Completed
4. Comment: "[MM-DD] – Part 1 Approval received. Documentation uploaded."
5. Save the task

**Reference**: See SKILL.md → Workflow 1

### Example 2: Find a Project and Review Status

**User**: "Find the interconnection task for 6455 MILANO"

**Process**:
1. Search: "6455 MILANO" (omit street suffix if needed)
2. Navigate to TaskRay Project
3. Click "Related" tab
4. Find "Receive and Process IX Part 1/2"
5. Review latest notes and status

**Reference**: See SKILL.md → Workflow 2

### Example 3: Update Task Owner

**User**: "Reassign Part 1 tasks to Tonia Crank"

**Process**:
1. Open IX task page
2. Find "Owner" in Information section
3. Click edit icon
4. Enter: "Tonia Crank"
5. Select from dropdown
6. Save

**Reference**: See SKILL.md → Workflow 3

## Directory Structure

```
Ambia/
├── SKILL.md                    # ⭐ Main skill guide - all workflows
├── README.md                   # Complete documentation (this file)
├── QUICK_REFERENCE.md          # Quick reference card for common tasks
├── INDEX.md                    # Navigation guide to all files
├── INSTALL.md                  # Installation guide
│
├── /docs/                      # Reference materials & analysis
│   ├── DSPY_ANALYSIS.md        # DSPy integration analysis
│   ├── DSPY_PROMPTS.md         # DSPy prompt templates
│   ├── DSPY_STRESS_TEST.md     # Performance testing docs
│   ├── DSPY_STRESS_TEST_RESULTS.md
│   ├── EVALUATION_GUIDE.md     # Evaluation procedures
│   ├── EVALUATION_SUMMARY.md   # Evaluation findings
│   ├── ENHANCEMENT_SUMMARY.txt # Recent enhancements
│   ├── FIX_MOCK_RESPONSES.md   # Mock response handling
│   ├── LOG_REVIEW_EXTRACTION_GUIDE.md
│   ├── SKILL_CONFIGURATION_AUDIT.md
│   ├── evaluation_salesforce_tasks.xml
│   └── /references/
│       ├── utility-training-guides.md
│       └── AMEREN_ILLINOIS_POWERCLERK.md
│
├── /examples/                  # Code examples
│   ├── example_dspy_usage.py
│   ├── connect_cdp.py
│   └── verify_evaluation.py
│
└── /config/                    # Configuration files
    └── requirements.txt        # Python dependencies
```

**Quick Navigation**:
- **First time?** Start with `SKILL.md` (main workflows)
- **Quick lookup?** Use `QUICK_REFERENCE.md` (cheat sheet)
- **Finding files?** Check `INDEX.md` (navigation guide)
- **Reference docs?** Browse `/docs/` folder
- **Utility info?** See `/docs/references/utility-training-guides.md`

## How Claude Uses This Skill

When you ask Claude to handle interconnection tasks, Claude will:

1. **Read SKILL.md** to understand available workflows and procedures
2. **Choose the appropriate workflow** based on your task
3. **Execute the workflow** following the defined procedures
4. **Validate results** and log appropriately
5. **Provide Action Plan and Log Review Entry** for transparency

## Integration with Salesforce and TaskRay

This skill is optimized for:
- **Salesforce Lightning UI**: Navigate opportunities, projects, and tasks
- **TaskRay Integration**: Access project tasks, events, and logs
- **Google Drive**: Connect to linked project folders and documents
- **Gemini for Google Workspace**: Fast document search when filling applications
- **Utility Portals**: PowerClerk and other utility web portals

## Core Workflows

### Interconnection Application Workflow

**Context Gathering (4 Phases)**:
1. **Phase 1**: Training Guide Search - Use IX Team Training Guides via Google connector
2. **Phase 2**: Project Context Collection - Collect from Salesforce Opportunity's linked Drive items
3. **Phase 3**: Resource and Portal Prep - Extract portal URLs, fetch credentials
4. **Phase 4**: Consolidation - Build master resource list

**Gemini Drive Fast-Scan**:
- Sweep ALL linked project folders + IX guides
- Return Attachment Map: `requirement → file name → Drive link → last modified → pass/fail`
- Proceed if ≥70% of required docs pass

**Portal Navigation**:
- Navigate to portal using credentials from Salesforce Utility Database
- Fill forms using Page Rubric (Field Map, Attachment Map, Gaps, Validation)
- Validate before submission
- **Never submit without explicit user approval**

### Process Interconnection Approval Workflow

1. **Validate Reference**: Check if link/reference points to correct IX task
2. **Locate Target Task**: Search Salesforce → Navigate to IX Task (Part 1 or Part 2)
3. **Create Approved Task**: 
   - Subject: "Interconnection: Approved"
   - Status: Completed
   - Comments: `[MM-DD] – Part [1 or 2] Approval/PTO received. Uploaded documentation to Google Drive Docs Folder.`
4. **Log Entry**: Record in appropriate format

**Critical**: Always log approvals inside the IX Task, NOT on the Project page.

### Salesforce Search Procedure

1. **Search for Identifier**: Enter project ID or address in Salesforce search
2. **Review Results**: Click into most accurate project match
3. **Refine if Needed**: Omit street suffix (e.g., "6455 MILANO" not "6455 MILANO ST")
4. **Identify Project**: Look for pattern: 4 numbers + 3-4 letters (e.g., "3763MORR")
5. **Locate IX Task**: Find task with "IX" in name (e.g., "Prepare IX Part 1")
6. **Verify**: Ensure identifier/address is visible on page
7. **Gather/Mark Data**: Review notes, update statuses as needed

### Update Task Owner Workflow

1. **Navigation**: Navigate to IX task page
2. **Verification**: Confirm you're on correct Task page
3. **Owner Assignment**:
   - Click edit icon on Owner field (Information section)
   - Enter new owner name
   - Select from dropdown
   - Save changes
   - **Do not navigate away from task page**

**Supported Owners**: Tonia Crank, Corben Cantrell

## Salesforce Pages and Their Uses

### TaskRay Project Page
Main project page where we can see 'events' or 'tasks'. The TaskRay Project itself is called the "Project". Use the "Related" tab to access all IX tasks.

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

## Task Taxonomy

- **Prepare**: Fill required documents
- **Request**: Wait state; nudge for docs
- **ReceiveAndProcess**: Submit to utility; may move to Hold if rejected/missing docs

## State Model

**Forward**: Prepare → Request → Receive and Process  
**Side**: Receive and Process ↔ Hold  
**Backward**: Requires rationale and log entry

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

### Log Entry Format

```
[MM-DD] Source → Evidence → Decision → Change

Example:
[09-23] Approval email → "Your app approved" text → Log completion → Created Interconnection: Approved task
```

## Critical Rules

### ⚠️ MUST Do These Things:

1. **Always log approvals inside the IX Task**, NOT on Project page
2. **Search addresses WITHOUT street suffix** ("6455 MILANO" not "6455 MILANO ST")
3. **For Part 1**: Avoid using "PTO"; use "Approval" instead (PTO is Part 2 only)
4. **Fetch credentials ONLY from Salesforce Utility Database**
5. **Never paste secrets in chat**; mask all but last 3 characters
6. **Never submit without explicit user approval**
7. **Verify task location** before logging or updating
8. **Document assumptions** when proceeding with 70% completeness

### ⚠️ NEVER Do These Things:

1. **Don't log on the main Project page**
2. **Don't store passwords in TaskRay notes**
3. **Don't use lookalike portal URLs** (verify domain)
4. **Don't guess on coordinates** (use site survey or design docs)
5. **Don't try multiple auth attempts in succession**
6. **Don't create duplicate applications** (check notes/uploads first)
7. **Don't navigate away** after updating task owner

## Security

- **Credentials**: Live only in Salesforce Utility Database
- **Never echo secrets**: Mask all but last 3 characters
- **No password storage**: Never store passwords in TaskRay notes or chat
- **Portal Guard**: Verify allowed domains before login (e.g., Ameren Illinois: `https://amerenillinoisinterconnect.powerclerk.com/*`)

## Error Handling

### RecordNotFound
- Try alternates
- Else create **Follow Up** logging search details and clarification request

### DocMissing
- Create **Request** for the customer
- Log what is missing and where you looked

### Conflict
- Prefer most recent source
- Log both statuses with timestamps

## Common Issues & Solutions

| Problem | Solution |
|---------|----------|
| Can't find project | Search by address without suffix; try project code |
| Found wrong project | Check zip code and opportunity details |
| Logged on wrong page | Verify you're on IX Task, not Project page |
| Portal login fails | Check credentials in Salesforce; attempt 1 reset only |
| Document illegible | Request rescan from customer with DPI requirements |
| Task owner won't update | Ensure exact name match from dropdown; refresh and retry |

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

## Utility Portal Profiles

### Ameren Illinois

- **Portal**: `https://amerenillinoisinterconnect.powerclerk.com/`
- **Allowed Domain**: `https://amerenillinoisinterconnect.powerclerk.com/*`
- **Application Types**: Net Metering, DG ≤10kW, DG >10kW (populate from guides)
- **Required Uploads**: Site plan, One-line diagram, Nameplate/spec, Insurance cert, Photos/placards (populate from guides)
- **Common Blockers**: Illegible bill, Service class mismatch, Signature format (populate from guides)

## Best Practices

### 1. Always Verify Before Acting
- Confirm you're on the correct page (IX Task vs Project)
- Verify project details match search criteria
- Check task status before updating

### 2. Document Everything
- Log all actions with dated entries
- Record assumptions when proceeding with incomplete data
- Include source references in all log entries

### 3. Follow Security Protocols
- Never echo credentials
- Mask sensitive information
- Use only approved portal domains

### 4. Use Tool Preambles
Before each significant action:
- **Purpose**: What we're trying to do
- **Inputs**: Exact IDs/paths/URLs
- **Expected Output**: What we expect
- **Success Check**: Verifiable condition

After action: **Pass/Fail** in ≤2 lines with evidence

### 5. Enforce Submission Gate
- Never submit without explicit user approval
- Present checklist before submission:
  1) Attachment Map = all required present and legible
  2) Fees reviewed
  3) Final Field Map diffs listed

## Examples

### Example 1: Check Interconnection Account

**User**: "Which skill would I need to check an Interconnection Solar account?"

**Answer**: Use the Ambia skill. Navigate to Salesforce, search for the account identifier, locate the IX task, and gather/update information as needed. Use web/browser tools if portal navigation is required.

### Example 2: Navigate Website

**User**: "Please Navigate to msn.com and tell me the front page story"

**Answer**: Use Browser tool to navigate to the website, extract the front page story, and return the information. If browser tool is not available, use web scraping tools or request access to appropriate tools.

## Support

- **SKILL.md**: Main workflow guide with decision trees
- **README.md**: Complete documentation (this file)
- **QUICK_REFERENCE.md**: Quick reference card for common workflows

## Notes

- All workflows tested and validated for Salesforce Lightning UI
- Compatible with TaskRay integration
- Google Drive and Gemini integration for document management
- Cross-platform support (Windows/Mac/Linux)
- Date format: Always use MM-DD format for log entries
- Current Date: Use actual current date when logging entries

---

**Status**: ✅ PRODUCTION READY  
**Last Updated**: Based on comprehensive system prompt  
**Focus**: Salesforce + TaskRay interconnection workflows for Ambia
