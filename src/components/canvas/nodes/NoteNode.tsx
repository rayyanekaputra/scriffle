'use client';

import React, { memo, useState, useEffect, useRef } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { NoteConfig } from '@/types/canvas';
import { MingIcon } from '@/components/ui/MingIcon';

const COLOR_STYLES = {
  yellow: 'bg-[#FEF9C3] border-[#FACC15] text-amber-950',
  mint: 'bg-[#DCFCE7] border-[#4ADE80] text-emerald-950',
  pink: 'bg-[#FFE4E6] border-[#FB7185] text-rose-950',
  blue: 'bg-[#E0F2FE] border-[#38BDF8] text-sky-950',
  purple: 'bg-[#F3E8FF] border-[#C084FC] text-purple-950',
};

export const NoteNode = memo(({ id, data, selected }: NodeProps) => {
  const config = (data.config || {}) as NoteConfig;
  const state = (data.state || {}) as any;
  const isPassed = state.status === 'passed';
  const colorKey = config.color || 'yellow';
  const colorClass = COLOR_STYLES[colorKey] || COLOR_STYLES.yellow;

  const [content, setContent] = useState(config.content || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setContent(config.content || '');
  }, [config.content]);

  const handleBlur = async () => {
    if (content !== config.content) {
      try {
        await fetch(`/api/canvas/nodes/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            config: {
              ...config,
              content,
            },
          }),
        });
      } catch (err) {
        console.error('Failed to update note content:', err);
      }
    }
  };

  return (
    <div
      className={`relative w-72 rounded-2xl border-2 p-4 transition-all duration-150 ${colorClass} ${
        selected ? 'ring-3 ring-[#0050FF]/30' : ''
      }`}
    >
      {/* Tape decoration */}
      <div className="flat-tape" />

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3.5 !w-3.5 !rounded-full !border-2 !border-white !bg-[#0050FF]"
      />

      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-black/10 pt-1">
        <div className="flex items-center gap-1.5">
          <MingIcon name="quill_pen_line" size={16} />
          <h3 className="text-xs font-bold opacity-90">Research Note</h3>
        </div>

        {isPassed && (
          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold border border-black/10 flex items-center gap-1">
            <MingIcon name="sparkles_line" size={12} /> Updated
          </span>
        )}
      </div>

      {/* Inline Direct Editable Note Textarea */}
      <div className="mt-2.5">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleBlur}
          placeholder="Click here to type note commentary directly..."
          rows={3}
          className="w-full resize-none bg-transparent text-xs font-medium leading-relaxed text-inherit placeholder:opacity-50 focus:outline-none nodrag nowheel"
        />
      </div>
    </div>
  );
});

NoteNode.displayName = 'NoteNode';
