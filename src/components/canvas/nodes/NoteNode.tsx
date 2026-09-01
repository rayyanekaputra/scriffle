'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { NoteConfig } from '@/types/canvas';
import { MingIcon } from '@/components/ui/MingIcon';

const COLOR_STYLES = {
  yellow: 'bg-[#FEF9C3] border-[#FACC15] text-amber-950',
  mint: 'bg-[#DCFCE7] border-[#4ADE80] text-emerald-950',
  pink: 'bg-[#FFE4E6] border-[#FB7185] text-rose-950',
  blue: 'bg-[#E0F2FE] border-[#38BDF8] text-sky-950',
  purple: 'bg-[#F3E8FF] border-[#C084FC] text-purple-950',
};

export const NoteNode = memo(({ data, selected }: NodeProps) => {
  const config = (data.config || {}) as NoteConfig;
  const state = (data.state || {}) as any;
  const isPassed = state.status === 'passed';
  const colorKey = config.color || 'yellow';
  const colorClass = COLOR_STYLES[colorKey] || COLOR_STYLES.yellow;

  return (
    <div
      className={`relative w-72 rounded-2xl border-2 p-4 transition-all duration-150 ${colorClass} ${
        selected ? 'ring-3 ring-[#0050FF]/30' : ''
      }`}
    >
      {/* Tape decoration */}
      <div className="flat-tape" />

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3.5 !w-3.5 !rounded-full !border-2 !border-white !bg-[#0050FF]"
      />

      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-black/10 pt-1">
        <div className="flex items-center gap-1.5">
          <MingIcon name="quill_pen_line" size={16} />
          <h3 className="text-xs font-bold opacity-90">Research Note</h3>
        </div>

        {isPassed && (
          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold border border-black/10 flex items-center gap-1">
            <MingIcon name="sparkles_line" size={12} /> Updated
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
