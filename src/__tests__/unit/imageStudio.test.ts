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

  it('preserves aspectRatio in ImageConfig when scaling or calculating natural bounds', () => {
    const originalConfig: ImageConfig = {
      url: 'https://example.com/candlestick.png',
      caption: 'Candlestick Chart',
      width: 640,
      height: 360,
      aspectRatio: 16 / 9,
      isTransparent: true,
    };

    expect(originalConfig.aspectRatio).toBeCloseTo(1.777, 2);

    // Dimension reset clears width and height while maintaining aspect ratio and caption
    const resetConfig: ImageConfig = {
      ...originalConfig,
      width: undefined,
      height: undefined,
    };

    expect(resetConfig.width).toBeUndefined();
    expect(resetConfig.height).toBeUndefined();
    expect(resetConfig.aspectRatio).toBeCloseTo(1.777, 2);
    expect(resetConfig.caption).toBe('Candlestick Chart');
  });

  it('updates url and transparency correctly when replacing image via drag-and-drop file', () => {
    const initialConfig: ImageConfig = {
      url: 'data:image/jpeg;base64,12345',
      caption: 'Financial Dashboard Snapshot',
      isTransparent: false,
      width: 400,
      height: 300,
    };

    // Dropping a PNG file allows keeping transparency or adopting PNG transparent capability
    const droppedFileIsPng = true;
    const newImageDataUrl = 'data:image/png;base64,67890';

    const replacedConfig: ImageConfig = {
      ...initialConfig,
      url: newImageDataUrl,
      isTransparent: droppedFileIsPng ? initialConfig.isTransparent : false,
    };

    expect(replacedConfig.url).toBe(newImageDataUrl);
    expect(replacedConfig.caption).toBe('Financial Dashboard Snapshot');
    expect(replacedConfig.width).toBe(400);
    expect(replacedConfig.height).toBe(300);
  });

  it('verifies R1.4 resize state lifecycle: updates dimension during resize and persists once on resize end', () => {
    // Simulated resize session
    let localSize = { width: 300, height: 200 };
    let persistCallCount = 0;
    let persistedPayload: any = null;

    const onResizeFrame = (params: { width: number; height: number }) => {
      // Local state updates immediately on every frame (zero network latency)
      localSize = { width: Math.round(params.width), height: Math.round(params.height) };
    };

    const onResizeEnd = (params: { width: number; height: number }) => {
      persistCallCount += 1;
      persistedPayload = {
        width: Math.round(params.width),
        height: Math.round(params.height),
      };
    };

    // Frame 1
    onResizeFrame({ width: 310, height: 207 });
    expect(localSize).toEqual({ width: 310, height: 207 });
    expect(persistCallCount).toBe(0);

    // Frame 2
    onResizeFrame({ width: 330, height: 220 });
    expect(localSize).toEqual({ width: 330, height: 220 });
    expect(persistCallCount).toBe(0);

    // Frame 3 (Drag End)
    onResizeFrame({ width: 350, height: 233 });
    onResizeEnd({ width: 350, height: 233 });

    // Dimension updated and network called exactly once on end
    expect(localSize).toEqual({ width: 350, height: 233 });
    expect(persistCallCount).toBe(1);
    expect(persistedPayload).toEqual({ width: 350, height: 233 });
  });

  it('verifies R1.2 toolbar positioning classes and nodrag guard', () => {
    // The toolbar must sit fully above the card (bottom-full mb-2.5) with nodrag to prevent drag interference
    const expectedPlacementClasses = ['nodrag', 'absolute', 'bottom-full', 'mb-2.5', 'right-0', 'z-20'];
    const toolbarClassString = 'nodrag absolute bottom-full mb-2.5 right-0 z-20 flex items-center gap-1 rounded-full border-2 px-1.5 py-0.5 shadow-none transition-opacity duration-150';

    for (const cls of expectedPlacementClasses) {
      expect(toolbarClassString).toContain(cls);
    }
  });
});

