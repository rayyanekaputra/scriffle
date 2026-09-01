'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { FileText, Sparkles } from 'lucide-react';
import { NoteConfig } from '@/types/canvas';

export const NoteNode = memo(({ data, selected }: NodeProps) => {
  const config = (data.config || {}) as NoteConfig;
  const state = (data.state || {}) as any;
  const isPassed = state.status === 'passed';

  return (
    <div
      className={`w-72 rounded-xl border bg-slate-900/95 p-4 shadow-xl backdrop-blur-md transition-all duration-300 ${
        selected ? 'border-teal-500 ring-2 ring-teal-500/50' : 'border-slate-800 hover:border-slate-700'
      } ${isPassed ? 'shadow-teal-500/20 ring-1 ring-teal-400' : ''}`}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !rounded-full !border-2 !border-slate-900 !bg-teal-500 transition hover:!scale-125"
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-teal-500/20 p-1.5 text-teal-400">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">Output</span>
            <h3 className="text-sm font-semibold text-white">Market Note</h3>
          </div>
        </div>

        {isPassed && (
          <span className="flex items-center gap-1 rounded-full bg-teal-500/20 px-2 py-0.5 text-[10px] font-medium text-teal-300">
            <Sparkles className="h-2.5 w-2.5" /> Updated
          </span>
        )}
      </div>

      {/* Note Body */}
      <div className="mt-3">
        <div className="min-h-[64px] rounded-lg bg-slate-950/80 p-3 border border-slate-800 text-xs leading-relaxed text-slate-200">
          {config.content || 'Awaiting trigger to generate market research commentary...'}
        </div>
      </div>
    </div>
  );
});

NoteNode.displayName = 'NoteNode';
