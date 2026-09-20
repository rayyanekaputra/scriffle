import { describe, it, expect } from 'vitest';
import { evaluateCondition } from '@/server/services/dslEngine';
import { MarketEvent } from '@/types/canvas';

interface MockEdge {
  id: string;
  fromId: string;
  toId: string;
  fromHandle?: string | null;
}

interface MockNode {
  id: string;
  type: string;
  config: any;
}

/**
 * Pure simulation of the graphEngine condition branching traversal algorithm
 */
function simulateConditionBranching(
  conditionNode: MockNode,
  edges: MockEdge[],
  event: MarketEvent
): { triggeredNodes: string[]; executedEdges: string[]; branch: 'true' | 'false'; log: string } {
  const passed = evaluateCondition(conditionNode.config.rule || '', event);
  const branch = passed ? 'true' : 'false';
  const log = passed
    ? `Condition matched: "${conditionNode.config.rule}" for ${event.symbol} (routing True branch)`
    : `Condition not met: "${conditionNode.config.rule}" for ${event.symbol} (routing False branch)` ;

  const triggeredNodes: string[] = [conditionNode.id];
  const executedEdges: string[] = [];

  const outgoing = edges.filter((e) => e.fromId === conditionNode.id);
  for (const edge of outgoing) {
    const handle = edge.fromHandle || 'true'; // null/legacy defaults to 'true'
    if (passed && handle === 'true') {
      triggeredNodes.push(edge.toId);
      executedEdges.push(edge.id);
    } else if (!passed && handle === 'false') {
      triggeredNodes.push(edge.toId);
      executedEdges.push(edge.id);
    }
  }

  return { triggeredNodes, executedEdges, branch, log };
}

