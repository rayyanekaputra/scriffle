'use client';

import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { ScreenerConfig, ScreenerCompanyResult } from '@/types/canvas';
import { MingIcon } from '@/components/ui/MingIcon';
import { useTheme } from '@/context/ThemeContext';

export const ScreenerNode = memo(({ data, selected }: NodeProps) => {
  const { theme } = useTheme();
  const config = (data.config || {}) as ScreenerConfig;
  const state = (data.state || {}) as any;
  const isPassed = state.status === 'passed';
  const cycleCount = state.cycleCount || 0;
  const results: ScreenerCompanyResult[] = state.screenerResults || [];
  const queryPrompt = config.query || 'top 5 banks by market cap';

  const [isLoading, setIsLoading] = useState(false);

  const isDark = theme === 'dark';
  const isMono = theme === 'mono';

  const cardBorder = isDark
    ? selected
      ? 'border-[#8E95A5] ring-2 ring-[#8E95A5]/20'
      : isPassed
      ? 'border-[#8E95A5]'
      : 'border-[#282A36] hover:border-[#383B4A]'
  : isMono
    ? selected
      ? 'border-[#242321] ring-2 ring-[#242321]/20'
      : isPassed
      ? 'border-[#242321]'
      : 'border-[#D1CEC4] hover:border-[#B5B0A2]'
  : selected
    ? 'border-[#0050FF] ring-2 ring-[#0050FF]/20'
    : isPassed
    ? 'border-[#0050FF]'
    : 'border-slate-300 hover:border-slate-400';

  const cardBg = isDark
    ? 'bg-[#181920] text-[#E2E4E9]'
    : isMono
    ? 'bg-[#FCFBF9] text-[#242321]'
    : 'bg-white text-slate-900';

  const handleManualTrigger = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    try {
      const apiKey = typeof window !== 'undefined' ? (window as any).__sectorsSessionApiKey : undefined;
      await fetch('/api/engine/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canvasId: (data as any).canvasId,
          nodeId: data.id,
          apiKey,
        }),
      });
    } catch (err) {
      console.error('Failed to trigger screener:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatLargeNumber = (val?: number) => {
    if (val === undefined || val === null || isNaN(val)) return 'N/A';
    const absVal = Math.abs(val);
    if (absVal >= 1_000_000_000_000_000) return `Rp ${(val / 1_000_000_000_000_000).toFixed(2)} Q`;
    if (absVal >= 1_000_000_000_000) return `Rp ${(val / 1_000_000_000_000).toFixed(1)} T`;
    if (absVal >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(0)} B`;
    if (absVal >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(0)} M`;
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  const formatStatCapsule = (stock: ScreenerCompanyResult) => {
    // 1. Scan for dynamic year-bracketed or specific metric keys in stock object
    for (const [key, val] of Object.entries(stock)) {
      if (['symbol', 'company_name', 'name', 'sector', 'sub_sector', 'rank', 'id', 'canvasId', 'type'].includes(key)) continue;
      const num = typeof val === 'number' ? val : parseFloat(String(val));
      if (isNaN(num)) continue;

      const lowerKey = key.toLowerCase();
      const yearMatch = lowerKey.match(/\d{4}/);
      const yearSuffix = yearMatch ? `'${yearMatch[0].slice(2)}` : '';

      if (lowerKey.includes('market_cap') || lowerKey.includes('mcap')) {
        return formatLargeNumber(num);
      }
      if (lowerKey.includes('revenue') || lowerKey.includes('sales')) {
        return `Rev${yearSuffix} ${formatLargeNumber(num)}`;
      }
      if (lowerKey.includes('earnings') || lowerKey.includes('profit') || lowerKey.includes('income')) {
        return `Net${yearSuffix} ${formatLargeNumber(num)}`;
      }
      if (lowerKey.includes('dividend') || lowerKey.includes('yield')) {
        const pct = num > 0 && num < 1 ? (num * 100).toFixed(1) : num.toFixed(1);
        return `Div ${pct}%`;
      }
      if (lowerKey.startsWith('pe') || lowerKey.includes('pe_ratio') || lowerKey.includes('per') || lowerKey.includes('forward_pe')) {
        return `P/E ${num.toFixed(1)}x`;
      }
      if (lowerKey.startsWith('pb') || lowerKey.includes('pbv')) {
        return `P/B ${num.toFixed(1)}x`;
      }
      if (lowerKey.includes('roe')) {
        const pct = num > 0 && num < 1 ? (num * 100).toFixed(1) : num.toFixed(1);
        return `ROE ${pct}%`;
      }
      if (lowerKey.includes('roa')) {
        const pct = num > 0 && num < 1 ? (num * 100).toFixed(1) : num.toFixed(1);
        return `ROA ${pct}%`;
      }
      if (lowerKey.includes('eps')) {
        return `EPS Rp ${num.toLocaleString('id-ID')}`;
      }
      if (lowerKey.includes('esg')) {
        return `ESG ${num.toFixed(1)}`;
      }
      if (lowerKey.includes('growth')) {
        const pct = num > -1 && num < 1 && num !== 0 ? (num * 100).toFixed(1) : num.toFixed(1);
        return `Growth ${Number(pct) >= 0 ? '+' : ''}${pct}%`;
      }
    }

    // 2. Fallback to standard financial metrics in priority
    if (stock.pe !== undefined && stock.pe !== null && !isNaN(Number(stock.pe))) {
      return `P/E ${Number(stock.pe).toFixed(1)}x`;
    }
    if (stock.dividend_yield !== undefined && stock.dividend_yield !== null && !isNaN(Number(stock.dividend_yield))) {
      const num = Number(stock.dividend_yield);
      const pct = num > 0 && num < 1 ? (num * 100).toFixed(1) : num.toFixed(1);
      return `Div ${pct}%`;
    }
    if (stock.revenue !== undefined && stock.revenue !== null && !isNaN(Number(stock.revenue))) {
      return `Rev ${formatLargeNumber(Number(stock.revenue))}`;
    }
    if (stock.market_cap !== undefined && stock.market_cap !== null && !isNaN(Number(stock.market_cap))) {
      return formatLargeNumber(Number(stock.market_cap));
    }
    if (stock.pb !== undefined && stock.pb !== null && !isNaN(Number(stock.pb))) {
      return `P/B ${Number(stock.pb).toFixed(1)}x`;
    }
    if (stock.price !== undefined && stock.price !== null && !isNaN(Number(stock.price))) {
      return `Rp ${Number(stock.price).toLocaleString('id-ID')}`;
    }

    // 3. Fallback: Sub-sector / Sector
    if (stock.sub_sector || stock.sector) {
      return stock.sub_sector || stock.sector || 'IDX';
    }

    return 'Active';
  };

  return (
    <div
      className={`relative w-84 rounded-2xl border-2 p-4 transition-all duration-150 ${cardBg} ${cardBorder}`}
    >
      {/* Top Header */}
      <div
        className={`flex items-center justify-between pb-3 border-b ${
          isDark ? 'border-[#262833]' : isMono ? 'border-[#EAE7DF]' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`rounded-xl p-1.5 border ${
              isDark
                ? 'bg-[#22242D] text-[#BAC0D0] border-[#313442]'
                : isMono
                ? 'bg-[#EFECE4] text-[#242321] border-[#D8D4CA]'
                : 'bg-indigo-50 text-[#0050FF] border-indigo-200'
            }`}
          >
            <MingIcon name="ai_line" size={18} />
          </div>
          <div>
            <span
              className={`text-[11px] font-medium ${
                isDark ? 'text-[#8C90A0]' : isMono ? 'text-[#78756D]' : 'text-slate-500'
              }`}
            >
              AI Screener
            </span>
            <h3 className="text-sm font-semibold tracking-normal truncate max-w-[150px]">
              {config.limit ? `Top ${config.limit} Screened` : 'Company Screener'}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {cycleCount > 0 && (
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                isDark
                  ? 'bg-[#20222B] text-[#A0A5B5] border-[#2F3240]'
                  : isMono
                  ? 'bg-[#EAE7DF] text-[#4F4C45] border-[#D8D4CA]'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              ⚡ {cycleCount} runs
            </span>
          )}

          <button
            onClick={handleManualTrigger}
            disabled={isLoading}
            title="Execute Screener"
            className={`p-1.5 rounded-lg border transition-all text-xs flex items-center gap-1 ${
              isDark
                ? 'bg-[#22242D] border-[#313442] hover:bg-[#2C2E3B] text-[#D2D6E0]'
                : isMono
                ? 'bg-[#EFECE4] border-[#D8D4CA] hover:bg-[#E5E1D6] text-[#242321]'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <MingIcon name={isLoading ? 'loading_3_line' : 'refresh_3_line'} size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Query Prompt Badge & Token Cost */}
      <div className="mt-3 space-y-1.5">
        <div
          className={`p-2 rounded-xl border text-xs flex items-start gap-1.5 ${
            isDark
              ? 'bg-[#1C1E26] border-[#292B38] text-[#C4C8D4]'
              : isMono
              ? 'bg-[#F5F3EC] border-[#E2DED4] text-[#4A4740]'
              : 'bg-indigo-50/70 border-indigo-100 text-indigo-950'
          }`}
        >
          <MingIcon name="sparkles_line" size={15} className="text-[#0050FF] shrink-0 mt-0.5" />
          <p className="font-medium line-clamp-2 leading-relaxed italic flex-1">
            "{queryPrompt}"
          </p>
        </div>

        <div className="flex items-center justify-between px-1 text-[10px]">
          <span
            className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md border ${
              isDark
                ? 'bg-[#20222B] text-amber-400 border-amber-400/20'
                : isMono
                ? 'bg-[#ECE8DE] text-amber-700 border-amber-600/20'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            <MingIcon name="coin_line" size={12} />
            3 AI credits / query
          </span>
          <span
            className={`font-medium ${
              isDark ? 'text-[#8C90A0]' : isMono ? 'text-[#78756D]' : 'text-slate-400'
            }`}
          >
            Sectors API v2
          </span>
        </div>
      </div>

      {/* Screener Results Content */}
      <div className="mt-3">
        {results.length > 0 ? (
          <div className="space-y-1.5">
            {results.slice(0, config.limit || 5).map((stock, idx) => {
              const rank = idx + 1;
              return (
                <div
                  key={stock.symbol || idx}
                  className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-colors ${
                    isDark
                      ? 'bg-[#15161C] border-[#232530] hover:border-[#333645]'
                      : isMono
                      ? 'bg-[#FAF8F3] border-[#E8E4D9] hover:border-[#D6D0C2]'
                      : 'bg-slate-50/80 border-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span
                      className={`text-[10px] font-bold w-4 text-center shrink-0 ${
                        rank === 1
                          ? 'text-amber-500'
                          : isDark
                          ? 'text-[#72778A]'
                          : isMono
                          ? 'text-[#96938A]'
                          : 'text-slate-400'
                      }`}
                    >
                      #{rank}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs">{stock.symbol}</span>
                        {stock.price ? (
                          <span
                            className={`text-[11px] font-medium ${
                              isDark ? 'text-[#8E95A5]' : isMono ? 'text-[#78756D]' : 'text-slate-500'
                            }`}
                          >
                            Rp {stock.price.toLocaleString('id-ID')}
                          </span>
                        ) : null}
                      </div>
                      <p
                        className={`text-[10px] truncate max-w-[140px] ${
                          isDark ? 'text-[#72778A]' : isMono ? 'text-[#96938A]' : 'text-slate-400'
                        }`}
                      >
                        {stock.company_name}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                        isDark
                          ? 'bg-[#1E202A] text-[#9EA4B5] border-[#2F3240]'
                          : isMono
                          ? 'bg-[#ECE8DE] text-[#4A4740] border-[#D6D0C2]'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {formatStatCapsule(stock)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className={`p-4 rounded-xl border border-dashed text-center text-xs ${
              isDark
                ? 'border-[#2C2F3C] text-[#72778A]'
                : isMono
                ? 'border-[#DCD8CC] text-[#96938A]'
                : 'border-slate-200 text-slate-400'
            }`}
          >
            <MingIcon name="search_3_line" size={20} className="mx-auto mb-1.5 opacity-60" />
            <p>Click refresh or connect downstream action to run screener</p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div
        className={`mt-3 pt-2.5 border-t flex items-center justify-between text-[10px] ${
          isDark
            ? 'border-[#262833] text-[#72778A]'
            : isMono
            ? 'border-[#EAE7DF] text-[#96938A]'
            : 'border-slate-100 text-slate-400'
        }`}
      >
        <span className="flex items-center gap-1">
          <MingIcon name="time_line" size={12} />
          {state.lastTriggeredAt || 'Not executed yet'}
        </span>
        <span className="font-medium text-[#0050FF]">
          {results.length > 0 ? `${results.length} stocks` : 'Ready'}
        </span>
      </div>

      {/* Flow Handles */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-[#0050FF] !border-2 !border-white transition-transform hover:!scale-125"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-[#0050FF] !border-2 !border-white transition-transform hover:!scale-125"
      />
    </div>
  );
});

ScreenerNode.displayName = 'ScreenerNode';
