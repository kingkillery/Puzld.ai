---
name: browser-agent
description: >
  Autonomous browser agent for complex multi-step web tasks.
  WHEN: User needs complex web automation, multi-page workflows, form filling sequences, tasks requiring multiple browser actions.
  WHEN NOT: Simple single-action tasks like one click (use browser_click), one navigation (use browser_navigate), one extraction (use browser_extract_text).
  FAST MODE: For routine operations, use browser-agent-fast (Haiku) - see .claude/agents/browser-agent-fast.md
version: 1.3.0
---

# Browser Agent - IX Portal Automation

Autonomous browser automation for utility interconnection workflows. Optimized for **Albatross**, **PowerClerk**, and **Salesforce/TaskRay**.

## Skill Files

| File | Purpose | When to Read |
|------|---------|--------------|
| `SKILL.md` | Core instructions (this file) | Always loaded |
| `reference/TROUBLESHOOTING.md` | **Quick error→solution lookup** | **When something goes wrong** |
| `reference/EFFICIENCY.md` | Speed optimization patterns | When optimizing workflows |
| `reference/RELIABILITY.md` | Error recovery, session management | When handling errors |
| `reference/LEARNINGS.md` | Discovered patterns, quirks, solutions | **Check first for portal-specific knowledge** |
| `workflows/albatross.md` | Albatross queue workflows | Working with Albatross |
| `workflows/powerclerk.md` | PowerClerk application submission | Submitting IX applications |
| `workflows/salesforce.md` | Salesforce/TaskRay navigation | Updating Salesforce records |
| `scripts/session_monitor.js` | **Session health detection** | Before critical operations |
| `scripts/check_page_ready.js` | Page readiness detection | Before interacting with page |
| `scripts/extract_page_data.js` | Multi-portal data extraction | Bulk data extraction |
| `scripts/fill_form.js` | Form filling utilities | Complex form operations |
| `scripts/workflow_*.js` | **Precompiled workflows** | **Fast mode - bundle steps** |

---

## Quick Start

### 1. Start Browser Session
```
tabs_context_mcp → tabs_create_mcp → navigate(url) → screenshot
```

### 2. Verify Session Health (Before Critical Operations)
```javascript
// Execute scripts/session_monitor.js via javascript_tool
// Returns: { sessionHealth: "healthy|warning|expired", issues: [], recommendations: [] }
```

### 3. Choose Efficient Path
- **Know the URL?** → `navigate(url)` directly
- **Need to find element?** → `find(natural language query)`
- **Need page structure?** → `read_page(filter: "interactive")`
- **Bulk data extraction?** → `javascript_tool(extraction script)`

### 4. Execute with Minimal Steps
See `reference/EFFICIENCY.md` - do in 1 step what others do in 6.

### 5. If Something Goes Wrong
See `reference/TROUBLESHOOTING.md` - find symptom → apply fix.

---

## Albatross Deep Knowledge

Albatross (`https://albatross.myblueraven.com`) is the primary operations portal.

### Direct URLs (Skip Menu Navigation)

| Destination | URL |
|-------------|-----|
| Work Queue Dashboard | `https://albatross.myblueraven.com/workQueue` |
| IX Approval Queue | `https://albatross.myblueraven.com/workQueue/38?smartlistId=2246` |
| Submit IX Queue | `https://albatross.myblueraven.com/workQueue/37?smartlistId=2245` |
| PTO Follow Up Queue | `https://albatross.myblueraven.com/workQueue/42?smartlistId=2251` |
| Project by ID | `https://albatross.myblueraven.com/project/{ID}/status` |

### Key Queues (Utilities Team)

| Queue | ID | SmartList | Target % |
|-------|----|-----------|----------|
| Utility bill verification | 35 | 2141 | 75% |
| Send IX application | 36 | 2211 | 75% |
| Submit IX application | 37 | 2245 | 75% |
| IX approval | 38 | 2246 | 70% |
| Application resubmission | 39 | 2208 | 75% |
| Send inspection results | 40 | 2248 | 75% |
| Meter follow up | 41 | 2249 | 70% |
| PTO follow up | 42 | 2251 | 80% |
| Immediate escalation | 455 | 4838 | 95% |

### Albatross SPA Behavior

