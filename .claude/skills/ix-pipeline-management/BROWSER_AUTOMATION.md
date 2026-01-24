# IX Pipeline Browser Automation Guide

## Overview

This guide provides browser automation patterns for both **Claude for Chrome** (MCP) and **Playwright** (headless) to interact with Albatross and Salesforce.

---

## Part 1: Albatross Automation

### 1.1 Authentication

**Credentials Location**: Salesforce Utility Database (never hardcode)

**Environment Variables**:
```
ALBATROSS_USERNAME
ALBATROSS_PASSWORD
```

**Login URL**: `https://albatross.myblueraven.com/login`

### 1.2 Queue Export Workflow

```javascript
// Claude for Chrome / Playwright
// Step 1: Navigate to queue
await navigate("https://albatross.myblueraven.com/workQueue/38?smartlistId=2246");

// Step 2: Wait for content load
await wait(3); // SPA needs time to render

// Step 3: Find and click Export
const exportBtn = await find("Export button");
await click(exportBtn);

// File downloads automatically
```

### 1.3 Project Data Extraction

```javascript
// Execute after navigating to /project/{ID}/status
(function() {
    return JSON.stringify({
        projectId: document.querySelector('.project-id')?.textContent?.trim(),
        name: document.querySelector('.project-name, h1')?.textContent?.trim(),
        stage: document.querySelector('.project-stage')?.textContent?.trim(),
        status: document.querySelector('.status-badge')?.textContent?.trim(),
        owner: document.querySelector('.owner-name')?.textContent?.trim(),
        utility: document.querySelector('.utility-company')?.textContent?.trim(),
        tags: Array.from(document.querySelectorAll('.tag')).map(t => t.textContent?.trim()),
        notes: Array.from(document.querySelectorAll('.note-item')).slice(0,3).map(n => ({
            date: n.querySelector('.date')?.textContent?.trim(),
            content: n.querySelector('.content')?.textContent?.trim()?.substring(0,200)
        }))
    }, null, 2);
})();
```

### 1.4 Queue List Extraction

```javascript
// Extract queue items
Array.from(document.querySelectorAll('tbody tr, .queue-item')).slice(0, 50).map(row => ({
    projectId: row.querySelector('[data-field="project-id"], td:nth-child(2)')?.textContent?.trim(),
    name: row.querySelector('[data-field="name"], td:nth-child(1)')?.textContent?.trim(),
    status: row.querySelector('[data-field="status"], .status')?.textContent?.trim(),
    daysInQueue: row.querySelector('[data-field="days"], .days')?.textContent?.trim(),
    owner: row.querySelector('[data-field="owner"]')?.textContent?.trim(),
    utility: row.querySelector('[data-field="utility"]')?.textContent?.trim()
}));
```

### 1.5 Utility Database Navigation

```javascript
// Navigate to utility list
await navigate("https://albatross.myblueraven.com/database/utility");

// Click utility NAME (not edit pencil) to view details
// Utility names ARE clickable links
const utilityRow = await find("Ameren Illinois");
await click(utilityRow);

// Now on /database/utility/{id}/details
```

---

## Part 2: Salesforce/TaskRay Automation

### 2.1 Global Search

```javascript
// Use Global Search bar
await click("Search...");  // Or cmd/ctrl+F
await type("2633 JORDAN"); // Omit street suffix
await press("Enter");

// Wait for results
await wait(2);
```

### 2.2 Navigate to IX Task (Critical Path)

```javascript
// From TaskRay Project page
// Step 1: Click Related tab
const relatedTab = await find("Related tab");
await click(relatedTab);

// Step 2: Find TaskRay Tasks link
const taskRayTasksLink = await find("TaskRay Tasks");
// URL should contain: /related/TASKRAY__Tasks__r/view
await click(taskRayTasksLink);

// Step 3: Filter for a03US prefix (TaskRay Project Tasks)
// Ignore 00T/00TD (standard Salesforce Tasks)

// Step 4: Find IX task
const ixTask = await find("Receive and Process IX Part 1");
await click(ixTask);
```

### 2.3 Extract Task Data

