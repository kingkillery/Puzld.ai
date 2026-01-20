import type { CampaignState, CampaignTask } from './campaign-state.js';
import { getDatabase } from '../../memory/database.js';

let upsertProjectStmt: any | null = null;
let upsertTaskStmt: any | null = null;
let logExecutionStmt: any | null = null;

function initStatements(): void {
  const db = getDatabase();

  upsertProjectStmt = db.prepare(`
    INSERT INTO campaign_projects (id, objective, status, git_branch, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      objective = excluded.objective,
      status = excluded.status,
      git_branch = excluded.git_branch,
      updated_at = excluded.updated_at
  `);

  upsertTaskStmt = db.prepare(`
    INSERT INTO campaign_tasks (
      id, project_id, title, description, status, dependencies, step_hints,
      assigned_files, attempts, last_error, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      status = excluded.status,
      dependencies = excluded.dependencies,
      step_hints = excluded.step_hints,
      assigned_files = excluded.assigned_files,
      attempts = excluded.attempts,
      last_error = excluded.last_error,
      updated_at = excluded.updated_at
  `);

  logExecutionStmt = db.prepare(`
    INSERT INTO campaign_execution_logs (task_id, attempt_num, stdout, stderr, git_diff, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
}

function ensureStatements(): void {
  if (!upsertProjectStmt) {
    initStatements();
  }
}

export function upsertCampaignProject(
  state: CampaignState,
  gitBranch: string | null
): void {
  ensureStatements();
  const now = Date.now();
  upsertProjectStmt!.run([
    state.campaignId,
    state.goal,
    state.status,
    gitBranch,
    state.createdAt,
    now
  ]);
}

export function upsertCampaignTasks(
  state: CampaignState
): void {
  ensureStatements();
  const now = Date.now();

  for (const task of state.tasks) {
    upsertTaskStmt!.run([
      task.id,
      state.campaignId,
      task.title,
      task.description || null,
      task.status,
      JSON.stringify(task.dependencies ?? []),
      JSON.stringify(task.acceptanceCriteria ?? []),
      JSON.stringify(task.assignedFiles ?? []),
      task.attempts,
      task.lastError || null,
      task.createdAt,
      now
    ]);
  }
}

export function logCampaignExecution(
  task: CampaignTask,
  attempt: number,
  stdout: string | null,
  stderr: string | null,
  gitDiff: string | null
): void {
  ensureStatements();
  logExecutionStmt!.run([
    task.id,
    attempt,
    stdout,
    stderr,
    gitDiff,
    Date.now()
  ]);
}
