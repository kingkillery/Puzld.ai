---
name: codex
description: Use when invoking OpenAI Codex CLI for code generation or analysis. Triggers on "use codex", "codex help", "codex subagent", "codex implementation", "codex analyze", or when needing sophisticated code generation as a subagent.
---

# Codex CLI Integration

## Overview

Use OpenAI Codex CLI as a coding subagent. Claude Code handles file operations and verification while Codex provides code analysis and generation via GPT-5.2-Codex.

## Quick Reference

| Task | Command |
|------|---------|
| Interactive mode | `codex` |
| Direct execution | `codex exec "<prompt>"` |
| With approval | `codex --suggest` |
| Auto-edit files | `codex --auto-edit` |
| Full autonomous | `codex --full-auto` |
| Check version | `codex --version` |

## Installation

```bash
npm i -g @openai/codex
# or
brew install --cask codex
```

## Usage Modes

```bash
codex                    # Interactive
codex --suggest          # Requires approval
codex --auto-edit        # Auto-edits files
codex --full-auto        # Full autonomous
codex exec "<prompt>"    # Direct execution (recommended for subagent)
```

## Subagent Pattern

Use Codex for analysis, Claude Code for applying changes:

```bash
# 1. Ask Codex to analyze and generate patches
codex exec "Analyze <files> and generate diff patches for <requirement>"

# 2. Review Codex output
# 3. Apply changes with Claude Code's Edit tool
```

### Example: Multi-file Refactoring

```bash
codex exec "The project needs to add a downloadUrl field to DistroVariant.

Current files:
- app/src/main/java/com/app/model/DistroVariant.kt
- app/src/main/java/com/app/service/DownloadService.kt

Requirements:
1. Add downloadUrl field to DistroVariant
2. Update DownloadService to use distro.downloadUrl

Generate diff patches for each file."
```

## Combined Workflow

1. **Plan** - Claude Code analyzes requirements
2. **Generate** - Codex creates implementation via `codex exec`
3. **Apply** - Claude Code applies changes and handles files
4. **Test** - Claude Code runs tests
5. **Iterate** - Repeat until tests pass

## Claude Code vs Codex

| Capability | Codex CLI | Claude Code |
|------------|-----------|-------------|
| Code generation | Yes | Yes |
| Repository-wide changes | Yes | Yes |
| MCP integrations | Yes | Yes |
| Windows native | Limited | Full |
| Direct file write | Limited | Full |

## Best Practices

1. **Clear Prompts** - Be specific about files and changes
2. **Request Diffs** - Ask for diff format output for easy review
3. **Verify First** - Have Codex analyze before generating changes
4. **Incremental Changes** - Break large changes into smaller tasks
5. **Review Before Apply** - Always review Codex output before applying

## Common Mistakes

- Running Codex in auto-edit mode without review
- Not specifying which files to analyze
- Applying diffs without verification
- Using interactive mode when exec is better

## Requirements

- Node.js 18+
- OpenAI account (ChatGPT or API key)
- Version 0.23.0+ (security fix)
