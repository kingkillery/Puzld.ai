---
name: ix-codemode
description: Prefer Code Mode execution (single code snippet) to chain local IX operations using the IxCodeMode API (lookup, snapshot, file IO, shell) instead of many direct tool calls.
allowed-tools: Read, Grep, Glob, Bash
---

# IX Code Mode

## Goal
When you need to perform multi-step work that would normally require several tool calls, prefer **Code Mode**: write a short Python snippet that uses the `ix` API (IxCodeMode) and execute it via the `ix_agent.cli codemode` command.

This mirrors Cloudflare's Code Mode concept: one execution entrypoint + a real API.

## When to use
- You need to chain operations (e.g., snapshot freshness check → lookup → extract notes/logs → compute a summary).
- You need to run a small amount of logic over results (filtering, formatting, joins).
- You want a single structured JSON payload back.

## When NOT to use
- Any workflow that implies submitting to a portal (Ambia rule: **never submit without explicit user approval**).
- Long-running batch jobs.

## How to run
Use one of:

```bash
python -m ix_agent.cli codemode --code "<python>" --json
python -m ix_agent.cli codemode --file path/to/snippet.py --json
```

By default, `codemode` also attaches a `snapshot` of dataset files and mtimes.

## API surface (available as `ix`)
- `ix.snapshot()` -> DataSnapshot (freshness / files present)
- `ix.lookup_find(term, utility=None)` -> dict (project record)
- `ix.lookup_search(term, utility=None, limit=5)` -> list[dict]
- `ix.read_text(path)` / `ix.write_text(path, content)`
- `ix.run(command, timeout_sec=60)` -> CommandResult

## Conventions
- Put your primary structured output in a variable named `result`.
- Use `print()` for any human-readable output.
- Prefer returning JSON-friendly objects (dict/list/str/number/bool).

## Example snippets

### Find a project and return combined notes/logs
```python
rec = ix.lookup_find("1234ABC")
result = {
  "project_name": rec["project_name"],
  "utility": rec["utility"],
  "combined_notes": "\n".join([*rec.get("notes", []), *rec.get("taskray_logs", [])]),
}
print(result["project_name"], result["utility"])
```

### Search and return top matches
```python
result = ix.lookup_search("opp", limit=10)
print(len(result))
```
