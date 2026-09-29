'use client';

import React, { useEffect, useRef } from 'react';
import { useSandboxTutorial } from '@/context/SandboxTutorialContext';
import { useTheme } from '@/context/ThemeContext';
import { MingIcon } from '@/components/ui/MingIcon';

interface TutorialMissionsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  buttonRef?: React.RefObject<HTMLElement | null>;
}

export const TutorialMissionsPopover: React.FC<TutorialMissionsPopoverProps> = ({
  isOpen,
  onClose,
  buttonRef,
}) => {
  const {
    missions,
    completedCount,
    totalMissions,
    isAllCompleted,
    activeMissionId,
    setActiveMissionId,
    resetMissions,
  } = useSandboxTutorial();

  const { theme, activeCustomTheme } = useTheme();
  const popoverRef = useRef<HTMLDivElement>(null);

  // Outside click & Esc listener (non-blocking for canvas pan/drag)
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        (!buttonRef?.current || !buttonRef.current.contains(target))
      ) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, buttonRef]);

  if (!isOpen) return null;

  const isCustom = theme === 'custom';
  const isDark = theme === 'dark' || (isCustom && activeCustomTheme?.metadata.mode_base === 'dark');
  const isMono = theme === 'mono';

  const containerBg = isCustom && activeCustomTheme
    ? 'bg-[var(--custom-ui-surface)] border-[var(--custom-ui-border)] text-[var(--custom-ui-text)]'
    : isDark
    ? 'bg-[#14151B] border-[#2E3140] text-[#E2E4E9]'
    : isMono
    ? 'bg-[#FCFBF9] border-[#D8D4CA] text-[#242321]'
    : 'bg-white border-slate-300 text-slate-900';

  const headerBorder = isDark ? 'border-[#252730]' : isMono ? 'border-[#D8D4CA]' : 'border-slate-100';

  const progressBarTrackClass = isCustom && activeCustomTheme
    ? 'bg-[var(--custom-ui-surface-muted)]'
    : isDark
    ? 'bg-[#282B38]'
    : isMono
    ? 'bg-[#ECEAE4]'
    : 'bg-slate-100';

  const progressBarFillClass = isCustom && activeCustomTheme
    ? 'bg-[var(--custom-ui-primary)]'
    : isDark
    ? 'bg-slate-200'
    : isMono
    ? 'bg-[#242321]'
    : 'bg-[#0050FF]';

  const progressPercent = Math.round((completedCount / totalMissions) * 100);

  return (
    <div
      ref={popoverRef}
      className={`absolute right-0 top-full mt-2 w-[380px] max-w-[calc(100vw-32px)] max-h-[calc(90vh-90px)] z-50 flex flex-col rounded-2xl border-2 select-none overflow-hidden transition-all duration-150 animate-in fade-in zoom-in-95 ${containerBg}`}
    >
      {/* Pinned Header */}
      <div className={`flex items-center justify-between px-4 pt-3.5 pb-2.5 shrink-0 border-b gap-2 ${headerBorder}`}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-xl border shrink-0 ${
              isAllCompleted
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                : isCustom && activeCustomTheme
                ? 'bg-[var(--custom-ui-surface-muted)] text-[var(--custom-ui-primary)] border-[var(--custom-ui-border)]'
                : isDark
                ? 'bg-white/10 text-slate-200 border-white/15'
                : isMono
                ? 'bg-[#242321]/10 text-[#242321] border-[#242321]/20'
                : 'bg-blue-500/10 text-[#0050FF] border-blue-500/20'
            }`}
          >
            <MingIcon name={isAllCompleted ? 'trophy_line' : 'target_line'} size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-bold leading-none truncate">
              Tutorial Missions
            </h3>
            <span
              className={`text-[10px] font-semibold mt-1 block truncate ${
                isDark ? 'text-slate-400' : isMono ? 'text-[#78756D]' : 'text-slate-500'
              }`}
            >
              {completedCount} of {totalMissions} tasks completed
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          title="Close tutorial (Esc)"
          className={`flex h-6 w-6 items-center justify-center rounded-lg transition-colors cursor-pointer shrink-0 ${
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

      {/* Hairline Progress Bar */}
      <div className={`w-full h-1.5 shrink-0 overflow-hidden ${progressBarTrackClass}`}>
        <div
          className={`h-full transition-all duration-300 ${progressBarFillClass}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Scrollable Missions List */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
        {/* All Completed Celebration Notice */}
        {isAllCompleted && (
          <div
            className={`rounded-xl border-2 p-3 flex items-start gap-2.5 mb-2 ${
              isDark
                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                : isMono
                ? 'bg-[#EBF3ED] border-emerald-700 text-emerald-900'
                : 'bg-emerald-50 border-emerald-300 text-emerald-900'
            }`}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-white shrink-0 mt-0.5">
              <MingIcon name="trophy_line" size={15} />
            </div>
            <div className="flex-1 min-w-0 text-pretty">
              <h4 className="text-xs font-bold leading-tight break-words">Tutorial Complete!</h4>
              <p className="text-[11px] leading-relaxed mt-0.5 opacity-90 break-words whitespace-normal text-pretty">
                You've completed all 6 whiteboard automation missions.
              </p>
            </div>
          </div>
        )}

        {/* 6 Missions */}
        {missions.map((mission) => {
          const isDone = mission.isCompleted;
          const isActive = !isDone && mission.id === activeMissionId;
          const isNotStarted = !isDone && !isActive;

          return (
            <div
              key={mission.id}
              onClick={() => setActiveMissionId(mission.id)}
              className={`group rounded-xl border-2 p-2.5 transition-all cursor-pointer w-full min-w-0 overflow-hidden box-border ${
                isDone
                  ? isDark
                    ? 'bg-[#181A22]/50 border-emerald-500/30 text-slate-300'
                    : isMono
                    ? 'bg-[#F2EFE8]/70 border-[#8FA89B] text-[#4A4741]'
                    : 'bg-emerald-50/50 border-emerald-200 text-slate-700'
                  : isActive
                  ? isCustom && activeCustomTheme
                    ? 'bg-[var(--custom-ui-surface)] border-[var(--custom-ui-primary)] text-[var(--custom-ui-text)]'
                    : isDark
                    ? 'bg-[#1A1C24] border-slate-300 text-white'
                    : isMono
                    ? 'bg-[#FCFBF9] border-[#242321] text-[#242321]'
                    : 'bg-white border-[#0050FF] text-slate-900'
                  : isDark
                  ? 'bg-[#14151B] border-[#22242D] text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  : isMono
                  ? 'bg-[#F9F8F5] border-[#E2DFD6] text-[#78756D] hover:border-[#B5B0A4] hover:text-[#242321]'
                  : 'bg-slate-50/70 border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
              }`}
            >
              <div className="flex items-start gap-2.5 w-full min-w-0">
                {/* Step Icon / Status Circle */}
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 mt-0.5 transition-all ${
                    isDone
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : isActive
                      ? isCustom && activeCustomTheme
                        ? 'border-[var(--custom-ui-primary)] text-[var(--custom-ui-primary)] bg-[var(--custom-ui-surface-muted)]'
                        : isDark
                        ? 'border-slate-200 text-slate-200 bg-white/10'
                        : isMono
                        ? 'border-[#242321] text-[#242321] bg-[#242321]/10'
                        : 'border-[#0050FF] text-[#0050FF] bg-blue-50'
                      : isDark
                      ? 'border-slate-700 bg-transparent text-slate-500'
                      : isMono
                      ? 'border-[#C8C4B8] bg-transparent text-[#78756D]'
                      : 'border-slate-300 bg-transparent text-slate-400'
                  }`}
                >
                  {isDone ? (
                    <MingIcon name="check_line" size={12} className="stroke-[3]" />
                  ) : (
                    <span className="text-[9px] font-bold">
                      {mission.badge.replace('Mission ', '')}
                    </span>
                  )}
                </div>

                {/* Mission Content */}
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-start justify-between gap-1.5 w-full min-w-0">
                    <h4
                      className={`text-xs font-bold leading-snug break-words whitespace-normal text-pretty flex-1 min-w-0 ${
                        isDone
                          ? isDark
                            ? 'line-through text-slate-400'
                            : isMono
                            ? 'line-through text-[#8F8B82]'
                            : 'line-through text-slate-500'
                          : ''
                      }`}
                    >
                      {mission.title}
                    </h4>

                    {/* Status Pill & Action */}
                    <div className="shrink-0 flex items-center gap-1 mt-0.5">
                      {isDone && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                          <MingIcon name="check_circle_line" size={11} />
                          Done
                        </span>
                      )}
                      {isActive && (
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                            isCustom && activeCustomTheme
                              ? 'bg-[var(--custom-ui-surface-muted)] text-[var(--custom-ui-primary)] border-[var(--custom-ui-primary)]'
                              : isDark
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                              : isMono
                              ? 'bg-[#242321] text-white border-[#242321]'
                              : 'bg-blue-100 text-[#0050FF] border-blue-200'
                          }`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                          Active
                        </span>
                      )}
                      {isNotStarted && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMissionId(mission.id);
                          }}
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border transition cursor-pointer ${
                            isDark
                              ? 'bg-[#1C1E26] border-[#2A2C38] text-slate-400 hover:text-white hover:border-slate-500'
                              : isMono
                              ? 'bg-[#EAE7DF] border-[#D8D4CA] text-[#78756D] hover:text-[#242321]'
                              : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Start
                        </button>
                      )}
                    </div>
                  </div>

                  <p
                    className={`text-[11px] leading-relaxed mt-1 break-words whitespace-normal text-pretty w-full min-w-0 overflow-hidden [overflow-wrap:anywhere] ${
                      isDone
                        ? isDark
                          ? 'text-slate-500'
                          : 'text-slate-400'
                        : isDark
                        ? 'text-slate-300'
                        : isMono
                        ? 'text-[#5E5A52]'
                        : 'text-slate-600'
                    }`}
                  >
                    {mission.shortDesc}
                  </p>

                  {/* Active Mission Instructions */}
                  {isActive && (
                    <div
                      className={`mt-2.5 rounded-xl border p-2.5 text-xs leading-relaxed flex items-start gap-2 w-full min-w-0 overflow-hidden ${
                        isCustom && activeCustomTheme
                          ? 'bg-[var(--custom-ui-surface-muted)] border-[var(--custom-ui-border)] text-[var(--custom-ui-text)]'
                          : isDark
                          ? 'bg-[#101116] border-[#2E3140] text-slate-300'
                          : isMono
                          ? 'bg-[#ECEAE4] border-[#D8D4CA] text-[#242321]'
                          : 'bg-blue-50/70 border-blue-200 text-blue-950'
                      }`}
                    >
                      <MingIcon name="lightbulb_line" size={15} className="shrink-0 mt-0.5 text-amber-500" />
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <span className="font-bold block mb-0.5 text-[10px] uppercase tracking-wider">
                          Instructions
                        </span>
                        <p className="text-[11px] leading-relaxed break-words whitespace-normal text-pretty">
                          {mission.detailHint}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pinned Footer */}
      <div
        className={`flex items-center justify-between px-3.5 py-2.5 shrink-0 border-t text-[11px] font-semibold ${
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
          className="hover:underline flex items-center gap-1 cursor-pointer transition-colors"
        >
          <MingIcon name="refresh_line" size={12} />
          <span>Reset progress</span>
        </button>

      </div>
    </div>
  );
};
