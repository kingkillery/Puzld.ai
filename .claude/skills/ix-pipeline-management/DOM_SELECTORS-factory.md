# Albatross DOM Selectors - Live Capture

**Captured**: 2026-01-18
**Source**: Live browser exploration (read-only)

---

## Navigation Bar

```
banner
├── link href="/home"                    # SunPower logo
├── tablist
│   ├── tab "Contacts" href="/contacts"
│   ├── tab "Projects" href="/projects"
│   ├── tab "Schedule" href="/schedule"
│   ├── tab "Work Queue" href="/workQueue"
│   ├── tab "Smartlists" href="/smartlist"
│   ├── tab "Inbox" href="/inbox"
│   └── button "TOOLS"                   # Dropdown menu
├── button (notifications)
└── button (profile)
```

---

## Work Queue Dashboard (`/workQueue`)

### Filter Controls
```
textbox "Utilities"                      # Team filter dropdown
radio "% Completed On Time"              # View mode (default)
radio "Projects Completed"               # View mode
radio "Change in WIP"                    # View mode
toggle "Show empty work queues"
toggle "Hide work with next follow-up date in future"
toggle "Hide work with event start date in future"
```

### Queue Cards
```
link href="/workQueue/{QUEUE_ID}?smartlistId={SMARTLIST_ID}"
├── Queue title (h2/h3)
├── Count badge (large number)
├── Target % badge (e.g., "75%")
├── Metrics row
│   ├── 3-Day % (red/green based on target)
│   └── 14-Day %
└── Expected time (e.g., "3 Days", "2 Weeks")
```

### Confirmed Queue IDs (Live)
| Queue | ID | SmartList |
|-------|-----|-----------|
| Utility bill verification | 35 | 2141 |
| Verify renewed homeowner's | 278 | 2615 |
| Send IX application | 36 | 2211 |
| IX signature verification | 136 | 2068 |
| Pending hold resolution | 496 | 5339 |
| Submit IX application | 37 | 2245 |
| IX application resubmission | 39 | 2208 |
| **IX approval** | **38** | **2246** |
| Send inspection results | 40 | 2248 |
| Utility meter follow up | 41 | 2249 |
| PTO follow up | 42 | 2251 |
| Schedule utility work | 498 | 5361 |
| Pending utility work | 497 | 5350 |
| Utility re-inspection | 81 | 2254 |
| Application revision disposition | 200 | 2247 |

---

## Queue List View (`/workQueue/{ID}?smartlistId={SID}`)

### Header
```
link href="/workQueue"                   # Back button
generic "Ready for IX approval"          # Queue title
toggle "Hide work with next follow-up date in future"
button "Export"                          # CSV export
```

### Table Columns (Confirmed)
1. Project (customer name + tags)
2. Project ID
3. Process Step
4. Status
5. Days In Queue
6. State
7. Owner
8. Active Process Steps
9. Utility Company
10. Project Stage
11. Permit Pack Complete (date)
12. Expected Approval Date (date)
13. AHJ Final Inspection Verified (date)
14. Note Created At
15. Next Follow up Date

### Project Row Structure
```
link href="/project/{PROJECT_ID}/processStep/{STEP_ID}"
├── Customer name with tags
├── Project ID (6 digits)
├── Process step name
├── Status badge
├── Days count
├── State abbreviation
├── Owner name
├── Active process steps (comma-separated)
├── Utility company
├── Project stage
└── Various date columns
```

### Tags Observed
- `Post SC 270+` (red badge)
- `ITC` (dark badge)
- `Removal & Reinstall` (orange badge)

### Pagination
```
button "Rows per page" dropdown (100)
generic "1-100 of 156"
button "Previous page"
button "Next page"
```

---

## Project Status Page (`/project/{ID}/status`)

### Header
```
banner
├── link "{Customer Name}" href="/project/{ID}/status"
├── generic "Post SC 270+"               # Tag badge
├── generic "ITC"                        # Tag badge
└── Stage icon buttons (8 total)
    ├── button "event"                   # Project Consultation
    ├── button "attach_money"            # Qualification
    ├── button "recommend"               # Design
    ├── button "design_services"         # Installation Prep
    ├── button "build"                   # Installation
    ├── button "assignment"              # Inspection
    ├── button "power_settings_new"      # Energization
    └── button "bolt"                    # Energized
```

