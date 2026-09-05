import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const canvases = await prisma.canvas.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { nodes: true, edges: true },
        },
      },
    });

    const formatted = canvases.map((c) => ({
      id: c.id,
      name: c.name || 'untitled board',
      updatedAt: c.updatedAt.toISOString(),
      createdAt: c.createdAt.toISOString(),
      nodeCount: c._count.nodes,
      edgeCount: c._count.edges,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Failed to list canvases:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
