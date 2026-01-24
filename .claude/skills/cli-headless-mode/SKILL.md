---
name: CLI Headless Mode
description: This skill should be used when the user asks to "wrap a CLI tool", "use gemini headless", "call claude -p", "pipe to ollama", "run codex non-interactively", "use crush CLI", "orchestrate multiple LLM CLIs", "extract structured output from CLI", or needs to invoke AI CLI tools (Gemini, Claude, Ollama, Codex, Crush, Droid) programmatically for agentic workflows.
version: 1.0.0
---

# CLI Headless Mode

Wrap AI CLI tools for programmatic, non-interactive execution in agentic applications.

## Overview

CLI tools like Gemini, Claude, Ollama, Codex, Crush, and Droid support headless execution modes that bypass interactive prompts. This skill provides patterns for invoking these tools programmatically with structured input/output handling.

## Core Concept: Print Mode (-p)

Most AI CLIs support a "print mode" flag that:
- Skips interactive UI/spinners
- Outputs directly to stdout
- Enables piping and redirection
- Returns proper exit codes

```bash
# Interactive (blocks for user input)
gemini "What is 2+2?"

# Headless (immediate output)
gemini -p "What is 2+2?"
```

## Input/Output State Machine

### Input Methods
| Method | Syntax | Use Case |
|--------|--------|----------|
| Argument | `tool -p "prompt"` | Simple queries |
| Stdin Pipe | `echo "prompt" \| tool -p` | Dynamic input |
| Stdin Redirect | `tool -p < file.txt` | File-based prompts |
| Here-doc | `tool -p <<EOF...EOF` | Multi-line prompts |
| Stream JSON | `cat data.jsonl \| tool -p` | Batch processing |

### Output Formats
| Format | Flag | Use Case |
|--------|------|----------|
| Text | (default) | Human-readable |
| JSON | `--output-format json` | Structured data |
| Stream JSON | `--output-format stream-json` | Real-time processing |

## Tool Quick Reference

### Gemini CLI
```bash
# Basic headless query
gemini -p "Explain recursion"

# JSON output with schema
gemini -p --output-format json --schema '{"type":"object","properties":{"answer":{"type":"string"}}}' "What is 2+2?"

# Streaming
gemini -p --output-format stream-json "Tell me a story"

# With system instruction
gemini -p --system "You are a helpful assistant" "Hello"
```

### Claude CLI
```bash
# Print mode
claude -p "Explain async/await"

# With output format
claude -p --output-format json "List 3 colors"

# Conversation continuation
claude -p --continue "Follow up question"
```

### Ollama
```bash
# Direct run
ollama run llama2 "What is Python?" --format json

# API mode (more control)
curl http://localhost:11434/api/generate -d '{"model":"llama2","prompt":"Hello"}'
```

### Codex CLI
```bash
# Non-interactive execution
codex --approval-mode full-auto "Create a hello world script"

# Quiet mode
codex -q "Fix this bug"
```

### Crush CLI
```bash
# Headless query
crush -p "Analyze this code"

# With context
crush -p --context file.py "Explain this function"
```

### Droid
```bash
# Non-interactive
droid --non-interactive "Deploy to staging"
```

## Execution Patterns

### Pattern 1: Simple Query
```bash
result=$(gemini -p "What is 2+2?")
echo "$result"
```

### Pattern 2: Pipe Chain
```bash
cat code.py | gemini -p "Review this code" | tee review.md
```

### Pattern 3: JSON Extraction
```bash
gemini -p --output-format json "List 3 programming languages" | jq '.languages[]'
```

### Pattern 4: Error Handling
```bash
if output=$(gemini -p "Query" 2>&1); then
    echo "Success: $output"
else
    echo "Error: $output" >&2
    exit 1
fi
```

### Pattern 5: Streaming Handler
```typescript
import { spawn } from 'child_process';

const proc = spawn('gemini', ['-p', '--output-format', 'stream-json', 'Tell a story']);
proc.stdout.on('data', (chunk) => {
    const lines = chunk.toString().split('\n');
    for (const line of lines) {
        if (line.trim()) {
            const data = JSON.parse(line);
            process.stdout.write(data.text || '');
        }
    }
});
```

## Tool Adapter Interface

```typescript
interface CLIAdapter {
    name: string;
    headlessFlag: string;
    jsonFlag?: string;
    streamFlag?: string;
    buildCommand(prompt: string, options?: AdapterOptions): string[];
}

const adapters: Record<string, CLIAdapter> = {
    gemini: { name: 'gemini', headlessFlag: '-p', jsonFlag: '--output-format json', streamFlag: '--output-format stream-json' },
    claude: { name: 'claude', headlessFlag: '-p', jsonFlag: '--output-format json', streamFlag: '--output-format stream-json' },
    ollama: { name: 'ollama', headlessFlag: '', jsonFlag: '--format json' },
    codex:  { name: 'codex',  headlessFlag: '--approval-mode full-auto', jsonFlag: '' },
    crush:  { name: 'crush',  headlessFlag: '-p', jsonFlag: '--output-format json' },
    droid:  { name: 'droid',  headlessFlag: '--non-interactive', jsonFlag: '' }
};
```

## Additional Resources

### Reference Files
- **`references/tool-adapters.md`** - Complete TypeScript adapters for all tools
- **`references/python-adapters.md`** - Complete Python adapters for all tools
- **`references/gemini-cli.md`** - Detailed Gemini CLI patterns
- **`references/moldable-template.md`** - Template for adding new tools

### Scripts
- **`scripts/wrap-query.sh`** - Universal query wrapper
- **`scripts/wrap-pipe.sh`** - Pipe-based wrapper
- **`scripts/stream-handler.ts`** - Node.js streaming handler

### Examples
- **`examples/ci-pipeline.sh`** - CI/CD integration example
- **`examples/data-extraction.sh`** - Batch data extraction
- **`examples/gemini-chatbot.ts`** - TypeScript chatbot example
