# SOTA Evaluation Plan: pk-puzldai vs droid/minimax-m2.1

## Objective
Compare pk-puzldai vs droid/minimax-m2.1 on non-saturated benchmarks to identify performance gaps and optimization opportunities.

## Non-Saturated Benchmarks Selected

### 1. **SWE-Bench Verified**
- **Description**: Human-filtered subset with minimal solution leakage
- **URL**: https://swebench.com/
- **Why Non-Saturated**: 65% resolution rate (mini-SWE-agent), plenty of headroom
- **Evaluation Metric**: % of instances resolved

### 2. **SWE-Bench Pro**
- **Description**: Long-horizon software engineering tasks
- **URL**: https://github.com/scaleapi/SWE-bench_Pro-os
- **Why Non-Saturated**: Only 0.55% resolution rate with SWE-Agent + GPT-4
- **Evaluation Metric**: Multi-file coordination success

### 3. **CoreCodeBench**
- **Description**: Fine-grained code intelligence tasks
- **URL**: https://arxiv.org/html/2507.05281v2
- **Why Non-Saturated**: New benchmark, not yet saturated
- **Evaluation Metric**: Code understanding and transformation

### 4. **Agentic Multi-File Coordination**
- **Description**: Real-world multi-file changes with tool use
- **Why Non-Saturated**: Complex coordination still challenging for LLMs
- **Evaluation Metric**: Files changed correctly, tests passing

## Test Tasks (20 Total)

### Task Set 1: SWE-Bench Style (5 tasks)
1. "Fix authentication middleware JWT validation"
2. "Implement rate limiting for API endpoints"
3. "Add database migration for user preferences"
4. "Refactor duplicate code in payment module"
5. "Fix memory leak in event handler"

### Task Set 2: SWE-Bench Pro Style (5 tasks)
1. "Implement OAuth2 flow with refresh tokens"
2. "Add comprehensive error handling to API layer"
3. "Refactor monolithic service into microservices"
4. "Implement caching layer with Redis"
5. "Add unit tests for legacy codebase"

### Task Set 3: CoreCodeBench Style (5 tasks)
1. "Extract and document function contracts"
2. "Identify unused dependencies in module"
3. "Generate type definitions for untyped code"
4. "Find and fix type safety violations"
5. "Optimize hot path with memoization"

### Task Set 4: Agentic Multi-File (5 tasks)
1. "Add validation schema across 5 files"
2. "Refactor shared utility module"
3. "Implement feature with 3-layer architecture"
4. "Fix race condition in async code"
5. "Add comprehensive logging system"

## Evaluation Metrics

| Metric | Weight | Description |
|--------|--------|-------------|
| **Success Rate** | 40% | % of tasks completed successfully |
| **Speed** | 20% | Average time to completion (faster = better) |
| **Token Efficiency** | 20% | Tokens used per task (lower = better) |
| **Code Quality** | 20% | Lint clean, tests pass, best practices |

**Quality Score Formula**:
```
Score = (Success × 0.4) + (Speed Score × 0.2) + (Token Score × 0.2) + (Quality Score × 0.2)
```

## Evaluation Commands

### pk-puzldai Options
```bash
# Ralph mode (plan-first iterative)
pk-puzldai ralph "<task>" --iters 3 --tests "npm run typecheck"

# Orchestrate mode (multi-agent)
pk-puzldai orchestrate "<task>" --mode delegate

# Agentic mode (full tool access)
pk-puzldai run "<task>" --agentic
```

### droid/minimax-m2.1 Options
```bash
# Full agentic with minimax-v2.1
droid "<task>" --model minimax-v2.1 --agentic

# With specific settings
droid "<task>" --model minimax-v2.1 --budget 100000 --iterations 5
```

## Execution Plan

### Phase 1: Smoke Test
```bash
bun run scripts/eval/benchmark-smoke-test.ts
```

### Phase 2: Run Evaluation
```bash
# Run full benchmark suite
bun run scripts/eval/benchmark-harness.ts
```

### Phase 3: Analyze Results
```bash
# View results
cat scripts/eval/results/benchmark-report-*.md

# Compare metrics
python scripts/eval/analyze-results.py
```

### Phase 4: Generate Report
```bash
# Create comparison document
pk-puzldai ralph "Generate comprehensive analysis comparing pk-puzldai vs droid/minimax-m2.1 benchmark results"
```

## Expected Outcomes

### Hypothesis 1: pk-puzldai Advantages
- **Better Planning**: Ralph loop provides structured approach
- **Multi-Agent**: Can leverage different agents for different tasks
- **Tool Ecosystem**: Better integration with file operations
- **Telemetry**: More observability and debugging

### Hypothesis 2: droid/minimax Advantages
- **Raw Speed**: Single tool, less overhead
- **Token Efficiency**: Direct model access
- **Simpler Stack**: Fewer moving parts
- **Mature Agentic**: More refined tool use

## Success Criteria

- ✅ Both harnesses complete all 20 tasks
- ✅ Results saved to `scripts/eval/results/`
- ✅ Quality score calculated for each task
- ✅ Comparison report generated
- ✅ Performance gaps identified
- ✅ Optimization recommendations documented

## Notes

- All tasks should be run on the same codebase (PuzldAI itself)
- Use cold starts for each task (no caching)
- Track token usage accurately
- Record all errors and failures
- Save full logs for post-mortem analysis
