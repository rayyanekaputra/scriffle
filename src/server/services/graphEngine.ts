import { prisma } from '@/lib/prisma';
import { MarketEvent } from '@/types/canvas';
import { evaluateCondition } from './dslEngine';

export interface GraphExecutionResult {
  triggeredNodes: string[];
  mutationsCount: number;
  logs: string[];
}

/**
 * Interpolates string templates like "${symbol} surged ${price_change}% at ${timestamp}"
 */
function interpolateTemplate(template: string, event: MarketEvent): string {
  return template.replace(/\$\{(\w+)\}/g, (match, key) => {
    if (key in event) {
      const val = (event as any)[key];
      return typeof val === 'number' ? (Number.isInteger(val) ? val.toString() : val.toFixed(2)) : String(val);
    }
    return match;
  });
}

/**
 * Executes graph traversal and canvas mutations for a given MarketEvent.
 */
export async function executeGraphForEvent(
  canvasId: string,
  event: MarketEvent
): Promise<GraphExecutionResult> {
  const triggeredNodes: string[] = [];
  const logs: string[] = [];
  let mutationsCount = 0;

  // 1. Fetch all nodes and edges for the canvas
  const canvas = await prisma.canvas.findUnique({
    where: { id: canvasId },
    include: {
      nodes: true,
      edges: true,
    },
  });

  if (!canvas) {
    throw new Error(`Canvas with ID ${canvasId} not found`);
  }

  // 2. Identify active Watcher nodes matching event symbol
  const matchingWatchers = canvas.nodes.filter((node) => {
    if (node.type !== 'watcher') return false;
    try {
      const cfg = JSON.parse(node.configJson);
      return cfg.symbol?.toUpperCase() === event.symbol.toUpperCase();
    } catch {
      return false;
    }
  });

  if (matchingWatchers.length === 0) {
    return { triggeredNodes, mutationsCount, logs };
  }

  // BFS Queue: [currentNodeId, currentContextEvent]
  const queue: Array<{ nodeId: string; event: MarketEvent }> = [];
  const visited = new Set<string>();

  // Mark watchers as triggered, increment cycle count, and enqueue their children
  for (const watcher of matchingWatchers) {
    triggeredNodes.push(watcher.id);
    visited.add(watcher.id);

    let currentState: any = {};
    try {
      if (watcher.stateJson) currentState = JSON.parse(watcher.stateJson);
    } catch {}

    const newCycleCount = (currentState.cycleCount || 0) + 1;

    // Update watcher state with incremented cycle counter
    await prisma.node.update({
      where: { id: watcher.id },
      data: {
        stateJson: JSON.stringify({
          status: 'passed',
          lastValue: event,
          cycleCount: newCycleCount,
          lastTriggeredAt: event.timestamp || new Date().toLocaleTimeString(),
        }),
      },
    });

    const outgoing = canvas.edges.filter((e) => e.fromId === watcher.id);
    for (const edge of outgoing) {
      queue.push({ nodeId: edge.toId, event });
    }
  }

  // 3. Process BFS queue
  while (queue.length > 0) {
    const { nodeId, event: curEvent } = queue.shift()!;
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);

    const node = canvas.nodes.find((n) => n.id === nodeId);
    if (!node) continue;

    let branchShouldContinue = true;
    let nodeConfig: any = {};
    try {
      nodeConfig = JSON.parse(node.configJson);
    } catch {
      nodeConfig = {};
    }

    if (node.type === 'condition') {
      const passed = evaluateCondition(nodeConfig.rule || '', curEvent);
      await prisma.node.update({
        where: { id: node.id },
        data: {
          stateJson: JSON.stringify({
            status: passed ? 'passed' : 'failed',
            lastValue: curEvent,
            lastTriggeredAt: curEvent.timestamp || new Date().toLocaleTimeString(),
          }),
        },
      });

      if (passed) {
        triggeredNodes.push(node.id);
        logs.push(`Condition matched: "${nodeConfig.rule}" for ${curEvent.symbol}`);
      } else {
        branchShouldContinue = false;
        logs.push(`Condition not met: "${nodeConfig.rule}" for ${curEvent.symbol}`);
      }
    } else if (node.type === 'note') {
      triggeredNodes.push(node.id);
      const rawText = nodeConfig.template || nodeConfig.content || '';
      let updatedContent = '';

      // If text contains dynamic variables like ${symbol} or ${price_change}, interpolate them
      if (rawText.includes('${')) {
        updatedContent = interpolateTemplate(rawText, curEvent);
      } else {
        // Natural sticky note update: append or update with live market stamp
        updatedContent = rawText
          ? `${rawText}\n\n[Triggered: ${curEvent.symbol} ${curEvent.price_change >= 0 ? '+' : ''}${curEvent.price_change}% at ${curEvent.timestamp}]`
          : `Live: ${curEvent.symbol} surged ${curEvent.price_change}% at ${curEvent.timestamp}`;
      }

      await prisma.node.update({
        where: { id: node.id },
        data: {
          configJson: JSON.stringify({
            ...nodeConfig,
            content: updatedContent,
          }),
          stateJson: JSON.stringify({
            status: 'passed',
            lastTriggeredAt: curEvent.timestamp || new Date().toLocaleTimeString(),
          }),
        },
      });
      mutationsCount++;
      logs.push(`Sticky note updated: "${updatedContent.slice(0, 45)}..."`);
    } else if (node.type === 'alert') {
      triggeredNodes.push(node.id);
      const alertMsg = nodeConfig.messageTemplate
        ? interpolateTemplate(nodeConfig.messageTemplate, curEvent)
        : `Alert: ${curEvent.symbol} price change is ${curEvent.price_change}%`;

      await prisma.node.update({
        where: { id: node.id },
        data: {
          stateJson: JSON.stringify({
            status: 'passed',
            lastTriggeredAt: curEvent.timestamp || new Date().toLocaleTimeString(),
          }),
        },
      });

      await prisma.log.create({
        data: {
          canvasId,
          eventSummary: alertMsg,
          triggeredNodes: JSON.stringify([node.id]),
          detailsJson: JSON.stringify(curEvent),
        },
      });
      logs.push(`Notification fired: ${alertMsg}`);
    } else if (node.type === 'action') {
      triggeredNodes.push(node.id);
      await prisma.node.update({
        where: { id: node.id },
        data: {
          stateJson: JSON.stringify({
            status: 'passed',
            lastTriggeredAt: curEvent.timestamp || new Date().toLocaleTimeString(),
          }),
        },
      });

      if (nodeConfig.action === 'create_note') {
        const rawContent = nodeConfig.params?.template || 'Breakout confirmed for ${symbol} at ${timestamp}.';
        const noteContent = interpolateTemplate(rawContent, curEvent);

        // Count how many children this action node has already spawned to cascade cleanly
        const existingSpawned = canvas.edges.filter((e) => e.fromId === node.id);
        const spawnIndex = existingSpawned.length;

        // Position neatly to the right (X: +280px) and staggered vertically (+180px per note), with slight organic offset
        const newX = node.positionX + 280 + (spawnIndex % 2 === 1 ? 25 : 0);
        const newY = node.positionY + spawnIndex * 190 - 40;

        const newNode = await prisma.node.create({
          data: {
            canvasId,
            type: 'note',
            positionX: newX,
            positionY: newY,
            configJson: JSON.stringify({
              content: noteContent,
              color: spawnIndex % 2 === 0 ? 'mint' : 'pink',
              width: 300,
              height: 150,
            }),
            stateJson: JSON.stringify({
              status: 'passed',
              lastTriggeredAt: curEvent.timestamp || new Date().toLocaleTimeString(),
            }),
          },
        });

        await prisma.edge.create({
          data: {
            canvasId,
            fromId: node.id,
            toId: newNode.id,
          },
        });

        mutationsCount++;
        logs.push(`Added new sticky note on canvas`);
      }
    }

    // If branch continues, enqueue downstream children
    if (branchShouldContinue) {
      const outgoing = canvas.edges.filter((e) => e.fromId === node.id);
      for (const edge of outgoing) {
        queue.push({ nodeId: edge.toId, event: curEvent });
      }
    }
  }

  // Record main execution log
  if (triggeredNodes.length > 0) {
    await prisma.log.create({
      data: {
        canvasId,
        eventSummary: `Market event for ${event.symbol} (${event.price_change > 0 ? '+' : ''}${event.price_change}%) flowed through ${triggeredNodes.length} cards`,
        triggeredNodes: JSON.stringify(triggeredNodes),
        detailsJson: JSON.stringify({ event, logs }),
      },
    });
  }

  return {
    triggeredNodes,
    mutationsCount,
    logs,
  };
}
