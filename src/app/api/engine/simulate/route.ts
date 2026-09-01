import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { executeGraphForEvent } from '@/server/services/graphEngine';
import { MarketEvent } from '@/types/canvas';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { canvasId, event } = body;

    let targetCanvasId = canvasId;
    if (!targetCanvasId) {
      const defaultCanvas = await prisma.canvas.findFirst();
      targetCanvasId = defaultCanvas?.id;
    }

    if (!targetCanvasId) {
      return NextResponse.json({ error: 'Canvas not found' }, { status: 404 });
    }

    // Fallback default simulation event if none provided
    const marketEvent: MarketEvent = {
      symbol: event?.symbol || 'BBCA',
      price: event?.price || 10850,
      prevPrice: event?.prevPrice || 10200,
      price_change: event?.price_change !== undefined ? event.price_change : 6.37,
      volume: event?.volume || 25000000,
      avg_volume: event?.avg_volume || 10000000,
      rank: event?.rank || 1,
      timestamp: event?.timestamp || new Date().toLocaleTimeString(),
    };

    const result = await executeGraphForEvent(targetCanvasId, marketEvent);

    return NextResponse.json({
      success: true,
      event: marketEvent,
      result,
    });
  } catch (error: any) {
    console.error('Simulation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
