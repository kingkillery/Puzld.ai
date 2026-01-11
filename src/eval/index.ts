/**
 * Evaluation Harness Module
 *
 * Provides systematic testing and validation of the agentic loop
 * across different task types (read, edit, debug, shell).
 *
 * Usage:
 *   npm run eval        # Run in mock mode
 *   npm run eval:live   # Run with actual LLM
 *
 * Programmatic usage:
 *   import { runEvaluation, loadTasks } from './eval';
 */

export * from './types';
export { runEvaluation, loadTasks } from './runner';

// Approach evaluation exports
export {
  runEval,
  runEvalSuite,
  classifyTask,
  DEFAULT_EVAL_TASKS,
  type EvalResult,
  type EvalSummary,
} from './evaluator';
