/**
 * Tests for ExecutionPlan validation
 *
 * These tests ensure that:
 * 1. Plans with structural issues are rejected before execution
 * 2. Duplicate step IDs are detected
 * 3. Unknown dependency references are caught
 * 4. Dependency cycles are identified
 * 5. Empty prompts and invalid agents are flagged
 */

import { describe, it, expect } from 'bun:test';
import {
  validateExecutionPlan,
  formatValidationErrors,
  assertValidPlan,
  type ValidationResult
} from './plan-validation';
import type { ExecutionPlan, PlanStep } from './types';

// Helper to create a minimal valid plan
function createValidPlan(steps: PlanStep[]): ExecutionPlan {
  return {
    id: 'test-plan',
    mode: 'pipeline',
    prompt: 'Test prompt',
    steps,
    createdAt: Date.now()
  };
}

// Helper to create a minimal valid step
function createStep(overrides: Partial<PlanStep> = {}): PlanStep {
  return {
    id: overrides.id ?? 'step1',
    agent: overrides.agent ?? 'claude',
    action: overrides.action ?? 'prompt',
    prompt: overrides.prompt ?? 'Test prompt',
    ...overrides
  };
}

// ============================================================================
// VALID PLANS
// ============================================================================

describe('Valid Plans', () => {
  it('should validate a single-step plan', () => {
    const plan = createValidPlan([createStep()]);
    const result = validateExecutionPlan(plan);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('should validate a multi-step plan without dependencies', () => {
    const plan = createValidPlan([
      createStep({ id: 'step1' }),
      createStep({ id: 'step2' }),
      createStep({ id: 'step3' })
    ]);
    const result = validateExecutionPlan(plan);
    expect(result.valid).toBe(true);
  });

  it('should validate a plan with valid dependencies', () => {
    const plan = createValidPlan([
      createStep({ id: 'step1' }),
      createStep({ id: 'step2', dependsOn: ['step1'] }),
      createStep({ id: 'step3', dependsOn: ['step1', 'step2'] })
    ]);
    const result = validateExecutionPlan(plan);
    expect(result.valid).toBe(true);
  });

  it('should validate plans with all known agents', () => {
    const agents = ['claude', 'gemini', 'codex', 'ollama', 'mistral', 'auto'] as const;
    for (const agent of agents) {
      const plan = createValidPlan([createStep({ agent })]);
      const result = validateExecutionPlan(plan);
      expect(result.valid).toBe(true);
    }
  });

  it('should validate plans with all valid actions', () => {
    const actions = ['prompt', 'analyze', 'combine', 'transform', 'validate', 'route'] as const;
    for (const action of actions) {
      const plan = createValidPlan([createStep({ action })]);
      const result = validateExecutionPlan(plan);
      expect(result.valid).toBe(true);
    }
  });

  it('should validate a plan with fallback agent', () => {
    const plan = createValidPlan([
      createStep({ fallback: 'gemini' })
    ]);
    const result = validateExecutionPlan(plan);
    expect(result.valid).toBe(true);
  });
});

// ============================================================================
// EMPTY STEPS
// ============================================================================

describe('Empty Steps Validation', () => {
  it('should reject a plan with no steps', () => {
    const plan = createValidPlan([]);
    const result = validateExecutionPlan(plan);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'EMPTY_STEPS')).toBe(true);
  });

  it('should reject a plan with undefined steps', () => {
    const plan = {
      id: 'test-plan',
      mode: 'pipeline' as const,
      prompt: 'Test prompt',
      steps: undefined as unknown as PlanStep[],
      createdAt: Date.now()
    };
    const result = validateExecutionPlan(plan);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'EMPTY_STEPS')).toBe(true);
  });
});

// ============================================================================
// DUPLICATE STEP IDS
// ============================================================================

describe('Duplicate Step ID Validation', () => {
  it('should reject duplicate step IDs', () => {
    const plan = createValidPlan([
      createStep({ id: 'duplicate' }),
      createStep({ id: 'duplicate' })
    ]);
    const result = validateExecutionPlan(plan);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'DUPLICATE_STEP_ID')).toBe(true);
  });

  it('should report each duplicate only once', () => {
    const plan = createValidPlan([
      createStep({ id: 'dup1' }),
      createStep({ id: 'dup1' }),
      createStep({ id: 'dup1' }),
      createStep({ id: 'dup2' }),
      createStep({ id: 'dup2' })
    ]);
    const result = validateExecutionPlan(plan);
    expect(result.valid).toBe(false);
    const dupErrors = result.errors.filter(e => e.code === 'DUPLICATE_STEP_ID');
    expect(dupErrors.length).toBe(2); // One for 'dup1', one for 'dup2'
  });

  it('should allow unique step IDs', () => {
    const plan = createValidPlan([
      createStep({ id: 'step-a' }),
      createStep({ id: 'step-b' }),
      createStep({ id: 'step-c' })
    ]);
    const result = validateExecutionPlan(plan);
    expect(result.errors.filter(e => e.code === 'DUPLICATE_STEP_ID').length).toBe(0);
  });
});

