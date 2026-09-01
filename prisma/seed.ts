import { prisma } from '../src/lib/prisma';

async function seed() {
  console.log('🌱 Seeding FigJam-style whiteboard canvas...');

  // Reset existing canvas
  await prisma.log.deleteMany();
  await prisma.edge.deleteMany();
  await prisma.node.deleteMany();
  await prisma.canvas.deleteMany();
  await prisma.marketSnapshot.deleteMany();

  const canvas = await prisma.canvas.create({
    data: {
      name: 'Indonesian Market Momentum Board',
    },
  });

  // 1. Watcher Node: BBCA
  const watcherNode = await prisma.node.create({
    data: {
      canvasId: canvas.id,
      type: 'watcher',
      positionX: 80,
      positionY: 180,
      configJson: JSON.stringify({
        symbol: 'BBCA',
        metric: 'price_change',
        interval: 300,
      }),
      stateJson: JSON.stringify({
        status: 'idle',
        cycleCount: 12,
        lastValue: { price: 10200, price_change: 1.8 },
      }),
    },
  });

  // 2. Condition Node: Surge Check (> 5%)
  const conditionNode = await prisma.node.create({
    data: {
      canvasId: canvas.id,
      type: 'condition',
      positionX: 420,
      positionY: 180,
      configJson: JSON.stringify({
        rule: 'price_change > 5',
      }),
      stateJson: JSON.stringify({
        status: 'idle',
      }),
    },
  });

  // 3. Note Node: Sticky Note
  const noteNode = await prisma.node.create({
    data: {
      canvasId: canvas.id,
      type: 'note',
      positionX: 760,
      positionY: 60,
      configJson: JSON.stringify({
        content: 'Watching for BBCA momentum breakout above +5%...',
        template: '🚀 BBCA surged +${price_change}% to Rp ${price} (Avg volume: ${avg_volume}) at ${timestamp}',
        color: 'yellow',
      }),
      stateJson: JSON.stringify({
        status: 'idle',
      }),
    },
  });

  // 4. Alert Node: Notification pill
  const alertNode = await prisma.node.create({
    data: {
      canvasId: canvas.id,
      type: 'alert',
      positionX: 760,
      positionY: 260,
      configJson: JSON.stringify({
        channel: 'ui',
        messageTemplate: 'High volatility alert: BBCA price jumped ${price_change}%',
      }),
      stateJson: JSON.stringify({
        status: 'idle',
      }),
    },
  });

  // 5. Action Node: Whiteboard automation action
  const actionNode = await prisma.node.create({
    data: {
      canvasId: canvas.id,
      type: 'action',
      positionX: 760,
      positionY: 420,
      configJson: JSON.stringify({
        action: 'create_note',
        params: {
          template: 'Breakout confirmed for ${symbol} at ${timestamp}. Check volume profile next.',
        },
      }),
      stateJson: JSON.stringify({
        status: 'idle',
      }),
    },
  });

  // Connect edges
  await prisma.edge.create({
    data: {
      canvasId: canvas.id,
      fromId: watcherNode.id,
      toId: conditionNode.id,
    },
  });

  await prisma.edge.create({
    data: {
      canvasId: canvas.id,
      fromId: conditionNode.id,
      toId: noteNode.id,
    },
  });

  await prisma.edge.create({
    data: {
      canvasId: canvas.id,
      fromId: conditionNode.id,
      toId: alertNode.id,
    },
  });

  await prisma.edge.create({
    data: {
      canvasId: canvas.id,
      fromId: conditionNode.id,
      toId: actionNode.id,
    },
  });

  await prisma.marketSnapshot.create({
    data: {
      symbol: 'BBCA',
      price: 10200,
      prevPrice: 10000,
      priceChange: 2.0,
      volume: 12500000,
      avgVolume: 10000000,
      rank: 1,
    },
  });

  console.log('✅ FigJam demo canvas seeded.');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
