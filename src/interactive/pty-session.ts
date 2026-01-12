/**
 * PTY Session Wrapper
 *
 * Wraps node-pty for interactive CLI sessions with automatic fallback
 * to execa subprocess when PTY is unavailable.
 *
 * Features:
 * - Windows ConPTY and Unix PTY support
 * - Automatic fallback to subprocess mode
 * - CRLF → LF normalization
 * - Graceful cleanup with platform-specific kill
 * - EventEmitter-based output streaming
 */

import { EventEmitter } from 'events';
import { execa, type ResultPromise } from 'execa';
import { platform } from 'os';
import { SessionState } from '../lib/types';

// Lazy-load node-pty to handle compilation failures gracefully
let nodePty: typeof import('node-pty') | null = null;
let ptyLoadError: Error | null = null;

try {
  // Dynamic import to catch compilation errors
  nodePty = require('node-pty');
} catch (err) {
  ptyLoadError = err as Error;
}

/**
 * Check if node-pty is available and working
 */
export function isPtyAvailable(): boolean {
  return nodePty !== null;
}

/**
 * Get the error message if PTY is not available
 */
export function getPtyLoadError(): string | null {
  return ptyLoadError?.message ?? null;
}

/**
 * Options for creating a PTY session
 */
export interface PtySessionOptions {
  /** Command to spawn */
  command: string;
  /** Command arguments */
  args?: string[];
  /** Working directory */
  cwd?: string;
  /** Environment variables */
  env?: Record<string, string>;
  /** Columns for PTY (default: 120) */
  cols?: number;
  /** Rows for PTY (default: 30) */
  rows?: number;
  /** Force subprocess mode even if PTY available */
  forceSubprocess?: boolean;
  /** Normalize CRLF to LF (default: true on Windows) */
  normalizeCrlf?: boolean;
}

/**
 * Events emitted by PtySession
 */
export interface PtySessionEvents {
  /** Output data from the process */
  output: (data: string) => void;
  /** Error occurred */
  error: (error: Error) => void;
  /** Process exited */
  exit: (code: number, signal?: string) => void;
  /** State changed */
  stateChange: (state: SessionState) => void;
}

/**
 * PTY Session class that wraps node-pty with subprocess fallback.
 * Provides a unified interface for interactive CLI sessions.
 */
export class PtySession extends EventEmitter {
  private readonly id: string;
  private readonly options: PtySessionOptions;
  private readonly isWindows: boolean;
  private readonly usePty: boolean;

  private ptyProcess: import('node-pty').IPty | null = null;
  private subProcess: ResultPromise | null = null;
  private _state: SessionState = SessionState.IDLE;
  private exitCode: number | null = null;
  private exitSignal: string | null = null;

