'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { SANDBOX_MISSIONS, MissionDefinition } from '@/components/tutorial/sandboxMissionsConfig';
import { evaluateMissionProgress, MissionProgress } from '@/components/tutorial/missionValidator';
import { CanvasData, ExecutionLog } from '@/types/canvas';

export interface SandboxMissionItem extends MissionDefinition {
  isCompleted: boolean;
  completedAt?: string;
}

interface SandboxTutorialContextType {
  isOpen: boolean;
  isMinimized: boolean;
  activeMissionId: string;
  missions: SandboxMissionItem[];
  completedCount: number;
  totalMissions: number;
  isAllCompleted: boolean;
  hasSeenGraduation: boolean;
  openTutorial: () => void;
  closeTutorial: () => void;
  toggleMinimize: () => void;
  setActiveMissionId: (id: string) => void;
  resetMissions: () => void;
  dismissGraduation: () => void;
  updateCanvasSnapshot: (canvas: CanvasData | null | undefined, logs: ExecutionLog[] | null | undefined) => void;
}

export const SANDBOX_STORAGE_KEY = 'scriffle_sandbox_progress_v1';
export const SANDBOX_OPEN_KEY = 'scriffle_sandbox_open_v1';
export const SANDBOX_MINIMIZED_KEY = 'scriffle_sandbox_minimized_v1';
export const SANDBOX_GRADUATED_KEY = 'scriffle_sandbox_graduated_v1';
export const SANDBOX_BASELINE_KEY = 'scriffle_sandbox_baseline_v1';

const SandboxTutorialContext = createContext<SandboxTutorialContextType | undefined>(undefined);

