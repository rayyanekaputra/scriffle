'use client';

import React, { useEffect } from 'react';
import { MingIcon } from '@/components/ui/MingIcon';
import { useTheme } from '@/context/ThemeContext';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTour?: () => void;
  onStartTutorial?: () => void;
}

interface ShortcutItem {
  keys: string[];
  label: string;
}

interface ShortcutCategory {
  title: string;
  icon: string;
  items: ShortcutItem[];
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({
  isOpen,
  onClose,
  onStartTour,
  onStartTutorial,
}) => {
  const { theme } = useTheme();

  const isDark = theme === 'dark';
  const isMono = theme === 'mono';

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories: ShortcutCategory[] = [
    {
      title: 'Tools & Modes',
      icon: 'cursor_line',
      items: [
        { keys: ['V'], label: 'Move & Select Tool' },
        { keys: ['H'], label: 'Hand & Pan Tool' },
        { keys: ['T'], label: 'Drop Free-Text at Cursor' },
        { keys: ['Space', 'Drag'], label: 'Temporary Hand Pan' },
      ],
    },
    {
      title: 'Card Actions',
      icon: 'quill_pen_line',
      items: [
        { keys: ['Del', '⌫'], label: 'Delete Selected Items' },
        { keys: ['Ctrl', 'C'], label: 'Copy Selected Cards & Connectors' },
        { keys: ['Ctrl', 'V'], label: 'Paste at Mouse Cursor' },
        { keys: ['Ctrl', 'D'], label: 'Quick Duplicate (+35px offset)' },
        { keys: ['Ctrl', 'Z'], label: 'Undo Canvas Mutation' },
        { keys: ['Ctrl', '⇧', 'Z'], label: 'Redo Canvas Action' },
        { keys: ['↵'], label: 'Commit Text / Close Editor' },
        { keys: ['⇧', '↵'], label: 'New Line / Continue List' },
      ],
    },
    {
      title: 'Grouping & Layout',
      icon: 'group_line',
      items: [
        { keys: ['Ctrl', 'G'], label: 'Group Selected Cards' },
        { keys: ['Ctrl', '⇧', 'G'], label: 'Ungroup Selected Group' },
        { keys: ['Ctrl', '⇧', 'T'], label: 'Tidy Up & Auto-Distribute (≥3)' },
        { keys: ['2× Click'], label: 'Enter Group Isolation Mode' },
        { keys: ['⇧', 'Click'], label: 'Multi-Select / Toggle' },
        { keys: ['⇧', 'Drag'], label: 'Marquee Box Selection' },
      ],
    },
    {
      title: 'Navigation & View',
      icon: 'navigation_line',
      items: [
        { keys: ['Ctrl', 'K'], label: 'Spotlight Quick Search' },
        { keys: ['Tab'], label: 'Jump to Next / Closest Card' },
        { keys: ['⇧', 'Tab'], label: 'Jump to Upstream / Prev Card' },
        { keys: ['⇧', '1'], label: 'Fit All Cards to Screen' },
        { keys: ['⇧', '0'], label: 'Reset Zoom to 100%' },
        { keys: ['?'], label: 'Shortcuts Cheat Sheet' },
        { keys: ['Esc'], label: 'Deselect All / Exit Focus' },
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-4xl flex flex-col rounded-2xl border-2 overflow-hidden transition-all duration-150 ${
          isDark
            ? 'bg-[#14151B] border-[#2E3140] text-slate-100'
            : isMono
            ? 'bg-[#FCFBF9] border-[#D8D4CA] text-[#242321]'
            : 'bg-white border-slate-300 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 sm:px-7 py-4 border-b-2 ${
            isDark ? 'border-[#2E3140] bg-[#181920]' : isMono ? 'border-[#D8D4CA] bg-[#F4F3EF]' : 'border-slate-200 bg-slate-50/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl border ${
                isDark
                  ? 'bg-[#22242D] border-[#2E3140] text-slate-200'
                  : isMono
                  ? 'bg-[#ECEAE4] border-[#D8D4CA] text-[#242321]'
                  : 'bg-blue-50 border-blue-200 text-[#0050FF]'
              }`}
            >
              <MingIcon name="keyboard_line" size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold">Keyboard Shortcuts</h2>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : isMono ? 'text-[#78756D]' : 'text-slate-500'}`}>
                Speed up research navigation and whiteboard flow automation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`rounded-lg p-1.5 transition cursor-pointer ${
              isDark
                ? 'hover:bg-[#22242D] text-slate-400 hover:text-white'
                : isMono
                ? 'hover:bg-[#EAE7DF] text-[#78756D] hover:text-[#242321]'
                : 'hover:bg-slate-200 text-slate-400 hover:text-slate-700'
            }`}
          >
            <MingIcon name="close_line" size={16} />
          </button>
        </div>

        {/* 2x2 Grid of Categories */}
        <div className="p-6 sm:p-7 grid grid-cols-1 md:grid-cols-2 gap-5 max-h-[70vh] overflow-y-auto">
          {categories.map((cat) => (
            <div
              key={cat.title}
              className={`rounded-xl border-2 p-5 flex flex-col gap-3.5 ${
                isDark
                  ? 'bg-[#181920] border-[#252732]'
                  : isMono
                  ? 'bg-[#F8F7F4] border-[#E2DFD6]'
                  : 'bg-slate-50/50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <MingIcon
                  name={cat.icon}
                  size={15}
                  className={isDark ? 'text-slate-400' : isMono ? 'text-[#242321]' : 'text-slate-700'}
                />
                <h3
                  className={`text-xs font-bold ${
                    isDark ? 'text-slate-200' : isMono ? 'text-[#242321]' : 'text-slate-900'
                  }`}
                >
                  {cat.title}
                </h3>
              </div>

              <div className="flex flex-col gap-2.5">
                {cat.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs font-medium py-0.5"
                  >
                    <span
                      className={`text-[12px] leading-tight ${
                        isDark ? 'text-slate-300' : isMono ? 'text-[#242321]' : 'text-slate-800'
                      }`}
                    >
                      {item.label}
                    </span>

                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      {item.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className={`rounded px-2 py-0.5 text-[11px] font-bold border whitespace-nowrap ${
                            isDark
                              ? 'bg-[#22242D] border-[#2E3140] text-slate-200'
                              : isMono
                              ? 'bg-[#ECEAE4] border-[#D8D4CA] text-[#242321]'
                              : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
                          }`}
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Spacious Footer with 1-Liner Action Buttons */}
        <div
          className={`flex flex-wrap sm:flex-nowrap items-center justify-between px-6 sm:px-7 py-3.5 border-t-2 text-[11px] font-semibold gap-4 ${
            isDark
              ? 'border-[#2E3140] bg-[#181920] text-slate-400'
              : isMono
              ? 'border-[#D8D4CA] bg-[#F4F3EF] text-[#78756D]'
              : 'border-slate-200 bg-slate-50 text-slate-500'
          }`}
        >
          {/* Left: 1-Liner Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            {onStartTour && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartTour();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 text-xs font-bold whitespace-nowrap shrink-0 transition cursor-pointer ${
                  isDark
                    ? 'border-[#2E3140] bg-[#22242D] text-slate-200 hover:text-white'
                    : isMono
                    ? 'border-[#D8D4CA] bg-[#ECEAE4] text-[#242321] hover:bg-[#D8D4CA]'
                    : 'border-blue-200 bg-blue-50 text-[#0050FF] hover:bg-blue-100'
                }`}
              >
                <MingIcon name="magic_line" size={14} />
                <span className="whitespace-nowrap">Product Tour</span>
              </button>
            )}

            {onStartTutorial && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartTutorial();
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border-2 text-xs font-bold whitespace-nowrap shrink-0 transition cursor-pointer shadow-none ${
                  isDark
                    ? 'border-white bg-white text-slate-950 hover:bg-slate-100'
                    : isMono
                    ? 'border-[#242321] bg-[#242321] text-[#FCFBF9] hover:bg-black'
                    : 'border-[#0050FF] bg-[#0050FF] text-white hover:bg-blue-600'
                }`}
              >
                <MingIcon name="target_line" size={14} />
                <span className="whitespace-nowrap">Hands-On Tutorial</span>
              </button>
            )}
          </div>

          {/* Right: Dismissal Helper */}
          <div className="flex items-center gap-1.5 shrink-0 text-xs">
            <span className={isDark ? 'text-slate-400' : isMono ? 'text-[#78756D]' : 'text-slate-500'}>Press</span>
            <kbd
              className={`px-2 py-0.5 rounded text-[11px] font-bold border whitespace-nowrap ${
                isDark
                  ? 'bg-[#22242D] border-[#2E3140] text-slate-200'
                  : isMono
                  ? 'bg-[#ECEAE4] border-[#D8D4CA] text-[#242321]'
                  : 'bg-white border-slate-300 text-slate-800 shadow-2xs'
              }`}
            >
              Esc
            </kbd>
            <span className={isDark ? 'text-slate-400' : isMono ? 'text-[#78756D]' : 'text-slate-500'}>to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
