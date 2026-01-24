#!/usr/bin/env npx ts-node
/**
 * gemini-chatbot.ts - Example TypeScript chatbot using Gemini CLI
 * Demonstrates streaming responses and conversation management
 */

import { spawn } from 'child_process';
import * as readline from 'readline';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

class GeminiChatbot {
    private history: Message[] = [];
    private systemPrompt: string;

    constructor(systemPrompt: string = 'You are a helpful assistant.') {
        this.systemPrompt = systemPrompt;
    }

    async chat(userMessage: string): Promise<string> {
        this.history.push({ role: 'user', content: userMessage });

        // Build context from history
        const context = this.history
            .map(m => `${m.role}: ${m.content}`)
            .join('\n');

        // Call gemini in headless mode
        const response = await this.callGemini(context);
        
        this.history.push({ role: 'assistant', content: response });
        return response;
    }

    private callGemini(prompt: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const proc = spawn('gemini', [
                '-p',
                '--system', this.systemPrompt,
                prompt
            ]);

            let output = '';
            let error = '';

            proc.stdout.on('data', (data) => {
                output += data.toString();
            });

            proc.stderr.on('data', (data) => {
                error += data.toString();
            });

            proc.on('close', (code) => {
                if (code === 0) {
                    resolve(output.trim());
                } else {
                    reject(new Error(error || `Exit code: ${code}`));
                }
            });
        });
    }

    streamChat(userMessage: string, onChunk: (text: string) => void): Promise<string> {
        return new Promise((resolve, reject) => {
            this.history.push({ role: 'user', content: userMessage });

            const context = this.history
                .map(m => `${m.role}: ${m.content}`)
                .join('\n');

            const proc = spawn('gemini', [
                '-p',
                '--output-format', 'stream-json',
                '--system', this.systemPrompt,
                context
            ]);

            let fullResponse = '';

            proc.stdout.on('data', (data) => {
                const lines = data.toString().split('\n');
                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const chunk = JSON.parse(line);
                        if (chunk.text) {
                            fullResponse += chunk.text;
                            onChunk(chunk.text);
                        }
                    } catch {
                        // Non-JSON, append as-is
                        fullResponse += line;
                        onChunk(line);
                    }
                }
            });

            proc.on('close', (code) => {
                if (code === 0) {
                    this.history.push({ role: 'assistant', content: fullResponse });
                    resolve(fullResponse);
                } else {
                    reject(new Error(`Exit code: ${code}`));
                }
            });
        });
    }
}

// Interactive CLI
async function main() {
    const bot = new GeminiChatbot('You are a helpful coding assistant.');
    
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('Gemini Chatbot (type "exit" to quit)\n');

    const prompt = () => {
        rl.question('You: ', async (input) => {
            if (input.toLowerCase() === 'exit') {
                rl.close();
                return;
            }

            process.stdout.write('Bot: ');
            await bot.streamChat(input, (text) => process.stdout.write(text));
            console.log('\n');
            
            prompt();
        });
    };

    prompt();
}

if (require.main === module) {
    main().catch(console.error);
}

export { GeminiChatbot };