### LEFT SIDEBAR - Overview Section
```
button "Overview"
├── button "edit"                        # Edit pencil
├── generic "Project Stage:"
│   └── generic "Energization (Active)"
├── generic "Residential Standard"       # Project type
├── generic "{PROJECT_ID}"               # 6-digit ID
├── generic "{Street Address}"
├── generic "{City, State ZIP}"
├── generic "Owner:"
│   └── generic "{Owner Name - Role}"
├── button "Send message"
└── Contact card
    ├── generic "{Contact Name}"
    ├── generic "Primary Homeowner..."   # Role description
    ├── generic "{Phone 1}"
    ├── generic "{Phone 2}"
    ├── generic "{Email}"
    └── link href="/contact/{ID}"
        └── generic "Go to contact"
```

### LEFT SIDEBAR - Details Sections (Expandable)
```
button "Details"
├── generic "General"
├── generic "Milestones"
├── generic "Sales"
├── generic "System & Financing"
├── generic "Non-standard"
├── generic "HOA"
├── generic "Permitting"
├── generic "Utilities"                  # ← IX-critical section
├── generic "Feedback"
├── generic "Financials"
├── generic "EPC"
├── generic "Alliance Partners"
├── generic "Uploaded and Linked Documents"
├── generic "Current Work Queues"
└── generic "BOM"
```

### LEFT SIDEBAR - Active Process Steps
```
button "Active Process Steps"
├── link href="/project/{ID}/processSteps"
└── Process step cards:
    link href="/project/{ID}/processStep/{STEP_ID}"
    ├── generic "{Step Name}"            # e.g., "Aged Account"
    ├── generic "{Status}"               # e.g., "Active", "Post SC 150+"
    ├── generic "{Owner}"                # Optional
    └── generic "{Step ID}"
```

### CENTER PANEL - Workflow Pipeline
```
generic "Current Stage: {Stage Name}"

Stage sections (8 total):
├── button "{icon}"                      # Stage icon
├── generic "{Stage Name}"               # e.g., "Project Consultation"
├── button (expand/collapse)
└── Milestone checkboxes:
    ├── checkbox "{Milestone}: {Date}"
    └── label "{Milestone}: {Date}"
```

### 8 Workflow Stages (Confirmed)
1. **Project Consultation**
   - Solar Consultation
   - Home Improvement Contract Signed
2. **Qualification**
   - Site Survey Scheduled
   - Site Survey Verified
3. **Design**
   - Final Design Created
   - Final Design Approved
   - Utility Bill Verified
   - Final Design Complete
4. **Installation Prep**
   - Permit Documents Created
   - Permit Submitted to Jurisdiction
   - Permit Approved by Jurisdiction
   - Installation Ready to Schedule
   - Installation Scheduled
5. **Installation**
   - Installation Date
   - Installation Complete
6. **Inspection**
   - Inspection Ready to Schedule
   - Inspection Scheduled with Customer
   - Inspection Scheduled with Jurisdiction
   - Inspection Passed
   - Inspection Results Sent to Utility
7. **Energization**
   - Net Meter Installed
   - Energization Confirmed
8. **Energized**
   - (Final stage)

### RIGHT PANEL - Notes & Activities
```
generic "Notes & Activities"
├── button "Timeline"                    # Tab (default)
├── button "Topic"                       # Tab
├── button (sort?)
├── generic "search"
├── textbox "Search"
├── button (filter?)
└── Notes list:
    banner                               # Note container
    ├── link "#{tag}"                    # e.g., #interconnection
    ├── button (menu?)
    ├── generic "{Note content}..."      # Truncated preview
    └── generic "| {timestamp}"
        ├── generic "{Author Name}"
        ├── generic ", {Role}"
        └── generic "({Team})"
```

### Note Tags Observed
- `#interconnection` - IX-related notes
- `#process-step` - Process step updates (with link to step)
- `#accounting` - Accounting notes
- `#bp-plus-checks` - BP+ payment tracking
- `#project` - General project updates
- `[uncategorized]` - Untagged notes

### Note Structure Pattern
```
{TAG}
{TITLE IN CAPS}
• {FIELD}: {value}
• {FIELD}: {value}
{Content text}
{Author Name}, {Role}({Team}) | {MM/DD/YY HH:MM am/pm}
```

