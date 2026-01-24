---
name: ralph
description: Ralph Wiggum loop - retry until completion with a fixed iteration cap.
---

# Ralph loop

Use a plan-first loop to finish multi-step work deterministically.

Workflow:
1) Generate a comprehensive plan (JSON) with ordered steps and a completion phrase.
2) If the planner asks questions, stop and ask the user to answer them.
3) Iterate step-by-step, re-running until all steps complete or max iterations reached.

Included script:
- scripts/ralph-loop.py (plan-first loop runner that calls codex exec)

Usage:
```
python ralph-loop.py --prompt-file prompt.md --iterations 10 --complete "<promise>COMPLETE</promise>"
```
