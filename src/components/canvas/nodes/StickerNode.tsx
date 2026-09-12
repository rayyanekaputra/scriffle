'use client';

import React, { memo, useState, useRef, useEffect } from 'react';
import { NodeProps } from '@xyflow/react';
import { StickerConfig } from '@/types/canvas';
import { useTheme } from '@/context/ThemeContext';

// --- Color palette ---
type StickerColor = 'green' | 'red' | 'blue' | 'amber' | 'purple' | 'teal' | 'slate';

const COLOR_STYLES: Record<StickerColor, { bg: string; border: string; text: string; dot: string }> = {
  green:  { bg: 'bg-emerald-100', border: 'border-emerald-400', text: 'text-emerald-900', dot: 'bg-emerald-400' },
  red:    { bg: 'bg-rose-100',    border: 'border-rose-400',    text: 'text-rose-900',    dot: 'bg-rose-400' },
  blue:   { bg: 'bg-indigo-100',  border: 'border-indigo-400',  text: 'text-indigo-900',  dot: 'bg-indigo-400' },
  amber:  { bg: 'bg-amber-100',   border: 'border-amber-400',   text: 'text-amber-900',   dot: 'bg-amber-400' },
  purple: { bg: 'bg-purple-100',  border: 'border-purple-400',  text: 'text-purple-900',  dot: 'bg-purple-400' },
  teal:   { bg: 'bg-teal-100',    border: 'border-teal-400',    text: 'text-teal-900',    dot: 'bg-teal-400' },
  slate:  { bg: 'bg-slate-100',   border: 'border-slate-400',   text: 'text-slate-800',   dot: 'bg-slate-400' },
};

// Backward-compat: map old stickerType presets to new schema
const LEGACY_MAP: Record<string, { emoji: string; label: string; color: StickerColor }> = {
  bullish:  { emoji: '📈', label: 'Bullish',   color: 'green'  },
  bearish:  { emoji: '📉', label: 'Bearish',   color: 'red'    },
  rocket:   { emoji: '🚀', label: 'Breakout',  color: 'blue'   },
  target:   { emoji: '🎯', label: 'Target Hit',color: 'amber'  },
  star:     { emoji: '⭐', label: 'Top Pick',  color: 'purple' },
  warning:  { emoji: '⚠️', label: 'Volatility',color: 'amber'  },
  approved: { emoji: '✅', label: 'Approved',  color: 'teal'   },
};

const COLOR_ORDER: StickerColor[] = ['green', 'red', 'blue', 'amber', 'purple', 'teal', 'slate'];

