import type {
  CampaignState,
  CampaignStateInit,
  CampaignCheckpoint,
  CampaignDecision
} from './campaign-state.js';
import {
  createInitialState,
  loadCampaignState,
  saveCampaignState,
  ensureStateDir,
  getDefaultStateDir,
  getStateFilePath
} from './campaign-state.js';
import { createQueueFromTasks, getNextTask, updateTaskStatus, hasWorkRemaining } from './campaign-queue.js';
import { runPlanner, runSubPlanner, runRecoveryPlanner, runConflictResolver } from './campaign-planner.js';
import { runWorkerTask, type WorkerResult } from './campaign-worker.js';
import { resolveAgentForRole } from './campaign-agent.js';
import { CAMPAIGN_DEFAULTS } from './campaign-defaults.js';
import { buildRepoMap } from './campaign-repo-map.js';
import { getGitStatus, getRecentCommits } from '../../lib/git.js';
import {
  upsertCampaignProject,
  upsertCampaignTasks,
  logCampaignExecution
} from './campaign-db.js';
import { startObservation, logResponse } from '../../observation/logger.js';

export interface CampaignOptions {
  goal: string;
  stateDir?: string;
  planner?: string;
  subPlanner?: string;
  workers?: string[];
  maxWorkers?: number;
  checkpointEvery?: number;
  freshStartEvery?: number;
  autonomy?: 'checkpoint' | 'auto';
  gitMode?: 'task-branch' | 'campaign-branch' | 'patches';
  mergeStrategy?: 'merge' | 'rebase' | 'squash';
  useDroid?: boolean;
  dryRun?: boolean;
}

export interface CampaignResult {
  status: CampaignState['status'];
  tasksCompleted: number;
  tasksTotal: number;
  duration: number;
  checkpoints: number;
  decisions: number;
  recoverySummary?: string;
  finalSummary?: string;
  error?: string;
}

