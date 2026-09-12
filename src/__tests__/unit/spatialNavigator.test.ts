import { describe, it, expect } from 'vitest';
import { findNextSpatialNode, getDistance } from '@/lib/spatialNavigator';

const mockNodes = [
  { id: 'node-watcher', position: { x: 100, y: 100 } },
  { id: 'node-condition', position: { x: 400, y: 100 } },
  { id: 'node-note', position: { x: 700, y: 100 } },
  { id: 'node-bottom-isolated', position: { x: 100, y: 500 } },
];

const mockEdges = [
  { from: 'node-watcher', to: 'node-condition' },
  { from: 'node-condition', to: 'node-note' },
];

// Unconnected evenly spaced row (A, B, C)
const mockEvenlySpacedRow = [
  { id: 'card-a', position: { x: 100, y: 200 } },
  { id: 'card-b', position: { x: 400, y: 200 } },
  { id: 'card-c', position: { x: 700, y: 200 } },
];

describe('getDistance', () => {
  it('computes euclidean distance accurately', () => {
    expect(getDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
});

describe('findNextSpatialNode', () => {
  it('returns null if 0 or 1 node exists', () => {
    expect(findNextSpatialNode(null, [])).toBeNull();
    expect(findNextSpatialNode('node-1', [{ id: 'node-1', position: { x: 0, y: 0 } }])).toBeNull();
  });

  it('navigates forward along connected outgoing edges on Tab', () => {
    const next = findNextSpatialNode('node-watcher', mockNodes, mockEdges, 'forward');
    expect(next?.id).toBe('node-condition');
  });

  it('navigates chain from condition to note', () => {
    const next = findNextSpatialNode('node-condition', mockNodes, mockEdges, 'forward');
    expect(next?.id).toBe('node-note');
  });

  it('navigates backward along incoming edges on Shift+Tab', () => {
    const prev = findNextSpatialNode('node-note', mockNodes, mockEdges, 'backward');
    expect(prev?.id).toBe('node-condition');
  });

  it('navigates strictly forward across unconnected evenly-spaced cards without ping-ponging', () => {
    // Start at A -> Tab -> B
    const step1 = findNextSpatialNode('card-a', mockEvenlySpacedRow, [], 'forward');
    expect(step1?.id).toBe('card-b');

    // At B -> Tab -> must go forward to C, NEVER back to A!
    const step2 = findNextSpatialNode('card-b', mockEvenlySpacedRow, [], 'forward');
    expect(step2?.id).toBe('card-c');

    // At C (end) -> Tab -> wraps around to A
    const step3 = findNextSpatialNode('card-c', mockEvenlySpacedRow, [], 'forward');
    expect(step3?.id).toBe('card-a');
  });

  it('navigates strictly backward across evenly-spaced cards with Shift+Tab', () => {
    // At C -> Shift+Tab -> B
    const step1 = findNextSpatialNode('card-c', mockEvenlySpacedRow, [], 'backward');
    expect(step1?.id).toBe('card-b');

    // At B -> Shift+Tab -> A
    const step2 = findNextSpatialNode('card-b', mockEvenlySpacedRow, [], 'backward');
    expect(step2?.id).toBe('card-a');

    // At A (start) -> Shift+Tab -> wraps around to C (furthest node)
    const step3 = findNextSpatialNode('card-a', mockEvenlySpacedRow, [], 'backward');
    expect(step3?.id).toBe('card-c');
  });

  it('picks the top-left node when no current node is selected', () => {
    const first = findNextSpatialNode(null, mockNodes, mockEdges, 'forward');
    expect(first?.id).toBe('node-watcher');
  });
});
