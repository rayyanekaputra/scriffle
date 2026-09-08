'use client';

import React, { useState, useRef } from 'react';
import { CanvasToolMode, NodeType } from '@/types/canvas';
import { MingIcon } from '@/components/ui/MingIcon';
import { useTheme } from '@/context/ThemeContext';

interface NavToolbarProps {
  toolMode: CanvasToolMode;
  onSetToolMode: (mode: CanvasToolMode) => void;
  onAddNode: (type: NodeType, config?: any) => void;
}

export const NavToolbar: React.FC<NavToolbarProps> = ({
  toolMode,
  onSetToolMode,
  onAddNode,
}) => {
  const { theme } = useTheme();
  const [showStickerMenu, setShowStickerMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const isDark = theme === 'dark';
  const isMono = theme === 'mono';

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
      e.target.value = '';
    }
  };

  const handleGenericFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const sizeKB = Math.round(file.size / 1024);
      const sizeStr = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        onAddNode('file', {
          fileName: file.name,
          fileUrl: dataUrl,
          fileSize: sizeStr,
        });
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const containerBg = isDark
    ? 'bg-[#181920]/95 border-[#282A36] text-[#E2E4E9] shadow-2xl backdrop-blur-md'
    : isMono
    ? 'bg-[#FCFBF9]/95 border-[#D8D4CA] text-[#242321] shadow-2xl backdrop-blur-md'
    : 'bg-white/95 border-slate-200 text-slate-800 shadow-2xl backdrop-blur-md';

  const buttonClass = isDark
    ? 'text-[#BAC0D0] hover:text-white hover:bg-[#22242D] border-[#2E3140]'
    : isMono
    ? 'text-[#4A4741] hover:text-[#242321] hover:bg-[#EFECE4] border-[#D8D4CA]'
    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 border-slate-200';

  const activeModeClass = isDark
    ? 'bg-[#2E3140] text-white shadow-sm'
    : isMono
    ? 'bg-[#242321] text-white shadow-sm'
    : 'bg-slate-900 text-white shadow-sm';

  const inactiveModeClass = isDark
    ? 'text-[#8C90A0] hover:text-white hover:bg-[#22242D]'
    : isMono
    ? 'text-[#78756D] hover:text-[#242321] hover:bg-[#EAE7DF]'
    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100';

  const dividerClass = isDark ? 'bg-[#282A36]' : isMono ? 'bg-[#D8D4CA]' : 'bg-slate-200';

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center max-w-[calc(100vw-32px)]">
      <div
        className={`pointer-events-auto flex items-center gap-1 rounded-2xl border-2 p-1.5 transition-all duration-150 whitespace-nowrap overflow-x-auto select-none ${containerBg}`}
      >
        {/* Interaction Modes: Move (V) & Hand (H) */}
        <div className={`flex items-center shrink-0 rounded-xl border p-0.5 ${
          isDark ? 'border-[#2E3140] bg-[#121318]' : isMono ? 'border-[#D8D4CA] bg-[#EAE7DF]/50' : 'border-slate-200 bg-slate-100/70'
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
            <span className="whitespace-nowrap">Move</span>
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
            <span className="whitespace-nowrap">Hand</span>
          </button>
        </div>

        <div className={`h-6 w-[1.5px] mx-1 shrink-0 ${dividerClass}`} />

        {/* Note Element */}
        <button
          onClick={() => onAddNode('note', { color: 'yellow', content: 'Double click to write note...' })}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold whitespace-nowrap shrink-0 transition-all active:scale-95 cursor-pointer ${buttonClass}`}
        >
          <MingIcon name="quill_pen_line" size={16} />
          <span className="whitespace-nowrap">Sticky Note</span>
        </button>

        {/* Text Element */}
        <button
          onClick={() => onAddNode('text', { text: 'Freeform text headline...' })}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold whitespace-nowrap shrink-0 transition-all active:scale-95 cursor-pointer ${buttonClass}`}
        >
          <MingIcon name="font_size_line" size={16} />
          <span className="whitespace-nowrap">Text</span>
        </button>

        {/* Upload Image Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold whitespace-nowrap shrink-0 transition-all active:scale-95 cursor-pointer ${buttonClass}`}
        >
          <MingIcon name="pic_line" size={16} />
          <span className="whitespace-nowrap">Image</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* File Attachment Button */}
        <button
          onClick={() => docInputRef.current?.click()}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold whitespace-nowrap shrink-0 transition-all active:scale-95 cursor-pointer ${buttonClass}`}
        >
          <MingIcon name="attachment_line" size={16} />
          <span className="whitespace-nowrap">File</span>
        </button>
        <input
          ref={docInputRef}
          type="file"
          className="hidden"
          onChange={handleGenericFileUpload}
        />

        {/* Watcher Node */}
        <button
          onClick={() => onAddNode('watcher', { symbol: 'BBCA', metric: 'price_change', interval: 300 })}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold whitespace-nowrap shrink-0 transition-all active:scale-95 cursor-pointer ${buttonClass}`}
        >
          <MingIcon name="radar_line" size={16} />
          <span className="whitespace-nowrap">Watcher</span>
        </button>

        {/* Condition Node */}
        <button
          onClick={() => onAddNode('condition', { rule: 'price_change > 5' })}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold whitespace-nowrap shrink-0 transition-all active:scale-95 cursor-pointer ${buttonClass}`}
        >
          <MingIcon name="filter_line" size={16} />
          <span className="whitespace-nowrap">Condition</span>
        </button>

        {/* Sticker Dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowStickerMenu(!showStickerMenu)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold whitespace-nowrap shrink-0 transition-all active:scale-95 cursor-pointer ${buttonClass}`}
          >
            <MingIcon name="star_line" size={16} />
            <span className="whitespace-nowrap">Stickers</span>
          </button>

          {showStickerMenu && (
            <div className={`absolute bottom-full left-0 mb-2.5 z-50 w-44 rounded-2xl border-2 p-1.5 shadow-xl ${
              isDark ? 'bg-[#181920] border-[#282A36]' : isMono ? 'bg-[#FCFBF9] border-[#D8D4CA]' : 'bg-white border-slate-200'
            }`}>
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
                  className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    isDark
                      ? 'text-[#BAC0D0] hover:bg-[#22242D] hover:text-white'
                      : isMono
                      ? 'text-[#4A4741] hover:bg-[#EFECE4] hover:text-[#242321]'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <MingIcon name={s.icon} size={16} />
                  <span className="whitespace-nowrap">{s.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Alert Notification Node */}
        <button
          onClick={() => onAddNode('alert', { channel: 'ui' })}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold whitespace-nowrap shrink-0 transition-all active:scale-95 cursor-pointer ${buttonClass}`}
        >
          <MingIcon name="notification_line" size={16} />
          <span className="whitespace-nowrap">Alert</span>
        </button>

        {/* Automation Action Node */}
        <button
          onClick={() => onAddNode('action', { action: 'create_note' })}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold whitespace-nowrap shrink-0 transition-all active:scale-95 cursor-pointer ${buttonClass}`}
        >
          <MingIcon name="flash_line" size={16} />
          <span className="whitespace-nowrap">Action</span>
        </button>
      </div>
    </div>
  );
};
