'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useOnboarding } from '@/context/OnboardingContext';
import { useTheme } from '@/context/ThemeContext';

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const SpotlightOverlay: React.FC = () => {
  const { isActive, currentStep, skipTour } = useOnboarding();
  const { theme, activeCustomTheme } = useTheme();
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [windowSize, setWindowSize] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  const isCustom = theme === 'custom';
  const isDark = theme === 'dark' || (isCustom && activeCustomTheme?.metadata.mode_base === 'dark');
  const isMono = theme === 'mono';

  const updateTargetRect = useCallback(() => {
    if (typeof window === 'undefined') return;

    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    if (!currentStep?.targetSelector) {
      setTargetRect(null);
      return;
    }

    const el = document.querySelector(currentStep.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      // Add padding around target for clean visual framing
      const padding = 8;
      setTargetRect({
        top: Math.max(0, rect.top - padding),
        left: Math.max(0, rect.left - padding),
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      });
    } else {
      setTargetRect(null);
    }
  }, [currentStep]);

  useEffect(() => {
    if (!isActive) {
      setTargetRect(null);
      return;
    }

    updateTargetRect();

    // Re-check shortly in case animated components or layout shift
    const timer1 = setTimeout(updateTargetRect, 50);
    const timer2 = setTimeout(updateTargetRect, 200);

    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
    };
  }, [isActive, updateTargetRect]);

  if (!isActive) return null;

  const ringBorderClass = isCustom && activeCustomTheme
    ? 'border-[var(--custom-ui-primary)]'
    : isDark
    ? 'border-slate-300'
    : isMono
    ? 'border-[#242321]'
    : 'border-[#0050FF]';

  const ringGlowClass = isCustom && activeCustomTheme
    ? 'border-[var(--custom-ui-primary)]/40'
    : isDark
    ? 'border-white/25'
    : isMono
    ? 'border-[#242321]/30'
    : 'border-[#0050FF]/40';

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden select-none transition-all duration-300">
      {/* SVG Cutout Mask */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-auto"
        width={windowSize.width}
        height={windowSize.height}
        onClick={(e) => {
          // If clicked directly on the overlay backdrop
          if (e.target === e.currentTarget) {
            skipTour();
          }
        }}
      >
        <defs>
          <mask id="scriffle-spotlight-mask">
            {/* Base white fill (everything visible/darkened) */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black cutout over target element */}
            {targetRect && (
              <rect
                x={targetRect.left}
                y={targetRect.top}
                width={targetRect.width}
                height={targetRect.height}
                rx={14}
                ry={14}
                fill="black"
              />
            )}
          </mask>
        </defs>

        {/* Semi-transparent dark backdrop masked with the cutout */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.65)"
          mask="url(#scriffle-spotlight-mask)"
          className="transition-all duration-200"
        />
      </svg>

      {/* Pulsing Outline Ring over the targeted element */}
      {targetRect && (
        <div
          className={`absolute pointer-events-none rounded-2xl border-2 transition-all duration-200 ${ringBorderClass}`}
          style={{
            top: `${targetRect.top}px`,
            left: `${targetRect.left}px`,
            width: `${targetRect.width}px`,
            height: `${targetRect.height}px`,
          }}
        >
          {/* Subtle accent corner glow */}
          <div className={`absolute -inset-1 rounded-2xl border animate-pulse pointer-events-none ${ringGlowClass}`} />
        </div>
      )}
    </div>
  );
};
