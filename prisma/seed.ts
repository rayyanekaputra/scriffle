import { prisma } from '../src/lib/prisma';

async function seed() {
  console.log('🌱 Seeding comprehensive Scriffle whiteboard demo graph...');

  // Reset existing canvas
  await prisma.log.deleteMany();
  await prisma.edge.deleteMany();
  await prisma.node.deleteMany();
  await prisma.canvas.deleteMany();
  await prisma.marketSnapshot.deleteMany();

  const canvas = await prisma.canvas.create({
    data: {
      name: 'IDX Bluechips Momentum & Automation Flow',
    },
  });

  // 0. Freeform Title & Research Thesis Text
  const titleText = await prisma.node.create({
    data: {
      canvasId: canvas.id,
      type: 'text',
      positionX: 50,
      positionY: 40,
      configJson: JSON.stringify({
        text: '🔥 IDX Banking Sector Breakout Engine (BBCA & BBRI)',
      }),
    },
  });

  // 1. Sticker Badge: Top Pick & Bullish
  await prisma.node.create({
    data: {
      canvasId: canvas.id,
      type: 'sticker',
      positionX: 50,
      positionY: 90,
      configJson: JSON.stringify({
        stickerType: 'approved',
      }),
    },
  });

  // 2. Watcher Node: BBCA (Primary Bank Lead)
  const bbcaWatcher = await prisma.node.create({
    data: {
      canvasId: canvas.id,
      type: 'watcher',
      positionX: 60,
      positionY: 200,
      configJson: JSON.stringify({
        symbol: 'BBCA',
        metric: 'price_change',
        interval: 180,
      }),
      stateJson: JSON.stringify({
        status: 'idle',
        cycleCount: 8,
        lastValue: { price: 10200, price_change: 1.8 },
      }),
    },
  });

  // 3. Condition Node 1: Surge Rule (> 5%)
  const surgeCondition = await prisma.node.create({
    data: {
      canvasId: canvas.id,
      type: 'condition',
      positionX: 380,
      positionY: 150,
      configJson: JSON.stringify({
        rule: 'price_change > 5',
      }),
      stateJson: JSON.stringify({
        status: 'idle',
      }),
    },
  });

  // 4. Condition Node 2: Heavy Volume Spike Rule
  const volumeCondition = await prisma.node.create({
    data: {
      canvasId: canvas.id,
      type: 'condition',
      positionX: 380,
      positionY: 340,
      configJson: JSON.stringify({
        rule: 'volume > 15000000',
      }),
      stateJson: JSON.stringify({
        status: 'idle',
      }),
    },
  });

  // 5. Sticky Note: Live Research Log (Yellow)
  const thesisNote = await prisma.node.create({
    data: {
      canvasId: canvas.id,
      type: 'note',
      positionX: 700,
      positionY: 80,
      configJson: JSON.stringify({
        content: 'Watching BBCA surge. If price breaks +5%, trigger child thesis and alert channels.',
        template: '🚀 ${symbol} surged +${price_change}% to Rp ${price} (Vol: ${volume}) at ${timestamp}',
        color: 'yellow',
        width: 320,
        height: 160,
      }),
      stateJson: JSON.stringify({
        status: 'idle',
      }),
    },
  });

  // 6. Alert Node: UI Toast Alert
  const toastAlert = await prisma.node.create({
    data: {
      canvasId: canvas.id,
      type: 'alert',
      positionX: 700,
      positionY: 280,
      configJson: JSON.stringify({
        channel: 'ui',
        messageTemplate: '⚡ High Volatility: ${symbol} surged ${price_change}% at ${timestamp}!',
      }),
      stateJson: JSON.stringify({
        status: 'idle',
      }),
    },
  });

  // 7. Action Node A (First Step): Spawns a child Sticky Note
  const actionNoteMutator = await prisma.node.create({
    data: {
      canvasId: canvas.id,
      type: 'action',
      positionX: 700,
      positionY: 420,
      configJson: JSON.stringify({
        action: 'create_note',
        params: {
          template: '✅ Step 1: Breakout confirmed for ${symbol} at ${timestamp}. Auto-generated research thesis card.',
        },
      }),
      stateJson: JSON.stringify({
        status: 'idle',
      }),
    },
  });

  // 8. Action Node B (Chained Direct Step 2): Connected directly to Action Node A to trigger peer watcher spawning in sequence
  const actionWatcherMutator = await prisma.node.create({
    data: {
      canvasId: canvas.id,
      type: 'action',
      positionX: 1040,
      positionY: 420,
      configJson: JSON.stringify({
        action: 'create_watcher',
        params: {
          symbol: 'BBRI',
        },
      }),
      stateJson: JSON.stringify({
        status: 'idle',
      }),
    },
  });

  // 9. Sticker: Rocket badge attached to the end of the action chain
  await prisma.node.create({
    data: {
      canvasId: canvas.id,
      type: 'sticker',
      positionX: 1040,
      positionY: 560,
      configJson: JSON.stringify({
        stickerType: 'rocket',
      }),
    },
  });

  // Connect Edges (Complete Execution Flow)
  // BBCA -> Surge Condition
  await prisma.edge.create({
    data: {
      canvasId: canvas.id,
      fromId: bbcaWatcher.id,
      toId: surgeCondition.id,
    },
  });

  // BBCA -> Volume Condition
  await prisma.edge.create({
    data: {
      canvasId: canvas.id,
      fromId: bbcaWatcher.id,
      toId: volumeCondition.id,
    },
  });

  // Surge Condition -> Sticky Note
  await prisma.edge.create({
    data: {
      canvasId: canvas.id,
      fromId: surgeCondition.id,
      toId: thesisNote.id,
    },
  });

  // Surge Condition -> Alert Pill
  await prisma.edge.create({
    data: {
      canvasId: canvas.id,
      fromId: surgeCondition.id,
      toId: toastAlert.id,
    },
  });

  // Volume Condition -> Action A (Note Mutator)
  await prisma.edge.create({
    data: {
      canvasId: canvas.id,
      fromId: volumeCondition.id,
      toId: actionNoteMutator.id,
    },
  });

  // ⚡ DIRECT ACTION-TO-ACTION CHAIN: Action A -> Action B (Watcher Mutator)
  await prisma.edge.create({
    data: {
      canvasId: canvas.id,
      fromId: actionNoteMutator.id,
      toId: actionWatcherMutator.id,
    },
  });

  // Seed baseline market snapshot
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

  console.log('✅ Comprehensive Scriffle demo loop seeded successfully.');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
