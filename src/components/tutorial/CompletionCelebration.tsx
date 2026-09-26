'use client';

import React from 'react';
import { MingIcon } from '@/components/ui/MingIcon';
import { useTheme } from '@/context/ThemeContext';

interface CompletionCelebrationProps {
  onDismiss: () => void;
  onRestart: () => void;
}

export const CompletionCelebration: React.FC<CompletionCelebrationProps> = ({
  onDismiss,
  onRestart,
}) => {
  const { theme, activeCustomTheme } = useTheme();

  const isCustom = theme === 'custom';
  const isDark = theme === 'dark' || (isCustom && activeCustomTheme?.metadata.mode_base === 'dark');
  const isMono = theme === 'mono';

  const primaryBtnClass = isCustom && activeCustomTheme
    ? 'bg-[var(--custom-ui-primary)] text-[var(--custom-ui-surface)] border-2 border-[var(--custom-ui-primary)]'
    : isDark
    ? 'bg-white hover:bg-slate-100 text-[#0F1014] border-2 border-white'
    : isMono
    ? 'bg-[#242321] hover:bg-black text-[#FCFBF9] border-2 border-[#242321]'
    : 'bg-[#0050FF] hover:bg-blue-600 text-white border-2 border-[#0050FF]';

  return (
    <div
      className={`rounded-xl border-2 p-4 text-center transition-all ${
        isCustom && activeCustomTheme
          ? 'bg-[var(--custom-ui-surface)] border-emerald-500/50 text-[var(--custom-ui-text)]'
          : isDark
          ? 'bg-[#151720] border-emerald-500/40 text-[#E2E4E9]'
          : isMono
          ? 'bg-[#F4F3EF] border-[#242321] text-[#242321]'
          : 'bg-emerald-50/60 border-emerald-400 text-slate-900'
      }`}
    >
      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-xs">
        <MingIcon name="trophy_line" size={22} />
      </div>

      <h3 className="text-sm font-extrabold leading-tight">
        Tutorial Completed!
      </h3>
      <p
        className={`mt-1 text-xs leading-relaxed ${
          isDark ? 'text-slate-300' : isMono ? 'text-[#5E5A52]' : 'text-slate-600'
        }`}
      >
        You've mastered research mapping, auto-wiring, dual branching, freeform markup, and live streaming on Scriffle.
      </p>

      <div className="mt-3 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={onRestart}
          className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold border-2 transition cursor-pointer ${
            isDark
              ? 'border-[#2E3140] bg-[#1C1E26] text-slate-300 hover:text-white'
              : isMono
              ? 'border-[#D8D4CA] bg-[#FCFBF9] text-[#242321] hover:bg-[#EAE7DF]'
              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <MingIcon name="refresh_line" size={13} />
          <span>Restart</span>
        </button>

        <button
          type="button"
          onClick={onDismiss}
          className={`flex items-center gap-1 rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${primaryBtnClass}`}
        >
          <span>Start Researching</span>
          <MingIcon name="arrow_right_line" size={13} />
        </button>
      </div>
    </div>
  );
};
