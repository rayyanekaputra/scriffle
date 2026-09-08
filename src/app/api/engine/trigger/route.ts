import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncMarketSnapshots } from '@/server/services/sectorsApi';
import { executeGraphForEvent } from '@/server/services/graphEngine';

export async function POST(req: Request) {
  try {
    let canvasId: string | undefined;
    let apiKey: string | undefined;
    let requestedSymbols: string[] | undefined;

    try {
      const body = await req.json();
      canvasId = body.canvasId;
      apiKey = body.apiKey;
      if (body.symbol) requestedSymbols = [body.symbol];
      if (body.symbols && Array.isArray(body.symbols)) requestedSymbols = body.symbols;
    } catch {}

    let targetCanvas = canvasId
      ? await prisma.canvas.findUnique({ where: { id: canvasId }, include: { nodes: true } })
      : await prisma.canvas.findFirst({ include: { nodes: true } });

    if (!targetCanvas) {
      return NextResponse.json({ error: 'Canvas not found' }, { status: 404 });
    }

    // Extract monitored symbols from active Watcher nodes (or filter to requestedSymbols if provided)
    let symbols = Array.from(
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

    if (requestedSymbols && requestedSymbols.length > 0) {
      const upperReq = requestedSymbols.map((s) => s.toUpperCase());
      symbols = symbols.filter((s) => upperReq.includes(s));
      if (symbols.length === 0) {
        symbols = upperReq;
      }
    }

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
