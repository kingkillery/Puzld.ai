/**
 * Mock PTY for Deterministic Testing
 *
 * Simulates PTY behavior with scripted responses for unit testing.
 * Enables testing interactive session logic without real CLI tools.
 *
 * Features:
 * - Same interface as PtySession
 * - Scripted response sequences
 * - Simulated timing/delays
 * - Permission prompt simulation
 * - Error and timeout injection
 */

import { EventEmitter } from 'events';
import { SessionState } from '../lib/types';

/**
 * A scripted response for the mock PTY
 */
export interface MockResponse {
  /** Output to emit */
  output: string;
  /** Delay before emitting (ms) */
  delay?: number;
  /** Trigger pattern - emit this response when input matches */
  trigger?: string | RegExp;
  /** Emit as error event instead of output */
  isError?: boolean;
  /** Exit after this response with given code */
  exitCode?: number;
}

/**
 * Options for MockPty
 */
export interface MockPtyOptions {
  /** Initial output to emit on spawn */
  initialOutput?: string;
  /** Delay before initial output (ms) */
  initialDelay?: number;
  /** Scripted responses to inputs */
  responses?: MockResponse[];
  /** Default response for unmatched inputs */
  defaultResponse?: string;
  /** Auto-exit after N inputs */
  autoExitAfter?: number;
  /** Exit code for auto-exit */
  autoExitCode?: number;
  /** Simulate spawn failure */
  failOnSpawn?: boolean;
  /** Spawn failure message */
  spawnErrorMessage?: string;
}

/**
 * Mock PTY Session for testing
 *
 * Provides the same interface as PtySession but with scripted behavior.
 */
export class MockPty extends EventEmitter {
  private readonly id: string;
  private readonly options: MockPtyOptions;
  private _state: SessionState = SessionState.IDLE;
  private inputCount = 0;
  private responseQueue: MockResponse[] = [];
  private pendingTimers: NodeJS.Timeout[] = [];

  constructor(options: MockPtyOptions = {}) {
    super();
    this.id = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.options = {
      initialDelay: 50,
      defaultResponse: '',
      autoExitAfter: 0,
      autoExitCode: 0,
      ...options,
    };
    this.responseQueue = [...(options.responses ?? [])];
  }

  /**
   * Get the session ID
   */
  get sessionId(): string {
    return this.id;
  }

  /**
   * Get current session state
   */
  get state(): SessionState {
    return this._state;
  }

  /**
   * Mock PTY always reports as PTY mode
   */
  get isPtyMode(): boolean {
    return true;
  }

  /**
   * Mock PID
   */
  get pid(): number {
    return 99999;
  }

  /**
   * Spawn the mock process
   */
  async spawn(): Promise<void> {
    if (this._state !== SessionState.IDLE) {
      throw new Error(`Cannot spawn: session is in ${this._state} state`);
    }

    // Simulate spawn failure if configured
    if (this.options.failOnSpawn) {
      this.setState(SessionState.CLOSED);
      throw new Error(this.options.spawnErrorMessage ?? 'Mock spawn failure');
    }

    this.setState(SessionState.WAITING);

    // Emit initial output after delay
    if (this.options.initialOutput) {
      const timer = setTimeout(() => {
        this.emitOutput(this.options.initialOutput!);
        this.setState(SessionState.PROCESSING);
      }, this.options.initialDelay);
      this.pendingTimers.push(timer);
    } else {
      this.setState(SessionState.PROCESSING);
    }
  }

  /**
   * Send input and trigger matching response
   */
  async send(input: string): Promise<void> {
    if (this._state === SessionState.CLOSED || this._state === SessionState.CLOSING) {
      throw new Error(`Cannot send: session is ${this._state}`);
    }

    this.inputCount++;

    // Find matching response
    const response = this.findMatchingResponse(input);

    if (response) {
      const delay = response.delay ?? 50;
      const timer = setTimeout(() => {
        if (response.isError) {
          this.emit('error', new Error(response.output));
        } else {
          this.emitOutput(response.output);
        }

        if (response.exitCode !== undefined) {
          this.exit(response.exitCode);
        }
      }, delay);
      this.pendingTimers.push(timer);
    } else if (this.options.defaultResponse) {
      const timer = setTimeout(() => {
        this.emitOutput(this.options.defaultResponse!);
      }, 50);
      this.pendingTimers.push(timer);
    }

    // Check auto-exit
    if (this.options.autoExitAfter && this.inputCount >= this.options.autoExitAfter) {
      const timer = setTimeout(() => {
        this.exit(this.options.autoExitCode ?? 0);
      }, 100);
      this.pendingTimers.push(timer);
    }
  }

  /**
   * Send input followed by newline
   */
  async sendLine(input: string): Promise<void> {
    await this.send(input + '\n');
  }

  /**
   * Find a response matching the input
   */
  private findMatchingResponse(input: string): MockResponse | undefined {
    // Check triggered responses first
    for (let i = 0; i < this.responseQueue.length; i++) {
      const response = this.responseQueue[i];
      if (response.trigger) {
        const matches =
          typeof response.trigger === 'string'
            ? input.includes(response.trigger)
            : response.trigger.test(input);

        if (matches) {
          // Remove from queue (one-time use)
          this.responseQueue.splice(i, 1);
          return response;
        }
      }
    }

    // Return next non-triggered response
    const nextResponse = this.responseQueue.find((r) => !r.trigger);
    if (nextResponse) {
      const index = this.responseQueue.indexOf(nextResponse);
      this.responseQueue.splice(index, 1);
      return nextResponse;
    }

    return undefined;
  }

