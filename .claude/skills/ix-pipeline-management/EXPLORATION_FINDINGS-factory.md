# IX Pipeline Exploration Findings

**Date**: 2026-01-18
**Method**: 6 parallel headless browser agents (read-only)

---

## Agent 1: Albatross Work Queues

### Dashboard Structure
- **URL**: `https://albatross.myblueraven.com/workQueue`
- **Layout**: Header, sidebar filters, grid of queue cards
- **SPA Behavior**: 2-3 second load time after navigation

### Queue Card Structure
```
┌─────────────────────────────────────┐
│ Queue Title (h2/h3)                 │
│ "Ready for IX Approval"             │
├─────────────────────────────────────┤
│ Count Badge: "190"                  │
├─────────────────────────────────────┤
│ Target %: "70%"                     │
├─────────────────────────────────────┤
│ Metrics: 3-Day: 49% | 14-Day: 50%   │
├─────────────────────────────────────┤
│ Expected Time: "2 Weeks"            │
└─────────────────────────────────────┘
```

### DOM Selectors Confirmed
```javascript
// Dashboard
document.querySelectorAll('a[href*="/workQueue/"]')  // Queue cards
document.querySelectorAll('[class*="card"]')         // Card containers

// Queue List
document.querySelector('button:contains("Export")')  // Export button
document.querySelectorAll('a[href*="/project/"]')   // Project rows
document.querySelectorAll('.status-badge')          // Status indicators
```

### Filter Controls
- Team dropdown: `select`, `[class*="filter"]`
- View modes: `input[type="radio"]`
- Toggles: `input[type="checkbox"]`
  - Show empty work queues
  - Hide future follow-up dates
  - Hide future event start dates

---

## Agent 2: Albatross Project Pages

### 3-Panel Layout Confirmed
- **Left Sidebar**: 15+ expandable sections
- **Center Panel**: 8-stage workflow pipeline
- **Right Panel**: Notes & Activities

### Known Sections (Left Sidebar)
1. General (Project ID, Manager, AHJ, Utility)
2. Milestones
3. Sales
4. System & Financing
5. Non-standard
6. HOA
7. Permitting
8. **Utilities** (Account, IX Application ID, Meter)
9. Feedback
10. Financials
11. EPC
12. Alliance Partners
13. Documents
14. Current Work Queues
15. BOM

### Notes Structure (Right Panel)
```
#tag (optional)
TITLE IN CAPS
• FIELD: value
• FIELD: value
Content text
Author Name, Role(Team) | MM/DD/YY H:MM am/pm
```

### Gaps Identified
- DOM selector mapping incomplete
- Need live exploration for CSS classes
- Notes panel search/filter selectors unknown

---

## Agent 3: Albatross Utility Database

### Database Overview
- **URL**: `https://albatross.myblueraven.com/database/utility`
- **Total Utilities**: 438
- **Pagination**: 5 pages × ~100 per page
- **ID Range**: 180-1141 (with gaps)

### Utility Detail Page (8 Sections)
1. **Design Utility Requirements**
   - AC Disconnect, PV Meter, Max System Size
2. **Battery/ESS Requirements**
   - Battery-specific submission instructions
3. **Meter Pull & MPU Information**
   - Fees, contact info, approval requirements
4. **Bill Verification (HOI)**
   - Bill age limits, account format
5. **Interconnection Application**
   - Portal URL, fees, signature requirements
6. **PowerClerk/Portal Workflow**
   - Step-by-step submission instructions
7. **Approval & Inspection Process**
   - Timelines, witness test requirements
8. **Contacts & Resources**
   - DG Coordinator, regional offices

### PowerClerk Integration
- ~60% of utilities use PowerClerk
- Login pattern: `https://{utility_code}.powerclerk.com`
- Credentials stored in Salesforce Utility Database

### Storage Metrics
- Content size: 50-150KB per utility
- Full extraction: ~150MB total
- Time estimate: 37 min sequential, 9 min parallel

---

## Agent 4: Salesforce TaskRay IX Tasks

### TaskRay Navigation Pattern (Confirmed)
```
1. Search Salesforce: "[ADDRESS]"
2. Open Opportunity → TaskRay Project
3. Click Related tab
4. Click TaskRay Tasks link (/related/TASKRAY__Tasks__r/view)
5. Filter by a03US prefix
6. Open task with "IX" in name
```

### Task ID Prefixes
- **a03US**: TaskRay Project Tasks (CORRECT for IX)
- **00T**: Standard Salesforce Tasks (IGNORE)
- **00TD**: Other task type (IGNORE)

### IX Task Names (Exact)
- Prepare IX Part 1 / Part 2
- Request IX Part 1 / Part 2
- Receive and Process IX Part 1 / Part 2

