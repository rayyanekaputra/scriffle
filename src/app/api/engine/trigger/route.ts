import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncMarketSnapshots, getTopMarketMovers } from '@/server/services/sectorsApi';
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

    const watcherNodes = targetCanvas.nodes.filter((n) => n.type === 'watcher');

    // Check if any watcher node is running in Top Movers Radar mode
    const radarGainers = watcherNodes.some((n) => {
      try {
        const cfg = JSON.parse(n.configJson);
        const sym = cfg.symbol?.toUpperCase();
        return cfg.mode === 'top_gainers' || sym === 'TOP_GAINERS' || sym === 'TOP GAINERS';
      } catch {
        return false;
      }
    });

    const radarLosers = watcherNodes.some((n) => {
      try {
        const cfg = JSON.parse(n.configJson);
        const sym = cfg.symbol?.toUpperCase();
        return cfg.mode === 'top_losers' || sym === 'TOP_LOSERS' || sym === 'TOP LOSERS';
      } catch {
        return false;
      }
    });

    const allEvents = [];
    let isOverallLive = true;

    const upperRequested = requestedSymbols?.map((s) => s.toUpperCase().replace(/\s+/g, '_'));

    if (
      radarGainers ||
      radarLosers ||
      (upperRequested &&
        (upperRequested.includes('TOP_GAINERS') ||
          upperRequested.includes('TOP_LOSERS') ||
          upperRequested.includes('TOP GAINERS') ||
          upperRequested.includes('TOP LOSERS')))
    ) {
      const { gainers, losers, isLive } = await getTopMarketMovers(apiKey);
      if (!isLive) isOverallLive = false;

      if (radarGainers || upperRequested?.includes('TOP_GAINERS') || upperRequested?.includes('TOP GAINERS')) {
        allEvents.push(...gainers);
      }
      if (radarLosers || upperRequested?.includes('TOP_LOSERS') || upperRequested?.includes('TOP LOSERS')) {
        allEvents.push(...losers);
      }
    }

    // Extract standard single monitored symbols
    let symbols = Array.from(
      new Set(
        watcherNodes
          .map((n) => {
            try {
              const cfg = JSON.parse(n.configJson);
              const sym = cfg.symbol?.toUpperCase();
              if (cfg.mode === 'top_gainers' || cfg.mode === 'top_losers') return null;
              if (sym === 'TOP_GAINERS' || sym === 'TOP_LOSERS' || sym === 'TOP GAINERS' || sym === 'TOP LOSERS') return null;
              return cfg.symbol?.toUpperCase();
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
    }

    if (symbols.length > 0) {
      const { events, isLive } = await syncMarketSnapshots(symbols, apiKey);
      if (!isLive) isOverallLive = false;
      allEvents.push(...events);
    } else if (allEvents.length === 0 && (!requestedSymbols || requestedSymbols.length === 0)) {
      const { events, isLive } = await syncMarketSnapshots(['BBCA'], apiKey);
      if (!isLive) isOverallLive = false;
      allEvents.push(...events);
    }

    const results = [];
    for (const ev of allEvents) {
      const res = await executeGraphForEvent(targetCanvas.id, ev);
      results.push({ symbol: ev.symbol, ...res });
    }

    return NextResponse.json({
      success: true,
      isLive: isOverallLive,
      polledEvents: allEvents,
      executionResults: results,
    });
  } catch (error: any) {
    console.error('Trigger poll error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
