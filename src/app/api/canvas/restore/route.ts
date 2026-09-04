import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CanvasNodeData, CanvasEdgeData } from '@/types/canvas';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate payload
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid payload: Body must be an object' }, { status: 400 });
    }

    const { format, name, nodes = [], edges = [] } = body;

    // Optional format check - allow standard .scriffle or raw canvas exports
    if (format && format !== 'scriffle') {
      return NextResponse.json({ error: 'Unsupported file format. Expected format: "scriffle"' }, { status: 400 });
    }

    if (!Array.isArray(nodes)) {
      return NextResponse.json({ error: 'Invalid nodes: Must be an array' }, { status: 400 });
    }

    if (!Array.isArray(edges)) {
      return NextResponse.json({ error: 'Invalid edges: Must be an array' }, { status: 400 });
    }

    // Find or create active canvas
    let canvas = await prisma.canvas.findFirst();
    if (!canvas) {
      canvas = await prisma.canvas.create({
        data: { name: name || 'Market Automation Canvas' },
      });
    } else if (name) {
      await prisma.canvas.update({
        where: { id: canvas.id },
        data: { name },
      });
    }

    const canvasId = canvas.id;

    // Use Prisma transaction to atomically wipe old canvas data and insert new graph
    await prisma.$transaction(async (tx) => {
      // 1. Delete all existing edges, nodes, and logs for this canvas
      await tx.edge.deleteMany({ where: { canvasId } });
      await tx.node.deleteMany({ where: { canvasId } });
      await tx.log.deleteMany({ where: { canvasId } });

      // 2. Map of oldId -> newId (or keep oldId if valid UUID)
      const validNodeIds = new Set<string>();

      // 3. Insert imported nodes
      for (const node of nodes) {
        if (!node || typeof node !== 'object') continue;

        const nodeId = node.id || crypto.randomUUID();
        validNodeIds.add(nodeId);

        const positionX = node.position?.x ?? node.positionX ?? 100;
        const positionY = node.position?.y ?? node.positionY ?? 100;
        const configJson = typeof node.config === 'object' ? JSON.stringify(node.config) : (node.configJson || '{}');
        
        // Reset execution run counter in state if present
        let cleanState: any = node.state || {};
        if (cleanState.runCount !== undefined) cleanState.runCount = 0;
        const stateJson = JSON.stringify(cleanState);

        await tx.node.create({
          data: {
            id: nodeId,
            canvasId,
            type: node.type || 'note',
            positionX: Number(positionX) || 0,
            positionY: Number(positionY) || 0,
            configJson,
            stateJson,
          },
        });
      }

      // 4. Insert imported edges (only if both from and to nodes exist)
      for (const edge of edges) {
        if (!edge || typeof edge !== 'object') continue;

        const fromId = edge.from || edge.fromId;
        const toId = edge.to || edge.toId;

        if (fromId && toId && validNodeIds.has(fromId) && validNodeIds.has(toId)) {
          const edgeId = edge.id || crypto.randomUUID();
          await tx.edge.create({
            data: {
              id: edgeId,
              canvasId,
              fromId,
              toId,
            },
          });
        }
      }
    });

    // Fetch newly restored canvas
    const updatedCanvas = await prisma.canvas.findUnique({
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

    if (!updatedCanvas) {
      return NextResponse.json({ error: 'Failed to retrieve updated canvas' }, { status: 500 });
    }

    const formattedNodes: CanvasNodeData[] = updatedCanvas.nodes.map((node) => {
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

    const formattedEdges: CanvasEdgeData[] = updatedCanvas.edges.map((edge) => ({
      id: edge.id,
      canvasId: edge.canvasId,
      from: edge.fromId,
      to: edge.toId,
    }));

    return NextResponse.json({
      id: updatedCanvas.id,
      name: updatedCanvas.name,
      nodes: formattedNodes,
      edges: formattedEdges,
      logs: [],
    });
  } catch (error: any) {
    console.error('Failed to restore canvas from .scriffle:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
