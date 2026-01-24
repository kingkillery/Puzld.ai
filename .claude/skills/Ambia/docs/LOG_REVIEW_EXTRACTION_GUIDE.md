# Log Review Extraction Guide for Ambia Skill

## Overview
This guide explains the new **Workflow 4: Extract Log Reviews from IX Tasks** that has been added to the Ambia skill to ensure thorough and accurate extraction of log reviews from individual IX tasks.

## What Changed?

### Added to Ambia Skill:
1. **New Workflow 4**: Comprehensive log review extraction process
2. **Updated Decision Tree**: Includes log review extraction workflow
3. **Updated "When to Use This Skill"**: Explicitly mentions log review extraction

## Key Improvements

### 1. **Critical Understanding Section**
The skill now explicitly states:
- Log reviews are located WITHIN each individual IX Task (not on the Project page)
- Each IX task can have multiple log review entries in its Activity Timeline
- Log reviews typically have dates in [MM-DD] format

### 2. **Six-Phase Extraction Process**

#### Phase 1: Navigate to TaskRay Project
- Navigate from Salesforce search or direct link
- Verify correct project by checking name/address

#### Phase 2: Access TaskRay Tasks Related List
- Click Related tab on TaskRay Project page
- Locate and click TaskRay Tasks link (URL contains `/related/TASKRAY__Tasks__r/view`)
- Troubleshooting steps if link not visible

#### Phase 3: Identify All IX Tasks
- Filter by task ID prefix `a03US` (case-insensitive)
- Identify ALL IX tasks:
  - Prepare IX Part 1
  - Request IX Part 1
  - Receive and Process IX Part 1
  - Prepare IX Part 2
  - Request IX Part 2
  - Receive and Process IX Part 2
- Note task name, status, owner, and task ID
- **Ignore** tasks with ID prefix `00T` or `00TD` (standard Salesforce Tasks)

#### Phase 4: Extract Log Reviews from Each IX Task
For EACH IX task:

1. **Open the Individual Task Page**
   - Click task name to open detail page
   - Verify you're on a Task page (not Project page):
     - Page header shows task name
     - URL contains task ID (starts with `a03US`)
     - Task Information section visible

2. **Locate the Activity Timeline**
   - Find "Activity" or "Activity Timeline" section
   - Contains all log reviews, notes, and task entries

3. **Extract Each Log Review Entry**
   - Date (MM-DD format or full date)
   - Subject (e.g., "Interconnection: Submitted")
   - Description/Comments (full text)
   - Author (if visible)
   - Type (Task, Note, etc.)

4. **Identify Critical Information**
   - Submission dates
   - Blockers (missing docs, utility issues, contact problems)
   - Follow-ups
   - Customer communications
   - Status changes
   - Action items
   - Assumptions

5. **Extract Structured Data**
   ```
   - Log Review Date: [MM-DD-YYYY or MM-DD]
   - Subject: [Full subject line]
   - Description: [Complete description text]
   - Status at time: [Task status when log created]
   - Author: [Name if available]
   - Key Decision/Action: [Summary of main point]
   - Blockers/Gaps: [Any issues mentioned]
   ```

#### Phase 5: Consolidate and Summarize
- Create chronological summary of all log reviews across all IX tasks
- Identify most recent/active IX task (status = Holding or Open)
- Summarize current project state:
  - Current blocker or status?
  - Next action needed?
  - When was last activity?
- Flag critical issues:
  - No recent log reviews (> 30 days old)
  - Unresolved blockers
  - Missing expected log reviews

#### Phase 6: Quality Checks
- Verify extracted from individual IX Task pages (not Project page)
- Confirm all IX tasks with status = Holding or Open checked
- Verify task IDs start with `a03US` (not `00T` or `00TD`)
- Check log review descriptions are complete (not truncated)
- Flag if no log reviews found on Open/Holding task

## Common Pitfalls to Avoid

1. **Looking for log reviews on the main Project page** - They're not there!
2. **Only checking one IX task** when multiple exist
3. **Using the wrong related list** (Activities vs TaskRay Tasks)
4. **Confusing standard Salesforce Tasks** (00T prefix) with TaskRay Project Tasks (a03US prefix)
5. **Not opening individual task pages** to see Activity Timeline
6. **Truncating long log review descriptions**
7. **Missing historical log reviews** on Completed or Inactive tasks

## Output Format

```
Account: [Account Name]
Project ID: [TaskRay Project ID]
Project Link: [URL]

IX Tasks Found:
1. [Task Name] (Status: [status], Owner: [owner], ID: [task ID])
   - Latest Log Review: [Date] - [Summary]
   - Full Log Reviews:
     * [Date]: [Subject] - [Description]
     * [Date]: [Subject] - [Description]
   - Current Blocker/Status: [Summary]

2. [Task Name] (Status: [status], Owner: [owner], ID: [task ID])
   - Latest Log Review: [Date] - [Summary]
   - Full Log Reviews:
     * [Date]: [Subject] - [Description]
   - Current Blocker/Status: [Summary]

Overall Project Status: [Summary based on all log reviews]
Next Action Required: [Based on latest log reviews]
Assumptions: [Any gaps or assumptions documented]
```

