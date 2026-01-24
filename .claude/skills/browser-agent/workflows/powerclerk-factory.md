# PowerClerk Portal Workflow

Step-by-step workflow for PowerClerk interconnection application portals.

## Portal Patterns

PowerClerk URLs follow this pattern:
```
https://{utility}interconnect.powerclerk.com/
```

**Known utility portals**:
| Utility | URL |
|---------|-----|
| Ameren Illinois | `amerenillinoisinterconnect.powerclerk.com` |
| (Add others as discovered) |

## Authentication Flow

```
1. Navigate to portal login page
2. Verify domain matches approved pattern (*.powerclerk.com)
3. Get credentials from Salesforce Utility Database (never from chat)
4. Enter username
5. Enter password
6. Click login
7. Wait for dashboard (2-3 seconds)
8. Verify login succeeded (look for project list or dashboard elements)
```

**On auth failure**: Stop and notify user. Do not retry credentials.

## Application Workflow

### Step 1: Find Application

```
Option A - By Application ID:
1. Use search bar or direct URL if portal supports it
2. Search for Application ID
3. Click to open application detail

Option B - By Address:
1. Navigate to applications list
2. Use search/filter for customer address
3. Verify correct application (check name, system size)
4. Click to open
```

### Step 2: Navigate Form Pages

PowerClerk typically has multi-page forms:

```
1. Page Navigation
   - Look for "Next" / "Continue" buttons
   - Look for page tabs or step indicators
   - Track current page number

2. For each page:
   - Read all visible form fields
   - Match fields to project data
   - Fill required fields
   - Note any validation errors
   - Take screenshot before proceeding

3. Handle required uploads on upload pages
```

### Step 3: Document Uploads

```
1. Identify required documents (checklist usually shown)
2. For each document:
   - Find file input element
   - Upload file
   - WAIT for upload progress to complete (100%)
   - Verify filename appears in uploaded list
   - Do NOT proceed until confirmed
3. Common documents:
   - Site plan / One-line diagram
   - Equipment specifications
   - Utility bill
   - Homeowner insurance
   - Signed application
```

### Step 4: Review and Submit

```
1. Navigate to review/summary page
2. Screenshot the summary
3. Present to user:
   - All entered data
   - All uploaded documents
   - Any fees shown
4. STOP - Wait for explicit user approval
5. Only after "yes/proceed/submit" confirmation:
   - Click final submit button
   - Wait for confirmation page
   - Capture confirmation number/PDF
   - Screenshot confirmation
```

## Common Fields Mapping

| PowerClerk Field | Source |
|-----------------|--------|
| Customer Name | Salesforce Opportunity |
| Service Address | Salesforce Opportunity |
| System Size (kW) | TaskRay Project / Design Docs |
| Inverter Model | Equipment specs |
| Module Type | Equipment specs |
| Account Number | Utility bill |
| Meter Number | Utility bill |

## Error Handling

| Error | Action |
|-------|--------|
| Session timeout | Re-login, resume from last page |
| Validation error | Read error, fix field, retry |
| Upload failed | Wait, retry upload |
| Duplicate application | Stop, notify user, do not proceed |
| Missing required field | Check source docs, ask user if not found |

## Post-Submission

After successful submission:
1. Capture confirmation number
2. Download confirmation PDF if available
3. Return to IX-Agent to log in TaskRay:
   - Create "Interconnection: Submitted" task
   - Include [MM-DD] dated note
   - Record Application ID/Confirmation number