  constructor(options: PtySessionOptions) {
    super();
    this.id = `pty_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.options = {
      cols: 120,
      rows: 30,
      normalizeCrlf: platform() === 'win32',
      ...options,
    };
    this.isWindows = platform() === 'win32';
    this.usePty = !options.forceSubprocess && isPtyAvailable();
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
   * Whether this session is using real PTY or subprocess fallback
   */
  get isPtyMode(): boolean {
    return this.usePty;
  }

  /**
   * Get the process ID
   */
  get pid(): number | undefined {
    return this.ptyProcess?.pid ?? this.subProcess?.pid;
  }

  /**
   * Spawn the process
   */
  async spawn(): Promise<void> {
    if (this._state !== SessionState.IDLE) {
      throw new Error(`Cannot spawn: session is in ${this._state} state`);
    }

    this.setState(SessionState.WAITING);

    try {
      if (this.usePty) {
        await this.spawnPty();
      } else {
        await this.spawnSubprocess();
      }
    } catch (err) {
      this.setState(SessionState.CLOSED);
      throw err;
    }
  }

  /**
   * Spawn using node-pty
   */
  private async spawnPty(): Promise<void> {
    if (!nodePty) {
      throw new Error('node-pty is not available');
    }

    const shell = this.options.command;
    const args = this.options.args ?? [];

    this.ptyProcess = nodePty.spawn(shell, args, {
      name: 'xterm-256color',
      cols: this.options.cols!,
      rows: this.options.rows!,
      cwd: this.options.cwd,
      env: {
        ...process.env,
        ...this.options.env,
        TERM: 'xterm-256color',
      } as Record<string, string>,
      // Windows-specific options
      ...(this.isWindows && {
        useConpty: true,
        conptyInheritCursor: false,
      }),
    });

    this.ptyProcess.onData((data: string) => {
      const normalized = this.normalizeOutput(data);
      this.emit('output', normalized);
    });

    this.ptyProcess.onExit(({ exitCode, signal }) => {
      this.exitCode = exitCode;
      this.exitSignal = signal !== undefined ? String(signal) : null;
      this.setState(SessionState.CLOSED);
      this.emit('exit', exitCode, this.exitSignal ?? undefined);
    });

    this.setState(SessionState.PROCESSING);
  }

  /**
   * Spawn using execa subprocess (fallback mode)
   */
  private async spawnSubprocess(): Promise<void> {
    const args = this.options.args ?? [];

    this.subProcess = execa(this.options.command, args, {
      cwd: this.options.cwd,
      env: {
        ...process.env,
        ...this.options.env,
      },
      stdin: 'pipe',
      stdout: 'pipe',
      stderr: 'pipe',
      // Don't throw on non-zero exit
      reject: false,
    });

    // Handle stdout
    if (this.subProcess.stdout) {
      this.subProcess.stdout.on('data', (chunk: Buffer) => {
        const data = chunk.toString('utf8');
        const normalized = this.normalizeOutput(data);
        this.emit('output', normalized);
      });
    }

    // Handle stderr (merge with stdout for unified output)
    if (this.subProcess.stderr) {
      this.subProcess.stderr.on('data', (chunk: Buffer) => {
        const data = chunk.toString('utf8');
        const normalized = this.normalizeOutput(data);
        this.emit('output', normalized);
      });
    }

    // Handle exit
    this.subProcess.on('exit', (code: number | null, signal: NodeJS.Signals | null) => {
      this.exitCode = code ?? 0;
      this.exitSignal = signal ?? null;
      this.setState(SessionState.CLOSED);
      this.emit('exit', this.exitCode, this.exitSignal ?? undefined);
    });

    // Handle errors
    this.subProcess.on('error', (err: Error) => {
      this.emit('error', err);
    });

    this.setState(SessionState.PROCESSING);
  }

  /**
   * Normalize output (CRLF → LF on Windows)
   */
  private normalizeOutput(data: string): string {
    if (this.options.normalizeCrlf) {
      return data.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    }
    return data;
  }

  /**
   * Set session state and emit change event
   */
  private setState(state: SessionState): void {
    if (this._state !== state) {
      this._state = state;
      this.emit('stateChange', state);
    }
  }

  /**
   * Send input to the process
   */
  async send(input: string): Promise<void> {
    if (this._state === SessionState.CLOSED || this._state === SessionState.CLOSING) {
      throw new Error(`Cannot send: session is ${this._state}`);
    }

    if (this.ptyProcess) {
      this.ptyProcess.write(input);
    } else if (this.subProcess?.stdin) {
      this.subProcess.stdin.write(input);
    } else {
      throw new Error('No process available to send input to');
    }
  }

  /**
   * Send input followed by newline (Enter key)
   */
  async sendLine(input: string): Promise<void> {
    await this.send(input + '\n');
  }

  /**
   * Resize the PTY (only works in PTY mode)
   */
  resize(cols: number, rows: number): void {
    if (this.ptyProcess) {
      this.ptyProcess.resize(cols, rows);
    }
    // No-op for subprocess mode
  }

  /**
   * Close the session gracefully
   */
  async close(reason?: string): Promise<void> {
    if (this._state === SessionState.CLOSED) {
      return;
    }

    this.setState(SessionState.CLOSING);

    try {
      if (this.ptyProcess) {
        // Send Ctrl+C then Ctrl+D for graceful exit
        this.ptyProcess.write('\x03'); // Ctrl+C
        await this.delay(100);
        this.ptyProcess.write('\x04'); // Ctrl+D

        // Wait a bit for graceful exit
        const exited = await this.waitForExit(2000);
        if (!exited) {
          await this.kill();
        }
      } else if (this.subProcess) {
        // Try SIGTERM first
        this.subProcess.kill('SIGTERM');

        const exited = await this.waitForExit(2000);
        if (!exited) {
          await this.kill();
        }
      }
    } catch {
      // Force kill on any error
      await this.kill();
    }

    this.setState(SessionState.CLOSED);
  }

  /**
   * Force kill the session immediately
   */
  async kill(): Promise<void> {
    if (this._state === SessionState.CLOSED) {
      return;
    }

    try {
      if (this.ptyProcess) {
        this.ptyProcess.kill();
      } else if (this.subProcess) {
        if (this.isWindows) {
          // On Windows, use taskkill to kill process tree
          await this.windowsKill(this.subProcess.pid!);
        } else {
          // On Unix, SIGKILL
          this.subProcess.kill('SIGKILL');
        }
      }
    } catch {
      // Ignore kill errors - process may already be dead
    }

    this.setState(SessionState.CLOSED);
  }

  /**
   * Windows-specific process kill using taskkill
   */
  private async windowsKill(pid: number): Promise<void> {
    try {
      await execa('taskkill', ['/T', '/F', '/PID', String(pid)], {
        reject: false,
      });
    } catch {
      // Ignore taskkill errors
    }
  }

  /**
   * Wait for the process to exit
   */
  private waitForExit(timeout: number): Promise<boolean> {
    return new Promise((resolve) => {
      if (this._state === SessionState.CLOSED) {
        resolve(true);
        return;
      }

      const timer = setTimeout(() => {
        resolve(false);
      }, timeout);

      const onExit = () => {
        clearTimeout(timer);
        this.removeListener('exit', onExit);
        resolve(true);
      };

      this.once('exit', onExit);
    });
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Clean up all resources
   */
  destroy(): void {
    this.removeAllListeners();
    this.ptyProcess = null;
    this.subProcess = null;
  }
}

/**
 * Check if Windows ConPTY is available
 * ConPTY requires Windows 10 version 1809 or later
 */
export function isConPtyAvailable(): boolean {
  if (platform() !== 'win32') {
    return false;
  }

  // Check Windows version
  const release = require('os').release();
  const [, , build] = release.split('.').map(Number);

  // ConPTY requires Windows 10 build 17763 (version 1809) or later
  if (build >= 17763) {
    return true;
  }

  return false;
}

/**
 * Get recommended shell for the current platform
 */
export function getDefaultShell(): string {
  if (platform() === 'win32') {
    return process.env.COMSPEC || 'cmd.exe';
  }
  return process.env.SHELL || '/bin/sh';
}

/**
 * Create a PTY session with sensible defaults
 */
export function createPtySession(
  command: string,
  args?: string[],
  options?: Partial<PtySessionOptions>
): PtySession {
  return new PtySession({
    command,
    args,
    ...options,
  });
}
