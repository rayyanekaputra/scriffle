'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Eye, TrendingUp, TrendingDown, Clock, Activity } from 'lucide-react';
import { WatcherConfig } from '@/types/canvas';

export const WatcherNode = memo(({ data, selected }: NodeProps) => {
  const config = (data.config || {}) as WatcherConfig;
  const state = (data.state || {}) as any;
  const lastVal = state.lastValue || {};
  const isPassed = state.status === 'passed';
  const priceChange = lastVal.price_change !== undefined ? lastVal.price_change : null;

  return (
    <div
      className={`w-64 rounded-xl border bg-slate-900/95 p-4 shadow-xl backdrop-blur-md transition-all duration-300 ${
        selected ? 'border-purple-500 ring-2 ring-purple-500/50' : 'border-slate-800 hover:border-slate-700'
      } ${isPassed ? 'shadow-purple-500/20 ring-1 ring-purple-400' : ''}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-purple-500/20 p-1.5 text-purple-400">
            <Eye className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Watcher</span>
            <h3 className="font-mono text-base font-bold text-white">{config.symbol || 'SYMBOL'}</h3>
          </div>
        </div>
        <span
          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
            isPassed ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-400'
          }`}
        >
          <Activity className="h-2.5 w-2.5 animate-pulse" />
          {config.metric || 'price_change'}
        </span>
      </div>

      {/* Snapshot Body */}
      <div className="mt-3 space-y-2 text-xs">
        <div className="flex items-center justify-between rounded-lg bg-slate-950/60 p-2 border border-slate-800/60">
          <span className="text-slate-400">Market Price</span>
          <span className="font-mono font-semibold text-white">
            {lastVal.price ? `Rp ${lastVal.price.toLocaleString('id-ID')}` : 'Waiting...'}
          </span>
        </div>

        {priceChange !== null && (
          <div className="flex items-center justify-between rounded-lg bg-slate-950/60 p-2 border border-slate-800/60">
            <span className="text-slate-400">Change</span>
            <span
              className={`flex items-center gap-1 font-mono font-bold ${
                priceChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {priceChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {priceChange >= 0 ? `+${priceChange}%` : `${priceChange}%`}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {config.interval || 300}s poll
          </span>
          <span>{state.lastTriggeredAt ? state.lastTriggeredAt : 'Idle'}</span>
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !rounded-full !border-2 !border-slate-900 !bg-purple-500 transition hover:!scale-125"
      />
    </div>
  );
});

WatcherNode.displayName = 'WatcherNode';
