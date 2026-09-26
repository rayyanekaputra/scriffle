'use client';

import React from 'react';
import { useOnboarding } from '@/context/OnboardingContext';
import { useTheme } from '@/context/ThemeContext';
import { MingIcon } from '@/components/ui/MingIcon';

export const ResumeTourPill: React.FC = () => {
  const {
    isActive,
    isMinimized,
    resumeStepIndex,
    totalSteps,
    resumeTour,
    dismissResumePill,
  } = useOnboarding();
  const { theme, activeCustomTheme } = useTheme();

  if (isActive || !isMinimized) return null;

  const isCustom = theme === 'custom';
  const isDark = theme === 'dark' || (isCustom && activeCustomTheme?.metadata.mode_base === 'dark');
  const isMono = theme === 'mono';

  const pillContainerClass = isCustom && activeCustomTheme
    ? 'bg-[var(--custom-ui-surface)] border-[var(--custom-ui-border)] text-[var(--custom-ui-text)]'
    : isDark
    ? 'bg-[#181920] border-[#2E3140] text-[#E2E4E9]'
    : isMono
    ? 'bg-[#FCFBF9] border-[#D8D4CA] text-[#242321]'
    : 'bg-white border-slate-300 text-slate-900';

  const iconBoxClass = isCustom && activeCustomTheme
    ? 'bg-[var(--custom-ui-surface-muted)] text-[var(--custom-ui-primary)] border-[var(--custom-ui-border)]'
    : isDark
    ? 'bg-white/10 text-slate-200 border-white/15'
    : isMono
    ? 'bg-[#242321]/10 text-[#242321] border-[#242321]/20'
    : 'bg-blue-500/10 text-[#0050FF] border-blue-500/20';

  const resumeBtnClass = isCustom && activeCustomTheme
    ? 'bg-[var(--custom-ui-primary)] text-[var(--custom-ui-surface)] border-[var(--custom-ui-primary)]'
    : isDark
    ? 'bg-white hover:bg-slate-100 text-[#0F1014] border-white'
    : isMono
    ? 'bg-[#242321] hover:bg-black text-[#FCFBF9] border-[#242321]'
    : 'bg-[#0050FF] hover:bg-blue-600 text-white border-[#0050FF]';

  return (
    <div
      className={`fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-2xl border-2 px-3.5 py-2 transition-all duration-200 select-none ${pillContainerClass}`}
    >
      <div className={`flex h-7 w-7 items-center justify-center rounded-xl shrink-0 border ${iconBoxClass}`}>
        <MingIcon name="magic_line" size={15} />
      </div>

      <div className="flex flex-col text-left">
        <span className="text-xs font-bold leading-none">Product Tour</span>
        <span
          className={`text-[10px] font-semibold ${
            isDark ? 'text-slate-400' : isMono ? 'text-[#78756D]' : 'text-slate-500'
          }`}
        >
          Step {resumeStepIndex + 1} of {totalSteps}
        </span>
      </div>

      <div className="flex items-center gap-1.5 pl-1">
        <button
          type="button"
          onClick={resumeTour}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${resumeBtnClass}`}
        >
          Resume
        </button>

        <button
          type="button"
          onClick={dismissResumePill}
          title="Dismiss resume prompt"
          className={`flex h-6 w-6 items-center justify-center rounded-lg transition-colors cursor-pointer ${
            isDark
              ? 'text-slate-400 hover:text-white hover:bg-[#22242D]'
              : isMono
              ? 'text-[#78756D] hover:text-[#242321] hover:bg-[#EAE7DF]'
              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          <MingIcon name="close_line" size={14} />
        </button>
      </div>
    </div>
  );
};
