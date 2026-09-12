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

    const { searchParams } = new URL(req.url);
    const { format, name, nodes = [], edges = [], canvasId: explicitCanvasId } = body;
    const targetCanvasId = explicitCanvasId || searchParams.get('id');

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
    let canvas: any = null;
    if (targetCanvasId && targetCanvasId !== 'new') {
      canvas = await prisma.canvas.findUnique({ where: { id: targetCanvasId } });
      if (!canvas) {
        canvas = await prisma.canvas.create({
          data: { id: targetCanvasId, name: name || 'untitled board' },
        });
      } else if (name) {
        await prisma.canvas.update({
          where: { id: canvas.id },
          data: { name },
        });
      }
    } else {
      canvas = await prisma.canvas.findFirst({ orderBy: { updatedAt: 'desc' } });
      if (!canvas) {
        canvas = await prisma.canvas.create({
          data: { name: name || 'untitled board' },
        });
      } else if (name) {
        await prisma.canvas.update({
          where: { id: canvas.id },
          data: { name },
        });
      }
    }

    const canvasId = canvas.id;

    // Use Prisma transaction to atomically wipe old canvas data and insert new graph
    await prisma.$transaction(async (tx) => {
      // 1. Delete all existing edges, nodes, and logs for this canvas
      await tx.edge.deleteMany({ where: { canvasId } });
      await tx.node.deleteMany({ where: { canvasId } });
      await tx.log.deleteMany({ where: { canvasId } });

      // 2. Fetch all existing node and edge IDs across other canvases in DB to prevent unique constraint collisions
      const existingNodeIdsInDb = new Set(
        (await tx.node.findMany({ select: { id: true } })).map((n) => n.id)
      );
      const existingEdgeIdsInDb = new Set(
        (await tx.edge.findMany({ select: { id: true } })).map((e) => e.id)
      );

      // Map of originalNodeId -> assignedNodeId
      const idMap = new Map<string, string>();
      const usedAssignedNodeIds = new Set<string>();

      // 3. Insert imported nodes
      for (const node of nodes) {
        if (!node || typeof node !== 'object') continue;

        const originalId = String(node.id || crypto.randomUUID());
        let assignedId = originalId;

        // If ID is already taken by another canvas in the DB or duplicate in this batch, allocate a new UUID
        if (existingNodeIdsInDb.has(assignedId) || usedAssignedNodeIds.has(assignedId)) {
          assignedId = crypto.randomUUID();
        }

        idMap.set(originalId, assignedId);
        usedAssignedNodeIds.add(assignedId);

        const positionX = node.position?.x ?? node.positionX ?? 100;
        const positionY = node.position?.y ?? node.positionY ?? 100;
        const configJson = typeof node.config === 'object' ? JSON.stringify(node.config) : (node.configJson || '{}');
        
        // Reset execution run counter in state if present
        let cleanState: any = node.state || {};
        if (cleanState.runCount !== undefined) cleanState.runCount = 0;
        const stateJson = JSON.stringify(cleanState);

        await tx.node.create({
          data: {
            id: assignedId,
            canvasId,
            type: node.type || 'note',
            positionX: Number(positionX) || 0,
            positionY: Number(positionY) || 0,
            configJson,
            stateJson,
          },
        });
        existingNodeIdsInDb.add(assignedId);
      }

      // 4. Insert imported edges (only if both from and to nodes exist)
      const seenEdgePairs = new Set<string>();
      for (const edge of edges) {
        if (!edge || typeof edge !== 'object') continue;

        const rawFromId = edge.from || edge.fromId;
        const rawToId = edge.to || edge.toId;

        const fromId = rawFromId ? (idMap.get(String(rawFromId)) || String(rawFromId)) : undefined;
        const toId = rawToId ? (idMap.get(String(rawToId)) || String(rawToId)) : undefined;

        if (fromId && toId && usedAssignedNodeIds.has(fromId) && usedAssignedNodeIds.has(toId)) {
          const pairKey = `${fromId}->${toId}`;
          if (seenEdgePairs.has(pairKey)) continue;
          seenEdgePairs.add(pairKey);

          let edgeId = edge.id ? String(edge.id) : crypto.randomUUID();
          if (existingEdgeIdsInDb.has(edgeId)) {
            edgeId = crypto.randomUUID();
          }

          await tx.edge.create({
            data: {
              id: edgeId,
              canvasId,
              fromId,
              toId,
            },
          });
          existingEdgeIdsInDb.add(edgeId);
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
