/**
 * pkpoet command - Ultimate Reasoning Paradigm
 *
 * PK-Poet combines five powerful methodologies:
 * 1. Code-as-Reasoning - Express understanding through executable code
 * 2. Self-Discover - Atomic problem analysis with meta-reasoning
 * 3. Adversary - Red-team attack simulation and failure-mode analysis
 * 4. Poetic - Spec-first planning with verification-first execution
 * 5. Poetiq - Verification-first implementation with diverge/converge
 *
 * Workflow: REASON → DISCOVER → ATTACK → FORTIFY → EXECUTE
 */

import { buildPKPoetPlan } from '../../executor/pk-poet-builder';
import { execute } from '../../executor/executor';
import type { AgentName, PKPoetOptions, ExecutorConfig, PlanStep, StepResult } from '../../executor/types';
import { adapters } from '../../adapters';
import { createSpinner } from 'nanospinner';
import pc from 'picocolors';
import { getProjectStructure } from '../../agentic/agent-loop';
import * as readline from 'readline';

interface PKPoetCommandOptions {
  depth?: string;
  agent?: string;
  reasonAgent?: string;
  discoverAgent?: string;
  attackAgent?: string;
  fortifyAgent?: string;
  executeAgent?: string;
  verify?: string;
  scope?: string;
  maxIterations?: string;
  maxFiles?: string;
  interactive?: boolean;
}

/**
 * pkpoet CLI command handler
 */
