import { describe, it, expect } from 'vitest';
import { getNodeCreditCost } from '@/lib/creditCosts';

describe('getNodeCreditCost pricing calculation', () => {
  it('returns 10 credits / poll for Top Gainers radar watcher', () => {
    const cost = getNodeCreditCost('watcher', {
      mode: 'top_gainers',
      limit: 5,
    });
    expect(cost.credits).toBe(10);
    expect(cost.unit).toBe('poll');
    expect(cost.badgeText).toBe('10 credits / poll');
    expect(cost.endpoint).toBe('/v2/companies/top-changes/');
    expect(cost.isExpensive).toBe(true);
  });

  it('returns 10 credits / poll for Top Losers radar watcher', () => {
    const cost = getNodeCreditCost('watcher', {
      symbol: 'Top Losers',
      mode: 'top_losers',
    });
    expect(cost.credits).toBe(10);
    expect(cost.unit).toBe('poll');
    expect(cost.badgeText).toBe('10 credits / poll');
  });

  it('returns 1 credit / tick for single symbol watcher (BBCA)', () => {
    const cost = getNodeCreditCost('watcher', {
      symbol: 'BBCA',
      mode: 'single',
    });
    expect(cost.credits).toBe(1);
    expect(cost.unit).toBe('tick');
    expect(cost.badgeText).toBe('1 credit / tick');
    expect(cost.endpoint).toBe('/v2/daily/{symbol}/');
    expect(cost.isExpensive).toBe(false);
  });

  it('returns 3 AI credits / query for screener node', () => {
    const cost = getNodeCreditCost('screener', {
      query: 'top 5 banks by market cap',
      limit: 5,
    });
    expect(cost.credits).toBe(3);
    expect(cost.unit).toBe('screen');
    expect(cost.badgeText).toBe('3 AI credits / query');
    expect(cost.endpoint).toBe('/v2/companies/?q=...');
  });

  it('returns 8 credits / symbol with burst warning for fundamental_report action', () => {
    const cost = getNodeCreditCost('action', {
      action: 'fundamental_report',
    });
    expect(cost.credits).toBe(8);
    expect(cost.unit).toBe('symbol');
    expect(cost.badgeText).toBe('8 credits / symbol');
    expect(cost.endpoint).toBe('/v2/company/report/{symbol}/');
    expect(cost.isExpensive).toBe(true);
    expect(cost.burstWarning).toContain('40 credits');
  });

  it('returns 0 credits for local canvas mutation actions (create_note, create_watcher)', () => {
    const noteCost = getNodeCreditCost('action', { action: 'create_note' });
    expect(noteCost.credits).toBe(0);
    expect(noteCost.badgeText).toBe('0 credits (local)');

    const watcherCost = getNodeCreditCost('action', { action: 'create_watcher' });
    expect(watcherCost.credits).toBe(0);
    expect(watcherCost.badgeText).toBe('0 credits (local)');
  });

  it('returns 0 credits for non-API annotation nodes (note, text, sticker, file)', () => {
    expect(getNodeCreditCost('note').credits).toBe(0);
    expect(getNodeCreditCost('text').credits).toBe(0);
    expect(getNodeCreditCost('sticker').credits).toBe(0);
    expect(getNodeCreditCost('file').credits).toBe(0);
  });
});
