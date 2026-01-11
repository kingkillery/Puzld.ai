import pc from 'picocolors';
import { adapters } from '../../adapters';
import { getConfig } from '../../lib/config';
import { routeTask, isRouterAvailable } from '../../router/router';
import { resolveAgentSelection } from '../../lib/agent-selection';
import type { AgentName } from '../../executor/types';
import type { ModelResponse } from '../../lib/types';

interface RalphOptions {
  planner?: string;
  iterations?: string;
  completion?: string;
  model?: string;
  tests?: string;
  scope?: string;
  stop?: string;
}

interface RalphPlanStep {
  id?: string;
  title?: string;
  objective?: string;
  acceptance?: string[];
  agent?: string;
  action?: string;
}

interface RalphPlan {
  questions?: string[];
  completion?: string;
  steps?: RalphPlanStep[];
}

// Budgets from guardrails
const MAX_ITERS_DEFAULT = 5;
const MAX_FILES_CHANGED = 8;
const MAX_TOOL_CALLS = 50;

const STEP_DONE_TOKEN = 'DONE';

// Track iteration state
interface RalphIterationState {
  iteration: number;
  filesChanged: Set<string>;
  toolCalls: number;
  commandsRun: string[];
  changedFiles: string[];
}

const RALPH_PLANNER_PROMPT = `You are a planning agent. Produce a comprehensive implementation plan as JSON.
Output ONLY JSON.
Schema:
{
  "questions": ["..."] or [],
  "completion": "<promise>COMPLETE</promise>",
  "steps": [
    {
      "id": "step_1",
      "title": "...",
      "objective": "...",
      "acceptance": ["..."],
      "agent": "claude|gemini|codex|ollama|mistral|factory|crush|auto",
      "action": "analyze|code|review|fix|test|summarize"
    }
  ]
}
Rules:
- If you need user input, populate questions and keep steps empty.
- Keep steps minimal and ordered.
- Use the completion phrase exactly in completion.

Task: `;

function extractJson(content: string): RalphPlan {
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON object found in response');
  }
  return JSON.parse(content.slice(start, end + 1)) as RalphPlan;
}

async function pickAgent(agent: AgentName | 'auto', prompt: string): Promise<AgentName> {
  if (agent === 'auto') {
    if (await isRouterAvailable()) {
      const route = await routeTask(prompt);
      const selection = resolveAgentSelection(route.agent as AgentName);
      return selection.agent as AgentName;
    }
    const cfg = getConfig();
    const selection = resolveAgentSelection(cfg.fallbackAgent as AgentName);
    return selection.agent as AgentName;
  }
  const selection = resolveAgentSelection(agent);
  return selection.agent as AgentName;
}

async function runAdapter(agent: AgentName, prompt: string, model?: string): Promise<ModelResponse> {
  const adapter = adapters[agent];
  if (!adapter) {
    return { content: '', model: agent, error: `Unknown agent: ${agent}` };
  }
  if (!(await adapter.isAvailable())) {
    return { content: '', model: agent, error: `Agent ${agent} is not available` };
  }

  const config = getConfig();
  const timeout = config.timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Timeout')), timeout);
  });

  try {
    const result = await Promise.race([
      adapter.run(prompt, { model }),
      timeoutPromise
    ]);
    return result;
  } catch (err) {
    return { content: '', model: agent, error: (err as Error).message };
  }
}

function buildStepPrompt(step: RalphPlanStep, task: string): string {
  const acceptance = step.acceptance?.length
    ? `Acceptance:\n- ${step.acceptance.join('\n- ')}\n`
    : '';

  return `You are executing a single step in a larger plan.
Step ID: ${step.id || 'step'}
Title: ${step.title || 'Untitled'}
Objective: ${step.objective || ''}
${acceptance}

Do the minimum work needed for this step.
If the step is complete, include the token "${STEP_DONE_TOKEN}" in your response.

Full task context:
${task}`;
}

