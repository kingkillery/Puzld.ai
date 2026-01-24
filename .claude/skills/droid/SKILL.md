---
name: droid
description: Use pk-puzldai for multi-LLM orchestration, agentic code execution, and AI-assisted development tasks.
---

Use pk-puzldai for intelligent multi-agent coding workflows. PuzldAI orchestrates multiple LLM providers (Claude, Gemini, Codex, Ollama, Mistral) for complex tasks.

## Quick Reference

| Task | Command |
|------|---------|
| Auto-select best approach | `pk-puzldai do "task"` |
| Compare agents in parallel | `pk-puzldai compare "task"` |
| Plan-first iterative | `pk-puzldai ralph "task"` |
| Pipeline workflow | `pk-puzldai run "task" -P "gemini:analyze,claude:code"` |
| Pick best plan → build | `pk-puzldai pickbuild "task" -a claude,gemini` |
| Correction mode | `pk-puzldai correct "task" --producer claude --reviewer gemini` |
| Multi-agent debate | `pk-puzldai debate "topic" -a claude,gemini -r 3` |
| Consensus building | `pk-puzldai consensus "task" -a claude,gemini,ollama` |
| Check availability | `pk-puzldai check` |
| Index codebase | `pk-puzldai index [path]` |

## Core Execution Modes

### Single Mode (run)
Process a task with one agent:
```bash
pk-puzldai run "Fix the login bug" -a claude
pk-puzldai run "Refactor auth module" -a ollama
```

### Compare Mode
Run multiple agents in parallel and compare results:
```bash
pk-puzldai compare "Best approach for caching"
pk-puzldai compare "Optimize database queries" -a claude,gemini,codex
```

### Pipeline Mode
Chain agents sequentially for complex workflows:
```bash
pk-puzldai run "Build feature" -P "gemini:analyze,ollama:plan,claude:code"
pk-puzldai run "Review PR" -P "claude:diff,gemini:security,codex:test"
```

### PickBuild Mode
Propose plans → pick best → implement:
```bash
pk-puzldai pickbuild "Add user authentication" -a claude,gemini -i
pk-puzldai pickbuild "API redesign" --picker ollama --build claude
```

### Ralph Mode (Plan-First Iterative)
Plan-first execution with explicit budgets and guardrails:
```bash
pk-puzldai ralph "Fix bug X" --iters 5 --tests "npm test"
pk-puzldai ralph "Add feature Y" --scope "src/" --max-files 10
pk-puzldai ralph "Refactor module" --tests "bun test" --summary
```

Ralph features:
- Generates structured plan with clarifying questions
- Tracks files changed, tool calls, and commands run
- Enforces budgets (MAX_ITERS=5, MAX_FILES=8, MAX_TOOL_CALLS=50)
- Per-iteration: Plan → Identify → Execute → Verify → Reflect

### Correction Mode
Producer → Reviewer → Fix cycle:
```bash
pk-puzldai correct "Write tests" --producer claude --reviewer gemini
pk-puzldai correct "Security audit" --producer ollama --reviewer claude
```

### Debate Mode
Agents argue in rounds until consensus:
```bash
pk-puzldai debate "Microservices vs monolithic" -a claude,gemini -r 3
pk-puzldai debate "Best architecture" -a claude,gemini,codex -r 5
```

### Consensus Mode
Propose → Vote → Synthesize:
```bash
pk-puzldai consensus "API design" -a claude,gemini,ollama
pk-puzldai consensus "Database schema" -a claude,codex
```

## Agent Selection

| Agent | Best For |
|-------|----------|
| claude | Complex coding, architecture, debugging |
| gemini | Analysis, research, documentation |
| codex | Quick code generation |
| ollama | Local processing, simple queries |
| mistral | Lightweight tasks |
| auto | Router selects based on task |

```bash
# Force specific agent
pk-puzldai run "task" -a claude

# Multiple agents for compare/pipeline
pk-puzldai compare "task" -a claude,gemini,ollama

# Auto-route (default)
pk-puzldai do "task"
```

