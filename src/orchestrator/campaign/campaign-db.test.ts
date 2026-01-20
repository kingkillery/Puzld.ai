import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { getDatabase } from '../../memory/database';
import { upsertCampaignProject, upsertCampaignTasks, logCampaignExecution } from './campaign-db';
import type { CampaignState } from './campaign-state';

describe('campaign db persistence', () => {
  beforeEach(() => {
    const db = getDatabase();
    db.prepare("DELETE FROM campaign_execution_logs WHERE task_id LIKE 'campaign_test_%'").run();
    db.prepare("DELETE FROM campaign_tasks WHERE id LIKE 'campaign_test_%'").run();
    db.prepare("DELETE FROM campaign_projects WHERE id LIKE 'campaign_test_%'").run();
  });

  afterEach(() => {
    const db = getDatabase();
    db.prepare("DELETE FROM campaign_execution_logs WHERE task_id LIKE 'campaign_test_%'").run();
    db.prepare("DELETE FROM campaign_tasks WHERE id LIKE 'campaign_test_%'").run();
    db.prepare("DELETE FROM campaign_projects WHERE id LIKE 'campaign_test_%'").run();
  });

  test('persists project, tasks, and execution logs', () => {
    const state: CampaignState = {
      campaignId: 'campaign_test_1',
      goal: 'Test campaign',
      status: 'running',
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tasks: [
        {
          id: 'campaign_test_task_1',
          title: 'Do thing',
          description: 'Test task',
          acceptanceCriteria: ['A'],
          dependencies: [],
          assignedFiles: [],
          status: 'pending',
          attempts: 0,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ],
      checkpoints: [],
      decisions: [],
      artifacts: [],
      meta: {
        planner: 'droid:gpt-5.2-codex-medium',
        subPlanner: 'gemini:gemini-2.5-pro',
        workers: ['droid:minimax-m2.1'],
        maxWorkers: 1,
        checkpointEvery: 5,
        freshStartEvery: 25,
        autonomy: 'checkpoint',
        gitMode: 'task-branch',
        mergeStrategy: 'merge',
        useDroid: true
      }
    };

    upsertCampaignProject(state, 'main');
    upsertCampaignTasks(state);
    logCampaignExecution(state.tasks[0], 1, 'ok', null, 'diff');

    const db = getDatabase();
    const project = db.prepare('SELECT * FROM campaign_projects WHERE id = ?').get(state.campaignId) as {
      id: string;
    };
    const task = db.prepare('SELECT * FROM campaign_tasks WHERE id = ?').get('campaign_test_task_1') as { id: string };
    const logs = db.prepare('SELECT * FROM campaign_execution_logs WHERE task_id = ?').all('campaign_test_task_1') as Array<{
      task_id: string;
    }>;

    expect(project.id).toBe(state.campaignId);
    expect(task.id).toBe('campaign_test_task_1');
    expect(logs.length).toBeGreaterThan(0);
  });
});
