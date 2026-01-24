---
name: deep-research
description: Use Gemini Deep Research for long-running, cited research tasks.
metadata:
  tags: research, deep-research, gemini, subagent
---

## When to use

Use this skill when you need to perform comprehensive, deep research on a topic that requires:
- Extensive web searching and synthesis.
- Verified citations and sources.
- A long-running background process (asynchronous).
- A structured report as output.

Do NOT use this for simple fact checks or quick queries that can be answered with standard search tools.

## Prerequisites

Ensure the `google-genai` library is installed and your `GEMINI_API_KEY` is set in the environment.

```bash
pip install -r skills/deep-research/scripts/requirements.txt
```

## How to use

The workflow consists of three steps: **Plan**, **Submit**, and **Poll**.

### 1. Plan (Create Prompt)
Create a detailed prompt file (e.g., `research_brief.txt`). The prompt should include:
- **Scope**: Specific timeframes, regions, or domains.
- **Output Requirements**: Desired sections (Executive Summary, Evidence Table, etc.).
- **Constraints**: What to exclude.

### 2. Submit Research Job
Use the `deep_research.py` script to submit the job. This returns an Interaction ID.

```bash
python skills/deep-research/scripts/deep_research.py submit --prompt-file <path_to_prompt_file>
```

Output: `<INTERACTION_ID>`

### 3. Poll for Results
Use the ID from the previous step to poll for completion. You can optionally save the output to a file.

```bash
python skills/deep-research/scripts/deep_research.py poll --id <INTERACTION_ID> --out <output_report.md>
```

## Example Workflow

```bash
# 1. Create a brief
echo "Research the impact of quantum computing on cryptography in 2025-2026." > brief.txt

# 2. Submit
$ID = python skills/deep-research/scripts/deep_research.py submit --prompt-file brief.txt
# (Assuming the script prints the ID to stdout. If using PowerShell, capture it carefully.)

# 3. Poll (This will block until finished)
python skills/deep-research/scripts/deep_research.py poll --id $ID --out report.md

# 4. Read the report
type report.md
```
