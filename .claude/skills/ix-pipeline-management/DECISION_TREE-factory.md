# IX Pipeline Decision Tree

## Task Routing

```
USER REQUEST
    │
    ├─ Contains "queue" or "pipeline health"?
    │   └─ YES → Albatross Queue Review
    │       └─ Tools: Browser (Albatross), CLI rundown
    │
    ├─ Contains "find project" or "lookup"?
    │   └─ YES → Project Lookup
    │       ├─ Project ID known? → CLI lookup
    │       └─ Address only? → Salesforce Global Search
    │
    ├─ Contains "log approval" or "record PTO"?
    │   └─ YES → Salesforce Task Logging
    │       └─ Tools: Browser (Salesforce), TaskRay navigation
    │
    ├─ Contains "prepare application" or "submit IX"?
    │   └─ YES → Application Preparation
    │       └─ Tools: Both platforms, Drive, Utility portal
    │
    ├─ Contains "extract logs" or "project history"?
    │   └─ YES → Log Extraction
    │       └─ Tools: Browser (Salesforce), TaskRay tasks
    │
    ├─ Contains "update owner" or "reassign"?
    │   └─ YES → Task Owner Update
    │       └─ Tools: Browser (Salesforce), TaskRay task
    │
    └─ Contains "export" or "download queue"?
        └─ YES → Queue Export
            └─ Tools: Browser (Albatross)
```

---

## Platform Selection

```
ACTION NEEDED
    │
    ├─ View work queues? → ALBATROSS
    │   └─ /workQueue
    │
    ├─ Project status overview? → ALBATROSS
    │   └─ /project/{id}/status
    │
    ├─ Log IX approval/activity? → SALESFORCE
    │   └─ TaskRay Task → Activity Timeline
    │
    ├─ Update task owner? → SALESFORCE
    │   └─ TaskRay Task → Owner field
    │
    ├─ Find utility info? → ALBATROSS
    │   └─ /database/utility
    │
    ├─ View historical logs? → SALESFORCE
    │   └─ TaskRay Tasks → Activity timelines
    │
    ├─ Export pipeline data? → ALBATROSS
    │   └─ Queue → Export button
    │
    └─ Submit to utility portal? → UTILITY PORTAL
        └─ PowerClerk or Native (via Salesforce Utility DB)
```

---

## Classification Decision Tree

```
PROJECT CLASSIFICATION
    │
    ├─ Status field = "HELD"?
    │   ├─ Reason = "Pending Utility Work"?
    │   │   └─ YES → OPEN (utility action)
    │   └─ Any other reason?
    │       └─ YES → HOLDING (our action)
    │
    ├─ Has submitted date WITHOUT approval date?
    │   └─ YES → OPEN (in utility queue)
    │
    ├─ Has sent date WITHOUT signed date?
    │   └─ YES → HOLDING (signature needed)
    │
    ├─ Has approved date but no next milestone?
    │   └─ YES → HOLDING (our action needed)
    │
    ├─ Has meter ordered WITHOUT PTO?
    │   └─ YES → OPEN (utility finalizing)
    │
    ├─ Notes contain "rejection" or "correction"?
    │   └─ YES → HOLDING (fix needed)
    │
    └─ Default
        └─ Check Active Process Steps for blockers
```

---

## Safety Decision Tree

```
BEFORE ANY ACTION
    │
    ├─ Project tagged "Legal Involvement"?
    │   └─ YES → STOP. DO NOT TOUCH.
    │
    ├─ Notes contain "DO NOT TOUCH"?
    │   └─ YES → STOP. Requires human approval.
    │
    ├─ Project tagged "Escalated"?
    │   └─ YES → Prioritize, but proceed carefully.
    │
    ├─ Action is irreversible (submit, delete)?
    │   └─ YES → Require explicit user approval.
    │
    ├─ On correct page/task?
    │   ├─ Albatross: URL contains /project/{id}?
    │   └─ Salesforce: On TaskRay Task (a03US prefix)?
    │
    └─ All checks pass?
        └─ YES → Proceed with action.
```

---

## Workflow Selection Matrix

| User Says | Workflow | Primary Platform | Secondary |
|-----------|----------|------------------|-----------|
| "Check queue" | Pipeline Review | Albatross | - |
| "Find project" | Project Lookup | Salesforce | Albatross |
| "Log approval" | Log Approval | Salesforce | - |
| "Update owner" | Task Update | Salesforce | - |
| "Prepare app" | Application Prep | Both | Utility Portal |
| "Get history" | Log Extraction | Salesforce | - |
| "Export data" | Queue Export | Albatross | - |
| "Check status" | Status Check | CLI | Albatross |

---

## Tool Selection Matrix

| Scenario | Recommended Tool | Reason |
|----------|------------------|--------|
| Quick status check | CLI (`rundown`) | Fastest |
| Visual navigation | Claude for Chrome | Best UI handling |
| Bulk extraction | Playwright (headless) | Parallelizable |
| Form filling | Claude for Chrome | Error recovery |
| Data freshness | CLI (`status`) | Cached data check |
| Complex workflows | Ambia Skill | Pre-built flows |

---

## Error Recovery Tree

```
ERROR ENCOUNTERED
    │
    ├─ Page not loading?
    │   ├─ Albatross SPA → Wait 3-5 seconds
    │   └─ Salesforce Lightning → Wait for spinner
    │
    ├─ Project not found?
    │   ├─ Try alternate search (omit suffix)
    │   └─ Try project code (4 digits + 3-4 letters)
    │
    ├─ TaskRay Tasks not visible?
    │   ├─ Verify on TaskRay Project page (not Opportunity)
    │   └─ Expand Related tab
    │
    ├─ Wrong task type (00T vs a03US)?
    │   └─ Filter for a03US prefix only
    │
    ├─ Export button disabled?
    │   └─ Queue may be empty or still loading
    │
    └─ Authentication failed?
        └─ Check credentials in Salesforce Utility DB
```

---

## Escalation Criteria

Escalate to human when:
- Project has "Legal Involvement" tag
- Project has "DO NOT TOUCH" in notes
- Multiple submission failures
- Conflicting data between platforms
- Unknown utility or missing portal info
- Customer escalation tag present
- Action would be irreversible

---

## Agent Capabilities Required

| Workflow | Tools Needed |
|----------|--------------|
| Pipeline Review | Browser (Albatross), Read, Grep |
| Log Approval | Browser (Salesforce), Form Input |
| Application Prep | Browser (both), Drive, External Portal |
| Log Extraction | Browser (Salesforce), Read |
| Queue Export | Browser (Albatross) |
| Status Check | Bash (CLI), Read |
