'use client';

import React, { memo, useState, useEffect, useRef } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import { ImageConfig } from '@/types/canvas';
import { MingIcon } from '@/components/ui/MingIcon';
import { useTheme } from '@/context/ThemeContext';

export const ImageNode = memo(({ id, data, selected }: NodeProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isMono = theme === 'mono';

  const config = (data.config || {}) as ImageConfig;
  const isTransparent = config.isTransparent ?? true;

  const [caption, setCaption] = useState(config.caption || '');
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const captionInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCaption(config.caption || '');
  }, [config.caption]);

  useEffect(() => {
    if (isEditingCaption && captionInputRef.current) {
      captionInputRef.current.focus();
      captionInputRef.current.select();
    }
  }, [isEditingCaption]);

  const persistConfig = async (patch: Partial<ImageConfig>) => {
    try {
      await fetch(`/api/canvas/nodes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            ...config,
            ...patch,
          },
        }),
      });
    } catch (err) {
      console.error('Failed to update image config:', err);
    }
  };

  const handleResizeEnd = async (_event: any, params: { width: number; height: number }) => {
    await persistConfig({
      width: params.width,
      height: params.height,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvt) => {
      const dataUrl = uploadEvt.target?.result as string;
      persistConfig({
        url: dataUrl,
        isTransparent: file.type.includes('png') || file.type.includes('svg') ? isTransparent : false,
      });
    };
    reader.readAsDataURL(file);
  };

  const commitCaption = () => {
    setIsEditingCaption(false);
    persistConfig({ caption });
  };

  const toggleTransparency = (e: React.MouseEvent) => {
    e.stopPropagation();
    persistConfig({ isTransparent: !isTransparent });
  };

  return (
    <div
      className={`group relative transition-all ${
        isTransparent
          ? 'bg-transparent'
          : isDark
          ? 'rounded-2xl border-2 border-[#282A36] bg-[#14151B] p-2'
          : isMono
          ? 'rounded-2xl border-2 border-[#D8D4CA] bg-[#FCFBF9] p-2'
          : 'rounded-2xl border-2 border-slate-300 bg-white p-2'
      } ${selected ? 'ring-2 ring-[#0050FF]/40 rounded-xl' : ''}`}
      style={{
        width: config.width ? `${config.width}px` : 'auto',
        height: config.height ? `${config.height}px` : 'auto',
      }}
    >
      {/* Hidden file input for image replacement */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Floating Action Controls on Hover / Selection */}
      <div
        className={`absolute -top-3.5 right-2 z-10 flex items-center gap-1 rounded-full border px-1.5 py-0.5 shadow-sm transition-opacity duration-150 ${
          selected
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 group-hover:opacity-100 pointer-events-auto'
        } ${
          isDark
            ? 'border-[#2E3140] bg-[#1E202A] text-slate-300'
            : isMono
            ? 'border-[#D8D4CA] bg-[#F4F3EF] text-[#242321]'
            : 'border-slate-300 bg-white text-slate-700'
        }`}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          title="Replace image"
          className="flex items-center gap-1 rounded-full p-1 text-[11px] font-bold hover:text-[#0050FF] transition cursor-pointer"
        >
          <MingIcon name="upload_2_line" size={13} />
        </button>

        <button
          type="button"
          onClick={toggleTransparency}
          title={isTransparent ? 'Switch to bordered card' : 'Switch to transparent'}
          className="flex items-center gap-1 rounded-full p-1 text-[11px] font-bold hover:text-[#0050FF] transition cursor-pointer"
        >
          <MingIcon name={isTransparent ? 'square_line' : 'ghost_line'} size={13} />
        </button>

        {!isEditingCaption && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingCaption(true);
            }}
            title="Edit caption"
            className="flex items-center gap-1 rounded-full p-1 text-[11px] font-bold hover:text-[#0050FF] transition cursor-pointer"
          >
            <MingIcon name="text_line" size={13} />
          </button>
        )}
      </div>

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
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`flex h-32 w-48 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition cursor-pointer ${
            isDark
              ? 'border-[#2C2E3A] bg-[#181920] text-slate-400 hover:border-[#8E95A5]'
              : isMono
              ? 'border-[#D8D4CA] bg-[#F4F3EF] text-[#78756D] hover:border-[#242321]'
              : 'border-slate-300 bg-slate-50 text-slate-500 hover:border-slate-400'
          }`}
        >
          <MingIcon name="pic_line" size={24} />
          <span className="text-xs font-semibold">Click to upload image</span>
        </button>
      )}

      {/* Inline Caption Bar */}
      {isEditingCaption ? (
        <div className="mt-1.5 px-0.5">
          <input
            ref={captionInputRef}
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            onBlur={commitCaption}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitCaption();
              if (e.key === 'Escape') {
                setCaption(config.caption || '');
                setIsEditingCaption(false);
              }
            }}
            placeholder="Type image caption..."
            className={`w-full text-center text-[11px] font-semibold rounded-md border px-2 py-1 focus:outline-none ${
              isDark
                ? 'border-[#3B3E52] bg-[#191A22] text-slate-200 focus:border-[#0050FF]'
                : isMono
                ? 'border-[#D8D4CA] bg-white text-[#242321] focus:border-[#242321]'
                : 'border-slate-300 bg-white text-slate-800 focus:border-[#0050FF]'
            }`}
          />
        </div>
      ) : (
        config.caption && (
          <div
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditingCaption(true);
            }}
            title="Double-click to edit caption"
            className={`mt-1 text-center text-[11px] font-semibold rounded-md px-1.5 py-0.5 select-none transition cursor-pointer ${
              isDark
                ? 'bg-[#191A22]/90 text-slate-300 hover:bg-[#191A22]'
                : isMono
                ? 'bg-[#F4F3EF]/90 text-[#242321] hover:bg-[#F4F3EF]'
                : 'bg-white/90 text-slate-700 hover:bg-white border border-slate-200'
            }`}
          >
            {config.caption}
          </div>
        )
      )}
    </div>
  );
});

ImageNode.displayName = 'ImageNode';
