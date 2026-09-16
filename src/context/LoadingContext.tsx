'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

export interface LoadingTask {
  id: string;
  label: string;
  category: 'poll' | 'screener' | 'report' | 'restore' | 'export' | 'mutation';
  nodeId?: string;
  symbol?: string;
  progress?: number; // 0 to 100
  startTime: number;
}

export interface LoadingContextType {
  tasks: LoadingTask[];
  isLoading: boolean;
  activeTask: LoadingTask | null;
  startTask: (task: Omit<LoadingTask, 'id' | 'startTime'>) => string;
  updateTask: (id: string, updates: Partial<Omit<LoadingTask, 'id' | 'startTime'>>) => void;
  endTask: (id: string) => void;
  isNodeLoading: (nodeId?: string) => boolean;
  runTracked: <T>(
    task: Omit<LoadingTask, 'id' | 'startTime'>,
    asyncFn: () => Promise<T>
  ) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<LoadingTask[]>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const endTask = useCallback((id: string) => {
    // Clear safety timeout if exists
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const startTask = useCallback(
    (taskInput: Omit<LoadingTask, 'id' | 'startTime'>): string => {
      const id = 'task_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
      const newTask: LoadingTask = {
        ...taskInput,
        id,
        startTime: Date.now(),
      };

      setTasks((prev) => [...prev, newTask]);

      // 12s safety timeout fallback to prevent forever-stuck loading states
      const timeout = setTimeout(() => {
        endTask(id);
      }, 12000);
      timeoutsRef.current.set(id, timeout);

      return id;
    },
    [endTask]
  );

  const updateTask = useCallback(
    (id: string, updates: Partial<Omit<LoadingTask, 'id' | 'startTime'>>) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      );
    },
    []
  );

  const isNodeLoading = useCallback(
    (nodeId?: string): boolean => {
      if (!nodeId) return false;
      return tasks.some((t) => t.nodeId === nodeId);
    },
    [tasks]
  );

  const runTracked = useCallback(
    async <T,>(
      taskInput: Omit<LoadingTask, 'id' | 'startTime'>,
      asyncFn: () => Promise<T>
    ): Promise<T> => {
      const taskId = startTask(taskInput);
      try {
        const result = await asyncFn();
        return result;
      } finally {
        endTask(taskId);
      }
    },
    [startTask, endTask]
  );

  // Clean up all timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((t) => clearTimeout(t));
      timeoutsRef.current.clear();
    };
  }, []);

  const activeTask = tasks.length > 0 ? tasks[tasks.length - 1] : null;
  const isLoading = tasks.length > 0;

  return (
    <LoadingContext.Provider
      value={{
        tasks,
        isLoading,
        activeTask,
        startTask,
        updateTask,
        endTask,
        isNodeLoading,
        runTracked,
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};
