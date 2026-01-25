/**
 * Circuit Breaker for External Calls
 *
 * Protects against cascading failures when external services (LLM APIs, etc.)
 * become unavailable or degraded.
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Circuit tripped, requests fail fast without calling service
 * - HALF_OPEN: Testing if service recovered, limited requests allowed
 *
 * Transitions:
 * - CLOSED → OPEN: When failure count reaches threshold
 * - OPEN → HALF_OPEN: After recovery timeout expires
 * - HALF_OPEN → CLOSED: On successful request
 * - HALF_OPEN → OPEN: On failed request
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  /** Number of consecutive failures before opening circuit (default: 5) */
  failureThreshold: number;
  /** Time in ms to wait before attempting recovery (default: 30000) */
  recoveryTimeout: number;
  /** Number of test requests allowed in HALF_OPEN state (default: 1) */
  halfOpenRequests: number;
  /** Optional callback when state changes */
  onStateChange?: (name: string, from: CircuitState, to: CircuitState) => void;
  /** HTTP status codes that count as failures (default: 500-599, 429) */
  failureStatusCodes?: number[];
  /** Whether to count timeouts as failures (default: true) */
  countTimeoutsAsFailures?: boolean;
}

export interface CircuitStats {
  state: CircuitState;
  consecutiveFailures: number;
  totalFailures: number;
  totalSuccesses: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  lastStateChange: number;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  recoveryTimeout: 30000,
  halfOpenRequests: 1,
  failureStatusCodes: [429, 500, 501, 502, 503, 504],
  countTimeoutsAsFailures: true,
};

/**
 * Circuit Breaker instance for a named service
 */
export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private consecutiveFailures = 0;
  private totalFailures = 0;
  private totalSuccesses = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private lastStateChange = Date.now();
  private halfOpenAttempts = 0;
  private config: CircuitBreakerConfig;

  constructor(
    public readonly name: string,
    config: Partial<CircuitBreakerConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    // Check if we should transition from OPEN to HALF_OPEN
    if (this.state === 'OPEN' && this.shouldAttemptRecovery()) {
      this.transitionTo('HALF_OPEN');
    }
    return this.state;
  }

  /**
   * Get circuit statistics
   */
  getStats(): CircuitStats {
    return {
      state: this.getState(),
      consecutiveFailures: this.consecutiveFailures,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      lastStateChange: this.lastStateChange,
    };
  }

  /**
   * Check if a request should be allowed through
   */
  canExecute(): boolean {
    const currentState = this.getState();

    switch (currentState) {
      case 'CLOSED':
        return true;
      case 'OPEN':
        return false;
      case 'HALF_OPEN':
        // Allow limited requests in half-open state
        return this.halfOpenAttempts < this.config.halfOpenRequests;
    }
  }

  /**
   * Record a successful request
   */
  recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.totalSuccesses++;
    this.lastSuccessTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      // Recovery confirmed, close the circuit
      this.transitionTo('CLOSED');
      this.halfOpenAttempts = 0;
    }
  }

  /**
   * Record a failed request
   */
  recordFailure(error?: Error | string): void {
    this.consecutiveFailures++;
    this.totalFailures++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      // Recovery failed, reopen circuit
      this.transitionTo('OPEN');
      this.halfOpenAttempts = 0;
    } else if (this.state === 'CLOSED' && this.consecutiveFailures >= this.config.failureThreshold) {
      // Threshold reached, open circuit
      this.transitionTo('OPEN');
    }
  }

  /**
   * Check if an HTTP status code should count as a failure
   */
  isFailureStatus(status: number): boolean {
    return this.config.failureStatusCodes?.includes(status) ?? false;
  }

  /**
   * Manually reset the circuit to CLOSED state
   */
  reset(): void {
    this.consecutiveFailures = 0;
    this.halfOpenAttempts = 0;
    this.transitionTo('CLOSED');
  }

  /**
   * Manually trip the circuit to OPEN state
   */
  trip(): void {
    this.lastFailureTime = Date.now(); // Set failure time to prevent immediate recovery
    this.transitionTo('OPEN');
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.canExecute()) {
      const error = new CircuitOpenError(
        this.name,
        this.lastFailureTime,
        this.config.recoveryTimeout
      );
      throw error;
    }

    if (this.state === 'HALF_OPEN') {
      this.halfOpenAttempts++;
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (err) {
      // Check if this is a timeout error
      const isTimeout = err instanceof Error &&
        (err.message.includes('timeout') || err.message.includes('Timeout') ||
         err.name === 'AbortError' || err.name === 'TimeoutError');

      if (isTimeout && this.config.countTimeoutsAsFailures) {
        this.recordFailure(err as Error);
      } else {
        this.recordFailure(err as Error);
      }
      throw err;
    }
  }

  private shouldAttemptRecovery(): boolean {
    if (!this.lastFailureTime) return true;
    return Date.now() - this.lastFailureTime >= this.config.recoveryTimeout;
  }

  private transitionTo(newState: CircuitState): void {
    if (this.state === newState) return;

    const oldState = this.state;
    this.state = newState;
    this.lastStateChange = Date.now();

    this.config.onStateChange?.(this.name, oldState, newState);
  }
}

