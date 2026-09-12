import { describe, it, expect } from 'vitest';
import { generateScreenerNoteContent } from '@/server/services/graphEngine';
import type { ScreenerCompanyResult } from '@/types/canvas';

const MOCK_BANKS: ScreenerCompanyResult[] = [
  {
    symbol: 'BBCA',
    company_name: 'PT Bank Central Asia Tbk.',
    sector: 'Financials',
    sub_sector: 'Banks',
    market_cap: 1_245_000_000_000_000,
    pe: 22.4,
    pb: 4.65,
    dividend_yield: 2.85,
    price: 10450,
  },
  {
    symbol: 'BBRI',
    company_name: 'PT Bank Rakyat Indonesia (Persero) Tbk.',
    sector: 'Financials',
    sub_sector: 'Banks',
    market_cap: 785_000_000_000_000,
    pe: 12.8,
    pb: 2.15,
    dividend_yield: 6.45,
    price: 5200,
  },
];

const MOCK_TECH: ScreenerCompanyResult[] = [
  {
    symbol: 'GOTO',
    company_name: 'PT GoTo Gojek Tokopedia Tbk',
    sector: 'Technology',
    sub_sector: 'Software & IT Services',
    market_cap: 45_000_000_000_000,
    revenue: 20_000_000_000_000,
    pe: undefined,
    pb: 1.2,
    dividend_yield: 0,
    price: 52,
  },
];

describe('generateScreenerNoteContent — structure', () => {
  it('returns a non-empty string', () => {
    const result = generateScreenerNoteContent('top 5 banks by market cap', MOCK_BANKS);
    expect(result.length).toBeGreaterThan(0);
  });

  it('contains the AI screener header emoji', () => {
    const result = generateScreenerNoteContent('top 5 banks', MOCK_BANKS);
    expect(result).toContain('✨');
  });

  it('includes the query string in the output', () => {
    const result = generateScreenerNoteContent('top 5 banks by market cap', MOCK_BANKS);
    expect(result).toContain('top 5 banks by market cap');
  });

  it('includes "Screened:" timestamp line', () => {
    const result = generateScreenerNoteContent('banks', MOCK_BANKS);
    expect(result).toContain('Screened:');
  });
});

describe('generateScreenerNoteContent — company rows', () => {
  it('lists all companies from results', () => {
    const result = generateScreenerNoteContent('top 5 banks', MOCK_BANKS);
    expect(result).toContain('BBCA');
    expect(result).toContain('BBRI');
  });

  it('shows rank #1, #2', () => {
    const result = generateScreenerNoteContent('top 5 banks', MOCK_BANKS);
    expect(result).toContain('#1');
    expect(result).toContain('#2');
  });

  it('shows P/E ratio', () => {
    const result = generateScreenerNoteContent('top 5 banks', MOCK_BANKS);
    expect(result).toContain('P/E 22.4x');
  });

  it('shows dividend yield', () => {
    const result = generateScreenerNoteContent('top 5 banks', MOCK_BANKS);
    expect(result).toContain('Div 2.85%');
  });

  it('shows market cap in T format for trillion+ values', () => {
    const result = generateScreenerNoteContent('top 5 banks', MOCK_BANKS);
    expect(result).toContain('Rp');
    expect(result).toContain('T');
  });

  it('shows revenue when available and no other metrics take priority', () => {
    const revenueOnly: ScreenerCompanyResult[] = [
      {
        symbol: 'GOTO',
        company_name: 'PT GoTo Gojek Tokopedia Tbk',
        sector: 'Technology',
        sub_sector: 'Software & IT Services',
        // No price, no market_cap, no pe, no dividend_yield, no pb, no roe — only revenue
        revenue: 20_000_000_000_000,
      } as any,
    ];
    const result = generateScreenerNoteContent('tech by revenue', revenueOnly);
    expect(result).toContain('Rev Rp');
  });

  it('includes company name', () => {
    const result = generateScreenerNoteContent('banks', MOCK_BANKS);
    expect(result).toContain('PT Bank Central Asia Tbk.');
  });
});

describe('generateScreenerNoteContent — empty results', () => {
  it('returns fallback message when results array is empty', () => {
    const result = generateScreenerNoteContent('unknown query', []);
    expect(result).toContain('No companies matched');
  });

  it('includes the original query in fallback message', () => {
    const result = generateScreenerNoteContent('weird query', []);
    expect(result).toContain('weird query');
  });
});