// ============================================================================
// UNKNOWN DEPENDENCIES
// ============================================================================

describe('Unknown Dependency Validation', () => {
  it('should reject dependencies on non-existent steps', () => {
    const plan = createValidPlan([
      createStep({ id: 'step1', dependsOn: ['nonexistent'] })
    ]);
    const result = validateExecutionPlan(plan);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'UNKNOWN_DEPENDENCY')).toBe(true);
  });

  it('should include unknown dependency ID in error details', () => {
    const plan = createValidPlan([
      createStep({ id: 'step1', dependsOn: ['missing-step'] })
    ]);
    const result = validateExecutionPlan(plan);
    const error = result.errors.find(e => e.code === 'UNKNOWN_DEPENDENCY');
    expect(error?.details?.dependencyId).toBe('missing-step');
  });

  it('should detect multiple unknown dependencies', () => {
    const plan = createValidPlan([
      createStep({ id: 'step1', dependsOn: ['unknown1', 'unknown2'] })
    ]);
    const result = validateExecutionPlan(plan);
    const unknownErrors = result.errors.filter(e => e.code === 'UNKNOWN_DEPENDENCY');
    expect(unknownErrors.length).toBe(2);
  });

  it('should detect unknown dependencies across multiple steps', () => {
    const plan = createValidPlan([
      createStep({ id: 'step1' }),
      createStep({ id: 'step2', dependsOn: ['unknown1'] }),
      createStep({ id: 'step3', dependsOn: ['unknown2'] })
    ]);
    const result = validateExecutionPlan(plan);
    const unknownErrors = result.errors.filter(e => e.code === 'UNKNOWN_DEPENDENCY');
    expect(unknownErrors.length).toBe(2);
  });

  it('should accept valid dependencies mixed with plan steps', () => {
    const plan = createValidPlan([
      createStep({ id: 'step1' }),
      createStep({ id: 'step2', dependsOn: ['step1'] })
    ]);
    const result = validateExecutionPlan(plan);
    expect(result.errors.filter(e => e.code === 'UNKNOWN_DEPENDENCY').length).toBe(0);
  });
});

// ============================================================================
// DEPENDENCY CYCLES
// ============================================================================

describe('Dependency Cycle Detection', () => {
  it('should detect direct self-dependency', () => {
    const plan = createValidPlan([
      createStep({ id: 'step1', dependsOn: ['step1'] })
    ]);
    const result = validateExecutionPlan(plan);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'SELF_DEPENDENCY')).toBe(true);
  });

  it('should detect simple A→B→A cycle', () => {
    const plan = createValidPlan([
      createStep({ id: 'A', dependsOn: ['B'] }),
      createStep({ id: 'B', dependsOn: ['A'] })
    ]);
    const result = validateExecutionPlan(plan);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'DEPENDENCY_CYCLE')).toBe(true);
  });

  it('should detect longer A→B→C→A cycle', () => {
    const plan = createValidPlan([
      createStep({ id: 'A', dependsOn: ['C'] }),
      createStep({ id: 'B', dependsOn: ['A'] }),
      createStep({ id: 'C', dependsOn: ['B'] })
    ]);
    const result = validateExecutionPlan(plan);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'DEPENDENCY_CYCLE')).toBe(true);
  });

  it('should include cycle path in error details', () => {
    const plan = createValidPlan([
      createStep({ id: 'A', dependsOn: ['B'] }),
      createStep({ id: 'B', dependsOn: ['A'] })
    ]);
    const result = validateExecutionPlan(plan);
    const cycleError = result.errors.find(e => e.code === 'DEPENDENCY_CYCLE');
    expect(cycleError?.details?.cycle).toBeDefined();
    expect(Array.isArray(cycleError?.details?.cycle)).toBe(true);
  });

  it('should allow valid DAG with no cycles', () => {
    // Diamond pattern: A→B, A→C, B→D, C→D (no cycles)
    const plan = createValidPlan([
      createStep({ id: 'A' }),
      createStep({ id: 'B', dependsOn: ['A'] }),
      createStep({ id: 'C', dependsOn: ['A'] }),
      createStep({ id: 'D', dependsOn: ['B', 'C'] })
    ]);
    const result = validateExecutionPlan(plan);
    expect(result.errors.filter(e => e.code === 'DEPENDENCY_CYCLE').length).toBe(0);
  });

  it('should detect cycle even with valid steps around it', () => {
    const plan = createValidPlan([
      createStep({ id: 'start' }),
      createStep({ id: 'A', dependsOn: ['start', 'C'] }),
      createStep({ id: 'B', dependsOn: ['A'] }),
      createStep({ id: 'C', dependsOn: ['B'] }),
      createStep({ id: 'end', dependsOn: ['C'] })
    ]);
    const result = validateExecutionPlan(plan);
    expect(result.errors.some(e => e.code === 'DEPENDENCY_CYCLE')).toBe(true);
  });
});

