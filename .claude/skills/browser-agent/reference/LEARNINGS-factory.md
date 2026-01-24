# Browser Agent Learnings

**Purpose**: Capture new patterns, quirks, and solutions discovered during browser automation. Update this file when you learn something new that will help future operations.

---

## How to Use This File

When you discover:
- A new DOM selector that works better
- A timing issue and its solution
- A portal-specific quirk
- An error pattern and recovery strategy
- A more efficient workflow

**Add it here** with the format:
```
### [Date] - [Portal/Context] - [Brief Title]
**Problem**: What went wrong or was inefficient
**Solution**: What worked
**Pattern**: Reusable guidance
```

---

## Albatross Learnings

### DOM Selectors

| Element | Known Selectors | Notes |
|---------|-----------------|-------|
| Project ID | `.project-id`, `[data-project-id]` | Usually in header |
| Project Name | `.project-name`, `h1.project-title` | |
| Status Badge | `.status-badge`, `.status-type` | HELD/ACTIVE |
| Queue Card | `a[href*="/workQueue/"]` | Contains smartlistId param |
| Notes Panel | `.notes-panel`, `.activity-timeline` | Right side of project view |
| Add Note Button | Button containing "Add Note" text | |
| Export Button | Button containing "Export" text | Downloads CSV |
| Owner Field | `.owner`, `.assigned-to` | |
| Days in Queue | `.days-in-queue`, `.queue-days` | Can be 1000+ for old projects |

### URL Patterns Discovered

```
Base: https://albatross.myblueraven.com

/workQueue                              - Main queue dashboard
/workQueue/{id}?smartlistId={sid}       - Specific queue
/project/{id}/status                    - Project status page
/project/{id}/processStep/{stepId}      - Specific process step
/projects                               - All projects list
/smartlist/mine                         - Personal smartlists
/inbox                                  - Messages/notifications
```

### Known Queue IDs (Utilities Team)

| Queue Name | Queue ID | SmartList ID |
|------------|----------|--------------|
| Ready for utility bill verification | 35 | 2141 |
| Ready to send IX application | 36 | 2211 |
| Ready to submit IX application | 37 | 2245 |
| Ready for IX approval | 38 | 2246 |
| Ready for application resubmission | 39 | 2208 |
| Ready to send inspection results | 40 | 2248 |
| Ready for utility meter follow up | 41 | 2249 |
| Ready for PTO follow up | 42 | 2251 |
| Needs immediate escalation | 455 | 4838 |
| Post-FIV Pre-FC Pipeline | 428 | 4531 |

### Timing Quirks

- **SPA Navigation**: Albatross is an SPA - URL changes don't trigger full reload
- **Table Loading**: Data tables load asynchronously after navigation
- **Notes Panel**: Notes may lazy-load on scroll
- **Export**: CSV download starts immediately, no confirmation dialog

### Error Patterns

| Error | Cause | Solution |
|-------|-------|----------|
| Empty project list | Data still loading | Wait 2-3 seconds after navigation |
| Notes not showing | Lazy load | Scroll notes panel to trigger load |
| Export fails | Session timeout | Re-authenticate |
| Wrong project data | Cached SPA state | Hard refresh or direct URL navigation |
| Timeout navigating to Queue | SPA/Network Idle | Use `domcontentloaded` instead of `networkidle`, then wait for selector |

### 2026-01-18 - Albatross - Dashboard Card Navigation
**Problem**: Direct deep-linking to queues (e.g. `/workQueue/38`) can timeout waiting for `networkidle` due to persistent background requests.
**Solution**: Navigate to dashboard `/workQueue` first (wait for `domcontentloaded`), then click the card.
**Pattern**: `goto('/workQueue')` -> `wait_for_selector('.v-card')` -> `click(text='IX Approval')`

### 2026-01-18 - Salesforce - Authentication
**Problem**: Existing playwright state in `workspace_data/.pw_state/storage.json` did not contain a valid Salesforce session.
**Solution**: Must re-authenticate via valid credentials or fresh state file.
**Pattern**: Check `page.url` for "login.salesforce.com" redirect to detect expired session.

---

## PowerClerk Learnings

### Timing Requirements

- After login: Wait 3 seconds for dashboard
- After page navigation: Wait 2 seconds
- After file upload: Wait for progress bar to reach 100%

### Known Issues

(Add as discovered)

---

## Salesforce/Lightning Learnings

### Component Loading

- Lightning components are heavy - wait 3+ seconds
- Toast messages appear for ~3 seconds
- Related lists may be collapsed by default

### Lookup Fields

- Type-ahead search needs 1-2 seconds to populate results
- Click exact match, don't just press Enter

---

## Self-Improvement Instructions

When you encounter a new pattern or solve a problem:

1. **Document it here** in the appropriate section
2. **Include the date** for tracking
3. **Be specific** - include selectors, timings, error messages
4. **Make it actionable** - future runs should be able to use this

Example entry:
```
### 2025-01-12 - Albatross - Queue Export Button
**Problem**: Export button not found with generic "Export" search
**Solution**: Button has class `.export-btn` and text includes "Export to CSV"
**Pattern**: Use find("Export to CSV") or selector `.export-btn`
```
