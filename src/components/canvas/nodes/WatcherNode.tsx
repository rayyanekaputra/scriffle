'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { WatcherConfig } from '@/types/canvas';
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
      ? 'border-[#1D4ED8] ring-2 ring-[#1D4ED8]/20'
      : isPassed
      ? 'border-[#1D4ED8]'
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

  return (
    <div
      className={`relative w-64 rounded-2xl border-2 p-4 transition-all duration-150 ${cardBg} ${cardBorder}`}
    >
      {/* Top Header */}
      <div className={`flex items-center justify-between pb-3 border-b ${
        isDark ? 'border-[#262833]' : isMono ? 'border-[#EAE7DF]' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <div
            className={`rounded-xl p-1.5 border ${
              isDark
                ? 'bg-[#22242D] text-[#BAC0D0] border-[#313442]'
                : isMono
                ? 'bg-[#EFECE4] text-[#1D4ED8] border-[#D8D4CA]'
                : 'bg-blue-50 text-[#0050FF] border-blue-200'
            }`}
          >
            <MingIcon name="radar_line" size={18} />
          </div>
          <div>
            <span className={`text-[11px] font-medium ${
              isDark ? 'text-[#8C90A0]' : isMono ? 'text-[#78756D]' : 'text-slate-500'
            }`}>
              Market Watcher
            </span>
            <h3 className={`text-base font-bold leading-none mt-0.5 ${
              isDark ? 'text-[#E2E4E9]' : isMono ? 'text-[#242321]' : 'text-slate-900'
            }`}>
              {config.symbol || 'BBCA'}
            </h3>
          </div>
        </div>

        {/* Cycle Counter Badge */}
        <div
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold border ${
            isDark
              ? 'bg-[#22242D] text-[#BAC0D0] border-[#313442]'
              : isMono
              ? 'bg-[#EFECE4] text-[#1D4ED8] border-[#D8D4CA]'
              : 'bg-blue-50 text-[#0050FF] border-blue-200'
          }`}
        >
          <MingIcon name="repeat_line" size={12} />
          <span>{cycleCount} runs</span>
        </div>
      </div>

      {/* Snapshot Details */}
      <div className="mt-3 space-y-2 text-xs">
        <div className={`flex items-center justify-between rounded-xl p-2.5 border ${
          isDark
            ? 'bg-[#14151B] border-[#252732]'
            : isMono
            ? 'bg-[#F4F3EF] border-[#E2DFD6]'
            : 'bg-slate-50 border-slate-200'
        }`}>
          <span className={isDark ? 'text-[#8C90A0] font-medium' : isMono ? 'text-[#78756D] font-medium' : 'text-slate-500 font-medium'}>
            Last Price
          </span>
          <span className={`font-bold ${isDark ? 'text-[#E2E4E9]' : isMono ? 'text-[#242321]' : 'text-slate-900'}`}>
            {lastVal.price ? `Rp ${lastVal.price.toLocaleString('id-ID')}` : 'Waiting for tick'}
          </span>
        </div>

        {priceChange !== null && (
          <div className={`flex items-center justify-between rounded-xl p-2.5 border ${
            isDark
              ? 'bg-[#14151B] border-[#252732]'
              : isMono
              ? 'bg-[#F4F3EF] border-[#E2DFD6]'
              : 'bg-slate-50 border-slate-200'
          }`}>
            <span className={isDark ? 'text-[#8C90A0] font-medium' : isMono ? 'text-[#78756D] font-medium' : 'text-slate-500 font-medium'}>
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

      {/* Footer Timestamp */}
      <div className={`mt-3 flex items-center justify-between text-[11px] ${
        isDark ? 'text-[#686B7C]' : isMono ? 'text-[#8C8980]' : 'text-slate-400'
      }`}>
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
            ? '!border-[#FCFBF9] !bg-[#1D4ED8]'
            : '!border-white !bg-[#0050FF]'
        }`}
      />
    </div>
  );
});

WatcherNode.displayName = 'WatcherNode';
