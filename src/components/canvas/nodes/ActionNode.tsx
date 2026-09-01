'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { ActionConfig } from '@/types/canvas';

export const ActionNode = memo(({ data, selected }: NodeProps) => {
  const config = (data.config || {}) as ActionConfig;
  const state = (data.state || {}) as any;
  const isPassed = state.status === 'passed';

  return (
    <div
      className={`relative w-64 rounded-2xl border-2 bg-white p-4 transition-all duration-200 figma-shadow ${
        selected
          ? 'border-[#0050FF] ring-4 ring-[#0050FF]/15'
          : isPassed
          ? 'border-[#0050FF] shadow-md shadow-[#0050FF]/10'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3.5 !w-3.5 !rounded-full !border-2 !border-white !bg-[#0050FF] transition hover:!scale-125"
      />

      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚡</span>
          <div>
            <span className="text-[11px] font-medium text-slate-500">Board Mutation</span>
            <h3 className="text-xs font-bold text-slate-900 leading-tight">Automation</h3>
          </div>
        </div>

        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-[#0050FF] border border-blue-100">
          Auto
        </span>
      </div>

      {/* Body */}
      <div className="mt-3 space-y-2 text-xs">
        <div className="rounded-xl bg-blue-50/60 p-2.5 border border-blue-100/80 font-medium text-blue-900">
          {config.action === 'create_note' ? 'Creates child sticky note' : config.action || 'create_note'}
        </div>

        <div className="text-[11px] text-slate-400">
          Spawns a new connected sticky note when triggered.
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3.5 !w-3.5 !rounded-full !border-2 !border-white !bg-[#0050FF] transition hover:!scale-125"
      />
    </div>
  );
});

ActionNode.displayName = 'ActionNode';
