'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSandboxTutorial } from '@/context/SandboxTutorialContext';
import { useTheme } from '@/context/ThemeContext';
import { MingIcon } from '@/components/ui/MingIcon';
import { MissionStepItem } from './MissionStepItem';
import { CompletionCelebration } from './CompletionCelebration';

export const SANDBOX_POS_STORAGE_KEY = 'scriffle_sandbox_card_pos_v1';
export const DEFAULT_SANDBOX_POS = { x: 24, y: 80 };

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

  const [pos, setPos] = useState<{ x: number; y: number }>(DEFAULT_SANDBOX_POS);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: DEFAULT_SANDBOX_POS.x,
    initialY: DEFAULT_SANDBOX_POS.y,
  });

  // Clamp coordinates within visible screen boundary
  const clampPosition = useCallback((x: number, y: number, width = 360, height = 400) => {
    if (typeof window === 'undefined') return { x, y };
    const minX = 16;
    const maxX = Math.max(minX, window.innerWidth - width - 16);
    const minY = 64; // Below top navigation bar
    const maxY = Math.max(minY, window.innerHeight - height - 16);

    return {
      x: Math.max(minX, Math.min(x, maxX)),
      y: Math.max(minY, Math.min(y, maxY)),
    };
  }, []);

  // Initialize and persist position from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(SANDBOX_POS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
          setPos(clampPosition(parsed.x, parsed.y));
        }
      }
    } catch {}
  }, [clampPosition]);

  // Re-clamp on window resize
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      const width = cardRef.current?.offsetWidth || 360;
      const height = cardRef.current?.offsetHeight || 400;
      setPos((prev) => clampPosition(prev.x, prev.y, width, height));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [clampPosition]);

  // Drag Gesture Handlers on Header
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Ignore button clicks or non-primary mouse clicks
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('.nodrag')) return;

    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: pos.x,
      initialY: pos.y,
    };

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;

    const width = cardRef.current?.offsetWidth || 360;
    const height = cardRef.current?.offsetHeight || 400;
    const next = clampPosition(dragStartRef.current.initialX + dx, dragStartRef.current.initialY + dy, width, height);
    setPos(next);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    try {
      localStorage.setItem(SANDBOX_POS_STORAGE_KEY, JSON.stringify(pos));
    } catch {}
  };

  // Reset to default top-left on double click header
  const handleDoubleClickHeader = () => {
    const defaultClamped = clampPosition(DEFAULT_SANDBOX_POS.x, DEFAULT_SANDBOX_POS.y);
    setPos(defaultClamped);
    try {
      localStorage.setItem(SANDBOX_POS_STORAGE_KEY, JSON.stringify(defaultClamped));
    } catch {}
  };

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

  // Minimized Compact Pill (uses current dragged coordinate)
  if (isMinimized) {
    return (
      <div
        ref={cardRef}
        className="fixed top-0 left-0 z-30 select-none animate-in fade-in duration-200 nodrag nowheel nopan"
        style={{
          transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
        }}
      >
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onDoubleClick={handleDoubleClickHeader}
          className="cursor-grab active:cursor-grabbing"
          title="Drag to reposition • Double-click to reset"
        >
          <button
            type="button"
            onClick={toggleMinimize}
            className={`flex items-center gap-2 rounded-2xl border-2 px-3.5 py-2 text-xs font-bold transition-all shadow-md cursor-pointer ${
              isCompletedPill(isAllCompleted, isDark, isMono, isCustom, activeCustomTheme)
            }`}
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-blue-500/15 text-[#0050FF] shrink-0">
              <MingIcon name={isAllCompleted ? 'trophy_line' : 'target_line'} size={14} />
            </div>
            <span className="whitespace-nowrap">
              {isAllCompleted ? 'Tutorial Complete' : `Tutorial Missions (${completedCount}/${totalMissions})`}
            </span>
            <MingIcon name="up_line" size={14} className="text-slate-400 shrink-0" />
          </button>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round((completedCount / totalMissions) * 100);

  return (
    <div
      ref={cardRef}
      className={`fixed top-0 left-0 z-30 w-[360px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-120px)] flex flex-col rounded-2xl border-2 shadow-2xl select-none nodrag nowheel nopan ${containerClass}`}
      style={{
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
        transition: isDragging ? 'none' : 'box-shadow 0.2s',
        willChange: isDragging ? 'transform' : 'auto',
      }}
    >
      {/* Draggable Header Bar */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={handleDoubleClickHeader}
        className={`flex items-center justify-between px-4 pt-3.5 pb-2.5 shrink-0 border-b border-slate-100 dark:border-[#252730] mono:border-[#D8D4CA] cursor-grab active:cursor-grabbing ${
          isDragging ? 'opacity-95' : ''
        }`}
        title="Drag header to move checklist • Double-click to reset"
      >
        <div className="flex items-center gap-2 select-none pointer-events-none">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-500/10 text-[#0050FF] border border-blue-500/20 shrink-0">
            <MingIcon name="target_line" size={16} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold leading-none">
                Sandbox Missions
              </h3>
              <MingIcon name="drag_move_2_line" size={12} className="text-slate-400 opacity-60" />
            </div>
            <span
              className={`text-[10px] font-semibold ${
                isDark ? 'text-slate-400' : isMono ? 'text-[#78756D]' : 'text-slate-500'
              }`}
            >
              {completedCount} of {totalMissions} tasks completed
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 nodrag">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleMinimize();
            }}
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
            onClick={(e) => {
              e.stopPropagation();
              closeTutorial();
            }}
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
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 nodrag">
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
        className={`flex items-center justify-between px-3.5 py-2 shrink-0 border-t-2 text-[10px] font-semibold rounded-b-2xl nodrag ${
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

        <span className="opacity-75">Drag header to reposition</span>
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
