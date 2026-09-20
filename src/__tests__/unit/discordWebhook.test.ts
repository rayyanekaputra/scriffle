import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isValidDiscordWebhookUrl,
  sendDiscordAlert,
} from '@/server/services/discordWebhook';
import { MarketEvent } from '@/types/canvas';

describe('Discord Webhook Service (discordWebhook.ts)', () => {
  const origFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = origFetch;
    vi.restoreAllMocks();
  });

  describe('isValidDiscordWebhookUrl validation', () => {
    it('accepts valid discord.com webhook URLs', () => {
      expect(
        isValidDiscordWebhookUrl(
          'https://discord.com/api/webhooks/1234567890/abcdefghijklmnopqrstuvwxyz'
        )
      ).toBe(true);
    });

    it('accepts valid discordapp.com webhook URLs', () => {
      expect(
        isValidDiscordWebhookUrl(
          'https://discordapp.com/api/webhooks/1234567890/abcdefghijklmnopqrstuvwxyz'
        )
      ).toBe(true);
    });

    it('accepts valid canary.discord.com and ptb.discord.com webhook URLs', () => {
      expect(
        isValidDiscordWebhookUrl(
          'https://canary.discord.com/api/webhooks/1234567890/token'
        )
      ).toBe(true);
      expect(
        isValidDiscordWebhookUrl(
          'https://ptb.discord.com/api/webhooks/1234567890/token'
        )
      ).toBe(true);
    });

    it('handles leading and trailing whitespace safely', () => {
      expect(
        isValidDiscordWebhookUrl(
          '  https://discord.com/api/webhooks/123/abc  '
        )
      ).toBe(true);
    });

    it('rejects invalid or deceptive webhook URLs', () => {
      expect(isValidDiscordWebhookUrl(undefined)).toBe(false);
      expect(isValidDiscordWebhookUrl('')).toBe(false);
      expect(isValidDiscordWebhookUrl('not-a-url')).toBe(false);
      expect(isValidDiscordWebhookUrl('https://evil.com/api/webhooks/123/abc')).toBe(false);
      expect(isValidDiscordWebhookUrl('https://discord.com/channels/12345/67890')).toBe(false);
      expect(isValidDiscordWebhookUrl('https://discord.com/api/guilds/123')).toBe(false);
    });
  });

  describe('sendDiscordAlert payload generation & HTTP dispatch', () => {
    const validUrl = 'https://discord.com/api/webhooks/123456789/test-token';

    const testEventGain: MarketEvent = {
      symbol: 'BBCA',
      price: 10450,
      prevPrice: 9840,
      price_change: 6.2,
      volume: 45200000,
      avg_volume: 28100000,
      timestamp: '14:30:00',
    };

    const testEventLoss: MarketEvent = {
      symbol: 'GOTO',
      price: 52,
      prevPrice: 56,
      price_change: -7.14,
      volume: 120000000,
      avg_volume: 85000000,
      timestamp: '14:30:00',
    };

    it('rejects immediately when given an invalid webhook URL', async () => {
      const result = await sendDiscordAlert({
        webhookUrl: 'https://invalid-domain.com/hook',
        marketEvent: testEventGain,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(400);
      expect(result.error).toContain('Invalid Discord webhook URL');
    });

    it('formats positive breakout with Mint color (0x10B981) and sends rich fields', async () => {
      let capturedBody: any = null;

      globalThis.fetch = vi.fn().mockImplementation(async (url, opts) => {
        capturedBody = JSON.parse(opts.body);
        return new Response(null, { status: 204 });
      });

      const result = await sendDiscordAlert({
        webhookUrl: validUrl,
        customMessage: '🚀 BBCA Resistance Breakout Triggered!',
        marketEvent: testEventGain,
        canvasName: 'Banking Sector Trio',
        botName: 'Scriffle Alpha Bot',
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(204);
      expect(capturedBody).toBeDefined();
      expect(capturedBody.username).toBe('Scriffle Alpha Bot');

      const embed = capturedBody.embeds[0];
      expect(embed).toBeDefined();
      expect(embed.title).toContain('BBCA (+6.20%)');
      expect(embed.description).toBe('🚀 BBCA Resistance Breakout Triggered!');
      expect(embed.color).toBe(0x10b981); // Mint green for positive move

      const tickerField = embed.fields.find((f: any) => f.name === 'Ticker');
      const priceField = embed.fields.find((f: any) => f.name === 'Last Price');
      const changeField = embed.fields.find((f: any) => f.name === 'Change');
      const canvasField = embed.fields.find((f: any) => f.name === 'Canvas Board');

      expect(tickerField?.value).toBe('**BBCA**');
      expect(priceField?.value).toBe('Rp 10.450');
      expect(changeField?.value).toBe('+6.20%');
      expect(canvasField?.value).toBe('📋 Banking Sector Trio');
    });

    it('formats negative dip with Coral color (0xFF5B79)', async () => {
      let capturedBody: any = null;

      globalThis.fetch = vi.fn().mockImplementation(async (url, opts) => {
        capturedBody = JSON.parse(opts.body);
        return new Response(null, { status: 204 });
      });

      const result = await sendDiscordAlert({
        webhookUrl: validUrl,
        marketEvent: testEventLoss,
      });

      expect(result.success).toBe(true);
      const embed = capturedBody.embeds[0];
      expect(embed.title).toContain('GOTO (-7.14%)');
      expect(embed.color).toBe(0xff5b79); // Coral for negative move
    });

    it('handles Discord API errors (e.g. 404 Unknown Webhook, 429 Rate Limit) gracefully', async () => {
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        return new Response(
          JSON.stringify({ message: 'Unknown Webhook', code: 10015 }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      });

      const result = await sendDiscordAlert({
        webhookUrl: validUrl,
        marketEvent: testEventGain,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(404);
      expect(result.error).toContain('Discord responded with HTTP 404');
    });

    it('handles network exceptions and timeout safely without unhandled rejections', async () => {
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        throw new Error('Connection refused to discord.com');
      });

      const result = await sendDiscordAlert({
        webhookUrl: validUrl,
        marketEvent: testEventGain,
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(500);
      expect(result.error).toContain('Connection refused to discord.com');
    });
  });
});
