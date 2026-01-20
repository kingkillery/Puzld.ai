<p align="center">
  <img src="https://unpkg.com/pk-puzldai@latest/assets/logo.jpg" width="300" alt="pk-puzldai">
</p>

<p align="center">
  <strong>Multi-LLM Orchestration CLI</strong>
</p>

<p align="center">
  <a href="#install">Install</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#commands">Commands</a> •
  <a href="#modes">Modes</a> •
  <a href="#factory-droid-modes">Factory-Droid</a>
</p>

<p align="center">
  <img src="https://img.shields.io/npm/v/pk-puzldai?color=blue" alt="npm">
  <img src="https://img.shields.io/badge/license-AGPL--3.0-green" alt="license">
  <img src="https://img.shields.io/badge/agents-Claude%20%7C%20Gemini%20%7C%20Codex%20%7C%20Ollama%20%7C%20Factory%20%7C%20Crush-purple" alt="agents">
  <img src="https://img.shields.io/badge/models-opus%20%7C%20sonnet%20%7C%20gemini--2.0%20%7C%20gpt--5.2-orange" alt="models">
</p>

---

**pk-puzldai** is a terminal-native CLI for orchestrating multiple AI agents. Route tasks, compare responses, chain agents in pipelines, or let them collaborate.

## Why pk-puzldai?

| Problem | Solution |
|---------|----------|
| Claude is great at code, Gemini at research | **Auto-routing** picks the best agent |
| Need multiple perspectives | **Compare mode** runs agents in parallel |
| Complex tasks need multiple steps | **Pipelines** chain agents: `gemini:plan -> claude:code` |
| Want agents to review each other | **Collaboration** — correct, debate, consensus |
| Need LLM to safely explore & edit files | **Agentic mode** with permission prompts |
| Context gets lost between sessions | **Memory/RAG** stores decisions for retrieval |
| Want AI to drive CLI tools autonomously | **Interactive mode** — AI responds to prompts |

---

## Install

```bash
npm install -g pk-puzldai
```

Or try without installing:

```bash
npx pk-puzldai
```

---

## Quick Start

```bash
# Interactive TUI
pk-puzldai

# Chat mode (Claude Code-like experience)
pk-puzldai chat                    # Start conversational REPL
pk-puzldai chat -x                 # With agentic/tool mode enabled

# Auto-select best approach (recommended)
pk-puzldai do "explain recursion"

# Single task with specific agent
pk-puzldai run "task" -a claude

# Compare agents
pk-puzldai compare "best error handling" -a claude,gemini

# Pipeline: plan -> code -> review (arrow syntax)
pk-puzldai pipe "build auth system" "gemini:plan -> claude:code -> ollama:review"

# Multi-agent collaboration
pk-puzldai correct "write a sort function" --producer claude --reviewer gemini
pk-puzldai debate "microservices vs monolith" -a claude,gemini
pk-puzldai consensus "best database choice" -a claude,gemini,ollama

# Interactive mode (AI responds to CLI prompts)
pk-puzldai interact "implement user auth"

# Campaign mode (hierarchical long-running execution)
pk-puzldai campaign "migrate to TypeScript"

# Check available agents
pk-puzldai check
```

---

## Commands

### Core Commands

| Command | Description |
|---------|-------------|
| `pk-puzldai do "task"` | Auto-select best approach (recommended) |
| `pk-puzldai chat` | Conversational REPL with slash commands (Claude Code-like) |
| `pk-puzldai run "task"` | Single agent execution |
| `pk-puzldai pipe "task" "agent:action -> ..."` | Chain agents with arrow syntax |
| `pk-puzldai compare "task"` | Run same prompt on multiple agents |
| `pk-puzldai orchestrate "task"` | Intelligent multi-agent orchestration |
| `pk-puzldai autopilot "task"` | AI generates and executes plan |
| `pk-puzldai interact "task"` | Interactive mode — AI responds to prompts |
| `pk-puzldai campaign "goal"` | Long-running hierarchical campaign mode |

