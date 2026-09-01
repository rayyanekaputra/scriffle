'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { GitBranch, CheckCircle2, XCircle, Code } from 'lucide-react';
import { ConditionConfig } from '@/types/canvas';

export const ConditionNode = memo(({ data, selected }: NodeProps) => {
  const config = (data.config || {}) as ConditionConfig;
  const state = (data.state || {}) as any;
  const status = state.status || 'idle';

  const isPassed = status === 'passed';
  const isFailed = status === 'failed';

  return (
    <div
      className={`w-72 rounded-xl border bg-slate-900/95 p-4 shadow-xl backdrop-blur-md transition-all duration-300 ${
        selected ? 'border-amber-500 ring-2 ring-amber-500/50' : 'border-slate-800 hover:border-slate-700'
      } ${isPassed ? 'shadow-amber-500/20 ring-1 ring-amber-400' : ''}`}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !rounded-full !border-2 !border-slate-900 !bg-amber-500 transition hover:!scale-125"
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-amber-500/20 p-1.5 text-amber-400">
            <GitBranch className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Condition</span>
            <h3 className="text-sm font-semibold text-white">Rule Evaluator</h3>
          </div>
        </div>

        {/* Status Pill */}
        <span
          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
            isPassed
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : isFailed
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          {isPassed && <CheckCircle2 className="h-3 w-3" />}
          {isFailed && <XCircle className="h-3 w-3" />}
          {status}
        </span>
      </div>

      {/* Body: Rule Display */}
      <div className="mt-3">
        <div className="rounded-lg bg-slate-950/80 p-2.5 border border-slate-800 font-mono text-xs text-amber-300 flex items-start gap-2">
          <Code className="h-4 w-4 shrink-0 text-slate-500 mt-0.5" />
          <span className="break-all">{config.rule || 'price_change > 0'}</span>
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !rounded-full !border-2 !border-slate-900 !bg-amber-500 transition hover:!scale-125"
      />
    </div>
  );
});

ConditionNode.displayName = 'ConditionNode';
