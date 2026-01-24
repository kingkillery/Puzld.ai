---
name: large-feature-workflow
description: Systematic workflow for planning and implementing large features in phases with Spec Mode, validation, and clean sessions.
---

# Large Feature Workflow

Use this skill when the task is a multi-phase feature/refactor spanning many files.

## Workflow

1. **Master plan first**
   - Use Specification Mode (Shift+Tab) to generate a phased plan.
   - Require `IMPLEMENTATION_PLAN.md` with:
     - 4–8 phases
     - dependencies
     - per-phase acceptance criteria
     - per-phase validation commands
     - rollback notes

2. **Phase-by-phase execution**
   - Start a fresh session per phase.
   - Re-read `IMPLEMENTATION_PLAN.md` at the start of each phase.
   - Implement ONLY the current phase.

3. **Validation at the boundary**
   - Run the phase’s validators immediately.
   - If no validators exist, discover and run the repo’s lint/typecheck/tests before finishing.

4. **Update the plan**
   - Mark the phase complete in `IMPLEMENTATION_PLAN.md`.
   - Adjust future phases if new constraints appear.

5. **Version control (when in a git repo)**
   - One branch + commit per phase.
   - PR per phase with: scope, validation evidence, rollback notes.

## Guardrails

- Prefer backward compatibility and feature flags.
- Keep phases independently mergeable.
- Avoid wide mechanical refactors mixed with behavior changes.

## Verbosity Requirements

**Be verbose and transparent throughout the workflow:**

### During Planning Phase
- Explain the overall feature goal and why a phased approach is needed
- List files/modules you're examining to understand the architecture
- Describe what you discovered about dependencies and constraints
- Explain the rationale for the chosen phase breakdown

### During Each Implementation Phase
- Announce which phase you're starting (e.g., "=== PHASE 2: Add caching layer ===")
- Before reading files: state what you're looking for
- After reading: summarize key findings and how they affect implementation
- Before edits: explain what's changing and why
- After validation: report test results with specific commands and outcomes

### During Plan Updates
- Explain what changed from the original plan and why
- Note any new constraints or dependencies discovered
- Preview what the next phase will address
