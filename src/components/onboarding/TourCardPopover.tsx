'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useOnboarding } from '@/context/OnboardingContext';
import { useSandboxTutorial } from '@/context/SandboxTutorialContext';
import { useTheme } from '@/context/ThemeContext';
import { MingIcon } from '@/components/ui/MingIcon';

export const TourCardPopover: React.FC = () => {
  const {
    isActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    nextStep,
    prevStep,
    goToStep,
    skipTour,
    completeTour,
    dontShowAgain,
    setDontShowAgain,
  } = useOnboarding();
  const { openTutorial } = useSandboxTutorial();
  const { theme, activeCustomTheme } = useTheme();
  const popoverRef = useRef<HTMLDivElement>(null);

  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; isCenter: boolean }>({
    top: 0,
    left: 0,
    isCenter: true,
  });

  const isCustom = theme === 'custom';
  const isDark = theme === 'dark' || (isCustom && activeCustomTheme?.metadata.mode_base === 'dark');
  const isMono = theme === 'mono';

  // Compute position relative to target element with viewport boundary clamping
  const calculatePosition = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (!currentStep?.targetSelector || currentStep.placement === 'center') {
      // Center in viewport
      const cardWidth = 480;
      const cardHeight = 260;
      setPopoverPos({
        top: Math.max(20, (window.innerHeight - cardHeight) / 2),
        left: Math.max(16, (window.innerWidth - cardWidth) / 2),
        isCenter: true,
      });
      return;
    }

    const el = document.querySelector(currentStep.targetSelector);
    if (!el) {
      // Fallback to center if element not in DOM
      const cardWidth = 480;
      const cardHeight = 260;
      setPopoverPos({
        top: Math.max(20, (window.innerHeight - cardHeight) / 2),
        left: Math.max(16, (window.innerWidth - cardWidth) / 2),
        isCenter: true,
      });
      return;
    }

    const rect = el.getBoundingClientRect();
    const cardWidth = 480;
    const cardHeight = popoverRef.current?.offsetHeight || 240;
    const gap = 16;

    let top = 0;
    let left = 0;

    switch (currentStep.placement) {
      case 'top':
        top = rect.top - cardHeight - gap;
        left = rect.left + (rect.width - cardWidth) / 2;
        break;
      case 'bottom':
        top = rect.bottom + gap;
        left = rect.left + (rect.width - cardWidth) / 2;
        break;
      case 'left':
        top = rect.top + (rect.height - cardHeight) / 2;
        left = rect.left - cardWidth - gap;
        break;
      case 'right':
        top = rect.top + (rect.height - cardHeight) / 2;
        left = rect.bottom > 0 ? rect.right + gap : rect.left + gap;
        break;
      default:
        top = (window.innerHeight - cardHeight) / 2;
        left = (window.innerWidth - cardWidth) / 2;
        break;
    }

    // Viewport clamping
    const margin = 16;
    top = Math.max(margin, Math.min(top, window.innerHeight - cardHeight - margin));
    left = Math.max(margin, Math.min(left, window.innerWidth - cardWidth - margin));

    setPopoverPos({
      top,
      left,
      isCenter: false,
    });
  }, [currentStep]);

  useEffect(() => {
    if (!isActive) return;

    calculatePosition();
    const timer = setTimeout(calculatePosition, 60);

    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition, true);
    };
  }, [isActive, calculatePosition]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        skipTour();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        // Only trigger if not typing in an input
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag !== 'input' && tag !== 'textarea') {
          e.preventDefault();
          nextStep();
        }
      } else if (e.key === 'ArrowLeft') {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag !== 'input' && tag !== 'textarea') {
          e.preventDefault();
          prevStep();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, nextStep, prevStep, skipTour]);

  if (!isActive) return null;

  const cardContainerClass = isCustom && activeCustomTheme
    ? 'bg-[var(--custom-ui-surface)] border-[var(--custom-ui-border)] text-[var(--custom-ui-text)]'
    : isDark
    ? 'bg-[#14151B] border-[#2E3140] text-[#E2E4E9]'
    : isMono
    ? 'bg-[#FCFBF9] border-[#D8D4CA] text-[#242321]'
    : 'bg-white border-slate-300 text-slate-900';

  const isLastStep = currentStepIndex === totalSteps - 1;

  const headerIconClass = isCustom && activeCustomTheme
    ? 'bg-[var(--custom-ui-surface-muted)] text-[var(--custom-ui-primary)] border-[var(--custom-ui-border)]'
    : isDark
    ? 'bg-white/10 text-slate-200 border-white/15'
    : isMono
    ? 'bg-[#242321]/10 text-[#242321] border-[#242321]/20'
    : 'bg-blue-500/10 text-[#0050FF] border-blue-500/20';

  const checkboxAccentClass = isCustom && activeCustomTheme
    ? 'accent-[var(--custom-ui-primary)]'
    : isDark
    ? 'accent-slate-200'
    : isMono
    ? 'accent-[#242321]'
    : 'accent-[#0050FF]';

  const primaryBtnClass = isCustom && activeCustomTheme
    ? 'bg-[var(--custom-ui-primary)] hover:opacity-90 text-[var(--custom-ui-surface)] border-2 border-[var(--custom-ui-primary)]'
    : isDark
    ? 'bg-white hover:bg-slate-100 text-[#0F1014] border-2 border-white'
    : isMono
    ? 'bg-[#242321] hover:bg-black text-[#FCFBF9] border-2 border-[#242321]'
    : 'bg-[#0050FF] hover:bg-blue-600 text-white border-2 border-[#0050FF]';

  const activeDotClass = isCustom && activeCustomTheme
    ? 'w-5 bg-[var(--custom-ui-primary)]'
    : isDark
    ? 'w-5 bg-white'
    : isMono
    ? 'w-5 bg-[#242321]'
    : 'w-5 bg-[#0050FF]';

  return (
    <div
      ref={popoverRef}
      className={`fixed z-50 pointer-events-auto w-[480px] max-w-[calc(100vw-32px)] flex flex-col rounded-2xl border-2 transition-all duration-200 select-none ${cardContainerClass}`}
      style={{
        top: `${popoverPos.top}px`,
        left: `${popoverPos.left}px`,
      }}
    >
      {/* Header with Icon, Title, Badge & Dismiss */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 border ${headerIconClass}`}>
            <MingIcon name={currentStep.icon || 'magic_line'} size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-normal leading-tight">
              {currentStep.title}
            </h3>
            <span
              className={`text-[10px] font-semibold ${
                isDark ? 'text-slate-400' : isMono ? 'text-[#78756D]' : 'text-slate-500'
              }`}
            >
              {currentStep.badge}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={skipTour}
          title="Skip tour (Esc)"
          className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-colors cursor-pointer ${
            isDark
              ? 'border-transparent text-slate-400 hover:text-white hover:bg-[#22242D]'
              : isMono
              ? 'border-transparent text-[#78756D] hover:text-[#242321] hover:bg-[#EAE7DF]'
              : 'border-transparent text-slate-400 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          <MingIcon name="close_line" size={16} />
        </button>
      </div>

      {/* Description Body */}
      <div className="px-5 py-2">
        <p
          className={`text-xs leading-relaxed ${
            isDark ? 'text-slate-300' : isMono ? 'text-[#4A4741]' : 'text-slate-600'
          }`}
        >
          {currentStep.description}
        </p>
      </div>

      {/* Step 6 / Last Step: "Don't show on startup" toggle checkbox */}
      {isLastStep && (
        <div className="px-5 pt-1 pb-1">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none group">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className={`h-3.5 w-3.5 rounded border-2 border-slate-400 cursor-pointer ${checkboxAccentClass}`}
            />
            <span
              className={`text-[11px] font-medium transition-colors ${
                isDark
                  ? 'text-slate-400 group-hover:text-slate-300'
                  : isMono
                  ? 'text-[#78756D] group-hover:text-[#242321]'
                  : 'text-slate-500 group-hover:text-slate-800'
              }`}
            >
              Don't show this on startup
            </span>
          </label>
        </div>
      )}

      {/* Progress Dots & Actions Footer */}
      <div
        className={`flex items-center justify-between px-5 py-3 mt-2 border-t-2 ${
          isDark
            ? 'border-[#252730] bg-[#101116]/80'
            : isMono
            ? 'border-[#D8D4CA] bg-[#F4F3EF]/80'
            : 'border-slate-100 bg-slate-50/80'
        } rounded-b-2xl`}
      >
        {/* Step Indicator Dots */}
        <div className="flex items-center gap-1.5 shrink-0">
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => goToStep(idx)}
              title={`Go to step ${idx + 1}`}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx === currentStepIndex
                  ? activeDotClass
                  : isDark
                  ? 'w-2 bg-slate-700 hover:bg-slate-600'
                  : isMono
                  ? 'w-2 bg-[#D8D4CA] hover:bg-[#A8A49A]'
                  : 'w-2 bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {currentStepIndex > 0 ? (
            <button
              type="button"
              onClick={prevStep}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#181920] border-[#2E3140] text-slate-300 hover:bg-[#22242D]'
                  : isMono
                  ? 'bg-[#FCFBF9] border-[#D8D4CA] text-[#242321] hover:bg-[#EAE7DF]'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={skipTour}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : isMono
                  ? 'text-[#78756D] hover:text-[#242321]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Skip
            </button>
          )}

          {isLastStep ? (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={completeTour}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  isDark
                    ? 'bg-[#181920] border-[#2E3140] text-slate-300 hover:bg-[#22242D]'
                    : isMono
                    ? 'bg-[#FCFBF9] border-[#D8D4CA] text-[#242321] hover:bg-[#EAE7DF]'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="whitespace-nowrap">Explore Freely</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  completeTour();
                  openTutorial();
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer shadow-none ${primaryBtnClass}`}
              >
                <MingIcon name="target_line" size={14} className="shrink-0" />
                <span className="whitespace-nowrap">Start Missions</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={nextStep}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer shadow-none ${primaryBtnClass}`}
            >
              <span className="whitespace-nowrap">Next</span>
              <MingIcon name="arrow_right_line" size={14} className="shrink-0" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
