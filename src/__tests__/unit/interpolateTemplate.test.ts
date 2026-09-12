import { describe, it, expect } from 'vitest';
import { interpolateTemplate } from '@/server/services/graphEngine';
import { BBCA_SURGE, TLKM_DROP, MOCK_GAINERS } from '../fixtures/marketEvents';

describe('interpolateTemplate — basic variable substitution', () => {
  it('substitutes ${symbol}', () => {
    expect(interpolateTemplate('Stock: ${symbol}', BBCA_SURGE)).toContain('BBCA');
  });

  it('substitutes ${price_change} with + sign for gainers', () => {
    expect(interpolateTemplate('Change: ${price_change}', BBCA_SURGE)).toContain('+6.37%');
  });

  it('substitutes ${price_change} with - sign for losers', () => {
    const result = interpolateTemplate('Change: ${price_change}', TLKM_DROP);
    expect(result).toContain('-1.58%');
  });

  it('substitutes ${price} formatted as IDR (Rp)', () => {
    const result = interpolateTemplate('Price: ${price}', BBCA_SURGE);
    expect(result).toContain('Rp');
  });

  it('substitutes ${volume} in human-readable M format (25M)', () => {
    // 25_000_000 → "25.0M"
    const result = interpolateTemplate('Volume: ${volume}', BBCA_SURGE);
    expect(result).toContain('25.0M');
  });

  it('substitutes large volume in B format', () => {
    const bigVolumeEvent = { ...BBCA_SURGE, volume: 2_500_000_000 };
    const result = interpolateTemplate('Volume: ${volume}', bigVolumeEvent);
    expect(result).toContain('2.5B');
  });

  it('substitutes small volume in K format', () => {
    const smallVolumeEvent = { ...BBCA_SURGE, volume: 500_000 };
    const result = interpolateTemplate('Volume: ${volume}', smallVolumeEvent);
    expect(result).toContain('500K');
  });

  it('substitutes ${timestamp}', () => {
    const result = interpolateTemplate('Time: ${timestamp}', BBCA_SURGE);
    expect(result).toContain('16:30:00');
  });

  it('substitutes ${rank} with # prefix', () => {
    const result = interpolateTemplate('Rank: ${rank}', BBCA_SURGE);
    expect(result).toContain('#1');
  });

  it('substitutes ${direction} as "Gainer" for positive price_change', () => {
    const result = interpolateTemplate('Dir: ${direction}', BBCA_SURGE);
    expect(result).toContain('Gainer');
  });

  it('substitutes ${direction} as "Loser" for negative price_change', () => {
    const result = interpolateTemplate('Dir: ${direction}', TLKM_DROP);
    expect(result).toContain('Loser');
  });

  it('substitutes ${raw_price_change} as raw number string', () => {
    const result = interpolateTemplate('Raw: ${raw_price_change}', BBCA_SURGE);
    expect(result).toContain('6.37');
  });
});

describe('interpolateTemplate — multi-variable templates', () => {
  it('handles the standard note template with multiple vars', () => {
    const template = '${symbol} surged ${price_change} on ${volume} volume at ${timestamp}';
    const result = interpolateTemplate(template, BBCA_SURGE);
    expect(result).toContain('BBCA');
    expect(result).toContain('+6.37%');
    expect(result).toContain('25.0M');
    expect(result).toContain('16:30:00');
  });

  it('handles the auto-tracked pipeline template', () => {
    const template = '🚀 Auto-Tracked: ${symbol}\n• Price: Rp ${price}\n• Change: ${price_change}%\n• Updated: ${timestamp}';
    const result = interpolateTemplate(template, BBCA_SURGE);
    expect(result).toContain('BBCA');
    expect(result).toContain('Rp');
    expect(result).toContain('+6.37%');
  });
});

describe('interpolateTemplate — unknown variables', () => {
  it('leaves unknown ${variable} unchanged', () => {
    const result = interpolateTemplate('Hello ${unknown_var}', BBCA_SURGE);
    expect(result).toBe('Hello ${unknown_var}');
  });

  it('only replaces known vars and leaves unknowns intact', () => {
    const result = interpolateTemplate('${symbol} and ${mystery}', BBCA_SURGE);
    expect(result).toContain('BBCA');
    expect(result).toContain('${mystery}');
  });
});

describe('interpolateTemplate — edge cases', () => {
  it('handles template with no variables (returns as-is)', () => {
    const result = interpolateTemplate('Plain text with no vars', BBCA_SURGE);
    expect(result).toBe('Plain text with no vars');
  });

  it('handles empty template string', () => {
    const result = interpolateTemplate('', BBCA_SURGE);
    expect(result).toBe('');
  });

  it('handles 0 price_change correctly (shows +0%)', () => {
    const zeroEvent = { ...BBCA_SURGE, price_change: 0 };
    const result = interpolateTemplate('${price_change}', zeroEvent);
    expect(result).toContain('+0%');
  });

  it('handles missing rank (shows empty string for ${rank})', () => {
    const noRankEvent = { ...BBCA_SURGE, rank: undefined };
    const result = interpolateTemplate('Rank: ${rank}', noRankEvent);
    // rank is undefined → rankStr is '' → result: "Rank: "
    expect(result).toBe('Rank: ');
  });
});
