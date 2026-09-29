import { describe, it, expect } from 'vitest';
import {
  tidyUpNodes,
  tidyHorizontal,
  resolveNodeDimensions,
  TidyNode,
  TIDY_HORIZONTAL_GAP,
  TIDY_VERTICAL_GAP,
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

  it('distributes nodes horizontally when horizontal mode is explicitly requested', () => {
    const nodes: TidyNode[] = [
      { id: 'c', x: 800, y: 200, width: 260, height: 100 },
      { id: 'a', x: 100, y: 150, width: 340, height: 180 },
      { id: 'b', x: 400, y: 300, width: 280, height: 120 },
    ];

    const results = tidyHorizontal(nodes);
    expect(results).toHaveLength(3);

    const [resA, resB, resC] = results;
    expect(resA.id).toBe('a');
    expect(resA.position).toEqual({ x: 100, y: 150 });
    expect(resB.position).toEqual({ x: 100 + 340 + TIDY_HORIZONTAL_GAP, y: 150 });
    expect(resC.position).toEqual({ x: 100 + 340 + TIDY_HORIZONTAL_GAP + 280 + TIDY_HORIZONTAL_GAP, y: 150 });
  });

  describe('tidyDeOverlap — Overlap-Aware Minimal Displacement', () => {
    it('does NOT move nodes that have no overlap', () => {
      // Three nodes far apart — expect zero displacement
      const nodes: TidyNode[] = [
        { id: 'a', x: 0, y: 0, width: 280, height: 140 },
        { id: 'b', x: 600, y: 0, width: 280, height: 140 },
        { id: 'c', x: 1200, y: 0, width: 280, height: 140 },
      ];
      const results = tidyUpNodes(nodes, 'auto');
      const posMap = new Map(results.map((r) => [r.id, r.position]));
      expect(Math.abs(posMap.get('a')!.x - 0)).toBeLessThan(5);
      expect(Math.abs(posMap.get('b')!.x - 600)).toBeLessThan(5);
      expect(Math.abs(posMap.get('c')!.x - 1200)).toBeLessThan(5);
    });

    it('separates two fully overlapping (stacked) nodes', () => {
      // A and B are perfectly stacked at the same coordinates
      const nodes: TidyNode[] = [
        { id: 'a', x: 100, y: 100, width: 280, height: 140 },
        { id: 'b', x: 100, y: 100, width: 280, height: 140 },
        { id: 'c', x: 800, y: 100, width: 280, height: 140 }, // far away
      ];
      const results = tidyUpNodes(nodes, 'auto');
      const posMap = new Map(results.map((r) => [r.id, r.position]));
      const pA = posMap.get('a')!;
      const pB = posMap.get('b')!;

      // After de-overlap, A and B must not overlap (minimal displacement chose Y since height 140 < width 280)
      const topNode = pA.y <= pB.y ? pA : pB;
      const bottomNode = pA.y <= pB.y ? pB : pA;
      expect(topNode.y + 140).toBeLessThanOrEqual(bottomNode.y);
    });

    it('separates partial overlaps — a node partially behind another', () => {
      // Node B overlaps A by 50px on X axis
      const nodes: TidyNode[] = [
        { id: 'a', x: 0, y: 0, width: 280, height: 140 },
        { id: 'b', x: 230, y: 0, width: 280, height: 140 }, // overlaps A by 50px
        { id: 'c', x: 700, y: 0, width: 280, height: 140 },
      ];
      const results = tidyUpNodes(nodes, 'auto');
      const posMap = new Map(results.map((r) => [r.id, r.position]));
      const pA = posMap.get('a')!;
      const pB = posMap.get('b')!;

      // A's right + GAP <= B's left
      expect(pA.x + 280 + TIDY_HORIZONTAL_GAP).toBeLessThanOrEqual(pB.x + 1);
    });

    it('produces zero overlapping pairs after de-collision of a dense cluster', () => {
      // 5 nodes all piled up at origin — worst case
      const nodes: TidyNode[] = Array.from({ length: 5 }, (_, i) => ({
        id: String(i),
        x: 50 + i * 10,
        y: 50 + i * 5,
        width: 280,
        height: 140,
      }));
      const results = tidyUpNodes(nodes, 'auto');
      expect(results).toHaveLength(5);

      const positions = results.map((r) => ({
        id: r.id,
        x: r.position.x,
        y: r.position.y,
        width: nodes.find((n) => n.id === r.id)!.width,
        height: nodes.find((n) => n.id === r.id)!.height,
      }));

      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const A = positions[i];
          const B = positions[j];
          const noOverlapX = A.x + A.width <= B.x || B.x + B.width <= A.x;
          const noOverlapY = A.y + A.height <= B.y || B.y + B.height <= A.y;
          expect(noOverlapX || noOverlapY).toBe(true);
        }
      }
    });

    it('preserves centroid — group center does not drift more than 2px', () => {
      const nodes: TidyNode[] = [
        { id: 'a', x: 100, y: 100, width: 280, height: 140 },
        { id: 'b', x: 120, y: 110, width: 280, height: 140 },
        { id: 'c', x: 500, y: 400, width: 360, height: 200 },
      ];

      const origCx = nodes.reduce((s, n) => s + n.x + n.width / 2, 0) / nodes.length;
      const origCy = nodes.reduce((s, n) => s + n.y + n.height / 2, 0) / nodes.length;

      const results = tidyUpNodes(nodes, 'auto');
      const posMap = new Map(results.map((r) => [r.id, r.position]));

      const finalCx = nodes.reduce((s, n) => s + posMap.get(n.id)!.x + n.width / 2, 0) / nodes.length;
      const finalCy = nodes.reduce((s, n) => s + posMap.get(n.id)!.y + n.height / 2, 0) / nodes.length;

      expect(Math.abs(origCx - finalCx)).toBeLessThan(2);
      expect(Math.abs(origCy - finalCy)).toBeLessThan(2);
    });

    it('preserves ID mapping — every input node ID appears exactly once in results', () => {
      const nodes: TidyNode[] = [
        { id: 'x1', x: 0, y: 0, width: 280, height: 140 },
        { id: 'x2', x: 50, y: 50, width: 280, height: 140 },
        { id: 'x3', x: 100, y: 100, width: 280, height: 140 },
      ];
      const results = tidyUpNodes(nodes, 'auto');
      const ids = results.map((r) => r.id).sort();
      expect(ids).toEqual(['x1', 'x2', 'x3']);
    });
  });
});