// ============================================================================
// EMPTY PROMPTS
// ============================================================================

describe('Empty Prompt Validation', () => {
  it('should reject empty string prompt', () => {
    const plan = createValidPlan([
      createStep({ prompt: '' })
    ]);
    const result = validateExecutionPlan(plan);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'EMPTY_PROMPT')).toBe(true);
  });

  it('should reject whitespace-only prompt', () => {
    const plan = createValidPlan([
      createStep({ prompt: '   \t\n  ' })
    ]);
    const result = validateExecutionPlan(plan);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'EMPTY_PROMPT')).toBe(true);
  });

  it('should accept non-empty prompt', () => {
    const plan = createValidPlan([
      createStep({ prompt: 'Valid prompt' })
    ]);
    const result = validateExecutionPlan(plan);
    expect(result.errors.filter(e => e.code === 'EMPTY_PROMPT').length).toBe(0);
  });
});

// ============================================================================
// EMPTY STEP ID
// ============================================================================

describe('Empty Step ID Validation', () => {
  it('should reject empty string step ID', () => {
    const plan = createValidPlan([
      createStep({ id: '' })
    ]);
    const result = validateExecutionPlan(plan);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'EMPTY_STEP_ID')).toBe(true);
  });

  it('should reject whitespace-only step ID', () => {
    const plan = createValidPlan([
      createStep({ id: '   ' })
    ]);
    const result = validateExecutionPlan(plan);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'EMPTY_STEP_ID')).toBe(true);
  });
});

// ============================================================================
// INVALID AGENTS
// ============================================================================

describe('Invalid Agent Validation', () => {
  it('should reject unknown agent name', () => {
    const plan = createValidPlan([
      createStep({ agent: 'unknown-agent' as any })
    ]);
    const result = validateExecutionPlan(plan);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'INVALID_AGENT')).toBe(true);
  });

  it('should include invalid agent name in error', () => {
    const plan = createValidPlan([
      createStep({ agent: 'fake-agent' as any })
    ]);
    const result = validateExecutionPlan(plan);
    const error = result.errors.find(e => e.code === 'INVALID_AGENT');
    expect(error?.message).toContain('fake-agent');
  });

  it('should reject invalid fallback agent', () => {
    const plan = createValidPlan([
      createStep({ fallback: 'invalid-fallback' as any })
    ]);
    const result = validateExecutionPlan(plan);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e =>
      e.code === 'INVALID_AGENT' && e.message.includes('fallback')
    )).toBe(true);
  });
});

// ============================================================================
// INVALID ACTIONS
// ============================================================================

describe('Invalid Action Validation', () => {
  it('should reject unknown action type', () => {
    const plan = createValidPlan([
      createStep({ action: 'unknown-action' as any })
    ]);
    const result = validateExecutionPlan(plan);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'INVALID_ACTION')).toBe(true);
  });

  it('should include invalid action in error message', () => {
    const plan = createValidPlan([
      createStep({ action: 'fake-action' as any })
    ]);
    const result = validateExecutionPlan(plan);
    const error = result.errors.find(e => e.code === 'INVALID_ACTION');
    expect(error?.message).toContain('fake-action');
  });
});

// ============================================================================
// MULTIPLE ERRORS
// ============================================================================

describe('Multiple Error Detection', () => {
  it('should report all errors in a single validation', () => {
    const plan = createValidPlan([
      createStep({ id: 'step1', prompt: '', agent: 'invalid' as any }),
      createStep({ id: 'step1', dependsOn: ['nonexistent'] }), // duplicate id
      createStep({ id: 'A', dependsOn: ['B'] }),
      createStep({ id: 'B', dependsOn: ['A'] })
    ]);
    const result = validateExecutionPlan(plan);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(3); // Multiple types of errors

    const errorCodes = new Set(result.errors.map(e => e.code));
    expect(errorCodes.has('EMPTY_PROMPT')).toBe(true);
    expect(errorCodes.has('INVALID_AGENT')).toBe(true);
    expect(errorCodes.has('DUPLICATE_STEP_ID')).toBe(true);
    expect(errorCodes.has('UNKNOWN_DEPENDENCY')).toBe(true);
    expect(errorCodes.has('DEPENDENCY_CYCLE')).toBe(true);
  });
});

