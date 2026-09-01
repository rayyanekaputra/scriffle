'use client';

import React from 'react';
import { NodeType } from '@/types/canvas';

interface TopNavProps {
  canvasName: string;
  onAddNode: (type: NodeType) => void;
}

export const TopNav: React.FC<TopNavProps> = ({ canvasName, onAddNode }) => {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-6 backdrop-blur-md z-30">
      {/* Brand & Canvas Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl bg-[#0050FF] px-3 py-1.5 text-white shadow-md shadow-[#0050FF]/20">
          <span className="text-base">✨</span>
          <span className="text-sm font-bold tracking-tight">Scriffle</span>
        </div>
        <div className="h-5 w-[1px] bg-slate-200" />
        <h1 className="text-sm font-semibold text-slate-700">{canvasName}</h1>
      </div>

      {/* FigJam Floating Insert Toolbar */}
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 shadow-sm">
        <span className="text-xs font-medium text-slate-400 pl-2 pr-1">Add to board:</span>

        <button
          onClick={() => onAddNode('note')}
          className="flex items-center gap-1.5 rounded-xl bg-[#FEF9C3] px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-[#FDE047] border border-amber-200 transition-all active:scale-95"
        >
          <span>📝</span> Sticky Note
        </button>

        <button
          onClick={() => onAddNode('watcher')}
          className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-[#0050FF] hover:bg-blue-50 border border-slate-200 transition-all active:scale-95"
        >
          <span>📡</span> Watcher
        </button>

        <button
          onClick={() => onAddNode('condition')}
          className="flex items-center gap-1.5 rounded-xl bg-[#FFFDE7] px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-[#FFF9C4] border border-amber-200 transition-all active:scale-95"
        >
          <span>⚖️</span> Condition
        </button>

        <button
          onClick={() => onAddNode('alert')}
          className="flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-bold text-[#FF5B79] hover:bg-rose-100 border border-rose-200 transition-all active:scale-95"
        >
          <span>🔔</span> Alert
        </button>

        <button
          onClick={() => onAddNode('action')}
          className="flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#0050FF] hover:bg-blue-100 border border-blue-200 transition-all active:scale-95"
        >
          <span>⚡</span> Action
        </button>
      </div>
    </header>
  );
};
