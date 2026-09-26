import { prisma } from './prisma';

/**
 * Non-destructively creates a brand new project board in SQLite with pristine cycle counts (0).
 * Does NOT delete or overwrite any existing canvases.
 */
export async function createFreshProject(customName?: string): Promise<{ id: string; name: string }> {
  const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const name = customName || `Fresh Research Project (${timestamp})`;

  const canvas = await prisma.canvas.create({
    data: {
      name,
    },
  });

  // 0. Freeform Title & Research Thesis Text
  await prisma.node.create({
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
        emoji: '📈',
        label: 'Top Pick',
        color: 'green',
      }),
    },
  });

  // 2. Watcher Node: BBCA (Pristine cycleCount: 0 and status: 'idle')
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
        cycleCount: 0,
        lastValue: { price: 10200, price_change: 1.8 },
      }),
    },
  });

  // 3. Condition Node 1: Surge Rule (> 5%)
  const surgeCondition = await prisma.node.create({
    data: {
      canvasId: canvas.id,
      type: 'condition',
      positionX: 420,
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
      positionX: 420,
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
      positionX: 780,
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
      positionX: 780,
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

  // 7. Action Node A: Spawns a child Sticky Note
  const actionNoteMutator = await prisma.node.create({
    data: {
      canvasId: canvas.id,
      type: 'action',
      positionX: 780,
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

  // 8. Action Node B: Connected to Action Node A to trigger peer watcher spawning
  const actionWatcherMutator = await prisma.node.create({
    data: {
      canvasId: canvas.id,
      type: 'action',
      positionX: 1140,
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

  // 9. Sticker: Rocket badge
  await prisma.node.create({
    data: {
      canvasId: canvas.id,
      type: 'sticker',
      positionX: 1140,
      positionY: 560,
      configJson: JSON.stringify({
        emoji: '🚀',
        label: 'Breakout',
        color: 'blue',
      }),
    },
  });

  // Connect Edges
  await prisma.edge.create({
    data: {
      canvasId: canvas.id,
      fromId: bbcaWatcher.id,
      toId: surgeCondition.id,
    },
  });

  await prisma.edge.create({
    data: {
      canvasId: canvas.id,
      fromId: bbcaWatcher.id,
      toId: volumeCondition.id,
    },
  });

  await prisma.edge.create({
    data: {
      canvasId: canvas.id,
      fromId: surgeCondition.id,
      toId: thesisNote.id,
      fromHandle: 'true',
    },
  });

  await prisma.edge.create({
    data: {
      canvasId: canvas.id,
      fromId: surgeCondition.id,
      toId: toastAlert.id,
      fromHandle: 'true',
    },
  });

  await prisma.edge.create({
    data: {
      canvasId: canvas.id,
      fromId: volumeCondition.id,
      toId: actionNoteMutator.id,
      fromHandle: 'true',
    },
  });

  await prisma.edge.create({
    data: {
      canvasId: canvas.id,
      fromId: actionNoteMutator.id,
      toId: actionWatcherMutator.id,
    },
  });

  return { id: canvas.id, name: canvas.name };
}
