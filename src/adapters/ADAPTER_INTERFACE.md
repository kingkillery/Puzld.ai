# Adapter Interface Contracts

This document outlines the contracts for adapters in the Puzld.ai system. Adapters are the bridge between the core system and various AI models or game engines.

## Core Adapter Interface

All adapters must implement the `Adapter` interface defined in `src/lib/types.ts`.

### `Adapter`

```typescript
interface Adapter {
  /**
   * The unique name of the adapter (e.g., 'claude', 'gemini', 'ollama').
   * Used for configuration and routing.
   */
  name: string;

  /**
   * Executes a prompt against the adapter's underlying model or engine.
   *
   * @param prompt - The input text or command to process.
   * @param options - Optional configuration for this specific run.
   * @returns A promise resolving to the model's response.
   */
  run(prompt: string, options?: RunOptions): Promise<ModelResponse>;

  /**
   * Checks if the adapter is currently available (e.g., binary installed, API reachable).
   *
   * @returns A promise resolving to true if available, false otherwise.
   */
  isAvailable(): Promise<boolean>;
}
```

### `RunOptions`

Options passed to the `run` method to control execution.

```typescript
interface RunOptions {
  /** Signal to abort the operation */
  signal?: AbortSignal;
  /** Callback for streaming response chunks */
  onChunk?: (chunk: string) => void;
  /** Callback for tool use events */
  onToolEvent?: (event: StreamEvent) => void;
  /** Specific model identifier to use (e.g., 'gpt-4', 'claude-3-opus') */
  model?: string;
  /** Whether to disable native tool calling capabilities */
  disableTools?: boolean;
  /** Initial state for game adapters */
  state?: unknown;
  /** Configuration for Ralph Wiggum retry loops */
  ralphWiggum?: RalphWiggumOptions;
}
```

### `ModelResponse`

The standardized output from an adapter.

```typescript
interface ModelResponse {
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
  /** Updated state for game adapters */
  state?: unknown;
}
```

## Game Adapter Interface

Adapters that manage game state (like 'crush', 'factory') implement `GameAdapter`.

### `GameAdapter`

Extends `Adapter`.

```typescript
interface GameAdapter extends Adapter {
  /**
   * Initializes a new game state.
   *
   * @param options - Game configuration options (difficulty, etc.).
   * @returns The initial GameState.
   */
  initializeGame(options: GameOptions): GameState;

  /**
   * Renders the current game state into a string representation.
   *
   * @param state - The current game state.
   * @returns A string visualization of the state.
   */
  renderState(state: GameState): string;

  /**
   * Optional: Validates a user command before execution.
   *
   * @param command - The command string to validate.
   * @param state - The current game state.
   * @returns Validation result (valid boolean and optional error).
   */
  validateCommand?(command: string, state: GameState): GameCommandValidation;
}
```

## Utilities

### `GameStateParser`

Located in `src/adapters/base-game-adapter.ts`.
Helper class for parsing and merging game states, often from JSON outputs of LLMs.

- `extractState(response: string): Partial<GameState> | null`: Attempts to find and parse a JSON block or object representing game state updates.
- `mergeState(current: GameState, partial: Partial<GameState>): GameState`: Merges a partial state update into the current state, handling deep merges for `data` records.
