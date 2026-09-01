'use client';

import React, { memo, useState, useEffect, useRef } from 'react';
import { NodeProps } from '@xyflow/react';
import { TextConfig } from '@/types/canvas';

export const TextNode = memo(({ id, data, selected }: NodeProps) => {
  const config = (data.config || {}) as TextConfig;
  const [text, setText] = useState(config.text || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  return (
    <div
      className={`min-w-[140px] max-w-[400px] rounded-xl p-1.5 transition-all ${
        selected ? 'border-2 border-dashed border-[#0050FF] bg-blue-50/40' : 'border border-transparent hover:border-slate-300'
      }`}
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        placeholder="Type text directly on canvas..."
        rows={2}
        className={`w-full resize-none bg-transparent ${sizeClass} text-slate-800 leading-relaxed placeholder:text-slate-400 focus:outline-none nodrag nowheel`}
      />
    </div>
  );
});

TextNode.displayName = 'TextNode';
