/**
 * Circuit Breaker Tests
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import {
  CircuitBreaker,
  CircuitOpenError,
  circuitBreakers,
  getOpenRouterCircuitBreaker,
  getOllamaCircuitBreaker,
} from './circuit-breaker';

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker('test-service', {
      failureThreshold: 3,
      recoveryTimeout: 100, // Short timeout for testing
      halfOpenRequests: 1,
    });
  });

  describe('initial state', () => {
    test('starts in CLOSED state', () => {
      expect(breaker.getState()).toBe('CLOSED');
    });

    test('allows execution in CLOSED state', () => {
      expect(breaker.canExecute()).toBe(true);
    });

    test('has zero failures initially', () => {
      const stats = breaker.getStats();
      expect(stats.consecutiveFailures).toBe(0);
      expect(stats.totalFailures).toBe(0);
      expect(stats.totalSuccesses).toBe(0);
    });
  });

  describe('success tracking', () => {
    test('records successes', () => {
      breaker.recordSuccess();
      breaker.recordSuccess();

      const stats = breaker.getStats();
      expect(stats.totalSuccesses).toBe(2);
      expect(stats.lastSuccessTime).not.toBeNull();
    });

    test('resets consecutive failures on success', () => {
      breaker.recordFailure();
      breaker.recordFailure();
      expect(breaker.getStats().consecutiveFailures).toBe(2);

      breaker.recordSuccess();
      expect(breaker.getStats().consecutiveFailures).toBe(0);
    });
  });

  describe('failure tracking', () => {
    test('records failures', () => {
      breaker.recordFailure();
      breaker.recordFailure();

      const stats = breaker.getStats();
      expect(stats.consecutiveFailures).toBe(2);
      expect(stats.totalFailures).toBe(2);
      expect(stats.lastFailureTime).not.toBeNull();
    });

    test('opens circuit after threshold failures', () => {
      breaker.recordFailure();
      breaker.recordFailure();
      expect(breaker.getState()).toBe('CLOSED');

      breaker.recordFailure(); // Third failure = threshold
      expect(breaker.getState()).toBe('OPEN');
    });
  });

  describe('OPEN state', () => {
    beforeEach(() => {
      // Trip the circuit
      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordFailure();
    });

    test('blocks execution in OPEN state', () => {
      expect(breaker.getState()).toBe('OPEN');
      expect(breaker.canExecute()).toBe(false);
    });

    test('transitions to HALF_OPEN after recovery timeout', async () => {
      expect(breaker.getState()).toBe('OPEN');

      // Wait for recovery timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(breaker.getState()).toBe('HALF_OPEN');
      expect(breaker.canExecute()).toBe(true);
    });
  });

  describe('HALF_OPEN state', () => {
    beforeEach(async () => {
      // Trip the circuit
      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordFailure();

      // Wait for recovery timeout
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    test('allows limited requests in HALF_OPEN state', () => {
      expect(breaker.getState()).toBe('HALF_OPEN');
      expect(breaker.canExecute()).toBe(true);
    });

    test('closes circuit on success in HALF_OPEN', () => {
      expect(breaker.getState()).toBe('HALF_OPEN');
      breaker.recordSuccess();
      expect(breaker.getState()).toBe('CLOSED');
    });

    test('reopens circuit on failure in HALF_OPEN', () => {
      expect(breaker.getState()).toBe('HALF_OPEN');
      breaker.recordFailure();
      expect(breaker.getState()).toBe('OPEN');
    });
  });

  describe('execute() method', () => {
    test('executes function and records success', async () => {
      const result = await breaker.execute(async () => 'success');

      expect(result).toBe('success');
      expect(breaker.getStats().totalSuccesses).toBe(1);
    });

    test('executes function and records failure on error', async () => {
      await expect(
        breaker.execute(async () => {
          throw new Error('test error');
        })
      ).rejects.toThrow('test error');

      expect(breaker.getStats().totalFailures).toBe(1);
    });

    test('throws CircuitOpenError when circuit is open', async () => {
      // Trip the circuit
      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordFailure();

      await expect(
        breaker.execute(async () => 'should not run')
      ).rejects.toThrow(CircuitOpenError);
    });
  });

  describe('manual controls', () => {
    test('reset() closes the circuit', () => {
      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordFailure();
      expect(breaker.getState()).toBe('OPEN');

      breaker.reset();
      expect(breaker.getState()).toBe('CLOSED');
      expect(breaker.getStats().consecutiveFailures).toBe(0);
    });

    test('trip() opens the circuit', () => {
      expect(breaker.getState()).toBe('CLOSED');
      breaker.trip();
      expect(breaker.getState()).toBe('OPEN');
    });
  });

  describe('failure status codes', () => {
    test('identifies failure status codes', () => {
      expect(breaker.isFailureStatus(429)).toBe(true);
      expect(breaker.isFailureStatus(500)).toBe(true);
      expect(breaker.isFailureStatus(503)).toBe(true);
      expect(breaker.isFailureStatus(200)).toBe(false);
      expect(breaker.isFailureStatus(400)).toBe(false);
    });
  });

  describe('state change callback', () => {
    test('calls onStateChange when state changes', () => {
      const stateChanges: Array<{ from: string; to: string }> = [];

      const breakerWithCallback = new CircuitBreaker('callback-test', {
        failureThreshold: 2,
        recoveryTimeout: 100,
        onStateChange: (name, from, to) => {
          stateChanges.push({ from, to });
        },
      });

      breakerWithCallback.recordFailure();
      breakerWithCallback.recordFailure();

      expect(stateChanges).toHaveLength(1);
      expect(stateChanges[0]).toEqual({ from: 'CLOSED', to: 'OPEN' });
    });
  });
});

describe('CircuitBreakerRegistry', () => {
  beforeEach(() => {
    circuitBreakers.clear();
  });

  test('creates and returns breakers', () => {
    const breaker1 = circuitBreakers.get('service-1');
    const breaker2 = circuitBreakers.get('service-2');

    expect(breaker1.name).toBe('service-1');
    expect(breaker2.name).toBe('service-2');
  });

  test('returns same breaker for same name', () => {
    const breaker1 = circuitBreakers.get('service-1');
    const breaker2 = circuitBreakers.get('service-1');

    expect(breaker1).toBe(breaker2);
  });

  test('getAllStats() returns stats for all breakers', () => {
    circuitBreakers.get('service-1').recordSuccess();
    circuitBreakers.get('service-2').recordFailure();

    const stats = circuitBreakers.getAllStats();

    expect(stats['service-1'].totalSuccesses).toBe(1);
    expect(stats['service-2'].totalFailures).toBe(1);
  });

  test('resetAll() resets all breakers', () => {
    const breaker1 = circuitBreakers.get('service-1', { failureThreshold: 2 });
    const breaker2 = circuitBreakers.get('service-2', { failureThreshold: 2 });

    breaker1.recordFailure();
    breaker1.recordFailure();
    breaker2.recordFailure();
    breaker2.recordFailure();

    expect(breaker1.getState()).toBe('OPEN');
    expect(breaker2.getState()).toBe('OPEN');

    circuitBreakers.resetAll();

    expect(breaker1.getState()).toBe('CLOSED');
    expect(breaker2.getState()).toBe('CLOSED');
  });
});

describe('convenience functions', () => {
  beforeEach(() => {
    circuitBreakers.clear();
  });

  test('getOpenRouterCircuitBreaker() returns configured breaker', () => {
    const breaker = getOpenRouterCircuitBreaker();

    expect(breaker.name).toBe('openrouter');
    // Default config: failureThreshold = 3
    breaker.recordFailure();
    breaker.recordFailure();
    expect(breaker.getState()).toBe('CLOSED');
    breaker.recordFailure();
    expect(breaker.getState()).toBe('OPEN');
  });

  test('getOllamaCircuitBreaker() returns configured breaker', () => {
    const breaker = getOllamaCircuitBreaker();

    expect(breaker.name).toBe('ollama');
    // Default config: failureThreshold = 5
    for (let i = 0; i < 4; i++) {
      breaker.recordFailure();
    }
    expect(breaker.getState()).toBe('CLOSED');
    breaker.recordFailure();
    expect(breaker.getState()).toBe('OPEN');
  });
});

describe('CircuitOpenError', () => {
  test('contains service information', () => {
    const error = new CircuitOpenError('test-service', Date.now() - 10000, 30000);

    expect(error.name).toBe('CircuitOpenError');
    expect(error.serviceName).toBe('test-service');
    expect(error.message).toContain('test-service');
    expect(error.message).toContain('unavailable');
  });

  test('calculates wait time correctly', () => {
    const error = new CircuitOpenError('test-service', Date.now() - 10000, 30000);

    // Should show ~20s remaining
    expect(error.message).toMatch(/Retry in \d+s/);
  });
});
