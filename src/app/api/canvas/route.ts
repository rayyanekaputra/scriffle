import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CanvasNodeData, CanvasEdgeData, ExecutionLog } from '@/types/canvas';

export async function GET() {
  try {
    let canvas = await prisma.canvas.findFirst({
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

    const formattedNodes: CanvasNodeData[] = canvas.nodes.map((node) => {
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

    const formattedEdges: CanvasEdgeData[] = canvas.edges.map((edge) => ({
      id: edge.id,
      canvasId: edge.canvasId,
      from: edge.fromId,
      to: edge.toId,
    }));

    const formattedLogs: ExecutionLog[] = canvas.logs.map((log) => {
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
    const { name } = body;

    let canvas = await prisma.canvas.findFirst();
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

    return NextResponse.json({
      id: canvas.id,
      name: canvas.name,
    });
  } catch (error: any) {
    console.error('Failed to update canvas name:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
