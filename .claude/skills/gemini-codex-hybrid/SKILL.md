---
name: gemini-codex-hybrid
description: Use when tasks require excellent context gathering and strong implementation skills. Triggers on "use gemini-codex", "hybrid mode", "use planning then implementation", or when needing deep analysis followed by robust code generation. Uses Gemini 3 Flash for context/explore, then passes to Codex or Claude Code for implementation.
---

# Gemini-Codex Hybrid Sub-Droid

## Overview

A powerful hybrid approach that combines **Gemini 3 Flash** for exceptional context gathering and analysis with **Codex CLI** or **Claude Code** for robust implementation. This sub-droid orchestrates these CLI tools to leverage their respective strengths:

- **Gemini 3 Flash**: Fast, excellent at understanding complex codebases, multi-modal capabilities
- **Codex CLI**: Strong code generation, GPT-5.2-Codex for implementation
- **Claude Code**: Advanced agentic capabilities, excellent at complex refactoring and architectural changes

## When to Use This Hybrid

✅ **Perfect for:**
- Complex tasks requiring deep codebase understanding
- Multi-file refactoring with many dependencies
- Architectural changes requiring context
- Debugging unfamiliar codebases
- "I need to understand this system before changing it"

⚠️ **Not ideal for:**
- Simple bug fixes (use Codex/Claude directly)
- Quick analysis only (use Gemini directly)
- Well-understood codebases (use implementation tool directly)

## Fast Decision Tree

```
Task Complexity?
│
├─ Simple (< 3 files, clear requirements)
│  └─→ Use Codex or Claude Code directly
│
├─ Medium (3-10 files, some context needed)
│  ├─→ Straightforward code gen? → Gemini + Codex
│  └─→ Need testing/debugging? → Gemini + Claude Code
│
└─ High (10+ files, complex dependencies)
   ├─→ Architecture changes? → Gemini + Claude Code
   ├─→ Multi-modal (images/docs)? → Gemini + Claude Code
   └─→ Performance critical? → Gemini + Codex (faster)
```

## The Hybrid Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. GEMINI 3 FLASH - Context & Understanding                      │
│    • Explore codebase with glob/grep                         │
│    • Use LSP integration for enhanced context               │
│    • Multi-modal: analyze screenshots, diagrams, docs          │
│    • Comprehensive analysis with dependencies                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. ANALYSIS REFINEMENT (Optional)                            │
│    • If problem is very difficult, pass back to Gemini        │
│    • Implementation tool provides initial plan              │
│    • Gemini refines the plan                                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. IMPLEMENTATION - Choose Based on Task:                    │
│                                                              │
│  Option A: CODEX CLI                                        │
│    • Receives Gemini's comprehensive context                 │
│    • Generates robust implementation                         │
│    • GPT-5.2-Codex for code generation                       │
│                                                              │
│  Option B: CLAUDE CODE                                      │
│    • Advanced agentic tool use                               │
│    • Excellent at complex refactoring                        │
│    • Strong architectural understanding                      │
│    • Claude 3.7 Sonnet for implementation                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. FACTORY DROID - Verification & Application                │
│    • Apply changes with Edit/Write tools                      │
│    • Run tests to verify                                   │
│    • Handle permissions with approval system                  │
└─────────────────────────────────────────────────────────────┘
```

## Quick Reference

| Phase | Tool | Model | Context | Speed | Cost (per 1M tokens) | Best For |
|-------|------|------|---------|-------|---------------------|----------|
| Context | Gemini CLI | Gemini 3 Flash | 1M in / 64k out | ⚡ Very Fast | ~$0.075 / ~$0.30 | Large codebases, multi-modal |
| Implementation | Codex CLI | GPT-5.2-Codex | 400k / 128k out | 🚀 Fast | ~$1.75 / ~$14 | Straightforward generation |
| Implementation | Claude Code | Claude 3.7 Sonnet | 200k / 128k out | 🚀 Fast | ~$3 / ~$15 | Complex refactoring, testing |
| Verification | Factory Droid | Agentic | N/A | N/A | N/A | Apply changes, run tests |

## Installation Requirements

### 1. Gemini CLI (Required)
```bash
npm install -g @google/gemini-cli
# or
brew install gemini-cli
```

### 2. Implementation Tool (Choose One or Both)

**Option A: Codex CLI**
```bash
npm install -g @openai/codex
# or
brew install --cask codex
```

**Option B: Claude Code**
```bash
npm install -g @anthropic-ai/claude-code
# or
brew install --cask claude-code
```

### 3. Factory Droid (Required)
```bash
curl -fsSL https://app.factory.ai/cli | sh
```

## Configuration

### Environment Setup

```bash
# Gemini CLI
export GEMINI_API_KEY="your-key"
export GEMINI_MODEL="gemini-3-flash"

