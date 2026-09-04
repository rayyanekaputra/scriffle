import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ExecutionLog } from '@/types/canvas';

export async function GET() {
  try {
    const logs = await prisma.log.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const formatted: ExecutionLog[] = logs.map((l) => {
      let triggeredNodes: string[] = [];
      let details: any = undefined;
      try {
        triggeredNodes = JSON.parse(l.triggeredNodes);
      } catch {}
      try {
        if (l.detailsJson) details = JSON.parse(l.detailsJson);
      } catch {}

      return {
        id: l.id,
        canvasId: l.canvasId,
        eventSummary: l.eventSummary,
        triggeredNodes,
        details,
        createdAt: l.createdAt.toISOString(),
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Failed to fetch logs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await prisma.log.deleteMany();
    return NextResponse.json({ success: true, message: 'All execution logs cleared' });
  } catch (error: any) {
    console.error('Failed to clear logs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


