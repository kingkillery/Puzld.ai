/**
 * Factory-Droid Mode Commands
 *
 * CLI commands for factory-droid plugin modes:
 * - poetiq: Verification-first solver
 * - adversary: Red-team attack simulation
 * - discover: Self-Discover atomic analysis
 * - codereason: Code-as-reasoning
 * - feature: Large feature workflow
 */

import {
  buildPoetiqPlan,
  buildAdversaryPlan,
  buildSelfDiscoverPlan,
  buildCodeReasonPlan,
  buildLargeFeaturePlan
} from '../../executor/factory-modes-builder';
import { execute } from '../../executor/executor';
import type { AgentName, ExecutorConfig } from '../../executor/types';
import { adapters } from '../../adapters';
import { createSpinner } from 'nanospinner';
import pc from 'picocolors';
import { getProjectStructure } from '../../agentic/agent-loop';

// ============================================================================
// POETIQ COMMAND
// ============================================================================

interface PoetiqCommandOptions {
  agent?: string;
  maxCandidates?: string;
  verify?: string;
}

export async function poetiqCommand(
  task: string,
  options: PoetiqCommandOptions
): Promise<void> {
  const spinner = createSpinner('Initializing Poetiq workflow...').start();

  try {
    const agent = (options.agent || 'claude') as AgentName;

    // Validate agent
    const adapter = adapters[agent];
    if (!adapter || !(await adapter.isAvailable())) {
      spinner.error({ text: `Agent ${agent} is not available` });
      process.exit(1);
    }

    const projectStructure = getProjectStructure(process.cwd());

    const plan = buildPoetiqPlan(task, {
      agent,
      maxCandidates: options.maxCandidates ? parseInt(options.maxCandidates, 10) : 4,
      verifyCommand: options.verify,
      projectStructure
    });

    spinner.success({ text: 'Workflow initialized' });

    console.log('');
    console.log(pc.bold(pc.blue('=== POETIQ: Verification-First Solver ===')));
    console.log(pc.dim('FORMALIZE → TEST → DIVERGE → CONVERGE → SELECT'));
    console.log('');
    console.log(pc.dim('Task:'), task);
    console.log(pc.dim('Agent:'), agent);
    console.log('');

    const executorConfig: ExecutorConfig = {
      maxConcurrency: 1,
      defaultTimeout: 300000,
      onEvent: (event) => {
        if (event.type === 'start') {
          const step = plan.steps.find(s => s.id === event.stepId);
          console.log(pc.cyan(`\n▶ ${step?.id.split('_')[0].toUpperCase()}`));
        } else if (event.type === 'complete') {
          console.log(pc.green(`✓ Phase complete`));
        }
      }
    };

    const result = await execute(plan, executorConfig);

    console.log('');
    console.log(pc.bold('=== POETIQ Complete ==='));
    console.log(pc.dim('Status:'), result.status === 'completed' ? pc.green('Success') : pc.red(result.status));
    console.log(pc.dim('Duration:'), `${(result.duration / 1000).toFixed(1)}s`);

    if (result.finalOutput) {
      console.log('');
      console.log(result.finalOutput);
    }

  } catch (error) {
    spinner.error({ text: `Workflow failed: ${(error as Error).message}` });
    process.exit(1);
  }
}

// ============================================================================
// ADVERSARY COMMAND
// ============================================================================

interface AdversaryCommandOptions {
  agent?: string;
  files?: string;
  maxVectors?: string;
}

