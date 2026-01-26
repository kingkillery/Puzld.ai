import { execa } from 'execa';
import type { ModelResponse, RunOptions } from '../lib/types';

/**
 * Extended options for Gemini adapter
 */
export interface GeminiRunOptions extends RunOptions {
  geminiApprovalMode?: 'yolo' | 'auto_edit' | 'default';
}

/**
 * Check if a binary is available in the system path
 */
export async function isBinaryAvailable(path: string): Promise<boolean> {
  try {
    const command = process.platform === 'win32' ? 'where' : 'which';
    await execa(command, [path]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Common configuration for CLI execution
 */
export interface CliExecutionOptions extends RunOptions {
  timeout?: number;
  input?: string;
  reject?: boolean;
}

/**
 * Result of a standardized CLI execution
 */
export interface CliExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number | undefined;
  duration: number;
  modelName: string;
}

/**
 * Execute a CLI command and track metadata
 */
export async function executeCli(
  adapterName: string,
  command: string,
  args: string[],
  options: CliExecutionOptions
): Promise<CliExecutionResult> {
  const startTime = Date.now();
  const modelName = options.model ? `${adapterName}/${options.model}` : adapterName;

  const result = await execa(command, args, {
    timeout: options.timeout,
    cancelSignal: options.signal,
    reject: options.reject ?? false,
    input: options.input,
    stdin: options.input ? 'pipe' : 'ignore',
    stdout: 'pipe',
    stderr: 'pipe'
  });

  return {
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode,
    duration: Date.now() - startTime,
    modelName
  };
}

/**
 * Helper to create a standard ModelResponse from CLI result
 */
export function wrapCliResult(
  result: CliExecutionResult,
  content?: string,
  tokens?: { input: number; output: number },
  error?: string
): ModelResponse {
  // If stderr exists and no stdout, or if stdout is explicitly empty and we have stderr, treat as error
  const finalError = error || (result.stderr && !result.stdout ? result.stderr : undefined);
  
  return {
    content: content ?? (result.stdout || ''),
    model: result.modelName,
    duration: result.duration,
    tokens,
    error: finalError
  };
}

/**
 * Standard error response for catch blocks
 */
export function wrapError(err: unknown, modelName: string, startTime: number): ModelResponse {
  const error = err as Error;
  return {
    content: '',
    model: modelName,
    duration: Date.now() - startTime,
    error: error.message
  };
}
