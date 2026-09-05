'use client';

import React, { useState, useRef } from 'react';
import { NodeType } from '@/types/canvas';
import { MingIcon } from '@/components/ui/MingIcon';
import { Logo } from '@/components/ui/Logo';
import { useTheme } from '@/context/ThemeContext';

interface TopNavProps {
  canvasName: string;
  canvasId?: string;
  onRenameCanvas?: (newName: string) => void;
  onAddNode: (type: NodeType, config?: any) => void;
  isFeedOpen: boolean;
  onToggleFeed: () => void;
  isControlsOpen: boolean;
  onToggleControls: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onOpenProjectHub?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  canvasName,
  canvasId,
  onRenameCanvas,
  onAddNode,
  isFeedOpen,
  onToggleFeed,
  isControlsOpen,
  onToggleControls,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onOpenProjectHub,
}) => {
  const { theme, setTheme } = useTheme();
  const [showStickerMenu, setShowStickerMenu] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(canvasName || 'untitled board');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Sync tempName when server updates canvasName
  React.useEffect(() => {
    setTempName(canvasName || 'untitled board');
  }, [canvasName]);

  const handleNameSubmit = () => {
    setIsEditingName(false);
    const trimmed = tempName.trim() || 'untitled board';
    setTempName(trimmed);
    if (trimmed !== canvasName) {
      onRenameCanvas?.(trimmed);
    }
  };

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
      {/* Left: Brand & Canvas Title & Undo/Redo & Project Hub */}
      <div className="flex items-center gap-2 max-w-[380px] lg:max-w-[460px]">
        <div className="flex items-center shrink-0 pr-0.5">
          <Logo className="h-5 w-auto" />
        </div>
        <div className={`h-5 w-[2px] shrink-0 ${
          theme === 'dark' ? 'bg-[#252730]' : theme === 'mono' ? 'bg-[#D8D4CA]' : 'bg-slate-200'
        }`} />

        {/* Project Title with inline editing and UI truncation */}
        {isEditingName ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleNameSubmit();
            }}
            className="flex items-center"
          >
            <input
              ref={nameInputRef}
              type="text"
              autoFocus
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setTempName(canvasName || 'untitled board');
                  setIsEditingName(false);
                }
              }}
              placeholder="untitled board"
              className="rounded-lg border-2 border-indigo-400 bg-indigo-50/50 px-2 py-0.5 text-sm font-semibold text-slate-900 outline-none w-44 shadow-xs"
            />
          </form>
        ) : (
          <div className="flex items-center gap-1 min-w-0">
            <div
              onClick={() => {
                setIsEditingName(true);
                setTimeout(() => nameInputRef.current?.select(), 20);
              }}
              title="Click to rename project"
              className="group flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-slate-100 cursor-pointer transition min-w-0"
            >
              <h1 className="text-sm font-semibold text-slate-800 truncate max-w-[110px] lg:max-w-[160px]">
                {canvasName || 'untitled board'}
              </h1>
              <MingIcon
                name="edit_2_line"
                size={13}
                className="text-slate-400 opacity-0 group-hover:opacity-100 transition shrink-0"
              />
            </div>

            {/* Project Hub Dropdown Trigger */}
            <button
              onClick={() => onOpenProjectHub?.()}
              title="Switch or create new project board (1 tab = 1 project)"
              className="flex items-center justify-center h-6 w-6 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition shrink-0 cursor-pointer"
            >
              <MingIcon name="down_line" size={14} />
            </button>
          </div>
        )}

        {/* Undo / Redo Buttons */}
        <div className="flex items-center gap-0.5 border-l-2 border-slate-200 pl-1.5 shrink-0">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z / Cmd+Z)"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-25 disabled:hover:bg-transparent transition active:scale-95 cursor-pointer disabled:cursor-not-allowed"
          >
            <MingIcon name="back_line" size={16} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z / Cmd+Shift+Z or Ctrl+Y)"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-25 disabled:hover:bg-transparent transition active:scale-95 cursor-pointer disabled:cursor-not-allowed"
          >
            <MingIcon name="forward_line" size={16} />
          </button>
        </div>
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

      {/* Right: Theme Switcher & Panel View Toggles */}
      <div className="flex items-center gap-2">
        {/* 3-Mode Theme Switcher */}
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100/80 p-0.5">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-all ${
              theme === 'light'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Light Mode (Default Colorful)"
          >
            <MingIcon name="sun_line" size={13} />
            <span className="hidden sm:inline">Light</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('mono')}
            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-all ${
              theme === 'mono'
                ? 'bg-white text-blue-600 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Monochrome Light (Black & White + Scriffle Blue)"
          >
            <MingIcon name="contrast_2_line" size={13} />
            <span className="hidden sm:inline">Mono</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-all ${
              theme === 'dark'
                ? 'bg-black text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Monochrome Dark (Pure Black & White)"
          >
            <MingIcon name="moon_line" size={13} />
            <span className="hidden sm:inline">Dark</span>
          </button>
        </div>

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