export async function adversaryCommand(
  task: string,
  options: AdversaryCommandOptions
): Promise<void> {
  const spinner = createSpinner('Initializing Adversary analysis...').start();

  try {
    const agent = (options.agent || 'claude') as AgentName;

    const adapter = adapters[agent];
    if (!adapter || !(await adapter.isAvailable())) {
      spinner.error({ text: `Agent ${agent} is not available` });
      process.exit(1);
    }

    const projectStructure = getProjectStructure(process.cwd());
    const targetFiles = options.files ? options.files.split(',').map(f => f.trim()) : [];

    const plan = buildAdversaryPlan(task, {
      agent,
      targetFiles,
      maxAttackVectors: options.maxVectors ? parseInt(options.maxVectors, 10) : 15,
      projectStructure
    });

    spinner.success({ text: 'Analysis initialized' });

    console.log('');
    console.log(pc.bold(pc.red('=== ADVERSARY: Red-Team Attack Simulation ===')));
    console.log(pc.dim('SURFACE → VULNERABILITIES → POC → MITIGATE'));
    console.log('');
    console.log(pc.dim('Target:'), task);
    console.log(pc.dim('Agent:'), agent);
    if (targetFiles.length > 0) {
      console.log(pc.dim('Files:'), targetFiles.join(', '));
    }
    console.log('');

    const executorConfig: ExecutorConfig = {
      maxConcurrency: 1,
      defaultTimeout: 300000,
      onEvent: (event) => {
        if (event.type === 'start') {
          const step = plan.steps.find(s => s.id === event.stepId);
          console.log(pc.red(`\n⚔️  ${step?.id.split('_')[0].toUpperCase()}`));
        } else if (event.type === 'complete') {
          console.log(pc.yellow(`✓ Phase complete`));
        }
      }
    };

    const result = await execute(plan, executorConfig);

    console.log('');
    console.log(pc.bold(pc.red('=== ADVERSARY Report Complete ===')));
    console.log(pc.dim('Status:'), result.status === 'completed' ? pc.green('Complete') : pc.red(result.status));
    console.log(pc.dim('Duration:'), `${(result.duration / 1000).toFixed(1)}s`);

    if (result.finalOutput) {
      console.log('');
      console.log(result.finalOutput);
    }

  } catch (error) {
    spinner.error({ text: `Analysis failed: ${(error as Error).message}` });
    process.exit(1);
  }
}

// ============================================================================
// DISCOVER COMMAND (Self-Discover)
// ============================================================================

interface DiscoverCommandOptions {
  agent?: string;
  depth?: string;
}

export async function discoverCommand(
  task: string,
  options: DiscoverCommandOptions
): Promise<void> {
  const spinner = createSpinner('Initializing Self-Discover analysis...').start();

  try {
    const agent = (options.agent || 'claude') as AgentName;
    const depth = (options.depth || 'medium') as 'shallow' | 'medium' | 'deep';

    const adapter = adapters[agent];
    if (!adapter || !(await adapter.isAvailable())) {
      spinner.error({ text: `Agent ${agent} is not available` });
      process.exit(1);
    }

    const projectStructure = getProjectStructure(process.cwd());

    const plan = buildSelfDiscoverPlan(task, {
      agent,
      depth,
      projectStructure
    });

    spinner.success({ text: 'Analysis initialized' });

    console.log('');
    console.log(pc.bold(pc.magenta('=== SELF-DISCOVER v5: Atomic Analysis ===')));
    console.log(pc.dim('SELECT → IMPLEMENT → VERIFY'));
    console.log('');
    console.log(pc.dim('Task:'), task);
    console.log(pc.dim('Agent:'), agent);
    console.log(pc.dim('Depth:'), depth);
    console.log('');

    const executorConfig: ExecutorConfig = {
      maxConcurrency: 1,
      defaultTimeout: 300000,
      onEvent: (event) => {
        if (event.type === 'start') {
          const step = plan.steps.find(s => s.id === event.stepId);
          console.log(pc.magenta(`\n🔍 ${step?.id.split('_')[0].toUpperCase()}`));
        } else if (event.type === 'complete') {
          console.log(pc.green(`✓ Phase complete`));
        }
      }
    };

    const result = await execute(plan, executorConfig);

    console.log('');
    console.log(pc.bold(pc.magenta('=== SELF-DISCOVER Complete ===')));
    console.log(pc.dim('Status:'), result.status === 'completed' ? pc.green('Complete') : pc.red(result.status));
    console.log(pc.dim('Duration:'), `${(result.duration / 1000).toFixed(1)}s`);

    if (result.finalOutput) {
      console.log('');
      console.log(result.finalOutput);
    }

  } catch (error) {
    spinner.error({ text: `Analysis failed: ${(error as Error).message}` });
    process.exit(1);
  }
}

// ============================================================================
// CODEREASON COMMAND
// ============================================================================

interface CodeReasonCommandOptions {
  agent?: string;
  language?: string;
}

