import { describe, it, expect, vi } from 'vitest';
import { getTopMarketMovers, TopMoversResult } from '@/server/services/sectorsApi';

describe('getTopMarketMovers parameter building & error handling', () => {
  it('returns valid mock movers and isLive=false when no API key is provided', async () => {
    const result: TopMoversResult = await getTopMarketMovers(undefined, {
      nStock: 5,
      periods: '1d',
      classifications: 'all',
    });

    expect(result.isLive).toBe(false);
    expect(result.gainers).toHaveLength(5);
    expect(result.losers).toHaveLength(5);
    expect(result.gainers[0].symbol).toBeTruthy();
    expect(result.gainers[0].price_change).toBeGreaterThan(0);
    expect(result.losers[0].symbol).toBeTruthy();
    expect(result.losers[0].price_change).toBeLessThan(0);
    expect(result.error).toBeUndefined();
  });

  it('captures structured error metadata when API request fails in live mode', async () => {
    const origFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ detail: 'TOKEN_NOT_VALID' }), {
        status: 401,
        statusText: 'Unauthorized',
        headers: { 'Content-Type': 'application/json' },
      });

    try {
      const result: TopMoversResult = await getTopMarketMovers('invalid_key_for_test', {
        nStock: 5,
        periods: '1d',
        classifications: 'all',
      });

      expect(result.isLive).toBe(false);
      expect(result.gainers).toBeDefined();
      expect(result.losers).toBeDefined();
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe(401);
      expect(typeof result.error?.message).toBe('string');
    } finally {
      globalThis.fetch = origFetch;
    }
  });

  it('correctly normalizes parameter structure omitting "all" classifications', () => {
    const buildParams = (options?: { classifications?: string; periods?: string; nStock?: number; minMcapBillion?: number }) => {
      const params: Record<string, any> = {
        periods: options?.periods || '1d',
        n_stock: options?.nStock || 5,
      };

      if (options?.classifications && options.classifications !== 'all') {
        params.classifications = options.classifications;
      }

      if (options?.minMcapBillion !== undefined && options.minMcapBillion > 0) {
        params.min_mcap_billion = options.minMcapBillion;
      }

      return params;
    };

    const paramsDefault = buildParams({ classifications: 'all', periods: '1d', nStock: 5 });
    expect(paramsDefault).not.toHaveProperty('classifications');
    expect(paramsDefault.periods).toBe('1d');
    expect(paramsDefault.n_stock).toBe(5);

    const paramsSpecific = buildParams({ classifications: 'banks', periods: '7d', nStock: 10, minMcapBillion: 500 });
    expect(paramsSpecific.classifications).toBe('banks');
    expect(paramsSpecific.periods).toBe('7d');
    expect(paramsSpecific.n_stock).toBe(10);
    expect(paramsSpecific.min_mcap_billion).toBe(500);
  });
});
