'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { ConditionConfig } from '@/types/canvas';
import { MingIcon } from '@/components/ui/MingIcon';

export const ConditionNode = memo(({ data, selected }: NodeProps) => {
  const config = (data.config || {}) as ConditionConfig;
  const state = (data.state || {}) as any;
  const status = state.status || 'idle';
  const isPassed = status === 'passed';
  const isFailed = status === 'failed';

  return (
    <div
      className={`relative w-68 rounded-2xl border-2 bg-[#FFFDE7] p-4 transition-all duration-150 ${
        selected
          ? 'border-[#FFD728] ring-2 ring-[#FFD728]/40'
          : isPassed
          ? 'border-emerald-600'
          : 'border-[#FDD835] hover:border-amber-500'
      }`}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3.5 !w-3.5 !rounded-full !border-2 !border-white !bg-[#FFD728]"
      />

      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-amber-300">
        <div className="flex items-center gap-1.5">
          <div className="rounded-xl bg-amber-100 p-1 text-amber-900 border border-amber-300">
            <MingIcon name="filter_line" size={16} />
          </div>
          <div>
            <span className="text-[11px] font-medium text-amber-900/70">Rule Check</span>
            <h3 className="text-xs font-bold text-amber-950">Condition</h3>
          </div>
        </div>

        {/* Status Pill */}
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            isPassed
              ? 'bg-emerald-100 text-emerald-900 border border-emerald-400'
              : isFailed
              ? 'bg-rose-100 text-rose-900 border border-rose-400'
              : 'bg-amber-100 text-amber-900 border border-amber-300'
          }`}
        >
          {isPassed ? 'Passed' : isFailed ? 'Failed' : 'Waiting'}
        </span>
      </div>

      {/* Body: Plain expression badge */}
      <div className="mt-3">
        <div className="rounded-xl bg-white p-2.5 border border-amber-300 text-xs font-semibold text-amber-950">
          {config.rule || 'price_change > 0'}
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3.5 !w-3.5 !rounded-full !border-2 !border-white !bg-[#FFD728]"
      />
    </div>
  );
});

ConditionNode.displayName = 'ConditionNode';
