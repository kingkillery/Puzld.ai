/**
 * Summary Generator - AI-powered action summarization using Gemini Flash Lite.
 * Generates user-friendly descriptions of agent actions during task execution.
 * 
 * Uses Gemini 2.0 Flash Lite via REST API for fast, low-cost summaries with robust
 * fallback to regex-based pattern extraction when API is unavailable.
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent';

const SUMMARY_PROMPT = `You are a helpful assistant that explains technical operations to users.
Given the following agent action, provide a brief, friendly 1-line summary (max 80 chars).
Focus on WHAT is happening in simple terms, not the technical details.
Start with an appropriate emoji.

Examples:
- Command: ["grep", "-rn", "TuiColors", "app/src"] → "🔍 Searching for TuiColors usage..."
- Status: "queued" → "📋 Task queued, waiting..."
- Status: "running" → "⚡ Working on your request..."

Agent action: {action}

Summary (1 line, with emoji):`;

export class SummaryGenerator {
    private apiKey: string | undefined;

    constructor() {
        this.apiKey = process.env.GOOGLE_API_KEY;
        if (!this.apiKey) {
            console.warn('⚠️ GOOGLE_API_KEY not set. Summaries will use fallback mode.');
        }
    }

    /**
     * Generate a summary for a shell command
     */
    async summarizeCommand(command: string[]): Promise<string> {
        if (!command || command.length === 0) {
            return '⏳ Waiting...';
        }
        const cmdStr = command.join(' ');
        return this.generateSummary(`Command: ${cmdStr}`);
    }

    /**
     * Generate a summary for a status message
     */
    async summarizeStatus(status: string): Promise<string> {
        if (!status) return '';
        return this.generateSummary(`Status: ${status}`);
    }

    /**
     * Generate a summary for a generic action
     */
    async summarizeAction(actionType: string, details: string): Promise<string> {
        return this.generateSummary(`${actionType}: ${details}`);
    }

    private async generateSummary(action: string): Promise<string> {
        // Try Gemini REST API if key is available
        if (this.apiKey) {
            try {
                const prompt = SUMMARY_PROMPT.replace('{action}', action);
                const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            maxOutputTokens: 100,
                            temperature: 0.3,
                        },
                    }),
                });

                if (response.ok) {
                    const data = await response.json() as {
                        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
                    };
                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) {
                        return text.trim().slice(0, 100);
                    }
                }
            } catch {
                // Fall through to fallback
            }
        }

        // Fallback: Simple pattern-based summarization
        return this.fallbackSummary(action);
    }

    private fallbackSummary(action: string): string {
        const actionLower = action.toLowerCase();

        // Extract useful context from the action
        const pathMatch = action.match(/[\w.-]+(?:[/\\][\w.-]+)*\.(?:kt|py|js|ts|java|xml|json|md|txt|yaml|yml|gradle)/);
        const patternMatch = action.match(/["']([^"']+)["']|(\b[A-Z][a-z]+[A-Z]\w+\b)/);

        let fileHint = '';
        if (pathMatch) {
            const parts = pathMatch[0].split(/[/\\]/);
            fileHint = parts[parts.length - 1];
        }

        let patternHint = '';
        if (patternMatch) {
            patternHint = patternMatch[1] || patternMatch[2] || '';
        }

        // Build contextual summaries based on command/status type
        if (actionLower.includes('grep')) {
            if (patternHint && fileHint) {
                return `🔍 Finding '${patternHint}' in ${fileHint}...`;
            } else if (patternHint) {
                return `🔍 Searching for '${patternHint}'...`;
            }
            return '🔍 Searching codebase...';
        }

        if (actionLower.includes('cat') || actionLower.includes('read')) {
            return fileHint ? `📄 Reading ${fileHint}...` : '📄 Examining file...';
        }

        if (actionLower.includes('sed') || actionLower.includes('edit')) {
            return fileHint ? `✏️ Editing ${fileHint}...` : '✏️ Making changes...';
        }

        if (actionLower.includes('docker')) {
            return '🐳 Running in Docker...';
        }

        if (actionLower.includes('git')) {
            return '📦 Managing Git repository...';
        }

        if (actionLower.includes('queued')) {
            return '📋 Task queued, waiting...';
        }

        if (actionLower.includes('running')) {
            return '⚡ Working on your request...';
        }

        if (actionLower.includes('processing')) {
            return '⚙️ Processing...';
        }

        // Last resort
        if (fileHint) {
            return `⚙️ Working on ${fileHint}...`;
        }
        return '⚙️ Processing...';
    }
}

// Singleton instance
let generatorInstance: SummaryGenerator | null = null;

export function getSummaryGenerator(): SummaryGenerator {
    if (!generatorInstance) {
        generatorInstance = new SummaryGenerator();
    }
    return generatorInstance;
}