### Lightning Component Selectors
```javascript
// Page header
.slds-page-header__title    // Task name
.slds-form-element          // Individual field
.slds-form-element__label   // Field label
.slds-form-element__static  // Read-only value

// Data attributes
[data-field="Status"]
[data-field="Owner"]
[data-field="Due_Date"]
```

### Activity Timeline Extraction
```javascript
Array.from(document.querySelectorAll('.timeline-item, .activity-item')).map(item => ({
  date: item.querySelector('.timestamp, .date')?.textContent?.trim(),
  subject: item.querySelector('.subject, .title')?.textContent?.trim(),
  description: item.querySelector('.description, .body')?.textContent?.trim()
}))
```

### Timing Requirements
| Operation | Wait Time |
|-----------|-----------|
| Lightning page load | 2-3 seconds |
| After navigation | 2 seconds |
| Form submission | 2-3 seconds |
| Lookup dropdown | 1-2 seconds |
| Toast message | 3 seconds (auto-dismiss) |

---

## Agent 5: Albatross SmartLists

### SmartList URL
```
https://albatross.myblueraven.com/smartlist/mine
https://albatross.myblueraven.com/smartlist/{ID}
```

### IX-Related SmartLists (Confirmed)

| Priority | Name | SmartList ID | Queue ID |
|----------|------|--------------|----------|
| CRITICAL | Ready for IX approval | 2246 | 38 |
| HIGH | Post-FIV Pre-FC Pipeline | 4531 | 428 |
| HIGH | Ready to submit IX application | 2245 | 37 |
| MEDIUM | Ready to send IX application | 2211 | 36 |
| MEDIUM | Ready for IX signature verification | 2068 | 136 |
| MEDIUM | Ready for utility bill verification | 2141 | 35 |
| MEDIUM | Ready for IX application resubmission | 2208 | 39 |
| MEDIUM | Ready to send inspection results | 2248 | 40 |
| LOW | Ready for utility meter follow up | 2249 | 41 |
| LOW | Ready for PTO follow up | 2251 | 42 |

### Pipeline Flow
```
Bill Verification (2141)
    ↓
Send IX Application (2211)
    ↓
Submit IX Application (2245)
    ↓
IX Approval (2246) ← PRIMARY BOTTLENECK
    ├─→ IX Resubmission (2208) [if rejected]
    └─→ IX Signature Verification (2068)
    ↓
Send Inspection Results (2248)
    ↓
Utility Meter Follow Up (2249)
    ↓
PTO Follow Up (2251)
    ↓
ENERGIZED
```

### Bottleneck Analysis
- **IX Approval (2246)**: ~190 projects, 49% on-time (target 70%)
- **Post-FIV Pipeline (4531)**: ~723 projects, massive backlog

---

## Agent 6: Albatross Company Dashboard

### URL
```
https://albatross.myblueraven.com/companyDashboard
```

### Status
- **Not fully documented** in codebase
- May require specific permissions
- Export functionality exists

### Known Milestones Tracked
- First Time Appointments
- Site Surveys Verified
- Final Designs (Created/Sent/Approved/Completed)
- Permits (Submitted/Approved)
- Installations (Ready/Scheduled/Planned)
- Substantial Completions
- Inspections (Scheduled/Planned/Passed)
- Final Completions

---

## Key Gaps Requiring Live Browser Access

1. ~~**DOM Selectors**: Project page CSS classes need verification~~ ✅ COMPLETED 2026-01-18
   - See `DOM_SELECTORS.md` for live-captured selectors
   - Utilities section with IX Application ID field documented
   - Active Process Steps structure confirmed
   - Notes panel tag categories verified
2. **Company Dashboard**: Full structure undocumented
3. **Form Field Names**: Salesforce Lightning components vary
4. ~~**New Queue IDs**: May have changed since documentation~~ ✅ VERIFIED 2026-01-18
   - Queue 38 (IX Approval) confirmed active with SmartList 2246

## Completed Live Exploration (2026-01-18)

### Albatross (via Claude for Chrome)
- ✅ Work Queue Dashboard navigation
- ✅ Queue 38 (IX Approval) list view
- ✅ Project status page 3-panel layout
- ✅ Utilities section form fields
- ✅ Active Process Steps structure
- ✅ Notes panel with tag categories
- ✅ Safety patterns confirmed (SALES ENABLEMENT TAKING OVER)

### Still Needed
- Salesforce TaskRay live DOM exploration
- Company Dashboard structure
- PowerClerk portal patterns

## Recommended Next Steps

1. ~~Authenticate to Albatross/Salesforce~~ ✅ Done
2. ~~Run provided JavaScript extraction scripts~~ ✅ DOM captured
3. ~~Capture actual DOM structure~~ ✅ See DOM_SELECTORS.md
4. ~~Update selector mappings~~ ✅ DOM_SELECTORS.md created
5. Document any new queues or SmartLists (ongoing)
6. Deploy research agents for Salesforce/TaskRay exploration