### Bottom Actions
```
button "Add note"
button (attachment?)
button (link?)
button (other action?)
```

---

## Utilities Section (IX-Critical Fields)

### URL Pattern
```
/project/{PROJECT_ID}/details
```
*Note: Clicking "Utilities" from left sidebar navigates from /status to /details*

### Section Header
```
banner
├── generic "Utilities"
├── button (expand/collapse)
├── button (edit?)
└── button "save" + "Save Fields"        # Only when editing
```

### Utility Bill Information Form
```
form
├── banner "Utility Bill Information"
├── label "Utility Account Holder"
│   └── textbox                          # Account holder name
├── label "Utility Account Number"
│   └── textbox                          # Account number (critical)
├── label "Meter Number"
│   └── textbox                          # Physical meter ID
├── label "Homeowner's Insurance Expiration Date"
│   └── textbox (with prepended button)  # Date picker
├── label "Interconnection Application ID"     # ← IX CRITICAL
│   └── textbox                          # PowerClerk/Portal app ID
├── label "Address on Utility Bill"
│   └── textbox                          # Address verification
├── label "Premise Number"
│   └── textbox                          # Utility premise ID
├── label "Proof of Homeowner's Insurance Obtained"
│   └── textbox (with prepended button)  # Date picker
├── label "Homeowner's Insurance Company"
│   └── textbox
├── checkbox "Meter to be Aggregated"
│   └── label
└── label "Meter Aggregation Notes"
    └── textbox                          # Multi-line notes
```

### JavaScript: Extract Utilities Data
```javascript
(function() {
    const form = document.querySelector('form');
    if (!form) return { error: 'Utilities form not found' };

    const getValue = (labelText) => {
        const labels = Array.from(form.querySelectorAll('label'));
        const label = labels.find(l => l.textContent.includes(labelText));
        if (!label) return null;
        const input = form.querySelector(`[aria-labelledby="${label.id}"], input[id="${label.htmlFor}"]`);
        if (input) return input.value || input.textContent?.trim();
        // Fallback: find adjacent textbox
        const textbox = label.parentElement?.querySelector('input[type="text"], textbox');
        return textbox?.value || null;
    };

    return JSON.stringify({
        utilityAccountHolder: getValue('Utility Account Holder'),
        utilityAccountNumber: getValue('Utility Account Number'),
        meterNumber: getValue('Meter Number'),
        hoiExpirationDate: getValue("Homeowner's Insurance Expiration Date"),
        interconnectionApplicationId: getValue('Interconnection Application ID'),  // IX CRITICAL
        addressOnBill: getValue('Address on Utility Bill'),
        premiseNumber: getValue('Premise Number'),
        hoiObtained: getValue("Proof of Homeowner's Insurance Obtained"),
        hoiCompany: getValue("Homeowner's Insurance Company"),
        meterAggregated: document.querySelector('input[type="checkbox"][aria-label*="Aggregated"]')?.checked,
        meterAggregationNotes: getValue('Meter Aggregation Notes')
    }, null, 2);
})();
```

---

## Active Process Steps (Confirmed Structure)

### Location
Left sidebar, below "Details" sections

### DOM Structure
```
button "Active Process Steps"
├── link href="/project/{ID}/processSteps"     # View all link
└── Process step cards:
    link href="/project/{ID}/processStep/{STEP_ID}"
    ├── generic "{Step Name}"                   # e.g., "Aged Account"
    │   ├── generic "{Status}"                  # e.g., "Post SC 150+"
    │   ├── generic "{Owner}"                   # Optional
    │   └── generic "{Step ID}"                 # 7-digit ID
```

### IX-Related Process Steps (Observed)
| Step Name | Status | Owner |
|-----------|--------|-------|
| Pending IX Application Approval for PTO | Active | Jacob Cook |
| Verify Interconnection Application Approval | Active | Jacob Cook |
| Aged Account | Post SC 150+ | - |
| Credit Status | Substantial Completion Approved | - |
| Safety Management | Active | - |

---

## Notes Panel - Tag Categories (Confirmed)

### Tag Links Observed
- `#interconnection` - IX-related notes (most important for IX work)
- `#process-step` - Process step updates (with link to step)
- `#accounting` - Accounting/payment notes
- `#bp-plus-checks` - BP+ payment tracking
- `#project` - General project status changes
- `[uncategorized]` - Untagged notes

