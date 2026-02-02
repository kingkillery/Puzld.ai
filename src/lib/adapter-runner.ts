import { adapters } from '../adapters';
import { getConfig } from './config';
import { TIMEOUT_DEFAULT } from './timeouts';
import type { AgentName } from '../executor/types';
import { startObservation, logResponse } from '../observation/logger';

export interface AdapterRunOptions {
  model?: string;
  timeout?: number;
  signal?: AbortSignal;
  stepId?: string;
  onChunk?: (chunk: string) => void;
}

export async function runAdapter(
  agent: AgentName,
  prompt: string,
  options: AdapterRunOptions = {}
): Promise<{ content: string; model: string; error?: string; duration?: number; tokensIn?: number; tokensOut?: number }> {
  const adapter = adapters[agent];
  if (!adapter) {
    return {
      content: '',
      model: agent,
      error: `Unknown agent: ${agent}`
    };
  }

  if (!(await adapter.isAvailable())) {
    return {
      content: '',
      model: agent,
      error: `Agent ${agent} is not available`
    };
  }

  const config = getConfig();
  const timeout = options.timeout ?? config.timeout ?? TIMEOUT_DEFAULT;
  const timeoutPromise = new Promise<never>((_, reject) => {
    const timer = setTimeout(() => {
      clearTimeout(timer);
      reject(new Error('Timeout'));
    }, timeout);
  });

  // Start observation for telemetry (wrapped to prevent DB failures from blocking execution)
  let observationId: number | null = null;
  try {
    observationId = startObservation({
      prompt,
      agent,
      model: options.model
    });
  } catch (dbErr) {
    // Telemetry logging unavailable - continue without it
    console.warn(`Telemetry logging unavailable: ${(dbErr as Error).message}`);
  }

  const startTime = Date.now();

  try {
    const result = await Promise.race([
      adapter.run(prompt, { model: options.model, signal: options.signal }),
      timeoutPromise
    ]);

    const duration = Date.now() - startTime;

    // Log response with telemetry (only if observation started successfully)
    if (observationId !== null) {
      try {
        logResponse(observationId, {
          response: result.content,
          durationMs: duration,
          tokensIn: result.tokens?.input,
          tokensOut: result.tokens?.output
        });
      } catch (logErr) {
        // Silently fail - logging shouldn't break execution
      }
    }

    return {
      content: result.content,
      model: result.model,
      error: result.error,
      duration,
      tokensIn: result.tokens?.input,
      tokensOut: result.tokens?.output
    };
  } catch (err) {
    const duration = Date.now() - startTime;
    const errorMessage = (err as Error).message;

    // Log error with telemetry (use undefined for unknown token counts)
    if (observationId !== null) {
      try {
        logResponse(observationId, {
          response: '',
          durationMs: duration,
          tokensIn: undefined,
          tokensOut: undefined
        });
      } catch (logErr) {
        // Silently fail
      }
    }

    return {
      content: '',
      model: agent,
      error: errorMessage,
      duration
    };
  }
}
