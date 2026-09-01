'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { AlertConfig } from '@/types/canvas';
import { MingIcon } from '@/components/ui/MingIcon';

export const AlertNode = memo(({ data, selected }: NodeProps) => {
  const config = (data.config || {}) as AlertConfig;
  const state = (data.state || {}) as any;
  const isPassed = state.status === 'passed';

  return (
    <div
      className={`relative w-64 rounded-2xl border-2 bg-white p-4 transition-all duration-150 ${
        selected
          ? 'border-[#FF5B79] ring-2 ring-[#FF5B79]/20'
          : isPassed
          ? 'border-[#FF5B79]'
          : 'border-slate-300 hover:border-slate-400'
      }`}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3.5 !w-3.5 !rounded-full !border-2 !border-white !bg-[#FF5B79]"
      />

      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-rose-50 p-1.5 text-[#FF5B79] border border-rose-200">
            <MingIcon name="notification_line" size={18} />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-500">Notification</span>
            <h3 className="text-xs font-bold text-slate-900 leading-tight">Market Alert</h3>
          </div>
        </div>

        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-[#FF5B79] border border-rose-200">
          Toast
        </span>
      </div>

      {/* Body */}
      <div className="mt-3 space-y-2 text-xs">
        <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200 text-slate-700">
          Channel: <strong className="text-slate-900 font-semibold">{config.channel || 'UI'}</strong>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span>Trigger status:</span>
          <span>{state.lastTriggeredAt ? `Fired ${state.lastTriggeredAt}` : 'Never fired'}</span>
        </div>
      </div>
    </div>
  );
});

AlertNode.displayName = 'AlertNode';