## Agentic Mode (Tool Access)

Enable full tool access (view, glob, grep, bash, write, edit):

```bash
# With tool execution
pk-puzldai agent -a claude
pk-puzldai ralph "Fix bug" --scope src/ --tests "npm test"

# In interactive mode (permission prompts)
pk-puzldai interact "Refactor component"
```

## Memory & Context

```bash
# Save a memory
pk-puzldai remember "Project uses pnpm, not npm"

# List memories
pk-puzldai remember

# Index codebase for semantic search
pk-puzldai index

# View observation summary
pk-puzldai observe summary
```

## MCP Integration

```bash
pk-puzldai mcp-status
pk-puzldai login
pk-puzldai whoami
pk-puzldai logout
```

## Templates & Workflows

```bash
# List templates
pk-puzldai template list

# Run a saved template
pk-puzldai run "task" -T my-workflow

# Create template
pk-puzldai template create my-workflow -P "gemini:plan,claude:code"
```

## Profiles

Orchestration profiles for different scenarios:

```bash
pk-puzldai profile list
pk-puzldai profile show efficient
pk-puzldai profile set-default efficient
pk-puzldai profile create my-profile --iters 3 --fallback ollama
```

## Configuration

Location: `~/.puzldai/config.json`

```json
{
  "defaultAgent": "auto",
  "routerModel": "llama3.2",
  "timeout": 120000,
  "confidenceThreshold": 0.6,
  "adapters": {
    "claude": { "enabled": true },
    "gemini": { "enabled": true },
    "ollama": { "enabled": true, "model": "llama3.2" }
  }
}
```

## Common Patterns

### Code Review Workflow
```bash
# Quick review
pk-puzldai compare "Review this code for issues" -a claude,gemini

# Detailed review with agentic tools
pk-puzldai ralph "Full security audit" --scope src/ --tests "npm test"
```

### Feature Development
```bash
# Plan-first approach
pk-puzldai ralph "Add payment integration" --scope src/payments/

# Quick prototype
pk-puzldai pickbuild "MVP of feature X" -a claude -i

# Compare implementations
pk-puzldai compare "Best approach for feature Y" -a claude,gemini
```

### Debugging
```bash
# Analyze and fix
pk-puzldai correct "Debug issue Y" --producer claude --reviewer gemini

# Iterative fixing
pk-puzldai ralph "Fix production bug" --iters 3 --tests "npm test"
```

### Documentation
```bash
# Generate docs
pk-puzldai run "Document the API" -a gemini

# Improve existing docs
pk-puzldai compare "Review and improve README" -a claude,gemini
```

## Best Practices

1. **Start with `do` or `ralph`** - Auto-select gives good defaults
2. **Use `compare` for decisions** - Multiple perspectives help
3. **Use `pickbuild` for complex features** - Explicit plan selection
4. **Use `correct` for quality** - Producer/reviewer cycle catches bugs
5. **Use ` Ralph`** - Guardrails prevent runaway execution
6. **Set up memory** - Remember project conventions
7. **Index codebase** - Enable semantic search for context

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Adapter unavailable | Run `pk-puzldai check` to verify CLI installation |
| Router fails | Ensure Ollama is running with `routerModel` |
| Permission denied | Use interactive mode or configure auto-approve |
| Token limits | Reduce prompt size, use context compaction |

## Resources

- **GitHub**: https://github.com/kingkillery/Puzld.ai
- **Docs**: See CLAUDE.md and AGENTS.md in project root


## Examples

See the `examples/` folder for ready-to-use workflow scripts:

- `basic-workflow.sh` - Feature development workflow with ralph/compare/pickbuild
- `correction-mode.sh` - Producer/reviewer quality cycle
- `debate-mode.sh` - Architectural decision debates

## References

See the `references/` folder for:

- `related-skills.md` - Links to related skills and external resources