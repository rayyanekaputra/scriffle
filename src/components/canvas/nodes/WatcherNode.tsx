'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { WatcherConfig, MarketEvent } from '@/types/canvas';
import { MingIcon } from '@/components/ui/MingIcon';
import { useTheme } from '@/context/ThemeContext';

export const WatcherNode = memo(({ data, selected }: NodeProps) => {
  const { theme } = useTheme();
  const config = (data.config || {}) as WatcherConfig;
  const state = (data.state || {}) as any;
  const lastVal = state.lastValue || {};
  const isPassed = state.status === 'passed';
  const cycleCount = state.cycleCount || 0;
  const priceChange = lastVal.price_change !== undefined ? lastVal.price_change : null;

  const isRadarMode =
    config.mode === 'top_gainers' ||
    config.mode === 'top_losers' ||
    config.symbol === 'Top Gainers' ||
    config.symbol === 'Top Losers' ||
    config.symbol === 'TOP_GAINERS' ||
    config.symbol === 'TOP_LOSERS';

  const isGainers = config.mode === 'top_gainers' || config.symbol === 'Top Gainers' || config.symbol === 'TOP_GAINERS';
  const movers: MarketEvent[] = Array.isArray(state.movers) && state.movers.length > 0
    ? state.movers
    : lastVal.symbol && lastVal.symbol !== 'TOP_GAINERS' && lastVal.symbol !== 'TOP_LOSERS'
    ? [lastVal]
    : [];

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

  const cardWidth = isRadarMode ? 'w-80' : 'w-64';

  return (
    <div
      className={`relative ${cardWidth} rounded-2xl border-2 p-4 transition-all duration-150 ${cardBg} ${cardBorder}`}
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
                : isRadarMode
                ? isGainers
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'bg-rose-50 text-rose-600 border-rose-200'
                : 'bg-blue-50 text-[#0050FF] border-blue-200'
            }`}
          >
            <MingIcon name={isRadarMode ? (isGainers ? 'trending_up_line' : 'trending_down_line') : 'radar_line'} size={18} />
          </div>
          <div>
            <span
              className={`text-[11px] font-medium ${
                isDark ? 'text-[#8C90A0]' : isMono ? 'text-[#78756D]' : 'text-slate-500'
              }`}
            >
              {isRadarMode
                ? isGainers
                  ? `Top ${config.limit || 5} Gainers (${(config.period || '1d').toUpperCase()})`
                  : `Top ${config.limit || 5} Losers (${(config.period || '1d').toUpperCase()})`
                : 'Market Watcher'}
            </span>
            <h3
              className={`text-base font-bold leading-none mt-0.5 ${
                isDark ? 'text-[#E2E4E9]' : isMono ? 'text-[#242321]' : 'text-slate-900'
              }`}
            >
              {isRadarMode ? (isGainers ? 'Top Gainers Radar' : 'Top Losers Radar') : config.symbol || 'BBCA'}
            </h3>
          </div>
        </div>

        {/* Cycle Counter Badge */}
        <div
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold border ${
            isDark
              ? 'bg-[#22242D] text-[#BAC0D0] border-[#313442]'
              : isMono
              ? 'bg-[#EFECE4] text-[#242321] border-[#D8D4CA]'
              : 'bg-blue-50 text-[#0050FF] border-blue-200'
          }`}
        >
          <MingIcon name="repeat_line" size={12} />
          <span>{cycleCount} runs</span>
        </div>
      </div>

      {/* Body: Radar Leaderboard vs Single Ticker Snapshot */}
      {isRadarMode ? (
        <div className="mt-3 space-y-1.5 text-xs">
          {movers.length > 0 ? (
            movers.map((mover, idx) => {
              const rank = mover.rank || idx + 1;
              const isPositive = (mover.price_change || 0) >= 0;
              return (
                <div
                  key={`${mover.symbol}-${idx}`}
                  className={`flex items-center justify-between rounded-xl px-2.5 py-2 border transition-colors ${
                    isDark
                      ? 'bg-[#14151B] border-[#252732] hover:border-[#343746]'
                      : isMono
                      ? 'bg-[#F4F3EF] border-[#E2DFD6] hover:border-[#D0CCC1]'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-bold shrink-0 ${
                        rank === 1
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : rank === 2
                          ? 'bg-slate-200 text-slate-700 border border-slate-300'
                          : rank === 3
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : isDark
                          ? 'bg-[#22242D] text-[#8C90A0]'
                          : isMono
                          ? 'bg-[#EAE7DF] text-[#78756D]'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      #{rank}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-1.5">
                        <span
                          className={`font-bold ${
                            isDark ? 'text-[#E2E4E9]' : isMono ? 'text-[#242321]' : 'text-slate-900'
                          }`}
                        >
                          {mover.symbol}
                        </span>
                        {mover.name && mover.name !== mover.symbol && (
                          <span
                            className={`text-[10px] truncate max-w-[90px] ${
                              isDark ? 'text-[#787C8D]' : isMono ? 'text-[#8C8980]' : 'text-slate-400'
                            }`}
                            title={mover.name}
                          >
                            {mover.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`font-mono text-[11px] font-semibold ${
                        isDark ? 'text-[#BAC0D0]' : isMono ? 'text-[#5A5852]' : 'text-slate-700'
                      }`}
                    >
                      {mover.price ? `Rp ${mover.price.toLocaleString('id-ID')}` : '-'}
                    </span>
                    <span
                      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-bold border ${
                        isPositive
                          ? isDark
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                            : isMono
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isDark
                          ? 'bg-rose-950/60 text-rose-400 border-rose-800/60'
                          : isMono
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      <MingIcon
                        name={isPositive ? 'arrow_up_line' : 'arrow_down_line'}
                        size={11}
                      />
                      {isPositive ? `+${mover.price_change}%` : `${mover.price_change}%`}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div
              className={`rounded-xl p-3 text-center border ${
                isDark
                  ? 'bg-[#14151B] border-[#252732] text-[#8C90A0]'
                  : isMono
                  ? 'bg-[#F4F3EF] border-[#E2DFD6] text-[#78756D]'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              Waiting for live leaderboard poll...
            </div>
          )}
        </div>
      ) : (
        <div className="mt-3 space-y-2 text-xs">
          <div
            className={`flex items-center justify-between rounded-xl p-2.5 border ${
              isDark
                ? 'bg-[#14151B] border-[#252732]'
                : isMono
                ? 'bg-[#F4F3EF] border-[#E2DFD6]'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <span
              className={
                isDark
                  ? 'text-[#8C90A0] font-medium'
                  : isMono
                  ? 'text-[#78756D] font-medium'
                  : 'text-slate-500 font-medium'
              }
            >
              Last Price
            </span>
            <span
              className={`font-bold ${
                isDark ? 'text-[#E2E4E9]' : isMono ? 'text-[#242321]' : 'text-slate-900'
              }`}
            >
              {lastVal.price ? `Rp ${lastVal.price.toLocaleString('id-ID')}` : 'Waiting for tick'}
            </span>
          </div>

          {priceChange !== null && (
            <div
              className={`flex items-center justify-between rounded-xl p-2.5 border ${
                isDark
                  ? 'bg-[#14151B] border-[#252732]'
                  : isMono
                  ? 'bg-[#F4F3EF] border-[#E2DFD6]'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span
                className={
                  isDark
                    ? 'text-[#8C90A0] font-medium'
                    : isMono
                    ? 'text-[#78756D] font-medium'
                    : 'text-slate-500 font-medium'
                }
              >
                Price Change
              </span>
              <span
                className={`flex items-center gap-1 font-bold ${
                  isDark
                    ? 'text-[#BAC0D0]'
                    : isMono
                    ? 'text-[#242321]'
                    : priceChange >= 0
                    ? 'text-emerald-700'
                    : 'text-rose-700'
                }`}
              >
                <MingIcon
                  name={priceChange >= 0 ? 'trending_up_line' : 'trending_down_line'}
                  size={14}
                />
                {priceChange >= 0 ? `+${priceChange}%` : `${priceChange}%`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Footer Timestamp */}
      <div
        className={`mt-3 flex items-center justify-between text-[11px] ${
          isDark ? 'text-[#686B7C]' : isMono ? 'text-[#8C8980]' : 'text-slate-400'
        }`}
      >
        <span>Poll: {config.interval || 300}s</span>
        <span>{state.lastTriggeredAt ? `Updated ${state.lastTriggeredAt}` : 'Idle'}</span>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className={`!h-3.5 !w-3.5 !rounded-full !border-2 ${
          isDark
            ? '!border-[#181920] !bg-[#8E95A5]'
            : isMono
            ? '!border-[#FCFBF9] !bg-[#5A5852]'
            : '!border-white !bg-[#0050FF]'
        }`}
      />
    </div>
  );
});

WatcherNode.displayName = 'WatcherNode';

