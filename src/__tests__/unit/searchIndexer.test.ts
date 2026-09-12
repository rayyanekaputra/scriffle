import { describe, it, expect } from 'vitest';
import { searchCanvasNodes, extractNodeSearchText } from '@/lib/searchIndexer';
import { CanvasNodeData } from '@/types/canvas';

const mockNodes: CanvasNodeData[] = [
  {
    id: 'node-1',
    canvasId: 'test-canvas',
    type: 'watcher',
    position: { x: 100, y: 100 },
    config: { symbol: 'BBCA', metric: 'price_change', interval: 300 },
  },
  {
    id: 'node-2',
    canvasId: 'test-canvas',
    type: 'watcher',
    position: { x: 100, y: 300 },
    config: { symbol: 'TLKM', metric: 'price_change', mode: 'top_gainers', interval: 60 },
  },
  {
    id: 'node-3',
    canvasId: 'test-canvas',
    type: 'screener',
    position: { x: 400, y: 100 },
    config: { query: 'top 5 banks by market cap', limit: 5 },
  },
  {
    id: 'node-4',
    canvasId: 'test-canvas',
    type: 'condition',
    position: { x: 400, y: 300 },
    config: { rule: 'price_change > 5 AND volume > 1000000' },
  },
  {
    id: 'node-5',
    canvasId: 'test-canvas',
    type: 'note',
    position: { x: 700, y: 100 },
    config: { content: 'Watching banking sector breakout momentum', color: 'yellow' },
  },
  {
    id: 'node-6',
    canvasId: 'test-canvas',
    type: 'action',
    position: { x: 700, y: 300 },
    config: { action: 'fundamental_report', targetSymbol: 'BBCA' },
  },
  {
    id: 'node-7',
    canvasId: 'test-canvas',
    type: 'file',
    position: { x: 1000, y: 100 },
    config: {
      fileName: 'BBCA_Fundamental_Brief.html',
      fileUrl: '/reports/BBCA_Fundamental_Brief.html',
      fileSize: '14.2 KB',
      fileCategory: 'report' as any,
      savedLocally: true,
    },
  },
  {
    id: 'node-8',
    canvasId: 'test-canvas',
    type: 'sticker',
    position: { x: 1000, y: 300 },
    config: { stickerType: 'bullish' },
  },
];

describe('extractNodeSearchText', () => {
  it('extracts watcher fields correctly', () => {
    const extracted = extractNodeSearchText(mockNodes[0]);
    expect(extracted.title).toBe('BBCA Watcher');
    expect(extracted.badge).toBe('BBCA');
    expect(extracted.searchTokens).toContain('BBCA');
    expect(extracted.searchTokens).toContain('price_change');
  });

  it('extracts screener fields correctly', () => {
    const extracted = extractNodeSearchText(mockNodes[2]);
    expect(extracted.title).toBe('AI Company Screener');
    expect(extracted.subtitle).toContain('top 5 banks');
    expect(extracted.searchTokens).toContain('screener');
  });

  it('extracts condition rule correctly', () => {
    const extracted = extractNodeSearchText(mockNodes[3]);
    expect(extracted.title).toBe('Condition Rule');
    expect(extracted.subtitle).toBe('price_change > 5 AND volume > 1000000');
  });

  it('extracts note content preview', () => {
    const extracted = extractNodeSearchText(mockNodes[4]);
    expect(extracted.title).toBe('Sticky Note');
    expect(extracted.subtitle).toContain('Watching banking sector');
  });

  it('extracts file node attributes', () => {
    const extracted = extractNodeSearchText(mockNodes[6]);
    expect(extracted.title).toBe('BBCA_Fundamental_Brief.html');
    expect(extracted.badge).toBe('Saved');
  });

  it('extracts sticker node attributes with emoji and label', () => {
    const extracted = extractNodeSearchText(mockNodes[7]);
    expect(extracted.title).toContain('bullish');
    expect(extracted.searchTokens).toContain('sticker');
  });
});

describe('searchCanvasNodes', () => {
  it('returns all nodes when query is empty', () => {
    const results = searchCanvasNodes(mockNodes, '');
    expect(results.length).toBe(mockNodes.length);
  });

  it('finds watcher by ticker symbol (case-insensitive)', () => {
    const results = searchCanvasNodes(mockNodes, 'bbca');
    expect(results.length).toBeGreaterThanOrEqual(1);
    const topResult = results[0];
    expect(topResult.id).toBe('node-1');
  });

  it('finds screener by query keyword', () => {
    const results = searchCanvasNodes(mockNodes, 'market cap');
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('node-3');
  });

  it('finds note by text content', () => {
    const results = searchCanvasNodes(mockNodes, 'breakout');
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('node-5');
  });

  it('finds condition by operator or rule keyword', () => {
    const results = searchCanvasNodes(mockNodes, 'volume > 1000000');
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('node-4');
  });

  it('finds action by action type', () => {
    const results = searchCanvasNodes(mockNodes, 'fundamental report');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((r) => r.id === 'node-6')).toBe(true);
  });

  it('finds file by filename or extension', () => {
    const results = searchCanvasNodes(mockNodes, 'Fundamental_Brief');
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('node-7');
  });

  it('returns empty array when nothing matches', () => {
    const results = searchCanvasNodes(mockNodes, 'nonexistentxyz123');
    expect(results).toEqual([]);
  });

  it('handles empty node list gracefully', () => {
    const results = searchCanvasNodes([], 'test');
    expect(results).toEqual([]);
  });
});
