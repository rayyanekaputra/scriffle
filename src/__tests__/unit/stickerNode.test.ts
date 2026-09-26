import { describe, it, expect } from 'vitest';
import {
  resolveStickerColor,
  COLOR_STYLES,
  COLOR_ALIASES,
  StickerColor,
} from '@/components/canvas/nodes/StickerNode';

describe('StickerNode Color Safety & Alias Resolver', () => {
  it('resolves canonical palette colors accurately', () => {
    const canonical: StickerColor[] = ['green', 'red', 'blue', 'amber', 'purple', 'teal', 'slate'];
    canonical.forEach((c) => {
      expect(resolveStickerColor(c)).toBe(c);
      expect(COLOR_STYLES[c]).toBeDefined();
      expect(COLOR_STYLES[c].bg).toBeDefined();
      expect(COLOR_STYLES[c].border).toBeDefined();
      expect(COLOR_STYLES[c].text).toBeDefined();
      expect(COLOR_STYLES[c].dot).toBeDefined();
    });
  });

  it('resolves note color aliases (mint, pink, emerald, indigo, etc.) without throwing', () => {
    expect(resolveStickerColor('mint')).toBe('green');
    expect(resolveStickerColor('emerald')).toBe('green');
    expect(resolveStickerColor('pink')).toBe('red');
    expect(resolveStickerColor('rose')).toBe('red');
    expect(resolveStickerColor('indigo')).toBe('blue');
    expect(resolveStickerColor('yellow')).toBe('amber');
    expect(resolveStickerColor('cyan')).toBe('teal');
    expect(resolveStickerColor('gray')).toBe('slate');
  });

  it('gracefully falls back to blue for null, undefined, or unknown colors', () => {
    expect(resolveStickerColor(undefined)).toBe('blue');
    expect(resolveStickerColor(null)).toBe('blue');
    expect(resolveStickerColor('')).toBe('blue');
    expect(resolveStickerColor('random-invalid-color')).toBe('blue');
  });

  it('guarantees that every resolved color exists in COLOR_STYLES and has valid CSS classes', () => {
    const testCases = [
      'mint',
      'pink',
      'green',
      'blue',
      'invalid',
      undefined,
      null,
      'YELLOW',
      'EMERALD',
    ];

    testCases.forEach((input) => {
      const resolved = resolveStickerColor(input);
      const style = COLOR_STYLES[resolved];
      expect(style).toBeDefined();
      expect(style.bg.length).toBeGreaterThan(0);
      expect(style.border.length).toBeGreaterThan(0);
      expect(style.text.length).toBeGreaterThan(0);
    });
  });
});
