export interface ModelResponse {
  /** The text content of the response */
  content: string;
  /** The specific model that generated the response */
  model: string;
  /** Token usage statistics */
  tokens?: {
    input: number;
    output: number;
  };
  /** Execution duration in milliseconds */
  duration?: number;
  /** Error message if execution failed */
  error?: string;
  /** Updated game state for game adapters (resumable gameplay) */
  state?: unknown;
}

export type GameStatus = 'playing' | 'won' | 'lost' | 'invalid';

export interface GameState {
  /** Current status of the game */
  status: GameStatus;
  /** History of moves made */
  moves?: string[];
  /** Current score */
  score?: number;
  /** Message to display to the user */
  message?: string;
  /** Custom game-specific data */
  data?: unknown;
}

export type GameDifficulty = 'easy' | 'medium' | 'hard';

export interface GameOptions {
  /** Difficulty level of the game */
  difficulty: GameDifficulty;
}

export interface GameCommandValidation {
  /** Whether the command is valid */
  valid: boolean;
  /** Error message if invalid */
  error?: string;
}

export interface GameAdapter extends Adapter {
  /**
   * Initializes a new game state.
   * @param options - Game configuration options (difficulty, etc.).
   * @returns The initial GameState.
   */
  initializeGame(options: GameOptions): GameState;

  /**
   * Renders the current game state into a string representation.
   * @param state - The current game state.
   * @returns A string visualization of the state.
   */
  renderState(state: GameState): string;

  /**
   * Optional: Validates a user command before execution.
   * @param command - The command string to validate.
   * @param state - The current game state.
   * @returns Validation result (valid boolean and optional error).
   */
  validateCommand?(command: string, state: GameState): GameCommandValidation;
}

export interface GameSession {
  id: string;
  gameName: string;
  state: GameState;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface RalphWiggumOptions {
  /** Enable Ralph Wiggum loop (keep retrying until task is done) */
  enabled?: boolean;
  /** Maximum number of iterations (default: 10) */
  maxIterations?: number;
  /** Completion criteria phrase that signals success (e.g., "task completed", "all tests pass") */
  completionCriteria?: string | string[];
  /** Callback for each iteration */
  onIteration?: (iteration: number, result: ModelResponse) => void;
  /** Whether to require explicit completion promise (default: true) */
  requireCompletionPromise?: boolean;
}

export interface RunOptions {
  /** Signal to abort the operation */
  signal?: AbortSignal;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Callback for streaming response chunks */
  onChunk?: (chunk: string) => void;
  /** Callback for tool use events */
  onToolEvent?: (event: import('./stream-parser').StreamEvent) => void;
  /** Specific model identifier to use (e.g., 'gpt-4', 'claude-3-opus') */
  model?: string;
  /** Disable native tools (for agentic mode - LLM returns JSON, we apply files) */
  disableTools?: boolean;
  /** Initial state for game adapters */
  state?: unknown;
  /** Ralph Wiggum loop options for persistent retry until completion */
  ralphWiggum?: RalphWiggumOptions;
}

export interface Adapter {
  /**
   * The unique name of the adapter (e.g., 'claude', 'gemini', 'ollama').
   * Used for configuration and routing.
   */
  name: string;

  /**
   * Executes a prompt against the adapter's underlying model or engine.
   * @param prompt - The input text or command to process.
   * @param options - Optional configuration for this specific run.
   * @returns A promise resolving to the model's response.
   */
  run(prompt: string, options?: RunOptions): Promise<ModelResponse>;

  /**
   * Checks if the adapter is currently available (e.g., binary installed, API reachable).
   * @returns A promise resolving to true if available, false otherwise.
   */
  isAvailable(): Promise<boolean>;
}

export interface RouteResult {
  agent: 'claude' | 'gemini' | 'codex' | 'ollama' | 'factory' | 'crush' | 'mistral';
  confidence: number;
  reasoning?: string;
  taskType?: string;
  /** Human-readable reason why fallback occurred (if taskType === 'fallback') */
  fallbackReason?: string;
  /** Suggested harness for complex tasks (pkpoet, codereason, discover, etc.) */
  suggestedHarness?: string;
}

export interface CheckResult {
  name: string;
  available: boolean;
  version?: string;
  error?: string;
}

export interface TaskRecord {
  id: string;
  prompt: string;
  agent: string;
  response: string;
  timestamp: string;
  duration?: number;
}

export enum ErrorCode {
  ADAPTER_NOT_FOUND = 'ADAPTER_NOT_FOUND',
  ADAPTER_UNAVAILABLE = 'ADAPTER_UNAVAILABLE',
  ADAPTER_TIMEOUT = 'ADAPTER_TIMEOUT',
  ADAPTER_CRASHED = 'ADAPTER_CRASHED',
  ROUTER_FAILED = 'ROUTER_FAILED',
  ROUTER_INVALID_JSON = 'ROUTER_INVALID_JSON',
  OLLAMA_NOT_RUNNING = 'OLLAMA_NOT_RUNNING',
  CONFIG_INVALID = 'CONFIG_INVALID',
  TASK_CANCELLED = 'TASK_CANCELLED',
}

export interface PulzdError {
  code: ErrorCode;
  message: string;
  suggestion?: string;
  recoverable: boolean;
}

// ============================================================================
// Interactive CLI Integration Types
// ============================================================================

/**
 * State of an interactive PTY session.
 */
export enum SessionState {
  /** Session created but not yet started */
  IDLE = 'idle',
  /** Waiting for CLI tool to respond */
  WAITING = 'waiting',
  /** Processing output from CLI tool */
  PROCESSING = 'processing',
  /** Waiting for user response to a permission prompt */
  PROMPTING = 'prompting',
  /** Session is shutting down */
  CLOSING = 'closing',
  /** Session has ended */
  CLOSED = 'closed',
}

/**
 * Types of prompts that can be detected from CLI tool output.
 */
export type PromptEventType = 'permission' | 'input' | 'confirm' | 'error';

/**
 * A permission prompt from the CLI tool (e.g., "Allow tool X?")
 */
export interface PermissionPromptEvent {
  type: 'permission';
  /** Name of the tool requesting permission */
  tool?: string;
  /** The full prompt message */
  message: string;
  /** Risk level of the operation */
  riskLevel?: 'low' | 'medium' | 'high';
  /** Available response options */
  options?: string[];
}

/**
 * An input prompt requesting user text input
 */
export interface InputPromptEvent {
  type: 'input';
  /** The prompt message */
  message: string;
  /** Whether input should be hidden (e.g., password) */
  hidden?: boolean;
}

/**
 * A confirmation prompt (yes/no)
 */
export interface ConfirmPromptEvent {
  type: 'confirm';
  /** The confirmation message */
  message: string;
  /** Default response if timeout */
  defaultResponse?: boolean;
}

/**
 * An error prompt indicating something went wrong
 */
export interface ErrorPromptEvent {
  type: 'error';
  /** Error message */
  message: string;
  /** Error code if available */
  code?: string;
  /** Whether the error is recoverable */
  recoverable?: boolean;
}

/**
 * Union type for all prompt events from CLI tools.
 */
export type PromptEvent =
  | PermissionPromptEvent
  | InputPromptEvent
  | ConfirmPromptEvent
  | ErrorPromptEvent;

/**
 * Callback to unsubscribe from events.
 */
export type Unsubscribe = () => void;

/**
 * Represents an active interactive session with a CLI tool.
 * Provides methods to send input, receive output, and manage lifecycle.
 */
export interface InteractiveSession {
  /** Unique session identifier */
  id: string;