# Codex CLI
export OPENAI_API_KEY="your-key"

# Claude Code
export ANTHROPIC_API_KEY="your-key"

# Verify installations
gemini --version && gemini --model list | grep flash
codex --version
claude-code --version
```

### CLI Command Patterns

```bash
# Phase 1: Gemini Analysis
gemini "Analyze [topic]. Focus on: [specific areas]. Use glob/grep to explore."

# Phase 2a: Codex Implementation
codex exec --sandbox workspace-write "Implement based on analysis: [gemini output]"

# Phase 2b: Claude Code Implementation
claude-code "Implement using agentic tools. Context: [gemini output]. Use tools to read, edit, test."

# Phase 3: Verify
droid "Review changes, run tests, and verify implementation"
```

### Expected Performance

| Task Type | Gemini | Codex | Claude Code | Total Time |
|-----------|--------|-------|-------------|------------|
| Small refactor (<5 files) | 10-20s | 20-30s | 30-45s | ~1-2 min |
| Medium refactor (5-20 files) | 30-60s | 1-2 min | 2-3 min | ~3-5 min |
| Large refactor (20+ files) | 1-2 min | 2-4 min | 4-6 min | ~7-12 min |

## Critical Patterns

### Preserving Context Between Tools
```bash
# Save Gemini's analysis
gemini "Analyze authentication system" > /tmp/gemini-analysis.md

# Pass to implementation tool
codex exec "Implement based on: $(cat /tmp/gemini-analysis.md)"
# or
claude-code "Implement using this analysis: $(cat /tmp/gemini-analysis.md)"
```

### When Tools Fail
```bash
# Gemini times out or misses context
→ Narrow scope: "Focus only on src/auth/"
→ Be specific: "Only analyze JWT validation"

# Codex produces broken code
→ Switch to Claude Code for better reasoning
→ Ask Gemini for alternative approach
→ Try incremental approach (smaller changes)

# Claude Code gets stuck
→ Switch to Codex for faster iteration
→ Simplify the task
→ Provide more specific guidance
```

### Output Parsing
```bash
# Gemini output extraction
gemini "Analyze and output JSON" | jq '.analysis'

# Codex JSON output
codex exec --json "task" | jq '.code'

# Claude Code - no parsing needed, tool use is automatic
```

### Example: Complex Refactoring

```bash
# 1. Gemini analyzes (massive 1M token context)
gemini "Analyze auth system. Focus: architecture, dependencies, security, refactoring opportunities"

# 2a. Codex implements (fast, 400k context)
codex exec --sandbox workspace-write "Refactor to JWT. Update consumers. Files from Gemini analysis."

# 2b. Claude Code implements (smarter, 200k context, with testing)
claude-code "Refactor to JWT. Use tools to read files, edit, run tests. Verify everything works."

