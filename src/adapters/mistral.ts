import { type Adapter, type ModelResponse, type RunOptions } from '../lib/types';
import { getConfig } from '../lib/config';
import { isBinaryAvailable, executeCli, wrapCliResult, wrapError } from './utils';

export const mistralAdapter: Adapter = {
  name: 'mistral',

  async isAvailable(): Promise<boolean> {
    const config = getConfig();
    if (!config.adapters.mistral?.enabled) return false;
    return isBinaryAvailable(config.adapters.mistral.path || 'vibe');
  },

  async run(prompt: string, options?: RunOptions): Promise<ModelResponse> {
    const config = getConfig();
    const startTime = Date.now();
    const model = options?.model ?? config.adapters.mistral?.model;
    const disableTools = options?.disableTools ?? true;

    try {
      const args = ['-p', prompt, '--output', 'streaming'];

      if (disableTools) {
        args.push('--enabled-tools', 'none');
      } else {
        args.push('--auto-approve');
      }

      const result = await executeCli('mistral', config.adapters.mistral?.path || 'vibe', args, {
        ...options,
        timeout: config.timeout
      });

      if (result.stderr && !result.stdout) {
        return wrapCliResult(result);
      }

      // Parse streaming JSON response (newline-delimited JSON)
      try {
        const lines = result.stdout.trim().split('\n');
        let content = '';
        let inputTokens = 0;
        let outputTokens = 0;

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const msg = JSON.parse(line);
            if (msg.role === 'assistant' && msg.content) {
              content = msg.content;
            }
            if (msg.usage) {
              inputTokens += msg.usage.prompt_tokens || msg.usage.input_tokens || 0;
              outputTokens += msg.usage.completion_tokens || msg.usage.output_tokens || 0;
            }
          } catch { /* Skip malformed lines */ }
        }

        return wrapCliResult(result, content, (inputTokens || outputTokens) ? {
          input: inputTokens,
          output: outputTokens
        } : undefined);
      } catch {
        return wrapCliResult(result);
      }
    } catch (err: unknown) {
      return wrapError(err, model ? `mistral/${model}` : 'mistral', startTime);
    }
  }
};

