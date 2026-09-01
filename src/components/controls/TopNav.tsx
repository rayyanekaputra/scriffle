'use client';

import React, { useState } from 'react';
import { NodeType } from '@/types/canvas';
import { MingIcon } from '@/components/ui/MingIcon';

interface TopNavProps {
  canvasName: string;
  onAddNode: (type: NodeType, config?: any) => void;
}

export const TopNav: React.FC<TopNavProps> = ({ canvasName, onAddNode }) => {
  const [showStickerMenu, setShowStickerMenu] = useState(false);

  return (
    <header className="flex h-16 items-center justify-between border-b-2 border-slate-200 bg-white px-6 z-30">
      {/* Brand & Canvas Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl bg-[#0050FF] px-3 py-1.5 text-white">
          <MingIcon name="sparkles_line" size={18} />
          <span className="text-sm font-bold tracking-tight">Scriffle</span>
        </div>
        <div className="h-5 w-[2px] bg-slate-200" />
        <h1 className="text-sm font-semibold text-slate-800">{canvasName}</h1>
      </div>

      {/* FigJam Floating Whiteboard Toolbar */}
      <div className="relative flex items-center gap-1 rounded-2xl border-2 border-slate-200 bg-slate-50 p-1.5">
        <button
          onClick={() => onAddNode('note', { color: 'yellow', content: 'Double click to write note...' })}
          className="flex items-center gap-1.5 rounded-xl bg-[#FEF9C3] px-3 py-1.5 text-xs font-bold text-amber-950 border border-amber-300 hover:bg-[#FDE047] transition-all active:scale-95"
        >
          <MingIcon name="quill_pen_line" size={16} />
          <span>Sticky Note</span>
        </button>

        <button
          onClick={() => onAddNode('text', { text: 'Freeform text headline...' })}
          className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-slate-800 border border-slate-300 hover:bg-slate-100 transition-all active:scale-95"
        >
          <MingIcon name="font_size_line" size={16} />
          <span>Text</span>
        </button>

        <button
          onClick={() => onAddNode('watcher', { symbol: 'BBCA', metric: 'price_change', interval: 300 })}
          className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-[#0050FF] border border-blue-200 hover:bg-blue-50 transition-all active:scale-95"
        >
          <MingIcon name="radar_line" size={16} />
          <span>Watcher</span>
        </button>

        <button
          onClick={() => onAddNode('condition', { rule: 'price_change > 5' })}
          className="flex items-center gap-1.5 rounded-xl bg-[#FFFDE7] px-3 py-1.5 text-xs font-bold text-amber-950 border border-amber-300 hover:bg-[#FFF9C4] transition-all active:scale-95"
        >
          <MingIcon name="filter_line" size={16} />
          <span>Condition</span>
        </button>

        {/* Sticker Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowStickerMenu(!showStickerMenu)}
            className="flex items-center gap-1.5 rounded-xl bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-900 border border-purple-200 hover:bg-purple-100 transition-all active:scale-95"
          >
            <MingIcon name="star_line" size={16} />
            <span>Stickers</span>
          </button>

          {showStickerMenu && (
            <div className="absolute top-full right-0 mt-2 z-50 w-44 rounded-2xl border-2 border-slate-200 bg-white p-1.5">
              {[
                { type: 'bullish', label: 'Bullish', icon: 'chart_line' },
                { type: 'bearish', label: 'Bearish', icon: 'chart_line' },
                { type: 'rocket', label: 'Breakout', icon: 'rocket_line' },
                { type: 'star', label: 'Top Pick', icon: 'star_line' },
                { type: 'warning', label: 'Volatility', icon: 'warning_line' },
                { type: 'approved', label: 'Approved', icon: 'check_circle_line' },
              ].map((s) => (
                <button
                  key={s.type}
                  onClick={() => {
                    onAddNode('sticker', { stickerType: s.type });
                    setShowStickerMenu(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  <MingIcon name={s.icon} size={16} />
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => onAddNode('alert', { channel: 'ui' })}
          className="flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-bold text-[#FF5B79] border border-rose-200 hover:bg-rose-100 transition-all active:scale-95"
        >
          <MingIcon name="notification_line" size={16} />
          <span>Alert</span>
        </button>

        <button
          onClick={() => onAddNode('action', { action: 'create_note' })}
          className="flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#0050FF] border border-blue-200 hover:bg-blue-100 transition-all active:scale-95"
        >
          <MingIcon name="flash_line" size={16} />
          <span>Action</span>
        </button>
      </div>
    </header>
  );
};
