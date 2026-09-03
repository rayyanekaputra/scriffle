'use client';

import React, { useState, useRef } from 'react';
import { NodeType } from '@/types/canvas';
import { MingIcon } from '@/components/ui/MingIcon';

interface TopNavProps {
  canvasName: string;
  onAddNode: (type: NodeType, config?: any) => void;
  isFeedOpen: boolean;
  onToggleFeed: () => void;
  isControlsOpen: boolean;
  onToggleControls: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  canvasName,
  onAddNode,
  isFeedOpen,
  onToggleFeed,
  isControlsOpen,
  onToggleControls,
}) => {
  const [showStickerMenu, setShowStickerMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        onAddNode('image', {
          url: dataUrl,
          caption: file.name,
          isTransparent: file.type.includes('png'),
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <header className="relative flex h-16 items-center justify-between border-b-2 border-slate-200 bg-white px-6 z-30">
      {/* Left: Brand & Canvas Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-1.5 text-white">
          <MingIcon name="sparkles_line" size={18} />
          <span className="text-sm font-bold tracking-tight">Scriffle</span>
        </div>
        <div className="h-5 w-[2px] bg-slate-200" />
        <h1 className="text-sm font-semibold text-slate-800">{canvasName}</h1>
      </div>

      {/* Center: Absolute Centered FigJam Toolbar */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-2xl border-2 border-slate-200 bg-slate-50 p-1.5">
        <button
          onClick={() => onAddNode('note', { color: 'yellow', content: 'Double click to write note...' })}
          className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-95"
        >
          <MingIcon name="quill_pen_line" size={16} className="text-slate-600" />
          <span>Sticky Note</span>
        </button>

        <button
          onClick={() => onAddNode('text', { text: 'Freeform text headline...' })}
          className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-95"
        >
          <MingIcon name="font_size_line" size={16} className="text-slate-600" />
          <span>Text</span>
        </button>

        {/* Upload Image Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-95"
        >
          <MingIcon name="pic_line" size={16} className="text-slate-600" />
          <span>Image</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        <button
          onClick={() => onAddNode('watcher', { symbol: 'BBCA', metric: 'price_change', interval: 300 })}
          className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-95"
        >
          <MingIcon name="radar_line" size={16} className="text-slate-600" />
          <span>Watcher</span>
        </button>

        <button
          onClick={() => onAddNode('condition', { rule: 'price_change > 5' })}
          className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-95"
        >
          <MingIcon name="filter_line" size={16} className="text-slate-600" />
          <span>Condition</span>
        </button>

        {/* Sticker Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowStickerMenu(!showStickerMenu)}
            className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-95"
          >
            <MingIcon name="star_line" size={16} className="text-slate-600" />
            <span>Stickers</span>
          </button>

          {showStickerMenu && (
            <div className="absolute top-full left-0 mt-2 z-50 w-44 rounded-2xl border-2 border-slate-200 bg-white p-1.5 shadow-sm">
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
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
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
          className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-95"
        >
          <MingIcon name="notification_line" size={16} className="text-slate-600" />
          <span>Alert</span>
        </button>

        <button
          onClick={() => onAddNode('action', { action: 'create_note' })}
          className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-95"
        >
          <MingIcon name="flash_line" size={16} className="text-slate-600" />
          <span>Action</span>
        </button>
      </div>

      {/* Right: Sidebar & Left Panel View Toggles + Future Options Area */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleControls}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border-2 transition-all ${
            isControlsOpen
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
          title="Toggle Left Demo Controls Panel"
        >
          <MingIcon name="layout_left_line" size={16} />
          <span>Controls</span>
        </button>

        <button
          onClick={onToggleFeed}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border-2 transition-all ${
            isFeedOpen
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
          title="Toggle Right Activity Feed Sidebar"
        >
          <MingIcon name="layout_right_line" size={16} />
          <span>Feed</span>
        </button>
      </div>
    </header>
  );
};
