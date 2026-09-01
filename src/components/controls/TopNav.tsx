'use client';

import React from 'react';
import { Eye, GitBranch, FileText, Bell, Zap, Sparkles } from 'lucide-react';
import { NodeType } from '@/types/canvas';

interface TopNavProps {
  canvasName: string;
  onAddNode: (type: NodeType) => void;
}

export const TopNav: React.FC<TopNavProps> = ({ canvasName, onAddNode }) => {
  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-950/90 px-5 backdrop-blur-md z-30">
      {/* Brand & Canvas Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-2.5 py-1 text-white shadow-md shadow-purple-500/20">
          <Sparkles className="h-4 w-4" />
          <span className="font-mono text-xs font-bold tracking-wider">SCRIFFLE</span>
        </div>
        <div className="h-4 w-[1px] bg-slate-800" />
        <h1 className="text-sm font-semibold text-slate-200">{canvasName}</h1>
      </div>

      {/* Add Node Toolset */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-slate-400 mr-1.5">Insert:</span>

        <button
          onClick={() => onAddNode('watcher')}
          className="flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-xs font-medium text-purple-300 hover:bg-purple-500/20 transition"
        >
          <Eye className="h-3.5 w-3.5" /> Watcher
        </button>

        <button
          onClick={() => onAddNode('condition')}
          className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition"
        >
          <GitBranch className="h-3.5 w-3.5" /> Condition
        </button>

        <button
          onClick={() => onAddNode('note')}
          className="flex items-center gap-1.5 rounded-lg border border-teal-500/30 bg-teal-500/10 px-2.5 py-1 text-xs font-medium text-teal-300 hover:bg-teal-500/20 transition"
        >
          <FileText className="h-3.5 w-3.5" /> Note
        </button>

        <button
          onClick={() => onAddNode('alert')}
          className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition"
        >
          <Bell className="h-3.5 w-3.5" /> Alert
        </button>

        <button
          onClick={() => onAddNode('action')}
          className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition"
        >
          <Zap className="h-3.5 w-3.5" /> Action
        </button>
      </div>
    </header>
  );
};
