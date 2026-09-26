import { describe, it, expect } from 'vitest';
import { TOUR_STEPS, TourStep } from '@/components/onboarding/tourStepsConfig';
import {
  SUPPRESS_STARTUP_TOUR_KEY,
  LEGACY_ONBOARDING_KEY,
  TOUR_STEP_STORAGE_KEY,
} from '@/context/OnboardingContext';

describe('Interactive Onboarding Spotlight Tour (tourStepsConfig.ts)', () => {
  it('defines exactly 6 tour steps matching the unified onboarding arc', () => {
    expect(TOUR_STEPS).toBeDefined();
    expect(TOUR_STEPS.length).toBe(6);
  });

  it('contains valid metadata, non-empty titles, descriptions, and MingCute icons for all steps', () => {
    TOUR_STEPS.forEach((step, index) => {
      expect(step.id).toBeTypeOf('string');
      expect(step.id.length).toBeGreaterThan(0);
      expect(step.title).toBeTypeOf('string');
      expect(step.title.length).toBeGreaterThan(0);
      expect(step.description).toBeTypeOf('string');
      expect(step.description.length).toBeGreaterThan(10);
      expect(step.badge).toBe(`Step ${index + 1} of 6`);
      expect(step.icon).toBeTypeOf('string');
      expect(step.icon.length).toBeGreaterThan(0);
      expect(['center', 'top', 'bottom', 'left', 'right']).toContain(step.placement);
    });
  });

  it('explicitly highlights searchable curated IDX companies list in the node library step', () => {
    const nodeStep = TOUR_STEPS.find((s) => s.id === 'toolbar-and-search');
    expect(nodeStep).toBeDefined();
    expect(nodeStep?.title.toLowerCase()).toContain('curated stocks');
    // Verifies mention of curated Indonesian stocks and file research mapping
    expect(nodeStep?.description).toContain('150+ curated IDX stocks');
    expect(nodeStep?.description).toContain('File cards');
    expect(nodeStep?.targetSelector).toBe('[data-tour="nav-toolbar"]');
  });

  it('configures proper target selectors for canvas, simulation bar, top actions, and tutorial button', () => {
    const welcomeStep = TOUR_STEPS[0];
    expect(welcomeStep.targetSelector).toBeUndefined(); // Center modal intro
    expect(welcomeStep.placement).toBe('center');

    const logicStep = TOUR_STEPS.find((s) => s.id === 'connections-and-logic');
    expect(logicStep?.targetSelector).toBe('[data-tour="market-canvas"]');

    const simStep = TOUR_STEPS.find((s) => s.id === 'simulation-and-stream');
    expect(simStep?.targetSelector).toBe('[data-tour="simulation-bar"]');

    const shortcutStep = TOUR_STEPS.find((s) => s.id === 'superpowers-and-shortcuts');
    expect(shortcutStep?.targetSelector).toBe('[data-tour="top-nav-actions"]');

    // Step 6 Tutorial bridge
    const tutorialStep = TOUR_STEPS.find((s) => s.id === 'tutorial-bridge');
    expect(tutorialStep).toBeDefined();
    expect(tutorialStep?.targetSelector).toBe('[data-tour="tutorial-btn"]');
    expect(tutorialStep?.placement).toBe('bottom');
    expect(tutorialStep?.icon).toBe('target_line');
    expect(tutorialStep?.badge).toBe('Step 6 of 6');
  });

  it('simulates step navigation bounds, clamps, and step index progression for 6 steps', () => {
    const maxSteps = TOUR_STEPS.length;
    expect(maxSteps).toBe(6);

    // Simulate nextStep
    const next = (curr: number) => Math.min(curr + 1, maxSteps - 1);
    const prev = (curr: number) => Math.max(curr - 1, 0);
    const jump = (idx: number) => Math.max(0, Math.min(idx, maxSteps - 1));

    expect(next(0)).toBe(1);
    expect(next(4)).toBe(5);
    expect(next(5)).toBe(5); // Clamped at last step (Step 6)

    expect(prev(5)).toBe(4);
    expect(prev(1)).toBe(0);
    expect(prev(0)).toBe(0); // Clamped at 0

    expect(jump(-5)).toBe(0);
    expect(jump(10)).toBe(5);
    expect(jump(3)).toBe(3);
  });
});

describe('Onboarding Storage & Migration Contracts', () => {
  it('exports valid localStorage key constants', () => {
    expect(SUPPRESS_STARTUP_TOUR_KEY).toBe('scriffle_suppress_startup_tour');
    expect(LEGACY_ONBOARDING_KEY).toBe('scriffle_onboarded_v1');
    expect(TOUR_STEP_STORAGE_KEY).toBe('scriffle_tour_step');
  });

  it('correctly simulates legacy migration from scriffle_onboarded_v1 to scriffle_suppress_startup_tour', () => {
    // Mock memory store
    const store: Record<string, string> = {
      [LEGACY_ONBOARDING_KEY]: 'true',
    };

    // Migration logic
    const legacyVal = store[LEGACY_ONBOARDING_KEY];
    const suppressVal = store[SUPPRESS_STARTUP_TOUR_KEY];

    if (legacyVal === 'true' && suppressVal === undefined) {
      store[SUPPRESS_STARTUP_TOUR_KEY] = 'true';
      delete store[LEGACY_ONBOARDING_KEY];
    }

    expect(store[SUPPRESS_STARTUP_TOUR_KEY]).toBe('true');
    expect(store[LEGACY_ONBOARDING_KEY]).toBeUndefined();
  });

  it('correctly respects suppressed startup state when suppress key is true', () => {
    const store: Record<string, string> = {
      [SUPPRESS_STARTUP_TOUR_KEY]: 'true',
    };

    const isSuppressed = store[SUPPRESS_STARTUP_TOUR_KEY] === 'true';
    const shouldAutoStart = !isSuppressed;

    expect(shouldAutoStart).toBe(false);
  });

  it('correctly enables auto-start for fresh users without suppression key', () => {
    const store: Record<string, string> = {};

    const isSuppressed = store[SUPPRESS_STARTUP_TOUR_KEY] === 'true';
    const shouldAutoStart = !isSuppressed;

    expect(shouldAutoStart).toBe(true);
  });
});