/**
 * Error thrown when circuit is open
 */
export class CircuitOpenError extends Error {
  constructor(
    public readonly serviceName: string,
    public readonly lastFailureTime: number | null,
    public readonly recoveryTimeout: number
  ) {
    const waitTime = lastFailureTime
      ? Math.max(0, recoveryTimeout - (Date.now() - lastFailureTime))
      : recoveryTimeout;

    super(
      `Circuit breaker OPEN for ${serviceName}. ` +
      `Service is unavailable. Retry in ${Math.ceil(waitTime / 1000)}s.`
    );
    this.name = 'CircuitOpenError';
  }
}

// ============================================================================
// Circuit Breaker Registry (Global Singleton)
// ============================================================================

/**
 * Global registry of circuit breakers for different services
 */
class CircuitBreakerRegistry {
  private breakers = new Map<string, CircuitBreaker>();
  private defaultConfig: Partial<CircuitBreakerConfig> = {};

  /**
   * Set default configuration for new breakers
   */
  setDefaultConfig(config: Partial<CircuitBreakerConfig>): void {
    this.defaultConfig = config;
  }

  /**
   * Get or create a circuit breaker for a service
   */
  get(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    let breaker = this.breakers.get(name);
    if (!breaker) {
      breaker = new CircuitBreaker(name, { ...this.defaultConfig, ...config });
      this.breakers.set(name, breaker);
    }
    return breaker;
  }

  /**
   * Get all registered circuit breakers
   */
  getAll(): Map<string, CircuitBreaker> {
    return new Map(this.breakers);
  }

  /**
   * Get stats for all breakers
   */
  getAllStats(): Record<string, CircuitStats> {
    const stats: Record<string, CircuitStats> = {};
    for (const [name, breaker] of this.breakers) {
      stats[name] = breaker.getStats();
    }
    return stats;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }

  /**
   * Clear all registered breakers
   */
  clear(): void {
    this.breakers.clear();
  }
}

// Global registry instance
export const circuitBreakers = new CircuitBreakerRegistry();

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Get the circuit breaker for OpenRouter API
 */
export function getOpenRouterCircuitBreaker(): CircuitBreaker {
  return circuitBreakers.get('openrouter', {
    failureThreshold: 3,
    recoveryTimeout: 30000,
    halfOpenRequests: 1,
  });
}

/**
 * Get the circuit breaker for Ollama (local, but network-based)
 */
export function getOllamaCircuitBreaker(): CircuitBreaker {
  return circuitBreakers.get('ollama', {
    failureThreshold: 5,
    recoveryTimeout: 15000, // Shorter timeout for local service
    halfOpenRequests: 2,
  });
}

/**
 * Type for a fetch-like function
 */
export type FetchFunction = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

/**
 * Create a fetch wrapper with circuit breaker protection
 */
export function createProtectedFetch(
  circuitBreaker: CircuitBreaker
): FetchFunction {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    return circuitBreaker.execute(async () => {
      const response = await fetch(input, init);

      // Check if response status indicates a service failure
      if (circuitBreaker.isFailureStatus(response.status)) {
        // Don't throw, but record as failure for circuit breaker
        // The caller can still handle the error response
        circuitBreaker.recordFailure(`HTTP ${response.status}`);
      }

      return response;
    });
  };
}

/**
 * Wrap an async function with circuit breaker protection
 */
export function withCircuitBreaker<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  circuitBreaker: CircuitBreaker
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return circuitBreaker.execute(() => fn(...args));
  }) as T;
}
