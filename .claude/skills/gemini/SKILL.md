---
name: gemini
description: Use when invoking Google Gemini CLI for code generation or analysis. Triggers on "use gemini", "gemini help", "gemini subagent", "gemini implementation", "gemini analyze", or when needing sophisticated code generation as a subagent.
---

# Gemini CLI Integration

## Overview

Use Google Gemini CLI as a coding subagent. Factory Droid handles file operations and verification while Gemini provides code analysis and generation via Google's Gemini models.

## Quick Reference

| Task | Command |
|------|---------|
| Interactive mode | `gemini` |
| Direct execution | `gemini <prompt>` |
| With approval mode | `gemini --approval-mode auto_edit` |
| Read-only mode | `gemini --approval-mode default` |
| Check version | `gemini --version` |

## Installation

```bash
# Via npm
npm install -g @google/gemini-cli

# Via Homebrew
brew install gemini-cli

# Or download from GitHub releases
# https://github.com/google-gemini/gemini-cli/releases
```

## Usage Modes

```bash
gemini                                    # Interactive
gemini --approval-mode default           # Read-only mode
gemini --approval-mode auto_edit         # Auto-edits files
gemini --approval-mode confirm_all       # Confirm all operations
gemini <prompt>                           # Direct execution
```

## Subagent Pattern

Use Gemini for analysis, Factory Droid for applying changes:

```bash
# 1. Ask Gemini to analyze and generate patches
gemini "Analyze <files> and generate implementation plan for <requirement>"

# 2. Review Gemini output
# 3. Apply changes with Factory Droid's Edit/Write tools
```

### Example: Multi-file Refactoring

```bash
gemini "The project needs to add a downloadUrl field to DistroVariant.

Current files:
- app/src/main/java/com/app/model/DistroVariant.kt
- app/src/main/java/com/app/service/DownloadService.kt

Requirements:
1. Add downloadUrl field to DistroVariant
2. Update DownloadService to use distro.downloadUrl

Analyze the code and provide implementation steps."
```

## Combined Workflow

1. **Plan** - Factory Droid analyzes requirements using agentic tools (view, glob, grep)
2. **Generate** - Gemini creates implementation plan via direct invocation
3. **Apply** - Factory Droid applies changes with Edit/Write tools (with permission checks)
4. **Test** - Factory Droid runs tests via Bash tool
5. **Iterate** - Repeat until tests pass

## Factory Droid vs Gemini

| Capability | Gemini CLI | Factory Droid |
|------------|-----------|---------------|
| Code generation | Yes | Yes |
| Multi-modal | Yes (images, video) | Yes |
| Repository-wide changes | Yes | Yes |
| Agentic tools (view/glob/grep) | Built-in | Advanced |
| Permission system | Built-in | Advanced |
| File operations | Native | Controlled |
| Bash execution | Built-in | Yes |
| LSP integration | Built-in | Via MCP |

## Best Practices

1. **Clear Prompts** - Be specific about files and changes
2. **Leverage LSP** - Gemini uses LSPs for additional context automatically
3. **Use Read-Only Mode** - For analysis tasks, use `--approval-mode default`
4. **Verify First** - Have Gemini analyze before making changes
5. **Incremental Changes** - Break large changes into smaller tasks
6. **Review Before Apply** - Always review Gemini output before applying with Droid
7. **Use Droid Tools** - Leverage view/glob/grep to explore before changes

## Common Mistakes

- Running Gemini in auto_edit mode without review
- Not specifying which files to analyze
- Applying changes without verification
- Using interactive mode when direct invocation is better
- Not using Droid's permission system for risky changes

## Droid-Specific Integration

When using Gemini as a subagent with Factory Droid:

1. **Explore First**: Use Droid's `glob` and `grep` to find relevant files
2. **Analyze with Gemini**: Generate implementation plan via direct invocation
3. **Review Output**: Check Gemini's generated plan/code
4. **Apply with Droid**: Use Edit/Write tools with permission checks
5. **Verify with Bash**: Run tests to confirm changes work

### Example Workflow

```bash
# In Factory Droid session:

# 1. Find files to modify
glob "**/*Variant*.kt"
grep "class DistroVariant" app/src/main/java/

# 2. Use Gemini to generate implementation plan
gemini "Analyze DistroVariant.kt and create plan for adding downloadUrl field"

# 3. Review Gemini output
# 4. Apply changes using Droid's Edit tool
# 5. Run tests
bash "gradle test"
```

## Gemini CLI Features

### Multi-Model Support
- Gemini 2.5 Pro
- Gemini 2.5 Flash
- Gemini 2.0 Pro
- And more via configuration

### LSP Integration
Gemini automatically uses Language Server Protocol for enhanced context:
- Go (gopls)
- TypeScript (typescript-language-server)
- Python (pylsp)
- And more

### MCP Support
Model Context Protocol servers for extended capabilities:
- GitHub
- Linear
- Notion
- Stripe
- And 40+ more

### Session Management
- Multiple sessions per project
- Session resumption
- Chat history management

### Configuration Files
- `crush.json` - Project-specific config
- `.crushignore` - Files to ignore
- `$HOME/.config/crush/crush.json` - Global config

## Approval Modes

| Mode | Behavior | Use Case |
|------|----------|----------|
| `default` | Read-only, no file modifications | Analysis, code review |
| `auto_edit` | Auto-approve file edits | Safe refactoring |
| `confirm_all` | Prompt for all operations | High-risk changes |

## Output Formats

Gemini can output in different formats:
- **Text** (default) - Human-readable output
- **JSON** - Machine-readable for parsing
- **Stream** - Real-time streaming responses

## Requirements

- Node.js 18+ (for npm installation)
- Gemini API key or Google Cloud authentication
- Gemini CLI version 0.25.0+ (latest recommended)
- Factory Droid installed and configured

## Advanced Usage

### Multi-Modal Analysis
```bash
gemini "Analyze this screenshot and implement the design shown" screenshot.png
```

### Session Resumption
```bash
gemini "Start implementation"
# Later...
gemini --resume "Continue the implementation"
```

### Custom Prompts
```bash
gemini --system-prompt "You are a security expert" "Review this code for vulnerabilities"
```

## Troubleshooting

**Issue**: Gemini not found  
**Fix**: Install via `npm install -g @google/gemini-cli`

**Issue**: Authentication errors  
**Fix**: Set `GEMINI_API_KEY` or run `gcloud auth application-default login`

**Issue**: LSP not working  
**Fix**: Ensure LSP servers are installed and in PATH

**Issue**: File access denied  
**Fix**: Check file permissions and use appropriate approval mode

---

*The Gemini CLI skill extends Factory Droid's capabilities with Google's powerful multi-modal AI models.*