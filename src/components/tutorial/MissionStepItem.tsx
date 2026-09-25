'use client';

import React from 'react';
import { MingIcon } from '@/components/ui/MingIcon';
import { SandboxMissionItem } from '@/context/SandboxTutorialContext';
import { useTheme } from '@/context/ThemeContext';

interface MissionStepItemProps {
  mission: SandboxMissionItem;
  isActive: boolean;
  onSelect: () => void;
}

export const MissionStepItem: React.FC<MissionStepItemProps> = ({
  mission,
  isActive,
  onSelect,
}) => {
  const { theme, activeCustomTheme } = useTheme();

  const isCustom = theme === 'custom';
  const isDark = theme === 'dark' || (isCustom && activeCustomTheme?.metadata.mode_base === 'dark');
  const isMono = theme === 'mono';

  return (
    <div
      onClick={onSelect}
      className={`group rounded-xl border-2 p-2.5 transition-all cursor-pointer ${
        mission.isCompleted
          ? isDark
            ? 'bg-[#181A22]/50 border-emerald-500/30 text-slate-300'
            : isMono
            ? 'bg-[#F2EFE8]/70 border-[#8FA89B] text-[#4A4741]'
            : 'bg-emerald-50/50 border-emerald-200 text-slate-700'
          : isActive
          ? isCustom && activeCustomTheme
            ? 'bg-[var(--custom-ui-surface)] border-[var(--custom-ui-primary)] text-[var(--custom-ui-text)] shadow-xs'
            : isDark
            ? 'bg-[#1A1C24] border-blue-500 text-white shadow-xs'
            : isMono
            ? 'bg-[#FCFBF9] border-[#242321] text-[#242321] shadow-xs'
            : 'bg-white border-[#0050FF] text-slate-900 shadow-xs'
          : isDark
          ? 'bg-[#14151B] border-[#22242D] text-slate-400 hover:border-slate-700 hover:text-slate-200'
          : isMono
          ? 'bg-[#F9F8F5] border-[#E2DFD6] text-[#78756D] hover:border-[#B5B0A4] hover:text-[#242321]'
          : 'bg-slate-50/70 border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
      }`}
    >
      <div className="flex items-start gap-2.5">
        {/* Status Checkmark / Circle */}
        <div
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 mt-0.5 transition-all ${
            mission.isCompleted
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : isActive
              ? isDark
                ? 'border-blue-400 text-blue-400 bg-blue-500/10'
                : 'border-[#0050FF] text-[#0050FF] bg-blue-50'
              : isDark
              ? 'border-slate-600 bg-transparent'
              : isMono
              ? 'border-[#C8C4B8] bg-transparent'
              : 'border-slate-300 bg-transparent'
          }`}
        >
          {mission.isCompleted ? (
            <MingIcon name="check_line" size={12} className="stroke-[3]" />
          ) : (
            <span className="text-[9px] font-bold">
              {mission.badge.replace('Mission ', '')}
            </span>
          )}
        </div>

        {/* Title and Short Description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h4
              className={`text-xs font-bold leading-tight ${
                mission.isCompleted
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

            {mission.isCompleted && (
              <span className="shrink-0 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                <MingIcon name="check_circle_line" size={12} />
                Done
              </span>
            )}
          </div>

          <p
            className={`text-[11px] leading-relaxed mt-1 ${
              mission.isCompleted
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

          {/* Active Detail Hint */}
          {isActive && !mission.isCompleted && (
            <div
              className={`mt-2 rounded-lg border p-2 text-[11px] font-medium leading-normal flex items-start gap-1.5 ${
                isDark
                  ? 'bg-[#101116] border-[#2E3140] text-blue-300'
                  : isMono
                  ? 'bg-[#ECEAE4] border-[#D8D4CA] text-[#242321]'
                  : 'bg-blue-50/70 border-blue-200 text-blue-900'
              }`}
            >
              <MingIcon name="lightbulb_line" size={14} className="shrink-0 mt-0.5 text-amber-500" />
              <span>{mission.detailHint}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