### Collaboration Commands

| Command | Description |
|---------|-------------|
| `pk-puzldai correct "task"` | Producer -> Reviewer -> Fix workflow |
| `pk-puzldai debate "topic"` | Multi-agent debate with rounds |
| `pk-puzldai consensus "task"` | Propose -> Vote -> Synthesize |
| `pk-puzldai pickbuild "task"` | Compare plans, pick best, implement |

### Advanced Reasoning Commands

| Command | Description |
|---------|-------------|
| `pk-puzldai pkpoet "task"` | REASON -> DISCOVER -> ATTACK -> FORTIFY -> EXECUTE |
| `pk-puzldai ralph "task"` | Plan-first iterative loop |
| `pk-puzldai poetiq "task"` | Verification-first: FORMALIZE -> TEST -> DIVERGE -> CONVERGE |
| `pk-puzldai adversary "task"` | Red-team attack simulation |
| `pk-puzldai discover "task"` | Atomic analysis (SELF-DISCOVER v5) |
| `pk-puzldai codereason "task"` | Code-as-reasoning: FORMALIZE -> CODE -> EXECUTE -> VERIFY |
| `pk-puzldai feature "task"` | Multi-phase feature workflow with validation gates |

### Utility Commands

| Command | Description |
|---------|-------------|
| `pk-puzldai check` | Show available agents |
| `pk-puzldai model list` | List configured models |
| `pk-puzldai template list` | Show saved pipeline templates |
| `pk-puzldai session list` | Manage conversation sessions |
| `pk-puzldai remember "note"` | Save to memory |
| `pk-puzldai observe summary` | View observation insights |

### Pipeline Syntax

```bash
# Arrow-separated (recommended)
pk-puzldai pipe "build API" "gemini:plan -> claude:code -> codex:review"

# Comma-separated
pk-puzldai run "task" -P "gemini:analyze,claude:code,ollama:review"

# With custom model
pk-puzldai pipe "task" "factory [glm-4.7]:coding -> claude:review"

# Just agents (defaults to prompt action)
pk-puzldai pipe "task" "gemini -> claude -> ollama"
```

---

## Modes

| Mode | Pattern | Use Case |
|------|---------|----------|
| **Chat** | REPL + slash commands + streaming | Conversational, Claude Code-like |
| **Single** | One agent processes task | Quick questions |
| **Compare** | Same task -> multiple agents | See different perspectives |
| **Pipeline** | Agent A -> Agent B -> Agent C | Multi-step processing |
| **Autopilot** | LLM generates plan -> executes | Complex tasks |
| **Orchestrate** | Router + profiles + multi-agent | Auto-select best approach |
| **Correct** | Producer -> Reviewer -> Fix | Quality assurance |
| **Debate** | Agents argue in rounds | Find flaws in reasoning |
| **Consensus** | Propose -> Vote -> Synthesize | High-confidence answers |
| **PickBuild** | Propose plans -> Pick best -> Implement | Strategic planning |
| **Agentic** | LLM explores -> Tools -> Permission prompts | Codebase exploration |
| **Interactive** | AI responds to CLI tool prompts | Autonomous CLI driving |
| **Campaign** | Planner → Sub-planner → Workers with checkpoints | Long-running multi-task execution |

### Chat Mode Slash Commands

| Command | Aliases | Description |
|---------|---------|-------------|
| `/help` | `/h`, `/?` | Show available commands |
| `/model` | `/m` | Show or switch agent/model |
| `/clear` | `/c` | Clear conversation history |
| `/compact` | | Summarize and compress context |
| `/agentic` | `/a`, `/tools` | Toggle tool access mode |
| `/session` | `/s` | Manage sessions (list/new/load) |
| `/compare` | | Run last prompt on multiple agents |
| `/history` | | Show conversation history |
| `/exit` | `/quit`, `/q` | Exit chat |

---

## Factory-Droid Modes

Advanced reasoning paradigms from the factory-droid plugin:

