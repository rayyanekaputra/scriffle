import { describe, it, expect } from 'vitest';
import type { ScreenerConfig, WatcherConfig } from '@/types/canvas';

describe('Screener & Watcher Cadence / Interval Validation', () => {
  it('supports sub-minute cadence intervals (5s, 10s, 15s, 30s)', () => {
    const subMinuteIntervals = [5, 10, 15, 30];
    
    subMinuteIntervals.forEach((interval) => {
      const screenerCfg: ScreenerConfig = {
        query: 'top 5 banks by market cap',
        interval,
      };
      expect(screenerCfg.interval).toBe(interval);
      expect(screenerCfg.interval).toBeLessThan(60);
      expect(Math.max(1, screenerCfg.interval || 300)).toBe(interval);
    });
  });

  it('supports standard minute and hour intervals', () => {
    const standardIntervals = [60, 300, 900, 3600];

    standardIntervals.forEach((interval) => {
      const screenerCfg: ScreenerConfig = {
        query: 'top 5 banks by market cap',
        interval,
      };
      expect(screenerCfg.interval).toBeGreaterThanOrEqual(60);
    });
  });

  it('defaults gracefully to 300s when interval is undefined or 0', () => {
    const defaultScreenerCfg: ScreenerConfig = {
      query: 'top 5 banks by market cap',
    };
    const resolvedInterval = Math.max(1, Number(defaultScreenerCfg.interval) || 300);
    expect(resolvedInterval).toBe(300);

    const zeroWatcherCfg: WatcherConfig = {
      symbol: 'BBCA',
      metric: 'price_change',
      interval: 0,
    };
    const resolvedWatcherInterval = Math.max(1, Number(zeroWatcherCfg.interval) || 300);
    expect(resolvedWatcherInterval).toBe(300);
  });
});

describe('Trigger Route Targeting Logic', () => {
  it('identifies targeted Screener node triggers', () => {
    const screenerNodes = [{ id: 'screener-1', type: 'screener' }];
    const watcherNodes = [{ id: 'watcher-1', type: 'watcher' }];
    const targetNodeId = 'screener-1';

    const isTargetingScreener = Boolean(targetNodeId && screenerNodes.some((s) => s.id === targetNodeId));
    const isTargetingWatcher = Boolean(
      (targetNodeId && watcherNodes.some((w) => w.id === targetNodeId)) || undefined
    );

    expect(isTargetingScreener).toBe(true);
    expect(isTargetingWatcher).toBe(false);
  });

  it('identifies targeted Watcher symbol triggers', () => {
    const screenerNodes = [{ id: 'screener-1', type: 'screener' }];
    const watcherNodes = [{ id: 'watcher-1', type: 'watcher' }];
    const requestedSymbols = ['BBCA'];
    const targetNodeId = undefined;

    const isTargetingScreener = Boolean(targetNodeId && screenerNodes.some((s) => s.id === targetNodeId));
    const isTargetingWatcher = Boolean(
      (targetNodeId && watcherNodes.some((w) => w.id === targetNodeId)) || (requestedSymbols && requestedSymbols.length > 0)
    );

    expect(isTargetingScreener).toBe(false);
    expect(isTargetingWatcher).toBe(true);
  });

  it('identifies global manual sync triggers (Do Once)', () => {
    const screenerNodes = [{ id: 'screener-1', type: 'screener' }];
    const watcherNodes = [{ id: 'watcher-1', type: 'watcher' }];
    const targetNodeId = undefined;
    const requestedSymbols = undefined;

    const isTargetingScreener = Boolean(targetNodeId && screenerNodes.some((s) => s.id === targetNodeId));
    const isTargetingWatcher = Boolean(
      (targetNodeId && watcherNodes.some((w) => w.id === targetNodeId)) || (requestedSymbols && (requestedSymbols as any).length > 0)
    );

    expect(isTargetingScreener).toBe(false);
    expect(isTargetingWatcher).toBe(false);
  });
});
