import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CanvasNodeData, CanvasEdgeData, ExecutionLog } from '@/types/canvas';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const canvasId = searchParams.get('id');

    let canvas: any = null;

    if (canvasId && canvasId !== 'new') {
      canvas = await prisma.canvas.findUnique({
        where: { id: canvasId },
        include: {
          nodes: true,
          edges: true,
          logs: {
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      });
    }

    // If canvasId was 'new' or not found, create new board
    if (!canvas) {
      if (canvasId && canvasId !== 'new') {
        // Create with requested ID
        canvas = await prisma.canvas.create({
          data: { id: canvasId, name: 'untitled board' },
          include: {
            nodes: true,
            edges: true,
            logs: true,
          },
        });
      } else {
        // If no ID given, look for any existing canvas or create default
        canvas = await prisma.canvas.findFirst({
          orderBy: { updatedAt: 'desc' },
          include: {
            nodes: true,
            edges: true,
            logs: {
              orderBy: { createdAt: 'desc' },
              take: 20,
            },
          },
        });

        if (!canvas) {
          canvas = await prisma.canvas.create({
            data: { name: 'untitled board' },
            include: {
              nodes: true,
              edges: true,
              logs: true,
            },
          });
        }
      }
    }

    const formattedNodes: CanvasNodeData[] = canvas.nodes.map((node: any) => {
      let config: any = {};
      let state: any = undefined;
      try {
        config = JSON.parse(node.configJson);
      } catch {}
      try {
        if (node.stateJson) state = JSON.parse(node.stateJson);
      } catch {}

      return {
        id: node.id,
        canvasId: node.canvasId,
        type: node.type as any,
        position: { x: node.positionX, y: node.positionY },
        config,
        state,
      };
    });

    const formattedEdges: CanvasEdgeData[] = canvas.edges.map((edge: any) => ({
      id: edge.id,
      canvasId: edge.canvasId,
      from: edge.fromId,
      to: edge.toId,
    }));

    const formattedLogs: ExecutionLog[] = canvas.logs.map((log: any) => {
      let triggeredNodes: string[] = [];
      let details: any = undefined;
      try {
        triggeredNodes = JSON.parse(log.triggeredNodes);
      } catch {}
      try {
        if (log.detailsJson) details = JSON.parse(log.detailsJson);
      } catch {}

      return {
        id: log.id,
        canvasId: log.canvasId,
        eventSummary: log.eventSummary,
        triggeredNodes,
        details,
        createdAt: log.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      id: canvas.id,
      name: canvas.name || 'untitled board',
      nodes: formattedNodes,
      edges: formattedEdges,
      logs: formattedLogs,
    });
  } catch (error: any) {
    console.error('Failed to get canvas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, name } = body;

    let canvas: any = null;

    if (id) {
      canvas = await prisma.canvas.upsert({
        where: { id },
        update: { name: name || 'untitled board' },
        create: { id, name: name || 'untitled board' },
      });
    } else {
      canvas = await prisma.canvas.findFirst({
        orderBy: { updatedAt: 'desc' },
      });
      if (!canvas) {
        canvas = await prisma.canvas.create({
          data: { name: name || 'untitled board' },
        });
      } else {
        canvas = await prisma.canvas.update({
          where: { id: canvas.id },
          data: { name: name || 'untitled board' },
        });
      }
    }

    return NextResponse.json({
      id: canvas.id,
      name: canvas.name,
    });
  } catch (error: any) {
    console.error('Failed to update canvas name:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing canvas id parameter' }, { status: 400 });
    }

    await prisma.canvas.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    console.error('Failed to delete canvas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
