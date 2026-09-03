'use client';

import React from 'react';
import { ExecutionLog } from '@/types/canvas';
import { MingIcon } from '@/components/ui/MingIcon';

interface ActivityFeedProps {
  logs: ExecutionLog[];
  isOpen: boolean;
  onClose: () => void;
  onSelectNode?: (nodeId: string) => void;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ logs, isOpen, onClose, onSelectNode }) => {
  if (!isOpen) return null;

  return (
    <aside className="w-80 border-l-2 border-slate-200 bg-white p-4 flex flex-col h-full z-30 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-slate-100">
        <div className="flex items-center gap-2">
          <MingIcon name="history_line" size={18} className="text-slate-700" />
          <h2 className="text-sm font-bold text-slate-800">Activity Feed</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 border border-slate-200">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-ping" />
            Live
          </span>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            title="Hide Activity Feed"
          >
            <MingIcon name="close_line" size={16} />
          </button>
        </div>
      </div>

      {/* Log List */}
      <div className="flex-1 overflow-y-auto pt-3 space-y-2.5 pr-1">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-xs text-slate-400">
            <MingIcon name="time_line" size={28} className="text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No market triggers yet.</p>
            <p className="text-[11px] text-slate-400 mt-1">Use demo controls to test graph flow.</p>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="rounded-2xl border-2 border-slate-200 bg-slate-50/70 p-3 text-xs transition hover:border-slate-400 hover:bg-white"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-500 pb-1.5 border-b border-slate-200">
                <span className="flex items-center gap-1">
                  <MingIcon name="time_line" size={12} className="text-slate-400" />
                  {new Date(log.createdAt).toLocaleTimeString()}
                </span>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-300">
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
                      className="rounded-lg bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700 border border-slate-300 hover:border-slate-500 hover:text-slate-900 transition"
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