# 3. Factory Droid verifies
droid "Review changes, run tests, confirm implementation"
```

## Choosing Between Codex and Claude Code

**Use Codex CLI when:**
- Straightforward implementation with clear requirements
- Fast code generation is priority
- Cost-sensitive projects (cheaper per token)
- Working in well-structured codebase

**Use Claude Code when:**
- Complex refactoring across many files
- Architectural decisions required
- Need iterative testing and debugging (built-in)
- Complex dependencies to understand
- Permission system desired for safety

**Key Differentiator:** Codex = faster/cheaper for straightforward tasks; Claude Code = smarter for complex architectural work with built-in testing.

| Aspect | Codex CLI | Claude Code | Winner |
|--------|-----------|-------------|--------|
| **Code Generation Speed** | Very Fast | Fast | Codex |
| **Architectural Understanding** | Good | Excellent | Claude |
| **Refactoring** | Good | Excellent | Claude |
| **Tool Use** | Advanced | More Advanced | Claude |
| **Testing Integration** | Manual | Built-in | Claude |
| **Safety** | Sandbox | Permissions | Claude |
| **Simplicity** | Simple | More Features | Codex |

## Why This Combination Works

### Complementary Strengths
| Aspect | Gemini 3 Flash | Codex CLI (GPT-5.2) | Claude Code (3.7 Sonnet) | Winner |
|--------|----------------|---------------------|-------------------------|--------|
| **Speed** | Very fast | Fast | Fast | Gemini |
| **Context Window** | 1M input / 64k output | 400k / 128k output | 200k / 128k output (beta) | Gemini |
| **LSP** | Built-in | Via MCP | Built-in | Gemini/Claude |
| **Multi-modal** | ✅ Native | ❌ Limited | ✅ Yes | Gemini/Claude |
| **Code Gen** | Good | Excellent | Excellent | Codex/Claude |
| **Tool Use** | Limited | Advanced | Very Advanced | Claude |
| **Output Limit** | 64k tokens | 128k tokens | 128k tokens (beta) | Codex/Claude |

### Synergy
- **Gemini** excels at "what" and "why" - understanding the problem space with massive 1M token context
- **Codex/Claude** excel at "how" - generating robust implementation
- Together they cover the full problem-solving lifecycle
- Choose implementation tool based on task complexity and requirements

## Factory Droid's Role

Factory Droid orchestrates the workflow:

1. **Execute Gemini CLI** - Captures comprehensive analysis
2. **Parse Gemini Output** - Extract key insights, file lists, dependencies
3. **Choose Implementation Tool** - Select Codex or Claude Code based on task
4. **Format for Implementation** - Create detailed prompt with context
5. **Execute Implementation CLI** - Get implementation code (Codex or Claude)
6. **Apply Changes** - Use Edit/Write tools with permissions
7. **Verify** - Run tests, validate changes
8. **Iterate** - Loop back to Gemini if issues arise

## Example Prompts for Each Phase

### Phase 1: Gemini (Context & Understanding)
```bash
# Deep codebase exploration
gemini "I need to add caching to API responses. Please:
1. Use glob to find all API route files
2. Use grep to find database query functions
3. Analyze current response patterns
4. Identify where caching would help most
5. Check for existing cache invalidation logic
6. Recommend cache strategy (Redis, in-memory, etc.)
7. List files that would need modification"

# Multi-modal analysis
gemini "Review this architecture diagram and explain:
- Current bottlenecks
- Scalability concerns
- Suggested improvements" architecture.png
```

### Phase 2: Codex (Implementation)
```bash
# Based on Gemini's detailed analysis
codex exec --sandbox workspace-write "Implement Redis caching layer:

Context from Gemini analysis:
- API routes: src/api/users.ts, src/api/products.ts
- Database: src/db/queries.ts
- Current pattern: Direct DB queries on every request

Implementation:
1. Create Redis client wrapper in src/cache/redis.ts
2. Add get/set methods with TTL support
3. Modify API routes to use cache layer
4. Add cache invalidation on data changes
5. Add comprehensive error handling

Follow this exact structure:
[structure details from Gemini]"
```

### Phase 2 Alternative: Claude Code (Implementation)
```bash
# Based on Gemini's detailed analysis
claude-code "Implement Redis caching layer:

Context from Gemini analysis:
- API routes: src/api/users.ts, src/api/products.ts
- Database: src/db/queries.ts
- Current pattern: Direct DB queries on every request

Implementation:
1. Use tools to read the existing API route files
2. Create Redis client wrapper in src/cache/redis.ts
3. Add get/set methods with TTL support
4. Modify API routes to use cache layer
5. Add cache invalidation on data changes
6. Add comprehensive error handling
7. Run tests to verify implementation

Use Gemini's analysis as the guide:
[structure details from Gemini]"
```

## Best Practices

### 1. Clear Handoff Between Phases
```bash
# After Gemini analysis
echo "=== GEMINI ANALYSIS COMPLETE ==="
echo "Copy the key findings above"

# Before Codex implementation  
echo "=== CODEX IMPLEMENTATION ==="
echo "Paste Gemini's analysis below:"
```

### 2. Preserve Gemini's Insights
```bash
# Save Gemini analysis for reference
gemini "Analyze this codebase and save detailed analysis to /tmp/analysis.md"

