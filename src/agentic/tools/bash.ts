// Bash tool - Execute shell commands

import { exec } from 'child_process';
import { promisify } from 'util';
import type { Tool, ToolResult } from './types';
import { assessBashSafety, formatSafetyMessage } from '../safety/bash-safety';

const execAsync = promisify(exec);
const TIMEOUT_MS = 30000; // 30 seconds
const MAX_OUTPUT = 50000; // 50KB

export const bashTool: Tool = {
  name: 'bash',
  description: `Execute a shell command and return the output.

WHEN TO USE:
- To run build commands (npm, bun, make)
- To check git status or run git commands
- To run tests or linters
- To execute any shell command

SAFETY:
- Commands run with 30 second timeout
- Output is truncated at 50KB
- Avoid destructive commands unless necessary

EXAMPLES:
- "npm run build" - Build the project
- "git status" - Check git status
- "ls -la src/" - List files in src
- "npm test" - Run tests`,

  parameters: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'Shell command to execute',
      },
    },
    required: ['command'],
  },

  async execute(params: Record<string, unknown>, cwd: string): Promise<ToolResult> {
    const command = params.command as string;

    if (!command) {
      return { toolCallId: '', content: 'Error: command is required', isError: true };
    }

    // Safety assessment before execution
    const safety = assessBashSafety(command);
    console.error(formatSafetyMessage(safety));

    // Log warning for high-risk commands (they still execute, but with visibility)
    if (safety.riskLevel === 'high') {
      console.error(`[WARN] High-risk command detected: ${command}`);
    }

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd,
        timeout: TIMEOUT_MS,
        maxBuffer: MAX_OUTPUT * 2,
        env: { ...process.env, FORCE_COLOR: '0' },
      });

      let output = '';
      if (stdout) output += stdout;
      if (stderr) output += (output ? '\n\n' : '') + 'STDERR:\n' + stderr;

      if (!output) output = '(Command completed with no output)';

      // Truncate if too long
      if (output.length > MAX_OUTPUT) {
        output = output.slice(0, MAX_OUTPUT) + '\n\n... (output truncated)';
      }

      return { toolCallId: '', content: output };
    } catch (err) {
      const error = err as Error & { code?: number; killed?: boolean; stdout?: string; stderr?: string };

      if (error.killed) {
        return { toolCallId: '', content: `Error: Command timed out after ${TIMEOUT_MS / 1000}s`, isError: true };
      }

      // Include output even on error (e.g., test failures)
      let output = `Command failed with exit code ${error.code || 1}\n\n`;
      if (error.stdout) output += error.stdout + '\n';
      if (error.stderr) output += 'STDERR:\n' + error.stderr;

      return { toolCallId: '', content: output, isError: true };
    }
  },
};
