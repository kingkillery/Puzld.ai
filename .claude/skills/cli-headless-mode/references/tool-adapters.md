# CLI Tool Adapters

Complete TypeScript adapters for wrapping AI CLI tools in agentic applications.

## Adapter Interface

```typescript
interface AdapterOptions {
    json?: boolean;
    stream?: boolean;
    schema?: object;
    systemPrompt?: string;
    timeout?: number;
}

interface CLIAdapter {
    name: string;
    headlessFlag: string;
    jsonFlag?: string;
    streamFlag?: string;
    schemaFlag?: string;
    systemFlag?: string;
    
    buildCommand(prompt: string, options?: AdapterOptions): string[];
    parseOutput(output: string, options?: AdapterOptions): any;
    handleStream(chunk: Buffer): { text?: string; done?: boolean };
}
```

## Gemini Adapter

```typescript
const geminiAdapter: CLIAdapter = {
    name: 'gemini',
    headlessFlag: '-p',
    jsonFlag: '--output-format json',
    streamFlag: '--output-format stream-json',
    schemaFlag: '--schema',
    systemFlag: '--system',
    
    buildCommand(prompt: string, options: AdapterOptions = {}): string[] {
        const args = ['gemini', '-p'];
        if (options.systemPrompt) args.push('--system', options.systemPrompt);
        if (options.json) args.push('--output-format', 'json');
        if (options.stream) args.push('--output-format', 'stream-json');
        if (options.schema) args.push('--schema', JSON.stringify(options.schema));
        args.push(prompt);
        return args;
    },
    
    parseOutput(output: string, options: AdapterOptions = {}): any {
        if (options.json || options.schema) {
            return JSON.parse(output.trim());
        }
        return output.trim();
    },
    
    handleStream(chunk: Buffer): { text?: string; done?: boolean } {
        const line = chunk.toString().trim();
        if (!line) return {};
        try {
            const data = JSON.parse(line);
            return { text: data.text, done: data.done };
        } catch {
            return { text: line };
        }
    }
};
```

## Claude Adapter

```typescript
const claudeAdapter: CLIAdapter = {
    name: 'claude',
    headlessFlag: '-p',
    jsonFlag: '--output-format json',
    streamFlag: '--stream',
    
    buildCommand(prompt: string, options: AdapterOptions = {}): string[] {
        const args = ['claude', '-p'];
        if (options.json) args.push('--output-format', 'json');
        if (options.stream) args.push('--stream');
        args.push(prompt);
        return args;
    },
    
    parseOutput(output: string, options: AdapterOptions = {}): any {
        if (options.json) {
            return JSON.parse(output.trim());
        }
        return output.trim();
    },
    
    handleStream(chunk: Buffer): { text?: string; done?: boolean } {
        return { text: chunk.toString() };
    }
};
```

## Ollama Adapter

```typescript
const ollamaAdapter: CLIAdapter = {
    name: 'ollama',
    headlessFlag: '',
    jsonFlag: '--format json',
    
    buildCommand(prompt: string, options: AdapterOptions = {}): string[] {
        const args = ['ollama', 'run', 'llama2'];
        if (options.json) args.push('--format', 'json');
        args.push(prompt);
        return args;
    },
    
    parseOutput(output: string, options: AdapterOptions = {}): any {
        if (options.json) {
            return JSON.parse(output.trim());
        }
        return output.trim();
    },
    
    handleStream(chunk: Buffer): { text?: string; done?: boolean } {
        const line = chunk.toString().trim();
        if (!line) return {};
        try {
            const data = JSON.parse(line);
            return { text: data.response, done: data.done };
        } catch {
            return { text: line };
        }
    }
};
```


## Codex Adapter

```typescript
const codexAdapter: CLIAdapter = {
    name: 'codex',
    headlessFlag: '--approval-mode full-auto',
    
    buildCommand(prompt: string, options: AdapterOptions = {}): string[] {
        const args = ['codex', '--approval-mode', 'full-auto'];
        if (options.json) args.push('-q'); // quiet mode
        args.push(prompt);
        return args;
    },
    
    parseOutput(output: string): any {
        return output.trim();
    },
    
    handleStream(chunk: Buffer): { text?: string; done?: boolean } {
        return { text: chunk.toString() };
    }
};
```

## Crush Adapter

```typescript
const crushAdapter: CLIAdapter = {
    name: 'crush',
    headlessFlag: '-p',
    jsonFlag: '--output-format json',
    
    buildCommand(prompt: string, options: AdapterOptions = {}): string[] {
        const args = ['crush', '-p'];
        if (options.json) args.push('--json');
        args.push(prompt);
        return args;
    },
    
    parseOutput(output: string, options: AdapterOptions = {}): any {
        if (options.json) {
            return JSON.parse(output.trim());
        }
        return output.trim();
    },
    
    handleStream(chunk: Buffer): { text?: string; done?: boolean } {
        return { text: chunk.toString() };
    }
};
```

## Droid Adapter

```typescript
const droidAdapter: CLIAdapter = {
    name: 'droid',
    headlessFlag: '--non-interactive',
    
    buildCommand(prompt: string, options: AdapterOptions = {}): string[] {
        const args = ['droid', '--non-interactive'];
        args.push(prompt);
        return args;
    },
    
    parseOutput(output: string): any {
        return output.trim();
    },
    
    handleStream(chunk: Buffer): { text?: string; done?: boolean } {
        return { text: chunk.toString() };
    }
};
```

## Adapter Registry

```typescript
const adapters: Record<string, CLIAdapter> = {
    gemini: geminiAdapter,
    claude: claudeAdapter,
    ollama: ollamaAdapter,
    codex: codexAdapter,
    crush: crushAdapter,
    droid: droidAdapter
};

export function getAdapter(tool: string): CLIAdapter {
    const adapter = adapters[tool.toLowerCase()];
    if (!adapter) {
        throw new Error(`Unknown tool: ${tool}. Available: ${Object.keys(adapters).join(', ')}`);
    }
    return adapter;
}
```

## Tool Comparison Matrix

| Tool | Headless Flag | JSON Output | Streaming | Schema | System Prompt |
|------|---------------|-------------|-----------|--------|---------------|
| Gemini | `-p` | `--output-format json` | `--output-format stream-json` | `--schema` | `--system` |
| Claude | `-p` | `--output-format json` | `--output-format stream-json` | - | - |
| Ollama | (none) | `--format json` | (default) | - | - |
| Codex | `--approval-mode full-auto` | - | - | - | - |
| Crush | `-p` | `--output-format json` | - | - | `--context` |
| Droid | `--non-interactive` | - | - | - | - |