# Pass analysis to Codex
codex exec "Based on /tmp/analysis.md, implement the refactoring:
$(cat /tmp/analysis.md)"
```

### 3. Leverage Each Tool's Special Features

**Gemini:**
- Use MCP servers for enhanced context (GitHub, Linear, etc.)
- Use LSP for accurate code understanding
- Use multi-modal for UI/UX tasks
- Use `--approval-mode default` for read-only analysis

**Codex:**
- Use `--json` flag for machine-readable output
- Use `--skip-git-repo-check` for one-off directories
- Use `--sandbox workspace-write` for safe edits
- Use `-m` for specific model selection

### 4. Handle Errors Gracefully
```bash
# If Gemini can't understand something
gemini "I'm getting error X when running tests. Help debug:
- Error message: [paste error]
- Test file: tests/test-auth.ts
- Related files: src/auth/*.ts
Use grep and view to investigate."

# If Codex's implementation fails
codex exec "Gemini suggested [plan] but it's failing. Try alternative approach:
- [describe alternative plan]
- Handle edge cases better
- Add more defensive programming"
```

## Common Workflows

### Workflow 1: Large-Scale Refactoring
```bash
# Phase 1: Understanding
gemini "I need to refactor the data layer. Current stack:
- PostgreSQL with TypeORM
- Direct database calls spread across codebase
- No repository pattern
- Mixed synchronous/asynchronous code

Analyze:
1. Current data access patterns
2. Bottlenecks and performance issues
3. Best practices for refactoring
4. Recommended repository pattern
5. Migration strategy"

# Phase 2: Implementation
codex exec "Implement data layer refactoring:
- Add TypeORM repositories
- Create migration scripts
- Update all data access code
- Add connection pooling
- Add transaction support"
```

### Workflow 2: Security Audit & Fix
```bash
# Phase 1: Security Analysis
gemini "Perform comprehensive security audit:
- Check for SQL injection vulnerabilities
- Review authentication/authorization
- Identify exposed secrets
- Check input validation
- Review file access permissions
- Test for common OWASP vulnerabilities"

# Phase 2: Security Fixes
codex exec "Fix identified security issues:
- Parameterize all SQL queries
- Add input sanitization
- Implement proper authentication
- Add file permission checks
- Add rate limiting
- Add security headers"
```

### Workflow 3: Feature from Scratch
```bash
# Phase 1: Requirements Analysis
gemini "I need to add WebSocket support for real-time updates:
- Current stack: Express, Redis
- Purpose: Live notifications
- Requirements: Connection management, reconnection logic

Analyze:
1. Current API structure
2- Existing WebSocket infrastructure
3. Best practices for scaling
4. Required libraries
5. Testing strategy"

# Phase 2: Implementation  
codex exec "Implement WebSocket feature:
- Add Socket.IO server
- Create connection manager
- Add event handlers
- Implement reconnection logic
- Add comprehensive error handling
- Write unit tests"
```

## Tips for Maximum Effectiveness

### 1. Give Gemini Enough Context
```bash
# GOOD: Comprehensive context
gemini "Analyze the user authentication flow:
- Files: src/auth/*.ts
- Focus: JWT validation, session management
- Goal: Identify security issues and improvement opportunities"

# BAD: Vague prompt
gemini "Look at auth files"  # Too generic
```

### 2. Use Gemini's Output Format Features
```bash
# Request structured output
gemini "Provide analysis in this format:
## Current State
[Brief description]

## Issues Found
- Issue 1: [description]
- Issue 2: [description]

## Recommendations
- Priority 1: [high priority fix]
- Priority 2: [medium priority fix]"
```

### 3. Capture Gemini's Full Analysis
```bash
# Save analysis for Codex
gemini "Analyze and save detailed analysis to /tmp/context.md"
codex exec "Implement based on /tmp/context.md"
```

### 4. Iterate When Needed
```bash
# If Codex's implementation has issues
gemini "The implementation had these problems:
- [list Codex errors]

Help debug and provide alternative solutions."

# Try Codex again with refined approach
codex exec "Retry with these corrections: [gemini's fixes]"
```

## Error Handling

### Common Issues and Solutions

**Issue**: Gemini can't find relevant files
```bash
# Solution: Help Gemini explore
gemini "Use glob to find all TypeScript files in src/
Use grep to search for patterns related to [topic]"

# Or specify search scope
gemini "Focus your analysis on:
- src/auth/
- src/api/
- src/middleware/"
```

**Issue**: Codex loses context from Gemini
```bash
# Solution: Preserve the analysis
# Save Gemini's output and pass to Codex
gemini "Analyze and output analysis in markdown format:" > /tmp/plan.md
codex exec "Implement according to plan.md:"
cat /tmp/plan.md
```

**Issue**: Implementation fails
```bash
# Solution: Ask both tools for debugging
gemini "Codex failed with: [error]. Help diagnose and suggest fixes."

codex exec "Try alternative implementation approach:
- [Gemini's alternative suggestion]
- More defensive programming
- Better error handling"
```

## Performance Considerations

- **Gemini 3 Flash**: Very fast analysis (~10-30 seconds for large codebases)
- **Codex CLI**: Medium speed (~30-60 seconds for implementation)
- **Total time**: Typically 1-2 minutes for complete task
- **Faster than**: Using either tool alone for complex tasks

## Comparison: Hybrid vs Single Tool

| Scenario | Single Tool | Hybrid Approach |
|----------|-----------|----------------|
| Simple bug fix | Codex/Claude alone (faster) | Hybrid (overkill) |
| Complex refactoring | Claude Code (good) | **Hybrid** (better context) |
| Unknown codebase | Claude Code (good) | **Hybrid** (safer) |
| Multi-modal tasks | Claude Code (can see images) | **Hybrid** (Gemini faster) |
| Well-understood code | Codex/Claude (fastest) | Either works |
| Architectural changes | Claude Code (excellent) | **Hybrid + Claude** (best) |

### Tool Selection Guide

```
┌─────────────────────────────────────────────────────────┐
│                    TASK COMPLEXITY                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Low ──────► Use Codex or Claude Code directly          │
│   │                                                      │
│  Medium ───► Use Gemini + Codex                         │
│   │                                                      │
│  High ─────► Use Gemini + Claude Code                   │
│   │                                                      │
│  Very High ─► Use Gemini + Claude Code + refinement     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Requirements

- **Gemini CLI** - Installed and configured (Required)
- **Codex CLI** OR **Claude Code** - At least one installed (Both recommended)
- **Factory Droid** - For orchestration and tool access
- **Gemini 3 Flash** - Available as model option
- **GPT-5.2-Codex** - Available as Codex model (if using Codex)
- **Claude 3.7 Sonnet** - Available as Claude Code model (if using Claude Code)

### Configuration Checklist

```bash
# Verify Gemini CLI
gemini --version

# Verify Gemini 3 Flash availability
gemini --model list | grep -i "flash"

# Verify Codex CLI (if using)
codex --version

# Verify Claude Code (if using)
claude-code --version

# Verify Factory Droid
droid --version

# Test the hybrid workflow with Codex
droid "use gemini-codex-hybrid with codex to analyze and implement [task]"

# Test the hybrid workflow with Claude Code
droid "use gemini-codex-hybrid with claude to analyze and implement [task]"
```

## Advanced: Three-Phase Workflow

For especially difficult problems, add a refinement loop:

```
Phase 1: Gemini Analysis (deep dive)
    ↓
Phase 2: Codex Implementation (initial attempt)
    ↓
Phase 3: Gemini Refinement (if needed)
    ↓
Phase 4: Codex Final Implementation
    ↓
Phase 5: Factory Droid Verification
```

### Example Three-Phase Workflow

```bash
# Phase 1: Deep Analysis
gemini "Perform comprehensive analysis of the payment processing system:
- Architecture patterns
- Error handling approaches
- Testing coverage
- Security vulnerabilities
- Performance bottlenecks
- Compliance issues (PCI-DSS, etc.)
Output: Detailed technical report"

# Phase 2: Initial Implementation
codex exec "Implement payment processing improvements based on Gemini's report:
[specific changes recommended by Gemini]"

# Phase 3: Refinement (if needed)
gemini "Review the implementation and suggest refinements:
- [paste codex output]
- Identify any remaining issues
- Suggest optimizations"

# Phase 4: Final Implementation
codex exec "Apply the refinements:
[specific changes from Gemini's review]"

# Phase 5: Verification (Factory Droid)
# Run tests, check for issues
bash "npm test"
glob "**/*test*.ts"
```

## Troubleshooting

### Gemini Not Finding Files
- **Problem**: Gemini misses important context
- **Fix**: Be more specific about file locations
- **Fix**: Use glob/grep before asking Gemini to analyze

### Codex Loses Context
- **Problem**: Codex doesn't see Gemini's analysis
- **Fix**: Save Gemini output to file, pass to Codex
- **Fix**: Include key parts of Gemini's output in Codex prompt

### Implementation Fails
- **Problem**: Code doesn't work as expected
- **Fix**: Ask Gemini to debug and suggest alternatives
- **Fix**: Try incremental approach with smaller changes

### Performance Issues
- **Problem**: Taking too long
- **Fix**: Narrow scope to specific files/directories
- **Fix**: Use more targeted prompts

---

**This hybrid approach combines the best of all worlds: Gemini's rapid understanding with your choice of Codex's fast code generation or Claude Code's advanced agentic capabilities!**

### Quick Decision Matrix

**Choose Codex for implementation when:**
- Straightforward code generation tasks
- Need fast iteration
- Simple file structure
- Well-defined requirements

**Choose Claude Code for implementation when:**
- Complex architectural changes
- Multi-file refactoring
- Need iterative testing and debugging
- Unknown or complex dependencies
- Built-in permission system desired

**Or use both!** Start with one, switch to the other if the first approach doesn't work well.