'use client';

import React, { useState, useRef } from 'react';
import { CanvasToolMode, NodeType } from '@/types/canvas';
import { MingIcon } from '@/components/ui/MingIcon';
import { Logo } from '@/components/ui/Logo';
import { useTheme } from '@/context/ThemeContext';
import { useLoading } from '@/context/LoadingContext';

interface TopNavProps {
  canvasName: string;
  canvasId?: string;
  onRenameCanvas?: (newName: string) => void;
  isFeedOpen: boolean;
  onToggleFeed: () => void;
  isControlsOpen: boolean;
  onToggleControls: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onOpenProjectHub?: () => void;
  onOpenSearch?: () => void;
  onOpenShortcuts?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  canvasName,
  canvasId,
  onRenameCanvas,
  isFeedOpen,
  onToggleFeed,
  isControlsOpen,
  onToggleControls,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onOpenProjectHub,
  onOpenSearch,
  onOpenShortcuts,
}) => {
  const { theme, setTheme } = useTheme();
  const { isLoading, activeTask } = useLoading();
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(canvasName || 'untitled board');
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

  const isDark = theme === 'dark';
  const isMono = theme === 'mono';

  const headerBg = isDark
    ? 'border-[#252730] bg-[#14151B] text-[#E2E4E9]'
    : isMono
    ? 'border-[#D8D4CA] bg-[#FCFBF9] text-[#242321]'
    : 'border-slate-200 bg-white text-slate-900';

  return (
    <header className={`relative flex h-16 items-center justify-between border-b-2 px-6 z-30 transition-colors ${headerBg}`}>
      {/* Hairline Progress Indicator at bottom edge */}
      {isLoading && (
        <div className="absolute bottom-[-2px] left-0 right-0 h-[2.5px] overflow-hidden bg-blue-100/40 z-40">
          <div className="h-full bg-[#0050FF] animate-pulse w-full transition-all duration-300" />
        </div>
      )}

      {/* Left: Brand & Canvas Title & Undo/Redo & Project Hub */}
      <div className="flex items-center gap-2 max-w-[380px] lg:max-w-[460px]">
        <div className="flex items-center shrink-0 pr-0.5">
          <Logo className="h-5 w-auto" />
        </div>
        <div className={`h-5 w-[2px] shrink-0 ${
          isDark ? 'bg-[#252730]' : isMono ? 'bg-[#D8D4CA]' : 'bg-slate-200'
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
              className={`rounded-lg border-2 px-2 py-0.5 text-sm font-semibold outline-none w-44 ${
                isDark
                  ? 'border-blue-500/50 bg-[#1C1E26] text-white'
                  : isMono
                  ? 'border-[#242321] bg-[#EFECE4] text-[#242321]'
                  : 'border-indigo-400 bg-indigo-50/50 text-slate-900'
              }`}
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
              className={`group flex items-center gap-1 rounded-lg px-2 py-1 transition min-w-0 cursor-pointer ${
                isDark ? 'hover:bg-[#1E202B]' : isMono ? 'hover:bg-[#EFECE4]' : 'hover:bg-slate-100'
              }`}
            >
              <h1 className={`text-sm font-semibold truncate max-w-[110px] lg:max-w-[160px] ${
                isDark ? 'text-[#E2E4E9]' : isMono ? 'text-[#242321]' : 'text-slate-800'
              }`}>
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
              className={`flex items-center justify-center h-6 w-6 rounded-md transition shrink-0 cursor-pointer ${
                isDark ? 'hover:bg-[#1E202B] text-slate-400 hover:text-white' : isMono ? 'hover:bg-[#EFECE4] text-slate-600 hover:text-slate-900' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
              }`}
            >
              <MingIcon name="down_line" size={14} />
            </button>
          </div>
        )}

        {/* Undo / Redo Buttons */}
        <div className={`flex items-center gap-0.5 border-l-2 pl-1.5 shrink-0 ${
          isDark ? 'border-[#252730]' : isMono ? 'border-[#D8D4CA]' : 'border-slate-200'
        }`}>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z / Cmd+Z)"
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-transparent ${
              isDark ? 'text-slate-300 hover:bg-[#1E202B]' : isMono ? 'text-[#242321] hover:bg-[#EFECE4]' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MingIcon name="back_line" size={16} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z / Cmd+Shift+Z or Ctrl+Y)"
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-transparent ${
              isDark ? 'text-slate-300 hover:bg-[#1E202B]' : isMono ? 'text-[#242321] hover:bg-[#EFECE4]' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MingIcon name="forward_line" size={16} />
          </button>
        </div>
      </div>

      {/* Center: Spotlight Search Trigger & Dynamic Status Capsule */}
      <div className="hidden md:flex items-center gap-2">
        {isLoading && activeTask && (
          <div
            className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold border-2 transition-all ${
              isDark
                ? 'bg-[#181920] border-[#0050FF]/60 text-blue-300'
                : isMono
                ? 'bg-[#ECEAE4] border-[#242321] text-[#242321]'
                : 'bg-blue-50 border-blue-200 text-[#0050FF]'
            }`}
          >
            <MingIcon name="loading_3_line" size={14} className="animate-spin text-[#0050FF] shrink-0" />
            <span className="truncate max-w-[200px] lg:max-w-[300px]">{activeTask.label}</span>
          </div>
        )}

        <button
          type="button"
          onClick={onOpenSearch}
          className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold border-2 transition-all cursor-pointer ${
            isDark
              ? 'bg-[#181920] border-[#282A36] text-[#8C90A0] hover:text-white hover:border-[#3E4254]'
              : isMono
              ? 'bg-[#FCFBF9] border-[#D8D4CA] text-[#78756D] hover:text-[#242321] hover:border-[#A8A49A]'
              : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
          title="Spotlight Search (Cmd+K / Cmd+F)"
        >
          <MingIcon name="search_line" size={14} />
          <span>Search cards...</span>
          <kbd
            className={`rounded px-1.5 py-0.5 text-[10px] font-bold border ${
              isDark
                ? 'bg-[#22242D] border-[#2E3140] text-slate-400'
                : isMono
                ? 'bg-[#ECEAE4] border-[#D8D4CA] text-[#78756D]'
                : 'bg-white border-slate-200 text-slate-500 shadow-2xs'
            }`}
          >
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Theme Switcher, Shortcuts, & Panel View Toggles */}
      <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
        {/* Help / Shortcuts Button */}
        <button
          type="button"
          onClick={onOpenShortcuts}
          className={`flex h-8 w-8 items-center justify-center rounded-xl border-2 transition-all cursor-pointer ${
            theme === 'dark'
              ? 'bg-[#181920] border-[#282A36] text-[#8C90A0] hover:text-white hover:bg-[#22242D]'
              : theme === 'mono'
              ? 'bg-[#FCFBF9] border-[#D8D4CA] text-[#78756D] hover:text-[#242321] hover:bg-[#EAE7DF]'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
          title="Keyboard Shortcuts Cheat Sheet (?)"
        >
          <MingIcon name="question_line" size={16} />
        </button>

        {/* 3-Mode Theme Switcher */}
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100/80 p-0.5 shrink-0">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
              theme === 'light'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Light Mode (Default Colorful)"
          >
            <MingIcon name="sun_line" size={13} />
            <span className="hidden sm:inline whitespace-nowrap">Light</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('mono')}
            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
              theme === 'mono'
                ? 'bg-white text-blue-600 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Monochrome Light (Black & White + Scriffle Blue)"
          >
            <MingIcon name="contrast_2_line" size={13} />
            <span className="hidden sm:inline whitespace-nowrap">Mono</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
              theme === 'dark'
                ? 'bg-black text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Monochrome Dark (Pure Black & White)"
          >
            <MingIcon name="moon_line" size={13} />
            <span className="hidden sm:inline whitespace-nowrap">Dark</span>
          </button>
        </div>

        <button
          onClick={onToggleControls}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border-2 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            isControlsOpen
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
          title="Toggle Control Panel"
        >
          <MingIcon name="layout_left_line" size={16} />
          <span className="whitespace-nowrap">Controls</span>
        </button>

        <button
          onClick={onToggleFeed}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border-2 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            isFeedOpen
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
          title="Toggle Right Activity Feed Sidebar"
        >
          <MingIcon name="layout_right_line" size={16} />
          <span className="whitespace-nowrap">Feed</span>
        </button>
      </div>
    </header>
  );
};
