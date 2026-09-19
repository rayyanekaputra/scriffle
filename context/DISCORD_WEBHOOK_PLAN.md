# 🎮 Implementation Plan: Discord Webhook Integration for Scriffle Alert Nodes

> **Feature:** Native Discord Webhook Delivery & Rich Financial Embed Cards  
> **Status:** Proposal & Architectural Plan  
> **Target Version:** Scriffle v2.2  
> **Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Bun, Prisma (SQLite), Sectors.app API v2  

---

## 1. Overview & Problem Statement

Currently, Scriffle's `AlertNode` (`alert`) supports in-app toast notifications (`channel: 'ui'`) and logs them to the Activity Feed. While the `AlertConfig` type defines placeholder channels (`'telegram' | 'webhook'`), there is no built-in dispatch service to deliver alerts to external communication channels where traders and market analysts actually collaborate.

### Why Discord First?
1. **Zero Bot Setup Overhead:** Discord webhooks require **no bot registration, no OAuth tokens, and no server hosting**. Users simply copy a webhook URL from their Discord channel settings (`Server Settings > Integrations > Webhooks`).
2. **Rich Visual Embeds:** Discord supports rich embedded cards with brand colors (e.g., Mint `#10B981` for price breakouts, Coral `#FF5B79` for dips/risks, Electric Blue `#0050FF` for AI screener alerts), structured key-value fields, timestamps, and deep links.
3. **Free & High Reliability:** Discord provides free webhook delivery with generous rate limits (5 requests per 2 seconds per webhook).

---

## 2. User Experience & Workflow

```
┌────────────────────────────────────────────────────────┐
│ 1. Configuration (EditNodeModal)                       │
│    Channel: [Discord Webhook ▼]                        │
│    Webhook URL: https://discord.com/api/webhooks/...   │
│    Message Template: 🚀 ${symbol} Breakout Alert!      │
│    [⚡ Send Test Ping]  --> ✅ "Ping sent to #idx-alerts"│
└────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ 2. Automated Event Trigger (Graph Engine BFS)          │
│    [Watcher: BBCA] -> [Condition: price_change > 5%]   │
│                             │ (if true)                │
│                             ▼                          │
│                      [AlertNode: Discord]              │
└────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ 3. Instant Discord Notification (Rich Embed)           │
│    🤖 Scriffle Market Bot                              │
│    📈 BBCA Breakout Triggered (+6.20%)                 │
│    • Price: Rp 10,450 (+Rp 610)                        │
│    • Volume: 45.2M (Avg 28.1M)                         │
│    • Canvas: Banking Sector Trio                       │
│    • Timestamp: 14:32:05 WIB                           │
└────────────────────────────────────────────────────────┘
```

---

## 3. Technical Specifications

### A. Data Schema & TypeScript Types (`src/types/canvas.ts`)

Extend `AlertConfig` and `AlertState` to support Discord webhook settings:

```typescript
export interface AlertConfig {
  channel: 'ui' | 'discord' | 'telegram' | 'webhook';
  messageTemplate?: string;
  // Discord-specific settings
  discordWebhookUrl?: string;
  botName?: string;             // Default: "Scriffle Market Bot"
  botAvatarUrl?: string;        // Optional custom avatar URL
  includeMarketStats?: boolean; // Send rich embed with price, volume, delta (default: true)
}

export interface AlertState {
  status?: 'idle' | 'passed' | 'failed' | 'error';
  lastTriggeredAt?: string;
  lastWebhookStatus?: 'success' | 'failed' | 'rate_limited';
  lastWebhookError?: string;
}
```

---

### B. Discord Webhook Service (`src/server/services/discordWebhook.ts`)

A dedicated backend service that formats and dispatches Discord Webhook payloads with built-in retry safety, rate-limit awareness, and timeout protection:

