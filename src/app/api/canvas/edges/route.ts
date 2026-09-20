import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { canvasId, from, to, fromHandle, sourceHandle, toHandle, targetHandle } = body;
    const resolvedFromHandle = fromHandle !== undefined ? fromHandle : sourceHandle !== undefined ? sourceHandle : null;
    const resolvedToHandle = toHandle !== undefined ? toHandle : targetHandle !== undefined ? targetHandle : null;

    let targetCanvasId = canvasId;
    if (!targetCanvasId) {
      const defaultCanvas = await prisma.canvas.findFirst();
      targetCanvasId = defaultCanvas?.id;
    }

    if (!targetCanvasId || !from || !to) {
      return NextResponse.json({ error: 'Missing required edge fields' }, { status: 400 });
    }

    const existing = await prisma.edge.findFirst({
      where: {
        fromId: from,
        toId: to,
        fromHandle: resolvedFromHandle,
      },
    });

    let edge;
    if (existing) {
      edge = await prisma.edge.update({
        where: { id: existing.id },
        data: {
          toHandle: resolvedToHandle,
        },
      });
    } else {
      edge = await prisma.edge.create({
        data: {
          canvasId: targetCanvasId,
          fromId: from,
          toId: to,
          fromHandle: resolvedFromHandle,
          toHandle: resolvedToHandle,
        },
      });
    }

    return NextResponse.json({
      id: edge.id,
      canvasId: edge.canvasId,
      from: edge.fromId,
      to: edge.toId,
      fromHandle: edge.fromHandle,
      toHandle: edge.toHandle,
    });
  } catch (error: any) {
    console.error('Error creating edge:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
