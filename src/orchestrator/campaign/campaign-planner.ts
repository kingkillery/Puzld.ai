import type { AgentName } from '../../executor/types.js';
import { runAdapter } from '../../lib/adapter-runner.js';
import {
  plannerPrompt,
  subPlannerPrompt,
  recoveryPrompt,
  conflictPrompt,
  extractJsonFromResponse
} from './prompts.js';
import {
  type PlannerOutput,
  type SubPlannerOutput,
  type RecoveryOutput,
  type ConflictResolutionOutput,
  validatePlannerOutput,
  validateSubPlannerOutput,
  validateRecoveryOutput,
  validateConflictResolutionOutput
} from './campaign-schema.js';

export async function runPlanner(
  agent: AgentName,
  input: {
    goal: string;
    checkpointSummary: string;
    openTasks: string;
    completedTasks: string;
    constraints: string;
    repoMap: string;
    gitContext: string;
  },
  model?: string
): Promise<{ output: PlannerOutput | null; error?: string }> {
  const prompt = plannerPrompt(input);
  const result = await runAdapter(agent, prompt, model ? { model } : undefined);

  if (result.error) {
    return { output: null, error: result.error };
  }

  const { json, error: parseError } = extractJsonFromResponse(result.content);

  if (!json) {
    return { output: null, error: parseError || 'Failed to parse planner output' };
  }

  const validated = validatePlannerOutput(json);
  if (!validated.ok) {
    return { output: null, error: validated.error };
  }

  return { output: validated.value };
}

export async function runSubPlanner(
  agent: AgentName,
  input: {
    goal: string;
    area: string;
    notes?: string;
  },
  model?: string
): Promise<{ output: SubPlannerOutput | null; error?: string }> {
  const prompt = subPlannerPrompt(input);
  const result = await runAdapter(agent, prompt, model ? { model } : undefined);

  if (result.error) {
    return { output: null, error: result.error };
  }

  const { json, error: parseError } = extractJsonFromResponse(result.content);

  if (!json) {
    return { output: null, error: parseError || 'Failed to parse sub-planner output' };
  }

  const validated = validateSubPlannerOutput(json);
  if (!validated.ok) {
    return { output: null, error: validated.error };
  }

  return { output: validated.value };
}

export async function runRecoveryPlanner(
  agent: AgentName,
  input: {
    lastCheckpoint: string;
    activeTasks: string;
    failedTasks: string;
    repoSummary: string;
  },
  model?: string
): Promise<{ output: RecoveryOutput | null; error?: string }> {
  const prompt = recoveryPrompt(input);
  const result = await runAdapter(agent, prompt, model ? { model } : undefined);

  if (result.error) {
    return { output: null, error: result.error };
  }

  const { json, error: parseError } = extractJsonFromResponse(result.content);
  if (!json) {
    return { output: null, error: parseError || 'Failed to parse recovery output' };
  }

  const validated = validateRecoveryOutput(json);
  if (!validated.ok) {
    return { output: null, error: validated.error };
  }

  return { output: validated.value };
}

export async function runConflictResolver(
  agent: AgentName,
  input: {
    conflictingFiles: string;
    diffSummary: string;
    preferredStrategy: 'merge' | 'rebase' | 'squash';
  },
  model?: string
): Promise<{ output: ConflictResolutionOutput | null; error?: string }> {
  const prompt = conflictPrompt(input);
  const result = await runAdapter(agent, prompt, model ? { model } : undefined);

  if (result.error) {
    return { output: null, error: result.error };
  }

  const { json, error: parseError } = extractJsonFromResponse(result.content);
  if (!json) {
    return { output: null, error: parseError || 'Failed to parse conflict output' };
  }

  const validated = validateConflictResolutionOutput(json);
  if (!validated.ok) {
    return { output: null, error: validated.error };
  }

  return { output: validated.value };
}
