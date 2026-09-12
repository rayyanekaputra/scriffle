import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncMarketSnapshots, getTopMarketMovers } from '@/server/services/sectorsApi';
import {
  executeGraphForEvent,
  executeGraphForRadarWatcher,
  executeGraphForScreener,
} from '@/server/services/graphEngine';

export async function POST(req: Request) {
  try {
    let canvasId: string | undefined;
    let apiKey: string | undefined;
    let requestedSymbols: string[] | undefined;
    let targetNodeId: string | undefined;

    try {
      const body = await req.json();
      canvasId = body.canvasId;
      apiKey = body.apiKey;
      targetNodeId = body.nodeId || body.screenerId || body.watcherId;
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
    const allEvents = [];
    let isOverallLive = true;
    const results = [];

    const upperRequested = requestedSymbols?.map((s) => s.toUpperCase().replace(/\s+/g, '_'));

    // 1. Process each Radar Watcher (Top Gainers / Top Losers)
    for (const watcher of watcherNodes) {
      try {
        const cfg = JSON.parse(watcher.configJson || '{}');
        const sym = cfg.symbol?.toUpperCase();
        const isGainers = cfg.mode === 'top_gainers' || sym === 'TOP_GAINERS' || sym === 'TOP GAINERS';
        const isLosers = cfg.mode === 'top_losers' || sym === 'TOP_LOSERS' || sym === 'TOP LOSERS';

        if (isGainers || isLosers) {
          // If specific symbol was requested, check if this radar watcher matches
          if (upperRequested && upperRequested.length > 0) {
            const matchesGainers = isGainers && (upperRequested.includes('TOP_GAINERS') || upperRequested.includes('TOP GAINERS'));
            const matchesLosers = isLosers && (upperRequested.includes('TOP_LOSERS') || upperRequested.includes('TOP LOSERS'));
            if (!matchesGainers && !matchesLosers) continue;
          }

          const limit = typeof cfg.limit === 'number' && cfg.limit > 0 ? cfg.limit : 5;
          const period = cfg.period || '1d';
          const minMcapBillion = typeof cfg.minMcapBillion === 'number' ? cfg.minMcapBillion : undefined;
          const classifications = cfg.classifications || 'all';

          const { gainers, losers, isLive } = await getTopMarketMovers(apiKey, {
            nStock: limit,
            periods: period,
            minMcapBillion,
            classifications,
          });

          if (!isLive) isOverallLive = false;

          const selectedMovers = isGainers ? gainers : losers;
          if (selectedMovers.length > 0) {
            allEvents.push(...selectedMovers);
            const radarRes = await executeGraphForRadarWatcher(targetCanvas.id, watcher.id, selectedMovers, apiKey);
            results.push({ watcherId: watcher.id, type: isGainers ? 'top_gainers' : 'top_losers', ...radarRes });
          }
        }
      } catch (err) {
        console.error('Error processing radar watcher:', err);
      }
    }

    // 2. Extract and process standard single monitored symbols
    let singleSymbols = Array.from(
      new Set(
        watcherNodes
          .map((n) => {
            try {
              const cfg = JSON.parse(n.configJson || '{}');
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
      singleSymbols = singleSymbols.filter((s) => upperReq.includes(s));
    }

    // 3. Process Screener nodes
    const screenerNodes = targetCanvas.nodes.filter((n) => n.type === 'screener');
    for (const screener of screenerNodes) {
      if (targetNodeId && targetNodeId !== screener.id) continue;
      try {
        const screenerRes = await executeGraphForScreener(targetCanvas.id, screener.id, apiKey);
        results.push({ screenerId: screener.id, type: 'screener', ...screenerRes });
      } catch (err) {
        console.error('Error executing screener node:', err);
      }
    }

    if (singleSymbols.length > 0) {
      const { events, isLive } = await syncMarketSnapshots(singleSymbols, apiKey);
      if (!isLive) isOverallLive = false;
      allEvents.push(...events);

      for (const ev of events) {
        const res = await executeGraphForEvent(targetCanvas.id, ev, apiKey);
        results.push({ symbol: ev.symbol, ...res });
      }
    } else if (allEvents.length === 0 && (!requestedSymbols || requestedSymbols.length === 0) && watcherNodes.length === 0 && screenerNodes.length === 0) {
      const { events, isLive } = await syncMarketSnapshots(['BBCA'], apiKey);
      if (!isLive) isOverallLive = false;
      allEvents.push(...events);

      for (const ev of events) {
        const res = await executeGraphForEvent(targetCanvas.id, ev, apiKey);
        results.push({ symbol: ev.symbol, ...res });
      }
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
