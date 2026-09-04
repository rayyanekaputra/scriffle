import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncMarketSnapshots } from '@/server/services/sectorsApi';
import { executeGraphForEvent } from '@/server/services/graphEngine';

export async function POST(req: Request) {
  try {
    let canvasId: string | undefined;
    let apiKey: string | undefined;

    try {
      const body = await req.json();
      canvasId = body.canvasId;
      apiKey = body.apiKey;
    } catch {}

    let targetCanvas = canvasId
      ? await prisma.canvas.findUnique({ where: { id: canvasId }, include: { nodes: true } })
      : await prisma.canvas.findFirst({ include: { nodes: true } });

    if (!targetCanvas) {
      return NextResponse.json({ error: 'Canvas not found' }, { status: 404 });
    }

    // Extract all monitored symbols from active Watcher nodes
    const symbols = Array.from(
      new Set(
        targetCanvas.nodes
          .filter((n) => n.type === 'watcher')
          .map((n) => {
            try {
              return JSON.parse(n.configJson).symbol?.toUpperCase();
            } catch {
              return null;
            }
          })
          .filter(Boolean)
      )
    ) as string[];

    if (symbols.length === 0) {
      symbols.push('BBCA');
    }

    const { events, isLive } = await syncMarketSnapshots(symbols, apiKey);
    const results = [];

    for (const ev of events) {
      const res = await executeGraphForEvent(targetCanvas.id, ev);
      results.push({ symbol: ev.symbol, ...res });
    }

    return NextResponse.json({
      success: true,
      isLive,
      polledEvents: events,
      executionResults: results,
    });
  } catch (error: any) {
    console.error('Trigger poll error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
