import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportReportToDisk } from '@/server/services/reportExporter';
import fs from 'fs';
import path from 'path';

describe('exportReportToDisk - In-Place Dynamic Revision Tracking', () => {
  const testProject = 'test_rev_project';
  const testSymbol = 'BBCA';
  const testReportsDir = path.join(process.cwd(), 'reports', testProject);
  const testFilePath = path.join(testReportsDir, `${testSymbol}_Fundamental_Brief.html`);

  beforeEach(() => {
    // Clean up test reports directory if exists
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  it('generates Rev 1 document without revision badge when rev=1', async () => {
    const res = await exportReportToDisk(testProject, testSymbol, undefined, 1);
    expect(res.savedLocally).toBe(true);
    expect(res.fileName).toBe('BBCA_Fundamental_Brief.html');
    expect(fs.existsSync(testFilePath)).toBe(true);

    const content = fs.readFileSync(testFilePath, 'utf-8');
    expect(content).toContain('BBCA');
    expect(content).toContain('Scriffle Research Brief');
    expect(content).not.toContain('<span class="revision-badge">Rev 1</span>');
    expect(content).not.toContain('(Revision 1)');
  });

  it('generates dynamic Rev 2+ document with revision badge and footer notation', async () => {
    const res = await exportReportToDisk(testProject, testSymbol, undefined, 3);
    expect(res.savedLocally).toBe(true);

    const content = fs.readFileSync(testFilePath, 'utf-8');
    expect(content).toContain('<span class="revision-badge">Rev 3</span>');
    expect(content).toContain('(Revision 3)');
  });

  it('overwrites the existing file in-place on repeat exports with higher revision', async () => {
    // Rev 1
    await exportReportToDisk(testProject, testSymbol, undefined, 1);
    const content1 = fs.readFileSync(testFilePath, 'utf-8');
    expect(content1).not.toContain('Rev 2');

    // Rev 2 (In-place refresh)
    await exportReportToDisk(testProject, testSymbol, undefined, 2);
    const content2 = fs.readFileSync(testFilePath, 'utf-8');
    expect(content2).toContain('<span class="revision-badge">Rev 2</span>');
    expect(content2).toContain('(Revision 2)');
  });

  it('dynamically recalculates Market Cap and Valuation multiples when a MarketEvent is supplied', async () => {
    const { getCompanyFundamentalReport } = await import('@/server/services/sectorsApi');

    // Base tick for GOTO (price 56, 0% move)
    const reportBase = await getCompanyFundamentalReport('GOTO', undefined, {
      symbol: 'GOTO',
      price: 56,
      prevPrice: 56,
      price_change: 0,
      volume: 400_000_000,
      avg_volume: 300_000_000,
      timestamp: '11:00:00',
    });

    // Drop tick for GOTO (-10% move)
    const reportDrop = await getCompanyFundamentalReport('GOTO', undefined, {
      symbol: 'GOTO',
      price: 50,
      prevPrice: 56,
      price_change: -10,
      volume: 450_000_000,
      avg_volume: 300_000_000,
      timestamp: '11:05:00',
    });

    // Surge tick for GOTO (+15% move)
    const reportSurge = await getCompanyFundamentalReport('GOTO', undefined, {
      symbol: 'GOTO',
      price: 64,
      prevPrice: 56,
      price_change: 15,
      volume: 500_000_000,
      avg_volume: 300_000_000,
      timestamp: '11:10:00',
    });

    // Market cap should scale with price move
    expect(reportDrop.marketCap).toBeLessThan(reportBase.marketCap);
    expect(reportSurge.marketCap).toBeGreaterThan(reportBase.marketCap);

    // Formatted market cap strings should differ
    expect(reportDrop.marketCapFormatted).not.toBe(reportSurge.marketCapFormatted);

    // Prices and close change percentages should reflect the event
    expect(reportDrop.lastClosePrice).toBe(50);
    expect(reportDrop.dailyCloseChange).toBe(-0.1);
    expect(reportSurge.lastClosePrice).toBe(64);
    expect(reportSurge.dailyCloseChange).toBe(0.15);
  });
});
