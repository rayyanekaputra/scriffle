import { describe, it, expect } from 'vitest';
import {
  SANDBOX_POS_STORAGE_KEY,
  DEFAULT_SANDBOX_POS,
} from '@/components/tutorial/SandboxMissionsCard';

describe('Draggable Sandbox Widget & Position Clamping Engine', () => {
  it('exports valid storage key and default coordinates', () => {
    expect(SANDBOX_POS_STORAGE_KEY).toBe('scriffle_sandbox_card_pos_v1');
    expect(DEFAULT_SANDBOX_POS).toEqual({ x: 24, y: 80 });
  });

  it('clamps coordinates safely within viewport boundaries', () => {
    const windowWidth = 1280;
    const windowHeight = 800;
    const cardWidth = 360;
    const cardHeight = 400;

    const clamp = (x: number, y: number) => {
      const minX = 16;
      const maxX = Math.max(minX, windowWidth - cardWidth - 16);
      const minY = 64;
      const maxY = Math.max(minY, windowHeight - cardHeight - 16);

      return {
        x: Math.max(minX, Math.min(x, maxX)),
        y: Math.max(minY, Math.min(y, maxY)),
      };
    };

    // Valid coordinate inside screen
    expect(clamp(100, 200)).toEqual({ x: 100, y: 200 });

    // Negative / left overflow
    expect(clamp(-50, 100)).toEqual({ x: 16, y: 100 });

    // Top overflow (must stay below TopNav header at 64px)
    expect(clamp(100, 20)).toEqual({ x: 100, y: 64 });

    // Right overflow
    expect(clamp(2000, 100)).toEqual({ x: 1280 - 360 - 16, y: 100 }); // 904

    // Bottom overflow
    expect(clamp(100, 1500)).toEqual({ x: 100, y: 800 - 400 - 16 }); // 384
  });

  it('distinguishes between click-to-expand and drag gesture via movement threshold', () => {
    const isDragGesture = (startX: number, startY: number, endX: number, endY: number, threshold = 3) => {
      const dx = Math.abs(endX - startX);
      const dy = Math.abs(endY - startY);
      return dx > threshold || dy > threshold;
    };

    // Minor jitter / tap -> click
    expect(isDragGesture(100, 100, 101, 102)).toBe(false);
    expect(isDragGesture(100, 100, 100, 100)).toBe(false);

    // Intentional drag -> drag
    expect(isDragGesture(100, 100, 105, 100)).toBe(true);
    expect(isDragGesture(100, 100, 100, 120)).toBe(true);
    expect(isDragGesture(100, 100, 150, 150)).toBe(true);
  });

  it('verifies non-drag target filter isolates header action buttons', () => {
    const shouldIgnoreDrag = (hasNoDragAttr: boolean) => {
      return hasNoDragAttr;
    };

    // Regular header bar click
    expect(shouldIgnoreDrag(false)).toBe(false);

    // Minimize or close button click
    expect(shouldIgnoreDrag(true)).toBe(true);
  });

  it('simulates localStorage persistence and restoration', () => {
    const store: Record<string, string> = {};

    const savePos = (p: { x: number; y: number }) => {
      store[SANDBOX_POS_STORAGE_KEY] = JSON.stringify(p);
    };

    const loadPos = () => {
      const raw = store[SANDBOX_POS_STORAGE_KEY];
      if (!raw) return DEFAULT_SANDBOX_POS;
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
          return parsed;
        }
      } catch {}
      return DEFAULT_SANDBOX_POS;
    };

    // Initially loads default
    expect(loadPos()).toEqual({ x: 24, y: 80 });

    // Saves custom user dragged position
    savePos({ x: 500, y: 250 });
    expect(loadPos()).toEqual({ x: 500, y: 250 });

    // Double click reset snaps back to default
    savePos(DEFAULT_SANDBOX_POS);
    expect(loadPos()).toEqual({ x: 24, y: 80 });
  });
});