export async function runCampaign(
  options: CampaignOptions
): Promise<CampaignResult> {
  const startTime = Date.now();
  const cwd = process.cwd();
  
  // Setup state directory
  const stateDir = options.stateDir || getDefaultStateDir(cwd);
  await ensureStateDir(stateDir);
  const stateFile = getStateFilePath(stateDir);

  // Load or create state
  let state = await loadCampaignState(stateFile);
  if (!state) {
    const init: CampaignStateInit = {
      campaignId: `campaign_${Date.now()}`,
      goal: options.goal,
      planner: options.planner || CAMPAIGN_DEFAULTS.planner,
      subPlanner: options.subPlanner || CAMPAIGN_DEFAULTS.subPlanner,
      workers: options.workers || CAMPAIGN_DEFAULTS.workers,
      maxWorkers: options.maxWorkers || CAMPAIGN_DEFAULTS.maxWorkers,
      checkpointEvery: options.checkpointEvery || CAMPAIGN_DEFAULTS.checkpointEvery,
      freshStartEvery: options.freshStartEvery || CAMPAIGN_DEFAULTS.freshStartEvery,
      autonomy: options.autonomy || CAMPAIGN_DEFAULTS.autonomy,
      gitMode: options.gitMode || CAMPAIGN_DEFAULTS.gitMode,
      mergeStrategy: options.mergeStrategy || CAMPAIGN_DEFAULTS.mergeStrategy,
      useDroid: options.useDroid ?? CAMPAIGN_DEFAULTS.useDroid
    };
    state = createInitialState(init);
  } else {
    const changed = applyCampaignOverrides(state, options);
    if (changed) {
      await saveCampaignState(stateFile, state, state.version);
    }
  }

  await syncCampaignToDb(state, cwd);

  if (options.dryRun) {
    return await runDryRun(state, options);
  }

  // Main campaign loop
  state.status = 'running';
  await saveCampaignState(stateFile, state, state.version);

  let iterations = 0;
  const maxIterations = 1000; // Safety limit

  while (iterations < maxIterations && state.status === 'running') {
    iterations++;

    // Check if campaign is done
    if (!hasWorkRemaining(createQueueFromTasks(state.tasks))) {
      // Run planner to confirm completion
      const plannerAgent = await resolveAgentForRole('planner', state.meta.planner);
      const plannerInput = await buildPlannerInput(state, iterations, state.meta.freshStartEvery, cwd);
      const plannerResult = await runPlanner(
        plannerAgent.agent,
        plannerInput,
        plannerAgent.model
      );

      if (plannerResult.output?.done) {
        state.status = 'completed';
        break;
      }

      // Add new tasks from planner
      if (plannerResult.output?.tasks) {
        state.tasks = addPlannerTasks(state.tasks, plannerResult.output.tasks);
        await saveCampaignState(stateFile, state, state.version);
        await syncCampaignToDb(state, cwd);
      }
      continue;
    }

    // Get next task
    const queue = createQueueFromTasks(state.tasks);
    const task = getNextTask(queue, state.tasks);

    if (!task) {
      state.status = 'completed';
      break;
    }

    // Handle sub-planner tasks
    if (task.agentHint === 'subplanner') {
      const subPlannerAgent = await resolveAgentForRole('subplanner', state.meta.subPlanner);
      const result = await runSubPlanner(
        subPlannerAgent.agent,
        { goal: state.goal, area: task.area || 'general', notes: task.description },
        subPlannerAgent.model
      );

      if (result.output?.tasks) {
        state.tasks = addSubPlannerTasks(state.tasks, task.id, result.output.tasks);
      }

      // Mark original task as completed
      state.tasks = updateTaskStatus(state.tasks, task.id, 'completed');
      await saveCampaignState(stateFile, state, state.version);
      await syncCampaignToDb(state, cwd);
      continue;
    }

    // Execute worker task
    state.tasks = updateTaskStatus(state.tasks, task.id, 'in_progress');
    await saveCampaignState(stateFile, state, state.version);
    await syncCampaignToDb(state, cwd);

    const attemptNumber = task.attempts + 1;
    const workerResult = await runWorkerTask(
      task,
      state.meta.workers,
      cwd,
      state.meta.useDroid
    );

    if (workerResult.success) {
      state.tasks = updateTaskStatus(state.tasks, task.id, 'completed');
      state.tasks = updateTaskResult(state.tasks, task.id, workerResult.summary);
      logCampaignExecution(task, attemptNumber, workerResult.summary, null, workerResult.gitDiff || null);
    } else {
      state.tasks = updateTaskStatus(state.tasks, task.id, 'failed', workerResult.error);
      logCampaignExecution(task, attemptNumber, null, workerResult.error || 'Unknown error', workerResult.gitDiff || null);
      await maybeResolveConflict(state, stateFile, workerResult);
    }

    await saveCampaignState(stateFile, state, state.version);
    await syncCampaignToDb(state, cwd);

    // Check for checkpoint
    if (shouldCheckpoint(state, iterations)) {
      await createCheckpoint(state, stateFile, iterations);
    }

    // Check for fresh start
    if (shouldFreshStart(state, iterations)) {
      await performFreshStart(state, stateFile);
    }
  }

  // Final summary
  const duration = Date.now() - startTime;
  const completedTasks = state.tasks.filter(t => t.status === 'completed').length;
  const summary = buildFinalSummary(state, iterations, duration);

  return {
    status: state.status,
    tasksCompleted: completedTasks,
    tasksTotal: state.tasks.length,
    duration,
    checkpoints: state.checkpoints.length,
    decisions: state.decisions.length,
    finalSummary: summary
  };
}

async function runDryRun(state: CampaignState, options: CampaignOptions): Promise<CampaignResult> {
  // Run planner once to show what would happen
  const plannerAgent = await resolveAgentForRole('planner', options.planner || CAMPAIGN_DEFAULTS.planner);
  const plannerInput = await buildPlannerInput(state, 0, state.meta.freshStartEvery, process.cwd(), {
    checkpointSummary: 'Dry run - no existing state',
    openTasks: 'None',
    completedTasks: 'None',
    constraints: `Autonomy: ${options.autonomy}, Git mode: ${options.gitMode}`
  });
  const plannerResult = await runPlanner(
    plannerAgent.agent,
    plannerInput,
    plannerAgent.model
  );

  const summary = plannerResult.output
    ? `Planner output:\n${plannerResult.output.summary}\n\nTasks: ${plannerResult.output.tasks.length}\nSub-plans: ${plannerResult.output.subPlans?.length || 0}`
    : 'No planner output';

  return {
    status: 'idle',
    tasksCompleted: 0,
    tasksTotal: plannerResult.output?.tasks.length || 0,
    duration: 0,
    checkpoints: 0,
    decisions: 0,
    finalSummary: summary
  };
}

