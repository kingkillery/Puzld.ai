/**
 * Utility functions for execution plans
 */

/**
 * Generate a unique plan ID
 */
export function generatePlanId(prefix: string = 'plan'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Generate a unique step ID
 */
export function generateStepId(prefix: string | number, index?: number): string {
  if (typeof prefix === 'number') {
    return `step_${prefix}`;
  }
  return index !== undefined ? `${prefix}_${index}` : prefix;
}