export async function pkpoetCommand(
  task: string,
  options: PKPoetCommandOptions
): Promise<void> {
  const spinner = createSpinner('Initializing PK-Poet workflow...').start();

  try {
    // Parse depth
    const depth = (options.depth || 'medium') as 'shallow' | 'medium' | 'deep';
    if (!['shallow', 'medium', 'deep'].includes(depth)) {
      spinner.error({ text: `Invalid depth: ${depth}. Use shallow, medium, or deep.` });
      process.exit(1);
    }

    // Parse default agent (used for all phases if specific agents not set)
    const defaultAgent = (options.agent || 'claude') as AgentName;

    // Parse agents for each phase
    const reasonAgent = (options.reasonAgent || defaultAgent) as AgentName;
    const discoverAgent = (options.discoverAgent || defaultAgent) as AgentName;
    const attackAgent = (options.attackAgent || defaultAgent) as AgentName;
    const fortifyAgent = (options.fortifyAgent || defaultAgent) as AgentName;
    const executeAgent = (options.executeAgent || defaultAgent) as AgentName;

    // Validate all agents are available
    const allAgents = [reasonAgent, discoverAgent, attackAgent, fortifyAgent, executeAgent];
    for (const agent of new Set(allAgents)) {
      const adapter = adapters[agent];
      if (!adapter) {
        spinner.error({ text: `Unknown agent: ${agent}` });
        process.exit(1);
      }
      if (!(await adapter.isAvailable())) {
        spinner.error({ text: `Agent ${agent} is not available` });
        process.exit(1);
      }
    }

    // Parse iteration limits
    const maxIterations = options.maxIterations ? parseInt(options.maxIterations, 10) : 5;
    const maxFiles = options.maxFiles ? parseInt(options.maxFiles, 10) : 8;

    // Get project structure for context
    const projectStructure = getProjectStructure(process.cwd());

    // Build PK-Poet options
    const pkpoetOptions: PKPoetOptions = {
      depth,
      reasonAgent,
      discoverAgent,
      attackAgent,
      fortifyAgent,
      executeAgent,
      verifyCommand: options.verify,
      verifyScope: options.scope,
      maxIterations,
      maxFiles,
      projectStructure,
      interactive: options.interactive
    };

    spinner.success({ text: 'Workflow initialized' });

    // Display configuration
    console.log('');
    console.log(pc.bold(pc.magenta('╔══════════════════════════════════════════════════════════════╗')));
    console.log(pc.bold(pc.magenta('║            PK-POET: Ultimate Reasoning Paradigm              ║')));
    console.log(pc.bold(pc.magenta('║   REASON → DISCOVER → ATTACK → FORTIFY → EXECUTE            ║')));
    console.log(pc.bold(pc.magenta('╚══════════════════════════════════════════════════════════════╝')));
    console.log('');
    console.log(pc.dim('Task:'), task);
    console.log(pc.dim('Depth:'), depth);
    console.log('');
    console.log(pc.dim('Agents:'));
    console.log(pc.dim('  REASON:'), reasonAgent);
    console.log(pc.dim('  DISCOVER:'), discoverAgent);
    console.log(pc.dim('  ATTACK:'), attackAgent);
    console.log(pc.dim('  FORTIFY:'), fortifyAgent);
    console.log(pc.dim('  EXECUTE:'), executeAgent);
    console.log('');
    console.log(pc.dim('Limits:'));
    console.log(pc.dim('  Max Iterations:'), maxIterations);
    console.log(pc.dim('  Max Files:'), maxFiles);
    if (options.verify) {
      console.log(pc.dim('  Verify Command:'), options.verify);
    }
    console.log('');

    // Build the execution plan
    const plan = buildPKPoetPlan(task, pkpoetOptions);

    // Phase descriptions for display
    const phaseDescriptions: Record<string, { name: string; icon: string; color: (s: string) => string }> = {
      'reason': { name: 'REASON (Code-as-Reasoning)', icon: '🧠', color: pc.cyan },
      'discover': { name: 'DISCOVER (Self-Discover v5)', icon: '🔍', color: pc.blue },
      'attack': { name: 'ATTACK (Adversary Red-Team)', icon: '⚔️', color: pc.red },
      'fortify': { name: 'FORTIFY (Poetic Specification)', icon: '🛡️', color: pc.yellow },
      'execute': { name: 'EXECUTE (Poetiq Verification-First)', icon: '⚙️', color: pc.green },
      'summary': { name: 'SUMMARY', icon: '📊', color: pc.magenta }
    };

    // Configure executor with interactive callbacks
    const executorConfig: ExecutorConfig = {
      maxConcurrency: 1, // Sequential phases
      defaultTimeout: 600000, // 10 minutes per phase
      onEvent: (event) => {
        const step = plan.steps.find(s => s.id === event.stepId);
        if (!step) return;

        // Extract phase from step ID
        const phase = step.id.split('_')[0];
        const phaseInfo = phaseDescriptions[phase] || { name: phase, icon: '▶', color: pc.white };

        if (event.type === 'start') {
          console.log('');
          console.log(phaseInfo.color(pc.bold(`${phaseInfo.icon} Phase: ${phaseInfo.name}`)));
          console.log(phaseInfo.color('─'.repeat(60)));
        } else if (event.type === 'complete') {
          console.log(phaseInfo.color(`✓ ${phaseInfo.name} complete`));
        } else if (event.type === 'error') {
          console.log(pc.red(`✗ ${phaseInfo.name} failed: ${event.message}`));
        }
      },
      onChunk: (_stepId: string, chunk: string) => {
        // Stream output in real-time
        process.stdout.write(chunk);
      }
    };

    // Add interactive confirmation between phases if requested
    if (options.interactive) {
      executorConfig.onBeforeStep = async (step: PlanStep, _index: number, previousResults: StepResult[]) => {
        const phase = step.id.split('_')[0];

        // Show previous phase output summary before each phase
        if (phase !== 'reason' && previousResults.length > 0) {
          const lastResult = previousResults[previousResults.length - 1];
          if (lastResult?.content) {
            console.log('');
            console.log(pc.dim('Previous phase summary:'));
            const summary = lastResult.content.substring(0, 500);
            console.log(pc.dim(summary));
            if (lastResult.content.length > 500) {
              console.log(pc.dim('... (truncated)'));
            }
            console.log('');
          }

          const proceed = await promptYesNo(`Continue to ${phase.toUpperCase()} phase? (y/n): `);
          if (!proceed) {
            console.log(pc.yellow('Workflow stopped by user'));
            return { proceed: false };
          }
        }

        return { proceed: true };
      };
    }

    // Execute the workflow
    const result = await execute(plan, executorConfig);

    // Display results
    console.log('');
    console.log(pc.bold(pc.magenta('╔══════════════════════════════════════════════════════════════╗')));
    console.log(pc.bold(pc.magenta('║                    PK-POET COMPLETE                          ║')));
    console.log(pc.bold(pc.magenta('╚══════════════════════════════════════════════════════════════╝')));
    console.log('');

    // Status
    const statusColor = result.status === 'completed' ? pc.green : pc.red;
    console.log(pc.dim('Status:'), statusColor(result.status.toUpperCase()));
    console.log(pc.dim('Duration:'), `${(result.duration / 1000).toFixed(1)}s`);
    console.log('');

    // Show phase results summary
    console.log(pc.bold('Phase Results:'));
    for (const stepResult of result.results) {
      const step = plan.steps.find(s => s.id === stepResult.stepId);
      if (step) {
        const phase = step.id.split('_')[0];
        const phaseInfo = phaseDescriptions[phase];
        const icon = stepResult.status === 'completed' ? '✓' : '✗';
        const color = stepResult.status === 'completed' ? pc.green : pc.red;
        console.log(color(`  ${icon} ${phaseInfo?.name || phase}`));
      }
    }
    console.log('');

    // Show final summary if available
    const summaryResult = result.results.find(r => r.stepId.startsWith('summary'));
    if (summaryResult?.content) {
      console.log(pc.bold('Summary:'));
      console.log('');
      console.log(summaryResult.content);
    }

    // Show any errors
    const errors = result.results.filter(r => r.status === 'failed');
    if (errors.length > 0) {
      console.log('');
      console.log(pc.red('Errors:'));
      for (const err of errors) {
        const step = plan.steps.find(s => s.id === err.stepId);
        const phase = step?.id.split('_')[0] || 'unknown';
        console.log(`  - ${phase}: ${err.error}`);
      }
    }

  } catch (error) {
    spinner.error({ text: `Workflow failed: ${(error as Error).message}` });
    process.exit(1);
  }
}

/**
 * Prompt user for yes/no confirmation
 */
async function promptYesNo(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      resolve(normalized === 'y' || normalized === 'yes' || normalized === '');
    });
  });
}
