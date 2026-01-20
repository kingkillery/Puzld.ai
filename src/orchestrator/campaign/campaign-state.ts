import { promises as fs } from 'fs';
import { resolve } from 'path';

export type CampaignStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed';
export type CampaignTaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked';

export interface CampaignTask {
  id: string;
  title: string;
  description?: string;
  acceptanceCriteria?: string[];
  dependencies?: string[];
  assignedFiles?: string[];
  area?: string;
  agentHint?: 'worker' | 'subplanner';
  status: CampaignTaskStatus;
  assignee?: string;
  attempts: number;
  lastError?: string;
  resultSummary?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CampaignCheckpoint {
  id: string;
  createdAt: number;
  summary: string;
  completedTaskIds: string[];
}

export interface CampaignDecision {
  id: string;
  createdAt: number;
  summary: string;
  rawResponse?: string;
}

export interface CampaignArtifact {
  id: string;
  createdAt: number;
  type: 'plan' | 'worker_output' | 'patch' | 'log';
  description?: string;
  path?: string;
}

export interface CampaignState {
  campaignId: string;
  goal: string;
  status: CampaignStatus;
  version: number;
  createdAt: number;
  updatedAt: number;
  tasks: CampaignTask[];
  checkpoints: CampaignCheckpoint[];
  decisions: CampaignDecision[];
  artifacts: CampaignArtifact[];
  meta: {
    planner: string;
    subPlanner: string;
    workers: string[];
    maxWorkers: number;
    checkpointEvery: number;
    freshStartEvery: number;
    autonomy: 'checkpoint' | 'auto';
    gitMode: 'task-branch' | 'campaign-branch' | 'patches';
    mergeStrategy: 'merge' | 'rebase' | 'squash';
    useDroid: boolean;
  };
}

export interface CampaignStateInit {
  campaignId: string;
  goal: string;
  planner: string;
  subPlanner: string;
  workers: string[];
  maxWorkers: number;
  checkpointEvery: number;
  freshStartEvery: number;
  autonomy: 'checkpoint' | 'auto';
  gitMode: 'task-branch' | 'campaign-branch' | 'patches';
  mergeStrategy: 'merge' | 'rebase' | 'squash';
  useDroid: boolean;
}

export function getDefaultStateDir(cwd: string): string {
  return resolve(cwd, '.campaign');
}

export function getStateFilePath(stateDir: string): string {
  return resolve(stateDir, 'campaign.json');
}

export async function ensureStateDir(stateDir: string): Promise<void> {
  await fs.mkdir(stateDir, { recursive: true });
}

export function createInitialState(init: CampaignStateInit): CampaignState {
  const now = Date.now();
  return {
    campaignId: init.campaignId,
    goal: init.goal,
    status: 'idle',
    version: 1,
    createdAt: now,
    updatedAt: now,
    tasks: [],
    checkpoints: [],
    decisions: [],
    artifacts: [],
    meta: {
      planner: init.planner,
      subPlanner: init.subPlanner,
      workers: init.workers,
      maxWorkers: init.maxWorkers,
      checkpointEvery: init.checkpointEvery,
      freshStartEvery: init.freshStartEvery,
      autonomy: init.autonomy,
      gitMode: init.gitMode,
      mergeStrategy: init.mergeStrategy,
      useDroid: init.useDroid
    }
  };
}

export async function loadCampaignState(stateFile: string): Promise<CampaignState | null> {
  try {
    const raw = await fs.readFile(stateFile, 'utf-8');
    return JSON.parse(raw) as CampaignState;
  } catch {
    return null;
  }
}

export async function saveCampaignState(
  stateFile: string,
  state: CampaignState,
  expectedVersion?: number
): Promise<void> {
  if (expectedVersion !== undefined) {
    const current = await loadCampaignState(stateFile);
    if (current && current.version !== expectedVersion) {
      throw new Error(`Campaign state version conflict (expected ${expectedVersion}, got ${current.version}).`);
    }
  }

  const nextState: CampaignState = {
    ...state,
    version: state.version + 1,
    updatedAt: Date.now()
  };

  await fs.writeFile(stateFile, JSON.stringify(nextState, null, 2), 'utf-8');
  state.version = nextState.version;
  state.updatedAt = nextState.updatedAt;
}