- **URL changes don't reload**: Data loads asynchronously after navigation
- **Wait for tables**: 2-3 seconds after navigation for data to populate
- **Notes lazy-load**: May need to scroll to load more notes
- **Export is instant**: CSV download starts immediately

### Status Types

| Status | Meaning | Action |
|--------|---------|--------|
| HELD | Blocked, needs action | Check "Active Process Steps" column |
| ACTIVE | In progress | Continue monitoring |
| Completed | Done | Skip or archive |

### Common Blockers (HELD status)

- `IX Resubmission Hold (Signature)` - Customer signature needed
- `Pending Design Rework` - Design team action
- `Pending HOI Renewal` - Customer insurance expired
- `Pending Utility Work` - Waiting on utility
- `Needs Resolution - Utilities` - Utility Ops action required

### Tags (Priority Indicators)

| Tag | Priority | Meaning |
|-----|----------|---------|
| `Escalated` | HIGH | Customer escalation |
| `Legal Involvement` | CRITICAL | **DO NOT TOUCH** |
| `Post SC 270+` | HIGH | 270+ days past substantial completion |
| `ITC` | MEDIUM | Investment Tax Credit deadline |

---

## Browser Tools Reference

| Tool | Use For | Example |
|------|---------|---------|
| `tabs_context_mcp` | Get/verify tab context | Always call first |
| `tabs_create_mcp` | New tab | Start new workflow |
| `navigate` | Go to URL | `navigate(url, tabId)` |
| `read_page` | Page structure | `read_page(tabId, filter: "interactive")` |
| `find` | Natural language search | `find("submit button", tabId)` |
| `computer` | Click/type/screenshot | `computer(action: "left_click", ref: "ref_X")` |
| `form_input` | Set form values | `form_input(ref, value, tabId)` |
| `javascript_tool` | Execute JS | Bulk operations, data extraction |

---

## Efficiency Rules

1. **Direct navigation** - Build URLs, don't click through menus
2. **One-shot clicks** - Use `ref` parameter (auto-scrolls)
3. **Batch form fills** - Fill all fields, validate at end
4. **JS for bulk data** - One `javascript_tool` call vs many reads
5. **Trust tool responses** - Screenshot at milestones, not every step

See `reference/EFFICIENCY.md` for complete patterns.

---

## Safety Guardrails

### Hard Stops
- **Never submit without user approval**
- **Never enter credentials from chat** (only from Salesforce Utility Database)
- **Never bypass CAPTCHA** (ask user to complete)
- **Mask credentials** (never display in logs)

### Domain Validation
Before entering credentials:
- PowerClerk: `*.powerclerk.com`
- Albatross: `albatross.myblueraven.com`
- Salesforce: `*.salesforce.com`, `*.lightning.force.com`

---

## Self-Improvement Protocol

**When you discover something new** (selector, timing, quirk, solution):

1. **Check** `reference/LEARNINGS.md` first for existing knowledge
2. **Add** new discoveries to `reference/LEARNINGS.md`
3. **Format**:
   ```
   ### [Date] - [Portal] - [Brief Title]
   **Problem**: What went wrong
   **Solution**: What worked
   **Pattern**: Reusable guidance
   ```

