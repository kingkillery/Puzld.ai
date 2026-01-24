import { spawn } from 'child_process';
import type { ModelResponse } from '../lib/types';
import { getConfig } from '../lib/config';

export interface GoLoopOptions {
  cwd?: string;
  model?: string;
  maxIterations?: number;
}

function buildGoCommand(cwd: string): { cmd: string; args: string[] } {
  const config = getConfig();
  const goAgent = config.goAgent || {};

  if (goAgent.binaryPath) {
    return { cmd: goAgent.binaryPath, args: [] };
  }

  const args = ['run', './go/cmd/puzldai-agent'];
  return { cmd: 'go', args };
}

export async function runGoAgentLoop(
  task: string,
  options: GoLoopOptions
): Promise<ModelResponse> {
  const config = getConfig();
  const goAgent = config.goAgent || {};
  const { cmd, args } = buildGoCommand(options.cwd || process.cwd());

  const model = options.model || goAgent.model;
  const maxIters = options.maxIterations || goAgent.maxIters;

  const finalArgs = [...args];
  if (model) {
    finalArgs.push('-model', model);
  }
  if (maxIters) {
    finalArgs.push('-max-iters', String(maxIters));
  }
  if (options.cwd) {
    finalArgs.push('-cwd', options.cwd);
  }

  const start = Date.now();
  try {
    const output = await runProcess(cmd, finalArgs, {
      cwd: options.cwd || process.cwd(),
      env: { ...process.env },
      input: task,
    });

    return {
      content: output.stdout.trimEnd(),
      model: model || 'go-agent',
      duration: Date.now() - start,
    };
  } catch (err) {
    const error = err as Error & { stdout?: string; stderr?: string };
    const message = [error.message, error.stderr, error.stdout].filter(Boolean).join('\n');
    return {
      content: error.stdout ? error.stdout.trimEnd() : '',
      model: model || 'go-agent',
      error: message || 'Go agent failed',
      duration: Date.now() - start,
    };
  }
}

function runProcess(
  cmd: string,
  args: string[],
  options: { cwd: string; env: NodeJS.ProcessEnv; input: string }
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: 'pipe',
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      const err = error as Error & { stdout?: string; stderr?: string };
      err.stdout = stdout;
      err.stderr = stderr;
      reject(err);
    });

    child.on('close', (code) => {
      if (code && code !== 0) {
        const err = new Error(`Command failed with exit code ${code}`) as Error & {
          stdout?: string;
          stderr?: string;
        };
        err.stdout = stdout;
        err.stderr = stderr;
        reject(err);
        return;
      }
      resolve({ stdout, stderr });
    });

    if (child.stdin) {
      child.stdin.write(options.input);
      child.stdin.end();
    }
  });
}
