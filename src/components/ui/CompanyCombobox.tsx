'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { MingIcon } from '@/components/ui/MingIcon';
import { searchCompanies, POPULAR_PICKS } from '@/lib/search/companySearch';
import { IdxCompany } from '@/data/popularIdxCompanies';

export interface CompanyComboboxProps {
  value: string;
  onChange: (symbol: string) => void;
  onOpenScreener?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export const CompanyCombobox: React.FC<CompanyComboboxProps> = ({
  value,
  onChange,
  onOpenScreener,
  placeholder = 'Search company or ticker (e.g. BBCA, Mandiri)',
  disabled = false,
}) => {
  const { theme, activeCustomTheme } = useTheme();
  const isCustom = theme === 'custom';
  const isDark = theme === 'dark' || (isCustom && activeCustomTheme?.metadata.mode_base === 'dark');
  const isMono = theme === 'mono';

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value changes
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  const results = useMemo(() => {
    return searchCompanies(query, 8);
  }, [query]);

  // Click outside to close and commit
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (company: IdxCompany) => {
    onChange(company.symbol);
    setQuery(company.symbol);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        setIsOpen(true);
        return;
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < results.length) {
        handleSelect(results[highlightedIndex]);
      } else if (query.trim()) {
        const cleanSym = query.trim().toUpperCase();
        onChange(cleanSym);
        setQuery(cleanSym);
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setHighlightedIndex(-1);
      inputRef.current?.blur();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  // Theming classes
  const inputBg = isDark
    ? 'bg-[#181920] border-[#282A36] text-[#E2E4E9] focus:border-[#4E5266]'
    : isMono
    ? 'bg-[#FCFBF9] border-[#D8D4CA] text-[#242321] focus:border-[#9E9A8E]'
    : 'bg-white border-slate-200 text-slate-900 focus:border-slate-400';

  const dropdownBg = isDark
    ? 'bg-[#181920] border-[#282A36] text-[#E2E4E9]'
    : isMono
    ? 'bg-[#FCFBF9] border-[#D8D4CA] text-[#242321]'
    : 'bg-white border-slate-200 text-slate-900';

  const itemHover = isDark
    ? 'hover:bg-[#20222D]'
    : isMono
    ? 'hover:bg-[#F2EFE8]'
    : 'hover:bg-slate-50';

  const itemActive = isDark
    ? 'bg-[#20222D]'
    : isMono
    ? 'bg-[#F2EFE8]'
    : 'bg-slate-100';

  const secondaryText = isDark
    ? 'text-[#8E95A5]'
    : isMono
    ? 'text-[#78756D]'
    : 'text-slate-500';

  const popularPill = isDark
    ? 'bg-blue-950/60 border-blue-800/60 text-blue-300'
    : isMono
    ? 'bg-[#EAE7DF] border-[#D8D4CA] text-[#242321]'
    : 'bg-blue-50 border-blue-200 text-blue-700';

  const symbolBadge = isDark
    ? 'bg-[#222530] border-[#34384A] text-slate-200 font-mono font-bold'
    : isMono
    ? 'bg-[#EFECE4] border-[#D8D4CA] text-[#242321] font-mono font-bold'
    : 'bg-slate-100 border-slate-300 text-slate-900 font-mono font-bold';

  const isEmptyQuery = !query.trim();

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Combobox Input Box */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          spellCheck={false}
          className={`w-full rounded-xl border-2 p-2.5 pr-9 font-bold focus:outline-none transition-colors ${inputBg} ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        />
        <div className="absolute right-2.5 flex items-center pointer-events-none text-slate-400">
          <MingIcon name={isOpen ? 'up_line' : 'down_line'} size={16} />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div
          className={`absolute left-0 right-0 top-full z-50 mt-1.5 max-h-72 overflow-y-auto rounded-xl border-2 p-1 transition-all ${dropdownBg}`}
        >
          {/* Section Header */}
          <div className={`px-2.5 py-1.5 text-[10px] font-bold tracking-wider ${secondaryText} border-b border-dashed border-current/15 mb-1 flex items-center justify-between`}>
            <span>{isEmptyQuery ? 'Popular IDX Stocks' : 'Matching Companies'}</span>
            <span className="font-mono text-[9px]">Press ↵ to select</span>
          </div>

          {/* Results List */}
          {results.length > 0 ? (
            <div className="space-y-0.5">
              {results.map((company, idx) => {
                const isSelected = company.symbol.toUpperCase() === value?.toUpperCase();
                const isHighlighted = idx === highlightedIndex;

                return (
                  <button
                    key={company.symbol}
                    type="button"
                    onClick={() => handleSelect(company)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full flex items-center justify-between gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-colors cursor-pointer ${
                      isHighlighted ? itemActive : itemHover
                    } ${isSelected ? 'font-bold' : ''}`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className={`px-1.5 py-0.5 rounded text-[11px] border shrink-0 ${symbolBadge}`}>
                        {company.symbol}
                      </span>
                      <span className="truncate">{company.name}</span>
                    </div>

                    {company.popular && (
                      <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-semibold border ${popularPill}`}>
                        Top 12
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            /* No Results / Fallback to AI Screener */
            <div className="p-3 text-center space-y-2">
              <div className={`text-xs ${secondaryText}`}>
                No listed company found for <strong className="font-mono">"{query}"</strong>
              </div>
              {onOpenScreener ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenScreener();
                  }}
                  className={`w-full flex items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    isDark
                      ? 'bg-blue-950/40 border-blue-700/60 text-blue-300 hover:bg-blue-900/50'
                      : isMono
                      ? 'bg-[#EFECE4] border-[#D8D4CA] text-[#242321] hover:bg-[#EAE7DF]'
                      : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  <MingIcon name="sparkles_line" size={14} />
                  <span>Discover with AI Screener</span>
                </button>
              ) : (
                <div className={`text-[11px] ${secondaryText}`}>
                  Press <kbd className="px-1 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono text-[10px]">Enter</kbd> to use <span className="font-mono font-bold">"{query.toUpperCase()}"</span> anyway.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
