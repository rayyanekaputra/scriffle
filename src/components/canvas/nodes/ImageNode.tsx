'use client';

import React, { memo } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import { ImageConfig } from '@/types/canvas';

export const ImageNode = memo(({ id, data, selected }: NodeProps) => {
  const config = (data.config || {}) as ImageConfig;
  const isTransparent = config.isTransparent ?? true;

  const handleResizeEnd = async (_event: any, params: { width: number; height: number }) => {
    try {
      await fetch(`/api/canvas/nodes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            ...config,
            width: params.width,
            height: params.height,
          },
        }),
      });
    } catch (err) {
      console.error('Failed to update image size:', err);
    }
  };

  return (
    <div
      className={`group relative transition-all ${
        isTransparent ? 'bg-transparent' : 'rounded-2xl border-2 border-slate-300 bg-white p-2'
      } ${selected ? 'ring-2 ring-[#0050FF]/40 rounded-xl' : ''}`}
      style={{
        width: config.width ? `${config.width}px` : 'auto',
        height: config.height ? `${config.height}px` : 'auto',
      }}
    >
      {/* Interactive On-Canvas Node Resizer with Handles */}
      <NodeResizer
        isVisible={selected}
        minWidth={60}
        minHeight={60}
        keepAspectRatio={true}
        onResizeEnd={handleResizeEnd}
        lineClassName="!border-[#0050FF]"
        handleClassName="!h-3 !w-3 !rounded-full !border-2 !border-white !bg-[#0050FF]"
      />

      {config.url ? (
        <img
          src={config.url}
          alt={config.caption || 'Canvas graphic asset'}
          className="h-full w-full select-none object-contain pointer-events-none"
          style={{
            maxWidth: config.width ? '100%' : '320px',
            maxHeight: config.height ? '100%' : '320px',
          }}
          draggable={false}
        />
      ) : (
        <div className="flex h-32 w-48 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400 font-medium">
          No image provided
        </div>
      )}

      {config.caption && (
        <div className="mt-1 text-center text-[11px] font-semibold text-slate-600 bg-white/80 rounded-md px-1 py-0.5">
          {config.caption}
        </div>
      )}
    </div>
  );
});

ImageNode.displayName = 'ImageNode';