export async function ralphCommand(task: string, options: RalphOptions): Promise<void> {
  if (!task || task.trim() === '') {
    console.error(pc.red('Error: No task provided'));
    console.log(pc.dim('Usage: pk-puzldai ralph "task" --iters 5'));
    process.exit(1);
  }

  const planner = (options.planner || 'gemini') as AgentName;
  const maxIters = options.iterations ? parseInt(options.iterations, 10) : MAX_ITERS_DEFAULT;
  const completionToken = options.completion || '<promise>COMPLETE</promise>';
  const verifyCommand = options.tests;
  const scopePattern = options.scope;

  // Validate iterations
  if (isNaN(maxIters) || maxIters < 1) {
    console.error(pc.red('Error: --iters must be a positive number'));
    process.exit(1);
  }

  console.log(pc.bold('\n🔄 Ralph Wiggum Loop'));
  console.log(pc.dim('═'.repeat(50)));
  console.log(pc.dim(`Planner: ${planner}`));
  console.log(pc.dim(`Max Iterations: ${maxIters}`));
  console.log(pc.dim(`Max Files Changed: ${MAX_FILES_CHANGED}`));
  console.log(pc.dim(`Max Tool Calls: ${MAX_TOOL_CALLS}`));
  if (verifyCommand) {
    console.log(pc.dim(`Verify: ${verifyCommand}`));
  }
  if (scopePattern) {
    console.log(pc.dim(`Scope: ${scopePattern}`));
  }
  console.log(pc.dim(`Completion token: ${completionToken}`));

  console.log(pc.bold('\n--- Planning Phase ---\n'));
  const plannerAgent = await pickAgent(planner, task);
  const planning = await runAdapter(plannerAgent, RALPH_PLANNER_PROMPT + task, options.model);
  if (planning.error) {
    console.error(pc.red(`Planning failed: ${planning.error}`));
    process.exit(1);
  }

  let plan: RalphPlan;
  try {
    plan = extractJson(planning.content);
  } catch (err) {
    console.error(pc.red(`Failed to parse plan JSON: ${(err as Error).message}`));
    console.log(planning.content);
    process.exit(1);
  }

  const questions = plan.questions || [];
  if (questions.length > 0) {
    console.log(pc.yellow('\n📋 Clarifying Questions:'));
    for (const q of questions) {
      console.log(`  • ${q}`);
    }
    console.log(pc.dim('\nPlease provide answers and retry.'));
    process.exit(2);
  }

  const steps = plan.steps || [];
  if (steps.length === 0) {
    console.error(pc.red('Plan contains no steps.'));
    process.exit(1);
  }

  console.log(pc.green(`✓ Plan created with ${steps.length} steps\n`));

  const state: RalphIterationState = {
    iteration: 0,
    filesChanged: new Set(),
    toolCalls: 0,
    commandsRun: [],
    changedFiles: []
  };

  const doneSteps = new Set<string>();

  for (let iteration = 1; iteration <= maxIters; iteration += 1) {
    state.iteration = iteration;
    console.log(pc.bold(`\n${'='.repeat(50)}`));
    console.log(pc.bold(`Iteration ${iteration}/${maxIters}`));
    console.log(pc.bold('='.repeat(50)));

    let allDone = true;

    for (const step of steps) {
      const stepId = step.id || `step_${steps.indexOf(step) + 1}`;
      if (doneSteps.has(stepId)) {
        continue;
      }

      // Check budgets
      if (state.filesChanged.size >= MAX_FILES_CHANGED) {
        console.log(pc.red(`\n⚠️  Budget exceeded: ${MAX_FILES_CHANGED} files changed`));
        console.log(pc.dim(`Files modified: ${[...state.filesChanged].join(', ')}`));
        printFinalSummary(state, 'BUDGET_EXCEEDED');
        process.exit(1);
      }

      if (state.toolCalls >= MAX_TOOL_CALLS) {
        console.log(pc.red(`\n⚠️  Budget exceeded: ${MAX_TOOL_CALLS} tool calls`));
        printFinalSummary(state, 'BUDGET_EXCEEDED');
        process.exit(1);
      }

      console.log(pc.bold(`\n▶ [${stepId}] ${step.title || step.objective || 'Untitled'}`));
      if (step.objective) {
        console.log(pc.dim(`   ${step.objective}`));
      }

      const agentName = (step.agent || 'auto') as AgentName;
      const stepAgent = await pickAgent(agentName, step.objective || task);
      console.log(pc.dim(`   Agent: ${stepAgent}`));

      const prompt = buildStepPrompt(step, task);
      const result = await runAdapter(stepAgent, prompt, options.model);
      state.toolCalls++;

      if (result.error) {
        console.log(pc.red(`   ✗ Error: ${result.error}`));
        allDone = false;
        continue;
      }

      console.log(pc.dim(`\n${result.content}`));

      if (result.content.includes(completionToken)) {
        console.log(pc.green('\n✓ Completion criteria met.'));
        printFinalSummary(state, 'DONE');
        process.exit(0);
      }

      if (result.content.includes(STEP_DONE_TOKEN)) {
        console.log(pc.green(`   ✓ ${stepId} complete`));
        doneSteps.add(stepId);
      } else {
        allDone = false;
      }

      // Extract files mentioned in response (context-aware extraction)
      // Only count files if explicitly mentioned in tool context
      const toolMatches = result.content.match(/(?:edit|create|write|update):\s*([^\s]+\.[a-z]+)/gi) || [];
      toolMatches.forEach(match => {
        const filePath = match.replace(/^(?:edit|create|write|update):\s*/, '');
        if (scopePattern) {
          // Check if file is within scope
          if (filePath.startsWith(scopePattern) || filePath.includes(scopePattern)) {
            state.filesChanged.add(filePath);
          }
        } else {
          state.filesChanged.add(filePath);
        }
      });
    }

    if (allDone && doneSteps.size === steps.length) {
      console.log(pc.green('\n✓ All steps reported DONE.'));
      printFinalSummary(state, 'DONE');
      process.exit(0);
    }
  }

  console.log(pc.yellow('\n⚠️  Max iterations reached.'));
  printFinalSummary(state, 'BUDGET_EXCEEDED');
  process.exit(1);
}

function printFinalSummary(state: RalphIterationState, status: string): void {
  console.log(pc.bold('\n' + '='.repeat(50)));
  console.log(pc.bold('Final Summary'));
  console.log(pc.bold('='.repeat(50)));
  console.log(pc.dim(`Status: ${status}`));
  console.log(pc.dim(`Iterations: ${state.iteration}`));
  console.log(pc.dim(`Files changed: ${state.filesChanged.size}`));
  if (state.filesChanged.size > 0) {
    console.log(pc.dim(`  ${[...state.filesChanged].join(', ')}`));
  }
  console.log(pc.dim(`Tool calls: ${state.toolCalls}`));
  if (state.commandsRun.length > 0) {
    console.log(pc.dim(`Commands run: ${state.commandsRun.length}`));
    state.commandsRun.forEach(cmd => console.log(pc.dim(`  $ ${cmd}`)));
  }
  console.log(pc.bold('='.repeat(50)));
}
