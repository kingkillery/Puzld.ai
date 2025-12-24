/**
 * Evaluation Harness Types
 *
 * Defines interfaces for eval tasks and results used to measure
 * and validate agentic loop stability across different task types.
 */

/**
 * Task categories for evaluation
 */
export type TaskCategory = 'read' | 'edit-single' | 'edit-multi' | 'debug' | 'shell';

/**
 * Expected behavior constraints for a task
 */
export interface ExpectedBehavior {
  /** Tools that should be used for this task */
  toolsAllowed: string[];
  /** Tools that must NOT be used (safety constraint) */
  toolsDenied?: string[];
  /** Maximum iterations before failure (default: 20) */
  maxIterations?: number;
  /** For read-only tasks - must not write any files */
  mustNotWrite?: boolean;
  /** For shell tasks - allowed commands patterns */
  allowedCommands?: string[];
  /** For shell tasks - denied command patterns */
  deniedCommands?: string[];
}

/**
 * Verification criteria for task completion
 */
export interface Verification {
  /** Files that should have been modified */
  filesModified?: string[];
  /** Files that should NOT have been modified */
  filesNotModified?: string[];
  /** Commands that should have been run */
  commandsRun?: string[];
  /** Strings that must appear in the final output */
  outputContains?: string[];
  /** Strings that must NOT appear in the final output */
  outputNotContains?: string[];
  /** Custom verification function (for complex checks) */
  customCheck?: string;
}

/**
 * Single evaluation task definition
 */
export interface EvalTask {
  /** Unique identifier for the task */
  id: string;
  /** Task category for grouping results */
  category: TaskCategory;
  /** Human-readable description */
  description: string;
  /** The prompt to send to the agent */
  prompt: string;
  /** Expected behavior constraints */
  expectedBehavior: ExpectedBehavior;
  /** Verification criteria */
  verification?: Verification;
  /** Optional setup context (e.g., files to create before running) */
  setup?: {
    files?: Record<string, string>;
    workingDir?: string;
  };
  /** Optional tags for filtering */
  tags?: string[];
}

/**
 * Individual score components
 */
export interface Scores {
  /** Did the task produce expected output/changes? (0-100) */
  correctness: number;
  /** Were all safety constraints respected? (0 or 100 - binary) */
  safety: number;
  /** Was the task completed efficiently? (0-100) */
  efficiency: number;
}

/**
 * Violation record for tracking safety/constraint failures
 */
export interface Violation {
  /** Type of violation */
  type: 'denied_tool' | 'write_on_readonly' | 'denied_command' | 'max_iterations' | 'other';
  /** Description of the violation */
  description: string;
  /** Related tool/command if applicable */
  tool?: string;
  /** Timestamp when violation occurred */
  timestamp?: number;
}

/**
 * Result from running a single evaluation task
 */
export interface EvalResult {
  /** Task ID this result is for */
  taskId: string;
  /** Task category */
  category: TaskCategory;
  /** Whether the task passed overall */
  passed: boolean;
  /** Individual score components */
  scores: Scores;
  /** Number of iterations taken */
  iterations: number;
  /** Total tool calls made */
  toolCallCount: number;
  /** List of tools that were called */
  toolsUsed: string[];
  /** Duration in milliseconds */
  duration: number;
  /** Files that were modified (if any) */
  filesModified: string[];
  /** Commands that were run (if any) */
  commandsRun: string[];
  /** Final output from the agent */
  output: string;
  /** Any violations detected */
  violations: Violation[];
  /** Error message if task failed */
  error?: string;
  /** Timestamp when evaluation ran */
  timestamp: number;
}

/**
 * Summary statistics for a category of tasks
 */
export interface CategorySummary {
  /** Task category */
  category: TaskCategory;
  /** Total tasks in this category */
  total: number;
  /** Number of passed tasks */
  passed: number;
  /** Number of failed tasks */
  failed: number;
  /** Average correctness score */
  avgCorrectness: number;
  /** Safety score (100% = all tasks safe) */
  safetyScore: number;
  /** Average efficiency score */
  avgEfficiency: number;
  /** Total violations in this category */
  violations: number;
}

/**
 * Overall evaluation run results
 */
export interface EvalRunResults {
  /** Unique run identifier */
  runId: string;
  /** When the evaluation started */
  startTime: number;
  /** When the evaluation ended */
  endTime: number;
  /** Total duration in milliseconds */
  duration: number;
  /** Total tasks evaluated */
  totalTasks: number;
  /** Total passed */
  totalPassed: number;
  /** Total failed */
  totalFailed: number;
  /** Overall safety score (must be 100% to pass) */
  overallSafetyScore: number;
  /** Overall correctness score */
  overallCorrectnessScore: number;
  /** Overall efficiency score */
  overallEfficiencyScore: number;
  /** Per-category summaries */
  categorySummaries: CategorySummary[];
  /** Individual task results */
  results: EvalResult[];
  /** Whether the overall run passed (safety must be 100%) */
  overallPassed: boolean;
}

/**
 * Configuration for the eval runner
 */
export interface EvalRunnerConfig {
  /** Directory containing task JSON files */
  tasksDir: string;
  /** Directory to write results */
  resultsDir: string;
  /** Which categories to run (empty = all) */
  categories?: TaskCategory[];
  /** Specific task IDs to run (empty = all) */
  taskIds?: string[];
  /** Maximum iterations per task (overrides task config) */
  maxIterations?: number;
  /** Whether to run in mock mode (no actual LLM calls) */
  mockMode?: boolean;
  /** Adapter name to use for evaluation */
  adapter?: string;
  /** Working directory for task execution */
  cwd?: string;
  /** Whether to output verbose logs */
  verbose?: boolean;
}
