#!/usr/bin/env npx ts-node
/**
 * stream-handler.ts - Node.js streaming handler for CLI tools
 * Handles newline-delimited JSON streams from any supported CLI
 */

import { spawn, ChildProcess } from 'child_process';
import { createInterface } from 'readline';

interface StreamChunk {
    text?: string;
    done?: boolean;
    error?: string;
}

interface CLIStreamOptions {
    tool: 'gemini' | 'claude' | 'ollama' | 'crush';
    prompt: string;
    onChunk: (chunk: StreamChunk) => void;
    onComplete: (fullText: string) => void;
    onError: (error: Error) => void;
}

const toolConfigs: Record<string, { cmd: string; args: string[] }> = {
    gemini: { cmd: 'gemini', args: ['-p', '--output-format', 'stream-json'] },
    claude: { cmd: 'claude', args: ['-p', '--output-format', 'stream-json'] },
    ollama: { cmd: 'ollama', args: ['run', 'llama2'] },
    crush:  { cmd: 'crush',  args: ['-p'] }
};

export function streamCLI(options: CLIStreamOptions): ChildProcess {
    const config = toolConfigs[options.tool];
    if (!config) throw new Error(`Unknown tool: ${options.tool}`);

    const proc = spawn(config.cmd, [...config.args, options.prompt]);
    let fullText = '';

    const rl = createInterface({ input: proc.stdout });

    rl.on('line', (line: string) => {
        if (!line.trim()) return;
        
        try {
            const data = JSON.parse(line);
            const chunk: StreamChunk = {
                text: data.text || data.content || data.response || '',
                done: data.done || data.finished || false
            };
            
            fullText += chunk.text || '';
            options.onChunk(chunk);
            
            if (chunk.done) {
                options.onComplete(fullText);
            }
        } catch {
            // Non-JSON line, treat as plain text
            fullText += line;
            options.onChunk({ text: line });
        }
    });

    proc.stderr.on('data', (data: Buffer) => {
        options.onError(new Error(data.toString()));
    });

    proc.on('close', (code: number) => {
        if (code !== 0) {
            options.onError(new Error(`Process exited with code ${code}`));
        } else {
            options.onComplete(fullText);
        }
    });

    return proc;
}

// CLI usage
if (require.main === module) {
    const [,, tool, ...promptParts] = process.argv;
    const prompt = promptParts.join(' ');

    if (!tool || !prompt) {
        console.error('Usage: stream-handler.ts <tool> <prompt>');
        process.exit(1);
    }

    streamCLI({
        tool: tool as CLIStreamOptions['tool'],
        prompt,
        onChunk: (chunk) => process.stdout.write(chunk.text || ''),
        onComplete: () => console.log('\n[Done]'),
        onError: (err) => console.error('\n[Error]', err.message)
    });
}
