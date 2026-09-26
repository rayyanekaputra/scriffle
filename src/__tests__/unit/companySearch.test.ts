import { describe, it, expect } from 'vitest';
import { searchCompanies, POPULAR_PICKS } from '@/lib/search/companySearch';
import { POPULAR_IDX_COMPANIES } from '@/data/popularIdxCompanies';

describe('Indonesian Company Search Matcher (companySearch.ts)', () => {
  it('returns curated POPULAR_PICKS on empty query', () => {
    const emptyResults = searchCompanies('');
    expect(emptyResults.length).toBeGreaterThan(0);
    expect(emptyResults.length).toBeLessThanOrEqual(8);
    expect(emptyResults[0].symbol).toBe('BBCA');
    expect(emptyResults.every((c) => c.popular)).toBe(true);
  });

  it('respects custom limit on empty query', () => {
    const limited = searchCompanies('', 4);
    expect(limited.length).toBe(4);
  });

  it('matches exact ticker symbol case-insensitively', () => {
    const results = searchCompanies('bbca');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].symbol).toBe('BBCA');
    expect(results[0].name).toContain('Bank Central Asia');
  });

  it('matches ticker symbol prefix', () => {
    const results = searchCompanies('bb');
    const symbols = results.map((r) => r.symbol);
    expect(symbols).toContain('BBCA');
    expect(symbols).toContain('BBRI');
    expect(symbols).toContain('BBNI');
  });

  it('matches company full and partial name keywords', () => {
    const mandiri = searchCompanies('mandiri');
    expect(mandiri.some((c) => c.symbol === 'BMRI')).toBe(true);

    const astra = searchCompanies('astra');
    expect(astra.some((c) => c.symbol === 'ASII')).toBe(true);

    const telkom = searchCompanies('telkom');
    expect(telkom.some((c) => c.symbol === 'TLKM')).toBe(true);

    const indofood = searchCompanies('indofood');
    expect(indofood.some((c) => c.symbol === 'ICBP' || c.symbol === 'INDF')).toBe(true);
  });

  it('matches multi-word token searches', () => {
    const results = searchCompanies('Bank Central');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].symbol).toBe('BBCA');

    const cement = searchCompanies('Semen Indonesia');
    expect(cement.some((c) => c.symbol === 'SMGR')).toBe(true);
  });

  it('returns empty array when no companies match', () => {
    const results = searchCompanies('XYZNONEXISTENTCOMPANY123');
    expect(results).toEqual([]);
  });

  it('prioritizes exact symbol matches over partial name matches', () => {
    // ASII has exact symbol match for 'asii'
    const results = searchCompanies('ASII');
    expect(results[0].symbol).toBe('ASII');
  });
});