**Examples of what to capture**:
- DOM selectors that work (or don't)
- Timing requirements discovered
- Error messages and their fixes
- Workflow optimizations
- Portal-specific behaviors

**This skill improves itself** - every learned pattern makes future operations faster and more reliable.

---

## Workflow Templates

### Albatross Queue Export (2 steps)
```
navigate("https://albatross.myblueraven.com/workQueue/38?smartlistId=2246")
find("Export") → click
```

### Albatross Project Lookup (2 steps)
```
navigate("https://albatross.myblueraven.com/project/{ID}/status")
javascript_tool: scripts/extract_page_data.js
```

### PowerClerk Submission (See `workflows/powerclerk.md`)
```
navigate → read_page → fill fields → upload docs → screenshot → [USER APPROVAL] → submit
```

### Salesforce Task Update (See `workflows/salesforce.md`)
```
navigate(record_url) → find field → click edit → form_input → save
```

---

## Precompiled Workflows (Fast Mode)

**For maximum speed**, use precompiled workflow scripts that bundle multiple steps into a single `javascript_tool` call. These eliminate LLM decision-making overhead for routine operations.

### When to Use Precompiled Workflows

| Scenario | Use Precompiled? | Script |
|----------|------------------|--------|
| Export queue to CSV | Yes | `workflow_albatross_export.js` |
| Get project status | Yes | `workflow_albatross_project.js` |
| Fill known form fields | Yes | `workflow_form_fill.js` |
| Navigate + extract data | Yes | `workflow_navigate_extract.js` |
| Complex error recovery | No | Use standard workflow |
| First-time portal visit | No | Use standard workflow |

### Available Workflow Scripts

#### `workflow_albatross_export.js`
Bundles: verify page → find export button → click → confirm download
```
Usage:
1. navigate("https://albatross.myblueraven.com/workQueue/38?smartlistId=2246")
2. wait 2s
3. javascript_tool: workflow_albatross_export.js
Result: { success: true, queueInfo: { title, projectCount } }
```

#### `workflow_albatross_project.js`
Bundles: verify page → wait for content → extract all fields
```
Usage:
1. navigate("https://albatross.myblueraven.com/project/{ID}/status")
2. wait 2s
3. javascript_tool: workflow_albatross_project.js
Result: { success: true, project: { id, name, stage, status, owner, ... } }
```

#### `workflow_form_fill.js`
Bundles: find all fields → fill values → trigger events → check validation
```
Usage:
1. Set field data: window.__formData = { name: 'John', email: 'john@example.com' }
2. javascript_tool: workflow_form_fill.js
Result: { success: true, fieldsFilled: 5, validationErrors: [] }
```

#### `workflow_navigate_extract.js`
Bundles: check ready → detect page type → extract relevant data
```
Usage:
1. navigate(any_url)
2. javascript_tool: workflow_navigate_extract.js
Result: { ready: true, pageType: 'albatross_project', data: {...} }
```

### Fast Agent + Precompiled Workflows

For routine operations, combine:
1. **Haiku model** (via `browser-agent-fast`) - faster inference
2. **Precompiled scripts** - fewer tool calls
3. **Direct URLs** - skip menu navigation

```
Standard approach (6+ tool calls):
navigate → screenshot → read_page → find → click → screenshot → extract

Fast approach (2-3 tool calls):
navigate → workflow_script.js → done
```

**Speedup: 3-5x faster** for routine operations.

### Escalation Path

If a precompiled workflow returns `success: false`:
1. Check `error` field for cause
2. If recoverable → retry with wait
3. If not recoverable → escalate to standard browser-agent (Sonnet)

---

## Error Recovery

| Error | Action |
|-------|--------|
| Element not found | Check `reference/LEARNINGS.md` for known selectors, scroll page, retry |
| Session timeout | Re-authenticate, resume from checkpoint |
| Page not loading | Wait longer, refresh, check network |
| Validation error | Read error message, fix field, retry |
| Unknown error | Screenshot, log to LEARNINGS.md, ask user |

See `reference/RELIABILITY.md` for complete error handling patterns.

---

## Quick Troubleshooting

**Top 5 issues and fixes:**

| Problem | Quick Fix |
|---------|-----------|
| Session expired mid-workflow | Run `session_monitor.js`, re-authenticate, resume from checkpoint |
| Element not found | Wait 2-3s, scroll page, use `find("natural language")` |
| Click does nothing | Check for modal overlays, verify button is enabled |
| SPA shows stale data | Navigate away and back, or hard refresh |
| Form validation fails | Fill ALL required fields before checking, scroll to find errors |

**Diagnostic Scripts:**
```javascript
// Session health
scripts/session_monitor.js → { sessionHealth, issues, recommendations }

// Page ready?
scripts/check_page_ready.js → { ready, blockers, recommendation }

// Extract data
scripts/extract_page_data.js → { portal, data: {...} }
```

**Full troubleshooting guide:** See `reference/TROUBLESHOOTING.md`

---

## Integration with IX-Agent

### Before browser operations
```bash
python -m ix_agent.cli lookup <project_id> --json
```

### After portal changes
```bash
python -m ix_agent.cli refresh
```

---

**Version**: 1.3.0
**Focus**: Albatross, PowerClerk, Salesforce automation
**Key Features**:
- Self-improving through LEARNINGS.md
- Session health monitoring with `session_monitor.js`
- Quick troubleshooting via TROUBLESHOOTING.md
- **Fast mode**: Haiku agent + precompiled workflow scripts (3-5x speedup)
