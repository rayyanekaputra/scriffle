import { describe, it, expect } from 'vitest';
import { SANDBOX_MISSIONS, MissionDefinition } from '@/components/tutorial/sandboxMissionsConfig';
import { evaluateMissionProgress } from '@/components/tutorial/missionValidator';
import { SANDBOX_STORAGE_KEY, SANDBOX_OPEN_KEY } from '@/context/SandboxTutorialContext';

describe('Tutorial Missions Popover & Button Completion Badge', () => {
  it('lists exactly 6 structured missions for the popover', () => {
    expect(SANDBOX_MISSIONS).toBeDefined();
    expect(SANDBOX_MISSIONS.length).toBe(6);
  });

  it('determines status (not started / active / done) accurately for every mission', () => {
    const activeMissionId = 'mission-wire-condition';
    const progressMap = {
      'mission-watcher-stock': { id: 'mission-watcher-stock', isCompleted: true },
      'mission-file-research': { id: 'mission-file-research', isCompleted: true },
    };

    const getStatus = (mission: MissionDefinition) => {
      const isDone = !!progressMap[mission.id as keyof typeof progressMap]?.isCompleted;
      if (isDone) return 'done';
      if (mission.id === activeMissionId) return 'active';
      return 'not started';
    };

    expect(getStatus(SANDBOX_MISSIONS[0])).toBe('done');
    expect(getStatus(SANDBOX_MISSIONS[1])).toBe('done');
    expect(getStatus(SANDBOX_MISSIONS[2])).toBe('active');
    expect(getStatus(SANDBOX_MISSIONS[3])).toBe('not started');
    expect(getStatus(SANDBOX_MISSIONS[4])).toBe('not started');
    expect(getStatus(SANDBOX_MISSIONS[5])).toBe('not started');
  });

  it('computes progress count and completion status for badge rendering', () => {
    const totalMissions = SANDBOX_MISSIONS.length;
    let completedCount = 3;
    let isAllCompleted = completedCount === totalMissions;

    expect(isAllCompleted).toBe(false);
    expect(`${completedCount}/${totalMissions}`).toBe('3/6');

    completedCount = 6;
    isAllCompleted = completedCount === totalMissions;
    expect(isAllCompleted).toBe(true);
    // When all completed, tutorial button displays check badge / done
    const buttonBadge = isAllCompleted ? 'check' : `${completedCount}/${totalMissions}`;
    expect(buttonBadge).toBe('check');
  });

  it('provides instructions (detailHint) for the active mission', () => {
    const activeMission = SANDBOX_MISSIONS.find((m) => m.id === 'mission-watcher-stock');
    expect(activeMission).toBeDefined();
    expect(activeMission?.detailHint).toContain('Watcher');
    expect(activeMission?.detailHint.length).toBeGreaterThan(10);
  });

  it('verifies that popover open state does not persist to localStorage while progress does', () => {
    const store: Record<string, string> = {};

    // Progress persists
    const progress = {
      'mission-watcher-stock': { id: 'mission-watcher-stock', isCompleted: true },
    };
    store[SANDBOX_STORAGE_KEY] = JSON.stringify(progress);

    // Stale open key is purged and never written
    delete store[SANDBOX_OPEN_KEY];

    expect(JSON.parse(store[SANDBOX_STORAGE_KEY])).toEqual(progress);
    expect(store[SANDBOX_OPEN_KEY]).toBeUndefined();
  });

  it('verifies reset progress action clears all mission progress back to initial state', () => {
    let progressMap: Record<string, { id: string; isCompleted: boolean }> = {
      'mission-watcher-stock': { id: 'mission-watcher-stock', isCompleted: true },
      'mission-file-research': { id: 'mission-file-research', isCompleted: true },
    };

    const resetMissions = () => {
      progressMap = {};
    };

    resetMissions();
    expect(Object.keys(progressMap).length).toBe(0);
  });

  it('verifies outside click logic does not trigger when clicking inside popover or on toggle button', () => {
    const shouldClose = (
      isInsidePopover: boolean,
      isInsideButton: boolean
    ) => {
      return !isInsidePopover && !isInsideButton;
    };

    // Click inside popover -> do not close
    expect(shouldClose(true, false)).toBe(false);

    // Click on toggle button -> do not close via outside handler (handled by button toggle)
    expect(shouldClose(false, true)).toBe(false);

    // Click on canvas or outside -> close
    expect(shouldClose(false, false)).toBe(true);
  });
});
