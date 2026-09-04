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
    // 1. Delete all log records
    await prisma.log.deleteMany();

    // 2. Reset all node states and run counters to idle (0 runs)
    await prisma.node.updateMany({
      data: {
        stateJson: JSON.stringify({
          status: 'idle',
          cycleCount: 0,
          lastValue: null,
          lastTriggeredAt: null,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'All execution logs and node run counters have been cleared and reset',
    });
  } catch (error: any) {
    console.error('Failed to clear logs and reset node states:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


