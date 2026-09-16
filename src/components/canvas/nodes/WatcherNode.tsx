'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { WatcherConfig, MarketEvent } from '@/types/canvas';
import { MingIcon } from '@/components/ui/MingIcon';
import { useTheme } from '@/context/ThemeContext';
import { useLoading } from '@/context/LoadingContext';

export const WatcherNode = memo(({ id, data, selected }: NodeProps) => {
  const { theme } = useTheme();
  const { isNodeLoading } = useLoading();
  const config = (data.config || {}) as WatcherConfig;
  const state = (data.state || {}) as any;
  const lastVal = state.lastValue || {};
  const isPassed = state.status === 'passed';
  const cycleCount = state.cycleCount || 0;
  const priceChange = lastVal.price_change !== undefined ? lastVal.price_change : null;
  const nodeLoading = isNodeLoading(id);

  const isRadarMode =
    config.mode === 'top_gainers' ||
    config.mode === 'top_losers' ||
    config.symbol === 'Top Gainers' ||
    config.symbol === 'Top Losers' ||
    config.symbol === 'TOP_GAINERS' ||
    config.symbol === 'TOP_LOSERS';

  const isGainers = config.mode === 'top_gainers' || config.symbol === 'Top Gainers' || config.symbol === 'TOP_GAINERS';
  const limit = typeof config.limit === 'number' && config.limit > 0 ? config.limit : 5;

  const movers: MarketEvent[] = isRadarMode
    ? (Array.isArray(state.movers) && state.movers.length > 0 ? state.movers : [])
    : (Array.isArray(state.movers) && state.movers.length > 0
        ? state.movers
        : lastVal.symbol && lastVal.symbol !== 'TOP_GAINERS' && lastVal.symbol !== 'TOP_LOSERS'
        ? [lastVal]
        : []);

  const isDark = theme === 'dark';
  const isMono = theme === 'mono';

  const isError = state.status === 'error' || !!state.error;
  const apiErrorCode = state.error?.code || (isError ? 400 : null);
  const isLive = state.isLive ?? true;

  const cardBorder = isDark
    ? selected
      ? 'border-[#8E95A5] ring-2 ring-[#8E95A5]/20'
      : nodeLoading
      ? 'border-[#0050FF] ring-2 ring-[#0050FF]/30 animate-pulse'
      : isError
      ? 'border-rose-500/80 ring-1 ring-rose-500/20'
      : isPassed
      ? 'border-[#8E95A5]'
      : 'border-[#282A36] hover:border-[#383B4A]'
    : isMono
    ? selected
      ? 'border-[#242321] ring-2 ring-[#242321]/20'
      : nodeLoading
      ? 'border-[#242321] ring-2 ring-[#242321]/30 animate-pulse'
      : isError
      ? 'border-rose-600 ring-1 ring-rose-600/20'
      : isPassed
      ? 'border-[#242321]'
      : 'border-[#D1CEC4] hover:border-[#B5B0A2]'
    : selected
    ? 'border-[#0050FF] ring-2 ring-[#0050FF]/20'
    : nodeLoading
    ? 'border-[#0050FF] ring-2 ring-[#0050FF]/30 animate-pulse'
    : isError
    ? 'border-rose-500 ring-1 ring-rose-500/20'
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
      {/* Target / Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className={`!h-3.5 !w-3.5 !rounded-full !border-2 ${
          isDark
            ? '!border-[#181920] !bg-[#8E95A5]'
            : isMono
            ? '!border-[#FCFBF9] !bg-[#5A5852]'
            : '!border-white !bg-[#0050FF]'
        }`}
      />

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
                ? isError
                  ? 'bg-rose-950/60 text-rose-400 border-rose-800/60'
                  : 'bg-[#22242D] text-[#BAC0D0] border-[#313442]'
                : isMono
                ? isError
                  ? 'bg-rose-50 text-rose-800 border-rose-300'
                  : 'bg-[#EFECE4] text-[#242321] border-[#D8D4CA]'
                : isError
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : isRadarMode
                ? isGainers
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'bg-rose-50 text-rose-600 border-rose-200'
                : 'bg-blue-50 text-[#0050FF] border-blue-200'
            }`}
          >
            <MingIcon
              name={
                isError
                  ? 'warning_line'
                  : isRadarMode
                  ? isGainers
                    ? 'trending_up_line'
                    : 'trending_down_line'
                  : 'radar_line'
              }
              size={18}
            />
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

        {/* Right Badges */}
        <div className="flex items-center gap-1.5">
          {isError ? (
            <div
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800/60"
              title={state.error?.message || 'Sectors API request failed'}
            >
              <MingIcon name="warning_line" size={11} />
              <span>API Error {apiErrorCode}</span>
            </div>
          ) : !isLive && cycleCount > 0 ? (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                isDark
                  ? 'bg-[#22242D] text-[#8C90A0] border-[#313442]'
                  : isMono
                  ? 'bg-[#EAE7DF] text-[#78756D] border-[#D8D4CA]'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              Mock
            </span>
          ) : null}

          {/* Cycle Counter / Polling Badge */}
          {nodeLoading ? (
            <div
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold border animate-pulse ${
                isDark
                  ? 'bg-blue-950/60 text-blue-300 border-blue-800/60'
                  : isMono
                  ? 'bg-[#EAE7DF] text-[#242321] border-[#242321]'
                  : 'bg-blue-50 text-[#0050FF] border-blue-200'
              }`}
            >
              <MingIcon name="loading_3_line" size={12} className="animate-spin text-[#0050FF]" />
              <span>Polling...</span>
            </div>
          ) : (
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
          )}
        </div>
      </div>

      {/* Error Callout Banner if present */}
      {isError && state.error?.message && (
        <div className="mt-2.5 rounded-xl p-2 text-[10px] leading-relaxed border bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900/50 flex items-start gap-1.5">
          <MingIcon name="warning_line" size={13} className="shrink-0 mt-0.5 text-rose-600" />
          <p className="line-clamp-2 flex-1">{state.error.message}</p>
        </div>
      )}

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
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[10px] shrink-0 border ${
                        isDark
                          ? rank === 1
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                            : rank === 2
                            ? 'bg-slate-400/20 text-slate-200 border-slate-400/40 font-semibold'
                            : rank === 3
                            ? 'bg-orange-500/20 text-orange-300 border-orange-500/40 font-semibold'
                            : 'bg-[#22242D] text-[#8C90A0] border-[#313442]'
                          : isMono
                          ? rank === 1
                            ? 'bg-[#E2DFD6] text-[#242321] border-[#C8C4B8] font-black'
                            : rank === 2
                            ? 'bg-[#EAE7DF] text-[#4F4C45] border-[#D8D4CA] font-bold'
                            : rank === 3
                            ? 'bg-[#EFECE4] text-[#78756D] border-[#D8D4CA] font-semibold'
                            : 'bg-[#F4F3EF] text-[#8C8980] border-[#E2DFD6]'
                          : rank === 1
                          ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                          : rank === 2
                          ? 'bg-slate-200 text-slate-800 border-slate-300 font-semibold'
                          : rank === 3
                          ? 'bg-orange-100 text-orange-900 border-orange-200 font-semibold'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
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

      {/* Footer Timestamp & Credit Cost */}
      <div
        className={`mt-3 pt-2.5 border-t flex items-center justify-between text-[10px] ${
          isDark ? 'border-[#262833] text-[#787C8D]' : isMono ? 'border-[#EAE7DF] text-[#8C8980]' : 'border-slate-100 text-slate-400'
        }`}
      >
        <span
          title={isRadarMode ? 'Costs 1 API credit per requested classification × period combination (default 2 classifications × 5 periods = 10 credits / poll)' : 'Consumes 1 credit per symbol daily tick'}
          className={`inline-flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded border ${
            isRadarMode
              ? isDark
                ? 'bg-[#20222B] text-amber-400 border-amber-400/20'
                : isMono
                ? 'bg-[#ECE8DE] text-amber-700 border-amber-600/20'
                : 'bg-amber-50 text-amber-700 border-amber-200'
              : isDark
              ? 'bg-[#20222B] text-[#BAC0D0] border-[#2F3240]'
              : isMono
              ? 'bg-[#ECE8DE] text-[#5A5852] border-[#D6D0C2]'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}
        >
          <MingIcon name="coin_line" size={11} />
          {isRadarMode ? '10 credits / poll' : '1 credit / tick'}
        </span>
        <div className="flex items-center gap-1.5 text-[10px]">
          <span>Poll: {config.interval || 300}s</span>
          <span>•</span>
          <span>{state.lastTriggeredAt ? `Updated ${state.lastTriggeredAt}` : 'Idle'}</span>
        </div>
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