```typescript
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
    color?: number; // Integer representation of hex color
    fields?: DiscordEmbedField[];
    footer?: {
      text: string;
      icon_url?: string;
    };
    timestamp?: string; // ISO 8601
  }>;
}

/**
 * Validates whether a URL is a legitimate Discord webhook endpoint.
 */
export function isValidDiscordWebhookUrl(url?: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return (
      (parsed.hostname === 'discord.com' || parsed.hostname === 'discordapp.com') &&
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
}: {
  webhookUrl: string;
  customMessage?: string;
  marketEvent?: MarketEvent;
  canvasName?: string;
  botName?: string;
}): Promise<{ success: boolean; statusCode: number; error?: string }> {
  if (!isValidDiscordWebhookUrl(webhookUrl)) {
    return { success: false, statusCode: 400, error: 'Invalid Discord webhook URL format' };
  }

  // Determine embed color: Mint (#10B981 -> 1096065) for gain, Coral (#FF5B79 -> 16735097) for loss, Blue (#0050FF -> 20735) for neutral
  const isGain = (marketEvent?.price_change ?? 0) > 0;
  const isLoss = (marketEvent?.price_change ?? 0) < 0;
  const color = isGain ? 0x10B981 : isLoss ? 0xFF5B79 : 0x0050FF;

  const fields: DiscordEmbedField[] = [];

  if (marketEvent) {
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
        value: `${marketEvent.price_change >= 0 ? '+' : ''}${marketEvent.price_change.toFixed(2)}%`,
        inline: true,
      }
    );

    if (marketEvent.volume) {
      fields.push({
        name: 'Volume',
        value: `${(marketEvent.volume / 1_000_000).toFixed(1)}M shares`,
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
      name: 'Canvas Pipeline',
      value: `📋 ${canvasName}`,
      inline: true,
    });
  }

  const payload: DiscordWebhookPayload = {
    username: botName,
    avatar_url: 'https://raw.githubusercontent.com/rayyanekaputra/scriffle/main/public/favicon.ico',
    embeds: [
      {
        title: marketEvent
          ? `⚡ Scriffle Alert: ${marketEvent.symbol} (${marketEvent.price_change >= 0 ? '+' : ''}${marketEvent.price_change.toFixed(2)}%)`
          : '⚡ Scriffle Market Alert',
        description: customMessage || undefined,
        color,
        fields,
        footer: {
          text: 'Scriffle • Autonomous Financial Canvas for IDX',
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout safety

  try {
    const res = await fetch(webhookUrl, {
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
      error: `Discord responded with HTTP ${res.status}: ${errText.slice(0, 100)}`,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    return {
      success: false,
      statusCode: 500,
      error: err.name === 'AbortError' ? 'Webhook request timed out (6s)' : err.message,
    };
  }
}
```

---

### C. Test Webhook API Endpoint (`src/app/api/alert/test-webhook/route.ts`)

A dedicated API route for the "Test Webhook" action in `EditNodeModal.tsx`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { sendDiscordAlert } from '@/server/services/discordWebhook';

