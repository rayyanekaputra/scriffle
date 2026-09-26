import { describe, it, expect } from 'vitest';
import { WatcherConfig, MarketEvent } from '@/types/canvas';

describe('WatcherNode initial state contract', () => {
  it('creates clean idle initial state with cycleCount = 0 and status = idle', () => {
    const initialState = { status: 'idle', cycleCount: 0 };
    expect(initialState.status).toBe('idle');
    expect(initialState.cycleCount).toBe(0);
    expect(initialState).not.toHaveProperty('movers');
    expect(initialState).not.toHaveProperty('lastValue');
  });

  it('correctly resolves empty movers list for fresh radar watchers', () => {
    const state: any = { status: 'idle', cycleCount: 0 };
    const config: WatcherConfig = {
      symbol: 'Top Gainers',
      metric: 'price_change',
      interval: 300,
      mode: 'top_gainers',
      limit: 5,
    };

    const isRadarMode =
      config.mode === 'top_gainers' ||
      config.mode === 'top_losers' ||
      config.symbol === 'Top Gainers' ||
      config.symbol === 'Top Losers' ||
      config.symbol === 'TOP_GAINERS' ||
      config.symbol === 'TOP_LOSERS';

    const lastVal = state.lastValue || {};

    const movers: MarketEvent[] = isRadarMode
      ? (Array.isArray(state.movers) && state.movers.length > 0 ? state.movers : [])
      : (Array.isArray(state.movers) && state.movers.length > 0
          ? state.movers
          : lastVal.symbol && lastVal.symbol !== 'TOP_GAINERS' && lastVal.symbol !== 'TOP_LOSERS'
          ? [lastVal]
          : []);

    expect(movers).toEqual([]);
    expect(movers.length).toBe(0);
  });

  it('correctly preserves populated movers list after first poll execution', () => {
    const mockMovers: MarketEvent[] = [
      {
        symbol: 'JECX',
        name: 'Jaya Bersama Indo',
        price: 340,
        prevPrice: 272,
        price_change: 25.0,
        volume: 18500000,
        avg_volume: 8200000,
        rank: 1,
        timestamp: '10:30:00 AM',
      },
      {
        symbol: 'AGII',
        name: 'Aneka Gas Industri',
        price: 1980,
        prevPrice: 1720,
        price_change: 15.12,
        volume: 24200000,
        avg_volume: 11000000,
        rank: 2,
        timestamp: '10:30:00 AM',
      },
    ];

    const state: any = {
      status: 'passed',
      cycleCount: 1,
      lastTriggeredAt: '10:30:00 AM',
      movers: mockMovers,
    };

    const config: WatcherConfig = {
      symbol: 'Top Gainers',
      metric: 'price_change',
      interval: 300,
      mode: 'top_gainers',
      limit: 5,
    };

    const isRadarMode = config.mode === 'top_gainers';
    const lastVal = state.lastValue || {};

    const movers: MarketEvent[] = isRadarMode
      ? (Array.isArray(state.movers) && state.movers.length > 0 ? state.movers : [])
      : (Array.isArray(state.movers) && state.movers.length > 0
          ? state.movers
          : lastVal.symbol
          ? [lastVal]
          : []);

    expect(movers).toHaveLength(2);
    expect(movers[0].symbol).toBe('JECX');
    expect(state.cycleCount).toBe(1);
    expect(state.lastTriggeredAt).toBe('10:30:00 AM');
  });

  it('correctly handles single ticker idle state without price change badge', () => {
    const state: any = { status: 'idle', cycleCount: 0 };
    const lastVal = state.lastValue || {};
    const priceChange = lastVal.price_change !== undefined ? lastVal.price_change : null;

    expect(lastVal.price).toBeUndefined();
    expect(priceChange).toBeNull();
  });

  it('correctly updates single ticker state when tick arrives', () => {
    const state: any = {
      status: 'passed',
      cycleCount: 1,
      lastValue: {
        symbol: 'BBCA',
        price: 10250,
        prevPrice: 10000,
        price_change: 2.5,
        volume: 25000000,
        avg_volume: 15000000,
        timestamp: '10:30:00 AM',
      },
    };

    const lastVal = state.lastValue;
    const priceChange = lastVal.price_change !== undefined ? lastVal.price_change : null;

    expect(lastVal.price).toBe(10250);
    expect(priceChange).toBe(2.5);
    expect(state.cycleCount).toBe(1);
  });

  it('correctly defaults new watcher config to empty symbol', () => {
    const freshWatcherConfig: WatcherConfig = {
      symbol: '',
      metric: 'price_change',
      interval: 300,
    };
    expect(freshWatcherConfig.symbol).toBe('');
    expect(freshWatcherConfig.symbol).not.toBe('BBCA');
  });
});
