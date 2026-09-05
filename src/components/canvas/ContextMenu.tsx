'use client';

import React, { useEffect, useRef } from 'react';
import { NodeType } from '@/types/canvas';
import { MingIcon } from '@/components/ui/MingIcon';
import { useTheme } from '@/context/ThemeContext';

interface ContextMenuProps {
  x: number;
  y: number;
  targetNodeId?: string | null;
  targetEdgeId?: string | null;
  onClose: () => void;
  onAddElement: (type: NodeType, extraConfig?: any) => void;
  onEditElement?: (nodeId: string) => void;
  onChangeColor?: (nodeId: string, color: 'yellow' | 'mint' | 'pink' | 'blue' | 'purple') => void;
  onDeleteElement?: (nodeId: string) => void;
  onDeleteEdge?: (edgeId: string) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  targetNodeId,
  targetEdgeId,
  onClose,
  onAddElement,
  onEditElement,
  onChangeColor,
  onDeleteElement,
  onDeleteEdge,
}) => {
  const { theme } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('pointerdown', handleClick, true);
    window.addEventListener('mousedown', handleClick, true);
    return () => {
      window.removeEventListener('pointerdown', handleClick, true);
      window.removeEventListener('mousedown', handleClick, true);
    };
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

  const isDark = theme === 'dark';
  const isMono = theme === 'mono';

  const menuBg = isDark
    ? 'bg-[#14151B] border-[#282A36] text-[#E2E4E9]'
    : isMono
    ? 'bg-[#FCFBF9] border-[#D8D4CA] text-[#242321]'
    : 'bg-white border-slate-200 text-slate-800';

  const textLabel = isDark ? 'text-[#8C90A0]' : isMono ? 'text-[#78756D]' : 'text-slate-400';
  const buttonHover = isDark
    ? 'text-[#E2E4E9] hover:bg-[#1E202B] hover:text-white'
    : isMono
    ? 'text-[#242321] hover:bg-[#EFECE4]'
    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900';

  const iconColor = isDark ? 'text-[#BAC0D0]' : isMono ? 'text-[#242321]' : 'text-slate-600';
  const dividerColor = isDark ? 'bg-[#252730]' : isMono ? 'bg-[#EAE7DF]' : 'bg-slate-100';

  return (
    <div
      ref={menuRef}
      style={{ left: `${x}px`, top: `${y}px` }}
      className={`fixed z-50 min-w-[200px] rounded-2xl border-2 p-1.5 text-xs shadow-none transition-colors ${menuBg}`}
      onContextMenu={(e) => e.stopPropagation()}
    >
      {targetEdgeId ? (
        // Connector/Edge Context Menu
        <div className="space-y-1">
          <div className={`px-2.5 py-1 text-[11px] font-bold ${textLabel}`}>Connector</div>
          <button
            onClick={() => {
              onDeleteEdge?.(targetEdgeId);
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 font-semibold text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
          >
            <MingIcon name="delete_2_line" size={16} className="text-rose-500" />
            <span>Delete connector</span>
          </button>
        </div>
      ) : targetNodeId ? (
        // Element Context Menu
        <div className="space-y-1">
          <button
            onClick={() => {
              onEditElement?.(targetNodeId);
              onClose();
            }}
            className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 font-semibold transition cursor-pointer ${buttonHover}`}
          >
            <MingIcon name="edit_line" size={16} className={iconColor} />
            <span>Edit element</span>
          </button>

          {/* Color changer for sticky notes */}
          <div className={`px-2.5 py-1 text-[11px] font-bold ${textLabel}`}>Color</div>
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
                  className={`h-5 w-5 rounded-full border ${isDark ? 'border-[#383B4A]' : 'border-slate-300'} ${bgMap[color]} hover:scale-110 transition cursor-pointer`}
                />
              );
            })}
          </div>

          <div className={`my-1 h-[1px] ${dividerColor}`} />

          <button
            onClick={() => {
              onDeleteElement?.(targetNodeId);
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 font-semibold text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
          >
            <MingIcon name="delete_2_line" size={16} className="text-rose-500" />
            <span>Delete element</span>
          </button>
        </div>
      ) : (
        // Canvas Add Menu
        <div className="space-y-0.5">
          <div className={`px-2.5 py-1 text-[11px] font-bold ${textLabel}`}>Add to board</div>

          <button
            onClick={() => {
              onAddElement('note', { color: 'yellow' });
              onClose();
            }}
            className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 font-semibold transition cursor-pointer ${buttonHover}`}
          >
            <MingIcon name="quill_pen_line" size={16} className={iconColor} />
            <span>Sticky note</span>
          </button>

          <button
            onClick={() => {
              onAddElement('text', { text: 'Type anything here...' });
              onClose();
            }}
            className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 font-semibold transition cursor-pointer ${buttonHover}`}
          >
            <MingIcon name="font_size_line" size={16} className={iconColor} />
            <span>Free text</span>
          </button>

          {/* Upload Image Option */}
          <button
            onClick={() => {
              fileInputRef.current?.click();
              onClose();
            }}
            className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 font-semibold transition cursor-pointer ${buttonHover}`}
          >
            <MingIcon name="pic_line" size={16} className={iconColor} />
            <span>Upload picture</span>
          </button>

          <button
            onClick={() => {
              onAddElement('watcher', { symbol: 'BBCA' });
              onClose();
            }}
            className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 font-semibold transition cursor-pointer ${buttonHover}`}
          >
            <MingIcon name="radar_line" size={16} className={iconColor} />
            <span>Market watcher</span>
          </button>

          <button
            onClick={() => {
              onAddElement('condition', { rule: 'price_change > 5' });
              onClose();
            }}
            className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 font-semibold transition cursor-pointer ${buttonHover}`}
          >
            <MingIcon name="filter_line" size={16} className={iconColor} />
            <span>Condition rule</span>
          </button>

          <button
            onClick={() => {
              onAddElement('sticker', { stickerType: 'bullish' });
              onClose();
            }}
            className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 font-semibold transition cursor-pointer ${buttonHover}`}
          >
            <MingIcon name="chart_line" size={16} className={iconColor} />
            <span>Sticker: Bullish</span>
          </button>

          <button
            onClick={() => {
              onAddElement('sticker', { stickerType: 'rocket' });
              onClose();
            }}
            className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 font-semibold transition cursor-pointer ${buttonHover}`}
          >
            <MingIcon name="rocket_line" size={16} className={iconColor} />
            <span>Sticker: Breakout</span>
          </button>

          <div className={`my-1 h-[1px] ${dividerColor}`} />

          <button
            onClick={() => {
              onAddElement('alert', { channel: 'ui' });
              onClose();
            }}
            className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 font-semibold transition cursor-pointer ${buttonHover}`}
          >
            <MingIcon name="notification_line" size={16} className={iconColor} />
            <span>Alert notification</span>
          </button>

          <button
            onClick={() => {
              onAddElement('action', { action: 'create_note' });
              onClose();
            }}
            className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 font-semibold transition cursor-pointer ${buttonHover}`}
          >
            <MingIcon name="flash_line" size={16} className={iconColor} />
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
