'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Bell, Send, Radio } from 'lucide-react';
import { AlertConfig } from '@/types/canvas';

export const AlertNode = memo(({ data, selected }: NodeProps) => {
  const config = (data.config || {}) as AlertConfig;
  const state = (data.state || {}) as any;
  const isPassed = state.status === 'passed';

  return (
    <div
      className={`w-64 rounded-xl border bg-slate-900/95 p-4 shadow-xl backdrop-blur-md transition-all duration-300 ${
        selected ? 'border-rose-500 ring-2 ring-rose-500/50' : 'border-slate-800 hover:border-slate-700'
      } ${isPassed ? 'shadow-rose-500/20 ring-1 ring-rose-400' : ''}`}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !rounded-full !border-2 !border-slate-900 !bg-rose-500 transition hover:!scale-125"
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-rose-500/20 p-1.5 text-rose-400">
            <Bell className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Notification</span>
            <h3 className="text-sm font-semibold text-white">Alert Dispatcher</h3>
          </div>
        </div>

        <span className="flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-medium uppercase text-rose-300">
          <Radio className="h-2.5 w-2.5" />
          {config.channel || 'UI'}
        </span>
      </div>

      {/* Body */}
      <div className="mt-3 space-y-2 text-xs">
        <div className="flex items-center gap-2 rounded-lg bg-slate-950/80 p-2.5 border border-slate-800 text-slate-300">
          <Send className="h-3.5 w-3.5 text-rose-400" />
          <span>Channel: <strong className="text-white uppercase">{config.channel || 'UI'}</strong></span>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500">
          <span>Last fired:</span>
          <span className="font-mono">{state.lastTriggeredAt || 'Never'}</span>
        </div>
      </div>
    </div>
  );
});

AlertNode.displayName = 'AlertNode';
