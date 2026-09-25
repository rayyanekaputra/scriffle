import { describe, it, expect } from 'vitest';
import { ImageConfig } from '@/types/canvas';
import { extractNodeSearchText, searchCanvasNodes } from '@/lib/searchIndexer';

describe('ImageNode Configuration & Search Indexer', () => {
  it('extracts default image search tokens when no caption is provided', () => {
    const node = {
      id: 'img-1',
      canvasId: 'test-canvas',
      type: 'image' as const,
      position: { x: 100, y: 100 },
      config: {
        url: 'https://example.com/chart.png',
        isTransparent: true,
      } as ImageConfig,
    };

    const extracted = extractNodeSearchText(node);
    expect(extracted.title).toBe('Image');
    expect(extracted.subtitle).toBe('Transparent PNG');
    expect(extracted.badge).toBe('Image');
    expect(extracted.searchTokens).toContain('image');
    expect(extracted.searchTokens).toContain('photo');
  });

  it('indexes custom caption and matches in searchCanvasNodes', () => {
    const node = {
      id: 'img-2',
      canvasId: 'test-canvas',
      type: 'image' as const,
      position: { x: 200, y: 200 },
      config: {
        url: 'https://example.com/bbca-technical.png',
        caption: 'BBCA Q3 Technical Resistance Breakout',
        isTransparent: false,
      } as ImageConfig,
    };

    const extracted = extractNodeSearchText(node);
    expect(extracted.title).toBe('BBCA Q3 Technical Resistance Breakout');
    expect(extracted.subtitle).toBe('Canvas image');
    expect(extracted.searchTokens).toContain('BBCA Q3 Technical Resistance Breakout');

    const results = searchCanvasNodes([node], 'breakout');
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('img-2');
    expect(results[0].title).toBe('BBCA Q3 Technical Resistance Breakout');
  });

  it('correctly reflects transparency state toggle in config', () => {
    const transparentConfig: ImageConfig = {
      url: 'https://example.com/logo.png',
      isTransparent: true,
      width: 400,
      height: 300,
    };

    const borderedConfig: ImageConfig = {
      ...transparentConfig,
      isTransparent: false,
    };

    expect(transparentConfig.isTransparent).toBe(true);
    expect(borderedConfig.isTransparent).toBe(false);
    expect(borderedConfig.width).toBe(400);
  });
});
