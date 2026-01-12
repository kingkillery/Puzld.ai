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
  <a href="#modes">Modes</a>
</p>

<p align="center">
  <img src="https://img.shields.io/npm/v/pk-puzldai?color=blue" alt="npm">
  <img src="https://img.shields.io/badge/license-AGPL--3.0-green" alt="license">
  <img src="https://img.shields.io/badge/agents-Claude%20%7C%20Gemini%20%7C%20Codex%20%7C%20Ollama%20%7C%20Mistral-purple" alt="agents">
  <img src="https://img.shields.io/badge/models-sonnet%20%7C%20opus%20%7C%20gemini--pro%20%7C%20llama3.2-orange" alt="models">
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

# Check available agents
pk-puzldai check
```

---

## Commands

| Command | Description |
|---------|-------------|
| `pk-puzldai do "task"` | Auto-select best approach (recommended) |
| `pk-puzldai run "task"` | Single agent execution |
| `pk-puzldai pipe "task" "agent:action -> agent:action"` | Chain agents with arrow syntax |
| `pk-puzldai compare "task"` | Run same prompt on multiple agents |
| `pk-puzldai orchestrate "task"` | Intelligent multi-agent orchestration |
| `pk-puzldai autopilot "task"` | AI generates and executes plan |
| `pk-puzldai correct "task"` | Producer -> Reviewer -> Fix workflow |
| `pk-puzldai debate "topic"` | Multi-agent debate with rounds |
| `pk-puzldai consensus "task"` | Propose -> Vote -> Synthesize |
| `pk-puzldai pickbuild "task"` | Compare plans, pick best, implement |
| `pk-puzldai pkpoet "task"` | REASON -> DISCOVER -> ATTACK -> FORTIFY -> EXECUTE |
| `pk-puzldai ralph "task"` | Plan-first iterative loop (Ralph Wiggum style) |

### Pipeline Syntax

```bash
# Arrow-separated (recommended)
pk-puzldai pipe "build API" "gemini:plan -> claude:code -> codex:review"

# Comma-separated
pk-puzldai run "task" -P "gemini:analyze,claude:code,ollama:review"

# With custom model
pk-puzldai pipe "task" "Droid [glm-4.7]:coding -> claude:review"

# Just agents (defaults to prompt action)
pk-puzldai pipe "task" "gemini -> claude -> ollama"
```

---

## Modes

| Mode | Pattern | Use Case |
|------|---------|----------|
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

---

## Supported Agents

| Agent | Source | Requirement |
|-------|--------|-------------|
| Claude | Anthropic | Claude CLI installed |
| Gemini | Google | Gemini CLI installed |
| Codex | OpenAI | Codex CLI installed |
| Ollama | Local | Ollama running |
| Mistral | Mistral AI | Vibe CLI installed |

---

## Configuration

`~/.puzldai/config.json`

```json
{
  "defaultAgent": "auto",
  "fallbackAgent": "claude",
  "routerModel": "llama3.2",
  "adapters": {
    "claude": { "enabled": true, "model": "sonnet" },
    "gemini": { "enabled": true, "model": "gemini-2.0-flash" },
    "codex": { "enabled": true, "model": "gpt-5.1-codex" },
    "ollama": { "enabled": true, "model": "llama3.2" },
    "mistral": { "enabled": true }
  }
}
```

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

---

## License

AGPL-3.0-only — See [LICENSE](./LICENSE)
