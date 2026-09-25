'use client';

import React from 'react';
import { useSandboxTutorial } from '@/context/SandboxTutorialContext';
import { useTheme } from '@/context/ThemeContext';
import { MingIcon } from '@/components/ui/MingIcon';
import { MissionStepItem } from './MissionStepItem';
import { CompletionCelebration } from './CompletionCelebration';

export const SandboxMissionsCard: React.FC = () => {
  const {
    isOpen,
    isMinimized,
    activeMissionId,
    missions,
    completedCount,
    totalMissions,
    isAllCompleted,
    hasSeenGraduation,
    openTutorial,
    closeTutorial,
    toggleMinimize,
    setActiveMissionId,
    resetMissions,
    dismissGraduation,
  } = useSandboxTutorial();
  const { theme, activeCustomTheme } = useTheme();

  if (!isOpen) return null;

  const isCustom = theme === 'custom';
  const isDark = theme === 'dark' || (isCustom && activeCustomTheme?.metadata.mode_base === 'dark');
  const isMono = theme === 'mono';

  const containerClass = isCustom && activeCustomTheme
    ? 'bg-[var(--custom-ui-surface)] border-[var(--custom-ui-border)] text-[var(--custom-ui-text)]'
    : isDark
    ? 'bg-[#14151B] border-[#2E3140] text-[#E2E4E9]'
    : isMono
    ? 'bg-[#FCFBF9] border-[#D8D4CA] text-[#242321]'
    : 'bg-white border-slate-300 text-slate-900';

  // Minimized Compact Pill
  if (isMinimized) {
    return (
      <div className="fixed top-20 left-6 z-30 select-none animate-in fade-in duration-200">
        <button
          type="button"
          onClick={toggleMinimize}
          className={`flex items-center gap-2 rounded-2xl border-2 px-3.5 py-2 text-xs font-bold transition-all shadow-md cursor-pointer ${
            isCompletedPill(isAllCompleted, isDark, isMono, isCustom, activeCustomTheme)
          }`}
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-blue-500/15 text-[#0050FF]">
            <MingIcon name={isAllCompleted ? 'trophy_line' : 'target_line'} size={14} />
          </div>
          <span>
            {isAllCompleted ? 'Tutorial Complete' : `Tutorial Missions (${completedCount}/${totalMissions})`}
          </span>
          <MingIcon name="up_line" size={14} className="text-slate-400" />
        </button>
      </div>
    );
  }

  const progressPercent = Math.round((completedCount / totalMissions) * 100);

  return (
    <div
      className={`fixed top-20 left-6 z-30 w-[360px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-120px)] flex flex-col rounded-2xl border-2 shadow-2xl transition-all duration-200 select-none ${containerClass}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5 shrink-0 border-b border-slate-100 dark:border-[#252730] mono:border-[#D8D4CA]">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-500/10 text-[#0050FF] border border-blue-500/20">
            <MingIcon name="target_line" size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold leading-none">
              Sandbox Missions
            </h3>
            <span
              className={`text-[10px] font-semibold ${
                isDark ? 'text-slate-400' : isMono ? 'text-[#78756D]' : 'text-slate-500'
              }`}
            >
              {completedCount} of {totalMissions} tasks completed
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleMinimize}
            title="Minimize checklist"
            className={`flex h-6 w-6 items-center justify-center rounded-lg transition-colors cursor-pointer ${
              isDark
                ? 'text-slate-400 hover:text-white hover:bg-[#22242D]'
                : isMono
                ? 'text-[#78756D] hover:text-[#242321] hover:bg-[#EAE7DF]'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <MingIcon name="down_line" size={14} />
          </button>
          <button
            type="button"
            onClick={closeTutorial}
            title="Close tutorial"
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

      {/* Progress Bar Hairline */}
      <div className="w-full bg-slate-200/60 dark:bg-[#22242D] mono:bg-[#D8D4CA] h-1.5 shrink-0 overflow-hidden">
        <div
          className="bg-[#0050FF] h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Scrollable Missions List */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
        {isAllCompleted && !hasSeenGraduation ? (
          <CompletionCelebration
            onDismiss={dismissGraduation}
            onRestart={resetMissions}
          />
        ) : (
          missions.map((mission) => (
            <MissionStepItem
              key={mission.id}
              mission={mission}
              isActive={mission.id === activeMissionId}
              onSelect={() => setActiveMissionId(mission.id)}
            />
          ))
        )}
      </div>

      {/* Footer Controls */}
      <div
        className={`flex items-center justify-between px-3.5 py-2 shrink-0 border-t-2 text-[10px] font-semibold rounded-b-2xl ${
          isDark
            ? 'border-[#252730] bg-[#101116] text-slate-400'
            : isMono
            ? 'border-[#D8D4CA] bg-[#F4F3EF] text-[#78756D]'
            : 'border-slate-100 bg-slate-50 text-slate-500'
        }`}
      >
        <button
          type="button"
          onClick={resetMissions}
          className="hover:underline flex items-center gap-1 cursor-pointer"
        >
          <MingIcon name="refresh_line" size={11} />
          <span>Reset Progress</span>
        </button>

        <span>Scriffle Hands-On Sandbox</span>
      </div>
    </div>
  );
};

function isCompletedPill(
  isAllCompleted: boolean,
  isDark: boolean,
  isMono: boolean,
  isCustom: boolean,
  activeCustomTheme: any
): string {
  if (isAllCompleted) {
    return isDark
      ? 'bg-[#151720] border-emerald-500/50 text-emerald-400'
      : isMono
      ? 'bg-[#FCFBF9] border-emerald-600 text-emerald-800'
      : 'bg-emerald-50 border-emerald-400 text-emerald-800';
  }
  if (isCustom && activeCustomTheme) {
    return 'bg-[var(--custom-ui-surface)] border-[var(--custom-ui-border)] text-[var(--custom-ui-text)]';
  }
  if (isDark) {
    return 'bg-[#14151B] border-[#2E3140] text-slate-200 hover:border-slate-600';
  }
  if (isMono) {
    return 'bg-[#FCFBF9] border-[#D8D4CA] text-[#242321] hover:border-[#242321]';
  }
  return 'bg-white border-slate-300 text-slate-800 hover:border-slate-400';
}