export async function POST(req: NextRequest) {
  try {
    const { webhookUrl, channel, template, canvasName } = await req.json();

    if (channel !== 'discord') {
      return NextResponse.json({ error: 'Only Discord channel testing is supported' }, { status: 400 });
    }

    const testEvent = {
      symbol: 'BBCA',
      price: 10450,
      prevPrice: 9840,
      price_change: 6.2,
      volume: 45200000,
      avg_volume: 28100000,
      timestamp: new Date().toLocaleTimeString(),
    };

    const result = await sendDiscordAlert({
      webhookUrl,
      customMessage: template ? `[Test Ping] ${template}` : '👋 Test ping from your Scriffle canvas!',
      marketEvent: testEvent,
      canvasName: canvasName || 'Demo Board',
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.statusCode });
    }

    return NextResponse.json({ success: true, message: 'Test ping delivered to Discord' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
```

---

### D. Graph Engine Dispatch Integration (`src/server/services/graphEngine.ts`)

In `graphEngine.ts`, update the `node.type === 'alert'` handling block:

```typescript
} else if (node.type === 'alert') {
  triggeredNodes.push(node.id);
  const alertMsg = nodeConfig.messageTemplate
    ? interpolateTemplate(nodeConfig.messageTemplate, curEvent)
    : `Alert: ${curEvent.symbol} price change is ${curEvent.price_change}%`;

  let webhookStatus: 'success' | 'failed' | undefined;
  let webhookError: string | undefined;

  // External delivery: Discord Webhook
  if (nodeConfig.channel === 'discord' && nodeConfig.discordWebhookUrl) {
    try {
      const res = await sendDiscordAlert({
        webhookUrl: nodeConfig.discordWebhookUrl,
        customMessage: alertMsg,
        marketEvent: curEvent,
        canvasName: canvas.name,
      });
      webhookStatus = res.success ? 'success' : 'failed';
      webhookError = res.error;
    } catch (err: any) {
      webhookStatus = 'failed';
      webhookError = err.message;
    }
  }

  await prisma.node.update({
    where: { id: node.id },
    data: {
      stateJson: JSON.stringify({
        status: 'passed',
        lastTriggeredAt: curEvent.timestamp || new Date().toLocaleTimeString(),
        lastWebhookStatus: webhookStatus,
        lastWebhookError: webhookError,
      }),
    },
  });

  await prisma.log.create({
    data: {
      canvasId,
      eventSummary: webhookStatus === 'success' ? `[Discord] ${alertMsg}` : alertMsg,
      triggeredNodes: JSON.stringify([node.id]),
      detailsJson: JSON.stringify({ ...curEvent, webhookStatus, webhookError }),
    },
  });
  logs.push(`Notification fired: ${alertMsg}${webhookStatus === 'success' ? ' (Sent to Discord)' : ''}`);
}
```

---

### E. Visual Updates to AlertNode (`src/components/canvas/nodes/AlertNode.tsx`)

1. **Header Badge:** Render `Discord` badge with indigo accent `#5865F2` when `config.channel === 'discord'`.
2. **Channel Box:** Display `Channel: Discord Webhook` with a link/masked indicator.
3. **Delivery Feedback Pill:** If `state.lastWebhookStatus === 'success'`, show `✓ Delivered to Discord`. If `'failed'`, show `⚠ Webhook Error`.

---

### F. Configuration Editor (`src/components/controls/EditNodeModal.tsx`)

When editing an `alert` node:
1. **Channel Selector:** Add `<option value="discord">Discord Webhook (Direct Channel)</option>`.
2. **Discord Webhook Input:** Dedicated URL input with real-time URL structure validation (`https://discord.com/api/webhooks/...`).
3. **Interactive "Send Test Ping" Button:**
   - Calls `/api/alert/test-webhook`.
   - Displays a live spinner during dispatch.
   - Shows green checkmark with success banner or red error message with troubleshooting tips.
4. **Token / Credit Indicator:** Display `⚡ 0 API Credits (Direct Webhook)` badge.

---

## 4. Testing & Verification Plan

### Unit Test Suite (`src/__tests__/unit/discordWebhook.test.ts`)
- `isValidDiscordWebhookUrl()` validation logic (valid URL, invalid domain, missing tokens).
- `sendDiscordAlert()` payload structuring (Mint color for positive %, Coral for negative %, fields formatting).
- Handling network failure, timeout abortion, and 4xx/5xx Discord error responses.
- `graphEngine.ts` BFS execution with Discord alert node.

---

## 5. Implementation Steps & Sequencing

1. **Phase 1: Types & Service Creation**
   - Update `AlertConfig` and `AlertState` in `src/types/canvas.ts`.
   - Implement `src/server/services/discordWebhook.ts`.
   - Implement `/api/alert/test-webhook` route.
2. **Phase 2: Graph Engine BFS Traversal**
   - Connect Discord dispatch in `graphEngine.ts` for both single-symbol events and top mover triggers.
3. **Phase 3: Frontend UI Components**
   - Update `AlertNode.tsx` with Discord styling and delivery badges.
   - Update `EditNodeModal.tsx` with Discord settings, URL input, and "Send Test Ping" button.
4. **Phase 4: Unit Testing**
   - Write comprehensive unit tests in `src/__tests__/unit/discordWebhook.test.ts`.
