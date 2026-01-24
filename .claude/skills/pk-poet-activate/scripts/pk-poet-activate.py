#!/usr/bin/env python3
"""Print pk-poet scaffolding context when token is present.

Usage:
  echo '{"prompt": "pk-poet: do X"}' | python pk-poet-activate.py
"""
import json
import re
import sys

PK_POET_RE = re.compile(r"(?i)(^|\b)pk-poet(\b|:)\s*")

SCAFFOLDING = """[pk-poet mode]

The user invoked pk-poet. Activate the super-reasoning scaffolding:

1) Planning-first when scope is unclear or multi-file
   - If the task is non-trivial (multi-file / multi-phase), use spec-first planning and produce/maintain IMPLEMENTATION_PLAN.md with 4-8 phases.
   - Implement exactly ONE phase at a time, keeping each phase independently mergeable.

2) Verification-first implementation
   - Follow Poetiq protocol: formalize + tests/oracle first + implement + run validators + iterate until green.
   - If no test framework exists, create a minimal deterministic harness / smoke checks.

3) Adversarial check before declaring done
   - Do a quick red-team pass (inputs, authz, error paths, concurrency, perf footguns) and run smallest repros.

4) Default outputs (keep it concise)
   - Plan (phases / current phase)
   - Evidence (commands run + pass/fail)
   - Result (what changed / what remains)

Important:
   - Treat the literal token "pk-poet" as an activation tag, not part of the task requirements.
"""

try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)

prompt = data.get("prompt") or ""
if not PK_POET_RE.search(prompt):
    sys.exit(0)

out = {
    "systemMessage": "pk-poet mode active",
    "hookSpecificOutput": {
        "hookEventName": "UserPromptSubmit",
        "additionalContext": SCAFFOLDING,
    },
}

print(json.dumps(out))
