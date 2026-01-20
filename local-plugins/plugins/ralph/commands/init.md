---
name: init
description: Initialize Ralph scaffolding in the current project. Creates prd.json, prompt.md, and progress.txt in scripts/ralph/
argument-hint: "[branch-name]"
allowed-tools:
  - Bash
  - Write
  - Read
  - Glob
  - AskUserQuestion
---

# Ralph Init Command

Initialize Ralph autonomous coding loop scaffolding in the current project.

## Your Task

1. **Check if Ralph already exists**: Look for `scripts/ralph/prd.json`
   - If exists, ask user if they want to reinitialize (will overwrite existing files)

2. **Create directory structure**:
   ```bash
   mkdir -p scripts/ralph
   ```

3. **Detect project type** for default checks:
   - If `build.gradle` or `build.gradle.kts` exists: Gradle project (use `./gradlew assembleDebug`)
   - If `package.json` exists: Node project (use `npm run build && npm test`)
   - If `Cargo.toml` exists: Rust project (use `cargo build && cargo test`)
   - If `pyproject.toml` or `setup.py` exists: Python project (use `pytest`)
   - Otherwise: Generic (let user specify)

4. **Get branch name**:
   - Use argument if provided: `$ARGUMENTS`
   - Otherwise ask user for feature branch name (suggest format: `ralph/feature-name`)

5. **Create prd.json** with this structure:
   ```json
   {
     "branchName": "ralph/[feature-name]",
     "userStories": []
   }
   ```

6. **Create prompt.md** customized to project type:
   - Include detected build/test commands
   - Reference `scripts/ralph/prd.json` and `scripts/ralph/progress.txt`
   - Include standard Ralph workflow instructions

7. **Create progress.txt** with initial structure:
   ```markdown
   # Ralph Progress Log
   Started: [YYYY-MM-DD]

   ## Codebase Patterns
   - [Add patterns discovered during implementation]

   ## Key Files
   - [Add important files for this feature]

   ---
   ```

8. **Report success**: Show created files and next steps
   - Suggest using `/ralph add` to add user stories
   - Suggest using `/ralph start` when ready to begin

## prompt.md Template

```markdown
# Ralph Agent Instructions

## Your Task

1. Read `scripts/ralph/prd.json`.
2. Read `scripts/ralph/progress.txt` (check **Codebase Patterns** first).
3. Ensure you are on the branch specified in `prd.json` (`branchName`). Create it if it does not exist.
4. Pick the highest priority story where `passes: false`.
5. Implement that ONE story.
6. Run checks:
   - [INSERT DETECTED BUILD COMMAND]
   - [INSERT DETECTED TEST COMMAND IF APPLICABLE]
7. Append learnings to `scripts/ralph/progress.txt`.
8. Commit with message: `feat: [ID] - [Title]`.
9. Update `scripts/ralph/prd.json`: set `passes: true` for that story.

## Progress Format

APPEND to `scripts/ralph/progress.txt`:

## [YYYY-MM-DD] - [Story ID]
- What was implemented
- Files changed
- **Learnings:**
  - Patterns discovered
  - Gotchas encountered
---

## Codebase Patterns

If you discover reusable patterns, add them to the TOP of `scripts/ralph/progress.txt` under `## Codebase Patterns`.

## Stop Condition

If ALL stories pass, reply with:

<promise>COMPLETE</promise>
```
