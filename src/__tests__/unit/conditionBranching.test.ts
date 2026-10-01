import { describe, it, expect } from 'vitest';
import { evaluateCondition } from '@/server/services/dslEngine';
import {
  generateLeaderboardAlertSummary,
  generateFilteredLeaderboardAlertSummary,
} from '@/server/services/graphEngine';
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

describe('Radar Movers & Screener Condition Filtering Engine', () => {
  const MOCK_MOVERS: MarketEvent[] = [
    { symbol: 'PTRO', price: 18200, prevPrice: 15900, price_change: 14.46, volume: 55000000, avg_volume: 20000000, rank: 1, timestamp: '14:30:00' },
    { symbol: 'BUMI', price: 140, prevPrice: 129, price_change: 8.52, volume: 850000000, avg_volume: 300000000, rank: 2, timestamp: '14:30:00' },
    { symbol: 'BBCA', price: 10200, prevPrice: 10000, price_change: 2.00, volume: 45000000, avg_volume: 50000000, rank: 3, timestamp: '14:30:00' },
    { symbol: 'TLKM', price: 2900, prevPrice: 2880, price_change: 0.69, volume: 30000000, avg_volume: 40000000, rank: 4, timestamp: '14:30:00' },
  ];

  function simulateMoverConditionFiltering(
    rule: string,
    movers: MarketEvent[],
    edges: MockEdge[],
    condNodeId: string = 'cond-1'
  ) {
    const passedMovers = movers.filter((m) => evaluateCondition(rule, m));
    const failedMovers = movers.filter((m) => !evaluateCondition(rule, m));
    const isPassed = passedMovers.length > 0;
    const status = isPassed ? 'passed' : 'failed';

    const triggeredNodes: string[] = [condNodeId];
    const executedEdges: string[] = [];
    const trueBranchMovers: MarketEvent[] = [];
    const falseBranchMovers: MarketEvent[] = [];

    const outgoing = edges.filter((e) => e.fromId === condNodeId);
    for (const edge of outgoing) {
      const handle = edge.fromHandle || 'true';
      if (handle === 'true') {
        triggeredNodes.push(edge.toId);
        executedEdges.push(edge.id);
        trueBranchMovers.push(...passedMovers);
      } else if (handle === 'false') {
        triggeredNodes.push(edge.toId);
        executedEdges.push(edge.id);
        falseBranchMovers.push(...failedMovers);
      }
    }

    return {
      status,
      passedCount: passedMovers.length,
      failedCount: failedMovers.length,
      passedMovers,
      failedMovers,
      triggeredNodes,
      executedEdges,
      trueBranchMovers,
      falseBranchMovers,
    };
  }

  it('filters movers list and sets condition status to passed when matching stocks exist', () => {
    const edges: MockEdge[] = [
      { id: 'edge-true', fromId: 'cond-1', toId: 'note-passed', fromHandle: 'true' },
      { id: 'edge-false', fromId: 'cond-1', toId: 'note-failed', fromHandle: 'false' },
    ];

    const result = simulateMoverConditionFiltering('price_change > 5', MOCK_MOVERS, edges);
    expect(result.status).toBe('passed');
    expect(result.passedCount).toBe(2);
    expect(result.failedCount).toBe(2);
    expect(result.passedMovers.map((m) => m.symbol)).toEqual(['PTRO', 'BUMI']);
    expect(result.failedMovers.map((m) => m.symbol)).toEqual(['BBCA', 'TLKM']);
    expect(result.triggeredNodes).toEqual(['cond-1', 'note-passed', 'note-failed']);
  });

  it('sets condition status to failed when 0 movers pass the rule', () => {
    const edges: MockEdge[] = [
      { id: 'edge-true', fromId: 'cond-1', toId: 'note-passed', fromHandle: 'true' },
      { id: 'edge-false', fromId: 'cond-1', toId: 'note-failed', fromHandle: 'false' },
    ];

    const result = simulateMoverConditionFiltering('price_change > 50', MOCK_MOVERS, edges);
    expect(result.status).toBe('failed');
    expect(result.passedCount).toBe(0);
    expect(result.failedCount).toBe(4);
    expect(result.passedMovers).toHaveLength(0);
    expect(result.failedMovers).toHaveLength(4);
  });

  it('supports volume and combined multi-metric condition rules on movers', () => {
    const edges: MockEdge[] = [
      { id: 'edge-true', fromId: 'cond-1', toId: 'alert-breakout', fromHandle: 'true' },
    ];

    const result = simulateMoverConditionFiltering('price_change > 5 AND volume > 100000000', MOCK_MOVERS, edges);
    expect(result.status).toBe('passed');
    expect(result.passedCount).toBe(1);
    expect(result.passedMovers[0].symbol).toBe('BUMI');
  });

  it('evaluates screener properties like pe and market_cap in conditions', () => {
    const screenerStocks: MarketEvent[] = [
      { symbol: 'BBCA', price: 10000, price_change: 2.0, volume: 50000000, pe: 22.5, market_cap: 1200000000000000 } as any,
      { symbol: 'BBRI', price: 5000, price_change: 1.5, volume: 80000000, pe: 11.2, market_cap: 750000000000000 } as any,
    ];

    const edges: MockEdge[] = [
      { id: 'edge-true', fromId: 'cond-1', toId: 'note-low-pe', fromHandle: 'true' },
    ];

    const result = simulateMoverConditionFiltering('pe < 15', screenerStocks, edges);
    expect(result.status).toBe('passed');
    expect(result.passedCount).toBe(1);
    expect(result.passedMovers[0].symbol).toBe('BBRI');
  });

  describe('Leaderboard & Filtered Alert Summary text generators', () => {
    it('generates multi-stock direct alert summary with rank numbers and percentages', () => {
      const summary = generateLeaderboardAlertSummary(MOCK_MOVERS, 'top_gainers', '1d');
      expect(summary).toContain('🚀 Top Gainers (1D)');
      expect(summary).toContain('#1 PTRO (+14.46%)');
      expect(summary).toContain('#2 BUMI (+8.52%)');
      expect(summary).toContain('#3 BBCA (+2%)');
      expect(summary).toContain('#4 TLKM (+0.69%)');
    });

    it('generates filtered True branch alert summary with matching ratio', () => {
      const passed = [MOCK_MOVERS[0], MOCK_MOVERS[1]];
      const summary = generateFilteredLeaderboardAlertSummary(
        passed,
        'price_change > 5',
        'top_gainers',
        4,
        true
      );
      expect(summary).toBe('🚀 2/4 Top Gainers passed "price_change > 5": #1 PTRO (+14.46%), #2 BUMI (+8.52%)');
    });

    it('generates filtered False branch alert summary with non-matching ratio', () => {
      const failed = [MOCK_MOVERS[2], MOCK_MOVERS[3]];
      const summary = generateFilteredLeaderboardAlertSummary(
        failed,
        'price_change > 5',
        'top_gainers',
        4,
        false
      );
      expect(summary).toBe('⚖️ 2/4 Top Gainers failed "price_change > 5": #3 BBCA (+2%), #4 TLKM (+0.69%)');
    });

    it('generates graceful summary when 0 stocks pass filter', () => {
      const summary = generateFilteredLeaderboardAlertSummary(
        [],
        'price_change > 50',
        'top_gainers',
        4,
        true
      );
      expect(summary).toBe('📊 Filter Alert: 0/4 Top Gainers passed "price_change > 50"');
    });
  });
});

