import { type Adapter, type ModelResponse } from '../lib/types';
import { getConfig } from '../lib/config';
import { isBinaryAvailable, executeCli, wrapCliResult, wrapError, type GeminiRunOptions } from './utils';

// Re-export type if needed elsewhere, but it's now in utils for circular avoidance or just used here
export type { GeminiRunOptions };

export const geminiAdapter: Adapter = {
  name: 'gemini',

  async isAvailable(): Promise<boolean> {
    const config = getConfig();
    if (!config.adapters.gemini.enabled) return false;
    return isBinaryAvailable(config.adapters.gemini.path);
  },

  async run(prompt: string, options?: GeminiRunOptions): Promise<ModelResponse> {
    const config = getConfig();
    const startTime = Date.now();
    const model = options?.model ?? config.adapters.gemini.model;
    const geminiApprovalMode = options?.geminiApprovalMode;
    const maxPromptChars = 30000;
    const usePromptStdin = prompt.length > maxPromptChars;

    try {
      const args: string[] = ['--output-format', 'json'];

      if (geminiApprovalMode === 'yolo' || geminiApprovalMode === 'auto_edit') {
        args.push('--approval-mode', 'auto_edit');
      }

      if (model) {
        args.push('-m', model);
      }

      if (!usePromptStdin) {
        args.push('--', prompt);
      }

      const result = await executeCli('gemini', config.adapters.gemini.path, args, {
        ...options,
        timeout: config.timeout,
        input: usePromptStdin ? prompt : undefined
      });

      // Debug logging
      if (config.logLevel === 'debug') {
        console.log(`[gemini] exitCode=${result.exitCode} stdout.length=${result.stdout?.length || 0} stderr.length=${result.stderr?.length || 0}`);
        if (result.stderr) console.log(`[gemini] stderr: ${result.stderr.slice(0, 200)}`);
      }

      if (result.stderr && !result.stdout) {
        return wrapCliResult(result);
      }

      // Parse JSON response to extract content and tokens
      try {
        const json = JSON.parse(result.stdout);

        // Sum tokens from all models used
        let inputTokens = 0;
        let outputTokens = 0;
        if (json.stats?.models) {
          for (const modelStats of Object.values(json.stats.models) as Array<{ tokens?: { prompt?: number; candidates?: number } }>) {
            inputTokens += modelStats.tokens?.prompt || 0;
            outputTokens += modelStats.tokens?.candidates || 0;
          }
        }

        return wrapCliResult(result, json.response || '', (inputTokens || outputTokens) ? {
          input: inputTokens,
          output: outputTokens
        } : undefined);
      } catch (parseErr) {
        // Fallback if JSON parsing fails
        if (config.logLevel === 'debug') {
          console.log(`[gemini] JSON parse failed: ${parseErr}`);
        }
        return wrapCliResult(result);
      }
    } catch (err: unknown) {
      return wrapError(err, model ? `gemini/${model}` : 'gemini', startTime);
    }
  }
};

