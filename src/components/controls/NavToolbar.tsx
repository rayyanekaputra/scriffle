'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useReactFlow } from '@xyflow/react';
import { CanvasToolMode, NodeType } from '@/types/canvas';
import { MingIcon } from '@/components/ui/MingIcon';
import { useTheme } from '@/context/ThemeContext';

interface NavToolbarProps {
  toolMode: CanvasToolMode;
  onSetToolMode: (mode: CanvasToolMode) => void;
  onAddNode: (type: NodeType, config?: any, position?: { x: number; y: number }) => void;
  isLocked?: boolean;
}

export const NavToolbar: React.FC<NavToolbarProps> = ({
  toolMode,
  onSetToolMode,
  onAddNode,
  isLocked = false,
}) => {
  const [showInsertMenu, setShowInsertMenu] = useState(false);
  const [insertMenuPos, setInsertMenuPos] = useState<{ bottom: number; left: number } | null>(null);
  const insertWrapperRef = useRef<HTMLDivElement>(null);
  const insertPortalRef = useRef<HTMLDivElement>(null);

  const [showStickerMenu, setShowStickerMenu] = useState(false);
  const [stickerMenuPos, setStickerMenuPos] = useState<{ bottom: number; left: number } | null>(null);
  const stickerWrapperRef = useRef<HTMLDivElement>(null);
  const stickerPortalRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Close insert dropdown on outside click (checks both trigger wrapper and portal content)
  useEffect(() => {
    if (!showInsertMenu) return;
    const handleDown = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedTrigger = insertWrapperRef.current?.contains(target);
      const clickedMenu = insertPortalRef.current?.contains(target);
      if (!clickedTrigger && !clickedMenu) {
        setShowInsertMenu(false);
      }
    };
    window.addEventListener('mousedown', handleDown);
    return () => window.removeEventListener('mousedown', handleDown);
  }, [showInsertMenu]);

  // Close sticker dropdown on outside click (checks both trigger wrapper and portal content)
  useEffect(() => {
    if (!showStickerMenu) return;
    const handleDown = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedTrigger = stickerWrapperRef.current?.contains(target);
      const clickedMenu = stickerPortalRef.current?.contains(target);
      if (!clickedTrigger && !clickedMenu) {
        setShowStickerMenu(false);
      }
    };
    window.addEventListener('mousedown', handleDown);
    return () => window.removeEventListener('mousedown', handleDown);
  }, [showStickerMenu]);

  const toggleInsertMenu = () => {
    if (!showInsertMenu && insertWrapperRef.current) {
      const rect = insertWrapperRef.current.getBoundingClientRect();
      setInsertMenuPos({
        bottom: window.innerHeight - rect.top + 10,
        left: rect.left,
      });
    }
    setShowInsertMenu((prev) => !prev);
  };

  const toggleStickerMenu = () => {
    if (!showStickerMenu && stickerWrapperRef.current) {
      const rect = stickerWrapperRef.current.getBoundingClientRect();
      setStickerMenuPos({
        bottom: window.innerHeight - rect.top + 10,
        left: rect.left,
      });
    }
    setShowStickerMenu((prev) => !prev);
  };

  // Hook into ReactFlow to convert screen center to canvas flow coordinates
  let screenToFlowPosition: ((clientPos: { x: number; y: number }) => { x: number; y: number }) | null = null;
  try {
    const rf = useReactFlow();
    screenToFlowPosition = rf.screenToFlowPosition;
  } catch {
    // If rendered outside ReactFlowProvider, fallback gracefully
  }

  const handleAddAtCenter = (type: NodeType, config?: any) => {
    if (isLocked) return;
    let pos: { x: number; y: number } | undefined = undefined;
    if (typeof window !== 'undefined' && screenToFlowPosition) {
      try {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const flowCenter = screenToFlowPosition({ x: centerX, y: centerY });
        // Add slight random offset (±20px) so consecutive additions don't completely overlap
        pos = {
          x: Math.round(flowCenter.x - 80 + (Math.random() * 40 - 20)),
          y: Math.round(flowCenter.y - 40 + (Math.random() * 40 - 20)),
        };
      } catch (err) {
        console.warn('Could not calculate flow center:', err);
      }
    }
    onAddNode(type, config, pos);
  };



  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLocked) return;
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        handleAddAtCenter('image', {
          url: dataUrl,
          caption: file.name,
          isTransparent: file.type.includes('png'),
        });
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const handleGenericFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLocked) return;
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const sizeKB = Math.round(file.size / 1024);
      const sizeStr = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        handleAddAtCenter('file', {
          fileName: file.name,
          fileUrl: dataUrl,
          fileSize: sizeStr,
        });
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const { theme, activeCustomTheme } = useTheme();
  const isCustom = theme === 'custom';
  const isDark = theme === 'dark' || (isCustom && activeCustomTheme?.metadata.mode_base === 'dark');
  const isMono = theme === 'mono';

  const containerBg = isCustom && activeCustomTheme
    ? 'bg-[var(--custom-ui-surface)]/95 border-[var(--custom-ui-border)] text-[var(--custom-ui-text)] shadow-2xl backdrop-blur-md'
    : isDark
    ? 'bg-[#181920]/95 border-[#282A36] text-[#E2E4E9] shadow-2xl backdrop-blur-md'
    : isMono
    ? 'bg-[#FCFBF9]/95 border-[#D8D4CA] text-[#242321] shadow-2xl backdrop-blur-md'
    : 'bg-white/95 border-slate-200 text-slate-800 shadow-2xl backdrop-blur-md';

  const buttonClass = isCustom && activeCustomTheme
    ? 'text-[var(--custom-ui-text)] bg-transparent hover:bg-[var(--custom-ui-surface-muted)] border-[var(--custom-ui-border)] cursor-pointer'
    : isDark
    ? 'text-[#BAC0D0] hover:text-white hover:bg-[#22242D] border-[#2E3140] cursor-pointer'
    : isMono
    ? 'text-[#4A4741] hover:text-[#242321] hover:bg-[#EFECE4] border-[#D8D4CA] cursor-pointer'
    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 border-slate-200 cursor-pointer';

  const creationButtonClass = isLocked
    ? isDark
      ? 'opacity-35 cursor-not-allowed pointer-events-none text-[#8C90A0] border-[#2E3140]'
      : isMono
      ? 'opacity-35 cursor-not-allowed pointer-events-none text-[#78756D] border-[#D8D4CA]'
      : 'opacity-35 cursor-not-allowed pointer-events-none text-slate-400 border-slate-200'
    : buttonClass;

  const activeModeClass = isCustom && activeCustomTheme
    ? 'bg-[var(--custom-ui-primary)] text-white shadow-sm'
    : isDark
    ? 'bg-[#2E3140] text-white shadow-sm'
    : isMono
    ? 'bg-[#242321] text-white shadow-sm'
    : 'bg-slate-900 text-white shadow-sm';

  const inactiveModeClass = isCustom && activeCustomTheme
    ? 'text-[var(--custom-ui-text-muted)] bg-transparent hover:text-[var(--custom-ui-text)] hover:bg-[var(--custom-ui-surface-muted)]'
    : isDark
    ? 'text-[#8C90A0] hover:text-white hover:bg-[#22242D]'
    : isMono
    ? 'text-[#78756D] hover:text-[#242321] hover:bg-[#EAE7DF]'
    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100';

  const dividerClass = isCustom && activeCustomTheme
    ? 'bg-[var(--custom-ui-border)]'
    : isDark
    ? 'bg-[#282A36]'
    : isMono
    ? 'bg-[#D8D4CA]'
    : 'bg-slate-200';

  const dropdownMenuItemClass = isDark
    ? 'text-[#BAC0D0] hover:bg-[#22242D] hover:text-white'
    : isMono
    ? 'text-[#4A4741] hover:bg-[#EFECE4] hover:text-[#242321]'
    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900';

  const dropdownPanelClass = isDark
    ? 'bg-[#181920] border-[#282A36]'
    : isMono
    ? 'bg-[#FCFBF9] border-[#D8D4CA]'
    : 'bg-white border-slate-200';

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center max-w-[calc(100vw-32px)]">
      <div
        data-tour="nav-toolbar"
        className={`pointer-events-auto flex items-center gap-1 rounded-2xl border-2 p-1.5 transition-all duration-150 whitespace-nowrap overflow-visible select-none ${containerBg}`}
      >
        {/* Interaction Modes: Move (V) & Hand (H) */}
        <div className={`flex items-center shrink-0 rounded-xl border p-0.5 ${
          isCustom && activeCustomTheme
            ? 'border-[var(--custom-ui-border)] bg-transparent'
            : isDark
            ? 'border-[#2E3140] bg-[#121318]'
            : isMono
            ? 'border-[#D8D4CA] bg-[#EAE7DF]/50'
            : 'border-slate-200 bg-slate-100/70'
        }`}>
          <button
            type="button"
            onClick={() => onSetToolMode('select')}
            title="Move / Select Tool (V) - Click & drag elements, multi-select box"
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              toolMode === 'select' ? activeModeClass : inactiveModeClass
            }`}
          >
            <MingIcon name="cursor_line" size={15} />
            {toolMode === 'select' && <span className="whitespace-nowrap">Move</span>}
          </button>
          <button
            type="button"
            onClick={() => onSetToolMode('hand')}
            title="Hand Tool (H) - Pan & navigate canvas freely"
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              toolMode === 'hand' ? activeModeClass : inactiveModeClass
            }`}
          >
            <MingIcon name="hand_line" size={15} />
            {toolMode === 'hand' && <span className="whitespace-nowrap">Hand</span>}
          </button>
        </div>

        <div className={`h-6 w-[1.5px] mx-1 shrink-0 ${dividerClass}`} />

        {/* Screener Node */}
        <button
          onClick={() => handleAddAtCenter('screener', { query: 'top 5 banks by market cap', limit: 5 })}
          disabled={isLocked}
          title={isLocked ? 'Canvas is locked' : 'Add AI Screener'}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold whitespace-nowrap shrink-0 transition-all active:scale-95 ${creationButtonClass}`}
        >
          <MingIcon name="ai_line" size={16} />
          <span className="whitespace-nowrap">AI Screener</span>
        </button>

        {/* Watcher Node */}
        <button
          onClick={() => handleAddAtCenter('watcher', { symbol: '', metric: 'price_change', interval: 300 })}
          disabled={isLocked}
          title={isLocked ? 'Canvas is locked' : 'Add Watcher'}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold whitespace-nowrap shrink-0 transition-all active:scale-95 ${creationButtonClass}`}
        >
          <MingIcon name="radar_line" size={16} />
          <span className="whitespace-nowrap">Watcher</span>
        </button>

        {/* Condition Node */}
        <button
          onClick={() => handleAddAtCenter('condition', { rule: 'price_change > 5' })}
          disabled={isLocked}
          title={isLocked ? 'Canvas is locked' : 'Add Condition'}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold whitespace-nowrap shrink-0 transition-all active:scale-95 ${creationButtonClass}`}
        >
          <MingIcon name="filter_line" size={16} />
          <span className="whitespace-nowrap">Condition</span>
        </button>

        {/* Alert Notification Node */}
        <button
          onClick={() => handleAddAtCenter('alert', { channel: 'ui' })}
          disabled={isLocked}
          title={isLocked ? 'Canvas is locked' : 'Add Alert'}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold whitespace-nowrap shrink-0 transition-all active:scale-95 ${creationButtonClass}`}
        >
          <MingIcon name="notification_line" size={16} />
          <span className="whitespace-nowrap">Alert</span>
        </button>

        {/* Automation Action Node */}
        <button
          onClick={() => handleAddAtCenter('action', { action: 'create_note' })}
          disabled={isLocked}
          title={isLocked ? 'Canvas is locked' : 'Add Action'}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold whitespace-nowrap shrink-0 transition-all active:scale-95 ${creationButtonClass}`}
        >
          <MingIcon name="flash_line" size={16} />
          <span className="whitespace-nowrap">Action</span>
        </button>

        <div className={`h-6 w-[1.5px] mx-1 shrink-0 ${dividerClass}`} />

        {/* Insert Menu: Sticky Note, Text, Image, File (pill split-button) */}
        <div ref={insertWrapperRef} className="relative shrink-0 flex items-stretch h-[32px]">
          <button
            onClick={toggleInsertMenu}
            disabled={isLocked}
            title={isLocked ? 'Canvas is locked' : 'Insert element'}
            className={`flex items-center gap-1.5 rounded-l-full border-y border-l pl-3.5 pr-2.5 text-xs font-bold whitespace-nowrap shrink-0 transition-all active:scale-95 cursor-pointer ${creationButtonClass}`}
          >
            <MingIcon name="add_line" size={16} />
            <span className="whitespace-nowrap">Elements</span>
          </button>
          <button
            onClick={toggleInsertMenu}
            disabled={isLocked}
            className={`flex items-center justify-center rounded-r-full border pl-1.5 pr-2.5 text-xs font-bold shrink-0 transition-all active:scale-95 cursor-pointer ${creationButtonClass}`}
            title={isLocked ? 'Canvas is locked' : 'Insert element'}
          >
            <MingIcon name="down_line" size={13} />
          </button>

          {showInsertMenu && insertMenuPos && typeof document !== 'undefined' && createPortal(
            <div
              ref={insertPortalRef}
              style={{ position: 'fixed', bottom: insertMenuPos.bottom, left: insertMenuPos.left }}
              className={`z-50 w-48 rounded-2xl border-2 p-1.5 shadow-xl ${dropdownPanelClass}`}
            >
              <button
                onClick={() => {
                  handleAddAtCenter('note', { color: 'yellow', content: 'Double click to write note...' });
                  setShowInsertMenu(false);
                }}
                disabled={isLocked}
                className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${dropdownMenuItemClass}`}
              >
                <MingIcon name="quill_pen_line" size={16} />
                <span className="whitespace-nowrap">Sticky Note</span>
              </button>
              <button
                onClick={() => {
                  handleAddAtCenter('text', { text: 'Freeform text headline...' });
                  setShowInsertMenu(false);
                }}
                disabled={isLocked}
                className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${dropdownMenuItemClass}`}
              >
                <MingIcon name="font_size_line" size={16} />
                <span className="whitespace-nowrap">Text</span>
              </button>
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowInsertMenu(false);
                }}
                disabled={isLocked}
                className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${dropdownMenuItemClass}`}
              >
                <MingIcon name="pic_line" size={16} />
                <span className="whitespace-nowrap">Image</span>
              </button>
              <button
                onClick={() => {
                  docInputRef.current?.click();
                  setShowInsertMenu(false);
                }}
                disabled={isLocked}
                className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${dropdownMenuItemClass}`}
              >
                <MingIcon name="attachment_line" size={16} />
                <span className="whitespace-nowrap">File</span>
              </button>
            </div>,
            document.body
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
        <input
          ref={docInputRef}
          type="file"
          className="hidden"
          onChange={handleGenericFileUpload}
        />
        
        {/* Sticker Element & Dropdown Menu (pill split-button) */}
        <div ref={stickerWrapperRef} className="relative shrink-0 flex items-stretch h-[32px]">
          <button
            onClick={() => handleAddAtCenter('sticker', { emoji: '🚀', label: 'Breakout', color: 'blue' })}
            disabled={isLocked}
            className={`flex items-center gap-1.5 rounded-l-full border-y border-l pl-3.5 pr-2.5 text-xs font-bold whitespace-nowrap shrink-0 transition-all active:scale-95 cursor-pointer ${creationButtonClass}`}
            title={isLocked ? 'Canvas is locked' : 'Add Sticker'}
          >
            <MingIcon name="star_line" size={16} />
            <span className="whitespace-nowrap">Sticker</span>
          </button>
          <button
            onClick={toggleStickerMenu}
            disabled={isLocked}
            className={`flex items-center justify-center rounded-r-full border pl-1.5 pr-2.5 text-xs font-bold shrink-0 transition-all active:scale-95 cursor-pointer ${creationButtonClass}`}
            title={isLocked ? 'Canvas is locked' : 'Choose sticker preset'}
          >
            <MingIcon name="down_line" size={13} />
          </button>

          {showStickerMenu && stickerMenuPos && typeof document !== 'undefined' && createPortal(
            <div
              ref={stickerPortalRef}
              style={{ position: 'fixed', bottom: stickerMenuPos.bottom, left: stickerMenuPos.left }}
              className={`z-50 w-48 rounded-2xl border-2 p-1.5 shadow-xl ${dropdownPanelClass}`}
            >
              <p className={`px-2 py-1 text-xs font-semibold mb-0.5 ${isDark ? 'text-[#8C90A0]' : isMono ? 'text-[#78756D]' : 'text-slate-500'}`}>
                Stickers
              </p>
              {[
                { emoji: '🚀', label: 'Breakout',   color: 'blue'   },
                { emoji: '📈', label: 'Bullish',    color: 'green'  },
                { emoji: '📉', label: 'Bearish',    color: 'red'    },
                { emoji: '🎯', label: 'Target Hit', color: 'amber'  },
                { emoji: '⭐', label: 'Top Pick',   color: 'purple' },
                { emoji: '⚠️', label: 'Volatility', color: 'amber'  },
                { emoji: '✅', label: 'Approved',   color: 'teal'   },
                { emoji: '🏷️', label: 'My Badge',   color: 'slate'  },
              ].map((s) => (
                <button
                  key={s.emoji + s.label}
                  onClick={() => {
                    handleAddAtCenter('sticker', { emoji: s.emoji, label: s.label, color: s.color });
                    setShowStickerMenu(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${dropdownMenuItemClass}`}
                >
                  <span className="text-base leading-none">{s.emoji}</span>
                  <span className="whitespace-nowrap">{s.label}</span>
                </button>
              ))}
            </div>,
            document.body
          )}
        </div>
      </div>
    </div>
  );
};