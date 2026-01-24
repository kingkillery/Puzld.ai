---
name: bulk-notes-extraction
description: >
  Bulk extract Notes & Activities data from Albatross work queues for Google Sheets import.
  WHEN: Need to extract project context for AI processing, progress tracking, or reporting.
  WHEN NOT: Single project lookup (use ix-codemode), portal automation (use browser-agent).
allowed-tools: Bash, Read, Write, Task
---

# Bulk Notes Extraction Workflow

## Overview

This workflow extracts detailed Notes & Activities content from all projects in an Albatross work queue and outputs structured data suitable for Google Sheets import.

**Target Queue:** Ready for IX Approval (Queue 38, SmartList 2246)
- URL: `https://albatross.myblueraven.com/workQueue/38?smartlistId=2246`
- Expected: ~149 projects
- Pagination: Shows 100 at a time

**Target Spreadsheet:** [IX Progress Sheet](https://docs.google.com/spreadsheets/d/1gCwEvqH9P5pTZzcfWUyWM09bd7oxKPQX69dFMVJTFKk/edit)
- Column R: "Additional Context When Drilling Down"

## Output Format

| Column | Description |
|--------|-------------|
| `project_id` | Albatross project ID (6-7 digits) |
| `customer_name` | Customer name from project header |
| `notes_combined` | All notes with separators |
| `has_do_not_touch_warning` | TRUE if DO NOT TOUCH/FOLLOW UP found |
| `has_escalation` | TRUE if escalation mentioned |
| `has_payment_info` | TRUE if payment/check/refund mentioned |
| `latest_note_date` | Timestamp of most recent note |
| `responsible_party` | Author of most recent note |
| `note_count` | Total notes extracted |
| `tags` | Project tags (Escalated, ITC, etc.) |

## Quick Start

### Option 1: Browser Automation (Claude for Chrome)

Ask the browser agent to run the extraction:

```
Navigate to https://albatross.myblueraven.com/workQueue/38?smartlistId=2246
and extract all project notes. For each project in the queue:
1. Navigate to the project status page
2. Extract full Notes & Activities content
3. Save to workspace_data/bulk_extraction/ix_approval_queue_notes.json

Output a CSV ready for Google Sheets import.
```

### Option 2: Manual Script Execution

```bash
# Generate JavaScript extraction scripts
python scripts/albatross_bulk_notes_extraction.py --generate-scripts

# View workflow documentation
python scripts/albatross_bulk_notes_extraction.py --workflow

# After extraction, process to CSV
python scripts/albatross_bulk_notes_extraction.py --process-cache
```

## Detailed Workflow Steps

### Phase 1: Extract Project IDs from Queue

1. Navigate to: `https://albatross.myblueraven.com/workQueue/38?smartlistId=2246`
2. Wait 2-3 seconds for content to load
3. Execute `workflow_albatross_queue_list.js` in browser console:
   - Returns JSON with all project IDs visible on current page
   - Includes pagination info (e.g., "1-100 of 149")

4. If `pagination.hasMorePages` is true:
   - Scroll to bottom or click "Next" pagination button
   - Wait for load
   - Execute script again
   - Combine results

**Expected output (Phase 1):**
```json
{
  "workflow": "albatross_queue_list",
  "pagination": { "start": 1, "end": 100, "total": 149, "hasMorePages": true },
  "projects": [
    { "id": "586699", "name": "John Doe", "statusType": "ACTIVE", ... },
    ...
  ],
  "projectCount": 100
}
```

### Phase 2: Extract Notes for Each Project

For each project ID from Phase 1:

1. Navigate to: `https://albatross.myblueraven.com/project/{PROJECT_ID}/status`
2. Wait 2-3 seconds for content to load (notes panel loads async)
3. Execute `workflow_albatross_bulk_notes.js`:
   - Extracts all notes with full content
   - Detects DO NOT TOUCH, escalations, payment info
   - Returns structured JSON

4. Store result in extraction cache
5. Rate limit: 1-2 second delay between projects

**Expected output (per project):**
```json
{
  "workflow": "albatross_bulk_notes",
  "projectId": "586699",
  "customerName": "John Doe",
  "flags": {
    "hasDoNotTouch": false,
    "hasEscalation": true,
    "hasPaymentInfo": false
  },
  "notes": [
    {
      "type": "Follow-Up",
      "content": "IX APPLICATION SIGNATURE FOLLOW-UP ATTEMPT #3...",
      "author": "Rachel Hatch",
      "timestamp": "01/15/26 2:30 pm"
    }
  ],
  "notesCombined": "[01/15/26 2:30 pm] Rachel Hatch: IX APPLICATION...",
  "responsibleParty": "Rachel Hatch"
}
```

### Phase 3: Export to CSV

```bash
python scripts/albatross_bulk_notes_extraction.py --process-cache
```

Output: `workspace_data/bulk_extraction/google_sheets_import.csv`

### Phase 4: Import to Google Sheets

1. Open target spreadsheet
2. File > Import > Upload
3. Select `google_sheets_import.csv`
4. Import location: "Insert new sheet" or "Replace current sheet"
5. Copy `notes_combined` column to Column R

## JavaScript Files

| File | Purpose | Execute On |
|------|---------|------------|
| `workflow_albatross_queue_list.js` | Extract project IDs from queue | `/workQueue/{ID}` |
| `workflow_albatross_bulk_notes.js` | Extract full notes from project | `/project/{ID}/status` |

Location: `.claude/skills/browser-agent/scripts/`

## Cache Files

| File | Purpose |
|------|---------|
| `workspace_data/bulk_extraction/ix_approval_queue_notes.json` | Raw extraction cache |
| `workspace_data/bulk_extraction/google_sheets_import.csv` | Processed output |
| `workspace_data/bulk_extraction/processed_data.json` | JSON version of processed data |

## Rate Limiting

To avoid overwhelming the server:
- Wait 2-3 seconds for each page to load
- 1-2 second delay between project navigations
- Estimated total time: 149 projects x 3 seconds = ~8 minutes

## Error Handling

### Common Issues

| Issue | Solution |
|-------|----------|
| "Not on a project page" | Verify URL includes `/project/{ID}` |
| "No notes extracted" | Notes panel may not be visible; scroll to reveal |
| Session timeout | Re-authenticate and resume from last extracted project |
| Zero projects in queue extraction | Page may still be loading; wait and retry |

### Resume from Failure

If extraction fails mid-way:
1. Check cache file for last extracted project
2. Identify remaining project IDs
3. Resume extraction from that point
4. Combine with existing cache

## Integration with IX-Agent

After extraction, use the data with Code Mode:

```python
from ix_agent.codemode.api import IxCodeMode
from ix_agent.pipelines.albatross_notes import get_cached_notes, has_do_not_touch

ix = IxCodeMode()

# Cross-reference extracted notes with project lookup
project = ix.lookup_find("586699")
safe_to_touch = not has_do_not_touch("586699")
```

## Critical Patterns to Flag

| Pattern | Column | Priority |
|---------|--------|----------|
| "DO NOT TOUCH" | has_do_not_touch_warning | CRITICAL |
| "DO NOT FOLLOW UP" | has_do_not_touch_warning | CRITICAL |
| "Legal Involvement" | has_do_not_touch_warning | CRITICAL |
| "ESCALATION" / "Escalated" | has_escalation | HIGH |
| "PAYMENT" / "CHECK" / "REFUND" | has_payment_info | MEDIUM |