function applyCampaignOverrides(state: CampaignState, options: CampaignOptions): boolean {
  const nextMeta = { ...state.meta };
  let changed = false;

  if (options.planner) {
    nextMeta.planner = options.planner;
    changed = true;
  }

  if (options.subPlanner) {
    nextMeta.subPlanner = options.subPlanner;
    changed = true;
  }

  if (options.workers) {
    nextMeta.workers = options.workers;
    changed = true;
  }

  if (options.maxWorkers !== undefined) {
    nextMeta.maxWorkers = options.maxWorkers;
    changed = true;
  }

  if (options.checkpointEvery !== undefined) {
    nextMeta.checkpointEvery = options.checkpointEvery;
    changed = true;
  }

  if (options.freshStartEvery !== undefined) {
    nextMeta.freshStartEvery = options.freshStartEvery;
    changed = true;
  }

  if (options.autonomy) {
    nextMeta.autonomy = options.autonomy;
    changed = true;
  }

  if (options.gitMode) {
    nextMeta.gitMode = options.gitMode;
    changed = true;
  }

  if (options.mergeStrategy) {
    nextMeta.mergeStrategy = options.mergeStrategy;
    changed = true;
  }

  if (options.useDroid !== undefined) {
    nextMeta.useDroid = options.useDroid;
    changed = true;
  }

  if (changed) {
    state.meta = nextMeta;
  }

  return changed;
}

async function buildRecoveryInput(state: CampaignState, cwd: string): Promise<{
  lastCheckpoint: string;
  activeTasks: string;
  failedTasks: string;
  repoSummary: string;
}> {
  const queue = createQueueFromTasks(state.tasks);
  const activeIds = [...queue.pending, ...queue.inProgress];
  const failedIds = queue.failed;

  const lastCheckpoint = state.checkpoints.length
    ? state.checkpoints[state.checkpoints.length - 1].summary
    : 'No checkpoints yet';

  const repoMap = await buildRepoMap(cwd);
  const gitContext = await buildGitContext(cwd);

  return {
    lastCheckpoint,
    activeTasks: formatTasks(activeIds, state.tasks),
    failedTasks: formatTasks(failedIds, state.tasks),
    repoSummary: `Repo: ${cwd}\nTasks total: ${state.tasks.length}\n\nRepo Map:\n${repoMap}\n\nGit Context:\n${gitContext}`
  };
}

async function buildGitContext(cwd: string): Promise<string> {
  const status = await getGitStatus(cwd);
  if (!status.isRepo) {
    return 'Not a git repository.';
  }

  const commits = await getRecentCommits(cwd, 5);
  const commitLines = commits.length
    ? commits.map(commit => `- ${commit.hash} ${commit.message} (${commit.author}, ${commit.date})`).join('\n')
    : 'No recent commits.';

  return [
    `Branch: ${status.branch}`,
    `Dirty: ${status.isDirty}`,
    `Staged: ${status.staged.length || 0}`,
    `Unstaged: ${status.unstaged.length || 0}`,
    `Untracked: ${status.untracked.length || 0}`,
    'Recent commits:',
    commitLines
  ].join('\n');
}

async function syncCampaignToDb(state: CampaignState, cwd: string): Promise<void> {
  const status = await getGitStatus(cwd);
  const branch = status.isRepo ? status.branch : null;
  upsertCampaignProject(state, branch);
  upsertCampaignTasks(state);
}

async function buildPlannerInput(
  state: CampaignState,
  iterations: number,
  freshStartEvery: number,
  cwd: string,
  overrides?: Partial<{
    checkpointSummary: string;
    openTasks: string;
    completedTasks: string;
    constraints: string;
  }>
): Promise<{
  goal: string;
  checkpointSummary: string;
  openTasks: string;
  completedTasks: string;
  constraints: string;
  repoMap: string;
  gitContext: string;
}> {
  const queue = createQueueFromTasks(state.tasks);
  const repoMap = await buildRepoMap(cwd);
  const gitContext = await buildGitContext(cwd);
  
  // Fresh start: only show checkpoint summaries
  if (freshStartEvery > 0 && iterations % freshStartEvery === 0 && state.checkpoints.length > 0) {
    const latestCheckpoint = state.checkpoints[state.checkpoints.length - 1];
    return {
      goal: state.goal,
      checkpointSummary: overrides?.checkpointSummary || latestCheckpoint.summary,
      openTasks: overrides?.openTasks || `${queue.pending.length + queue.failed.length} tasks remaining`,
      completedTasks: overrides?.completedTasks || `${queue.completed.length} tasks completed`,
      constraints: overrides?.constraints || `Fresh start mode - working from checkpoint summary. Max workers: ${state.meta.maxWorkers}`,
      repoMap,
      gitContext
    };
  }

  // Normal mode: show full context
  return {
    goal: state.goal,
    checkpointSummary: overrides?.checkpointSummary || (state.checkpoints.length > 0
      ? state.checkpoints[state.checkpoints.length - 1].summary
      : 'No checkpoints yet'),
    openTasks: overrides?.openTasks || formatTasks(queue.pending, state.tasks),
    completedTasks: overrides?.completedTasks || formatTasks(queue.completed, state.tasks),
    constraints: overrides?.constraints || `Max workers: ${state.meta.maxWorkers}, Git mode: ${state.meta.gitMode}, Autonomy: ${state.meta.autonomy}`,
    repoMap,
    gitContext
  };
}

