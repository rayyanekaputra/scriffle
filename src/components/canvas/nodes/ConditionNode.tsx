'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { ConditionConfig } from '@/types/canvas';
import { MingIcon } from '@/components/ui/MingIcon';
import { useTheme } from '@/context/ThemeContext';

export const ConditionNode = memo(({ data, selected }: NodeProps) => {
  const { theme } = useTheme();
  const config = (data.config || {}) as ConditionConfig;
  const state = (data.state || {}) as any;
  const status = state.status || 'idle';
  const isPassed = status === 'passed';
  const isFailed = status === 'failed';

  const isDark = theme === 'dark';
  const isMono = theme === 'mono';

  const containerBg = isDark
    ? 'bg-[#181920] text-[#E2E4E9]'
    : isMono
    ? 'bg-[#FCFBF9] text-[#242321]'
    : 'bg-[#FFFDE7] text-amber-950';

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
    ? 'border-[#FFD728] ring-2 ring-[#FFD728]/40'
    : isPassed
    ? 'border-emerald-600'
    : 'border-[#FDD835] hover:border-amber-500';

  return (
    <div
      className={`relative w-68 rounded-2xl border-2 p-4 transition-all duration-150 ${containerBg} ${cardBorder}`}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className={`!h-3.5 !w-3.5 !rounded-full !border-2 ${
          isDark
            ? '!border-[#181920] !bg-[#8E95A5]'
            : isMono
            ? '!border-[#FCFBF9] !bg-[#1D4ED8]'
            : '!border-white !bg-[#FFD728]'
        }`}
      />

      {/* Header */}
      <div className={`flex items-center justify-between pb-2 border-b ${
        isDark ? 'border-[#262833]' : isMono ? 'border-[#EAE7DF]' : 'border-amber-300'
      }`}>
        <div className="flex items-center gap-1.5">
          <div className={`rounded-xl p-1 border ${
            isDark
              ? 'bg-[#22242D] text-[#BAC0D0] border-[#313442]'
              : isMono
              ? 'bg-[#EFECE4] text-[#242321] border-[#D8D4CA]'
              : 'bg-amber-100 text-amber-900 border-amber-300'
          }`}>
            <MingIcon name="filter_line" size={16} />
          </div>
          <div>
            <span className={`text-[11px] font-medium ${
              isDark ? 'text-[#8C90A0]' : isMono ? 'text-[#78756D]' : 'text-amber-900/70'
            }`}>
              Rule Check
            </span>
            <h3 className={`text-xs font-bold ${
              isDark ? 'text-[#E2E4E9]' : isMono ? 'text-[#242321]' : 'text-amber-950'
            }`}>
              Condition
            </h3>
          </div>
        </div>

        {/* Status Pill */}
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
            isDark
              ? isPassed
                ? 'bg-[#252834] text-[#BAC0D0] border-[#3F4252]'
                : isFailed
                ? 'bg-[#1D1E26] text-[#787C8D] border-[#2C2E3A]'
                : 'bg-[#181920] text-[#787C8D] border-[#262833]'
              : isMono
              ? isPassed
                ? 'bg-[#E2DFD6] text-[#242321] border-[#C8C4B8]'
                : isFailed
                ? 'bg-[#ECEAE4] text-[#8C8980] border-[#D8D4CA]'
                : 'bg-[#F4F3EF] text-[#8C8980] border-[#E2DFD6]'
              : isPassed
              ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
              : isFailed
              ? 'bg-rose-100 text-rose-900 border-rose-400'
              : 'bg-amber-100 text-amber-900 border-amber-300'
          }`}
        >
          {isPassed ? 'Passed' : isFailed ? 'Failed' : 'Waiting'}
        </span>
      </div>

      {/* Body: Plain expression badge */}
      <div className="mt-3">
        <div className={`rounded-xl p-2.5 border text-xs font-semibold ${
          isDark
            ? 'bg-[#14151B] border-[#252732] text-[#D8DAE2]'
            : isMono
            ? 'bg-[#F4F3EF] border-[#E2DFD6] text-[#242321] font-mono'
            : 'bg-white border-amber-300 text-amber-950'
        }`}>
          {config.rule || 'price_change > 0'}
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
            ? '!border-[#FCFBF9] !bg-[#1D4ED8]'
            : '!border-white !bg-[#FFD728]'
        }`}
      />
    </div>
  );
});

ConditionNode.displayName = 'ConditionNode';
