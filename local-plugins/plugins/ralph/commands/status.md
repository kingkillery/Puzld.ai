---
name: status
description: Show current Ralph progress - completed stories, remaining work, and recent learnings.
allowed-tools:
  - Read
  - Bash
---

# Ralph Status Command

Display the current status of Ralph user stories and progress.

## Your Task

1. **Check Ralph exists**: Verify `scripts/ralph/prd.json` exists
   - If not, inform user Ralph is not initialized in this project

2. **Read and parse prd.json**:
   - Load `scripts/ralph/prd.json`
   - Extract branch name and all user stories

3. **Calculate statistics**:
   - Total stories count
   - Completed stories (where `passes: true`)
   - Remaining stories (where `passes: false`)
   - Completion percentage

4. **Display story breakdown**:
   ```
   ## Ralph Status

   Branch: ralph/feature-name
   Progress: 5/8 stories complete (62%)

   ### Completed
   - [x] US-001: Story title
   - [x] US-002: Story title

   ### Remaining (by priority)
   - [ ] US-003: Story title (priority 3)
   - [ ] US-004: Story title (priority 4)
   ```

5. **Show recent learnings** (optional):
   - Read last entry from `scripts/ralph/progress.txt`
   - Display the most recent implementation notes

6. **Suggest next action**:
   - If stories remain: suggest `/ralph start`
   - If all complete: congratulate and suggest review
   - If no stories: suggest `/ralph add`