| Mode | Phases | Best For |
|------|--------|----------|
| **PK-Poet** | REASON -> DISCOVER -> ATTACK -> FORTIFY -> EXECUTE | Complex implementation with adversarial review |
| **Poetiq** | FORMALIZE -> TEST -> DIVERGE -> CONVERGE -> SELECT | Verification-first problem solving |
| **Adversary** | Red-team simulation | Finding vulnerabilities and edge cases |
| **Self-Discover** | SELECT -> IMPLEMENT -> VERIFY | Atomic problem decomposition |
| **Code-Reason** | FORMALIZE -> CODE -> EXECUTE -> VERIFY | Using code as a thinking medium |
| **Large-Feature** | Multi-phase with validation gates | Systematic feature implementation |

```bash
# PK-Poet: Full reasoning pipeline
pk-puzldai pkpoet "implement authentication" --depth deep

# Poetiq: Verification-first
pk-puzldai poetiq "fix sorting bug" --verify-command "bun test"

# Adversary: Red-team the implementation
pk-puzldai adversary "review auth system" --target-files "src/auth/*"

# Code-Reason: Think through code
pk-puzldai codereason "solve optimization problem"

# Large Feature: Phased implementation
pk-puzldai feature "add user dashboard" --phases 3
```

---

## Supported Agents

| Agent | Source | CLI | Requirement |
|-------|--------|-----|-------------|
| Claude | Anthropic | `claude` | Claude CLI installed |
| Gemini | Google | `gemini` | Gemini CLI installed |
| Codex | OpenAI | `codex` | Codex CLI installed |
| Ollama | Local | `ollama` | Ollama running locally |
| Mistral | Mistral AI | `vibe` | Vibe CLI installed |
| Factory | Factory.ai | `factory` | Factory CLI installed |
| Crush | Charm | `crush` | Crush CLI installed |

### Agent Safety

Some agents have different safety profiles for agentic mode:

| Agent | Agentic Safety | Notes |
|-------|----------------|-------|
| Claude | SAFE | Full permission system |
| Ollama | SAFE | Local, no native file access |
| Mistral | SAFE | Tools disabled by default |
| Gemini | Use `gemini-safe` | Auto-redirect enabled |
| Codex | Use `codex-safe` | Auto-redirect enabled |
| Factory | Configurable | Depends on autonomy settings |

---

## Configuration

`~/.puzldai/config.json`

```json
{
  "defaultAgent": "auto",
  "fallbackAgent": "claude",
  "routerModel": "llama3.2",
  "confidenceThreshold": 0.6,
  "timeout": 120000,
  "adapters": {
    "claude": { "enabled": true, "model": "sonnet" },
    "gemini": { "enabled": true, "model": "gemini-2.0-flash" },
    "codex": { "enabled": true, "model": "gpt-5.2-codex" },
    "ollama": { "enabled": true, "model": "llama3.2" },
    "mistral": { "enabled": true },
    "factory": { "enabled": true },
    "crush": { "enabled": true }
  }
}
```

---

## Architecture

```
┌─────────────────────────────────────────┐
│   CLI/TUI Interface                     │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│   Orchestrator (routing, profiles)      │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│   Executor (plan validation, deps)      │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│   Adapters (claude, gemini, codex, ...) │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│   Memory / Indexing / Context           │
└─────────────────────────────────────────┘
```

**Key Features:**
- **Plan Validation** — Fails fast on invalid plans (cycles, missing deps)
- **Dependency Graphs** — Steps declare `dependsOn` for parallel execution
- **Context Injection** — Dynamic memory retrieval based on task
- **Interactive Mode** — AI responds to CLI tool prompts autonomously

---

## Development

```bash
git clone https://github.com/kingkillery/Puzld.ai.git
cd Puzld.ai
bun install
bun run build
npm link
pk-puzldai
```

### Testing

```bash
bun test                    # Run all tests
bun test src/executor/      # Run executor tests
npm run typecheck           # Type checking
```

---

## License

AGPL-3.0-only — See [LICENSE](./LICENSE)