### Note Content Patterns (IX-Specific)
```
IX APPLICATION PENDING APPROVAL
• TRIGGER: Approvals Queue
• STAGE OF REVIEW: In Review
• EXPECTED APPROVAL DATE: {date}

SYSTEM IMPACT STUDY REQUIRED
• TRIGGER: Approvals queue
• STAGE OF REVIEW: System Impact Study
• EXPECTED APPROVAL DATE: {date}

SALES ENABLEMENT TAKING OVER PROJECT    ← SAFETY FLAG
{description}
```

---

## JavaScript Extraction Scripts

### Extract Project Overview
```javascript
JSON.stringify({
  projectId: document.querySelector('[class*="project-id"], generic')?.textContent?.match(/\d{6,}/)?.[0],
  customerName: document.querySelector('banner link[href*="/project/"]')?.textContent?.trim(),
  stage: document.querySelector('generic:has-text("Project Stage:") + generic')?.textContent?.trim(),
  address: Array.from(document.querySelectorAll('generic')).find(el =>
    el.textContent.match(/^\d+\s+\w+.*\s+(Ave|St|Rd|Dr|Blvd|Ln|Way)/i))?.textContent,
  owner: document.querySelector('generic:has-text("Owner:") + generic')?.textContent?.trim(),
  tags: Array.from(document.querySelectorAll('banner generic')).filter(el =>
    ['Post SC', 'ITC', 'Escalated', 'Legal'].some(t => el.textContent.includes(t))
  ).map(el => el.textContent.trim())
}, null, 2)
```

### Extract Active Process Steps
```javascript
Array.from(document.querySelectorAll('link[href*="/processStep/"]')).map(link => ({
  name: link.querySelector('generic:first-child')?.textContent?.trim(),
  status: link.querySelector('generic:nth-child(2)')?.textContent?.trim(),
  owner: link.querySelector('generic:nth-child(3)')?.textContent?.trim(),
  stepId: link.href.match(/processStep\/(\d+)/)?.[1],
  url: link.href
}))
```

### Extract Recent Notes
```javascript
Array.from(document.querySelectorAll('main banner')).slice(0, 10).map(note => ({
  tag: note.querySelector('link[href*="#"]')?.textContent?.trim(),
  content: note.querySelector('generic[class*="content"], generic:not(:has(*))')?.textContent?.substring(0, 200),
  author: Array.from(note.querySelectorAll('generic')).find(el =>
    el.textContent.includes(',') && !el.textContent.includes('|'))?.textContent?.split(',')[0],
  timestamp: note.querySelector('generic[class*="timestamp"], generic:has-text("|")')?.textContent?.match(/\d+\/\d+\/\d+.*[ap]m/i)?.[0]
}))
```

---

## Safety Patterns to Detect

### Critical Tags (from live observation)
```javascript
const SAFETY_TAGS = [
  'Legal Involvement',      // DO NOT TOUCH
  'Post SC 270+',           // High priority
  'ITC',                    // Tax credit tracking
  'Removal & Reinstall',    // Special handling
  'Escalated'               // Customer escalation
];

const hasSafetyTag = (pageText) => {
  return SAFETY_TAGS.some(tag => pageText.includes(tag));
};
```

### Critical Note Content
```javascript
const STOP_PATTERNS = [
  'DO NOT TOUCH',
  'DO NOT FOLLOW UP',
  'LEGAL INVOLVEMENT',
  'SALES ENABLEMENT TAKING OVER',
  'LEGAL DO NOT TOUCH'
];

const shouldStop = (noteText) => {
  return STOP_PATTERNS.some(pattern =>
    noteText.toUpperCase().includes(pattern));
};
```

---

## Timing Requirements (Confirmed)

| Action | Wait Time |
|--------|-----------|
| After navigation | 3 seconds |
| SPA content load | 2-3 seconds |
| Before Export click | 2 seconds |
| After form interaction | 1-2 seconds |
| Notes lazy-load on scroll | 1 second |

---

## Version

- **Last Updated**: 2026-01-18
- **Verified Against**: Live Albatross instance
- **Method**: Claude for Chrome read_page exploration
