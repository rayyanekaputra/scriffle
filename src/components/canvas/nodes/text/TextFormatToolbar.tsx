'use client';

import React from 'react';
import { MingIcon } from '@/components/ui/MingIcon';
import { useTheme } from '@/context/ThemeContext';
import {
  TextFontSize,
  TextAlignment,
  TextHighlightColor,
  TextContainerStyle,
} from '@/types/canvas';

interface TextFormatToolbarProps {
  fontSize: TextFontSize;
  align: TextAlignment;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  highlight: TextHighlightColor;
  containerStyle: TextContainerStyle;
  onChangeFontSize: (size: TextFontSize) => void;
  onChangeAlign: (align: TextAlignment) => void;
  onToggleBold: () => void;
  onToggleItalic: () => void;
  onToggleUnderline: () => void;
  onToggleStrike: () => void;
  onChangeHighlight: (hl: TextHighlightColor) => void;
  onChangeContainerStyle: (style: TextContainerStyle) => void;
  onDelete?: () => void;
}

const HIGHLIGHT_OPTIONS: Array<{ key: TextHighlightColor; label: string; bg: string }> = [
  { key: 'none', label: 'None', bg: 'bg-transparent border border-slate-300 dark:border-slate-600' },
  { key: 'yellow', label: 'Yellow', bg: 'bg-[#FEF08A]' },
  { key: 'mint', label: 'Mint', bg: 'bg-[#A7F3D0]' },
  { key: 'coral', label: 'Coral', bg: 'bg-[#FECDD3]' },
  { key: 'purple', label: 'Purple', bg: 'bg-[#E9D5FF]' },
];

