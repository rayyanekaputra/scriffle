import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    const node = await prisma.node.create({
      data: {
        canvasId: targetCanvasId,
        type,
        positionX: position?.x || 100,
        positionY: position?.y || 100,
        configJson: JSON.stringify(config || {}),
        stateJson: JSON.stringify({ status: 'idle' }),
      },
    });

    return NextResponse.json({
      id: node.id,
      canvasId: node.canvasId,
      type: node.type,
      position: { x: node.positionX, y: node.positionY },
      config: config || {},
      state: { status: 'idle' },
    });
  } catch (error: any) {
    console.error('Error creating node:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
