import { describe, it, expect } from 'vitest';
import {
  calculateQuickAddPosition,
  getRecommendedNodeTypes,
  getDefaultConfigForQuickAdd,
  ALL_QUICK_ADD_NODES,
} from '@/lib/quickAddNavigator';

describe('quickAddNavigator — Spatial Calculation & Smart Recommendations', () => {
  it('calculates standard offset (+320px X, aligned Y) when space is free', () => {
    const sourcePos = { x: 100, y: 200 };
    const result = calculateQuickAddPosition(sourcePos, []);
    expect(result).toEqual({ x: 420, y: 200 });
  });

  it('avoids collision and staggers vertically if target slot is occupied', () => {
    const sourcePos = { x: 100, y: 200 };
    const existingNodes = [
      { position: { x: 420, y: 200 } }, // exactly at target
    ];
    const result = calculateQuickAddPosition(sourcePos, existingNodes);
    expect(result.x).toBe(420);
    expect(result.y).toBe(350); // 200 + 150
  });

  it('cascades down multiple collision slots if multiple nodes occupy space', () => {
    const sourcePos = { x: 100, y: 200 };
    const existingNodes = [
      { position: { x: 420, y: 200 } },
      { position: { x: 420, y: 350 } },
    ];
    const result = calculateQuickAddPosition(sourcePos, existingNodes);
    expect(result.x).toBe(420);
    expect(result.y).toBe(500); // 200 + 150 + 150
  });

  it('returns prioritized recommendations for watcher source node', () => {
    const recommendations = getRecommendedNodeTypes('watcher');
    const types = recommendations.map((r) => r.type);
    expect(types.slice(0, 4)).toEqual(['condition', 'note', 'action', 'alert']);
    expect(recommendations[0].recommended).toBe(true);
    expect(recommendations[1].recommended).toBe(true);
  });

  it('returns prioritized recommendations for screener source node', () => {
    const recommendations = getRecommendedNodeTypes('screener');
    const types = recommendations.map((r) => r.type);
    expect(types.slice(0, 4)).toEqual(['note', 'action', 'watcher', 'condition']);
  });

  it('returns prioritized recommendations for condition source node', () => {
    const recommendations = getRecommendedNodeTypes('condition');
    const types = recommendations.map((r) => r.type);
    expect(types.slice(0, 3)).toEqual(['note', 'alert', 'action']);
  });

  it('returns all nodes with fallback priority when source node is undefined or null', () => {
    const recommendations = getRecommendedNodeTypes(null);
    expect(recommendations.length).toBe(ALL_QUICK_ADD_NODES.length);
  });

  it('generates sensible default config inheriting ticker symbol from source watcher', () => {
    const sourceNode = {
      type: 'watcher' as const,
      config: { symbol: 'TLKM' },
    };
    const actionConfig = getDefaultConfigForQuickAdd('action', sourceNode);
    expect(actionConfig.targetSymbol).toBe('TLKM');
    expect(actionConfig.action).toBe('fundamental_report');

    const fileConfig = getDefaultConfigForQuickAdd('file', sourceNode);
    expect(fileConfig.title).toBe('TLKM Research Brief');
    expect(fileConfig.filename).toBe('TLKM_Report.pdf');

    const conditionConfig = getDefaultConfigForQuickAdd('condition', sourceNode);
    expect(conditionConfig.rule).toBe('price_change > 0');
  });

  it('generates appropriate defaults for false branch connections', () => {
    const falseSourceNode = {
      type: 'condition' as const,
      config: { rule: 'price_change > 5' },
      sourceHandleId: 'false',
    };

    const noteConfig = getDefaultConfigForQuickAdd('note', falseSourceNode);
    expect(noteConfig.color).toBe('pink');
    expect(noteConfig.content).toContain('held steady');

    const alertConfig = getDefaultConfigForQuickAdd('alert', falseSourceNode);
    expect(alertConfig.message).toContain('condition not met');

    const stickerConfig = getDefaultConfigForQuickAdd('sticker', falseSourceNode);
    expect(stickerConfig.emoji).toBe('🔻');
    expect(stickerConfig.color).toBe('rose');
  });

  it('standardizes action node icon to flash_line (zap) and not play_line', () => {
    const actionOption = ALL_QUICK_ADD_NODES.find((opt) => opt.type === 'action');
    expect(actionOption).toBeDefined();
    expect(actionOption?.icon).toBe('flash_line');
  });
});