export const TextFormatToolbar: React.FC<TextFormatToolbarProps> = ({
  fontSize,
  align,
  bold,
  italic,
  underline,
  strike,
  highlight,
  containerStyle,
  onChangeFontSize,
  onChangeAlign,
  onToggleBold,
  onToggleItalic,
  onToggleUnderline,
  onToggleStrike,
  onChangeHighlight,
  onChangeContainerStyle,
  onDelete,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isMono = theme === 'mono';

  // Normalize font scale key
  const normalizedSize: 'title' | 'header' | 'body' | 'caption' =
    fontSize === 'large' || fontSize === 'title'
      ? 'title'
      : fontSize === 'header'
      ? 'header'
      : fontSize === 'small' || fontSize === 'caption'
      ? 'caption'
      : 'body';

  const toolbarBg = isDark
    ? 'bg-[#181920]/95 border-[#282A36] text-[#E2E4E9] shadow-2xl'
    : isMono
    ? 'bg-[#FCFBF9]/95 border-[#D8D4CA] text-[#242321] shadow-2xl'
    : 'bg-white/95 border-slate-300 text-slate-800 shadow-2xl';

  const btnHover = isDark
    ? 'hover:bg-[#252836] text-[#A6ACB8] hover:text-white'
    : isMono
    ? 'hover:bg-[#ECEAE4] text-[#78756D] hover:text-[#242321]'
    : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900';

  const btnActive = isDark
    ? 'bg-[#2E3140] text-white'
    : isMono
    ? 'bg-[#242321] text-white'
    : 'bg-slate-900 text-white';

  const dividerClass = isDark ? 'bg-[#282A36]' : isMono ? 'bg-[#D8D4CA]' : 'bg-slate-200';

  return (
    <div
      className={`nodrag nowheel pointer-events-auto absolute -top-13 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 rounded-2xl border-2 p-1 backdrop-blur-md transition-all duration-150 select-none whitespace-nowrap ${toolbarBg}`}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {/* 1. Typography Scale Selector */}
      <div className={`flex items-center rounded-xl p-0.5 border ${
        isDark ? 'border-[#2A2C38] bg-[#121318]' : isMono ? 'border-[#E2DFD6] bg-[#ECEAE4]/50' : 'border-slate-200 bg-slate-100/70'
      }`}>
        <button
          type="button"
          onClick={() => onChangeFontSize('title')}
          title="Title scale (H1 - 32px)"
          className={`rounded-lg px-2 py-1 text-xs font-bold transition-all cursor-pointer ${
            normalizedSize === 'title' ? btnActive : btnHover
          }`}
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => onChangeFontSize('header')}
          title="Header scale (H2 - 22px)"
          className={`rounded-lg px-2 py-1 text-xs font-bold transition-all cursor-pointer ${
            normalizedSize === 'header' ? btnActive : btnHover
          }`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => onChangeFontSize('body')}
          title="Body scale (14px)"
          className={`rounded-lg px-2 py-1 text-xs font-bold transition-all cursor-pointer ${
            normalizedSize === 'body' ? btnActive : btnHover
          }`}
        >
          Body
        </button>
        <button
          type="button"
          onClick={() => onChangeFontSize('caption')}
          title="Caption / Note scale (11px)"
          className={`rounded-lg px-2 py-1 text-[11px] font-bold transition-all cursor-pointer ${
            normalizedSize === 'caption' ? btnActive : btnHover
          }`}
        >
          Note
        </button>
      </div>

      <div className={`h-5 w-[1.5px] mx-0.5 shrink-0 ${dividerClass}`} />

      {/* 2. Text Formatting (Bold, Italic, Underline, Strike) */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={onToggleBold}
          title="Bold"
          className={`flex h-7 w-7 items-center justify-center rounded-lg font-bold text-xs transition cursor-pointer ${
            bold ? btnActive : btnHover
          }`}
        >
          B
        </button>
        <button
          type="button"
          onClick={onToggleItalic}
          title="Italic"
          className={`flex h-7 w-7 items-center justify-center rounded-lg italic text-xs transition cursor-pointer ${
            italic ? btnActive : btnHover
          }`}
        >
          I
        </button>
        <button
          type="button"
          onClick={onToggleUnderline}
          title="Underline"
          className={`flex h-7 w-7 items-center justify-center rounded-lg underline text-xs transition cursor-pointer ${
            underline ? btnActive : btnHover
          }`}
        >
          U
        </button>
        <button
          type="button"
          onClick={onToggleStrike}
          title="Strikethrough"
          className={`flex h-7 w-7 items-center justify-center rounded-lg line-through text-xs transition cursor-pointer ${
            strike ? btnActive : btnHover
          }`}
        >
          S
        </button>
      </div>

      <div className={`h-5 w-[1.5px] mx-0.5 shrink-0 ${dividerClass}`} />

      {/* 3. Text Alignment */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => onChangeAlign('left')}
          title="Align Left"
          className={`flex h-7 w-7 items-center justify-center rounded-lg transition cursor-pointer ${
            align === 'left' ? btnActive : btnHover
          }`}
        >
          <MingIcon name="align_left_line" size={14} />
        </button>
        <button
          type="button"
          onClick={() => onChangeAlign('center')}
          title="Align Center"
          className={`flex h-7 w-7 items-center justify-center rounded-lg transition cursor-pointer ${
            align === 'center' ? btnActive : btnHover
          }`}
        >
          <MingIcon name="align_center_line" size={14} />
        </button>
        <button
          type="button"
          onClick={() => onChangeAlign('right')}
          title="Align Right"
          className={`flex h-7 w-7 items-center justify-center rounded-lg transition cursor-pointer ${
            align === 'right' ? btnActive : btnHover
          }`}
        >
          <MingIcon name="align_right_line" size={14} />
        </button>
      </div>

      <div className={`h-5 w-[1.5px] mx-0.5 shrink-0 ${dividerClass}`} />

      {/* 4. Marker Highlighter Colors */}
      <div className="flex items-center gap-1 px-1">
        {HIGHLIGHT_OPTIONS.map((opt) => {
          const isSelected = (highlight || 'none') === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onChangeHighlight(opt.key)}
              title={`Highlight: ${opt.label}`}
              className={`h-4 w-4 rounded-full ${opt.bg} transition-all cursor-pointer ${
                isSelected ? 'scale-125 ring-2 ring-slate-800 dark:ring-white' : 'hover:scale-110 opacity-80 hover:opacity-100'
              }`}
            />
          );
        })}
      </div>

      <div className={`h-5 w-[1.5px] mx-0.5 shrink-0 ${dividerClass}`} />

      {/* 5. Container Style Toggle (Plain vs Callout vs Card) */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() =>
            onChangeContainerStyle(
              containerStyle === 'callout' ? 'card' : containerStyle === 'card' ? 'plain' : 'callout'
            )
          }
          title={`Container Style: ${containerStyle || 'plain'} (Click to cycle Plain / Callout / Card)`}
          className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition cursor-pointer ${
            containerStyle === 'callout' || containerStyle === 'card' ? btnActive : btnHover
          }`}
        >
          <MingIcon
            name={
              containerStyle === 'callout'
                ? 'chat_4_line'
                : containerStyle === 'card'
                ? 'square_line'
                : 'text_2_line'
            }
            size={14}
          />
          <span className="capitalize">{containerStyle || 'plain'}</span>
        </button>
      </div>

      {onDelete && (
        <>
          <div className={`h-5 w-[1.5px] mx-0.5 shrink-0 ${dividerClass}`} />
          <button
            type="button"
            onClick={onDelete}
            title="Delete text"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 transition cursor-pointer"
          >
            <MingIcon name="delete_2_line" size={15} />
          </button>
        </>
      )}
    </div>
  );
};
