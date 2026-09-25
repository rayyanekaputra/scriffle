'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TOUR_STEPS, TourStep } from '@/components/onboarding/tourStepsConfig';

interface OnboardingContextType {
  isActive: boolean;
  currentStepIndex: number;
  currentStep: TourStep;
  totalSteps: number;
  hasCompleted: boolean;
  isMinimized: boolean;
  resumeStepIndex: number;
  startTour: (fromStep?: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  skipTour: () => void;
  completeTour: () => void;
  resumeTour: () => void;
  dismissResumePill: () => void;
}

const ONBOARDING_STORAGE_KEY = 'scriffle_onboarded_v1';
const TOUR_STEP_STORAGE_KEY = 'scriffle_tour_step';

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [hasCompleted, setHasCompleted] = useState<boolean>(true); // default true until client check
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [resumeStepIndex, setResumeStepIndex] = useState<number>(0);

  // Check client-side localStorage on initial mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
      setHasCompleted(completed);
      
      const savedStep = parseInt(localStorage.getItem(TOUR_STEP_STORAGE_KEY) || '0', 10);
      if (!isNaN(savedStep) && savedStep > 0 && savedStep < TOUR_STEPS.length) {
        setResumeStepIndex(savedStep);
      }

      // If user is brand new (never completed or skipped), start the tour automatically after a gentle 400ms delay
      if (!completed) {
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
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      localStorage.removeItem(TOUR_STEP_STORAGE_KEY);
    } catch {}
  }, []);

  const skipTour = useCallback(() => {
    setIsActive(false);
    setIsMinimized(true);
    setResumeStepIndex(currentStepIndex);
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
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
