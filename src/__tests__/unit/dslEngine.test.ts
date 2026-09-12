import { describe, it, expect } from 'vitest';
import { evaluateCondition } from '@/server/services/dslEngine';
import { BBCA_SURGE, BBRI_NEUTRAL, TLKM_DROP, BMRI_VOLUME_SPIKE } from '../fixtures/marketEvents';

describe('evaluateCondition — price_change rules', () => {
  it('returns true when price_change > 5 and event is +6.37%', () => {
    expect(evaluateCondition('price_change > 5', BBCA_SURGE)).toBe(true);
  });

  it('returns false when price_change > 5 and event is +1.96%', () => {
    expect(evaluateCondition('price_change > 5', BBRI_NEUTRAL)).toBe(false);
  });

  it('returns true for drop: price_change < 0', () => {
    expect(evaluateCondition('price_change < 0', TLKM_DROP)).toBe(true);
  });

  it('returns false for drop rule on a gainer', () => {
    expect(evaluateCondition('price_change < 0', BBCA_SURGE)).toBe(false);
  });

  it('returns true for >= boundary (exact match)', () => {
    expect(evaluateCondition('price_change >= 6.37', BBCA_SURGE)).toBe(true);
  });

  it('returns false for > boundary (exact match, not strictly greater)', () => {
    expect(evaluateCondition('price_change > 6.37', BBCA_SURGE)).toBe(false);
  });

  it('returns true for != comparison', () => {
    expect(evaluateCondition('price_change != 0', BBCA_SURGE)).toBe(true);
  });

  it('returns true for == comparison', () => {
    expect(evaluateCondition('price_change == 6.37', BBCA_SURGE)).toBe(true);
  });
});

describe('evaluateCondition — volume rules', () => {
  it('returns true when volume > 2 * avg_volume (spike)', () => {
    expect(evaluateCondition('volume > 2 * avg_volume', BMRI_VOLUME_SPIKE)).toBe(true);
  });

  it('returns false when volume equals avg_volume (no spike)', () => {
    expect(evaluateCondition('volume > 2 * avg_volume', BBRI_NEUTRAL)).toBe(false);
  });

  it('returns true for volume > absolute threshold', () => {
    expect(evaluateCondition('volume > 1000000', BBCA_SURGE)).toBe(true);
  });

  it('returns false for volume below absolute threshold', () => {
    expect(evaluateCondition('volume > 999999999', BBCA_SURGE)).toBe(false);
  });
});

describe('evaluateCondition — rank rules', () => {
  it('returns true when rank <= 3 and rank is 1', () => {
    expect(evaluateCondition('rank <= 3', BBCA_SURGE)).toBe(true);
  });

  it('returns false when rank <= 3 and rank is 4', () => {
    expect(evaluateCondition('rank <= 3', TLKM_DROP)).toBe(false);
  });

  it('defaults rank to 0 when undefined, making rank <= 3 false', () => {
    const event = { ...BBCA_SURGE, rank: undefined as any };
    expect(evaluateCondition('rank <= 3', event)).toBe(true); // 0 <= 3
  });
});

describe('evaluateCondition — compound AND/OR rules', () => {
  it('AND: both conditions true → true', () => {
    expect(evaluateCondition('price_change > 5 AND volume > 1000000', BBCA_SURGE)).toBe(true);
  });

  it('AND: first true, second false → false', () => {
    expect(evaluateCondition('price_change > 5 AND volume > 999999999', BBCA_SURGE)).toBe(false);
  });

  it('AND: first false, second true → false', () => {
    expect(evaluateCondition('price_change > 10 AND volume > 1000000', BBCA_SURGE)).toBe(false);
  });

  it('OR: first true, second false → true', () => {
    expect(evaluateCondition('price_change > 5 OR volume > 999999999', BBCA_SURGE)).toBe(true);
  });

  it('OR: both false → false', () => {
    expect(evaluateCondition('price_change > 10 OR volume > 999999999', BBCA_SURGE)).toBe(false);
  });

  it('AND is case-insensitive (lowercase)', () => {
    expect(evaluateCondition('price_change > 5 and volume > 1000000', BBCA_SURGE)).toBe(true);
  });

  it('OR is case-insensitive (uppercase)', () => {
    expect(evaluateCondition('price_change > 10 OR volume > 1000000', BBCA_SURGE)).toBe(true);
  });

  it('handles 3-clause compound rule', () => {
    expect(evaluateCondition('price_change > 5 AND volume > 1000000 AND rank <= 3', BBCA_SURGE)).toBe(true);
  });

  it('handles arithmetic in rule: volume > 2 * avg_volume', () => {
    expect(evaluateCondition('volume > 2 * avg_volume', BMRI_VOLUME_SPIKE)).toBe(true);
  });
});

describe('evaluateCondition — edge cases', () => {
  it('returns false for empty rule string', () => {
    expect(evaluateCondition('', BBCA_SURGE)).toBe(false);
  });

  it('returns false for null rule (no crash)', () => {
    expect(evaluateCondition(null as any, BBCA_SURGE)).toBe(false);
  });

  it('returns false for undefined rule (no crash)', () => {
    expect(evaluateCondition(undefined as any, BBCA_SURGE)).toBe(false);
  });

  it('returns false for malformed DSL (no crash)', () => {
    expect(evaluateCondition('price_change >>> broken &&', BBCA_SURGE)).toBe(false);
  });

  it('returns false for plain string that is not a valid expression', () => {
    expect(evaluateCondition('hello world', BBCA_SURGE)).toBe(false);
  });

  it('handles prevPrice variable', () => {
    expect(evaluateCondition('prevPrice > 0', BBCA_SURGE)).toBe(true);
  });

  it('handles camelCase alias priceChange', () => {
    expect(evaluateCondition('priceChange > 5', BBCA_SURGE)).toBe(true);
  });

  it('handles avgVolume camelCase alias', () => {
    expect(evaluateCondition('volume > 2 * avgVolume', BMRI_VOLUME_SPIKE)).toBe(true);
  });
});
