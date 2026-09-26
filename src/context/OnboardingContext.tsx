'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TOUR_STEPS, TourStep } from '@/components/onboarding/tourStepsConfig';

export const SUPPRESS_STARTUP_TOUR_KEY = 'scriffle_suppress_startup_tour';
export const LEGACY_ONBOARDING_KEY = 'scriffle_onboarded_v1';
export const TOUR_STEP_STORAGE_KEY = 'scriffle_tour_step';
export const FRESH_TOKEN_STORAGE_KEY = 'scriffle_last_fresh_token';

interface OnboardingContextType {
  isActive: boolean;
  currentStepIndex: number;
  currentStep: TourStep;
  totalSteps: number;
  hasCompleted: boolean;
  isMinimized: boolean;
  resumeStepIndex: number;
  dontShowAgain: boolean;
  setDontShowAgain: (val: boolean) => void;
  startTour: (fromStep?: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  skipTour: () => void;
  completeTour: () => void;
  resumeTour: () => void;
  dismissResumePill: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [hasCompleted, setHasCompleted] = useState<boolean>(true); // default true until client check
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [resumeStepIndex, setResumeStepIndex] = useState<number>(0);
  const [dontShowAgain, setDontShowAgainState] = useState<boolean>(false);

  // Check client-side localStorage on initial mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      // 0. Check if --start-fresh was used on the server
      const freshToken = process.env.NEXT_PUBLIC_START_FRESH_TOKEN;
      if (freshToken) {
        const lastSeenToken = localStorage.getItem(FRESH_TOKEN_STORAGE_KEY);
        if (lastSeenToken !== freshToken) {
          // Fresh mode token detected: purge all onboarding and sandbox storage keys
          localStorage.removeItem(SUPPRESS_STARTUP_TOUR_KEY);
          localStorage.removeItem(LEGACY_ONBOARDING_KEY);
          localStorage.removeItem(TOUR_STEP_STORAGE_KEY);
          localStorage.removeItem('scriffle_sandbox_progress_v1');
          localStorage.removeItem('scriffle_sandbox_open_v1');
          localStorage.removeItem('scriffle_sandbox_minimized_v1');
          localStorage.removeItem('scriffle_sandbox_graduated_v1');
          localStorage.setItem(FRESH_TOKEN_STORAGE_KEY, freshToken);
        }
      }

      // 1. One-time migration: respect users who previously dismissed or completed the tour
      const legacyCompleted = localStorage.getItem(LEGACY_ONBOARDING_KEY);
      const existingSuppress = localStorage.getItem(SUPPRESS_STARTUP_TOUR_KEY);
      if (legacyCompleted === 'true' && existingSuppress === null) {
        localStorage.setItem(SUPPRESS_STARTUP_TOUR_KEY, 'true');
        localStorage.removeItem(LEGACY_ONBOARDING_KEY);
      }

      // 2. Read startup suppression status
      const isSuppressed = localStorage.getItem(SUPPRESS_STARTUP_TOUR_KEY) === 'true';
      setDontShowAgainState(isSuppressed);
      setHasCompleted(isSuppressed);

      // 3. Read saved step for resume pill
      const savedStep = parseInt(localStorage.getItem(TOUR_STEP_STORAGE_KEY) || '0', 10);
      if (!isNaN(savedStep) && savedStep > 0 && savedStep < TOUR_STEPS.length) {
        setResumeStepIndex(savedStep);
      }

      // 4. If not suppressed on startup, auto-launch tour after 400ms gentle delay
      if (!isSuppressed) {
        const timer = setTimeout(() => {
          setIsActive(true);
          setCurrentStepIndex(0);
          setIsMinimized(false);
        }, 400);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage may be disabled in some environments
    }
  }, []);

  const setDontShowAgain = useCallback((val: boolean) => {
    setDontShowAgainState(val);
    try {
      if (val) {
        localStorage.setItem(SUPPRESS_STARTUP_TOUR_KEY, 'true');
      } else {
        localStorage.removeItem(SUPPRESS_STARTUP_TOUR_KEY);
      }
    } catch {}
  }, []);

  const startTour = useCallback((fromStep: number = 0) => {
    const validStep = Math.max(0, Math.min(fromStep, TOUR_STEPS.length - 1));
    setCurrentStepIndex(validStep);
    setIsActive(true);
    setIsMinimized(false);
  }, []);

  const completeTour = useCallback(() => {
    setIsActive(false);
    setIsMinimized(false);
    setHasCompleted(true);
    try {
      localStorage.removeItem(TOUR_STEP_STORAGE_KEY);
    } catch {}
  }, []);

  const skipTour = useCallback(() => {
    setIsActive(false);
    setIsMinimized(true);
    setResumeStepIndex(currentStepIndex);
    try {
      localStorage.setItem(TOUR_STEP_STORAGE_KEY, currentStepIndex.toString());
    } catch {}
  }, [currentStepIndex]);

  const resumeTour = useCallback(() => {
    setIsMinimized(false);
    setCurrentStepIndex(resumeStepIndex);
    setIsActive(true);
  }, [resumeStepIndex]);

  const dismissResumePill = useCallback(() => {
    setIsMinimized(false);
    try {
      localStorage.removeItem(TOUR_STEP_STORAGE_KEY);
    } catch {}
  }, []);

  const nextStep = useCallback(() => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      const next = currentStepIndex + 1;
      setCurrentStepIndex(next);
      try {
        localStorage.setItem(TOUR_STEP_STORAGE_KEY, next.toString());
      } catch {}
    } else {
      completeTour();
    }
  }, [currentStepIndex, completeTour]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      const prev = currentStepIndex - 1;
      setCurrentStepIndex(prev);
      try {
        localStorage.setItem(TOUR_STEP_STORAGE_KEY, prev.toString());
      } catch {}
    }
  }, [currentStepIndex]);

  const goToStep = useCallback((index: number) => {
    const valid = Math.max(0, Math.min(index, TOUR_STEPS.length - 1));
    setCurrentStepIndex(valid);
    try {
      localStorage.setItem(TOUR_STEP_STORAGE_KEY, valid.toString());
    } catch {}
  }, []);

  const currentStep = TOUR_STEPS[currentStepIndex] || TOUR_STEPS[0];

  return (
    <OnboardingContext.Provider
      value={{
        isActive,
        currentStepIndex,
        currentStep,
        totalSteps: TOUR_STEPS.length,
        hasCompleted,
        isMinimized,
        resumeStepIndex,
        dontShowAgain,
        setDontShowAgain,
        startTour,
        nextStep,
        prevStep,
        goToStep,
        skipTour,
        completeTour,
        resumeTour,
        dismissResumePill,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