function formatTasks(ids: string[], tasks: CampaignState['tasks']): string {
  return ids.map(id => {
    const task = tasks.find(t => t.id === id);
    return task ? `- ${task.title} (${task.status})` : id;
  }).join('\n') || 'None';
}

function addPlannerTasks(
  existingTasks: CampaignState['tasks'],
  newTasks: Array<{
    id?: string;
    title: string;
    description: string;
    acceptanceCriteria: string[];
    area?: string;
    agentHint?: 'worker' | 'subplanner';
  }>
): CampaignState['tasks'] {
  const now = Date.now();
  const tasksToAdd = newTasks.map(t => ({
    id: t.id || `task_${now}_${Math.random().toString(36).slice(2, 8)}`,
    title: t.title,
    description: t.description,
    acceptanceCriteria: t.acceptanceCriteria,
    dependencies: [],
    assignedFiles: [],
    area: t.area,
    agentHint: t.agentHint || 'worker',
    status: 'pending' as const,
    attempts: 0,
    createdAt: now,
    updatedAt: now
  }));

  return [...existingTasks, ...tasksToAdd];
}

function addSubPlannerTasks(
  existingTasks: CampaignState['tasks'],
  parentTaskId: string,
  subTasks: Array<{
    id?: string;
    title: string;
    description: string;
    acceptanceCriteria: string[];
    area: string;
    agentHint: 'worker';
  }>
): CampaignState['tasks'] {
  const now = Date.now();
  const tasksToAdd = subTasks.map(t => ({
    id: t.id || `subtask_${now}_${Math.random().toString(36).slice(2, 8)}`,
    title: t.title,
    description: t.description,
    acceptanceCriteria: t.acceptanceCriteria,
    dependencies: [parentTaskId],
    assignedFiles: [],
    area: t.area,
    agentHint: t.agentHint,
    status: 'pending' as const,
    attempts: 0,
    createdAt: now,
    updatedAt: now
  }));

  // Remove parent task
  const filtered = existingTasks.filter(t => t.id !== parentTaskId);
  return [...filtered, ...tasksToAdd];
}

function updateTaskResult(
  tasks: CampaignState['tasks'],
  taskId: string,
  summary: string
): CampaignState['tasks'] {
  return tasks.map(t => {
    if (t.id === taskId) {
      return { ...t, resultSummary: summary };
    }
    return t;
  });
}

function shouldCheckpoint(state: CampaignState, iterations: number): boolean {
  if (state.meta.checkpointEvery <= 0) return false;
  const tasksCompleted = state.tasks.filter(t => t.status === 'completed').length;
  return tasksCompleted > 0 && tasksCompleted % state.meta.checkpointEvery === 0;
}

async function createCheckpoint(
  state: CampaignState,
  stateFile: string,
  iterations: number
): Promise<void> {
  const completedTasks = state.tasks.filter(t => t.status === 'completed');
  const checkpoint: CampaignCheckpoint = {
    id: `checkpoint_${Date.now()}`,
    createdAt: Date.now(),
    summary: `Checkpoint at iteration ${iterations}. Completed ${completedTasks.length} tasks.`,
    completedTaskIds: completedTasks.map(t => t.id)
  };

  state.checkpoints.push(checkpoint);
  await saveCampaignState(stateFile, state, state.version);

  // Log checkpoint to observations
  try {
    const obsId = startObservation({ prompt: `Checkpoint: ${checkpoint.summary}`, agent: 'campaign' });
    logResponse(obsId, { response: `Created checkpoint with ${completedTasks.length} completed tasks`, durationMs: 0 });
  } catch {
    // Silently fail if observation fails
  }
}

