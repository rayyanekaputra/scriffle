import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { position, config, state } = body;

    const dataToUpdate: any = {};
    if (position) {
      if (typeof position.x === 'number') dataToUpdate.positionX = position.x;
      if (typeof position.y === 'number') dataToUpdate.positionY = position.y;
    }
    if (config) {
      dataToUpdate.configJson = JSON.stringify(config);
    }
    if (state) {
      dataToUpdate.stateJson = JSON.stringify(state);
    }

    const updated = await prisma.node.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating node:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.edge.deleteMany({
      where: {
        OR: [{ fromId: id }, { toId: id }],
      },
    });

    await prisma.node.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Error deleting node:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
