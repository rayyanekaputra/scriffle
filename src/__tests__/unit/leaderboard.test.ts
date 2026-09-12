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
