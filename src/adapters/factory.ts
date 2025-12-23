import { execa } from 'execa';
import type { Adapter, ModelResponse, RunOptions } from '../lib/types';
import { getConfig } from '../lib/config';

/**
 * Factory AI (droid) CLI adapter
 * Integrates with Factory's CLI tool for autonomous AI-assisted development
 */

export const factoryAdapter: Adapter = {
  name: 'factory',

  async isAvailable(): Promise<boolean> {
    const config = getConfig();
    if (!config.adapters.factory?.enabled) return false;

    try {
      // Check if droid CLI is available
      await execa('which', [config.adapters.factory.path || 'droid']);
      return true;
    } catch {
      return false;
    }
  },

  async run(prompt: string, options?: RunOptions): Promise<ModelResponse> {
    const config = getConfig();
    const startTime = Date.now();
    const factoryConfig = config.adapters.factory;
    const model = options?.model ?? factoryConfig?.model;

    try {
      const args: string[] = ['exec'];

      // Add model selection if specified
      if (model) {
        args.push('--model', model);
      }

      // Add autonomy level (default to low for safety)
      const autonomy = factoryConfig?.autonomy || 'low';
      if (autonomy && autonomy !== 'low') {
        args.push('--auto', autonomy);
      } else if (autonomy === 'low') {
        args.push('--auto', 'low');
      }

      // Add reasoning effort if specified
      if (factoryConfig?.reasoningEffort) {
        args.push('--reasoning-effort', factoryConfig.reasoningEffort);
      }

      // Skip permissions if configured (dangerous!)
      if (factoryConfig?.skipPermissions) {
        args.push('--skip-permissions-unsafe');
      }

      // Set working directory if specified
      if (factoryConfig?.cwd) {
        args.push('--cwd', factoryConfig.cwd);
      }

      // Add output format for clean parsing
      args.push('--output-format', 'text');

      // Add the prompt
      args.push(prompt);

      const { stdout, stderr } = await execa(
        config.adapters.factory?.path || 'droid',
        args,
        {
          timeout: config.timeout,
          cancelSignal: options?.signal,
          reject: false,
          stdin: 'ignore'
        }
      );

      const modelName = model ? `factory/${model}` : 'factory/droid';

      if (stderr && !stdout) {
        return {
          content: '',
          model: modelName,
          duration: Date.now() - startTime,
          error: stderr
        };
      }

      // Factory droid outputs plain text responses
      return {
        content: stdout || '',
        model: modelName,
        duration: Date.now() - startTime
      };

    } catch (err: unknown) {
      const error = err as Error;
      const modelName = model ? `factory/${model}` : 'factory/droid';
      return {
        content: '',
        model: modelName,
        duration: Date.now() - startTime,
        error: error.message
      };
    }
  }
};
