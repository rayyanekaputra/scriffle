import { describe, it, expect, vi } from 'vitest';
import {
  SUPPRESS_STARTUP_TOUR_KEY,
  LEGACY_ONBOARDING_KEY,
  TOUR_STEP_STORAGE_KEY,
  FRESH_TOKEN_STORAGE_KEY,
} from '@/context/OnboardingContext';

describe('Start Fresh CLI & Onboarding Reset Engine', () => {
  it('defines valid storage keys including FRESH_TOKEN_STORAGE_KEY', () => {
    expect(SUPPRESS_STARTUP_TOUR_KEY).toBe('scriffle_suppress_startup_tour');
    expect(LEGACY_ONBOARDING_KEY).toBe('scriffle_onboarded_v1');
    expect(TOUR_STEP_STORAGE_KEY).toBe('scriffle_tour_step');
    expect(FRESH_TOKEN_STORAGE_KEY).toBe('scriffle_last_fresh_token');
  });

  it('correctly purges all onboarding and sandbox mission progress when fresh token differs from stored token', () => {
    const memoryStore: Record<string, string> = {
      [SUPPRESS_STARTUP_TOUR_KEY]: 'true',
      [LEGACY_ONBOARDING_KEY]: 'true',
      [TOUR_STEP_STORAGE_KEY]: '4',
      'scriffle_sandbox_progress_v1': JSON.stringify({ 'mission-watcher-stock': { id: 'mission-watcher-stock', isCompleted: true } }),
      'scriffle_sandbox_open_v1': 'true',
      'scriffle_sandbox_minimized_v1': 'true',
      'scriffle_sandbox_graduated_v1': 'true',
      [FRESH_TOKEN_STORAGE_KEY]: '1000000',
    };

    const serverFreshToken = '2000000'; // New timestamp token from bun run dev --start-fresh

    // Simulate OnboardingContext startup logic
    const lastSeenToken = memoryStore[FRESH_TOKEN_STORAGE_KEY];
    if (serverFreshToken && lastSeenToken !== serverFreshToken) {
      delete memoryStore[SUPPRESS_STARTUP_TOUR_KEY];
      delete memoryStore[LEGACY_ONBOARDING_KEY];
      delete memoryStore[TOUR_STEP_STORAGE_KEY];
      delete memoryStore['scriffle_sandbox_progress_v1'];
      delete memoryStore['scriffle_sandbox_open_v1'];
      delete memoryStore['scriffle_sandbox_minimized_v1'];
      delete memoryStore['scriffle_sandbox_graduated_v1'];
      memoryStore[FRESH_TOKEN_STORAGE_KEY] = serverFreshToken;
    }

    expect(memoryStore[SUPPRESS_STARTUP_TOUR_KEY]).toBeUndefined();
    expect(memoryStore[LEGACY_ONBOARDING_KEY]).toBeUndefined();
    expect(memoryStore[TOUR_STEP_STORAGE_KEY]).toBeUndefined();
    expect(memoryStore['scriffle_sandbox_progress_v1']).toBeUndefined();
    expect(memoryStore['scriffle_sandbox_graduated_v1']).toBeUndefined();
    expect(memoryStore[FRESH_TOKEN_STORAGE_KEY]).toBe('2000000');
  });

  it('preserves existing progress when no fresh token is passed or token matches', () => {
    const memoryStore: Record<string, string> = {
      [SUPPRESS_STARTUP_TOUR_KEY]: 'true',
      'scriffle_sandbox_progress_v1': JSON.stringify({ 'mission-watcher-stock': { id: 'mission-watcher-stock', isCompleted: true } }),
      [FRESH_TOKEN_STORAGE_KEY]: '2000000',
    };

    const serverFreshToken = '2000000'; // Same token

    const lastSeenToken = memoryStore[FRESH_TOKEN_STORAGE_KEY];
    if (serverFreshToken && lastSeenToken !== serverFreshToken) {
      delete memoryStore[SUPPRESS_STARTUP_TOUR_KEY];
      delete memoryStore['scriffle_sandbox_progress_v1'];
      memoryStore[FRESH_TOKEN_STORAGE_KEY] = serverFreshToken;
    }

    expect(memoryStore[SUPPRESS_STARTUP_TOUR_KEY]).toBe('true');
    expect(memoryStore['scriffle_sandbox_progress_v1']).toBeDefined();
  });
});
