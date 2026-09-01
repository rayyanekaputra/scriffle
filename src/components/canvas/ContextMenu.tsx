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

  // Close when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [onClose]);

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
            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            <MingIcon name="edit_line" size={16} />
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
            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 font-semibold text-rose-600 hover:bg-rose-50 transition"
          >
            <MingIcon name="delete_2_line" size={16} />
            <span>Delete element</span>
          </button>
        </div>
      ) : (
        // Canvas Add Menu
        <div className="space-y-0.5">
          <div className="px-2.5 py-1 text-[11px] font-bold text-slate-400">Add to board</div>

          <button
            onClick={() => {
              onAddElement('note', { color: 'yellow' });
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-900 transition"
          >
            <MingIcon name="quill_pen_line" size={16} className="text-amber-600" />
            <span>Sticky note</span>
          </button>

          <button
            onClick={() => {
              onAddElement('watcher', { symbol: 'BBCA' });
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#0050FF] transition"
          >
            <MingIcon name="radar_line" size={16} className="text-[#0050FF]" />
            <span>Market watcher</span>
          </button>

          <button
            onClick={() => {
              onAddElement('condition', { rule: 'price_change > 5' });
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-900 transition"
          >
            <MingIcon name="filter_line" size={16} className="text-amber-600" />
            <span>Condition rule</span>
          </button>

          <button
            onClick={() => {
              onAddElement('text', { text: 'Type anything here...' });
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            <MingIcon name="font_size_line" size={16} className="text-slate-600" />
            <span>Free text</span>
          </button>

          <button
            onClick={() => {
              onAddElement('sticker', { stickerType: 'bullish' });
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 transition"
          >
            <MingIcon name="chart_line" size={16} className="text-emerald-600" />
            <span>Sticker: Bullish</span>
          </button>

          <button
            onClick={() => {
              onAddElement('sticker', { stickerType: 'rocket' });
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-900 transition"
          >
            <MingIcon name="rocket_line" size={16} className="text-indigo-600" />
            <span>Sticker: Breakout</span>
          </button>

          <div className="my-1 h-[1px] bg-slate-100" />

          <button
            onClick={() => {
              onAddElement('alert', { channel: 'ui' });
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-900 transition"
          >
            <MingIcon name="notification_line" size={16} className="text-[#FF5B79]" />
            <span>Alert notification</span>
          </button>

          <button
            onClick={() => {
              onAddElement('action', { action: 'create_note' });
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#0050FF] transition"
          >
            <MingIcon name="flash_line" size={16} className="text-[#0050FF]" />
            <span>Automation action</span>
          </button>
        </div>
      )}
    </div>
  );
};
