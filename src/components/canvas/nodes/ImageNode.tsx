'use client';

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { ImageConfig } from '@/types/canvas';

export const ImageNode = memo(({ data, selected }: NodeProps) => {
  const config = (data.config || {}) as ImageConfig;

  return (
    <div
      className={`relative rounded-2xl border-2 bg-white p-2 transition-all ${
        selected ? 'border-[#0050FF] ring-2 ring-[#0050FF]/20' : 'border-slate-300 hover:border-slate-400'
      }`}
    >
      {/* Tape */}
      <div className="flat-tape" />

      {config.url ? (
        <img
          src={config.url}
          alt={config.caption || 'Uploaded whiteboard asset'}
          className="max-h-64 max-w-xs rounded-xl object-contain"
        />
      ) : (
        <div className="flex h-32 w-48 items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-400 font-medium">
          No image provided
        </div>
      )}

      {config.caption && (
        <div className="mt-1.5 text-center text-[11px] font-medium text-slate-500">
          {config.caption}
        </div>
      )}
    </div>
  );
});

ImageNode.displayName = 'ImageNode';
