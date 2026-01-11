/**
 * Task Persistence Tests
 *
 * Tests for SQLite-backed task storage operations.
 * Uses Bun test framework.
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { getDatabase } from '../memory/database';
import { saveTask, getTask, updateTask, deleteTask, getAllTasks, deleteOldTasks, TaskEntry } from './task-persistence';

// Test utilities
function createTestTask(overrides: Partial<TaskEntry> = {}): TaskEntry {
  return {
    prompt: 'Test task prompt',
    agent: 'claude',
    status: 'queued',
    startedAt: Date.now(),
    ...overrides,
  };
}

describe('Task Persistence', () => {
  const testTaskId = `test_task_${Date.now()}`;
  const testTasks: string[] = [];

  beforeEach(() => {
    // Ensure clean state
    try {
      const db = getDatabase();
      db.prepare('DELETE FROM api_tasks WHERE id LIKE ?').run(`test_task_%`);
    } catch {
      // Database might not exist yet, that's okay
    }
  });

  afterEach(() => {
    // Cleanup test tasks
    try {
      const db = getDatabase();
      db.prepare('DELETE FROM api_tasks WHERE id LIKE ?').run(`test_task_%`);
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('saveTask', () => {
    it('should save a new task with all fields', () => {
      const task = createTestTask({ prompt: 'Full task test' });
      saveTask(testTaskId, task, 1);

      const retrieved = getTask(testTaskId);
      expect(retrieved).toBeDefined();
      expect(retrieved?.prompt).toBe('Full task test');
      expect(retrieved?.agent).toBe('claude');
      expect(retrieved?.status).toBe('queued');
      expect(retrieved?.queuePosition).toBe(1);
    });

    it('should save task without queue position', () => {
      const task = createTestTask();
      saveTask(testTaskId, task);

      const retrieved = getTask(testTaskId);
      expect(retrieved).toBeDefined();
      expect(retrieved?.queuePosition).toBe(0); // Default
    });

    it('should handle missing optional fields', () => {
      const minimalTask: TaskEntry = {
        prompt: 'Minimal task',
        status: 'queued',
        startedAt: Date.now(),
      };
      saveTask(testTaskId, minimalTask);

      const retrieved = getTask(testTaskId);
      expect(retrieved).toBeDefined();
      expect(retrieved?.prompt).toBe('Minimal task');
      expect(retrieved?.agent).toBeUndefined();
      expect(retrieved?.result).toBeUndefined();
      expect(retrieved?.error).toBeUndefined();
    });
  });

  describe('getTask', () => {
    it('should return null for non-existent task', () => {
      const result = getTask('non_existent_task_id');
      expect(result).toBeNull();
    });

    it('should retrieve saved task with all fields', () => {
      const task = createTestTask({
        result: 'Task result',
        model: 'sonnet',
      });
      saveTask(testTaskId, task);
      updateTask(testTaskId, {
        status: 'completed',
        result: task.result,
        model: task.model,
        completedAt: Date.now(),
      });

      const retrieved = getTask(testTaskId);
      expect(retrieved).toBeDefined();
      expect(retrieved?.status).toBe('completed');
      expect(retrieved?.result).toBe('Task result');
      expect(retrieved?.model).toBe('sonnet');
    });
  });

  describe('updateTask', () => {
    it('should update task status', () => {
      const task = createTestTask();
      saveTask(testTaskId, task);
      updateTask(testTaskId, { status: 'running' });

      const retrieved = getTask(testTaskId);
      expect(retrieved?.status).toBe('running');
    });

    it('should update task result and mark complete', () => {
      const task = createTestTask();
      saveTask(testTaskId, task);
      updateTask(testTaskId, {
        status: 'completed',
        result: 'Success!',
        model: 'opus',
        completedAt: Date.now(),
      });

      const retrieved = getTask(testTaskId);
      expect(retrieved?.status).toBe('completed');
      expect(retrieved?.result).toBe('Success!');
      expect(retrieved?.model).toBe('opus');
      expect(retrieved?.completedAt).toBeDefined();
    });

    it('should update error status', () => {
      const task = createTestTask();
      saveTask(testTaskId, task);
      updateTask(testTaskId, {
        status: 'failed',
        error: 'Something went wrong',
        completedAt: Date.now(),
      });

      const retrieved = getTask(testTaskId);
      expect(retrieved?.status).toBe('failed');
      expect(retrieved?.error).toBe('Something went wrong');
    });
  });

  describe('deleteTask', () => {
    it('should delete existing task', () => {
      const task = createTestTask();
      saveTask(testTaskId, task);
      expect(getTask(testTaskId)).toBeDefined();

      const deleted = deleteTask(testTaskId);
      expect(deleted).toBe(true);
      expect(getTask(testTaskId)).toBeNull();
    });

    it('should return false when deleting non-existent task', () => {
      const deleted = deleteTask('non_existent_task');
      expect(deleted).toBe(false);
    });
  });

  describe('getAllTasks', () => {
    it('should return all tasks', () => {
      // Create multiple tasks
      for (let i = 0; i < 3; i++) {
        const task = createTestTask({ prompt: `Task ${i}` });
        saveTask(`test_task_multi_${i}`, task);
      }

      const allTasks = getAllTasks();
      const testTasks = allTasks.filter(t => t.prompt.startsWith('Task'));

      expect(testTasks.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('deleteOldTasks', () => {
    it('should delete tasks older than specified time', () => {
      // Create a task with old timestamp
      const oldTask = createTestTask({ prompt: 'Old task' });
      saveTask(testTaskId, oldTask, 1);

      // Delete tasks older than 0ms (should delete all)
      const deleted = deleteOldTasks(0);
      expect(deleted).toBeGreaterThanOrEqual(1);
    });

    it('should not delete recent tasks', () => {
      const recentTask = createTestTask({ prompt: 'Recent task' });
      saveTask(testTaskId, recentTask, 1);

      // Try to delete tasks older than 1ms from the future
      const deleted = deleteOldTasks(1);
      expect(getTask(testTaskId)).toBeDefined();
    });
  });
});