export const SandboxTutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [hasSeenGraduation, setHasSeenGraduation] = useState<boolean>(false);
  const [progressMap, setProgressMap] = useState<Record<string, MissionProgress>>({});
  const [activeMissionId, setActiveMissionId] = useState<string>(SANDBOX_MISSIONS[0].id);

  const lastCanvasRef = React.useRef<CanvasData | null | undefined>(null);
  const lastLogsRef = React.useRef<ExecutionLog[] | null | undefined>(null);
  const baselineRef = React.useRef<{ nodeIds?: string[]; edgeIds?: string[]; logCount?: number } | undefined>(undefined);

  // Initialize from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedProgress = localStorage.getItem(SANDBOX_STORAGE_KEY);
      if (savedProgress) {
        setProgressMap(JSON.parse(savedProgress));
      } else {
        const savedBaseline = localStorage.getItem(SANDBOX_BASELINE_KEY);
        if (savedBaseline) {
          baselineRef.current = JSON.parse(savedBaseline);
        }
      }

      // Purge any stale open flag: tutorial must NEVER be open on initial load / refresh
      localStorage.removeItem(SANDBOX_OPEN_KEY);

      const savedMinimized = localStorage.getItem(SANDBOX_MINIMIZED_KEY);
      if (savedMinimized !== null) {
        setIsMinimized(savedMinimized === 'true');
      }

      const savedGraduated = localStorage.getItem(SANDBOX_GRADUATED_KEY);
      if (savedGraduated === 'true') {
        setHasSeenGraduation(true);
      }
    } catch {
      // Storage access may be restricted
    }
  }, []);

  // Save progress changes to localStorage
  const saveProgress = useCallback((newMap: Record<string, MissionProgress>) => {
    setProgressMap(newMap);
    try {
      if (Object.keys(newMap).length === 0) {
        localStorage.removeItem(SANDBOX_STORAGE_KEY);
      } else {
        localStorage.setItem(SANDBOX_STORAGE_KEY, JSON.stringify(newMap));
      }
    } catch {}
  }, []);

  const openTutorial = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
  }, []);

  const closeTutorial = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleMinimize = useCallback(() => {
    setIsMinimized((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SANDBOX_MINIMIZED_KEY, String(next));
      } catch {}
      return next;
    });
  }, []);

  const resetMissions = useCallback(() => {
    const emptyMap: Record<string, MissionProgress> = {};
    setProgressMap(emptyMap);
    setHasSeenGraduation(false);
    setActiveMissionId(SANDBOX_MISSIONS[0].id);

    // Save baseline of current canvas so existing nodes do not immediately re-complete missions
    const currentCanvas = lastCanvasRef.current;
    const currentLogs = lastLogsRef.current;
    const newBaseline = {
      nodeIds: (currentCanvas?.nodes || []).map((n) => n.id),
      edgeIds: (currentCanvas?.edges || []).map((e) => e.id),
      logCount: (currentLogs || []).length,
    };
    baselineRef.current = newBaseline;

    try {
      localStorage.removeItem(SANDBOX_STORAGE_KEY);
      localStorage.removeItem(SANDBOX_GRADUATED_KEY);
      localStorage.removeItem(SANDBOX_OPEN_KEY);
      localStorage.removeItem(SANDBOX_MINIMIZED_KEY);
      localStorage.removeItem('scriffle_sandbox_card_pos_v1');
      localStorage.setItem(SANDBOX_BASELINE_KEY, JSON.stringify(newBaseline));
    } catch {}
  }, []);

  const dismissGraduation = useCallback(() => {
    setHasSeenGraduation(true);
    setIsOpen(false);
    try {
      localStorage.setItem(SANDBOX_GRADUATED_KEY, 'true');
    } catch {}
  }, []);

  const updateCanvasSnapshot = useCallback(
    (canvas: CanvasData | null | undefined, logs: ExecutionLog[] | null | undefined) => {
      lastCanvasRef.current = canvas;
      lastLogsRef.current = logs;

      setProgressMap((prev) => {
        const next = evaluateMissionProgress(canvas, logs, prev, baselineRef.current);
        // If changed, save to localStorage
        if (JSON.stringify(next) !== JSON.stringify(prev)) {
          try {
            if (Object.keys(next).length === 0) {
              localStorage.removeItem(SANDBOX_STORAGE_KEY);
            } else {
              localStorage.setItem(SANDBOX_STORAGE_KEY, JSON.stringify(next));
            }
          } catch {}
          return next;
        }
        return prev;
      });
    },
    []
  );

  // Merge definitions with live progress
  const missions: SandboxMissionItem[] = useMemo(() => {
    return SANDBOX_MISSIONS.map((m) => {
      const prog = progressMap[m.id];
      return {
        ...m,
        isCompleted: !!prog?.isCompleted,
        completedAt: prog?.completedAt,
      };
    });
  }, [progressMap]);

  const completedCount = useMemo(() => {
    return missions.filter((m) => m.isCompleted).length;
  }, [missions]);

  const totalMissions = SANDBOX_MISSIONS.length;
  const isAllCompleted = completedCount === totalMissions;

  // Automatically shift active mission to the first uncompleted one if active is done
  useEffect(() => {
    const activeIsDone = missions.find((m) => m.id === activeMissionId)?.isCompleted;
    if (activeIsDone) {
      const nextUncompleted = missions.find((m) => !m.isCompleted);
      if (nextUncompleted) {
        setActiveMissionId(nextUncompleted.id);
      }
    }
  }, [missions, activeMissionId]);

  return (
    <SandboxTutorialContext.Provider
      value={{
        isOpen,
        isMinimized,
        activeMissionId,
        missions,
        completedCount,
        totalMissions,
        isAllCompleted,
        hasSeenGraduation,
        openTutorial,
        closeTutorial,
        toggleMinimize,
        setActiveMissionId,
        resetMissions,
        dismissGraduation,
        updateCanvasSnapshot,
      }}
    >
      {children}
    </SandboxTutorialContext.Provider>
  );
};

export const useSandboxTutorial = (): SandboxTutorialContextType => {
  const context = useContext(SandboxTutorialContext);
  if (!context) {
    throw new Error('useSandboxTutorial must be used within a SandboxTutorialProvider');
  }
  return context;
};
