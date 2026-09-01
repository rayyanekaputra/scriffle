'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { TrendingUp, TrendingDown, Repeat } from 'lucide-react';
import { WatcherConfig } from '@/types/canvas';

export const WatcherNode = memo(({ data, selected }: NodeProps) => {
  const config = (data.config || {}) as WatcherConfig;
  const state = (data.state || {}) as any;
  const lastVal = state.lastValue || {};
  const isPassed = state.status === 'passed';
  const cycleCount = state.cycleCount || 0;
  const priceChange = lastVal.price_change !== undefined ? lastVal.price_change : null;

  return (
    <div
      className={`relative w-64 rounded-2xl border-2 bg-white p-4 transition-all duration-200 figma-shadow ${
        selected
          ? 'border-[#0050FF] ring-4 ring-[#0050FF]/15'
          : isPassed
          ? 'border-[#0050FF] shadow-lg shadow-[#0050FF]/10'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-xl">📡</span>
          <div>
            <span className="text-[11px] font-medium text-slate-500">Market Watcher</span>
            <h3 className="text-base font-bold text-slate-900 leading-none mt-0.5">
              {config.symbol || 'BBCA'}
            </h3>
          </div>
        </div>

        {/* Cycle Counter Badge */}
        <div className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-[#0050FF] border border-blue-100">
          <Repeat className="h-3 w-3" />
          <span>{cycleCount} runs</span>
        </div>
      </div>

      {/* Snapshot Details */}
      <div className="mt-3 space-y-2 text-xs">
        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-100">
          <span className="text-slate-500 font-medium">Last Price</span>
          <span className="font-bold text-slate-900">
            {lastVal.price ? `Rp ${lastVal.price.toLocaleString('id-ID')}` : 'Waiting for tick'}
          </span>
        </div>

        {priceChange !== null && (
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-100">
            <span className="text-slate-500 font-medium">Price Change</span>
            <span
              className={`flex items-center gap-1 font-bold ${
                priceChange >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {priceChange >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {priceChange >= 0 ? `+${priceChange}%` : `${priceChange}%`}
            </span>
          </div>
        )}
      </div>

      {/* Footer Timestamp */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
        <span>Poll: {config.interval || 300}s</span>
        <span>{state.lastTriggeredAt ? `Updated ${state.lastTriggeredAt}` : 'Idle'}</span>
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

WatcherNode.displayName = 'WatcherNode';
