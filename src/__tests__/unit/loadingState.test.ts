import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LoadingTask } from '@/context/LoadingContext';

// Pure logic helper functions matching LoadingContext implementation for unit testing
class LoadingStateManager {
  private tasks: LoadingTask[] = [];
  private timeouts: Map<string, any> = new Map();

  startTask(taskInput: Omit<LoadingTask, 'id' | 'startTime'>): string {
    const id = 'task_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    const newTask: LoadingTask = {
      ...taskInput,
      id,
      startTime: Date.now(),
    };
    this.tasks.push(newTask);

    const timeout = setTimeout(() => {
      this.endTask(id);
    }, 12000);
    this.timeouts.set(id, timeout);

    return id;
  }

  updateTask(id: string, updates: Partial<Omit<LoadingTask, 'id' | 'startTime'>>) {
    this.tasks = this.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
  }

  endTask(id: string) {
    const timeout = this.timeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(id);
    }
    this.tasks = this.tasks.filter((t) => t.id !== id);
  }

  getTasks(): LoadingTask[] {
    return [...this.tasks];
  }

  isLoading(): boolean {
    return this.tasks.length > 0;
  }

  getActiveTask(): LoadingTask | null {
    return this.tasks.length > 0 ? this.tasks[this.tasks.length - 1] : null;
  }

  isNodeLoading(nodeId?: string): boolean {
    if (!nodeId) return false;
    return this.tasks.some((t) => t.nodeId === nodeId);
  }

  async runTracked<T>(
    taskInput: Omit<LoadingTask, 'id' | 'startTime'>,
    asyncFn: () => Promise<T>
  ): Promise<T> {
    const taskId = this.startTask(taskInput);
    try {
      return await asyncFn();
    } finally {
      this.endTask(taskId);
    }
  }

  clear() {
    this.timeouts.forEach((t) => clearTimeout(t));
    this.timeouts.clear();
    this.tasks = [];
  }
}

describe('LoadingStateManager — Global & Card-Level Loading Feedback', () => {
  let manager: LoadingStateManager;

  beforeEach(() => {
    vi.useFakeTimers();
    manager = new LoadingStateManager();
  });

  afterEach(() => {
    manager.clear();
    vi.useRealTimers();
  });

  it('starts idle with no active tasks', () => {
    expect(manager.isLoading()).toBe(false);
    expect(manager.getActiveTask()).toBeNull();
    expect(manager.getTasks()).toHaveLength(0);
    expect(manager.isNodeLoading('node-123')).toBe(false);
  });

  it('registers a task and marks global and node loading states', () => {
    const taskId = manager.startTask({
      label: 'Screening IDX universe ("top 5 banks")',
      category: 'screener',
      nodeId: 'node-screener-1',
    });

    expect(manager.isLoading()).toBe(true);
    expect(manager.getTasks()).toHaveLength(1);
    expect(manager.getActiveTask()?.label).toBe('Screening IDX universe ("top 5 banks")');
    expect(manager.isNodeLoading('node-screener-1')).toBe(true);
    expect(manager.isNodeLoading('node-other')).toBe(false);

    manager.endTask(taskId);
    expect(manager.isLoading()).toBe(false);
    expect(manager.getActiveTask()).toBeNull();
    expect(manager.isNodeLoading('node-screener-1')).toBe(false);
  });

  it('handles multiple concurrent tasks and maintains the latest as activeTask', () => {
    const t1 = manager.startTask({
      label: 'Streaming ticker BBCA',
      category: 'poll',
      nodeId: 'node-bbca',
    });
    const t2 = manager.startTask({
      label: 'Compiling 5 fundamental briefs',
      category: 'report',
      nodeId: 'node-action-1',
    });

    expect(manager.getTasks()).toHaveLength(2);
    expect(manager.getActiveTask()?.label).toBe('Compiling 5 fundamental briefs');
    expect(manager.isNodeLoading('node-bbca')).toBe(true);
    expect(manager.isNodeLoading('node-action-1')).toBe(true);

    // End the second task, first task should still be active
    manager.endTask(t2);
    expect(manager.getTasks()).toHaveLength(1);
    expect(manager.getActiveTask()?.label).toBe('Streaming ticker BBCA');
    expect(manager.isNodeLoading('node-bbca')).toBe(true);
    expect(manager.isNodeLoading('node-action-1')).toBe(false);
    expect(manager.isLoading()).toBe(true);

    // End remaining task
    manager.endTask(t1);
    expect(manager.isLoading()).toBe(false);
  });

  it('allows updating task properties such as label or progress', () => {
    const taskId = manager.startTask({
      label: 'Restoring project board',
      category: 'restore',
    });

    manager.updateTask(taskId, { label: 'Restoring project board: 80%' });
    expect(manager.getActiveTask()?.label).toBe('Restoring project board: 80%');
  });

  it('executes runTracked and automatically cleans up on resolve', async () => {
    let executed = false;
    const promise = manager.runTracked(
      {
        label: 'Generating PDF export',
        category: 'export',
        nodeId: 'node-file-1',
      },
      async () => {
        executed = true;
        return 'done';
      }
    );

    expect(manager.isLoading()).toBe(true);
    expect(manager.isNodeLoading('node-file-1')).toBe(true);

    const result = await promise;
    expect(result).toBe('done');
    expect(executed).toBe(true);
    expect(manager.isLoading()).toBe(false);
    expect(manager.isNodeLoading('node-file-1')).toBe(false);
  });

  it('executes runTracked and cleans up even if the action throws an error', async () => {
    const faultyTask = manager.runTracked(
      {
        label: 'Failing API call',
        category: 'poll',
      },
      async () => {
        throw new Error('API 500 error');
      }
    );

    await expect(faultyTask).rejects.toThrow('API 500 error');
    expect(manager.isLoading()).toBe(false);
  });

  it('automatically times out and removes stuck tasks after 12 seconds', () => {
    manager.startTask({
      label: 'Stuck background request',
      category: 'poll',
      nodeId: 'node-stuck',
    });

    expect(manager.isLoading()).toBe(true);
    expect(manager.isNodeLoading('node-stuck')).toBe(true);

    // Advance timer by 12.1 seconds
    vi.advanceTimersByTime(12100);

    expect(manager.isLoading()).toBe(false);
    expect(manager.isNodeLoading('node-stuck')).toBe(false);
    expect(manager.getActiveTask()).toBeNull();
  });
});
