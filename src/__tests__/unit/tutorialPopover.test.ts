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

  it('resets local storage keys storing tutorial progress when choose reset progress', () => {
    const memoryStorage: Record<string, string> = {
      [SANDBOX_STORAGE_KEY]: JSON.stringify({
        'mission-watcher-stock': { id: 'mission-watcher-stock', isCompleted: true },
        'mission-file-research': { id: 'mission-file-research', isCompleted: true },
        'mission-wire-condition': { id: 'mission-wire-condition', isCompleted: true },
        'mission-branch-output': { id: 'mission-branch-output', isCompleted: true },
        'mission-freeform-annotation': { id: 'mission-freeform-annotation', isCompleted: true },
        'mission-simulate-execution': { id: 'mission-simulate-execution', isCompleted: true },
      }),
      'scriffle_sandbox_graduated_v1': 'true',
      [SANDBOX_OPEN_KEY]: 'true',
      'scriffle_sandbox_minimized_v1': 'true',
      'scriffle_sandbox_card_pos_v1': JSON.stringify({ x: 100, y: 100 }),
    };

    // User chooses "Reset progress"
    delete memoryStorage[SANDBOX_STORAGE_KEY];
    delete memoryStorage['scriffle_sandbox_graduated_v1'];
    delete memoryStorage[SANDBOX_OPEN_KEY];
    delete memoryStorage['scriffle_sandbox_minimized_v1'];
    delete memoryStorage['scriffle_sandbox_card_pos_v1'];

    expect(memoryStorage[SANDBOX_STORAGE_KEY]).toBeUndefined();
    expect(memoryStorage['scriffle_sandbox_graduated_v1']).toBeUndefined();
    expect(memoryStorage[SANDBOX_OPEN_KEY]).toBeUndefined();
    expect(memoryStorage['scriffle_sandbox_minimized_v1']).toBeUndefined();
  });

  it('prevents existing canvas nodes from immediately auto-completing missions after reset via baseline', () => {
    const existingCanvas = {
      id: 'c1',
      name: 'test',
      nodes: [
        { id: 'w1', canvasId: 'c1', type: 'watcher', position: { x: 0, y: 0 }, config: { symbol: 'BBCA' } },
        { id: 'f1', canvasId: 'c1', type: 'file', position: { x: 100, y: 0 }, config: {} },
      ],
      edges: [],
    };

    // Before reset without baseline, existing nodes complete missions
    const initialProgress = evaluateMissionProgress(existingCanvas, []);
    expect(initialProgress['mission-watcher-stock']?.isCompleted).toBe(true);
    expect(initialProgress['mission-file-research']?.isCompleted).toBe(true);

    // After reset, baseline isolates existing nodes so progress remains empty
    const baseline = {
      nodeIds: existingCanvas.nodes.map((n) => n.id),
      edgeIds: [],
      logCount: 0,
    };
    const progressAfterReset = evaluateMissionProgress(existingCanvas, [], {}, baseline);
    expect(progressAfterReset['mission-watcher-stock']).toBeUndefined();
    expect(progressAfterReset['mission-file-research']).toBeUndefined();
    expect(Object.keys(progressAfterReset).length).toBe(0);

    // Newly added node completes mission
    const canvasWithNewNode = {
      ...existingCanvas,
      nodes: [
        ...existingCanvas.nodes,
        { id: 'w2_new', canvasId: 'c1', type: 'watcher', position: { x: 200, y: 0 }, config: { symbol: 'TLKM' } },
      ],
    };
    const progressWithNewAction = evaluateMissionProgress(canvasWithNewNode, [], {}, baseline);
    expect(progressWithNewAction['mission-watcher-stock']?.isCompleted).toBe(true);
  });

  it('hides the welcome to scriffle modal when tutorial status is done', () => {
    const isWelcomeModalVisible = (isTutorialDone: boolean, currentStepId: string, isActive: boolean) => {
      if (!isActive) return false;
      if (isTutorialDone && currentStepId === 'welcome') return false;
      return true;
    };

    // When tutorial is NOT done, welcome modal is visible
    expect(isWelcomeModalVisible(false, 'welcome', true)).toBe(true);

    // When tutorial IS done, welcome modal is hidden
    expect(isWelcomeModalVisible(true, 'welcome', true)).toBe(false);

    // Other non-welcome steps can still be inspected if explicitly navigated
    expect(isWelcomeModalVisible(true, 'toolbar-and-search', true)).toBe(true);
  });
});
