'use client';

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { TextConfig } from '@/types/canvas';

export const TextNode = memo(({ data, selected }: NodeProps) => {
  const config = (data.config || {}) as TextConfig;
  const fontSize = config.fontSize || 'medium';
  const sizeClass =
    fontSize === 'large' ? 'text-xl font-bold' : fontSize === 'small' ? 'text-xs' : 'text-sm font-medium';

  return (
    <div
      className={`min-w-[120px] max-w-[320px] rounded-xl p-2 transition-all ${
        selected ? 'border-2 border-dashed border-[#0050FF] bg-blue-50/50' : 'border border-transparent'
      }`}
    >
      <div className={`${sizeClass} text-slate-800 leading-relaxed break-words`}>
        {config.text || 'Double click to edit text...'}
      </div>
    </div>
  );
});

TextNode.displayName = 'TextNode';
