'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Zap, PlusCircle, RefreshCw } from 'lucide-react';
import { ActionConfig } from '@/types/canvas';

export const ActionNode = memo(({ data, selected }: NodeProps) => {
  const config = (data.config || {}) as ActionConfig;
  const state = (data.state || {}) as any;
  const isPassed = state.status === 'passed';

  return (
    <div
      className={`w-68 rounded-xl border bg-slate-900/95 p-4 shadow-xl backdrop-blur-md transition-all duration-300 ${
        selected ? 'border-emerald-500 ring-2 ring-emerald-500/50' : 'border-slate-800 hover:border-slate-700'
      } ${isPassed ? 'shadow-emerald-500/20 ring-1 ring-emerald-400' : ''}`}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !rounded-full !border-2 !border-slate-900 !bg-emerald-500 transition hover:!scale-125"
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-emerald-500/20 p-1.5 text-emerald-400">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Mutation</span>
            <h3 className="text-sm font-semibold text-white">System Action</h3>
          </div>
        </div>

        <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium uppercase text-emerald-300">
          <RefreshCw className={`h-2.5 w-2.5 ${isPassed ? 'animate-spin' : ''}`} />
          Auto
        </span>
      </div>

      {/* Body */}
      <div className="mt-3 space-y-2 text-xs">
        <div className="flex items-center gap-2 rounded-lg bg-slate-950/80 p-2.5 border border-slate-800 text-slate-300">
          <PlusCircle className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="font-mono text-[11px] text-emerald-300">{config.action || 'create_note'}</span>
        </div>

        <div className="text-[10px] text-slate-500">
          Mutates graph topology when upstream condition passes.
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !rounded-full !border-2 !border-slate-900 !bg-emerald-500 transition hover:!scale-125"
      />
    </div>
  );
});

ActionNode.displayName = 'ActionNode';
