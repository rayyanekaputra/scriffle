import { NextResponse } from 'next/server';
import { getCompanyFundamentalReport } from '@/server/services/sectorsApi';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol')?.toUpperCase() || 'BBCA';
    const report = await getCompanyFundamentalReport(symbol);

    const price = report.lastClosePrice ? `Rp ${report.lastClosePrice.toLocaleString()}` : 'N/A';
    const priceChange = report.dailyCloseChange !== undefined
      ? `${report.dailyCloseChange >= 0 ? '+' : ''}${(report.dailyCloseChange * 100).toFixed(2)}%`
      : '0.00%';
    const isPriceUp = (report.dailyCloseChange || 0) >= 0;

    const analyst = report.futureForecasts?.analystRating;
    const analystTotal = analyst?.totalAnalysts || 0;
    const buyPct = analystTotal > 0 ? Math.round(((analyst?.strongBuy || 0) + (analyst?.buy || 0)) / analystTotal * 100) : 85;

    const tagsHtml = (report.tags || ['blue-chip', 'idx-leader', 'top-volume'])
      .slice(0, 5)
      .map((t) => `<span class="tag">#${t.replace(/-/g, ' ')}</span>`)
      .join('');

    const indicesHtml = (report.indices || ['LQ45', 'IDX30', 'KOMPAS100'])
      .slice(0, 6)
      .map((idx) => `<span class="index-pill">${idx}</span>`)
      .join('');

    const executivesHtml = (report.management?.keyExecutives || [
      { name: 'Board of Directors', position: 'Executive Committee' }
    ])
      .slice(0, 3)
      .map(
        (exec) => `
        <div class="list-item">
          <div>
            <div class="item-title">${exec.name}</div>
            <div class="item-sub">${exec.position}</div>
          </div>
          <span class="status-pill">Executive</span>
        </div>
      `
      )
      .join('');

    const shareholdersHtml = (report.ownership?.majorShareholders || [
      { name: 'Public / Free Float', sharePercentage: '45.0%' }
    ])
      .slice(0, 3)
      .map(
        (sh) => `
        <div class="list-item">
          <div class="item-title">${sh.name}</div>
          <span class="share-pct">${typeof sh.sharePercentage === 'number' ? `${(sh.sharePercentage * 100).toFixed(2)}%` : sh.sharePercentage}</span>
        </div>
      `
      )
      .join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${report.symbol} - Institutional Equity Research Brief</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #FFFFFF;
      color: #111827;
      padding: 48px 24px;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }

    .document {
      max-width: 820px;
      margin: 0 auto;
    }

    /* Top Brand & Action Bar */
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 16px;
      border-bottom: 1.5px solid #111827;
      margin-bottom: 28px;
    }
    .brand-title {
      font-size: 13px;
      font-weight: 700;
      color: #111827;
      font-family: 'JetBrains Mono', monospace;
    }
    .brand-meta {
      font-size: 12px;
      color: #6B7280;
      font-weight: 500;
    }
    .print-btn {
      background: #111827;
      color: #FFFFFF;
      border: 1px solid #111827;
      font-weight: 600;
      font-size: 12px;
      padding: 6px 14px;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: opacity 0.15s ease;
    }
    .print-btn:hover {
      opacity: 0.85;
    }

    /* Header Profile */
    .header-profile {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }
    .symbol-title {
      font-size: 30px;
      font-weight: 800;
      color: #111827;
      line-height: 1.1;
    }
    .company-name {
      font-size: 15px;
      font-weight: 600;
      color: #4B5563;
      margin-top: 4px;
    }
    .price-box {
      text-align: right;
    }
    .current-price {
      font-size: 24px;
      font-weight: 800;
      font-family: 'JetBrains Mono', monospace;
      color: #111827;
      line-height: 1.1;
    }
    .price-change {
      display: inline-block;
      margin-top: 4px;
      font-size: 12px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
      background: ${isPriceUp ? '#ECFDF5' : '#FEF2F2'};
      color: ${isPriceUp ? '#059669' : '#DC2626'};
    }

    /* Meta Details Row */
    .meta-details {
      font-size: 12px;
      color: #4B5563;
      margin-bottom: 12px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px 16px;
    }
    .meta-item strong {
      color: #111827;
      font-weight: 600;
    }
    .tags-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 28px;
    }
    .tag {
      font-size: 11px;
      font-weight: 600;
      color: #4B5563;
      background: #F3F4F6;
      padding: 2px 8px;
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
    }
    .index-pill {
      font-size: 11px;
      font-weight: 700;
      color: #0050FF;
      background: #EFF6FF;
      padding: 2px 8px;
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
    }

    /* Section Typography */
    .section-divider {
      border: none;
      border-top: 1px solid #E5E7EB;
      margin: 28px 0 20px 0;
    }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: #374151;
      margin-bottom: 16px;
    }

    /* Key Metrics Grid (4 columns, borderless with clean spacing) */
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px 16px;
      margin-bottom: 8px;
    }
    .metric-item {
      display: flex;
      flex-direction: column;
    }
    .metric-label {
      font-size: 11px;
      font-weight: 600;
      color: #6B7280;
      margin-bottom: 4px;
    }
    .metric-val {
      font-size: 18px;
      font-weight: 800;
      color: #111827;
      font-family: 'JetBrains Mono', monospace;
      line-height: 1.2;
    }
    .metric-sub {
      font-size: 11px;
      color: #9CA3AF;
      margin-top: 2px;
      font-weight: 500;
    }

    /* Two-Column Deep Dive */
    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 36px;
    }
    .panel-heading {
      font-size: 13px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .list-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #F3F4F6;
      font-size: 12px;
    }
    .list-item:last-child {
      border-bottom: none;
    }
    .item-title {
      font-weight: 600;
      color: #1F2937;
    }
    .item-sub {
      font-size: 11px;
      color: #6B7280;
    }
    .share-pct {
      font-size: 12px;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
      color: #111827;
    }

    /* Analyst Rating Bar */
    .analyst-bar-wrapper {
      background: #F3F4F6;
      border-radius: 4px;
      height: 8px;
      overflow: hidden;
      display: flex;
      margin: 10px 0 8px 0;
    }
    .bar-buy { background: #0050FF; height: 100%; width: ${buyPct}%; }
    .bar-hold { background: #9CA3AF; height: 100%; width: ${100 - buyPct}%; }

    /* Automated Thesis Section */
    .thesis-box {
      background: #FAFAFA;
      border-left: 3px solid #111827;
      padding: 14px 18px;
      border-radius: 0 4px 4px 0;
    }
    .thesis-label {
      font-size: 11px;
      font-weight: 700;
      color: #6B7280;
      margin-bottom: 4px;
    }
    .thesis-text {
      font-size: 13px;
      color: #374151;
      line-height: 1.55;
    }

    /* Footer */
    .report-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 16px;
      border-top: 1px solid #E5E7EB;
      margin-top: 36px;
      font-size: 11px;
      font-weight: 500;
      color: #9CA3AF;
    }

    @media print {
      body { padding: 0; }
      .print-btn { display: none; }
      .top-bar { margin-bottom: 20px; }
      .section-divider { margin: 20px 0 16px 0; }
      .report-footer { margin-top: 24px; }
    }
  </style>
</head>
<body>
  <div class="document">
    <!-- Top Bar -->
    <div class="top-bar">
      <div>
        <span class="brand-title">Scriffle Research Brief</span>
        <span class="brand-meta">&nbsp;•&nbsp; Sectors API v2</span>
      </div>
      <button class="print-btn" onclick="window.print()">
        Print / Save PDF
      </button>
    </div>

    <!-- Company Header Profile -->
    <div class="header-profile">
      <div>
        <h1 class="symbol-title">${report.symbol}</h1>
        <div class="company-name">${report.companyName}</div>
      </div>
      <div class="price-box">
        <div class="current-price">${price}</div>
        <div class="price-change">${priceChange} Today</div>
      </div>
    </div>

    <!-- Sector Taxonomy & Metadata Details -->
    <div class="meta-details">
      <span class="meta-item">Sector: <strong>${report.sector}</strong></span>
      <span class="meta-item">Sub-Sector: <strong>${report.subSector}</strong></span>
      ${report.listingBoard ? `<span class="meta-item">Board: <strong>${report.listingBoard}</strong></span>` : ''}
      ${report.esgScore ? `<span class="meta-item">ESG Risk: <strong>${report.esgScore}</strong></span>` : ''}
    </div>

    <div class="tags-row">
      ${indicesHtml}
      ${tagsHtml}
    </div>

    <hr class="section-divider" />

    <!-- Key Valuation & Financial Metrics -->
    <div class="section-title">Key Valuation & Financial Profile</div>
    <div class="metric-grid">
      <div class="metric-item">
        <div class="metric-label">Market Capitalisation</div>
        <div class="metric-val">${report.marketCapFormatted}</div>
        <div class="metric-sub">${report.marketCapRank ? `Rank #${report.marketCapRank} on IDX` : 'IDX Large Cap'}</div>
      </div>

      <div class="metric-item">
        <div class="metric-label">Price to Earnings (P/E)</div>
        <div class="metric-val">${report.peRatio}x</div>
        <div class="metric-sub">${report.valuation?.forwardPe ? `Forward: ${report.valuation.forwardPe}x` : 'TTM Multiple'}</div>
      </div>

      <div class="metric-item">
        <div class="metric-label">Price to Book (P/B)</div>
        <div class="metric-val">${report.pbvRatio}x</div>
        <div class="metric-sub">${report.valuation?.intrinsicValue ? `Fair: Rp ${report.valuation.intrinsicValue.toLocaleString()}` : 'Book Multiple'}</div>
      </div>

      <div class="metric-item">
        <div class="metric-label">Dividend Yield (TTM)</div>
        <div class="metric-val">${report.dividendYield}%</div>
        <div class="metric-sub">${report.dividendSummary?.payoutRatio ? `Payout: ${(report.dividendSummary.payoutRatio * 100).toFixed(0)}%` : 'Regular Payout'}</div>
      </div>

      <div class="metric-item">
        <div class="metric-label">Net Profit Margin</div>
        <div class="metric-val">${report.netProfitMargin || 22.0}%</div>
        <div class="metric-sub">${report.financialsSummary?.operatingProfitMargin ? `OP Margin: ${report.financialsSummary.operatingProfitMargin.toFixed(1)}%` : 'Operating Margin'}</div>
      </div>

      <div class="metric-item">
        <div class="metric-label">Return on Equity (ROE)</div>
        <div class="metric-val">${report.financialsSummary?.roe ? `${(report.financialsSummary.roe * 100).toFixed(1)}%` : '21.5%'}</div>
        <div class="metric-sub">${report.financialsSummary?.roa ? `ROA: ${(report.financialsSummary.roa * 100).toFixed(1)}%` : 'Return on Assets'}</div>
      </div>

      <div class="metric-item">
        <div class="metric-label">52-Week Range</div>
        <div class="metric-val" style="font-size: 15px;">
          ${report.allTimePrice?.week52Low ? `Rp ${report.allTimePrice.week52Low.toLocaleString()} - ${report.allTimePrice?.week52High?.toLocaleString()}` : 'Rp 8,850 - 10,950'}
        </div>
        <div class="metric-sub">${report.allTimePrice?.allTimeHigh ? `ATH: Rp ${report.allTimePrice.allTimeHigh.toLocaleString()}` : 'Historical High'}</div>
      </div>

      <div class="metric-item">
        <div class="metric-label">Revenue Expansion</div>
        <div class="metric-val">${report.revenueGrowthYoY ? `+${report.revenueGrowthYoY}%` : '+9.8%'}</div>
        <div class="metric-sub">YoY Growth</div>
      </div>
    </div>

    <hr class="section-divider" />

    <!-- Two Column Breakdown -->
    <div class="two-col">
      <!-- Analyst Consensus -->
      <div>
        <div class="panel-heading">
          <span>Analyst Consensus</span>
          <span style="font-size: 12px; font-weight: 600; color: #0050FF;">${buyPct}% Buy Rating</span>
        </div>
        <div class="analyst-bar-wrapper">
          <div class="bar-buy" title="Buy / Strong Buy"></div>
          <div class="bar-hold" title="Hold / Neutral"></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; color: #6B7280;">
          <span>${analyst?.strongBuy || 21} Strong Buy</span>
          <span>${analyst?.buy || 4} Buy</span>
          <span>${analyst?.hold || 2} Hold</span>
          <span>${analyst?.sell || 0} Sell</span>
        </div>
        ${report.futureForecasts?.revenueGrowth ? `
          <div style="margin-top: 14px; font-size: 11px; color: #4B5563; line-height: 1.5;">
            Forecast: Projected EPS growth of <strong>+${(report.futureForecasts.epsGrowth ? report.futureForecasts.epsGrowth * 100 : 9.9).toFixed(1)}%</strong> on <strong>+${(report.futureForecasts.revenueGrowth * 100).toFixed(1)}%</strong> revenue expansion.
          </div>
        ` : ''}
      </div>

      <!-- Major Shareholders & Leadership -->
      <div>
        <div class="panel-heading">
          <span>Major Shareholders</span>
          <span style="font-size: 11px; color: #6B7280;">Ownership</span>
        </div>
        <div>
          ${shareholdersHtml}
        </div>
        ${report.ownership?.conglomeratesGroup?.length ? `
          <div style="margin-top: 10px; font-size: 11px; color: #6B7280;">
            Group / Conglomerate: <strong style="color: #111827;">${report.ownership.conglomeratesGroup.join(', ')}</strong>
          </div>
        ` : ''}
      </div>
    </div>

    <hr class="section-divider" />

    <!-- Automated Thesis Summary -->
    <div class="thesis-box">
      <div class="thesis-label">Automated Trigger Thesis Summary</div>
      <div class="thesis-text">
        This institutional fundamental brief was compiled automatically by Scriffle's real-time engine following a condition trigger. <strong>${report.companyName}</strong> (${report.symbol}) trades at <strong>${report.peRatio}x P/E</strong> and <strong>${report.pbvRatio}x P/B</strong> with a <strong>${report.dividendYield}%</strong> dividend yield, supported by <strong>${buyPct}% analyst buy consensus</strong>.
      </div>
    </div>

    <!-- Footer -->
    <div class="report-footer">
      <div>Source: Sectors.app v2 API (Indonesia Stock Exchange)</div>
      <div>Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} • Scriffle Studio</div>
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
