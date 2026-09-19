import { describe, it, expect } from 'vitest';
import { inferEdgeLabel, resolveEdgeLabel } from '@/lib/edgeLabels';

describe('Edge Labels & Condition Badges Inference', () => {
  it('infers "if true" when condition connects to downstream nodes (action, note, alert)', () => {
    expect(inferEdgeLabel('condition', 'action')).toBe('if true');
    expect(inferEdgeLabel('condition', 'note')).toBe('if true');
    expect(inferEdgeLabel('condition', 'alert')).toBe('if true');
    expect(inferEdgeLabel('condition', 'action', 'true')).toBe('if true');
  });

  it('infers "if false" when condition connects with sourceHandle="false"', () => {
    expect(inferEdgeLabel('condition', 'note', 'false')).toBe('if false');
    expect(inferEdgeLabel('condition', 'alert', 'false')).toBe('if false');
    expect(inferEdgeLabel('condition', 'action', 'false')).toBe('if false');
    expect(inferEdgeLabel('condition', 'watcher', 'false')).toBe('if false');
  });

  it('infers "if true" for condition to unspecified node types with true or legacy handle', () => {
    expect(inferEdgeLabel('condition', 'text')).toBe('if true');
    expect(inferEdgeLabel('condition', 'text', 'true')).toBe('if true');
  });

  it('infers watcher streaming events properly', () => {
    expect(inferEdgeLabel('watcher', 'condition')).toBe('on tick');
    expect(inferEdgeLabel('watcher', 'note')).toBe('on change');
    expect(inferEdgeLabel('watcher', 'action')).toBe('on spike');
  });

  it('infers AI screener connections', () => {
    expect(inferEdgeLabel('screener', 'watcher')).toBe('discovered');
    expect(inferEdgeLabel('screener', 'action')).toBe('pipe results');
    expect(inferEdgeLabel('screener', 'note')).toBe('summary');
  });

  it('infers action mutation connections', () => {
    expect(inferEdgeLabel('action', 'file')).toBe('generates');
    expect(inferEdgeLabel('action', 'note')).toBe('brief');
    expect(inferEdgeLabel('action', 'watcher')).toBe('spawns');
  });

  it('returns null for missing or unhandled edge connections', () => {
    expect(inferEdgeLabel(null, 'note')).toBeNull();
    expect(inferEdgeLabel('text', 'text')).toBeNull();
  });

  it('prioritizes explicit custom labels over inferred defaults', () => {
    expect(resolveEdgeLabel('on breakout surge', 'watcher', 'condition')).toBe('on breakout surge');
    expect(resolveEdgeLabel('', 'watcher', 'condition')).toBe('on tick');
    expect(resolveEdgeLabel(undefined, 'condition', 'action')).toBe('if true');
    expect(resolveEdgeLabel(undefined, 'condition', 'note', 'false')).toBe('if false');
  });
});
