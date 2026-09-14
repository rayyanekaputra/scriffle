import { describe, it, expect } from 'vitest';
import { generateLeaderboardNoteContent } from '@/server/services/graphEngine';
import { MOCK_GAINERS, MOCK_LOSERS } from '../fixtures/marketEvents';

describe('generateLeaderboardNoteContent — gainers', () => {
  it('returns a non-empty string', () => {
    const result = generateLeaderboardNoteContent(MOCK_GAINERS, 'top_gainers');
    expect(result.length).toBeGreaterThan(0);
  });

  it('contains 🚀 emoji for gainers mode', () => {
    const result = generateLeaderboardNoteContent(MOCK_GAINERS, 'top_gainers');
    expect(result).toContain('🚀');
  });

  it('contains "TOP GAINERS" in title', () => {
    const result = generateLeaderboardNoteContent(MOCK_GAINERS, 'top_gainers');
    expect(result).toContain('TOP GAINERS');
  });

  it('contains all expected symbols', () => {
    const result = generateLeaderboardNoteContent(MOCK_GAINERS, 'top_gainers');
    expect(result).toContain('JECX');
    expect(result).toContain('AGII');
    expect(result).toContain('MPRO');
  });

  it('contains rank indicators #1, #2, #3', () => {
    const result = generateLeaderboardNoteContent(MOCK_GAINERS, 'top_gainers');
    expect(result).toMatch(/#1/);
    expect(result).toMatch(/#2/);
    expect(result).toMatch(/#3/);
  });

  it('shows positive price changes with + sign', () => {
    const result = generateLeaderboardNoteContent(MOCK_GAINERS, 'top_gainers');
    expect(result).toContain('+25%');
  });

  it('includes price in IDR format (Rp)', () => {
    const result = generateLeaderboardNoteContent(MOCK_GAINERS, 'top_gainers');
    expect(result).toContain('Rp');
  });

  it('includes "Updated:" timestamp line', () => {
    const result = generateLeaderboardNoteContent(MOCK_GAINERS, 'top_gainers');
    expect(result).toContain('Updated:');
  });
});

describe('generateLeaderboardNoteContent — losers', () => {
  it('contains 🔻 emoji for losers mode', () => {
    const result = generateLeaderboardNoteContent(MOCK_LOSERS, 'top_losers');
    expect(result).toContain('🔻');
  });

  it('contains "TOP LOSERS" in title', () => {
    const result = generateLeaderboardNoteContent(MOCK_LOSERS, 'top_losers');
    expect(result).toContain('TOP LOSERS');
  });

  it('contains expected loser symbols', () => {
    const result = generateLeaderboardNoteContent(MOCK_LOSERS, 'top_losers');
    expect(result).toContain('BKSL');
    expect(result).toContain('ELPI');
  });

  it('shows negative price changes', () => {
    const result = generateLeaderboardNoteContent(MOCK_LOSERS, 'top_losers');
    expect(result).toContain('-8.96%');
  });
});

describe('generateLeaderboardNoteContent — period label', () => {
  it('includes period string when provided', () => {
    const result = generateLeaderboardNoteContent(MOCK_GAINERS, 'top_gainers', '1d');
    expect(result).toContain('1D');
  });

  it('works without period param', () => {
    const result = generateLeaderboardNoteContent(MOCK_GAINERS, 'top_gainers');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('generateLeaderboardNoteContent — infers mode from data when mode is not set', () => {
  it('uses 🚀 when first mover has positive price_change', () => {
    const result = generateLeaderboardNoteContent(MOCK_GAINERS);
    expect(result).toContain('🚀');
  });

  it('uses 🔻 when first mover has negative price_change', () => {
    const result = generateLeaderboardNoteContent(MOCK_LOSERS);
    expect(result).toContain('🔻');
  });
});

describe('generateLeaderboardNoteContent — empty input', () => {
  it('returns fallback message for empty array', () => {
    const result = generateLeaderboardNoteContent([]);
    expect(result).toContain('No movers data available');
  });

  it('returns fallback for null/undefined (no crash)', () => {
    const result = generateLeaderboardNoteContent(null as any);
    expect(result).toContain('No movers data available');
  });
});

describe('mock movers fallback constants', () => {
  it('exports valid 5-item MOCK_TOP_GAINERS list with price and change fields', async () => {
    const { MOCK_TOP_GAINERS } = await import('@/lib/mockData');
    expect(MOCK_TOP_GAINERS).toHaveLength(5);
    expect(MOCK_TOP_GAINERS[0].symbol).toBe('JECX');
    expect(MOCK_TOP_GAINERS[0].price_change).toBeGreaterThan(0);
    expect(MOCK_TOP_GAINERS[0].rank).toBe(1);
  });

  it('exports valid 5-item MOCK_TOP_LOSERS list with price and change fields', async () => {
    const { MOCK_TOP_LOSERS } = await import('@/lib/mockData');
    expect(MOCK_TOP_LOSERS).toHaveLength(5);
    expect(MOCK_TOP_LOSERS[0].symbol).toBe('BKSL');
    expect(MOCK_TOP_LOSERS[0].price_change).toBeLessThan(0);
    expect(MOCK_TOP_LOSERS[0].rank).toBe(1);
  });
});

describe('radar watcher filtering isolation', () => {
  it('correctly distinguishes radar watcher configs from single-symbol watchers', () => {
    const isRadarWatcher = (configJson: string) => {
      try {
        const cfg = JSON.parse(configJson);
        const sym = cfg.symbol?.toUpperCase();
        const mode = cfg.mode;
        return (
          mode === 'top_gainers' ||
          mode === 'top_losers' ||
          sym === 'TOP_GAINERS' ||
          sym === 'TOP_LOSERS' ||
          sym === 'TOP GAINERS' ||
          sym === 'TOP LOSERS'
        );
      } catch {
        return false;
      }
    };

    expect(isRadarWatcher(JSON.stringify({ mode: 'top_gainers', limit: 5 }))).toBe(true);
    expect(isRadarWatcher(JSON.stringify({ mode: 'top_losers', limit: 5 }))).toBe(true);
    expect(isRadarWatcher(JSON.stringify({ symbol: 'TOP_GAINERS' }))).toBe(true);
    expect(isRadarWatcher(JSON.stringify({ symbol: 'BBCA', interval: '1m' }))).toBe(false);
    expect(isRadarWatcher(JSON.stringify({ symbol: 'GOTO', threshold: 5 }))).toBe(false);
  });
});
