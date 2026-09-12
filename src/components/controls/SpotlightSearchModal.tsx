'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CanvasNodeData, NodeType } from '@/types/canvas';
import { MingIcon } from '@/components/ui/MingIcon';
import { useTheme } from '@/context/ThemeContext';
import { searchCanvasNodes, SearchResultItem } from '@/lib/searchIndexer';

interface SpotlightSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes?: CanvasNodeData[];
  onSelectNode: (nodeId: string) => void;
}

export const SpotlightSearchModal: React.FC<SpotlightSearchModalProps> = ({
  isOpen,
  onClose,
  nodes = [],
  onSelectNode,
}) => {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';
  const isMono = theme === 'mono';

  const results: SearchResultItem[] = React.useMemo(() => {
    return searchCanvasNodes(nodes, query);
  }, [nodes, query]);

  // Reset query and selected index on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Clamp selected index when results change
  useEffect(() => {
    setSelectedIndex((prev) => (results.length === 0 ? 0 : Math.min(prev, results.length - 1)));
  }, [results]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current && results.length > 0) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, results.length]);

  const handleSelect = (item: SearchResultItem) => {
    onSelectNode(item.id);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  const getNodeIcon = (type: NodeType) => {
    switch (type) {
      case 'watcher':
        return 'radar_line';
      case 'screener':
        return 'ai_line';
      case 'note':
        return 'quill_pen_line';
      case 'text':
        return 'font_size_line';
      case 'condition':
        return 'filter_line';
      case 'alert':
        return 'notification_line';
      case 'action':
        return 'flash_line';
      case 'file':
        return 'attachment_line';
      case 'sticker':
        return 'star_line';
      case 'image':
        return 'pic_line';
      default:
        return 'layout_grid_line';
    }
  };

  const getNodeBadgeClass = (type: NodeType) => {
    if (isDark) {
      switch (type) {
        case 'watcher':
          return 'bg-blue-950/60 text-blue-300 border-blue-800';
        case 'screener':
          return 'bg-indigo-950/60 text-indigo-300 border-indigo-800';
        case 'condition':
          return 'bg-yellow-950/60 text-yellow-300 border-yellow-800';
        case 'alert':
          return 'bg-rose-950/60 text-rose-300 border-rose-800';
        case 'file':
          return 'bg-emerald-950/60 text-emerald-300 border-emerald-800';
        default:
          return 'bg-slate-800 text-slate-300 border-slate-700';
      }
    }
    if (isMono) {
      return 'bg-[#ECEAE4] text-[#242321] border-[#D8D4CA]';
    }
    switch (type) {
      case 'watcher':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'screener':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'condition':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'alert':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'file':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 pb-6 px-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-xl flex flex-col rounded-2xl border-2 overflow-hidden transition-all duration-150 ${
          isDark
            ? 'bg-[#14151B] border-[#2E3140] text-slate-100'
            : isMono
            ? 'bg-[#FCFBF9] border-[#D8D4CA] text-[#242321]'
            : 'bg-white border-slate-300 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div
          className={`flex items-center gap-3 px-4 py-3.5 border-b-2 ${
            isDark ? 'border-[#2E3140] bg-[#181920]' : isMono ? 'border-[#D8D4CA] bg-[#F4F3EF]' : 'border-slate-200 bg-slate-50/50'
          }`}
        >
          <MingIcon
            name="search_line"
            size={20}
            className={isDark ? 'text-slate-400' : isMono ? 'text-[#78756D]' : 'text-slate-400'}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stock tickers, screeners, notes, rules, files..."
            className="flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400 placeholder:font-normal"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="rounded-md p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
            >
              <MingIcon name="close_line" size={14} />
            </button>
          )}
          <kbd
            className={`hidden sm:inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold border ${
              isDark
                ? 'bg-[#22242D] border-[#2E3140] text-slate-400'
                : isMono
                ? 'bg-[#ECEAE4] border-[#D8D4CA] text-[#78756D]'
                : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}
          >
            Esc
          </kbd>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="max-h-[380px] overflow-y-auto p-2 divide-y divide-transparent space-y-1"
        >
          {results.length > 0 ? (
            results.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`group flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border-2 transition cursor-pointer ${
                    isSelected
                      ? isDark
                        ? 'bg-[#22242D] border-[#0050FF] text-white'
                        : isMono
                        ? 'bg-[#EAE7DF] border-[#0050FF] text-[#242321]'
                        : 'bg-blue-50/70 border-[#0050FF] text-slate-900'
                      : isDark
                      ? 'border-transparent hover:bg-[#1C1D24] text-slate-200'
                      : isMono
                      ? 'border-transparent hover:bg-[#F4F3EF] text-[#33312B]'
                      : 'border-transparent hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                        isSelected
                          ? 'bg-[#0050FF] text-white border-[#0050FF]'
                          : isDark
                          ? 'bg-[#181920] border-[#2E3140] text-slate-400'
                          : isMono
                          ? 'bg-[#ECEAE4] border-[#D8D4CA] text-[#4A4741]'
                          : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    >
                      <MingIcon name={getNodeIcon(item.type)} size={16} />
                    </div>

                    <div className="min-w-0 flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold truncate">{item.title}</span>
                        {item.badge && (
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold border shrink-0 ${getNodeBadgeClass(
                              item.type
                            )}`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[11px] font-medium truncate ${
                          isSelected
                            ? isDark
                              ? 'text-slate-300'
                              : 'text-slate-600'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {item.subtitle}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
                    <span className="text-[10px] font-semibold text-slate-400">Fly to</span>
                    <MingIcon name="arrow_right_line" size={14} className="text-slate-400" />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center">
              <MingIcon
                name="search_line"
                size={32}
                className="mx-auto mb-2 text-slate-300 dark:text-slate-600"
              />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                No matching cards found
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Try searching for a ticker symbol (e.g. BBCA), rule name, or prompt keyword.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer Controls Guide */}
        <div
          className={`flex items-center justify-between px-4 py-2 border-t-2 text-[11px] font-semibold ${
            isDark ? 'border-[#2E3140] bg-[#181920] text-slate-400' : isMono ? 'border-[#D8D4CA] bg-[#F4F3EF] text-[#78756D]' : 'border-slate-200 bg-slate-50 text-slate-500'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px]">↑</kbd>
              <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px]">↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px]">↵</kbd>
              Jump to Card
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span>{results.length} item{results.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
