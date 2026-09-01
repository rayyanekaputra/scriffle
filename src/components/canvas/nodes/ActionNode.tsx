'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { ActionConfig } from '@/types/canvas';
import { MingIcon } from '@/components/ui/MingIcon';

export const ActionNode = memo(({ data, selected }: NodeProps) => {
  const config = (data.config || {}) as ActionConfig;
  const state = (data.state || {}) as any;
  const isPassed = state.status === 'passed';

  return (
    <div
      className={`relative w-64 rounded-2xl border-2 bg-white p-4 transition-all duration-150 ${
        selected
          ? 'border-[#0050FF] ring-2 ring-[#0050FF]/20'
          : isPassed
          ? 'border-[#0050FF]'
          : 'border-slate-300 hover:border-slate-400'
      }`}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3.5 !w-3.5 !rounded-full !border-2 !border-white !bg-[#0050FF]"
      />

      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-blue-50 p-1.5 text-[#0050FF] border border-blue-200">
            <MingIcon name="flash_line" size={18} />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500">Board Mutation</span>
            <h3 className="text-xs font-bold text-slate-900 leading-tight">Automation</h3>
          </div>
        </div>

        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-[#0050FF] border border-blue-200">
          Auto
        </span>
      </div>

      {/* Body */}
      <div className="mt-3 space-y-2 text-xs">
        <div className="rounded-xl bg-blue-50 p-2.5 border border-blue-200 font-medium text-blue-900">
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
        className="!h-3.5 !w-3.5 !rounded-full !border-2 !border-white !bg-[#0050FF]"
      />
    </div>
  );
});

ActionNode.displayName = 'ActionNode';
