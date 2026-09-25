import { describe, it, expect } from 'vitest';
import { TOUR_STEPS, TourStep } from '@/components/onboarding/tourStepsConfig';

describe('Interactive Onboarding Spotlight Tour (tourStepsConfig.ts)', () => {
  it('defines exactly 5 tour steps matching the onboarding arc', () => {
    expect(TOUR_STEPS).toBeDefined();
    expect(TOUR_STEPS.length).toBe(5);
  });

  it('contains valid metadata, non-empty titles, descriptions, and MingCute icons for all steps', () => {
    TOUR_STEPS.forEach((step, index) => {
      expect(step.id).toBeTypeOf('string');
      expect(step.id.length).toBeGreaterThan(0);
      expect(step.title).toBeTypeOf('string');
      expect(step.title.length).toBeGreaterThan(0);
      expect(step.description).toBeTypeOf('string');
      expect(step.description.length).toBeGreaterThan(10);
      expect(step.badge).toBe(`Step ${index + 1} of 5`);
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

  it('configures proper target selectors for canvas, simulation bar, and top actions', () => {
    const welcomeStep = TOUR_STEPS[0];
    expect(welcomeStep.targetSelector).toBeUndefined(); // Center modal intro
    expect(welcomeStep.placement).toBe('center');

    const logicStep = TOUR_STEPS.find((s) => s.id === 'connections-and-logic');
    expect(logicStep?.targetSelector).toBe('[data-tour="market-canvas"]');

    const simStep = TOUR_STEPS.find((s) => s.id === 'simulation-and-stream');
    expect(simStep?.targetSelector).toBe('[data-tour="simulation-bar"]');

    const shortcutStep = TOUR_STEPS.find((s) => s.id === 'superpowers-and-shortcuts');
    expect(shortcutStep?.targetSelector).toBe('[data-tour="top-nav-actions"]');
  });

  it('simulates step navigation bounds, clamps, and step index progression', () => {
    let currentStep = 0;
    const maxSteps = TOUR_STEPS.length;

    // Simulate nextStep
    const next = (curr: number) => Math.min(curr + 1, maxSteps - 1);
    const prev = (curr: number) => Math.max(curr - 1, 0);
    const jump = (idx: number) => Math.max(0, Math.min(idx, maxSteps - 1));

    expect(next(0)).toBe(1);
    expect(next(3)).toBe(4);
    expect(next(4)).toBe(4); // Clamped at last step

    expect(prev(4)).toBe(3);
    expect(prev(1)).toBe(0);
    expect(prev(0)).toBe(0); // Clamped at 0

    expect(jump(-5)).toBe(0);
    expect(jump(10)).toBe(4);
    expect(jump(2)).toBe(2);
  });
});
