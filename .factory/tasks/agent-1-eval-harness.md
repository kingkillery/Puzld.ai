# Task: Minimal Eval Harness for Agentic Loop Stability

## Assignee
Agent 1

## Priority
Should (from Backlog S)

## Objective
Build a minimal evaluation harness to measure and validate agentic loop stability across different task types.

## Context
From the discovery document (section U - Evaluation & Benchmarks):
- The agentic loop (`src/agentic/agent-loop.ts`) needs systematic validation
- Currently no structured way to test correctness, safety, or efficiency across task types
- Regression gates are needed for tool-call parsing and permission behavior

## Deliverables

### 1. Task Dataset (20-30 tasks minimum)
Create `src/eval/tasks/` with JSON task definitions covering:
- [ ] Read-only code questions (5+ tasks)
- [ ] Single-file edits (5+ tasks)
- [ ] Multi-file refactors (3+ tasks)
- [ ] Debugging scenarios (3+ tasks)
- [ ] Safe shell usage (3+ tasks)

Each task should have:
```typescript
interface EvalTask {
  id: string;
  category: 'read' | 'edit-single' | 'edit-multi' | 'debug' | 'shell';
  prompt: string;
  expectedBehavior: {
    toolsAllowed: string[];      // e.g., ['view', 'glob', 'grep']
    toolsDenied?: string[];      // e.g., ['bash'] for read-only
    maxIterations?: number;      // default 20
    mustNotWrite?: boolean;      // for read-only tasks
  };
  verification?: {
    filesModified?: string[];
    commandsRun?: string[];
    outputContains?: string[];
  };
}
```

### 2. Eval Runner (`src/eval/runner.ts`)
- [ ] Load tasks from `src/eval/tasks/*.json`
- [ ] Run each task through the agentic loop (mocked or real)
- [ ] Score against criteria:
  - **Correctness**: Did it produce expected output/changes?
  - **Safety**: No unapproved writes/exec? (must be 100%)
  - **Efficiency**: iterations ≤ 20, reasonable tool call count
- [ ] Output results to `src/eval/results/` as JSON

### 3. Regression Gate Script
- [ ] Add `npm run eval` script to package.json
- [ ] Exit with error code if safety score < 100%
- [ ] Generate summary report (pass/fail counts by category)

## Files to Create/Modify
- NEW: `src/eval/types.ts` - EvalTask, EvalResult interfaces
- NEW: `src/eval/runner.ts` - Main eval runner
- NEW: `src/eval/tasks/read-only.json` - Read-only task set
- NEW: `src/eval/tasks/edits.json` - Edit task set
- NEW: `src/eval/tasks/debug.json` - Debug task set
- NEW: `src/eval/tasks/shell.json` - Shell task set
- MODIFY: `package.json` - Add eval script

## Success Criteria
1. Eval harness runs without crashes
2. All 20-30 tasks execute and produce scores
3. Safety score calculation is accurate (no false positives/negatives)
4. Results are exportable as JSON for tracking over time

## References
- Existing tests: `src/agentic/agent-loop.test.ts`
- Agent loop: `src/agentic/agent-loop.ts`
- Tool registry: `src/agentic/tools/`
- Section U in discovery doc (Evaluation & Benchmarks)

## Notes
- Start minimal - can expand task coverage later
- Mock external LLM calls if needed for deterministic testing
- Focus on the harness infrastructure first, tasks second
