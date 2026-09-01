'use client';

import React from 'react';
import { Activity, Bell, CheckCircle2, Clock, Terminal } from 'lucide-react';
import { ExecutionLog } from '@/types/canvas';

interface ActivityFeedProps {
  logs: ExecutionLog[];
  onSelectNode?: (nodeId: string) => void;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ logs, onSelectNode }) => {
  return (
    <aside className="w-80 border-l border-slate-800 bg-slate-950/80 p-4 flex flex-col h-full backdrop-blur-xl z-30">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">Activity & Event Feed</h2>
        </div>
        <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
          LIVE
        </span>
      </div>

      {/* Log List */}
      <div className="flex-1 overflow-y-auto pt-3 space-y-2.5 pr-1">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-xs text-slate-500">
            <Activity className="h-8 w-8 text-slate-700 mb-2 stroke-[1.5]" />
            <p>No market triggers yet.</p>
            <p className="text-[10px] text-slate-600 mt-1">Use the simulation bar below to inject spikes.</p>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 text-xs transition hover:border-slate-700 hover:bg-slate-900"
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1.5 border-b border-slate-800/60">
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="h-3 w-3 text-slate-500" />
                  {new Date(log.createdAt).toLocaleTimeString()}
                </span>
                <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-mono text-emerald-400 border border-emerald-500/20">
                  {log.triggeredNodes.length} nodes
                </span>
              </div>

              <p className="mt-2 text-xs font-medium text-slate-200 leading-snug">
                {log.eventSummary}
              </p>

              {/* Clickable Triggered Node Badges */}
              {log.triggeredNodes.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {log.triggeredNodes.map((nodeId, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSelectNode?.(nodeId)}
                      className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[9px] text-slate-300 hover:bg-purple-600 hover:text-white transition"
                    >
                      node-{nodeId.slice(0, 4)}
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
