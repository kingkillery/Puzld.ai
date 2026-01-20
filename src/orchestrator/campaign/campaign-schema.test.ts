import { describe, test, expect } from 'bun:test';
import {
  validatePlannerOutput,
  validateSubPlannerOutput,
  validateRecoveryOutput,
  validateConflictResolutionOutput
} from './campaign-schema';

describe('campaign schema validation', () => {
  test('validatePlannerOutput accepts valid output', () => {
    const result = validatePlannerOutput({
      summary: 'ok',
      tasks: [
        {
          title: 'Task 1',
          description: 'Do thing',
          acceptanceCriteria: ['A'],
          agentHint: 'subplanner'
        }
      ],
      subPlans: [{ area: 'ui', goal: 'Plan UI' }],
      done: false
    });

    expect(result.ok).toBe(true);
  });

  test('validatePlannerOutput rejects invalid tasks', () => {
    const result = validatePlannerOutput({
      summary: 'ok',
      tasks: [{ title: 'Task 1', description: 'Do thing', acceptanceCriteria: 'bad' }],
      subPlans: [],
      done: false
    });

    expect(result.ok).toBe(false);
  });

  test('validateSubPlannerOutput enforces worker agentHint', () => {
    const result = validateSubPlannerOutput({
      summary: 'ok',
      tasks: [
        {
          title: 'Task 1',
          description: 'Do thing',
          acceptanceCriteria: ['A'],
          area: 'core',
          agentHint: 'subplanner'
        }
      ],
      done: false
    });

    expect(result.ok).toBe(false);
  });

  test('validateRecoveryOutput accepts valid output', () => {
    const result = validateRecoveryOutput({
      summary: 'resume',
      resumePlan: [{ step: '1', action: 'do', owner: 'planner' }],
      risks: [{ risk: 'drift', mitigation: 'checkpoint' }]
    });

    expect(result.ok).toBe(true);
  });

  test('validateConflictResolutionOutput rejects missing fields', () => {
    const result = validateConflictResolutionOutput({
      decision: 'merge',
      resolutionSteps: ['step1']
    });

    expect(result.ok).toBe(false);
  });
});
