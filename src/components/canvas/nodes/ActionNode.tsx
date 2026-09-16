'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { ActionConfig } from '@/types/canvas';
import { MingIcon } from '@/components/ui/MingIcon';
import { useTheme } from '@/context/ThemeContext';
import { useLoading } from '@/context/LoadingContext';
import { QuickAddSourceHandle } from '../QuickAddSourceHandle';

export const ActionNode = memo(({ id, data, selected }: NodeProps) => {
  const { theme } = useTheme();
  const { isNodeLoading } = useLoading();
  const config = (data.config || {}) as ActionConfig;
  const state = (data.state || {}) as any;
  const isPassed = state.status === 'passed';
  const nodeLoading = isNodeLoading(id);

  const isDark = theme === 'dark';
  const isMono = theme === 'mono';

  const cardBorder = isDark
    ? selected
      ? 'border-[#8E95A5] ring-2 ring-[#8E95A5]/20'
      : nodeLoading
      ? 'border-[#0050FF] ring-2 ring-[#0050FF]/30 animate-pulse'
      : isPassed
      ? 'border-[#8E95A5]'
      : 'border-[#282A36] hover:border-[#383B4A]'
    : isMono
    ? selected
      ? 'border-[#242321] ring-2 ring-[#242321]/20'
      : nodeLoading
      ? 'border-[#242321] ring-2 ring-[#242321]/30 animate-pulse'
      : isPassed
      ? 'border-[#242321]'
      : 'border-[#D1CEC4] hover:border-[#B5B0A2]'
    : selected
    ? 'border-[#0050FF] ring-2 ring-[#0050FF]/20'
    : nodeLoading
    ? 'border-[#0050FF] ring-2 ring-[#0050FF]/30 animate-pulse'
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
      className={`relative w-64 rounded-2xl border-2 p-4 transition-all duration-150 group/node ${cardBg} ${cardBorder}`}
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
            : '!border-white !bg-[#0050FF]'
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
              : 'bg-blue-50 text-[#0050FF] border-blue-200'
          }`}>
            <MingIcon name="flash_line" size={18} />
          </div>
          <div>
            <span className={`text-[11px] font-medium ${
              isDark ? 'text-[#8C90A0]' : isMono ? 'text-[#78756D]' : 'text-slate-500'
            }`}>
              Board Mutation
            </span>
            <h3 className={`text-xs font-bold leading-tight ${
              isDark ? 'text-[#E2E4E9]' : isMono ? 'text-[#242321]' : 'text-slate-900'
            }`}>
              Automation
            </h3>
          </div>
        </div>

        {nodeLoading ? (
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold border flex items-center gap-1 animate-pulse ${
            isDark
              ? 'bg-blue-950/60 text-blue-300 border-blue-800/60'
              : isMono
              ? 'bg-[#EAE7DF] text-[#242321] border-[#242321]'
              : 'bg-blue-50 text-[#0050FF] border-blue-200'
          }`}>
            <MingIcon name="loading_3_line" size={11} className="animate-spin" />
            <span>Running...</span>
          </span>
        ) : (
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold border ${
            isDark
              ? 'bg-[#22242D] text-[#BAC0D0] border-[#313442]'
              : isMono
              ? 'bg-[#EFECE4] text-[#242321] border-[#D8D4CA]'
              : 'bg-blue-50 text-[#0050FF] border-blue-200'
          }`}>
            Auto
          </span>
        )}
      </div>

      {/* Body */}
      <div className="mt-3 space-y-2 text-xs">
        <div className={`rounded-xl p-2.5 border font-bold flex items-center gap-1.5 ${
          isDark
            ? 'bg-[#14151B] border-[#252732] text-[#E2E4E9]'
            : isMono
            ? 'bg-[#F4F3EF] border-[#E2DFD6] text-[#242321]'
            : 'bg-blue-50 border-blue-200 text-blue-950'
        }`}>
          <MingIcon
            name={
              config.action === 'fundamental_report'
                ? 'file_pdf_2_line'
                : config.action === 'create_watcher'
                ? 'radar_line'
                : 'quill_pen_line'
            }
            size={14}
            className={isDark ? 'text-[#BAC0D0]' : isMono ? 'text-[#242321]' : 'text-[#0050FF]'}
          />
          <span className="truncate">
            {config.action === 'fundamental_report'
              ? 'Fundamental Brief & PDF'
              : config.action === 'create_watcher'
              ? (config.params?.symbol || config.targetSymbol)
                ? `Spawn Peer Watcher (${config.params?.symbol || config.targetSymbol})`
                : 'Spawn Peer Watcher (Dynamic)'
              : 'Auto-Spawn New Note'}
          </span>
        </div>

        <div className={`text-[11px] leading-relaxed ${
          isDark ? 'text-[#8C90A0]' : isMono ? 'text-[#78756D]' : 'text-slate-500'
        }`}>
          {config.action === 'fundamental_report'
            ? 'Fetches P/E, P/B & dividend metrics from Sectors API v2 and spawns a new research note + PDF card.'
            : config.action === 'create_watcher'
            ? 'Dynamically generates a new related stock watcher node on canvas.'
            : 'Creates a brand new sticky note on canvas every time this action fires.'}
        </div>

        {/* Credit Cost Badge */}
        <div className="flex items-center justify-between pt-1 text-[10px]">
          <span
            className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md border ${
              config.action === 'fundamental_report'
                ? isDark
                  ? 'bg-[#20222B] text-amber-400 border-amber-400/20'
                  : isMono
                  ? 'bg-[#ECE8DE] text-amber-700 border-amber-600/20'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
                : isDark
                ? 'bg-[#20222B] text-[#8C90A0] border-[#2C2E3A]'
                : isMono
                ? 'bg-[#ECE8DE] text-[#78756D] border-[#D8D4CA]'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            <MingIcon name={config.action === 'fundamental_report' ? 'coin_line' : 'flash_line'} size={12} />
            {config.action === 'fundamental_report' ? '8 credits / symbol' : '0 credits (local)'}
          </span>
          {config.action === 'fundamental_report' && (
            <span
              className={`font-mono text-[9px] ${
                isDark ? 'text-[#8C90A0]' : isMono ? 'text-[#78756D]' : 'text-slate-400'
              }`}
            >
              /v2/report/
            </span>
          )}
        </div>
      </div>

      {/* Output Handle with Quick-Add [+] Connector */}
      <QuickAddSourceHandle
        nodeId={id || (data as any)?.id}
        nodeType="action"
        nodeLabel={
          config.action === 'fundamental_report'
            ? 'Fundamental Report'
            : config.action === 'create_watcher'
            ? 'Spawn Watcher'
            : 'Spawn Note'
        }
        selected={selected}
      />
    </div>
  );
});

ActionNode.displayName = 'ActionNode';
