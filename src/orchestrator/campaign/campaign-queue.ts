import type { CampaignTask, CampaignTaskStatus } from './campaign-state.js';

export interface TaskQueue {
  pending: string[];
  inProgress: string[];
  completed: string[];
  failed: string[];
  blocked: string[];
}

export function createQueueFromTasks(tasks: CampaignTask[]): TaskQueue {
  return {
    pending: tasks.filter(t => t.status === 'pending').map(t => t.id),
    inProgress: tasks.filter(t => t.status === 'in_progress').map(t => t.id),
    completed: tasks.filter(t => t.status === 'completed').map(t => t.id),
    failed: tasks.filter(t => t.status === 'failed').map(t => t.id),
    blocked: tasks.filter(t => t.status === 'blocked').map(t => t.id)
  };
}

export function getNextTask(queue: TaskQueue, tasks: CampaignTask[]): CampaignTask | null {
  // Prefer tasks that were previously attempted (failed or blocked)
  for (const taskId of [...queue.failed, ...queue.blocked]) {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.attempts < 3) {
      return task;
    }
  }

  // Then get pending tasks
  for (const taskId of queue.pending) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      return task;
    }
  }

  return null;
}

export function updateTaskStatus(
  tasks: CampaignTask[],
  taskId: string,
  newStatus: CampaignTaskStatus,
  error?: string
): CampaignTask[] {
  return tasks.map(t => {
    if (t.id !== taskId) return t;
    
    const updated: CampaignTask = {
      ...t,
      status: newStatus,
      updatedAt: Date.now()
    };

    if (newStatus === 'in_progress') {
      updated.assignee = updated.assignee || 'worker';
    }
    
    if (newStatus === 'failed' && error) {
      updated.lastError = error;
      updated.attempts += 1;
    }

    if (newStatus === 'completed') {
      updated.resultSummary = updated.resultSummary || 'Task completed';
    }

    return updated;
  });
}

export function hasWorkRemaining(queue: TaskQueue): boolean {
  return queue.pending.length > 0 ||
         queue.inProgress.length > 0 ||
         queue.failed.length > 0 ||
         queue.blocked.length > 0;
}

export function getProgress(queue: TaskQueue, totalTasks: number): number {
  const completed = queue.completed.length;
  if (totalTasks === 0) return 0;
  return Math.round((completed / totalTasks) * 100);
}
