---
name: add
description: Add a new user story to the Ralph PRD. Interactive wizard for story creation.
argument-hint: "[story-title]"
allowed-tools:
  - Read
  - Write
  - Edit
  - AskUserQuestion
---

# Ralph Add Command

Add a new user story to the Ralph PRD (Product Requirements Document).

## Your Task

1. **Check Ralph exists**: Verify `scripts/ralph/prd.json` exists
   - If not, inform user to run `/ralph init` first

2. **Read current PRD**: Load existing stories from `scripts/ralph/prd.json`

3. **Gather story details**:

   If `$ARGUMENTS` contains a title, use it. Otherwise ask:
   - **Title**: Short description of what to implement (1 line)

   Then always ask:
   - **Acceptance Criteria**: What must be true for this story to pass?
     - Suggest including a build/test check
     - Allow multiple criteria (comma or newline separated)

   - **Priority**: Number for ordering (lower = higher priority)
     - Suggest next available number based on existing stories

   - **Notes** (optional): Any implementation hints or context

4. **Generate story ID**:
   - Format: `US-XXX` where XXX is zero-padded sequence number
   - Find highest existing ID and increment

5. **Create story object**:
   ```json
   {
     "id": "US-001",
     "title": "User-provided title",
     "acceptanceCriteria": [
       "Criterion 1",
       "Criterion 2",
       "Build/test passes"
     ],
     "priority": 1,
     "passes": false,
     "notes": "Optional notes"
   }
   ```

6. **Update prd.json**:
   - Add new story to `userStories` array
   - Keep stories sorted by priority
   - Write updated JSON back to file

7. **Confirm addition**:
   - Show the created story
   - Display updated story count
   - Suggest next steps (add more or start)

## Best Practices to Suggest

When gathering acceptance criteria, remind user:
- Stories should be small (fit in one context window)
- Include explicit success criteria
- Always include a build/test check
- Be specific, not vague

Good example:
```
Title: Add login form validation
Criteria:
- Email field validates email format
- Shows error message on invalid input
- Submit button disabled until valid
- ./gradlew :app:assembleDebug succeeds
```

Bad example:
```
Title: Implement authentication
Criteria:
- Users can log in
```
