# Utility Skill Improvement Plan

**Goal**: Transform 358 sparse utility guides into rich, actionable process documentation using self-improving agent patterns.

---

## Current State Analysis

### Data Sources Available

| Source | Path | Contents | Status |
|--------|------|----------|--------|
| **Raw SOPs** | `workspace_data/exploration/utility_sops/raw/*.txt` | Full ALBATROSS SOP exports | 90+ files |
| **Parsed SOPs** | `workspace_data/exploration/utility_sops/*.md` | v2.0 parser output | Complete |
| **Utility Guides** | `.claude/domains/utilities/*.md` | Final agent-facing guides | 358 files |
| **SOP Classification** | `workspace_data/sop_classification.json` | Coverage metrics | Current |

### Coverage Gaps (from sop_classification.json)

| Field | Coverage | Priority |
|-------|----------|----------|
| has_portal_url | 99% | - |
| has_bill_verification | 92% | - |
| has_submission_steps | 83% | HIGH |
| has_inspection | 80% | MEDIUM |
| has_meter | 80% | MEDIUM |
| has_pto | 78% | MEDIUM |
| has_contacts | 43% | HIGH |
| has_signature | 35% | HIGH |
| has_fee | 31% | LOW |
| has_timeline | 28% | HIGH |
| has_insurance | 22% | MEDIUM |
| has_rejection | 19% | **CRITICAL** |
| has_credentials | 17% | LOW (internal) |

### The Core Problem

**Example: Xcel Energy MN (ID: 383)**

| Version | IXP1 Process | Lines | Actionable? |
|---------|-------------|-------|-------------|
| Raw SOP | Full step-by-step with screenshots, field mappings | 50+ | YES |
| Parsed Guide | "1. See raw SOP file for details" | 1 | NO |

**Root Cause**: The `sop_parser.py` regex patterns fail to extract structured data from varied SOP formats, falling back to placeholder text.

---

## Improvement Strategies

### Strategy 1: LLM-Powered SOP Enhancement

Use an LLM to read raw SOP files and generate structured utility guides. This is more robust than regex patterns.

```python
# Pseudocode for LLM-based SOP enrichment
def enrich_utility_guide(raw_sop_path: str, existing_guide_path: str) -> str:
    raw_content = read_file(raw_sop_path)
    existing_guide = read_file(existing_guide_path)

    prompt = f"""
    You are enriching a utility interconnection guide.

    ## Existing Guide (has placeholders):
    {existing_guide}

    ## Raw SOP Data (source of truth):
    {raw_content}

    ## Task:
    Extract and structure the following sections:
    1. IXP1 Process (Part 1 Application) - numbered steps
    2. IXP2 Process (Part 2 / PTO) - numbered steps
    3. Rejection Handling - common issues and resolutions
    4. Timeline expectations
    5. Insurance requirements

    Output the enriched markdown guide.
    """

    return llm.generate(prompt)
```

**Implementation Path**:
1. Create `scripts/enrich_utility_guide.py`
2. Process top 20 utilities by project volume first
3. Human review before committing to `.claude/domains/utilities/`

### Strategy 2: Self-Improving Agent Patterns

Based on state-of-the-art research (arxiv 2024-2025), implement skill acquisition feedback loops.

#### CASCADE Pattern (Skill Library)

From "CASCADE: Learning Agent Skill Acquisition via Skill Execution" (NAACL 2025):

```
┌─────────────────────────────────────────────────────┐
│                   SKILL LIBRARY                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ xcel-mn  │  │ duke-nc  │  │ generic-powerclerk│  │
│  │ VERIFIED │  │ VERIFIED │  │     VERIFIED      │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
│           ↓ Execution Feedback ↓                    │
│  ┌──────────┐  ┌──────────┐                        │
│  │ oncor-tx │  │ fpl-fl   │                        │
│  │ LEARNING │  │ DRAFT    │                        │
│  └──────────┘  └──────────┘                        │
└─────────────────────────────────────────────────────┘
```

**Skill States**:
- `DRAFT`: Initial extraction, not validated
- `LEARNING`: Being tested in real workflows
- `VERIFIED`: Successfully used 3+ times without rejection

#### Reflexion Pattern (Test-Time Self-Improvement)

From "Self-Improving LLM Agents at Test Time" (2024):

```
1. Agent attempts IX submission using utility guide
2. If REJECTION received:
   a. Extract rejection reason
   b. Update utility guide with new "Common Issues" entry
   c. Retry with corrected approach
3. Log success/failure metrics per utility
```

**Implementation**:
```yaml
# .claude/skills/ix-pipeline-management/skill_metrics.yaml
xcel-energy-mn:
  submissions: 47
  approvals: 42
  rejections: 5
  common_rejections:
    - "Missing one-line diagram LINE/LOAD labels"
    - "Insurance < 3 months remaining"
  last_updated: 2026-01-18
  status: VERIFIED
```

