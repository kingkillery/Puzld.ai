---
name: pk-puzldai
description: Run the pk-puzldai CLI for multi-LLM orchestration, plan-first loops, and agentic coding workflows.
---

# pk-puzldai CLI Skill

Use pk-puzldai to orchestrate multiple agents (Claude, Gemini, Codex, Ollama, Mistral) and run plan-first workflows.

## When to Use

- Multi-agent orchestration or comparisons.
- Plan-first execution with Ralph loop.
- Agentic workflows that need tool usage and approvals.

## Quick Reference

| Task | Command |
|------|---------|
| Auto-route | `pk-puzldai do "task"` |
| Plan-first loop | `pk-puzldai ralph "task" --iters 3 --tests "npm test"` |
| Single agent | `pk-puzldai run "task" -a claude` |
| Pipeline | `pk-puzldai run "task" -P "gemini:analyze,claude:code"` |
| Compare agents | `pk-puzldai compare "task" -a claude,gemini` |
| Pick best plan | `pk-puzldai pickbuild "task" -a claude,gemini` |
| Producer/reviewer | `pk-puzldai correct "task" --producer claude --reviewer gemini` |
| Agentic tools | `pk-puzldai agent -a claude` |

## Configuration

- Config path: `~/.puzldai/config.json`
- Check adapters: `pk-puzldai check`
- MCP status: `pk-puzldai mcp-status`

## Notes

- Use `pk-puzldai interact "task"` for interactive approvals.
- If execution fails, verify adapters are installed and configured.
