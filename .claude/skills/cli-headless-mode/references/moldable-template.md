# Moldable Template for New CLI Tools

Use this template to add support for new CLI tools to the headless mode system.

## Step 1: Identify Tool Characteristics

Fill out this checklist for the new tool:

```markdown
Tool Name: _______________
Binary/Command: _______________

Headless Execution:
- [ ] Supports non-interactive mode
- [ ] Flag for headless: _______________
- [ ] Outputs to stdout cleanly

Output Formats:
- [ ] Plain text (default)
- [ ] JSON output: flag = _______________
- [ ] Streaming: flag = _______________
- [ ] Schema validation: flag = _______________

Input Methods:
- [ ] Argument input
- [ ] Stdin pipe
- [ ] File redirect
- [ ] Here-doc

Additional Flags:
- System prompt: _______________
- Model selection: _______________
- Temperature: _______________
- Max tokens: _______________
```

## Step 2: Create TypeScript Adapter

```typescript
const newToolAdapter: CLIAdapter = {
    name: 'newtool',
    headlessFlag: '--headless',  // Replace with actual flag
    jsonFlag: '--json',          // Replace or remove
    streamFlag: '--stream',      // Replace or remove
    schemaFlag: '--schema',      // Replace or remove
    systemFlag: '--system',      // Replace or remove
    
    buildCommand(prompt: string, options: AdapterOptions = {}): string[] {
        const args = ['newtool'];
        
        // Add headless flag
        if (this.headlessFlag) {
            args.push(...this.headlessFlag.split(' '));
        }
        
        // Add optional flags
        if (options.systemPrompt && this.systemFlag) {
            args.push(this.systemFlag, options.systemPrompt);
        }
        if (options.json && this.jsonFlag) {
            args.push(...this.jsonFlag.split(' '));
        }
        if (options.stream && this.streamFlag) {
            args.push(...this.streamFlag.split(' '));
        }
        if (options.schema && this.schemaFlag) {
            args.push(this.schemaFlag, JSON.stringify(options.schema));
        }
        
        args.push(prompt);
        return args;
    },
    
    parseOutput(output: string, options: AdapterOptions = {}): any {
        const trimmed = output.trim();
        if (options.json || options.schema) {
            return JSON.parse(trimmed);
        }
        return trimmed;
    },
    
    handleStream(chunk: Buffer): { text?: string; done?: boolean } {
        const line = chunk.toString().trim();
        if (!line) return {};
        
        // Adapt to tool's streaming format
        try {
            const data = JSON.parse(line);
            return { 
                text: data.text || data.content || data.response,
                done: data.done || data.finished || false
            };
        } catch {
            return { text: line };
        }
    }
};
```

## Step 3: Create Shell Wrapper

```bash
#!/bin/bash
# wrap-newtool.sh

TOOL="newtool"
HEADLESS_FLAG="--headless"
JSON_FLAG="--json"

usage() {
    echo "Usage: $0 [-j|--json] [-s|--stream] <prompt>"
    exit 1
}

JSON_MODE=false
STREAM_MODE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -j|--json) JSON_MODE=true; shift ;;
        -s|--stream) STREAM_MODE=true; shift ;;
        -*) usage ;;
        *) break ;;
    esac
done

PROMPT="$*"
[[ -z "$PROMPT" ]] && usage

CMD=("$TOOL" $HEADLESS_FLAG)
$JSON_MODE && CMD+=($JSON_FLAG)
$STREAM_MODE && CMD+=("--stream")
CMD+=("$PROMPT")

exec "${CMD[@]}"
```

## Step 4: Test the Integration

```bash
# Test 1: Basic query
./wrap-newtool.sh "Hello world"

# Test 2: JSON output
./wrap-newtool.sh --json "List 3 items"

# Test 3: Pipe input
echo "Analyze this" | ./wrap-newtool.sh

# Test 4: Error handling
./wrap-newtool.sh "Invalid query" || echo "Handled error"
```

## Step 5: Register in Adapter Map

```typescript
// Add to adapters registry
adapters['newtool'] = newToolAdapter;
```
