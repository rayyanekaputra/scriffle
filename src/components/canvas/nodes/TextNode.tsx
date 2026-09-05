'use client';

import React, { memo, useState, useEffect, useRef } from 'react';
import { NodeProps } from '@xyflow/react';
import { TextConfig } from '@/types/canvas';
import { useTheme } from '@/context/ThemeContext';

export const TextNode = memo(({ id, data, selected }: NodeProps) => {
  const { theme } = useTheme();
  const config = (data.config || {}) as TextConfig;
  const [text, setText] = useState(config.text || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isDark = theme === 'dark';
  const isMono = theme === 'mono';

  const fontSize = config.fontSize || 'medium';
  const sizeClass =
    fontSize === 'large' ? 'text-xl font-bold' : fontSize === 'small' ? 'text-xs' : 'text-sm font-medium';

  useEffect(() => {
    setText(config.text || '');
  }, [config.text]);

  const handleBlur = async () => {
    if (text !== config.text) {
      try {
        await fetch(`/api/canvas/nodes/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            config: {
              ...config,
              text,
            },
          }),
        });
      } catch (err) {
        console.error('Failed to update text node:', err);
      }
    }
  };

  const selectedClass = isDark
    ? 'border-2 border-dashed border-[#8E95A5] bg-white/5'
    : isMono
    ? 'border-2 border-dashed border-[#242321] bg-black/5'
    : 'border-2 border-dashed border-[#0050FF] bg-blue-50/40';

  const textColor = isDark
    ? 'text-[#E2E4E9] placeholder:text-[#5A5D6E]'
    : isMono
    ? 'text-[#242321] placeholder:text-[#8C8980]'
    : 'text-slate-800 placeholder:text-slate-400';

  return (
    <div
      className={`min-w-[140px] max-w-[400px] rounded-xl p-1.5 transition-all ${
        selected ? selectedClass : isDark ? 'border border-transparent hover:border-[#252732]' : isMono ? 'border border-transparent hover:border-[#D1CEC4]' : 'border border-transparent hover:border-slate-300'
      }`}
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        placeholder="Type text directly on canvas..."
        rows={2}
        className={`w-full resize-none bg-transparent ${sizeClass} ${textColor} leading-relaxed focus:outline-none nodrag nowheel`}
      />
    </div>
  );
});

TextNode.displayName = 'TextNode';