function shouldFreshStart(state: CampaignState, iterations: number): boolean {
  return state.meta.freshStartEvery > 0 && iterations > 0 && iterations % state.meta.freshStartEvery === 0;
}

async function performFreshStart(state: CampaignState, stateFile: string): Promise<void> {
  // Prune old decisions to keep context fresh
  const recentDecisions = state.decisions.slice(-20);
  state.decisions = recentDecisions;
  await saveCampaignState(stateFile, state, state.version);
}

async function maybeResolveConflict(
  state: CampaignState,
  stateFile: string,
  workerResult: WorkerResult
): Promise<void> {
  if (!workerResult.error) {
    return;
  }

  const plannerAgent = await resolveAgentForRole('planner', state.meta.planner);
  const conflictingFiles = workerResult.artifacts.length
    ? workerResult.artifacts.join(', ')
    : 'Unknown files';

  const conflictResult = await runConflictResolver(
    plannerAgent.agent,
    {
      conflictingFiles,
      diffSummary: workerResult.error,
      preferredStrategy: state.meta.mergeStrategy
    },
    plannerAgent.model
  );

  if (!conflictResult.output) {
    return;
  }

  state.decisions.push({
    id: `decision_${Date.now()}`,
    createdAt: Date.now(),
    summary: conflictResult.output.decision,
    rawResponse: JSON.stringify(conflictResult.output)
  });
  await saveCampaignState(stateFile, state, state.version);
}

function buildFinalSummary(state: CampaignState, iterations: number, duration: number): string {
  const completed = state.tasks.filter(t => t.status === 'completed').length;
  const failed = state.tasks.filter(t => t.status === 'failed').length;
  const blocked = state.tasks.filter(t => t.status === 'blocked').length;

  return [
    `Campaign completed after ${iterations} iterations (${(duration / 1000).toFixed(1)}s)`,
    `Status: ${state.status}`,
    `Tasks: ${completed} completed, ${failed} failed, ${blocked} blocked`,
    `Checkpoints: ${state.checkpoints.length}`,
    `Decisions: ${state.decisions.length}`
  ].join('\n');
}

export async function loadCampaign(cwd: string, stateDirOverride?: string): Promise<CampaignState | null> {
  const stateDir = stateDirOverride || getDefaultStateDir(cwd);
  const stateFile = getStateFilePath(stateDir);
  return await loadCampaignState(stateFile);
}

export async function resumeCampaign(
  cwd: string,
  options: Partial<CampaignOptions>
): Promise<CampaignResult> {
  const stateDir = options.stateDir || getDefaultStateDir(cwd);
  const stateFile = getStateFilePath(stateDir);
  const state = await loadCampaignState(stateFile);
  if (!state) {
    throw new Error('No active campaign found. Use runCampaign to start a new campaign.');
  }

  const plannerAgent = await resolveAgentForRole('planner', state.meta.planner);
  const recoveryInput = await buildRecoveryInput(state, cwd);
  const recoveryResult = await runRecoveryPlanner(
    plannerAgent.agent,
    recoveryInput,
    plannerAgent.model
  );

  let recoverySummary: string | undefined;

  if (recoveryResult.output) {
    recoverySummary = recoveryResult.output.summary;
    state.decisions.push({
      id: `decision_${Date.now()}`,
      createdAt: Date.now(),
      summary: recoveryResult.output.summary,
      rawResponse: JSON.stringify(recoveryResult.output)
    });
    await saveCampaignState(stateFile, state, state.version);
  }

  // Merge options with existing state meta
  const mergedOptions: CampaignOptions = {
    goal: state.goal,
    stateDir: options.stateDir,
    planner: options.planner || state.meta.planner,
    subPlanner: options.subPlanner || state.meta.subPlanner,
    workers: options.workers || state.meta.workers,
    maxWorkers: options.maxWorkers || state.meta.maxWorkers,
    checkpointEvery: options.checkpointEvery || state.meta.checkpointEvery,
    freshStartEvery: options.freshStartEvery || state.meta.freshStartEvery,
    autonomy: options.autonomy || state.meta.autonomy,
    gitMode: options.gitMode || state.meta.gitMode,
    mergeStrategy: options.mergeStrategy || state.meta.mergeStrategy,
    useDroid: options.useDroid ?? state.meta.useDroid,
    dryRun: options.dryRun
  };

  const result = await runCampaign(mergedOptions);
  return { ...result, recoverySummary };
}