export const StickerNode = memo(({ id, data, selected }: NodeProps) => {
  const { theme } = useTheme();
  const config = (data.config || {}) as StickerConfig;

  // Resolve initial values — fall back to legacy stickerType if new fields are absent
  const legacy = config.stickerType ? LEGACY_MAP[config.stickerType] : null;
  const initEmoji = config.emoji ?? legacy?.emoji ?? '🚀';
  const initLabel = config.label ?? legacy?.label ?? 'My Sticker';
  const initColor: StickerColor = (config.color as StickerColor) ?? legacy?.color ?? 'blue';

  const [emoji, setEmoji]         = useState(initEmoji);
  const [label, setLabel]         = useState(initLabel);
  const [color, setColor]         = useState<StickerColor>(initColor);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Close emoji picker on outside click
  useEffect(() => {
    if (!showEmojiPicker) return;
    const handleDown = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    window.addEventListener('mousedown', handleDown);
    return () => window.removeEventListener('mousedown', handleDown);
  }, [showEmojiPicker]);

  const selectQuickEmoji = (newEmoji: string) => {
    setEmoji(newEmoji);
    setShowEmojiPicker(false);
    persist({ emoji: newEmoji });
  };

  const isDark = theme === 'dark';
  const isMono = theme === 'mono';

  // --- Sync upstream config changes (e.g. on restore) ---
  useEffect(() => {
    const leg = config.stickerType ? LEGACY_MAP[config.stickerType] : null;
    setEmoji(config.emoji ?? leg?.emoji ?? '🚀');
    setLabel(config.label ?? leg?.label ?? 'My Sticker');
    setColor((config.color as StickerColor) ?? leg?.color ?? 'blue');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.emoji, config.label, config.color, config.stickerType]);

  // --- Persist to DB ---
  const persist = async (patch: Partial<StickerConfig>) => {
    try {
      await fetch(`/api/canvas/nodes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: { ...config, ...patch } }),
      });
    } catch (err) {
      console.error('Failed to save sticker config:', err);
    }
  };

  const [editingLabel, setEditingLabel] = useState(false);
  const [showPalette, setShowPalette]   = useState(false);
  const labelInputRef = useRef<HTMLInputElement>(null);

  // --- Commit label ---
  const commitLabel = () => {
    setEditingLabel(false);
    persist({ label });
  };

  useEffect(() => {
    if (editingLabel) {
      labelInputRef.current?.focus();
      labelInputRef.current?.select();
    }
  }, [editingLabel]);

  // --- Styles ---
  const cs = COLOR_STYLES[color];

  const containerStyle = isDark
    ? 'bg-[#1D1E26] border-[#2C2E3A] text-[#D8DAE2]'
    : isMono
    ? 'bg-[#FCFBF9] border-[#D1CEC4] text-[#242321]'
    : `${cs.bg} ${cs.border} ${cs.text}`;

  const selectRing = selected
    ? isDark
      ? 'ring-2 ring-[#8E95A5]/40 scale-105'
      : isMono
      ? 'ring-2 ring-[#1D4ED8]/40 scale-105'
      : 'ring-2 ring-[#0050FF]/40 scale-105'
    : 'hover:scale-102';

  return (
    <div
      className={`relative flex items-center gap-2 rounded-2xl border-2 px-3 py-2 transition-all group ${containerStyle} ${selectRing}`}
      style={{ minWidth: 120, maxWidth: 280 }}
    >
      {/* ── Emoji area with quick popover ── */}
      <div className="relative shrink-0">
        <button
          type="button"
          className="text-lg flex items-center justify-center p-0.5 rounded-lg hover:scale-125 transition-transform cursor-pointer select-none nodrag"
          title="Click to pick emoji"
          onClick={(e) => {
            e.stopPropagation();
            setShowEmojiPicker(!showEmojiPicker);
          }}
        >
          {emoji}
        </button>

        {/* Floating Quick Emoji Picker Popover */}
        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            className="absolute -top-32 -left-2 z-50 p-2 rounded-2xl border-2 shadow-2xl nodrag nowheel
              bg-white border-slate-300 dark:bg-[#181920] dark:border-[#2C2E3A] text-slate-800 dark:text-white"
            style={{ width: 196 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-4 gap-1">
              {[
                '🚀', '📈', '📉', '🎯',
                '⭐', '⚠️', '✅', '💎',
                '🐂', '🐻', '💰', '📊',
                '🔥', '💡', '⚡', '🏆',
              ].map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => selectQuickEmoji(em)}
                  className={`h-8 w-8 text-base flex items-center justify-center rounded-lg transition-all cursor-pointer ${
                    emoji === em
                      ? 'bg-blue-500/20 border-2 border-blue-500 scale-105'
                      : 'hover:bg-slate-100 dark:hover:bg-white/10 hover:scale-110'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Label area ── */}
      {editingLabel ? (
        <input
          ref={labelInputRef}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={commitLabel}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Escape') {
              e.preventDefault();
              commitLabel();
            }
          }}
          className="flex-1 min-w-0 text-xs font-bold bg-transparent border-0 outline-none nodrag"
          maxLength={40}
        />
      ) : (
        <span
          className="text-xs font-bold whitespace-nowrap truncate flex-1 cursor-text select-none"
          title="Click to edit label"
          onDoubleClick={(e) => { e.stopPropagation(); setEditingLabel(true); }}
        >
          {label}
        </span>
      )}

      {/* ── Color palette trigger (visible on hover/select) ── */}
      {(selected || showPalette) && (
        <div className="absolute -top-9 left-0 z-50 flex gap-1 rounded-xl border px-2 py-1.5 shadow-lg nodrag nowheel
          bg-white border-slate-200 dark:bg-[#1D1E26] dark:border-[#2C2E3A]">
          {COLOR_ORDER.map((c) => (
            <button
              key={c}
              title={c}
              onClick={(e) => {
                e.stopPropagation();
                setColor(c);
                setShowPalette(false);
                persist({ color: c });
              }}
              className={`w-4 h-4 rounded-full border-2 transition-transform hover:scale-125 cursor-pointer
                ${COLOR_STYLES[c].dot}
                ${c === color ? 'border-slate-700 scale-125' : 'border-transparent'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
});

StickerNode.displayName = 'StickerNode';
