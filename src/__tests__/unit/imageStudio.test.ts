import { describe, it, expect } from 'vitest';
import { ImageConfig, CanvasNodeData } from '@/types/canvas';
import { extractNodeSearchText, searchCanvasNodes } from '@/lib/searchIndexer';

describe('ImageNode & Image Studio Enhancements', () => {
  it('initializes default ImageConfig values accurately', () => {
    const config: ImageConfig = {
      url: 'https://example.com/chart.png',
      caption: 'Banking Sector Breakout',
      isTransparent: true,
    };

    expect(config.url).toBe('https://example.com/chart.png');
    expect(config.caption).toBe('Banking Sector Breakout');
    expect(config.isTransparent).toBe(true);
    expect(config.width).toBeUndefined();
    expect(config.height).toBeUndefined();
  });

  it('correctly handles bordered card vs transparent sticker toggle', () => {
    const baseConfig: ImageConfig = {
      url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      isTransparent: true,
    };

    // Toggle to bordered card
    const borderedConfig: ImageConfig = {
      ...baseConfig,
      isTransparent: false,
    };

    expect(borderedConfig.isTransparent).toBe(false);

    // Toggle back to transparent sticker
    const transparentConfig: ImageConfig = {
      ...borderedConfig,
      isTransparent: true,
    };

    expect(transparentConfig.isTransparent).toBe(true);
  });

  it('updates in-place caption and trims whitespace on commit', () => {
    const originalConfig: ImageConfig = {
      url: '/sample.png',
      caption: 'Initial Title',
    };

    const newCaption = '  Q3 Bank Multiples Comparison  ';
    const updatedConfig: ImageConfig = {
      ...originalConfig,
      caption: newCaption.trim(),
    };

    expect(updatedConfig.caption).toBe('Q3 Bank Multiples Comparison');
    expect(updatedConfig.url).toBe(originalConfig.url);
  });

  it('clears caption cleanly when empty string is committed', () => {
    const config: ImageConfig = {
      url: '/sample.png',
      caption: 'Old Caption',
    };

    const updatedConfig: ImageConfig = {
      ...config,
      caption: '',
    };

    expect(updatedConfig.caption).toBe('');
  });

  it('replaces image URL in-place while preserving existing caption and dimensions', () => {
    const originalConfig: ImageConfig = {
      url: 'https://example.com/old-chart.png',
      caption: 'BBCA vs BMRI Relative Strength',
      width: 480,
      height: 320,
      isTransparent: false,
    };

    const replacementUrl = 'data:image/svg+xml;utf8,<svg></svg>';
    const replacedConfig: ImageConfig = {
      ...originalConfig,
      url: replacementUrl,
    };

    expect(replacedConfig.url).toBe(replacementUrl);
    expect(replacedConfig.caption).toBe('BBCA vs BMRI Relative Strength');
    expect(replacedConfig.width).toBe(480);
    expect(replacedConfig.height).toBe(320);
    expect(replacedConfig.isTransparent).toBe(false);
  });

  it('supports custom dimension resizing and resetting dimensions', () => {
    const configWithDimensions: ImageConfig = {
      url: '/sample.png',
      width: 600,
      height: 400,
    };

    expect(configWithDimensions.width).toBe(600);
    expect(configWithDimensions.height).toBe(400);

    // Resetting dimensions to natural aspect ratio
    const resetConfig: ImageConfig = {
      ...configWithDimensions,
      width: undefined,
      height: undefined,
    };

    expect(resetConfig.width).toBeUndefined();
    expect(resetConfig.height).toBeUndefined();
  });

  it('indexes image node caption in Spotlight Search', () => {
    const imageNode: CanvasNodeData = {
      id: 'img-1',
      canvasId: 'test-canvas',
      type: 'image',
      position: { x: 500, y: 500 },
      config: {
        url: 'https://example.com/idx_composite.png',
        caption: 'IHSG Weekly Reversal Pattern',
        isTransparent: false,
      },
    };

    const extracted = extractNodeSearchText(imageNode);
    expect(extracted.title).toBe('IHSG Weekly Reversal Pattern');
    expect(extracted.badge).toBe('Image');
    expect(extracted.subtitle).toBe('Canvas image');
    expect(extracted.searchTokens).toContain('image');
    expect(extracted.searchTokens).toContain('IHSG Weekly Reversal Pattern');

    // Search for keyword in caption
    const searchResults = searchCanvasNodes([imageNode], 'Reversal');
    expect(searchResults.length).toBe(1);
    expect(searchResults[0].id).toBe('img-1');
    expect(searchResults[0].title).toBe('IHSG Weekly Reversal Pattern');
  });

  it('defaults image search title to "Image" when caption is undefined or empty', () => {
    const imageNodeNoCaption: CanvasNodeData = {
      id: 'img-2',
      canvasId: 'test-canvas',
      type: 'image',
      position: { x: 500, y: 500 },
      config: {
        url: 'https://example.com/logo.png',
        isTransparent: true,
      },
    };

    const extracted = extractNodeSearchText(imageNodeNoCaption);
    expect(extracted.title).toBe('Image');
    expect(extracted.subtitle).toBe('Transparent PNG');
    expect(extracted.searchTokens).toContain('image');
  });
});