## Example Output

```
Account: 875RCOLE
Project ID: a04Dn000004fWBUIA2
Project Link: https://ambia.lightning.force.com/lightning/r/a04Dn000004fWBUIA2/view

IX Tasks Found:
1. Receive and Process IX Part 1 (Status: Holding, Owner: pnack, ID: a03US00000XYZ123)
   - Latest Log Review: 10-02 - No clear path to approval, customer must keep bills current for 2 years
   - Full Log Reviews:
     * 10-02-2025: "Interconnection: Follow Up" - "10-2 There still is not a clear path to approval. Customer will have to have kept their bills up to date for 2 years from when we originally applied in 10/2024."
     * 08-15-2025: "Interconnection: Follow Up" - "Customer's utility credit issues continue, leak adjustment application denied"
     * 06-10-2025: "Interconnection: Submitted" - "06-10 Part 1 application submitted to utility portal, Application ID: AIP-12345"
   - Current Blocker/Status: Utility credit issues - customer must maintain bill payments for 2 years

Overall Project Status: Part 1 on hold due to utility credit issues, no clear approval path
Next Action Required: Monitor customer's payment history, follow up in 6 months
Assumptions: Assumed latest log review represents current blocker state
```

## Testing the New Workflow

### Test Scenario 1: Account with Multiple IX Tasks
1. Navigate to a TaskRay Project with both Part 1 and Part 2 IX tasks
2. Access Related → TaskRay Tasks list
3. Verify you can identify all IX tasks (should see 3-6 tasks)
4. Open each task individually and extract log reviews
5. Compare output to ensure you captured all log reviews from all tasks

### Test Scenario 2: Account with Holding/Open Task
1. Find an account with a task in Holding or Open status
2. Navigate to that specific task page
3. Extract ALL log reviews from Activity Timeline
4. Verify the latest log review explains the current blocker
5. Confirm no log reviews were truncated

### Test Scenario 3: Verify Task ID Filtering
1. Navigate to Related → TaskRay Tasks list
2. Note which tasks have ID prefix `a03US` vs `00T`/`00TD`
3. Only extract from `a03US` tasks
4. Document any confusion between task types

### Test Scenario 4: Multiple IX Tasks, Different Statuses
1. Find an account with tasks in various statuses (Completed, Inactive, Holding, Open)
2. Extract log reviews from ALL IX tasks, regardless of status
3. Create chronological summary across all tasks
4. Identify which task is currently active

## CSV Output Enhancement

When updating CSV files with log review data, use this enhanced format:

```csv
Rank,Account Name,Opportunity ID,Opportunity Link,TaskRay Project Link,IX Task Name,Task Status,Task Owner,Task ID,Latest Note Text,Latest Note Date,Last Task Modified Date,Full Log Reviews,Current Blocker,Next Action,Assumptions
```

**New columns added**:
- **Task ID**: The a03US task ID for verification
- **Full Log Reviews**: Semicolon-separated list of all log reviews (Date|Subject|Description)
- **Current Blocker**: Clear statement of current blocker from latest log review
- **Next Action**: What needs to happen next based on log reviews

## Quality Assurance Checklist

Before considering log review extraction complete for an account:

- [ ] Navigated to Related → TaskRay Tasks list (not Activities)
- [ ] Identified ALL IX tasks (verified by `a03US` prefix)
- [ ] Opened EACH IX task's individual page
- [ ] Located Activity Timeline section on each task page
- [ ] Extracted ALL log review entries (not just the latest)
- [ ] Captured complete descriptions (not truncated)
- [ ] Identified current blocker from latest log review
- [ ] Created chronological summary across all IX tasks
- [ ] Verified extraction was from task pages (not Project page)
- [ ] Flagged any tasks with no log reviews when status = Open/Holding

## Next Steps

1. Test the updated skill on a sample of accounts
2. Verify the output format matches expectations
3. Refine the extraction process based on edge cases discovered
4. Create automated tests for log review extraction accuracy
5. Document any utility-specific log review patterns discovered

## Support

If you encounter issues with log review extraction:

1. Verify you're using the updated Ambia skill
2. Check you're navigating to Related → TaskRay Tasks (not Activities)
3. Confirm task IDs start with `a03US`
4. Ensure you're opening individual task pages to see Activity Timeline
5. Take screenshots of any unexpected page layouts for troubleshooting

---

**Last Updated**: 2025-11-06
**Version**: 1.0
**Author**: Claude (Ambia Skill Enhancement)
