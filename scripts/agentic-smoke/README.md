# Agentic Smoke Tests

These tests exercise agentic capabilities (read, search, edit, execute) across:
- Gemini CLI
- Claude Code CLI
- pk-puzldai

Each harness uses the same fixture directory. Gemini uses a prompt that avoids shell execution because its tool registry does not include exec in this environment.

## Fixture

Files live under `scripts/agentic-smoke/fixture` and are safe to modify.

## Prompt

Prompts:
- `scripts/agentic-smoke/prompts/agentic-smoke-common.txt` (Claude + pk-puzldai)
- `scripts/agentic-smoke/prompts/agentic-smoke-gemini.txt` (Gemini)

## Expected Results

- `scripts/agentic-smoke/fixture/notes.txt` contains the line `agentic-smoke: updated`.
- `scripts/agentic-smoke/fixture/summary.txt` exists and contains `{"sum":6}`.
- `scripts/agentic-smoke/fixture/calc.js` includes a `sumNumbers(numbers)` function and exports it.
- The tool runs a simple command and reports output.

## Run

PowerShell scripts:
- `scripts/agentic-smoke/run-gemini.ps1`
- `scripts/agentic-smoke/run-claude.ps1`
- `scripts/agentic-smoke/run-pk-puzldai.ps1`

Each script prints the prompt, runs the tool if available, and performs basic checks.
