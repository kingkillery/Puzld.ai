# Ralph Agent Instructions - Interactive CLI Integration

## Context

You are implementing **Interactive CLI Integration** for PuzldAI - a feature that allows PuzldAI to drive CLI tools (Claude Code, Codex, Factory, Crush) interactively via PTY, responding to their prompts like a human would.

**Key Insight:** Instead of reimplementing features, we leverage the full power of existing CLI tools by interacting with them in real-time.

## Your Task

1. Read `scripts/ralph/prd.json` to get the current user stories.
2. Read `scripts/ralph/progress.txt` (check **Codebase Patterns** first).
3. Ensure you are on the branch specified in `prd.json` (`ralph/interactive-cli-integration`). Create it if it does not exist.
4. Pick the highest priority story where `passes: false`.
5. Implement that ONE story completely.
6. Run checks:
   - `npm run build` (must succeed)
   - `npm run typecheck` (must pass)
   - `npm run test` (must pass)
7. Append learnings to `scripts/ralph/progress.txt`.
8. Commit with message: `feat: [ID] - [Title]`
9. Update `scripts/ralph/prd.json`: set `passes: true` for that story.

## Technical Context

- **Runtime:** Node 20+ with Bun for building/testing
- **PTY Library:** `node-pty` is already installed
- **Existing Patterns:** Check `src/adapters/` for adapter pattern, `src/agentic/` for tool handling
- **TUI Framework:** Ink (React-like terminal UI)
- **Config:** `src/lib/config.ts` for configuration management

## Progress Format

APPEND to `scripts/ralph/progress.txt`:

```markdown
## [YYYY-MM-DD] - [Story ID]
- What was implemented
- Files changed
- **Learnings:**
  - Patterns discovered
  - Gotchas encountered
---
```

## Codebase Patterns

If you discover reusable patterns, add them to the TOP of `scripts/ralph/progress.txt` under `## Codebase Patterns`.

## Critical Rules

1. **One story at a time** - Complete fully before moving on
2. **All checks must pass** - Build, typecheck, and tests
3. **Backwards compatible** - Don't break existing `run()` functionality
4. **Windows support** - All PTY code must work on Windows
5. **No over-engineering** - Implement exactly what the story requires

## Stop Condition

If ALL stories have `passes: true`, reply with:

<promise>COMPLETE</promise>
