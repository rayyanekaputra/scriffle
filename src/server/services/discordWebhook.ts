import { MarketEvent } from '@/types/canvas';

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordWebhookPayload {
  username?: string;
  avatar_url?: string;
  content?: string;
  embeds?: Array<{
    title: string;
    description?: string;
    color?: number;
    fields?: DiscordEmbedField[];
    footer?: {
      text: string;
      icon_url?: string;
    };
    timestamp?: string;
  }>;
}

/**
 * Validates whether a URL is a legitimate Discord webhook endpoint.
 */
export function isValidDiscordWebhookUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url.trim());
    return (
      (parsed.hostname === 'discord.com' ||
        parsed.hostname === 'discordapp.com' ||
        parsed.hostname === 'canary.discord.com' ||
        parsed.hostname === 'ptb.discord.com') &&
      parsed.pathname.startsWith('/api/webhooks/')
    );
  } catch {
    return false;
  }
}

/**
 * Dispatches a formatted financial alert to a Discord webhook.
 */
export async function sendDiscordAlert({
  webhookUrl,
  customMessage,
  marketEvent,
  canvasName,
  botName = 'Scriffle Market Bot',
  includeMarketStats = true,
}: {
  webhookUrl: string;
  customMessage?: string;
  marketEvent?: MarketEvent;
  canvasName?: string;
  botName?: string;
  includeMarketStats?: boolean;
}): Promise<{ success: boolean; statusCode: number; error?: string }> {
  const cleanUrl = webhookUrl?.trim();
  if (!isValidDiscordWebhookUrl(cleanUrl)) {
    return {
      success: false,
      statusCode: 400,
      error: 'Invalid Discord webhook URL format. Must start with https://discord.com/api/webhooks/...',
    };
  }

  // Mint (#10B981) for gains, Coral (#FF5B79) for drops, Electric Blue (#0050FF) for neutral/info
  const priceChange = marketEvent?.price_change ?? 0;
  const isGain = priceChange > 0;
  const isLoss = priceChange < 0;
  const color = isGain ? 0x10b981 : isLoss ? 0xff5b79 : 0x0050ff;

  const fields: DiscordEmbedField[] = [];

  if (marketEvent && includeMarketStats) {
    fields.push(
      {
        name: 'Ticker',
        value: `**${marketEvent.symbol}**`,
        inline: true,
      },
      {
        name: 'Last Price',
        value: `Rp ${marketEvent.price.toLocaleString('id-ID')}`,
        inline: true,
      },
      {
        name: 'Change',
        value: `${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%`,
        inline: true,
      }
    );

    if (marketEvent.volume) {
      const volumeM = (marketEvent.volume / 1_000_000).toFixed(1);
      fields.push({
        name: 'Volume',
        value: `${volumeM}M shares`,
        inline: true,
      });
    }

    if (marketEvent.prevPrice) {
      fields.push({
        name: 'Previous Close',
        value: `Rp ${marketEvent.prevPrice.toLocaleString('id-ID')}`,
        inline: true,
      });
    }
  }

  if (canvasName) {
    fields.push({
      name: 'Canvas Board',
      value: `📋 ${canvasName}`,
      inline: true,
    });
  }

  const title = marketEvent
    ? `⚡ Scriffle Alert: ${marketEvent.symbol} (${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%)`
    : '⚡ Scriffle Market Alert';

  const payload: DiscordWebhookPayload = {
    username: botName || 'Scriffle Market Bot',
    avatar_url: 'https://raw.githubusercontent.com/rayyanekaputra/scriffle/main/public/favicon.ico',
    embeds: [
      {
        title,
        description: customMessage || undefined,
        color,
        fields: fields.length > 0 ? fields : undefined,
        footer: {
          text: 'Scriffle • Autonomous Financial Canvas for IDX',
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(cleanUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok || res.status === 204) {
      return { success: true, statusCode: res.status };
    }

    const errText = await res.text();
    return {
      success: false,
      statusCode: res.status,
      error: `Discord responded with HTTP ${res.status}: ${errText.slice(0, 120)}`,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    return {
      success: false,
      statusCode: 500,
      error: err.name === 'AbortError' ? 'Webhook request timed out after 6 seconds' : (err.message || 'Network dispatch failure'),
    };
  }
}
