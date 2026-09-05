'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { AlertConfig } from '@/types/canvas';
import { MingIcon } from '@/components/ui/MingIcon';
import { useTheme } from '@/context/ThemeContext';

export const AlertNode = memo(({ data, selected }: NodeProps) => {
  const { theme } = useTheme();
  const config = (data.config || {}) as AlertConfig;
  const state = (data.state || {}) as any;
  const isPassed = state.status === 'passed';

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
    ? 'border-[#FF5B79] ring-2 ring-[#FF5B79]/20'
    : isPassed
    ? 'border-[#FF5B79]'
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
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className={`!h-3.5 !w-3.5 !rounded-full !border-2 ${
          isDark
            ? '!border-[#181920] !bg-[#8E95A5]'
            : isMono
            ? '!border-[#FCFBF9] !bg-[#5A5852]'
            : '!border-white !bg-[#FF5B79]'
        }`}
      />

      {/* Header */}
      <div className={`flex items-center justify-between pb-2 border-b ${
        isDark ? 'border-[#262833]' : isMono ? 'border-[#EAE7DF]' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`rounded-xl p-1.5 border ${
            isDark
              ? 'bg-[#22242D] text-[#BAC0D0] border-[#313442]'
              : isMono
              ? 'bg-[#EFECE4] text-[#242321] border-[#D8D4CA]'
              : 'bg-rose-50 text-[#FF5B79] border-rose-200'
          }`}>
            <MingIcon name="notification_line" size={18} />
          </div>
          <div>
            <span className={`text-[11px] font-medium ${
              isDark ? 'text-[#8C90A0]' : isMono ? 'text-[#78756D]' : 'text-slate-500'
            }`}>
              Notification
            </span>
            <h3 className={`text-xs font-bold leading-tight ${
              isDark ? 'text-[#E2E4E9]' : isMono ? 'text-[#242321]' : 'text-slate-900'
            }`}>
              Market Alert
            </h3>
          </div>
        </div>

        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold border ${
          isDark
            ? 'bg-[#22242D] text-[#BAC0D0] border-[#313442]'
            : isMono
            ? 'bg-[#EFECE4] text-[#242321] border-[#D8D4CA]'
            : 'bg-rose-50 text-[#FF5B79] border-rose-200'
        }`}>
          Toast
        </span>
      </div>

      {/* Body */}
      <div className="mt-3 space-y-2 text-xs">
        <div className={`rounded-xl p-2.5 border ${
          isDark
            ? 'bg-[#14151B] border-[#252732] text-[#D8DAE2]'
            : isMono
            ? 'bg-[#F4F3EF] border-[#E2DFD6] text-[#242321]'
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          Channel: <strong className={isDark ? 'text-[#E2E4E9] font-semibold' : isMono ? 'text-[#242321] font-semibold' : 'text-slate-900 font-semibold'}>
            {config.channel || 'UI'}
          </strong>
        </div>

        <div className={`flex items-center justify-between text-[11px] pt-1 ${
          isDark ? 'text-[#686B7C]' : isMono ? 'text-[#8C8980]' : 'text-slate-400'
        }`}>
          <span>Trigger status:</span>
          <span>{state.lastTriggeredAt ? `Fired ${state.lastTriggeredAt}` : 'Never fired'}</span>
        </div>
      </div>
    </div>
  );
});

AlertNode.displayName = 'AlertNode';