  /** Current state of the session */
  state: SessionState;

  /** CLI tool being controlled (e.g., 'claude', 'codex') */
  tool: string;

  /** CLI tool version if detected */
  version?: string;

  /** Timestamp when session was created */
  createdAt: number;

  /**
   * Send input to the CLI tool.
   * @param input - Text to send (will be followed by newline)
   * @returns Promise that resolves when input is sent
   */
  send(input: string): Promise<void>;

  /**
   * Subscribe to output chunks from the CLI tool.
   * @param callback - Called with each output chunk
   * @returns Unsubscribe function
   */
  onOutput(callback: (chunk: string) => void): Unsubscribe;

  /**
   * Subscribe to prompt events detected in the output.
   * @param callback - Called when a prompt is detected
   * @returns Unsubscribe function
   */
  onPrompt(callback: (prompt: PromptEvent) => void): Unsubscribe;

  /**
   * Subscribe to state changes.
   * @param callback - Called when session state changes
   * @returns Unsubscribe function
   */
  onStateChange?(callback: (state: SessionState) => void): Unsubscribe;

  /**
   * Subscribe to session errors.
   * @param callback - Called when an error occurs
   * @returns Unsubscribe function
   */
  onError?(callback: (error: Error) => void): Unsubscribe;

  /**
   * Close the session gracefully.
   * @param reason - Optional reason for closing
   * @returns Promise that resolves when session is closed
   */
  close(reason?: string): Promise<void>;

  /**
   * Force kill the session immediately.
   * @returns Promise that resolves when session is killed
   */
  kill?(): Promise<void>;
}

/**
 * Options for starting an interactive session.
 */
export interface InteractiveSessionOptions extends RunOptions {
  /** Working directory for the CLI tool */
  cwd?: string;

  /** Environment variables to pass to the CLI tool */
  env?: Record<string, string>;

  /** Initial prompt to send after session starts */
  initialPrompt?: string;

  /** Timeout for inactivity (ms) before watchdog triggers */
  inactivityTimeout?: number;

  /** Permission policy for this session */
  permissionPolicy?: 'ask' | 'auto_approve' | 'auto_deny' | 'smart';
}

/**
 * Adapter that supports interactive PTY-based sessions.
 * Extends the base Adapter interface with interactive capabilities.
 */
export interface InteractiveAdapter extends Adapter {
  /**
   * Indicates this adapter supports interactive mode.
   * Used for type narrowing and capability detection.
   */
  supportsInteractive: true;

  /**
   * Start an interactive session with the CLI tool.
   * The session allows real-time interaction with prompts and output.
   * @param options - Configuration for the session
   * @returns Promise resolving to an InteractiveSession
   */
  startInteractive(options?: InteractiveSessionOptions): Promise<InteractiveSession>;

  /**
   * Parse output buffer to detect prompts.
   * Optional - if not provided, a default detector is used.
   * @param buffer - Current output buffer
   * @returns Detected PromptEvent or null if no prompt found
   */
  parsePrompt?(buffer: string): PromptEvent | null;

  /**
   * Get CLI-specific arguments for interactive mode.
   * @returns Array of CLI arguments
   */
  getInteractiveArgs?(): string[];
}

/**
 * Type guard to check if an adapter supports interactive mode.
 * @param adapter - Adapter to check
 * @returns True if adapter implements InteractiveAdapter
 */
export function isInteractiveAdapter(adapter: Adapter): adapter is InteractiveAdapter {
  return 'supportsInteractive' in adapter && adapter.supportsInteractive === true;
}