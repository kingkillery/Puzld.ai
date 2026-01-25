/**
 * Unified "Do" Command - The Primary Entry Point
 *
 * pk-puzldai do "task" - Just works with extreme mastery.
 * Automatically selects the best execution mode, agents, and approach.
 */

import { adapters } from '../../adapters';
import { execute } from '../../executor/executor';
import { buildPKPoetPlan } from '../../executor/pk-poet-builder';
import { buildPoetiqPlan, buildSelfDiscoverPlan } from '../../executor/factory-modes-builder';
import { getProjectStructure } from '../../agentic/agent-loop';
import type { ExecutionPlan, ExecutorConfig } from '../../executor/types';
import { ui } from '../utils/ui';

/**
 * Task classification for automatic mode selection
 */
type TaskType =
  | 'implement'     // Build/create something new
  | 'fix'           // Fix a bug or issue
  | 'analyze'       // Analyze/understand code
  | 'security'      // Security analysis
  | 'refactor'      // Refactor/improve existing code
  | 'explain'       // Explain something
  | 'simple';       // Simple question/task

/**
 * Classify the task to determine best execution approach
 */
function classifyTask(task: string): TaskType {
  const lower = task.toLowerCase();

  // Security keywords
  if (
    lower.includes('security') ||
    lower.includes('vulnerabil') ||
    lower.includes('attack') ||
    lower.includes('exploit') ||
    lower.includes('penetration') ||
    lower.includes('audit')
  ) {
    return 'security';
  }

  // Implementation keywords
  if (
    lower.includes('implement') ||
    lower.includes('create') ||
    lower.includes('build') ||
    lower.includes('add') ||
    lower.includes('develop') ||
    lower.includes('make') ||
    lower.includes('write')
  ) {
    return 'implement';
  }

  // Analysis keywords - check before fix to allow "review error handling" to be analyzed
  // rather than classified as a fix task
  if (
    lower.includes('analyze') ||
    lower.includes('review') ||
    lower.includes('understand') ||
    lower.includes('investigate') ||
    lower.includes('find') ||
    lower.includes('search') ||
    lower.includes('look at')
  ) {
    return 'analyze';
  }

  // Fix keywords
  if (
    lower.includes('fix') ||
    lower.includes('bug') ||
    lower.includes('error') ||
    lower.includes('issue') ||
    lower.includes('broken') ||
    lower.includes('not working') ||
    lower.includes('failing')
  ) {
    return 'fix';
  }

  // Refactor keywords
  if (
    lower.includes('refactor') ||
    lower.includes('improve') ||
    lower.includes('optimize') ||
    lower.includes('clean up') ||
    lower.includes('restructure')
  ) {
    return 'refactor';
  }

  // Explain keywords
  if (
    lower.includes('explain') ||
    lower.includes('what is') ||
    lower.includes('how does') ||
    lower.includes('why') ||
    lower.includes('describe')
  ) {
    return 'explain';
  }

  // Default to simple for short tasks, implement for longer ones
  return task.length < 50 ? 'simple' : 'implement';
}

/**
 * Get the best available agent
 */
async function getBestAgent(): Promise<string> {
  // Preference order: claude > gemini > codex > ollama
  const preferenceOrder = ['claude', 'gemini', 'codex', 'ollama'];

  for (const agent of preferenceOrder) {
    const adapter = adapters[agent];
    if (adapter && await adapter.isAvailable()) {
      return agent;
    }
  }

  return 'claude'; // Fallback
}

/**
 * Build the appropriate execution plan based on task type
 */
async function buildSmartPlan(
  task: string,
  taskType: TaskType,
  projectStructure: string
): Promise<{ plan: ExecutionPlan; mode: string }> {
  const agent = await getBestAgent();

  switch (taskType) {
    case 'security':
      // Use adversary-style analysis then fortified implementation
      return {
        plan: buildPKPoetPlan(task, {
          depth: 'deep',
          reasonAgent: agent as any,
          discoverAgent: agent as any,
          attackAgent: agent as any,
          fortifyAgent: agent as any,
          executeAgent: agent as any,
          projectStructure,
        }),
        mode: 'PK-Poet (Security Focus)',
      };

    case 'implement':
      // Use verification-first approach
      return {
        plan: buildPoetiqPlan(task, {
          agent: agent as any,
          projectStructure,
        }),
        mode: 'Poetiq (Verification-First)',
      };

    case 'fix':
      // Use self-discover to understand, then fix
      return {
        plan: buildSelfDiscoverPlan(task, {
          agent: agent as any,
          depth: 'medium',
          projectStructure,
        }),
        mode: 'Self-Discover (Bug Analysis)',
      };

    case 'refactor':
      // Use pk-poet for comprehensive refactoring
      return {
        plan: buildPKPoetPlan(task, {
          depth: 'medium',
          reasonAgent: agent as any,
          discoverAgent: agent as any,
          attackAgent: agent as any,
          fortifyAgent: agent as any,
          executeAgent: agent as any,
          projectStructure,
        }),
        mode: 'PK-Poet (Refactor)',
      };

    case 'analyze':
    case 'explain':
      // Use self-discover for analysis
      return {
        plan: buildSelfDiscoverPlan(task, {
          agent: agent as any,
          depth: taskType === 'analyze' ? 'medium' : 'shallow',
          projectStructure,
        }),
        mode: 'Self-Discover (Analysis)',
      };

    case 'simple':
    default:
      // Direct execution with best agent
      return {
        plan: {
          id: `simple_${Date.now()}`,
          mode: 'single',
          prompt: task,
          steps: [{
            id: 'execute',
            agent: agent as any,
            action: 'prompt',
            prompt: task,
          }],
          createdAt: Date.now(),
        },
        mode: 'Direct',
      };
  }
}

interface DoCommandOptions {
  verbose?: boolean;
  verify?: string;
}

/**
 * The unified "do" command - just works
 */
export async function doCommand(
  task: string,
  options: DoCommandOptions = {}
): Promise<void> {
  ui.header('Auto-Orchestrator', 'Analyzing task and selecting best approach');
  
  const spinner = ui.spinner('Analyzing task...');

  try {
    // Classify the task
    const taskType = classifyTask(task);
    spinner.update({ text: `Task type: ${taskType}` });

    // Get project context
    const projectStructure = getProjectStructure(process.cwd());

    // Build the smart plan
    const { plan, mode } = await buildSmartPlan(task, taskType, projectStructure);

    spinner.success({ text: `Selected strategy: ${mode}` });

    if (options.verbose) {
      console.log('');
      ui.detail('Task', task);
      ui.detail('Type', taskType);
      ui.detail('Steps', plan.steps.length);
      console.log('');
    }

    // Execute the plan
    const executorConfig: ExecutorConfig = {
      maxConcurrency: 1,
      defaultTimeout: 300000,
      onEvent: (event) => {
        if (options.verbose) {
          if (event.type === 'start') {
            ui.info(`Starting step: ${event.stepId}`);
          } else if (event.type === 'complete') {
            // Quiet completion in verbose to avoid noise
          }
        }
      },
    };

    const result = await execute(plan, executorConfig);

    // Output result
    console.log('');
    if (result.status === 'completed') {
      ui.success('Execution completed successfully.');
    } else {
      ui.warn(`Execution finished with status: ${result.status}`);
    }

    if (result.finalOutput) {
      ui.divider();
      console.log(result.finalOutput);
      ui.divider();
    }

    ui.detail('Duration', `${(result.duration / 1000).toFixed(1)}s`);

  } catch (error) {
    spinner.error({ text: `Failed: ${(error as Error).message}` });
    process.exit(1);
  }
}
