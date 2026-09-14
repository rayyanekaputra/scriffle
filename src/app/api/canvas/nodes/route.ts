import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MOCK_TOP_GAINERS, MOCK_TOP_LOSERS } from '@/lib/mockData';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { canvasId, type, position, config } = body;

    let targetCanvasId = canvasId;
    if (!targetCanvasId) {
      const defaultCanvas = await prisma.canvas.findFirst();
      if (!defaultCanvas) {
        const created = await prisma.canvas.create({ data: { name: 'Market Automation Canvas' } });
        targetCanvasId = created.id;
      } else {
        targetCanvasId = defaultCanvas.id;
      }
    }

    const cfg = config || {};
    const isGainers = cfg.mode === 'top_gainers' || cfg.symbol === 'Top Gainers' || cfg.symbol === 'TOP_GAINERS';
    const isLosers = cfg.mode === 'top_losers' || cfg.symbol === 'Top Losers' || cfg.symbol === 'TOP_LOSERS';
    const limit = typeof cfg.limit === 'number' && cfg.limit > 0 ? cfg.limit : 5;

    let initialState: any = { status: 'idle' };
    if (isGainers) {
      initialState.movers = MOCK_TOP_GAINERS.slice(0, limit);
      initialState.lastValue = MOCK_TOP_GAINERS[0];
    } else if (isLosers) {
      initialState.movers = MOCK_TOP_LOSERS.slice(0, limit);
      initialState.lastValue = MOCK_TOP_LOSERS[0];
    }

    const node = await prisma.node.create({
      data: {
        canvasId: targetCanvasId,
        type,
        positionX: position?.x || 100,
        positionY: position?.y || 100,
        configJson: JSON.stringify(cfg),
        stateJson: JSON.stringify(initialState),
      },
    });

    return NextResponse.json({
      id: node.id,
      canvasId: node.canvasId,
      type: node.type,
      position: { x: node.positionX, y: node.positionY },
      config: cfg,
      state: initialState,
    });
  } catch (error: any) {
    console.error('Error creating node:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { nodes } = body;

    if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    const updates = await Promise.all(
      nodes.map(async (n: { id: string; position?: { x: number; y: number }; config?: any }) => {
        const dataToUpdate: any = {};
        if (n.position) {
          if (typeof n.position.x === 'number') dataToUpdate.positionX = n.position.x;
          if (typeof n.position.y === 'number') dataToUpdate.positionY = n.position.y;
        }
        if (n.config) {
          // If updating config directly
          dataToUpdate.configJson = JSON.stringify(n.config);
        }
        return prisma.node.update({
          where: { id: n.id },
          data: dataToUpdate,
        });
      })
    );

    return NextResponse.json({ success: true, count: nodes.length });
  } catch (error: any) {
    console.error('Error batch updating nodes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

