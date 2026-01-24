# Gemini CLI Detailed Reference

## Installation & Setup

```bash
# Install via npm (official Google package)
npm install -g @google/gemini-cli

# Or run without installing (npx)
npx @google/gemini-cli
```

## Authentication

```bash
# Interactive login
gemini auth login

# Service account (headless)
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

## Headless Mode (-p flag)

The `-p` (print) flag enables non-interactive execution:

```bash
# Standard interactive mode (shows spinner, waits for input)
gemini "Hello"

# Print mode (immediate output, no UI)
gemini -p "Hello"
```

## Output Formats

### Plain Text (default)
```bash
gemini -p "What is 2+2?"
# Output: 4
```

### JSON Output
```bash
gemini -p --output-format json "List 3 colors"
# Output: {"colors":["red","blue","green"]}
```

### Structured JSON with Schema
```bash
gemini -p --output-format json --schema '{
  "type": "object",
  "properties": {
    "answer": {"type": "number"},
    "explanation": {"type": "string"}
  },
  "required": ["answer"]
}' "What is 2+2?"
# Output: {"answer":4,"explanation":"Basic addition"}
```

### Streaming JSON
```bash
gemini -p --output-format stream-json "Tell me a story"
# Output (line by line):
# {"text":"Once ","done":false}
# {"text":"upon ","done":false}
# {"text":"a time...","done":false}
# {"text":"","done":true}
```

## Input Methods

### Argument Input
```bash
gemini -p "Simple prompt here"
```

### Stdin Pipe
```bash
echo "Analyze this" | gemini -p
cat document.txt | gemini -p "Summarize:"
```

### Stdin Redirect
```bash
gemini -p < prompt.txt
gemini -p "Context:" < data.json
```

### Here-doc
```bash
gemini -p <<EOF
Multi-line prompt
with several lines
of context
EOF
```

## Advanced Options

### System Instructions
```bash
gemini -p --system "You are a helpful coding assistant" "Write hello world in Python"
```

### Model Selection
```bash
gemini -p --model gemini-pro "Complex query"
gemini -p --model gemini-pro-vision "Describe this image" < image.png
```

### Temperature Control
```bash
gemini -p --temperature 0.1 "Precise factual query"
gemini -p --temperature 0.9 "Creative writing prompt"
```

### Token Limits
```bash
gemini -p --max-tokens 100 "Brief response please"
```

## Error Handling

```bash
# Check exit code
if gemini -p "Query" > output.txt 2>&1; then
    cat output.txt
else
    echo "Error occurred" >&2
    cat output.txt >&2
    exit 1
fi
```

## Common Patterns

### Code Review Pipeline
```bash
git diff HEAD~1 | gemini -p "Review these changes for bugs and improvements"
```

### Document Summarization
```bash
cat report.pdf | gemini -p --output-format json --schema '{"summary":"string","key_points":"array"}' "Summarize"
```

### Batch Processing
```bash
for file in *.py; do
    echo "=== $file ===" 
    cat "$file" | gemini -p "Review this Python code"
done
```
