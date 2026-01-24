# Albatross Queue Workflow

Efficient workflows for Albatross project management system.

## Base URL

```
https://albatross.myblueraven.com
```

## Direct Navigation URLs

Use direct URLs instead of clicking through menus:

| Destination | URL Pattern |
|-------------|-------------|
| Work Queue Dashboard | `/workQueue` |
| Specific Queue | `/workQueue/{queue_id}?smartlistId={smartlist_id}` |
| Project Status | `/project/{project_id}/status` |
| Project Process Step | `/project/{project_id}/processStep/{step_id}` |
| Projects List | `/projects` |
| SmartLists | `/smartlist/mine` |
| Inbox | `/inbox` |

## Queue IDs Reference

### IX Application Flow
| Queue | ID | SmartList ID |
|-------|-----|--------------|
| Ready for utility bill verification | 35 | 2141 |
| Ready to send IX application | 36 | 2211 |
| Ready to submit IX application | 37 | 2245 |
| Ready for IX approval | 38 | 2246 |
| Ready for IX application resubmission | 39 | 2208 |
| Ready for IX signature verification | 136 | 2068 |

### Post-Approval
| Queue | ID | SmartList ID |
|-------|-----|--------------|
| Ready to send inspection results | 40 | 2248 |
| Ready for utility meter follow up | 41 | 2249 |
| Ready for PTO follow up | 42 | 2251 |

## Efficient Workflows

### Queue Export (2 steps)

```
1. navigate("https://albatross.myblueraven.com/workQueue/38?smartlistId=2246")
2. find("Export") → click
   // File downloads automatically
```

### Project Lookup (2 steps)

```
1. navigate("https://albatross.myblueraven.com/project/{ID}/status")
2. javascript_tool: extract status data
```

### Bulk Queue Review (3 steps)

```
1. navigate(queue_url)
2. read_page(filter: "interactive") → get project links
3. For each project: javascript_tool to extract key fields
```

## Data Extraction Patterns

### Extract Project Status (JavaScript)

```javascript
JSON.stringify({
  projectId: document.querySelector('.project-id')?.textContent?.trim(),
  stage: document.querySelector('.project-stage')?.textContent?.trim(),
  status: document.querySelector('.status-badge')?.textContent?.trim(),
  owner: document.querySelector('.owner-name')?.textContent?.trim(),
  utility: document.querySelector('.utility-company')?.textContent?.trim(),
  daysInQueue: document.querySelector('.days-in-queue')?.textContent?.trim()
})
```

### Extract Queue List (JavaScript)

```javascript
Array.from(document.querySelectorAll('.queue-item, .project-row')).slice(0, 20).map(row => ({
  name: row.querySelector('.project-name')?.textContent?.trim(),
  id: row.querySelector('.project-id')?.textContent?.trim(),
  status: row.querySelector('.status')?.textContent?.trim(),
  days: row.querySelector('.days')?.textContent?.trim()
}))
```

## Notes Panel Operations

### Read Recent Notes

```javascript
Array.from(document.querySelectorAll('.note-item, .activity-item')).slice(0, 5).map(note => ({
  date: note.querySelector('.note-date, .timestamp')?.textContent?.trim(),
  author: note.querySelector('.note-author, .created-by')?.textContent?.trim(),
  content: note.querySelector('.note-content, .note-text')?.textContent?.trim()
}))
```

### Add Note

```
1. find("Add Note button")
2. click
3. Wait for modal/form
4. form_input(note_field, note_text)
5. find("Save") → click
```

## Status Interpretation

| Status Type | Meaning | Action |
|-------------|---------|--------|
| HELD | Blocked, needs action | Review blockers |
| ACTIVE | In progress | Continue workflow |
| Completed | Done | Skip or archive |

## Integration with IX-Agent

After Albatross operations, sync data:

```bash
# Refresh local cache after portal changes
python -m ix_agent.cli refresh

# Verify updates
python -m ix_agent.cli lookup <project_id>
```
