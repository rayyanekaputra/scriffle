'use client';

import React, { useEffect, useRef } from 'react';
import { NodeType } from '@/types/canvas';
import { MingIcon } from '@/components/ui/MingIcon';

interface ContextMenuProps {
  x: number;
  y: number;
  targetNodeId?: string | null;
  onClose: () => void;
  onAddElement: (type: NodeType, extraConfig?: any) => void;
  onEditElement?: (nodeId: string) => void;
  onChangeColor?: (nodeId: string, color: 'yellow' | 'mint' | 'pink' | 'blue' | 'purple') => void;
  onDeleteElement?: (nodeId: string) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  targetNodeId,
  onClose,
  onAddElement,
  onEditElement,
  onChangeColor,
  onDeleteElement,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        onAddElement('image', {
          url: dataUrl,
          caption: file.name,
          isTransparent: file.type.includes('png'),
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      ref={menuRef}
      style={{ left: `${x}px`, top: `${y}px` }}
      className="fixed z-50 min-w-[200px] rounded-2xl border-2 border-slate-200 bg-white p-1.5 text-xs text-slate-800"
    >
      {targetNodeId ? (
        // Element Context Menu
        <div className="space-y-1">
          <button
            onClick={() => {
              onEditElement?.(targetNodeId);
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
          >
            <MingIcon name="edit_line" size={16} className="text-slate-600" />
            <span>Edit element</span>
          </button>

          {/* Color changer for sticky notes */}
          <div className="px-2.5 py-1 text-[11px] font-bold text-slate-400">Color</div>
          <div className="flex items-center gap-1.5 px-2.5 pb-1">
            {(['yellow', 'mint', 'pink', 'blue', 'purple'] as const).map((color) => {
              const bgMap = {
                yellow: 'bg-amber-300',
                mint: 'bg-emerald-300',
                pink: 'bg-rose-300',
                blue: 'bg-sky-300',
                purple: 'bg-purple-300',
              };
              return (
                <button
                  key={color}
                  onClick={() => {
                    onChangeColor?.(targetNodeId, color);
                    onClose();
                  }}
                  className={`h-5 w-5 rounded-full border border-slate-300 ${bgMap[color]} hover:scale-110 transition`}
                />
              );
            })}
          </div>

          <div className="my-1 h-[1px] bg-slate-100" />

          <button
            onClick={() => {
              onDeleteElement?.(targetNodeId);
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-100 hover:text-rose-600 transition"
          >
            <MingIcon name="delete_2_line" size={16} className="text-slate-500" />
            <span>Delete element</span>
          </button>
        </div>
      ) : (
        // Canvas Add Menu (Neutral hover states)
        <div className="space-y-0.5">
          <div className="px-2.5 py-1 text-[11px] font-bold text-slate-400">Add to board</div>

          <button
            onClick={() => {
              onAddElement('note', { color: 'yellow' });
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
          >
            <MingIcon name="quill_pen_line" size={16} className="text-slate-600" />
            <span>Sticky note</span>
          </button>

          <button
            onClick={() => {
              onAddElement('text', { text: 'Type anything here...' });
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
          >
            <MingIcon name="font_size_line" size={16} className="text-slate-600" />
            <span>Free text</span>
          </button>

          {/* Upload Image Option */}
          <button
            onClick={() => {
              fileInputRef.current?.click();
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
          >
            <MingIcon name="pic_line" size={16} className="text-slate-600" />
            <span>Upload picture</span>
          </button>

          <button
            onClick={() => {
              onAddElement('watcher', { symbol: 'BBCA' });
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
          >
            <MingIcon name="radar_line" size={16} className="text-slate-600" />
            <span>Market watcher</span>
          </button>

          <button
            onClick={() => {
              onAddElement('condition', { rule: 'price_change > 5' });
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
          >
            <MingIcon name="filter_line" size={16} className="text-slate-600" />
            <span>Condition rule</span>
          </button>

          <button
            onClick={() => {
              onAddElement('sticker', { stickerType: 'bullish' });
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
          >
            <MingIcon name="chart_line" size={16} className="text-slate-600" />
            <span>Sticker: Bullish</span>
          </button>

          <button
            onClick={() => {
              onAddElement('sticker', { stickerType: 'rocket' });
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
          >
            <MingIcon name="rocket_line" size={16} className="text-slate-600" />
            <span>Sticker: Breakout</span>
          </button>

          <div className="my-1 h-[1px] bg-slate-100" />

          <button
            onClick={() => {
              onAddElement('alert', { channel: 'ui' });
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
          >
            <MingIcon name="notification_line" size={16} className="text-slate-600" />
            <span>Alert notification</span>
          </button>

          <button
            onClick={() => {
              onAddElement('action', { action: 'create_note' });
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
          >
            <MingIcon name="flash_line" size={16} className="text-slate-600" />
            <span>Automation action</span>
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />
    </div>
  );
};