```javascript
// On TaskRay Task page
JSON.stringify({
    taskName: document.querySelector('.slds-page-header__title')?.textContent?.trim(),
    status: document.querySelector('[data-field="Status"]')?.textContent?.trim(),
    owner: document.querySelector('[data-field="Owner"]')?.textContent?.trim(),
    dueDate: document.querySelector('[data-field="Due_Date"]')?.textContent?.trim(),
    ixp1Details: {
        prepared: document.querySelector('[data-field="IXP1_Application_Prepared"]')?.textContent?.trim(),
        submitted: document.querySelector('[data-field="IXP1_Application_Submitted"]')?.textContent?.trim(),
        approved: document.querySelector('[data-field="IXP1_Application_Approved"]')?.textContent?.trim(),
        refNumber: document.querySelector('[data-field="IXP1_Application_REF"]')?.textContent?.trim()
    }
}, null, 2);
```

### 2.4 Extract Activity Timeline

```javascript
Array.from(document.querySelectorAll('.timeline-item, .activity-item')).map(item => ({
    date: item.querySelector('.timestamp, .date')?.textContent?.trim(),
    subject: item.querySelector('.subject, .title')?.textContent?.trim(),
    description: item.querySelector('.description, .body')?.textContent?.trim(),
    author: item.querySelector('.created-by, .author')?.textContent?.trim()
}));
```

### 2.5 Create Log Entry

```javascript
// Step 1: Find Activity panel
const activityPanel = await find("Activity panel");

// Step 2: Click New Task
const newTaskBtn = await find("New Task");
await click(newTaskBtn);

// Step 3: Fill form
await form_input("Subject", "Interconnection: Approved");
await form_input("Status", "Completed");
await form_input("Comments", "[01-18] – Part 1 Approval received. Documentation uploaded.");

// Step 4: Save
const saveBtn = await find("Save button");
await click(saveBtn);
```

### 2.6 Update Task Owner

```javascript
// On IX Task page
// Step 1: Find Owner field edit button
const ownerEdit = await find("Owner edit button");
await click(ownerEdit);

// Step 2: Wait for dialog
await wait(1);

// Step 3: Search for new owner
await type("Tonia Crank");
await wait(1);  // Wait for dropdown

// Step 4: Select from dropdown
const ownerOption = await find("Tonia Crank option");
await click(ownerOption);

// Step 5: Save
await click("Save");

// DO NOT navigate away immediately
```

---

## Part 3: Safety Patterns

### 3.1 Page Verification

```javascript
// Verify on correct page before actions
function verifyAlbatrossProject(expectedId) {
    const url = window.location.href;
    if (!url.includes('/project/')) return { valid: false, error: 'Not on project page' };
    const match = url.match(/\/project\/(\d+)/);
    if (match && match[1] === expectedId) return { valid: true };
    return { valid: false, error: `Wrong project: expected ${expectedId}` };
}

function verifyTaskRayTask() {
    const url = window.location.href;
    if (!url.includes('TASKRAY__Task__c')) return { valid: false, error: 'Not on TaskRay Task page' };
    const header = document.querySelector('.slds-page-header__title')?.textContent || '';
    if (!header.toLowerCase().includes('ix')) return { valid: false, error: 'Not an IX task' };
    return { valid: true };
}
```

### 3.2 Critical Pattern Detection

```javascript
// Check for DO NOT TOUCH before any action
function checkSafeToAutomate() {
    const pageText = document.body.innerText.toUpperCase();
    const blockers = [
        'DO NOT TOUCH',
        'LEGAL INVOLVEMENT',
        'DO NOT FOLLOW UP',
        'SALES ENABLEMENT TAKING OVER'
    ];

    for (const blocker of blockers) {
        if (pageText.includes(blocker)) {
            return { safe: false, blocker };
        }
    }
    return { safe: true };
}
```

### 3.3 Wait for Page Ready

```javascript
// Albatross SPA needs wait time after navigation
async function waitForAlbatrossReady() {
    const maxWait = 5000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
        const isLoading = document.querySelector('.spinner, .loading');
        const hasContent = document.querySelector('.project-content, .queue-content');

        if (!isLoading && hasContent) return true;
        await new Promise(r => setTimeout(r, 500));
    }
    return false;
}

// Salesforce Lightning component loading
async function waitForLightningReady() {
    const maxWait = 5000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
        const hasSpinner = document.querySelector('.slds-spinner');
        const hasHeader = document.querySelector('.slds-page-header');

        if (!hasSpinner && hasHeader) return true;
        await new Promise(r => setTimeout(r, 500));
    }
    return false;
}
```