#### SEAgent Pattern (Self-Evolving)

From "Self-Evolving AI Agents" (2025):

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  OBSERVE    │ ──▶ │   ANALYZE   │ ──▶ │   UPDATE    │
│ (execution) │     │ (outcomes)  │     │  (skills)   │
└─────────────┘     └─────────────┘     └─────────────┘
       ▲                                       │
       └───────────────────────────────────────┘
```

**Workflow**:
1. **Observe**: Track every IX submission attempt
2. **Analyze**: Compare expected vs actual utility response
3. **Update**: Enrich utility guide with learned patterns

---

## Implementation Roadmap

### Phase 1: Batch Enrichment (Week 1)

**Goal**: Enrich top 20 utilities by project volume using LLM

```bash
# Priority utilities (from sop_classification.json)
1. Duke Energy Progress NC (432) - 258 lines raw
2. Pacific Gas & Electric (869) - 247 lines raw
3. We Energies (603) - 232 lines raw
4. Consumers Energy (428) - 220 lines raw
5. Evergy KS Metro (302) - 206 lines raw
6. Xcel Energy MN (383) - 162 lines raw
...
```

**Script to create**:
```bash
python scripts/enrich_utility_guide.py \
  --raw workspace_data/exploration/utility_sops/raw/Xcel_Energy_MN_383.txt \
  --guide .claude/domains/utilities/xcel-energy-mn.md \
  --output .claude/domains/utilities/xcel-energy-mn.md.enriched
```

### Phase 2: Feedback Loop (Week 2-3)

**Goal**: Implement reflexion pattern for ongoing improvement

1. Add `skill_metrics.yaml` tracking file
2. Create `scripts/log_ix_outcome.py` to record submission results
3. Update utility guides automatically on rejection patterns

### Phase 3: Self-Improvement Integration (Week 4+)

**Goal**: Agents automatically improve utility guides during normal work

1. **Pre-submission check**: Agent reviews utility guide
2. **Gap detection**: Agent identifies missing information
3. **Active learning**: Agent queries raw SOP or researches online
4. **Guide update**: Agent proposes enrichment (human approval required)

---

## Agent Workflow: Utility Skill Lookup (Enhanced)

```python
def get_utility_process(project_id: str, phase: str) -> dict:
    """
    Enhanced utility lookup with self-improvement hooks.

    Args:
        project_id: Albatross project ID
        phase: "IXP1" | "IXP2" | "REJECTION" | "PTO"

    Returns:
        dict with process steps and confidence
    """
    # 1. Get utility from project
    project = ix.lookup_find(project_id)
    utility_slug = slugify(project['utility_company'])

    # 2. Load utility guide
    guide_path = f".claude/domains/utilities/{utility_slug}.md"
    guide = ix.read_text(guide_path)

    # 3. Check for placeholders (skill gap)
    if "See raw SOP file" in guide:
        # 3a. Try to load raw SOP
        raw_sop_path = find_raw_sop(utility_slug)
        if raw_sop_path:
            return {
                "process": extract_from_raw(raw_sop_path, phase),
                "confidence": "LOW",
                "suggestion": "Run enrich_utility_guide.py to improve this guide"
            }
        else:
            return {
                "process": load_generic_process(phase),
                "confidence": "FALLBACK",
                "suggestion": "No raw SOP available - use generic process"
            }

    # 4. Return structured process
    return {
        "process": extract_section(guide, phase),
        "confidence": "HIGH",
        "last_validated": get_skill_metrics(utility_slug).get("last_updated")
    }
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `scripts/enrich_utility_guide.py` | LLM-powered guide enrichment |
| `scripts/log_ix_outcome.py` | Track submission outcomes for feedback loop |
| `.claude/skills/ix-pipeline-management/skill_metrics.yaml` | Per-utility success/failure metrics |
| `.claude/skills/ix-pipeline-management/SKILL_VALIDATION.md` | Validation workflow for enriched guides |

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Guides with "See raw SOP" placeholders | 343/358 (96%) | < 50 (14%) |
| has_rejection coverage | 19% | > 80% |
| has_timeline coverage | 28% | > 70% |
| Verified skill count | 0 | 50+ |

---

## Research References

1. **Self-Improving Coding Agent** (2024) - 17-53% improvement through self-play
2. **TT-SI: Test-Time Self-Improvement** (2024) - Reasoning without training
3. **CASCADE** (NAACL 2025) - Skill library with execution feedback
4. **SEAgent** (2025) - Self-evolving computer use agents
5. **Multi-Agent Reflexion** (2024) - Collaborative improvement

---

*Created: 2026-01-18 | Part of IX Pipeline Management Skill*
