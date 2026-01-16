import { execa } from 'execa';
import type { Adapter, ModelResponse, RunOptions } from '../lib/types';
import { getConfig } from '../lib/config';

/**
 * IX-Agent Code Mode adapter
 *
 * Shells out to `python -m ix_agent.cli codemode` to execute Code Mode snippets.
 * Code Mode provides direct function calls without MCP overhead - the ix object
 * gives unified access to data operations, project lookups, and system commands.
 *
 * Disabled by default. Enable in config:
 * ```json
 * "ixagent": {
 *   "enabled": true,
 *   "pythonPath": "python",
 *   "module": "ix_agent.cli",
 *   "cwd": "/path/to/ix-agent-project"
 * }
 * ```
 *
 * Example prompt:
 * ```
 * projects = ix.lookup_search('solar', limit=10)
 * result = [p['project_name'] for p in projects['results']]
 * ```
 */
export const ixagentAdapter: Adapter = {
  name: 'ixagent',

  async isAvailable(): Promise<boolean> {
    const config = getConfig();
    if (!config.adapters.ixagent?.enabled) return false;

    try {
      // Check Python is available
      const pythonPath = config.adapters.ixagent.pythonPath || 'python';
      const { exitCode } = await execa(pythonPath, ['--version'], {
        reject: false,
        timeout: 5000
      });
      if (exitCode !== 0) return false;

      // Check ix_agent module is importable
      const module = config.adapters.ixagent.module || 'ix_agent.cli';
      const { exitCode: moduleCheck } = await execa(
        pythonPath,
        ['-c', `import ${module.split('.')[0]}`],
        {
          reject: false,
          timeout: 10000,
          cwd: config.adapters.ixagent.cwd
        }
      );
      return moduleCheck === 0;
    } catch {
      return false;
    }
  },

  async run(prompt: string, options?: RunOptions): Promise<ModelResponse> {
    const config = getConfig();
    const startTime = Date.now();
    const pythonPath = config.adapters.ixagent?.pythonPath || 'python';
    const module = config.adapters.ixagent?.module || 'ix_agent.cli';

    try {
      // Build command: python -m ix_agent.cli codemode --code "..." --json
      const args = [
        '-m', module,
        'codemode',
        '--code', prompt,
        '--json'
      ];

      const { stdout, stderr, exitCode } = await execa(
        pythonPath,
        args,
        {
          timeout: options?.timeout ?? config.timeout,
          cancelSignal: options?.signal,
          reject: false,
          stdin: 'ignore',
          cwd: config.adapters.ixagent?.cwd
        }
      );

      const stdoutStr = String(stdout || '');
      const stderrStr = String(stderr || '');

      // Handle non-zero exit
      if (exitCode !== 0 && stderrStr && !stdoutStr) {
        return {
          content: '',
          model: 'ixagent',
          duration: Date.now() - startTime,
          error: stderrStr
        };
      }

      // Parse JSON response from Code Mode
      try {
        const response = JSON.parse(stdoutStr);

        // Code Mode returns { result: ... } on success
        // or { error: "...", traceback: "..." } on failure
        if (response.error) {
          return {
            content: '',
            model: 'ixagent',
            duration: Date.now() - startTime,
            error: response.error + (response.traceback ? `\n${response.traceback}` : '')
          };
        }

        // Format result - could be any JSON-serializable value
        const content = typeof response.result === 'string'
          ? response.result
          : JSON.stringify(response.result, null, 2);

        return {
          content,
          model: 'ixagent',
          duration: Date.now() - startTime
        };
      } catch {
        // If JSON parsing fails, return raw stdout
        return {
          content: stdoutStr,
          model: 'ixagent',
          duration: Date.now() - startTime
        };
      }
    } catch (err: unknown) {
      const error = err as Error;
      return {
        content: '',
        model: 'ixagent',
        duration: Date.now() - startTime,
        error: error.message
      };
    }
  }
};
