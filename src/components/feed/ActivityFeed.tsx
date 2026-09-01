'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import { ExecutionLog } from '@/types/canvas';

interface ActivityFeedProps {
  logs: ExecutionLog[];
  onSelectNode?: (nodeId: string) => void;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ logs, onSelectNode }) => {
  return (
    <aside className="w-80 border-l border-slate-200 bg-white p-4 flex flex-col h-full z-30 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-lg">📋</span>
          <h2 className="text-sm font-bold text-slate-800">Activity Feed</h2>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
          Live
        </span>
      </div>

      {/* Log List */}
      <div className="flex-1 overflow-y-auto pt-3 space-y-2.5 pr-1">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-xs text-slate-400">
            <span className="text-2xl mb-1.5">☕</span>
            <p className="font-medium text-slate-600">No market triggers yet.</p>
            <p className="text-[11px] text-slate-400 mt-1">Use the demo controls at the bottom to test.</p>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 text-xs transition hover:border-slate-300 hover:bg-white figma-shadow"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-500 pb-1.5 border-b border-slate-200/60">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-slate-400" />
                  {new Date(log.createdAt).toLocaleTimeString()}
                </span>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#0050FF] border border-blue-100">
                  {log.triggeredNodes.length} cards
                </span>
              </div>

              <p className="mt-2 text-xs font-semibold text-slate-800 leading-snug">
                {log.eventSummary}
              </p>

              {/* Clickable Triggered Node Badges */}
              {log.triggeredNodes.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {log.triggeredNodes.map((nodeId, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSelectNode?.(nodeId)}
                      className="rounded-lg bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200 hover:border-[#0050FF] hover:text-[#0050FF] transition shadow-2xs"
                    >
                      card-{nodeId.slice(0, 4)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </aside>
  );
};
