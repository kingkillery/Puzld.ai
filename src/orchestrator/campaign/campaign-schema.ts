export interface PlannerOutput {
  summary: string;
  tasks: Array<{
    id?: string;
    title: string;
    description: string;
    acceptanceCriteria: string[];
    area?: string;
    agentHint?: 'worker' | 'subplanner';
  }>;
  subPlans: Array<{
    area: string;
    goal: string;
    notes?: string;
  }>;
  done: boolean;
}

export interface SubPlannerOutput {
  summary: string;
  tasks: Array<{
    id?: string;
    title: string;
    description: string;
    acceptanceCriteria: string[];
    area: string;
    agentHint: 'worker';
  }>;
  done: boolean;
}

export interface RecoveryOutput {
  summary: string;
  resumePlan: Array<{
    step: string;
    action: string;
    owner: 'planner' | 'subplanner' | 'worker';
  }>;
  risks: Array<{
    risk: string;
    mitigation: string;
  }>;
}

export interface ConflictResolutionOutput {
  decision: string;
  resolutionSteps: string[];
  riskNotes: string[];
}

type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === 'string';
const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';
const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isString);

const isAgentHint = (value: unknown): value is 'worker' | 'subplanner' =>
  value === 'worker' || value === 'subplanner' || value === undefined;

const isOwner = (value: unknown): value is 'planner' | 'subplanner' | 'worker' =>
  value === 'planner' || value === 'subplanner' || value === 'worker';

export function validatePlannerOutput(value: unknown): ValidationResult<PlannerOutput> {
  if (!isRecord(value)) {
    return { ok: false, error: 'Planner output is not an object' };
  }

  const { summary, tasks, subPlans, done } = value;
  if (!isString(summary) || !Array.isArray(tasks) || !Array.isArray(subPlans) || !isBoolean(done)) {
    return { ok: false, error: 'Planner output missing required fields' };
  }

  for (const task of tasks) {
    if (!isRecord(task)) {
      return { ok: false, error: 'Planner task is not an object' };
    }

    if (!isString(task.title) || !isString(task.description) || !isStringArray(task.acceptanceCriteria)) {
      return { ok: false, error: 'Planner task has invalid fields' };
    }

    if (!isAgentHint(task.agentHint)) {
      return { ok: false, error: 'Planner task has invalid agentHint' };
    }
  }

  for (const plan of subPlans) {
    if (!isRecord(plan) || !isString(plan.area) || !isString(plan.goal)) {
      return { ok: false, error: 'Planner sub-plan has invalid fields' };
    }
  }

  return { ok: true, value: value as unknown as PlannerOutput };
}

export function validateSubPlannerOutput(value: unknown): ValidationResult<SubPlannerOutput> {
  if (!isRecord(value)) {
    return { ok: false, error: 'Sub-planner output is not an object' };
  }

  const { summary, tasks, done } = value;
  if (!isString(summary) || !Array.isArray(tasks) || !isBoolean(done)) {
    return { ok: false, error: 'Sub-planner output missing required fields' };
  }

  for (const task of tasks) {
    if (!isRecord(task)) {
      return { ok: false, error: 'Sub-planner task is not an object' };
    }

    if (!isString(task.title) || !isString(task.description) || !isStringArray(task.acceptanceCriteria)) {
      return { ok: false, error: 'Sub-planner task has invalid fields' };
    }

    if (!isString(task.area) || task.agentHint !== 'worker') {
      return { ok: false, error: 'Sub-planner task must target worker' };
    }
  }

  return { ok: true, value: value as unknown as SubPlannerOutput };
}

export function validateRecoveryOutput(value: unknown): ValidationResult<RecoveryOutput> {
  if (!isRecord(value)) {
    return { ok: false, error: 'Recovery output is not an object' };
  }

  const { summary, resumePlan, risks } = value;
  if (!isString(summary) || !Array.isArray(resumePlan) || !Array.isArray(risks)) {
    return { ok: false, error: 'Recovery output missing required fields' };
  }

  for (const step of resumePlan) {
    if (!isRecord(step) || !isString(step.step) || !isString(step.action) || !isOwner(step.owner)) {
      return { ok: false, error: 'Recovery resume plan has invalid fields' };
    }
  }

  for (const risk of risks) {
    if (!isRecord(risk) || !isString(risk.risk) || !isString(risk.mitigation)) {
      return { ok: false, error: 'Recovery risks have invalid fields' };
    }
  }

  return { ok: true, value: value as unknown as RecoveryOutput };
}

export function validateConflictResolutionOutput(
  value: unknown
): ValidationResult<ConflictResolutionOutput> {
  if (!isRecord(value)) {
    return { ok: false, error: 'Conflict output is not an object' };
  }

  const { decision, resolutionSteps, riskNotes } = value;
  if (!isString(decision) || !isStringArray(resolutionSteps) || !isStringArray(riskNotes)) {
    return { ok: false, error: 'Conflict output missing required fields' };
  }

  return { ok: true, value: value as unknown as ConflictResolutionOutput };
}
