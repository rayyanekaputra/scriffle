import { prisma } from '../src/lib/prisma';

async function seed() {
  console.log('🌱 Seeding default Scriffle canvas...');

  // Reset existing canvas
  await prisma.log.deleteMany();
  await prisma.edge.deleteMany();
  await prisma.node.deleteMany();
  await prisma.canvas.deleteMany();
  await prisma.marketSnapshot.deleteMany();

  const canvas = await prisma.canvas.create({
    data: {
      name: 'Indonesian Market Momentum Canvas',
    },
  });

  // 1. Watcher Node: BBCA
  const watcherNode = await prisma.node.create({
    data: {
      canvasId: canvas.id,
      type: 'watcher',
      positionX: 100,
      positionY: 200,
      configJson: JSON.stringify({
        symbol: 'BBCA',
        metric: 'price_change',
        interval: 300,
      }),
      stateJson: JSON.stringify({
        status: 'idle',
        lastValue: { price: 10200, price_change: 0 },
      }),
    },
  });

  // 2. Condition Node: Surge Check (> 5%)
  const conditionNode = await prisma.node.create({
    data: {
      canvasId: canvas.id,
      type: 'condition',
      positionX: 450,
      positionY: 200,
      configJson: JSON.stringify({
        rule: 'price_change > 5',
      }),
      stateJson: JSON.stringify({
        status: 'idle',
      }),
    },
  });

  // 3. Note Node: Momentum commentary
  const noteNode = await prisma.node.create({
    data: {
      canvasId: canvas.id,
      type: 'note',
      positionX: 800,
      positionY: 100,
      configJson: JSON.stringify({
        content: 'Watching for BBCA momentum breakout (> 5%)...',
        template: '🚀 ${symbol} surged +${price_change}% to Rp ${price} (Avg Vol: ${avg_volume}) at ${timestamp}',
      }),
      stateJson: JSON.stringify({
        status: 'idle',
      }),
    },
  });

  // 4. Alert Node: UI Toast alert
  const alertNode = await prisma.node.create({
    data: {
      canvasId: canvas.id,
      type: 'alert',
      positionX: 800,
      positionY: 260,
      configJson: JSON.stringify({
        channel: 'ui',
        messageTemplate: 'High volatility alert: ${symbol} price change is ${price_change}%',
      }),
      stateJson: JSON.stringify({
        status: 'idle',
      }),
    },
  });

  // 5. Action Node: Self-mutate canvas by creating follow-up note
  const actionNode = await prisma.node.create({
    data: {
      canvasId: canvas.id,
      type: 'action',
      positionX: 800,
      positionY: 420,
      configJson: JSON.stringify({
        action: 'create_note',
        params: {
          template: 'Generated Review: ${symbol} breakout confirmed at ${timestamp}.',
        },
      }),
      stateJson: JSON.stringify({
        status: 'idle',
      }),
    },
  });

  // Connect edges
  // Watcher -> Condition
  await prisma.edge.create({
    data: {
      canvasId: canvas.id,
      fromId: watcherNode.id,
      toId: conditionNode.id,
    },
  });

  // Condition -> Note
  await prisma.edge.create({
    data: {
      canvasId: canvas.id,
      fromId: conditionNode.id,
      toId: noteNode.id,
    },
  });

  // Condition -> Alert
  await prisma.edge.create({
    data: {
      canvasId: canvas.id,
      fromId: conditionNode.id,
      toId: alertNode.id,
    },
  });

  // Condition -> Action
  await prisma.edge.create({
    data: {
      canvasId: canvas.id,
      fromId: conditionNode.id,
      toId: actionNode.id,
    },
  });

  // Initialize market snapshot baseline
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

  console.log('✅ Canvas initialized with 5 connected demo nodes.');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
