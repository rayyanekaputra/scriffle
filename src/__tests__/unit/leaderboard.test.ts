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

describe('generateFilteredLeaderboardNoteContent — filtered top movers', () => {
  it('formats filtered top gainers with passed count and rule header', async () => {
    const { generateFilteredLeaderboardNoteContent } = await import('@/server/services/graphEngine');
    const filtered = MOCK_GAINERS.slice(0, 2);
    const content = generateFilteredLeaderboardNoteContent(filtered, 'price_change > 20', 'top_gainers', '1d', 5, true);

    expect(content).toContain('🚀');
    expect(content).toContain('FILTERED TOP GAINERS (2/5 Passed)');
    expect(content).toContain('Rule: price_change > 20');
    expect(content).toContain('JECX');
    expect(content).toContain('AGII');
    expect(content).not.toContain('MPRO');
  });

  it('formats non-matching branch with custom badge and rule header', async () => {
    const { generateFilteredLeaderboardNoteContent } = await import('@/server/services/graphEngine');
    const nonMatching = MOCK_GAINERS.slice(2);
    const content = generateFilteredLeaderboardNoteContent(nonMatching, 'price_change > 20', 'top_gainers', '1d', 3, false);

    expect(content).toContain('⚖️');
    expect(content).toContain('NON-MATCHING TOP GAINERS (1/3 Non-matching)');
    expect(content).toContain('Rule: price_change > 20');
    expect(content).toContain('MPRO');
  });

  it('formats clean empty message when 0 movers pass the filter', async () => {
    const { generateFilteredLeaderboardNoteContent } = await import('@/server/services/graphEngine');
    const content = generateFilteredLeaderboardNoteContent([], 'price_change > 50', 'top_gainers', '1d', 5, true);

    expect(content).toContain('RULE FILTER: "price_change > 50"');
    expect(content).toContain('No companies passed the condition (0/5 passed)');
    expect(content).toContain('Evaluated: 5 stocks');
  });

  it('formats filtered top losers properly with 🔻 icon', async () => {
    const { generateFilteredLeaderboardNoteContent } = await import('@/server/services/graphEngine');
    const filteredLosers = MOCK_LOSERS.slice(0, 1);
    const content = generateFilteredLeaderboardNoteContent(filteredLosers, 'price_change < -5', 'top_losers', '1d', 5, true);

    expect(content).toContain('🔻');
    expect(content).toContain('FILTERED TOP LOSERS');
    expect(content).toContain('BKSL');
    expect(content).toContain('-8.96%');
  });

  it('guarantees direct radar watcher notes render the full list of ranked movers and not single top1', async () => {
    const { generateLeaderboardNoteContent } = await import('@/server/services/graphEngine');
    const content = generateLeaderboardNoteContent(MOCK_GAINERS, 'top_gainers', '1d');

    expect(content).toContain('TOP GAINERS LEADERBOARD');
    expect(content).toContain('• #1 JECX:');
    expect(content).toContain('• #2 AGII:');
    expect(content).toContain('• #3 MPRO:');
  });
});

