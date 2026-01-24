---
name: gemini-deep-research
description: This skill should be used when the user asks to "run deep research", "research this topic", "use Gemini for research", "submit a research job", "extract citations from research", "verify research claims", or needs long-running background research with citation extraction and verification.
---

# Gemini Deep Research

Run Gemini Deep Research as a background research worker. Submit queries, poll for completion, extract citations and claims, verify against sources, and compile final reports.

## When to Use

- Long-form research requiring multiple sources and citations
- Background research jobs that run asynchronously
- Research requiring citation extraction and claim verification
- Compiling verified research reports from raw Deep Research output

## Pipeline Overview

```
Submit → Poll → Persist → Extract → Verify → Compile
```

1. **Submit**: Send research brief as background job, receive job ID
2. **Poll**: Wait for completion (or stream progress)
3. **Persist**: Save raw report to run folder
4. **Extract**: Parse citations and atomic claims
5. **Verify**: Re-fetch key sources, sanity-check claims
6. **Compile**: Merge report + verification into final deliverable

## Quick Start

### Environment Setup

```bash
export GEMINI_API_KEY="your-api-key"
```

### Full Pipeline (Single Command)

```bash
python scripts/research.py run "Your research question here" --out runs/$(date +%F)/
```

### Step-by-Step

```bash
# 1. Submit job (returns job ID)
JOB_ID=$(python scripts/research.py submit "Research question")

# 2. Poll until done
python scripts/research.py poll $JOB_ID --out runs/latest/

# 3. Extract citations and claims
python scripts/research.py extract runs/latest/report.md

# 4. Verify claims
python scripts/research.py verify runs/latest/claims.json

# 5. Compile final report
python scripts/research.py compile runs/latest/
```

## Output Structure

Each run creates a timestamped folder:

```
runs/YYYY-MM-DD_HHMMSS/
├── prompt.txt           # Original research brief
├── report.md            # Raw Deep Research output
├── citations.json       # Extracted URLs mapped to sections
├── claims.json          # Atomic claims from report
├── verification.json    # Verification status per claim
└── final.md             # Compiled report with notes
```

## Prompt Engineering

Tight briefs reduce wandering and improve verification:

**Scope constraints:**
- Time bounds: "Only 2024-2026"
- Geographic: "Focus on US market"
- Source quality: "Exclude forums unless explicitly relevant"

**Required sections:**
- Executive summary
- Key findings with evidence
- Risks and unknowns
- Claim-to-citation evidence table

**Verification cues:**
- "Flag low-confidence statements"
- "List open questions instead of guessing"
- "Cite primary sources over aggregators"

## Code Mode API

```python
from gemini_deep_research import DeepResearch

dr = DeepResearch()

# Submit and poll separately
job_id = dr.submit("Research question")
report = dr.poll(job_id)

# Or run full pipeline
result = dr.run(
    prompt="Research question",
    output_dir="runs/2026-01-22/"
)
# Returns dict with report, citations, claims, verification
```

## Subagents

Local CLI subagents handle post-processing. Each takes files in, writes files out, never shares memory (reproducible runs).

| Subagent | Input | Output | Purpose |
|----------|-------|--------|---------|
| Citation Extractor | report.md | citations.json | Parse URLs, map to sections |
| Claim Splitter | report.md | claims.json | Convert narrative to atomic claims |
| Verifier | claims.json | verification.json | Re-fetch sources, check support |
| Compiler | all artifacts | final.md | Apply house style, add notes |

## Error Handling

| Status | Action |
|--------|--------|
| `completed` | Extract report text, proceed to parsing |
| `failed` | Log error, notify user, suggest retry |
| `cancelled` | Check if user-initiated, log reason |
| `timeout` | Increase poll interval, check API status |

## Additional Resources

### Reference Files

- **`references/api-patterns.md`** - Detailed API usage, model IDs, request/response schemas
- **`references/subagents.md`** - Extraction algorithms, verification strategies, claim parsing

### Scripts

- **`scripts/research.py`** - Main CLI entrypoint (submit, poll, extract, verify, compile)
- **`scripts/extractors.py`** - Citation and claim extraction utilities
