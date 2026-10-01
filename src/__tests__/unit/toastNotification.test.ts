import { describe, it, expect } from 'vitest';
import { ExecutionLog, CanvasNodeData } from '@/types/canvas';

function classifyToastNotification(log: ExecutionLog, canvasNodes: CanvasNodeData[]) {
  const triggeredNodes = Array.isArray(log.triggeredNodes) ? log.triggeredNodes : [];
  const alertNode = canvasNodes.find(
    (n) => n.type === 'alert' && triggeredNodes.includes(n.id)
  );

  const isAlertLog =
    Boolean(alertNode) ||
    log.eventSummary?.startsWith('[Discord]') ||
    (Boolean(log.eventSummary) &&
      (log.eventSummary.toLowerCase().includes('alert') ||
        log.eventSummary.toLowerCase().includes('breakout') ||
        log.eventSummary.toLowerCase().includes('passed') ||
        log.eventSummary.toLowerCase().includes('failed')) &&
      triggeredNodes.length > 0);

  if (!isAlertLog) return null;

  const rawMsg = log.eventSummary || 'Market alert triggered';
  const cleanMsg = rawMsg.replace(/^\[Discord\]\s*/, '');

  let toastType: 'rising' | 'crashing' | 'alert' | 'info' = 'alert';
  if (
    cleanMsg.includes('+') ||
    cleanMsg.toLowerCase().includes('surge') ||
    cleanMsg.toLowerCase().includes('gainer') ||
    cleanMsg.toLowerCase().includes('passed')
  ) {
    toastType = 'rising';
  } else if (
    cleanMsg.includes('-') ||
    cleanMsg.toLowerCase().includes('drop') ||
    cleanMsg.toLowerCase().includes('crash') ||
    cleanMsg.toLowerCase().includes('loser') ||
    cleanMsg.toLowerCase().includes('failed')
  ) {
    toastType = 'crashing';
  }

  const title =
    alertNode?.config?.channel === 'discord' ? 'Market Alert (Discord)' : 'Market Alert';

  return { title, message: cleanMsg, type: toastType };
}

describe('Toast Notification Classifier & Dispatch Contracts', () => {
  const mockNodes: CanvasNodeData[] = [
    {
      id: 'alert-1',
      canvasId: 'c1',
      type: 'alert',
      position: { x: 0, y: 0 },
      config: { channel: 'ui', messageTemplate: '🚀 ${symbol} Breakout' },
    },
    {
      id: 'alert-discord',
      canvasId: 'c1',
      type: 'alert',
      position: { x: 100, y: 0 },
      config: { channel: 'discord', discordWebhookUrl: 'https://discord.com/api/webhooks/test' },
    },
    {
      id: 'note-1',
      canvasId: 'c1',
      type: 'note',
      position: { x: 200, y: 0 },
      config: { content: 'Research note' },
    },
  ];

  it('correctly classifies a positive breakout alert log as rising toast', () => {
    const log: ExecutionLog = {
      id: 'log-1',
      canvasId: 'c1',
      eventSummary: '🚀 BBCA Breakout: +6.2% at Rp10,400',
      triggeredNodes: ['alert-1'],
      createdAt: new Date().toISOString(),
    };

    const result = classifyToastNotification(log, mockNodes);
    expect(result).not.toBeNull();
    expect(result?.title).toBe('Market Alert');
    expect(result?.message).toBe('🚀 BBCA Breakout: +6.2% at Rp10,400');
    expect(result?.type).toBe('rising');
  });

  it('correctly classifies a negative drop alert log as crashing toast', () => {
    const log: ExecutionLog = {
      id: 'log-2',
      canvasId: 'c1',
      eventSummary: '⚠️ GOTO Support Break: -5.4% at Rp52',
      triggeredNodes: ['alert-1'],
      createdAt: new Date().toISOString(),
    };

    const result = classifyToastNotification(log, mockNodes);
    expect(result).not.toBeNull();
    expect(result?.title).toBe('Market Alert');
    expect(result?.message).toBe('⚠️ GOTO Support Break: -5.4% at Rp52');
    expect(result?.type).toBe('crashing');
  });

  it('sanitizes [Discord] prefix and formats Discord channel title', () => {
    const log: ExecutionLog = {
      id: 'log-3',
      canvasId: 'c1',
      eventSummary: '[Discord] 🚀 Top 5 Gainers (1D): #1 JECX (+25%), #2 AGII (+18.5%)',
      triggeredNodes: ['alert-discord'],
      createdAt: new Date().toISOString(),
    };

    const result = classifyToastNotification(log, mockNodes);
    expect(result).not.toBeNull();
    expect(result?.title).toBe('Market Alert (Discord)');
    expect(result?.message).toBe('🚀 Top 5 Gainers (1D): #1 JECX (+25%), #2 AGII (+18.5%)');
    expect(result?.type).toBe('rising');
  });

  it('returns null for standard non-alert node logs (e.g. note updates)', () => {
    const log: ExecutionLog = {
      id: 'log-4',
      canvasId: 'c1',
      eventSummary: 'Updated note with fresh valuation metrics',
      triggeredNodes: ['note-1'],
      createdAt: new Date().toISOString(),
    };

    const result = classifyToastNotification(log, mockNodes);
    expect(result).toBeNull();
  });
});
