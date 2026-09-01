'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { NoteConfig } from '@/types/canvas';

const COLOR_STYLES = {
  yellow: 'bg-[#FEF9C3] border-[#FDE047] text-amber-950',
  mint: 'bg-[#DCFCE7] border-[#86EFAC] text-emerald-950',
  pink: 'bg-[#FFE4E6] border-[#FDA4AF] text-rose-950',
  blue: 'bg-[#E0F2FE] border-[#7DD3FC] text-sky-950',
  purple: 'bg-[#F3E8FF] border-[#D8B4FE] text-purple-950',
};

export const NoteNode = memo(({ data, selected }: NodeProps) => {
  const config = (data.config || {}) as NoteConfig;
  const state = (data.state || {}) as any;
  const isPassed = state.status === 'passed';
  const colorKey = config.color || 'yellow';
  const colorClass = COLOR_STYLES[colorKey] || COLOR_STYLES.yellow;

  return (
    <div
      className={`relative w-72 rounded-2xl border-2 p-4 transition-all duration-200 figma-shadow ${colorClass} ${
        selected ? 'ring-4 ring-[#0050FF]/25 scale-[1.02]' : 'hover:scale-[1.01]'
      } ${isPassed ? 'shadow-md' : ''}`}
    >
      {/* Tape decoration */}
      <div className="sticky-tape" />

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3.5 !w-3.5 !rounded-full !border-2 !border-white !bg-[#0050FF] transition hover:!scale-125"
      />

      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-black/5 pt-1">
        <div className="flex items-center gap-1.5">
          <span className="text-base">📝</span>
          <h3 className="text-xs font-bold opacity-80">Research Note</h3>
        </div>

        {isPassed && (
          <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold shadow-xs">
            ✨ Updated
          </span>
        )}
      </div>

      {/* Note Content */}
      <div className="mt-2.5 min-h-[72px] text-xs leading-relaxed font-medium">
        {config.content || 'Awaiting market triggers to populate commentary...'}
      </div>
    </div>
  );
});

NoteNode.displayName = 'NoteNode';
