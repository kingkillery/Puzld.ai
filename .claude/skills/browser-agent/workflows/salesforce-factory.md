# Salesforce/TaskRay Navigation Workflow

Efficient navigation patterns for Salesforce Lightning and TaskRay.

## Key Navigation Patterns

### Direct Record Access

Always prefer direct URLs over click-through navigation:

```
Opportunity: /lightning/r/Opportunity/{id}/view
TaskRay Project: /lightning/r/TASKRAY__Project__c/{id}/view
TaskRay Task: /lightning/r/TASKRAY__Task__c/{id}/view
```

### Search Strategy

When searching:
- Use Global Search bar
- Omit street suffixes: "6455 MILANO" not "6455 MILANO ST"
- Project codes: 4 digits + 3-4 letters (e.g., "3763MORR")

## TaskRay Task Navigation

### Finding IX Tasks (Critical Path)

```
1. From TaskRay Project page (URL contains TASKRAY__Project__c)
2. Click Related tab
3. Click TaskRay Tasks link (URL: /related/TASKRAY__Tasks__r/view)
4. Filter by task ID prefix a03US (ignore 00T/00TD)
5. Open specific IX task
```

**IX Task Names**:
- Prepare IX Part 1/2
- Request IX Part 1/2
- Receive and Process IX Part 1/2

### Verifying Correct Page

| Page Type | URL Contains | Header Shows |
|-----------|--------------|--------------|
| Opportunity | `/Opportunity/` | "Opportunity:" |
| TaskRay Project | `/TASKRAY__Project__c/` | "TaskRay Project:" |
| TaskRay Task | `/TASKRAY__Task__c/` | Task name |

## Efficient Data Extraction

### Extract Task Details (JavaScript)

```javascript
// Run on TaskRay Task page
JSON.stringify({
  taskName: document.querySelector('.slds-page-header__title')?.textContent?.trim(),
  status: document.querySelector('[data-field="Status"]')?.textContent?.trim(),
  owner: document.querySelector('[data-field="Owner"]')?.textContent?.trim(),
  dueDate: document.querySelector('[data-field="Due_Date"]')?.textContent?.trim()
})
```

### Extract Activity Timeline

```javascript
Array.from(document.querySelectorAll('.timeline-item, .activity-item')).map(item => ({
  date: item.querySelector('.timestamp, .date')?.textContent?.trim(),
  subject: item.querySelector('.subject, .title')?.textContent?.trim(),
  description: item.querySelector('.description, .body')?.textContent?.trim()
}))
```

## Common Operations

### Update Task Owner

```
1. Navigate to IX Task page
2. find("Owner edit button") OR find pencil icon near Owner field
3. click
4. Wait for owner lookup dialog
5. form_input(owner_search, "New Owner Name")
6. Wait for dropdown results
7. Click correct owner
8. Click Save
```

### Create Log Entry

```
1. On IX Task page, find Activity panel
2. find("New Task" or "Log a Call")
3. Click
4. Fill:
   - Subject: "Interconnection: Approved" (or appropriate)
   - Status: Completed
   - Comments: "[MM-DD] - Part X Approval received..."
5. Save
```

## Lightning Component Handling

Salesforce Lightning has heavy JS. Timing tips:

- **After navigation**: Wait 2-3 seconds for components to load
- **Lookup fields**: Type-ahead needs 1-2 seconds to populate
- **Save operations**: Watch for toast messages (success/error)
- **Related lists**: May lazy-load on scroll

### Detecting Page Ready

```javascript
// Check if Lightning is ready
document.querySelector('.slds-page-header') !== null &&
!document.querySelector('.slds-spinner')
```

## Error Handling

| Error | Solution |
|-------|----------|
| "Record not found" | Verify ID, check permissions |
| Lookup empty | Wait longer, retry search |
| Save failed | Read toast message, fix issue |
| Session expired | Re-authenticate via SSO |

## Integration Notes

### Before Browser Operations
```bash
# Get project context
python -m ix_agent.cli lookup <project_id> --json
```

### After Browser Operations
```bash
# Verify changes reflected
python -m ix_agent.cli rundown <project_id>
```