---

## Part 4: Workflow Scripts

### 4.1 Queue Export Workflow (Complete)

```javascript
// workflow_queue_export.js
// Usage: Execute after navigating to queue URL

(function() {
    const result = { workflow: 'queue_export', success: false, steps: [] };

    try {
        // Verify on queue page
        if (!window.location.href.includes('workQueue')) {
            result.error = 'Not on workQueue page';
            return JSON.stringify(result);
        }
        result.steps.push({ step: 'verify_page', status: 'ok' });

        // Check for loading
        const isLoading = document.querySelector('.spinner, .loading');
        if (isLoading) {
            result.error = 'Page still loading. Wait and retry.';
            return JSON.stringify(result);
        }
        result.steps.push({ step: 'check_loading', status: 'ok' });

        // Find export button
        let exportButton = null;
        const buttons = document.querySelectorAll('button, a.btn');
        for (const btn of buttons) {
            if (btn.textContent?.toLowerCase().includes('export')) {
                exportButton = btn;
                break;
            }
        }

        if (!exportButton) {
            result.error = 'Export button not found';
            return JSON.stringify(result);
        }
        result.steps.push({ step: 'find_export', status: 'found' });

        // Click export
        exportButton.click();
        result.success = true;
        result.message = 'Export triggered. CSV download should start.';

    } catch (e) {
        result.error = e.message;
    }

    return JSON.stringify(result, null, 2);
})();
```

### 4.2 Project Status Extraction (Complete)

```javascript
// workflow_project_extract.js
// Usage: Execute after navigating to /project/{ID}/status

(function() {
    const result = { workflow: 'project_extract', success: false, project: null };

    try {
        // Verify on project page
        const url = window.location.href;
        if (!url.includes('/project/')) {
            result.error = 'Not on project page';
            return JSON.stringify(result);
        }

        // Safety check
        const pageText = document.body.innerText.toUpperCase();
        if (pageText.includes('DO NOT TOUCH') || pageText.includes('LEGAL INVOLVEMENT')) {
            result.error = 'SAFETY: Project has DO NOT TOUCH or Legal Involvement flag';
            result.blocked = true;
            return JSON.stringify(result);
        }

        // Extract data
        const projectIdMatch = url.match(/\/project\/(\d+)/);
        result.project = {
            id: projectIdMatch ? projectIdMatch[1] : null,
            name: document.querySelector('.project-name, h1')?.textContent?.trim(),
            stage: document.querySelector('.project-stage')?.textContent?.trim(),
            status: document.querySelector('.status-badge')?.textContent?.trim(),
            owner: document.querySelector('.owner-name')?.textContent?.trim(),
            utility: document.querySelector('.utility-company')?.textContent?.trim(),
            tags: Array.from(document.querySelectorAll('.tag')).map(t => t.textContent?.trim())
        };

        result.success = true;

    } catch (e) {
        result.error = e.message;
    }

    return JSON.stringify(result, null, 2);
})();
```

---

## Part 5: Tool Selection Guide

| Task | Tool | Notes |
|------|------|-------|
| Visual navigation | Claude for Chrome | Best for complex UI |
| Bulk data extraction | Playwright (headless) | Faster, parallelizable |
| Form filling | Claude for Chrome | Better error handling |
| Queue export | Either | Simple click action |
| Project lookup | IX-Agent CLI | Fastest if data cached |

### Claude for Chrome MCP Tools

- `navigate` - Go to URL
- `read_page` - Get accessibility tree
- `find` - Natural language element search
- `form_input` - Set form values
- `computer` - Screenshots, clicks, typing
- `javascript_tool` - Execute scripts

### Playwright MCP Tools

- `browser_navigate` - Go to URL
- `browser_snapshot` - Accessibility tree
- `browser_click` - Click element
- `browser_type` - Type text
- `browser_evaluate` - Execute JavaScript
- `browser_take_screenshot` - Capture screen