  /**
   * Emit output event
   */
  private emitOutput(data: string): void {
    this.emit('output', data);
  }

  /**
   * Trigger exit
   */
  private exit(code: number): void {
    this.setState(SessionState.CLOSED);
    this.emit('exit', code, undefined);
  }

  /**
   * Set state and emit change event
   */
  private setState(state: SessionState): void {
    if (this._state !== state) {
      this._state = state;
      this.emit('stateChange', state);
    }
  }

  /**
   * Resize (no-op for mock)
   */
  resize(_cols: number, _rows: number): void {
    // No-op
  }

  /**
   * Close the session
   */
  async close(_reason?: string): Promise<void> {
    if (this._state === SessionState.CLOSED) {
      return;
    }

    this.setState(SessionState.CLOSING);
    this.clearTimers();
    this.setState(SessionState.CLOSED);
    this.emit('exit', 0, undefined);
  }

  /**
   * Kill the session
   */
  async kill(): Promise<void> {
    if (this._state === SessionState.CLOSED) {
      return;
    }

    this.clearTimers();
    this.setState(SessionState.CLOSED);
    this.emit('exit', -1, 'SIGKILL');
  }

  /**
   * Clear pending timers
   */
  private clearTimers(): void {
    for (const timer of this.pendingTimers) {
      clearTimeout(timer);
    }
    this.pendingTimers = [];
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.clearTimers();
    this.removeAllListeners();
  }

  // ============================================================================
  // Test Helper Methods
  // ============================================================================

  /**
   * Add a response to the queue
   */
  addResponse(response: MockResponse): void {
    this.responseQueue.push(response);
  }

  /**
   * Inject output directly (for testing)
   */
  injectOutput(output: string): void {
    this.emitOutput(output);
  }

  /**
   * Inject error directly (for testing)
   */
  injectError(error: Error): void {
    this.emit('error', error);
  }

  /**
   * Force exit (for testing)
   */
  forceExit(code: number, signal?: string): void {
    this.setState(SessionState.CLOSED);
    this.emit('exit', code, signal);
  }

  /**
   * Get input count
   */
  getInputCount(): number {
    return this.inputCount;
  }

  /**
   * Get remaining responses in queue
   */
  getRemainingResponses(): number {
    return this.responseQueue.length;
  }
}

// ============================================================================
// Pre-built Mock Scenarios
// ============================================================================

/**
 * Create a mock that simulates Claude Code permission prompts
 */
export function createClaudePermissionMock(): MockPty {
  return new MockPty({
    initialOutput: 'Claude Code v2.1.5\n\n> ',
    responses: [
      {
        output: '\nAllow tool "bash" to execute command? [y/n/a] ',
        delay: 100,
      },
      {
        trigger: /^y/i,
        output: '\nExecuting command...\nDone.\n\n> ',
        delay: 200,
      },
      {
        trigger: /^n/i,
        output: '\nCommand denied.\n\n> ',
        delay: 50,
      },
      {
        trigger: /^a/i,
        output: '\nApproved all for this session.\nExecuting...\nDone.\n\n> ',
        delay: 200,
      },
    ],
    defaultResponse: '\nI don\'t understand that command.\n\n> ',
  });
}

/**
 * Create a mock that simulates Codex CLI prompts
 */
export function createCodexPermissionMock(): MockPty {
  return new MockPty({
    initialOutput: 'Codex CLI v0.80.0\nSandbox: workspace-write\n\n',
    responses: [
      {
        output: '\n⚡ Allow shell command: ls -la\n[a]pprove / [d]eny / [e]dit? ',
        delay: 100,
      },
      {
        trigger: /^a/i,
        output: '\nRunning...\ntotal 32\ndrwxr-xr-x 4 user user 4096 Jan 12 00:00 .\n\n',
        delay: 150,
      },
      {
        trigger: /^d/i,
        output: '\nDenied.\n\n',
        delay: 50,
      },
    ],
    defaultResponse: '\nUnknown input.\n\n',
  });
}

/**
 * Create a mock that simulates timeout behavior
 */
export function createTimeoutMock(timeoutMs: number): MockPty {
  return new MockPty({
    initialOutput: 'Starting...\n',
    responses: [
      {
        output: '', // Empty response to simulate hang
        delay: timeoutMs + 1000, // Longer than expected timeout
      },
    ],
  });
}

/**
 * Create a mock that simulates immediate exit
 */
export function createExitMock(exitCode: number): MockPty {
  return new MockPty({
    initialOutput: 'Goodbye!\n',
    initialDelay: 10,
    autoExitAfter: 0,
    responses: [
      {
        output: 'Exiting...\n',
        delay: 10,
        exitCode,
      },
    ],
  });
}

/**
 * Create a mock that simulates spawn failure
 */
export function createSpawnFailureMock(errorMessage: string): MockPty {
  return new MockPty({
    failOnSpawn: true,
    spawnErrorMessage: errorMessage,
  });
}