export async function codereasonCommand(
  task: string,
  options: CodeReasonCommandOptions
): Promise<void> {
  const spinner = createSpinner('Initializing Code-Reason workflow...').start();

  try {
    const agent = (options.agent || 'claude') as AgentName;
    const language = options.language || 'python';

    const adapter = adapters[agent];
    if (!adapter || !(await adapter.isAvailable())) {
      spinner.error({ text: `Agent ${agent} is not available` });
      process.exit(1);
    }

    const projectStructure = getProjectStructure(process.cwd());

    const plan = buildCodeReasonPlan(task, {
      agent,
      language,
      projectStructure
    });

    spinner.success({ text: 'Workflow initialized' });

    console.log('');
    console.log(pc.bold(pc.cyan('=== CODE-REASON: Think in Code ===')));
    console.log(pc.dim('FORMALIZE → CODE → EXECUTE → VERIFY'));
    console.log('');
    console.log(pc.dim('Problem:'), task);
    console.log(pc.dim('Agent:'), agent);
    console.log(pc.dim('Language:'), language);
    console.log('');

    const executorConfig: ExecutorConfig = {
      maxConcurrency: 1,
      defaultTimeout: 300000,
      onEvent: (event) => {
        if (event.type === 'start') {
          const step = plan.steps.find(s => s.id === event.stepId);
          console.log(pc.cyan(`\n🧠 ${step?.id.split('_')[0].toUpperCase()}`));
        } else if (event.type === 'complete') {
          console.log(pc.green(`✓ Phase complete`));
        }
      }
    };

    const result = await execute(plan, executorConfig);

    console.log('');
    console.log(pc.bold(pc.cyan('=== CODE-REASON Complete ===')));
    console.log(pc.dim('Status:'), result.status === 'completed' ? pc.green('Complete') : pc.red(result.status));
    console.log(pc.dim('Duration:'), `${(result.duration / 1000).toFixed(1)}s`);

    if (result.finalOutput) {
      console.log('');
      console.log(result.finalOutput);
    }

  } catch (error) {
    spinner.error({ text: `Workflow failed: ${(error as Error).message}` });
    process.exit(1);
  }
}

// ============================================================================
// FEATURE COMMAND (Large Feature Workflow)
// ============================================================================

interface FeatureCommandOptions {
  agent?: string;
  phases?: string;
  verify?: string;
}

export async function featureCommand(
  task: string,
  options: FeatureCommandOptions
): Promise<void> {
  const spinner = createSpinner('Initializing Feature workflow...').start();

  try {
    const agent = (options.agent || 'claude') as AgentName;
    const phases = options.phases ? parseInt(options.phases, 10) : 5;

    const adapter = adapters[agent];
    if (!adapter || !(await adapter.isAvailable())) {
      spinner.error({ text: `Agent ${agent} is not available` });
      process.exit(1);
    }

    const projectStructure = getProjectStructure(process.cwd());

    const plan = buildLargeFeaturePlan(task, {
      agent,
      phases,
      verifyCommand: options.verify,
      projectStructure
    });

    spinner.success({ text: 'Workflow initialized' });

    console.log('');
    console.log(pc.bold(pc.yellow('=== LARGE-FEATURE: Multi-Phase Workflow ===')));
    console.log(pc.dim('PLAN → EXECUTE → VALIDATE → UPDATE'));
    console.log('');
    console.log(pc.dim('Feature:'), task);
    console.log(pc.dim('Agent:'), agent);
    console.log(pc.dim('Target Phases:'), phases);
    console.log('');

    const executorConfig: ExecutorConfig = {
      maxConcurrency: 1,
      defaultTimeout: 600000,
      onEvent: (event) => {
        if (event.type === 'start') {
          const step = plan.steps.find(s => s.id === event.stepId);
          console.log(pc.yellow(`\n⚙️  ${step?.id.split('_')[0].toUpperCase()}`));
        } else if (event.type === 'complete') {
          console.log(pc.green(`✓ Phase complete`));
        }
      }
    };

    const result = await execute(plan, executorConfig);

    console.log('');
    console.log(pc.bold(pc.yellow('=== FEATURE Workflow Complete ===')));
    console.log(pc.dim('Status:'), result.status === 'completed' ? pc.green('Complete') : pc.red(result.status));
    console.log(pc.dim('Duration:'), `${(result.duration / 1000).toFixed(1)}s`);

    if (result.finalOutput) {
      console.log('');
      console.log(result.finalOutput);
    }

  } catch (error) {
    spinner.error({ text: `Workflow failed: ${(error as Error).message}` });
    process.exit(1);
  }
}
