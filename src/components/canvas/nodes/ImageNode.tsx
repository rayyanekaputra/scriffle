'use client';

import React, { memo, useState, useEffect, useRef } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import { ImageConfig } from '@/types/canvas';
import { MingIcon } from '@/components/ui/MingIcon';
import { useTheme } from '@/context/ThemeContext';

// Memoized Image Subtree to avoid re-decoding / re-rendering on every resize frame
const ImageContent = memo(({
  url,
  caption,
  width,
  height,
  onDoubleClick,
}: {
  url?: string;
  caption?: string;
  width?: number;
  height?: number;
  onDoubleClick?: (e: React.MouseEvent) => void;
}) => {
  if (!url) return null;
  return (
    <img
      src={url}
      alt={caption || 'Canvas graphic asset'}
      onDoubleClick={onDoubleClick}
      title="Double-click to replace image"
      className="h-full w-full select-none object-contain cursor-pointer"
      style={{
        maxWidth: width ? '100%' : '320px',
        maxHeight: height ? '100%' : '320px',
      }}
      draggable={false}
    />
  );
});
ImageContent.displayName = 'ImageContent';

export const ImageNode = memo(({ id, data, selected }: NodeProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isMono = theme === 'mono';

  const config = (data.config || {}) as ImageConfig;
  const isTransparent = config.isTransparent ?? true;

  // Local live size state: source of truth during resize drag
  const [size, setSize] = useState<{ width?: number; height?: number }>({
    width: config.width,
    height: config.height,
  });
  const [isResizing, setIsResizing] = useState(false);
  const isResizingRef = useRef(false);

  const [caption, setCaption] = useState(config.caption || '');
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const captionInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync server config to local size only when not actively resizing
  useEffect(() => {
    if (!isResizingRef.current) {
      setSize({
        width: config.width,
        height: config.height,
      });
    }
  }, [config.width, config.height]);

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

  const handleResize = (_event: any, params: { width: number; height: number }) => {
    isResizingRef.current = true;
    setIsResizing(true);
    setSize({
      width: Math.round(params.width),
      height: Math.round(params.height),
    });
  };

  const handleResizeEnd = (_event: any, params: { width: number; height: number }) => {
    isResizingRef.current = false;
    setIsResizing(false);
    const newWidth = Math.round(params.width);
    const newHeight = Math.round(params.height);
    setSize({
      width: newWidth,
      height: newHeight,
    });
    // Persist once on resize end without awaiting network in resize path
    persistConfig({
      width: newWidth,
      height: newHeight,
    });
  };

  const handleResetDimensions = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSize({ width: undefined, height: undefined });
    await persistConfig({
      width: undefined,
      height: undefined,
    });
  };

  const processImageFile = (file: File) => {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file);
  };

  const handleCardDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOver(true);
    }
  };

  const handleCardDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleCardDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImageFile(file);
    }
  };

  const commitCaption = () => {
    setIsEditingCaption(false);
    persistConfig({ caption: caption.trim() });
  };

  const toggleTransparency = (e: React.MouseEvent) => {
    e.stopPropagation();
    persistConfig({ isTransparent: !isTransparent });
  };

  const hasCustomDimensions = Boolean(size.width || size.height || config.width || config.height);

  return (
    <div
      onDragOver={handleCardDragOver}
      onDragLeave={handleCardDragLeave}
      onDrop={handleCardDrop}
      className={`group relative ${
        isResizing ? 'transition-none select-none' : 'transition-colors duration-150'
      } ${
        isDraggingOver
          ? 'ring-2 ring-[#0050FF] rounded-2xl bg-[#0050FF]/10'
          : isTransparent
          ? 'bg-transparent'
          : isDark
          ? 'rounded-2xl border-2 border-[#282A36] bg-[#14151B] p-2.5'
          : isMono
          ? 'rounded-2xl border-2 border-[#D8D4CA] bg-[#FCFBF9] p-2.5'
          : 'rounded-2xl border-2 border-slate-300 bg-white p-2.5'
      } ${selected ? 'ring-2 ring-[#0050FF]/40 rounded-xl' : ''}`}
      style={{
        width: size.width ? `${size.width}px` : 'auto',
        height: size.height ? `${size.height}px` : 'auto',
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

      {/* Floating Action Toolbar: positioned fully above the card (8-12px gap), clear of resize handles */}
      <div
        className={`nodrag absolute bottom-full mb-2.5 right-0 z-20 flex items-center gap-1 rounded-full border-2 px-1.5 py-0.5 shadow-none transition-opacity duration-150 ${
          selected && !isResizing
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 group-hover:opacity-100 pointer-events-auto'
        } ${
          isDark
            ? 'border-[#282A36] bg-[#14151B] text-slate-300'
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

        {hasCustomDimensions && (
          <button
            type="button"
            onClick={handleResetDimensions}
            title="Reset dimensions to natural size"
            className="flex items-center gap-1 rounded-full p-1 text-[11px] font-bold hover:text-[#0050FF] transition cursor-pointer"
          >
            <MingIcon name="aspect_ratio_line" size={13} />
          </button>
        )}

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
        onResize={handleResize}
        onResizeEnd={handleResizeEnd}
        lineClassName="!border-[#0050FF]"
        handleClassName="!h-3 !w-3 !rounded-full !border-2 !border-white !bg-[#0050FF]"
      />

      {/* Live Dimension Readout Badge: displayed near the card only while resizing */}
      {isResizing && size.width && size.height && (
        <div
          className={`nodrag pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 z-30 whitespace-nowrap rounded-md border-2 px-2 py-0.5 text-[11px] font-bold ${
            isDark
              ? 'border-[#282A36] bg-[#14151B] text-slate-200'
              : isMono
              ? 'border-[#D8D4CA] bg-[#FCFBF9] text-[#242321]'
              : 'border-slate-800 bg-white text-slate-900'
          }`}
        >
          {size.width} × {size.height}
        </div>
      )}

      {isDraggingOver ? (
        <div className="flex h-32 w-48 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#0050FF] bg-[#0050FF]/5 text-[#0050FF]">
          <MingIcon name="upload_2_line" size={24} />
          <span className="text-xs font-bold">Drop to replace image</span>
        </div>
      ) : config.url ? (
        <ImageContent
          url={config.url}
          caption={config.caption}
          width={size.width}
          height={size.height}
          onDoubleClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
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
