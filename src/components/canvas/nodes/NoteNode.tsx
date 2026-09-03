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

const COLOR_OPTIONS: Array<'yellow' | 'mint' | 'pink' | 'blue' | 'purple'> = [
  'yellow',
  'mint',
  'pink',
  'blue',
  'purple',
];

export const NoteNode = memo(({ id, data, selected }: NodeProps) => {
  const config = (data.config || {}) as NoteConfig;
  const state = (data.state || {}) as any;
  const isPassed = state.status === 'passed';
  const colorKey = config.color || 'yellow';
  const colorClass = COLOR_STYLES[colorKey] || COLOR_STYLES.yellow;

  const [content, setContent] = useState(config.content || '');
  const [currentColor, setCurrentColor] = useState(colorKey);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setContent(config.content || '');
  }, [config.content]);

  useEffect(() => {
    setCurrentColor(config.color || 'yellow');
  }, [config.color]);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(72, textareaRef.current.scrollHeight)}px`;
    }
  }, [content]);

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
              color: currentColor,
            },
          }),
        });
      } catch (err) {
        console.error('Failed to update note content:', err);
      }
    }
  };

  const handleColorChange = async (newColor: 'yellow' | 'mint' | 'pink' | 'blue' | 'purple') => {
    setCurrentColor(newColor);
    try {
      await fetch(`/api/canvas/nodes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            ...config,
            content,
            color: newColor,
          },
        }),
      });
    } catch (err) {
      console.error('Failed to update note color:', err);
    }
  };

  return (
    <div
      className={`group relative w-72 rounded-2xl border-2 p-4 transition-all duration-150 ${
        COLOR_STYLES[currentColor] || COLOR_STYLES.yellow
      } ${selected ? 'ring-3 ring-slate-900/30 scale-[1.01]' : 'hover:scale-[1.005]'}`}
    >
      {/* Tape decoration */}
      <div className="flat-tape" />

      {/* 4-Sided Multi-Directional Handles (Connect from/to any side) */}
      <Handle
        type="target"
        id="target-top"
        position={Position.Top}
        className="!h-3 !w-3 !rounded-full !border-2 !border-white !bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="source"
        id="source-top"
        position={Position.Top}
        className="!h-3 !w-3 !rounded-full !border-2 !border-white !bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
      />

      <Handle
        type="target"
        id="target-left"
        position={Position.Left}
        className="!h-3.5 !w-3.5 !rounded-full !border-2 !border-white !bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="source"
        id="source-left"
        position={Position.Left}
        className="!h-3.5 !w-3.5 !rounded-full !border-2 !border-white !bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
      />

      <Handle
        type="target"
        id="target-right"
        position={Position.Right}
        className="!h-3.5 !w-3.5 !rounded-full !border-2 !border-white !bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="source"
        id="source-right"
        position={Position.Right}
        className="!h-3.5 !w-3.5 !rounded-full !border-2 !border-white !bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
      />

      <Handle
        type="target"
        id="target-bottom"
        position={Position.Bottom}
        className="!h-3 !w-3 !rounded-full !border-2 !border-white !bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="source"
        id="source-bottom"
        position={Position.Bottom}
        className="!h-3 !w-3 !rounded-full !border-2 !border-white !bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
      />

      {/* Header with Quick Color Palette & Update Badge */}
      <div className="flex items-center justify-between pb-2 border-b border-black/10 pt-1">
        <div className="flex items-center gap-1.5 opacity-60">
          <MingIcon name="quill_pen_line" size={14} />
          <span className="text-[11px] font-bold">Note</span>
        </div>

        {/* Color Switcher Dots */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {COLOR_OPTIONS.map((c) => {
            const dotBg = {
              yellow: 'bg-amber-300',
              mint: 'bg-emerald-300',
              pink: 'bg-rose-300',
              blue: 'bg-sky-300',
              purple: 'bg-purple-300',
            }[c];
            return (
              <button
                key={c}
                type="button"
                onClick={() => handleColorChange(c)}
                className={`h-3 w-3 rounded-full border border-black/20 ${dotBg} ${
                  currentColor === c ? 'scale-125 ring-1 ring-black/40' : 'hover:scale-110'
                } transition-all`}
              />
            );
          })}
        </div>

        {isPassed && (
          <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold border border-black/10 flex items-center gap-1">
            <MingIcon name="sparkles_line" size={12} /> Live
          </span>
        )}
      </div>

      {/* Freeform Direct Editable Textarea */}
      <div className="mt-2.5">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleBlur}
          placeholder="Write your research ideas, market notes, or hypotheses..."
          rows={3}
          className="w-full resize-none bg-transparent text-sm font-medium leading-relaxed text-inherit placeholder:opacity-40 focus:outline-none nodrag nowheel"
        />
      </div>
    </div>
  );
});

NoteNode.displayName = 'NoteNode';