describe('Condition Node Dual Outputs & False Branching Engine', () => {
  const SURGE_EVENT: MarketEvent = {
    symbol: 'BBCA',
    price: 10450,
    prevPrice: 9850,
    price_change: 6.09,
    volume: 55000000,
    avg_volume: 25000000,
    timestamp: '10:30:00',
  };

  const MILD_EVENT: MarketEvent = {
    symbol: 'BBCA',
    price: 9900,
    prevPrice: 9850,
    price_change: 0.51,
    volume: 12000000,
    avg_volume: 25000000,
    timestamp: '10:30:00',
  };

  const DROP_EVENT: MarketEvent = {
    symbol: 'BBCA',
    price: 9500,
    prevPrice: 9850,
    price_change: -3.55,
    volume: 35000000,
    avg_volume: 25000000,
    timestamp: '10:30:00',
  };

  const conditionNode: MockNode = {
    id: 'cond-1',
    type: 'condition',
    config: { rule: 'price_change > 5' },
  };

  it('routes to True branch when condition passes', () => {
    const edges: MockEdge[] = [
      { id: 'edge-true', fromId: 'cond-1', toId: 'alert-surge', fromHandle: 'true' },
      { id: 'edge-false', fromId: 'cond-1', toId: 'note-steady', fromHandle: 'false' },
    ];

    const result = simulateConditionBranching(conditionNode, edges, SURGE_EVENT);
    expect(result.branch).toBe('true');
    expect(result.executedEdges).toEqual(['edge-true']);
    expect(result.triggeredNodes).toEqual(['cond-1', 'alert-surge']);
    expect(result.log).toContain('routing True branch');
  });

  it('routes to False branch when condition fails', () => {
    const edges: MockEdge[] = [
      { id: 'edge-true', fromId: 'cond-1', toId: 'alert-surge', fromHandle: 'true' },
      { id: 'edge-false', fromId: 'cond-1', toId: 'note-steady', fromHandle: 'false' },
    ];

    const result = simulateConditionBranching(conditionNode, edges, MILD_EVENT);
    expect(result.branch).toBe('false');
    expect(result.executedEdges).toEqual(['edge-false']);
    expect(result.triggeredNodes).toEqual(['cond-1', 'note-steady']);
    expect(result.log).toContain('routing False branch');
  });

  it('routes to False branch on negative drop events', () => {
    const edges: MockEdge[] = [
      { id: 'edge-true', fromId: 'cond-1', toId: 'alert-surge', fromHandle: 'true' },
      { id: 'edge-false', fromId: 'cond-1', toId: 'note-steady', fromHandle: 'false' },
    ];

    const result = simulateConditionBranching(conditionNode, edges, DROP_EVENT);
    expect(result.branch).toBe('false');
    expect(result.executedEdges).toEqual(['edge-false']);
    expect(result.triggeredNodes).toContain('note-steady');
    expect(result.triggeredNodes).not.toContain('alert-surge');
  });

  it('treats legacy null fromHandle as "true" branch for backward compatibility', () => {
    const edges: MockEdge[] = [
      { id: 'edge-legacy', fromId: 'cond-1', toId: 'note-legacy', fromHandle: null },
    ];

    // Passes -> triggers legacy edge
    const passResult = simulateConditionBranching(conditionNode, edges, SURGE_EVENT);
    expect(passResult.executedEdges).toEqual(['edge-legacy']);
    expect(passResult.triggeredNodes).toEqual(['cond-1', 'note-legacy']);

    // Fails -> does NOT trigger legacy edge
    const failResult = simulateConditionBranching(conditionNode, edges, MILD_EVENT);
    expect(failResult.executedEdges).toEqual([]);
    expect(failResult.triggeredNodes).toEqual(['cond-1']);
  });

  it('supports multiple downstream nodes connected to the same True branch', () => {
    const edges: MockEdge[] = [
      { id: 'edge-true-1', fromId: 'cond-1', toId: 'alert-1', fromHandle: 'true' },
      { id: 'edge-true-2', fromId: 'cond-1', toId: 'note-1', fromHandle: 'true' },
      { id: 'edge-false-1', fromId: 'cond-1', toId: 'note-2', fromHandle: 'false' },
    ];

    const result = simulateConditionBranching(conditionNode, edges, SURGE_EVENT);
    expect(result.executedEdges).toEqual(['edge-true-1', 'edge-true-2']);
    expect(result.triggeredNodes).toEqual(['cond-1', 'alert-1', 'note-1']);
  });

  it('supports multiple downstream nodes connected to the same False branch', () => {
    const edges: MockEdge[] = [
      { id: 'edge-true-1', fromId: 'cond-1', toId: 'alert-1', fromHandle: 'true' },
      { id: 'edge-false-1', fromId: 'cond-1', toId: 'note-fail-1', fromHandle: 'false' },
      { id: 'edge-false-2', fromId: 'cond-1', toId: 'alert-fail-2', fromHandle: 'false' },
    ];

    const result = simulateConditionBranching(conditionNode, edges, MILD_EVENT);
    expect(result.executedEdges).toEqual(['edge-false-1', 'edge-false-2']);
    expect(result.triggeredNodes).toEqual(['cond-1', 'note-fail-1', 'alert-fail-2']);
  });

  it('handles condition nodes with only True branch attached (no False branch)', () => {
    const edges: MockEdge[] = [
      { id: 'edge-true', fromId: 'cond-1', toId: 'alert-surge', fromHandle: 'true' },
    ];

    const passResult = simulateConditionBranching(conditionNode, edges, SURGE_EVENT);
    expect(passResult.executedEdges).toEqual(['edge-true']);

    const failResult = simulateConditionBranching(conditionNode, edges, MILD_EVENT);
    expect(failResult.executedEdges).toEqual([]);
    expect(failResult.triggeredNodes).toEqual(['cond-1']); // condition is still recorded
  });

  it('handles condition nodes with only False branch attached (no True branch)', () => {
    const edges: MockEdge[] = [
      { id: 'edge-false', fromId: 'cond-1', toId: 'note-steady', fromHandle: 'false' },
    ];

    const passResult = simulateConditionBranching(conditionNode, edges, SURGE_EVENT);
    expect(passResult.executedEdges).toEqual([]);

    const failResult = simulateConditionBranching(conditionNode, edges, MILD_EVENT);
    expect(failResult.executedEdges).toEqual(['edge-false']);
    expect(failResult.triggeredNodes).toEqual(['cond-1', 'note-steady']);
  });
});
