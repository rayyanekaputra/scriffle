'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { NodeType } from '@/types/canvas';
import { MingIcon } from '@/components/ui/MingIcon';
import { useTheme } from '@/context/ThemeContext';
import {
  getRecommendedNodeTypes,
  QuickAddOption,
} from '@/lib/quickAddNavigator';

interface QuickAddPopoverProps {
  x: number;
  y: number;
  sourceNodeId: string;
  sourceNodeType?: NodeType | null;
  sourceNodeLabel?: string;
  onSelectType: (type: NodeType) => void;
  onClose: () => void;
}

export const QuickAddPopover: React.FC<QuickAddPopoverProps> = ({
  x,
  y,
  sourceNodeId,
  sourceNodeType,
  sourceNodeLabel,
  onSelectType,
  onClose,
}) => {
  const { theme, activeCustomTheme } = useTheme();
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const isCustom = theme === 'custom';
  const isDark = theme === 'dark' || (isCustom && activeCustomTheme?.metadata.mode_base === 'dark');
  const isMono = theme === 'mono';

  // Get recommendations prioritized by sourceNodeType
  const allOptions = useMemo(
    () => getRecommendedNodeTypes(sourceNodeType),
    [sourceNodeType]
  );

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return allOptions;
    const q = searchQuery.toLowerCase().trim();
    return allOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.description.toLowerCase().includes(q) ||
        opt.type.toLowerCase().includes(q)
    );
  }, [allOptions, searchQuery]);

  // Adjust selectedIndex when list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredOptions.length]);

  // Auto focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('mousedown', handleClickOutside, true);
    window.addEventListener('pointerdown', handleClickOutside, true);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside, true);
      window.removeEventListener('pointerdown', handleClickOutside, true);
    };
  }, [onClose]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : Math.max(0, filteredOptions.length - 1)
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredOptions[selectedIndex]) {
          onSelectType(filteredOptions[selectedIndex].type);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredOptions, selectedIndex, onSelectType, onClose]);

  // Keep popover inside viewport bounds
  const adjustedPosition = useMemo(() => {
    const width = 288;
    const height = 380;
    const padding = 16;

    let posX = x;
    let posY = y;

    if (typeof window !== 'undefined') {
      if (posX + width > window.innerWidth - padding) {
        posX = window.innerWidth - width - padding;
      }
      if (posY + height > window.innerHeight - padding) {
        posY = window.innerHeight - height - padding;
      }
      if (posX < padding) posX = padding;
      if (posY < padding) posY = padding;
    }

    return { x: posX, y: posY };
  }, [x, y]);

  // Theme styling tokens
  const containerBg = isDark
    ? 'bg-[#14151B] border-[#2E3240] text-[#E2E4E9]'
    : isMono
    ? 'bg-[#FCFBF9] border-[#D8D4CA] text-[#242321]'
    : 'bg-white border-slate-300 text-slate-900';

  const headerBorder = isDark
    ? 'border-[#262833]'
    : isMono
    ? 'border-[#EAE7DF]'
    : 'border-slate-200';

  const iconPillBg = isDark
    ? 'bg-[#222530] text-[#BAC0D0] border-[#313442]'
    : isMono
    ? 'bg-[#EFECE4] text-[#242321] border-[#D8D4CA]'
    : 'bg-[#0050FF]/10 text-[#0050FF] border-[#0050FF]/20';

  const titleText = isDark
    ? 'text-[#E2E4E9]'
    : isMono
    ? 'text-[#242321]'
    : 'text-slate-900';

  const mutedText = isDark
    ? 'text-[#8C90A0]'
    : isMono
    ? 'text-[#78756D]'
    : 'text-slate-500';

  const closeBtnHover = isDark
    ? 'text-[#8C90A0] hover:bg-[#222530] hover:text-[#E2E4E9]'
    : isMono
    ? 'text-[#78756D] hover:bg-[#EAE7DF] hover:text-[#242321]'
    : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700';

  const inputBg = isDark
    ? 'bg-[#1C1E26] border-[#2E3240] text-white placeholder-[#787C8D]'
    : isMono
    ? 'bg-[#F4F3EF] border-[#D8D4CA] text-[#242321] placeholder-[#8C8980]'
    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400';

  const selectedItemBg = isDark
    ? 'bg-[#222530] border-[#0050FF]'
    : isMono
    ? 'bg-[#EFECE4] border-[#242321]'
    : 'bg-blue-50/80 border-[#0050FF]';

  const itemHoverBg = isDark
    ? 'hover:bg-[#1C1E26]'
    : isMono
    ? 'hover:bg-[#F4F3EF]'
    : 'hover:bg-slate-50';

  const suggestedBadge = isDark
    ? 'bg-[#0050FF]/20 text-blue-300 border-[#0050FF]/40'
    : isMono
    ? 'bg-[#E2DFD6] text-[#242321] border-[#C8C4B8]'
    : 'bg-[#0050FF]/10 text-[#0050FF] border-[#0050FF]/20';

  const footerBorder = isDark
    ? 'border-[#262833]'
    : isMono
    ? 'border-[#EAE7DF]'
    : 'border-slate-200';

  const footerKbd = isDark
    ? 'bg-[#1C1E26] border-[#2E3240] text-[#BAC0D0]'
    : isMono
    ? 'bg-[#EFECE4] border-[#D8D4CA] text-[#242321]'
    : 'bg-slate-100 border-slate-200 text-slate-700';

  return (
    <div
      ref={popoverRef}
      style={{ left: `${adjustedPosition.x}px`, top: `${adjustedPosition.y}px` }}
      className={`fixed z-50 w-72 rounded-2xl border-2 p-3 transition-colors ${containerBg}`}
      onContextMenu={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className={`flex items-center justify-between pb-2 mb-2 border-b ${headerBorder}`}>
        <div className="flex items-center gap-1.5">
          <div className={`p-1 rounded-lg border ${iconPillBg}`}>
            <MingIcon name="add_line" size={14} />
          </div>
          <div>
            <h3 className={`text-xs font-bold leading-tight ${titleText}`}>Quick Add Next Node</h3>
            {sourceNodeLabel && (
              <span className={`text-[10px] font-medium ${mutedText}`}>
                From {sourceNodeLabel}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className={`p-1 rounded-lg transition-colors cursor-pointer ${closeBtnHover}`}
          title="Close (Esc)"
        >
          <MingIcon name="close_line" size={14} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-2">
        <div className={`absolute inset-y-0 left-2.5 flex items-center pointer-events-none ${mutedText}`}>
          <MingIcon name="search_line" size={13} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter nodes... (or press Enter)"
          className={`w-full rounded-xl border-2 py-1.5 pl-8 pr-3 text-xs outline-none transition-colors ${inputBg}`}
        />
      </div>

      {/* List */}
      <div className="max-h-60 overflow-y-auto space-y-1 pr-0.5">
        {filteredOptions.length === 0 ? (
          <div className={`py-6 text-center text-xs ${mutedText}`}>
            No matching node types found
          </div>
        ) : (
          filteredOptions.map((opt, idx) => {
            const isSelected = idx === selectedIndex;

            const iconBoxStyle = isMono
              ? {
                  backgroundColor: '#EFECE4',
                  borderColor: '#D8D4CA',
                  color: '#242321',
                }
              : isDark
              ? {
                  backgroundColor: '#1E202B',
                  borderColor: '#2F3240',
                  color: opt.color,
                }
              : {
                  backgroundColor: `${opt.color}20`,
                  borderColor: opt.color,
                  color: opt.color,
                };

            return (
              <button
                key={opt.type}
                onClick={() => onSelectType(opt.type)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full flex items-center gap-2.5 rounded-xl border-2 px-2.5 py-2 text-left transition-all cursor-pointer ${
                  isSelected
                    ? `${selectedItemBg} border-2`
                    : `border-transparent ${itemHoverBg}`
                }`}
              >
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs"
                  style={iconBoxStyle}
                >
                  <MingIcon name={opt.icon} size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold truncate ${titleText}`}>
                      {opt.label}
                    </span>
                    {opt.recommended && (
                      <span className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold border ${suggestedBadge}`}>
                        Suggested
                      </span>
                    )}
                  </div>
                  <p className={`text-[10px] truncate leading-tight mt-0.5 ${mutedText}`}>
                    {opt.description}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer Navigation Tip */}
      <div className={`mt-2.5 pt-2 border-t flex items-center justify-between text-[10px] ${footerBorder} ${mutedText}`}>
        <span className="flex items-center gap-1">
          <kbd className={`rounded border px-1 py-0.2 text-[9px] font-mono ${footerKbd}`}>↑</kbd>
          <kbd className={`rounded border px-1 py-0.2 text-[9px] font-mono ${footerKbd}`}>↓</kbd>
          <span>Navigate</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className={`rounded border px-1 py-0.2 text-[9px] font-mono ${footerKbd}`}>↵</kbd>
          <span>Select</span>
          <kbd className={`rounded border px-1 py-0.2 text-[9px] font-mono ml-1 ${footerKbd}`}>Esc</kbd>
          <span>Close</span>
        </span>
      </div>
    </div>
  );
};