// ============================================================================
// ERROR FORMATTING
// ============================================================================

describe('Error Formatting', () => {
  it('should format valid result correctly', () => {
    const result: ValidationResult = { valid: true, errors: [], warnings: [] };
    const formatted = formatValidationErrors(result);
    expect(formatted).toBe('Plan validation passed');
  });

  it('should format errors with step IDs', () => {
    const result: ValidationResult = {
      valid: false,
      errors: [{ code: 'EMPTY_PROMPT', message: 'Step has empty prompt', stepId: 'my-step' }],
      warnings: []
    };
    const formatted = formatValidationErrors(result);
    expect(formatted).toContain('[my-step]');
    expect(formatted).toContain('Step has empty prompt');
  });

  it('should format errors without step IDs', () => {
    const result: ValidationResult = {
      valid: false,
      errors: [{ code: 'EMPTY_STEPS', message: 'Plan has no steps' }],
      warnings: []
    };
    const formatted = formatValidationErrors(result);
    expect(formatted).toContain('Plan has no steps');
    expect(formatted).not.toContain('[]');
  });

  it('should include all errors in output', () => {
    const result: ValidationResult = {
      valid: false,
      errors: [
        { code: 'EMPTY_PROMPT', message: 'Error 1', stepId: 'step1' },
        { code: 'INVALID_AGENT', message: 'Error 2', stepId: 'step2' }
      ],
      warnings: []
    };
    const formatted = formatValidationErrors(result);
    expect(formatted).toContain('Error 1');
    expect(formatted).toContain('Error 2');
  });
});

// ============================================================================
// ASSERT VALID PLAN
// ============================================================================

describe('assertValidPlan', () => {
  it('should not throw for valid plans', () => {
    const plan = createValidPlan([createStep()]);
    expect(() => assertValidPlan(plan)).not.toThrow();
  });

  it('should throw for invalid plans', () => {
    const plan = createValidPlan([]);
    expect(() => assertValidPlan(plan)).toThrow();
  });

  it('should include error details in thrown message', () => {
    const plan = createValidPlan([
      createStep({ dependsOn: ['nonexistent'] })
    ]);
    expect(() => assertValidPlan(plan)).toThrow(/nonexistent/);
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('Edge Cases', () => {
  it('should handle steps with empty dependsOn array', () => {
    const plan = createValidPlan([
      createStep({ dependsOn: [] })
    ]);
    const result = validateExecutionPlan(plan);
    expect(result.valid).toBe(true);
  });

  it('should handle steps with undefined dependsOn', () => {
    const plan = createValidPlan([
      createStep({ dependsOn: undefined })
    ]);
    const result = validateExecutionPlan(plan);
    expect(result.valid).toBe(true);
  });

  it('should handle very long dependency chains', () => {
    const steps: PlanStep[] = [];
    for (let i = 0; i < 100; i++) {
      steps.push(createStep({
        id: `step${i}`,
        dependsOn: i > 0 ? [`step${i - 1}`] : undefined
      }));
    }
    const plan = createValidPlan(steps);
    const result = validateExecutionPlan(plan);
    expect(result.valid).toBe(true);
  });

  it('should handle complex DAGs efficiently', () => {
    // Create a complex but valid DAG
    const steps: PlanStep[] = [
      createStep({ id: 'root' }),
      createStep({ id: 'a', dependsOn: ['root'] }),
      createStep({ id: 'b', dependsOn: ['root'] }),
      createStep({ id: 'c', dependsOn: ['root'] }),
      createStep({ id: 'd', dependsOn: ['a', 'b'] }),
      createStep({ id: 'e', dependsOn: ['b', 'c'] }),
      createStep({ id: 'f', dependsOn: ['d', 'e'] })
    ];
    const plan = createValidPlan(steps);
    const result = validateExecutionPlan(plan);
    expect(result.valid).toBe(true);
  });

  it('should handle prompts with template variables', () => {
    const plan = createValidPlan([
      createStep({ id: 'step1', outputAs: 'result1' }),
      createStep({ id: 'step2', prompt: 'Use {{result1}} here', dependsOn: ['step1'] })
    ]);
    const result = validateExecutionPlan(plan);
    expect(result.valid).toBe(true);
  });
});
