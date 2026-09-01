import { prisma } from '@/lib/prisma';
import { executeGraphForEvent } from '@/server/services/graphEngine';

async function testSimulation() {
  console.log('🧪 Running engine simulation smoke test...');
  const canvas = await prisma.canvas.findFirst();
  if (!canvas) {
    throw new Error('No canvas found! Please run seed.');
  }

  const testEvent = {
    symbol: 'BBCA',
    price: 10850,
    prevPrice: 10200,
    price_change: 6.37,
    volume: 25000000,
    avg_volume: 10000000,
    rank: 1,
    timestamp: '16:30:00',
  };

  console.log('⚡ Injecting Market Event:', testEvent);
  const result = await executeGraphForEvent(canvas.id, testEvent);
  console.log('✅ Simulation Result:', result);

  const updatedNodes = await prisma.node.findMany({ where: { canvasId: canvas.id } });
  console.log(`📊 Canvas now has ${updatedNodes.length} nodes (Self-mutation verified).`);
}

testSimulation()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
