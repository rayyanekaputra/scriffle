import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { canvasId, from, to } = body;

    let targetCanvasId = canvasId;
    if (!targetCanvasId) {
      const defaultCanvas = await prisma.canvas.findFirst();
      targetCanvasId = defaultCanvas?.id;
    }

    if (!targetCanvasId || !from || !to) {
      return NextResponse.json({ error: 'Missing required edge fields' }, { status: 400 });
    }

    const edge = await prisma.edge.upsert({
      where: {
        fromId_toId: {
          fromId: from,
          toId: to,
        },
      },
      create: {
        canvasId: targetCanvasId,
        fromId: from,
        toId: to,
      },
      update: {},
    });

    return NextResponse.json({
      id: edge.id,
      canvasId: edge.canvasId,
      from: edge.fromId,
      to: edge.toId,
    });
  } catch (error: any) {
    console.error('Error creating edge:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
