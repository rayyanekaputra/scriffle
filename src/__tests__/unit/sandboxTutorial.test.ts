import { describe, it, expect } from 'vitest';
import { SANDBOX_MISSIONS } from '@/components/tutorial/sandboxMissionsConfig';
import { evaluateMissionProgress } from '@/components/tutorial/missionValidator';
import { CanvasData, ExecutionLog } from '@/types/canvas';

describe('Interactive Step-by-Step Hands-On Sandbox Missions', () => {
  it('defines exactly 6 structured missions covering the full whiteboard research arc', () => {
    expect(SANDBOX_MISSIONS).toBeDefined();
    expect(SANDBOX_MISSIONS.length).toBe(6);
  });

  it('contains valid titles, detailed hints, badges, and MingCute icons for every mission', () => {
    SANDBOX_MISSIONS.forEach((m, idx) => {
      expect(m.id).toBeTypeOf('string');
      expect(m.title).toBeTypeOf('string');
      expect(m.shortDesc).toBeTypeOf('string');
      expect(m.detailHint).toBeTypeOf('string');
      expect(m.badge).toBe(`Mission 0${idx + 1}`);
      expect(m.icon).toBeTypeOf('string');
      expect(m.icon.length).toBeGreaterThan(0);
    });
  });

  it('explicitly validates Mission 02 dispelling the export-only myth with File cards', () => {
    const fileMission = SANDBOX_MISSIONS.find((m) => m.id === 'mission-file-research');
    expect(fileMission).toBeDefined();
    expect(fileMission?.title).toContain('File Attachment');
    expect(fileMission?.detailHint.toLowerCase()).toContain('export');
  });

  describe('Mission Progress Evaluator (missionValidator.ts)', () => {
    it('returns empty completed state on null or blank canvas', () => {
      const progress = evaluateMissionProgress(null, null);
      expect(Object.keys(progress).length).toBe(0);
    });

    it('marks Mission 1 complete when a watcher has an Indonesian ticker selected', () => {
      const canvasWithoutSymbol: CanvasData = {
        id: 'c1',
        name: 'test',
        nodes: [{ id: 'n1', canvasId: 'c1', type: 'watcher', position: { x: 0, y: 0 }, config: { symbol: '', metric: 'price_change', interval: 300 } }],
        edges: [],
      };
      let progress = evaluateMissionProgress(canvasWithoutSymbol, []);
      expect(progress['mission-watcher-stock']?.isCompleted).toBeFalsy();

      const canvasWithSymbol: CanvasData = {
        id: 'c1',
        name: 'test',
        nodes: [{ id: 'n1', canvasId: 'c1', type: 'watcher', position: { x: 0, y: 0 }, config: { symbol: 'BBCA', metric: 'price_change', interval: 300 } }],
        edges: [],
      };
      progress = evaluateMissionProgress(canvasWithSymbol, []);
      expect(progress['mission-watcher-stock']?.isCompleted).toBe(true);
    });

    it('marks Mission 2 complete when a file card is placed on the canvas', () => {
      const canvasWithFile: CanvasData = {
        id: 'c1',
        name: 'test',
        nodes: [{ id: 'f1', canvasId: 'c1', type: 'file', position: { x: 100, y: 100 }, config: { fileName: 'BBCA_Annual_Report.pdf' } }],
        edges: [],
      };
      const progress = evaluateMissionProgress(canvasWithFile, []);
      expect(progress['mission-file-research']?.isCompleted).toBe(true);
    });

    it('marks Mission 3 complete when an edge connects Watcher to Condition', () => {
      const canvasWithWiring: CanvasData = {
        id: 'c1',
        name: 'test',
        nodes: [
          { id: 'w1', canvasId: 'c1', type: 'watcher', position: { x: 0, y: 0 }, config: { symbol: 'TLKM', metric: 'price_change', interval: 300 } },
          { id: 'c1', canvasId: 'c1', type: 'condition', position: { x: 300, y: 0 }, config: { rule: 'price_change > 2' } },
        ],
        edges: [{ id: 'e1', canvasId: 'c1', from: 'w1', to: 'c1' }],
      };
      const progress = evaluateMissionProgress(canvasWithWiring, []);
      expect(progress['mission-wire-condition']?.isCompleted).toBe(true);
    });

    it('marks Mission 4 complete when Condition branches to Note or Alert', () => {
      const canvasWithBranching: CanvasData = {
        id: 'c1',
        name: 'test',
        nodes: [
          { id: 'c1', canvasId: 'c1', type: 'condition', position: { x: 300, y: 0 }, config: { rule: 'price_change > 2' } },
          { id: 'note1', canvasId: 'c1', type: 'note', position: { x: 600, y: 0 }, config: { content: 'Breakout!' } },
        ],
        edges: [{ id: 'e2', canvasId: 'c1', from: 'c1', to: 'note1' }],
      };
      const progress = evaluateMissionProgress(canvasWithBranching, []);
      expect(progress['mission-branch-output']?.isCompleted).toBe(true);
    });

    it('marks Mission 5 complete when freeform Text or Emoji Sticker is placed', () => {
      const canvasWithText: CanvasData = {
        id: 'c1',
        name: 'test',
        nodes: [{ id: 't1', canvasId: 'c1', type: 'text', position: { x: 0, y: 200 }, config: { text: 'Key thesis notes' } }],
        edges: [],
      };
      let progress = evaluateMissionProgress(canvasWithText, []);
      expect(progress['mission-freeform-annotation']?.isCompleted).toBe(true);

      const canvasWithSticker: CanvasData = {
        id: 'c1',
        name: 'test',
        nodes: [{ id: 's1', canvasId: 'c1', type: 'sticker', position: { x: 0, y: 200 }, config: { emoji: '🚀', label: 'Breakout' } }],
        edges: [],
      };
      progress = evaluateMissionProgress(canvasWithSticker, []);
      expect(progress['mission-freeform-annotation']?.isCompleted).toBe(true);
    });

    it('marks Mission 6 complete when live execution / logs exist or run counters > 0', () => {
      const logs: ExecutionLog[] = [
        {
          id: 'log1',
          canvasId: 'c1',
          eventSummary: 'Price updated to Rp 10,250',
          triggeredNodes: ['w1'],
          createdAt: new Date().toISOString(),
        },
      ];
      const progress = evaluateMissionProgress(null, logs);
      expect(progress['mission-simulate-execution']?.isCompleted).toBe(true);
    });

    it('preserves existing completed timestamps across subsequent checks', () => {
      const canvas: CanvasData = {
        id: 'c1',
        name: 'test',
        nodes: [{ id: 'f1', canvasId: 'c1', type: 'file', position: { x: 0, y: 0 }, config: {} }],
        edges: [],
      };
      const initialProgress = evaluateMissionProgress(canvas, []);
      const completedAt = initialProgress['mission-file-research']?.completedAt;
      expect(completedAt).toBeDefined();

      const subsequentProgress = evaluateMissionProgress(canvas, [], initialProgress);
      expect(subsequentProgress['mission-file-research']?.completedAt).toBe(completedAt);
    });
  });
});
