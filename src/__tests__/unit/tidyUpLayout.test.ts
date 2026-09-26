import { describe, it, expect } from 'vitest';
import {
  tidyUpNodes,
  tidyHorizontal,
  tidyVertical,
  tidyGrid,
  detectTidyMode,
  resolveNodeDimensions,
  TidyNode,
} from '@/lib/tidyUpLayout';

describe('tidyUpLayout — Anti-Overlap & Spacing Suite', () => {
  it('returns empty array when fewer than 3 nodes are provided', () => {
    const nodes: TidyNode[] = [
      { id: '1', x: 0, y: 0, width: 280, height: 140 },
      { id: '2', x: 100, y: 0, width: 280, height: 140 },
    ];
    expect(tidyUpNodes(nodes)).toEqual([]);
  });

  it('correctly resolves node dimensions with type and mode awareness', () => {
    expect(
      resolveNodeDimensions({
        type: 'watcher',
        data: { config: { mode: 'top_gainers' } },
      })
    ).toEqual({ width: 400, height: 260 });

    expect(
      resolveNodeDimensions({
        type: 'watcher',
        data: { config: { mode: 'single' } },
      })
    ).toEqual({ width: 340, height: 180 });

    expect(
      resolveNodeDimensions({
        type: 'screener',
      })
    ).toEqual({ width: 360, height: 300 });

    expect(
      resolveNodeDimensions({
        type: 'note',
        measured: { width: 320, height: 240 },
      })
    ).toEqual({ width: 320, height: 240 });
  });

  it('distributes nodes horizontally with zero overlaps and exact 48px handle clearance', () => {
    const nodes: TidyNode[] = [
      { id: 'c', x: 800, y: 200, width: 260, height: 100 },
      { id: 'a', x: 100, y: 150, width: 340, height: 180 },
      { id: 'b', x: 400, y: 300, width: 280, height: 120 },
    ];

    const results = tidyHorizontal(nodes);
    expect(results).toHaveLength(3);

    // Sorted order should be a (x:100), b (x:400), c (x:800)
    const [resA, resB, resC] = results;
    expect(resA.id).toBe('a');
    expect(resA.position).toEqual({ x: 100, y: 150 }); // anchor minY = 150

    expect(resB.id).toBe('b');
    expect(resB.position).toEqual({ x: 100 + 340 + 48, y: 150 }); // 488

    expect(resC.id).toBe('c');
    expect(resC.position).toEqual({ x: 488 + 280 + 48, y: 150 }); // 816

    // Verify distance between cards is exactly 48px
    expect(resB.position.x - (resA.position.x + 340)).toBe(48);
    expect(resC.position.x - (resB.position.x + 280)).toBe(48);
  });

  it('distributes nodes vertically with zero overlaps and exact 36px clearance', () => {
    const nodes: TidyNode[] = [
      { id: 'n2', x: 500, y: 400, width: 280, height: 140 },
      { id: 'n1', x: 100, y: 100, width: 360, height: 300 },
      { id: 'n3', x: 300, y: 700, width: 260, height: 100 },
    ];

    const results = tidyVertical(nodes);
    expect(results).toHaveLength(3);

    const [res1, res2, res3] = results;
    expect(res1.id).toBe('n1');
    expect(res1.position).toEqual({ x: 100, y: 100 });

    expect(res2.id).toBe('n2');
    expect(res2.position).toEqual({ x: 100, y: 100 + 300 + 36 }); // 436

    expect(res3.id).toBe('n3');
    expect(res3.position).toEqual({ x: 100, y: 436 + 140 + 36 }); // 612
  });

  it('detects auto mode accurately between horizontal, vertical, and 2D grid', () => {
    const horizNodes: TidyNode[] = [
      { id: '1', x: 0, y: 0, width: 280, height: 100 },
      { id: '2', x: 400, y: 20, width: 280, height: 100 },
      { id: '3', x: 800, y: 10, width: 280, height: 100 },
    ];
    expect(detectTidyMode(horizNodes)).toBe('horizontal');

    const vertNodes: TidyNode[] = [
      { id: '1', x: 0, y: 0, width: 280, height: 100 },
      { id: '2', x: 10, y: 200, width: 280, height: 100 },
      { id: '3', x: 5, y: 400, width: 280, height: 100 },
    ];
    expect(detectTidyMode(vertNodes)).toBe('vertical');

    const gridNodes: TidyNode[] = [
      { id: '1', x: 0, y: 0, width: 280, height: 140 },
      { id: '2', x: 350, y: 0, width: 280, height: 140 },
      { id: '3', x: 0, y: 200, width: 280, height: 140 },
      { id: '4', x: 350, y: 200, width: 280, height: 140 },
    ];
    expect(detectTidyMode(gridNodes)).toBe('grid');
  });

  it('distributes 4 nodes in a 2x2 grid without any collision', () => {
    const nodes: TidyNode[] = [
      { id: '1', x: 10, y: 10, width: 340, height: 180 },
      { id: '2', x: 400, y: 20, width: 280, height: 120 },
      { id: '3', x: 20, y: 300, width: 360, height: 200 },
      { id: '4', x: 410, y: 320, width: 260, height: 100 },
    ];

    const results = tidyGrid(nodes);
    expect(results).toHaveLength(4);

    const posMap = new Map(results.map((r) => [r.id, r.position]));
    const p1 = posMap.get('1')!;
    const p2 = posMap.get('2')!;
    const p3 = posMap.get('3')!;
    const p4 = posMap.get('4')!;

    // Top row
    expect(p1.y).toBe(p2.y);
    expect(p2.x).toBeGreaterThanOrEqual(p1.x + 360 + 48);

    // Bottom row
    expect(p3.y).toBe(p4.y);
    expect(p3.y).toBeGreaterThanOrEqual(p1.y + 180 + 36);
  });
});
