'use client';

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { StickerConfig } from '@/types/canvas';
import { MingIcon } from '@/components/ui/MingIcon';
import { useTheme } from '@/context/ThemeContext';

const STICKER_META: Record<
  string,
  { label: string; icon: string; bg: string; text: string; border: string }
> = {
  bullish: {
    label: 'Bullish Momentum',
    icon: 'chart_line',
    bg: 'bg-emerald-100',
    text: 'text-emerald-900',
    border: 'border-emerald-400',
  },
  bearish: {
    label: 'Bearish Risk',
    icon: 'chart_line',
    bg: 'bg-rose-100',
    text: 'text-rose-900',
    border: 'border-rose-400',
  },
  rocket: {
    label: 'Breakout Ready',
    icon: 'rocket_line',
    bg: 'bg-indigo-100',
    text: 'text-indigo-900',
    border: 'border-indigo-400',
  },
  target: {
    label: 'Target Hit',
    icon: 'target_line',
    bg: 'bg-amber-100',
    text: 'text-amber-900',
    border: 'border-amber-400',
  },
  star: {
    label: 'Top Pick',
    icon: 'star_line',
    bg: 'bg-yellow-100',
    text: 'text-yellow-900',
    border: 'border-yellow-400',
  },
  warning: {
    label: 'High Volatility',
    icon: 'warning_line',
    bg: 'bg-orange-100',
    text: 'text-orange-900',
    border: 'border-orange-400',
  },
  approved: {
    label: 'Thesis Approved',
    icon: 'check_circle_line',
    bg: 'bg-teal-100',
    text: 'text-teal-900',
    border: 'border-teal-400',
  },
};

export const StickerNode = memo(({ data, selected }: NodeProps) => {
  const { theme } = useTheme();
  const config = (data.config || {}) as StickerConfig;
  const stickerType = config.stickerType || 'rocket';
  const meta = STICKER_META[stickerType] || STICKER_META.rocket;

  const isDark = theme === 'dark';
  const isMono = theme === 'mono';

  const styleClass = isDark
    ? 'bg-[#1D1E26] border-[#2C2E3A] text-[#D8DAE2]'
    : isMono
    ? 'bg-[#FCFBF9] border-[#D1CEC4] text-[#242321]'
    : `${meta.bg} ${meta.border} ${meta.text}`;

  const selectRing = isDark
    ? 'ring-2 ring-[#8E95A5]/40 scale-105'
    : isMono
    ? 'ring-2 ring-[#1D4ED8]/40 scale-105'
    : 'ring-2 ring-[#0050FF]/40 scale-105';

  return (
    <div
      className={`flex items-center gap-2 rounded-2xl border-2 px-3.5 py-2 transition-all cursor-grab active:cursor-grabbing ${styleClass} ${
        selected ? selectRing : 'hover:scale-102'
      }`}
    >
      <MingIcon name={meta.icon} size={20} className="shrink-0" />
      <span className="text-xs font-bold whitespace-nowrap">{meta.label}</span>
    </div>
  );
});

StickerNode.displayName = 'StickerNode';
