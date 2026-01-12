export interface TaskEntry {
  prompt: string;
  agent?: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  result?: string;
  error?: string;
  model?: string;
  startedAt: number;
  completedAt?: number;
}
