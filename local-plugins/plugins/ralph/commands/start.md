---
name: start
description: Start the Ralph autonomous coding loop. Runs iterations until all stories pass or max iterations reached.
argument-hint: "[max-iterations=10]"
allowed-tools:
  - Bash
  - Read
  - Write
---

# Ralph Start Command

Launch the Ralph autonomous coding loop.

## Your Task

1. **Verify Ralph is initialized**: Check that `scripts/ralph/prd.json` exists
   - If not, tell user to run `/ralph init` first

2. **Parse arguments**:
   - `$ARGUMENTS` may contain max iterations (default: 10)
   - Extract the number if provided

3. **Check for incomplete stories**:
   - Read `scripts/ralph/prd.json`
   - Count stories where `passes: false`
   - If all stories already pass, inform user and exit

4. **Execute the Ralph loop** by running:
   ```bash
   bash ${CLAUDE_PLUGIN_ROOT}/scripts/ralph.sh [max-iterations]
   ```

5. **Monitor progress**:
   - The script outputs iteration progress
   - Watch for `<promise>COMPLETE</promise>` indicating all stories done
   - Report final status when loop completes

## Important Notes

- Each iteration spawns a fresh Claude instance with clean context
- Memory persists via git commits, prd.json, and progress.txt
- The loop will automatically:
  - Pick highest priority incomplete story
  - Implement it
  - Run project checks
  - Commit if passing
  - Mark story as done
  - Log learnings

## Output Interpretation

- `Done` - All stories completed successfully
- `Max iterations reached` - Loop hit limit, some stories may remain incomplete
- Check `scripts/ralph/prd.json` for final status of each story
