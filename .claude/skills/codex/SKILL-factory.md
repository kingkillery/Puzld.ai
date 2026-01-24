---
name: codex
description: Use when invoking OpenAI Codex CLI for code generation or analysis. Triggers on "use codex", "codex help", "codex subagent", "codex implementation", "codex analyze", or when needing sophisticated code generation as a subagent.
---

# Codex CLI Integration

## Overview

Use OpenAI Codex CLI as a coding subagent. Factory Droid handles file operations and verification while Codex provides code analysis and generation via GPT-5.2-Codex.

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

Use Codex for analysis, Factory Droid for applying changes:

```bash
# 1. Ask Codex to analyze and generate patches
codex exec "Analyze <files> and generate diff patches for <requirement>"

# 2. Review Codex output
# 3. Apply changes with Factory Droid's Edit/Write tools
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

1. **Plan** - Factory Droid analyzes requirements using agentic tools (view, glob, grep)
2. **Generate** - Codex creates implementation via `codex exec`
3. **Apply** - Factory Droid applies changes with Edit/Write tools
4. **Test** - Factory Droid runs tests via Bash tool
5. **Iterate** - Repeat until tests pass

## Factory Droid vs Codex

| Capability | Codex CLI | Factory Droid |
|------------|-----------|---------------|
| Code generation | Yes | Yes |
| Repository-wide changes | Yes | Yes |
| Agentic tools (view/glob/grep) | Limited | Full |
| Permission system | Basic | Advanced |
| File operations | Direct | Controlled |
| Bash execution | Yes | Yes |
| Windows native | Limited | Full |

## Best Practices

1. **Clear Prompts** - Be specific about files and changes
2. **Request Diffs** - Ask for diff format output for easy review
3. **Verify First** - Have Codex analyze before generating changes
4. **Incremental Changes** - Break large changes into smaller tasks
5. **Review Before Apply** - Always review Codex output before applying with Droid
6. **Use Droid Tools** - Leverage view/glob/grep to explore before changes

## Common Mistakes

- Running Codex in auto-edit mode without review
- Not specifying which files to analyze
- Applying diffs without verification
- Using interactive mode when exec is better
- Not using Droid's permission system for risky changes

## Droid-Specific Integration

When using Codex as a subagent with Factory Droid:

1. **Explore First**: Use Droid's `glob` and `grep` to find relevant files
2. **Analyze with Codex**: Generate patches using `codex exec`
3. **Review Output**: Check Codex's generated diffs
4. **Apply with Droid**: Use Edit/Write tools with permission checks
5. **Verify with Bash**: Run tests to confirm changes work

### Example Workflow

```bash
# In Factory Droid session:

# 1. Find files to modify
glob "**/*Variant*.kt"
grep "class DistroVariant" app/src/main/java/

# 2. Use Codex to generate patches
codex exec "Analyze DistroVariant.kt and add downloadUrl field. Generate diff patch."

# 3. Review Codex output
# 4. Apply changes using Droid's Edit tool
# 5. Run tests
bash "gradle test"
```

## Requirements

- Node.js 18+
- OpenAI account (ChatGPT or API key)
- Codex CLI version 0.23.0+ (security fix)
- Factory Droid installed and configured