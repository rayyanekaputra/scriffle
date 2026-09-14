import { prisma } from '@/lib/prisma';
import { MarketEvent, ScreenerCompanyResult } from '@/types/canvas';
import { evaluateCondition } from './dslEngine';
import {
  getCompanyFundamentalReport,
  fetchCompaniesScreener,
  MOCK_TOP_GAINERS,
  MOCK_TOP_LOSERS,
} from './sectorsApi';
import { exportReportToDisk } from './reportExporter';

export interface GraphExecutionResult {
  triggeredNodes: string[];
  mutationsCount: number;
  logs: string[];
}

/**
 * Interpolates string templates like "${symbol} surged ${price_change}% at ${timestamp}"
 */
export function interpolateTemplate(template: string, event: MarketEvent): string {
  const formattedPrice = event.price ? `Rp ${event.price.toLocaleString('id-ID')}` : 'Rp 0';
  const formattedVolume = event.volume
    ? event.volume >= 1_000_000_000
      ? `${(event.volume / 1_000_000_000).toFixed(1)}B`
      : event.volume >= 1_000_000
      ? `${(event.volume / 1_000_000).toFixed(1)}M`
      : `${(event.volume / 1_000).toFixed(0)}K`
    : '0';
  const formattedChange =
    event.price_change !== undefined
      ? `${event.price_change >= 0 ? '+' : ''}${event.price_change}%`
      : '0%';
  const direction = (event.price_change || 0) >= 0 ? 'Gainer' : 'Loser';
  const rankStr = event.rank ? `#${event.rank}` : '';

  const extendedVars: Record<string, string> = {
    symbol: event.symbol || '',
    price: formattedPrice,
    raw_price: String(event.price || 0),
    price_change: formattedChange,
    raw_price_change: String(event.price_change || 0),
    volume: formattedVolume,
    raw_volume: String(event.volume || 0),
    rank: rankStr,
    direction: direction,
    timestamp: event.timestamp || new Date().toLocaleTimeString(),
  };

  return template.replace(/\$\{(\w+)\}/g, (match, key) => {
    if (key in extendedVars) {
      return extendedVars[key];
    }
    if (key in event) {
      const val = (event as any)[key];
      return typeof val === 'number' ? (Number.isInteger(val) ? val.toString() : val.toFixed(2)) : String(val);
    }
    return match;
  });
}

export function generateDefaultNoteContent(event: MarketEvent): string {
  const isGainer = (event.price_change || 0) >= 0;
  const icon = isGainer ? '🚀' : '🔻';
  const category = event.rank ? `${isGainer ? 'TOP GAINER' : 'TOP LOSER'} #${event.rank}` : `${event.symbol} MARKET TICK`;
  const formattedPrice = event.price ? `Rp ${event.price.toLocaleString('id-ID')}` : 'N/A';
  const formattedChange = `${isGainer ? '+' : ''}${event.price_change}%`;
  const formattedVolume = event.volume
    ? event.volume >= 1_000_000_000
      ? `${(event.volume / 1_000_000_000).toFixed(1)}B shares`
      : event.volume >= 1_000_000
      ? `${(event.volume / 1_000_000).toFixed(1)}M shares`
      : `${(event.volume / 1_000).toFixed(0)}K shares`
    : 'N/A';

  return `${icon} ${category}\n• Stock: ${event.symbol}${event.name ? ` (${event.name})` : ''}\n• Price: ${formattedPrice} (${formattedChange})\n• Volume: ${formattedVolume}\n• Time: ${event.timestamp || new Date().toLocaleTimeString()}`;
}

export function generateLeaderboardNoteContent(movers: MarketEvent[], mode?: string, period?: string): string {
  if (!movers || movers.length === 0) {
    return `📊 TOP MOVERS LEADERBOARD\n• No movers data available\n• Time: ${new Date().toLocaleTimeString()}`;
  }
  const isGainer = mode === 'top_gainers' || mode === 'Top Gainers' || (movers[0] && movers[0].price_change >= 0);
  const icon = isGainer ? '🚀' : '🔻';
  const title = isGainer ? 'TOP GAINERS LEADERBOARD' : 'TOP LOSERS LEADERBOARD';
  const periodStr = period ? ` (${period.toUpperCase()})` : '';

  const rows = movers.map((m, idx) => {
    const rank = m.rank ? `#${m.rank}` : `#${idx + 1}`;
    const sym = m.symbol;
    const priceStr = m.price ? `Rp ${m.price.toLocaleString('id-ID')}` : 'N/A';
    const changeStr = `${m.price_change >= 0 ? '+' : ''}${m.price_change}%`;
    return `• ${rank} ${sym}: ${priceStr} (${changeStr})`;
  });

  return `${icon} ${title}${periodStr}\n${rows.join('\n')}\n• Updated: ${new Date().toLocaleTimeString()}`;
}

export interface FundamentalMutationInput {
  canvasId: string;
  canvasName: string;
  canvasNodes: any[];
  canvasEdges: any[];
  actionNode: { id: string; positionX: number; positionY: number };
  symbol: string;
  sessionApiKey?: string;
  triggerContextText?: string;
  spawnIndex?: number;
  marketEvent?: MarketEvent;
}

/**
 * Handles spawning or in-place dynamic refreshing of Fundamental Research Brief Notes and linked FileNodes.
 * When subsequent triggers/polls fire for an already researched symbol, updates the documents on disk and
 * in SQLite with an incremented revision count (Rev 2, Rev 3...) instead of duplicating canvas cards.
 */
export async function handleFundamentalReportMutation({
  canvasId,
  canvasName,
  canvasNodes,
  canvasEdges,
  actionNode,
  symbol,
  sessionApiKey,
  triggerContextText,
  spawnIndex = 0,
  marketEvent,
}: FundamentalMutationInput): Promise<{ mutationsCount: number; logMessage: string }> {
  const cleanSymbol = symbol.toUpperCase();
  const report = await getCompanyFundamentalReport(cleanSymbol, sessionApiKey, marketEvent);

  // 1. Check if there are already existing attached Note or File nodes for this symbol
  const outgoingEdges = canvasEdges.filter((e) => e.fromId === actionNode.id);
  const directChildNodes = canvasNodes.filter((n) => outgoingEdges.some((e) => e.toId === n.id));

  let existingNoteNode = directChildNodes.find((n) => {
    if (n.type !== 'note') return false;
    try {
      const cfg = JSON.parse(n.configJson);
      return cfg.symbol?.toUpperCase() === cleanSymbol || cfg.content?.includes(cleanSymbol);
    } catch {
      return false;
    }
  });

  let existingFileNode: any = null;
  if (existingNoteNode) {
    const noteOutgoing = canvasEdges.filter((e) => e.fromId === existingNoteNode.id);
    existingFileNode = canvasNodes.find((n) => noteOutgoing.some((e) => e.toId === n.id) && n.type === 'file');
  }
  if (!existingFileNode) {
    existingFileNode = directChildNodes.find((n) => {
      if (n.type !== 'file') return false;
      try {
        const cfg = JSON.parse(n.configJson);
        return cfg.symbol?.toUpperCase() === cleanSymbol || cfg.fileName?.startsWith(cleanSymbol);
      } catch {
        return false;
      }
    });
  }

  // 2. Determine revision count
  let currentRev = 1;
  const isRefresh = !!(existingNoteNode || existingFileNode);

  if (isRefresh) {
    if (existingFileNode) {
      try {
        const fCfg = JSON.parse(existingFileNode.configJson);
        if (fCfg.revisionCount) currentRev = Math.max(currentRev, fCfg.revisionCount);
      } catch {}
    }
    if (existingNoteNode) {
      try {
        const nCfg = JSON.parse(existingNoteNode.configJson);
        if (nCfg.revisionCount) currentRev = Math.max(currentRev, nCfg.revisionCount);
      } catch {}
    }
  }

  const nextRev = isRefresh ? currentRev + 1 : 1;

  // 3. Export HTML report to disk with revision count
  let exportedFile: any = null;
  try {
    exportedFile = await exportReportToDisk(canvasName || 'default_project', cleanSymbol, sessionApiKey, nextRev, marketEvent);
  } catch (exportErr) {
    console.error('Failed to auto-export report to disk:', exportErr);
  }

  const timestamp = new Date().toLocaleTimeString();
  const contextLine = triggerContextText ? `\n• Context: ${triggerContextText}` : '';
  const revisionLine = nextRev > 1 ? `\n• Status: In-Place Refresh (⚡ Rev ${nextRev})` : '';

  const fundamentalNoteContent = `📊 Fundamental Report: ${report.symbol}${nextRev > 1 ? ` (Rev ${nextRev})` : ''}\n${report.companyName}\n• Sector: ${report.sector} (${report.subSector})\n• Market Cap: ${report.marketCapFormatted}\n• Valuation: P/E ${report.peRatio}x | P/B ${report.pbvRatio}x\n• Dividend Yield: ${report.dividendYield}%\n• Margin: ${report.netProfitMargin}%${contextLine}${revisionLine}\n• Updated: ${timestamp}`;

  if (isRefresh) {
    let mutationsCount = 0;

    // In-place update for NoteNode
    if (existingNoteNode) {
      let nCfg: any = {};
      try { nCfg = JSON.parse(existingNoteNode.configJson); } catch {}
      await prisma.node.update({
        where: { id: existingNoteNode.id },
        data: {
          configJson: JSON.stringify({
            ...nCfg,
            content: fundamentalNoteContent,
            revisionCount: nextRev,
            symbol: cleanSymbol,
            lastUpdatedAt: timestamp,
          }),
          stateJson: JSON.stringify({
            status: 'passed',
            revisionCount: nextRev,
            lastTriggeredAt: timestamp,
          }),
        },
      });
      mutationsCount++;
    }

    // In-place update for FileNode
    if (existingFileNode) {
      let fCfg: any = {};
      try { fCfg = JSON.parse(existingFileNode.configJson); } catch {}
      await prisma.node.update({
        where: { id: existingFileNode.id },
        data: {
          configJson: JSON.stringify({
            ...fCfg,
            fileSize: exportedFile?.fileSize || fCfg.fileSize || '18.5 KB',
            savedLocally: true,
            isDownloaded: true,
            revisionCount: nextRev,
            symbol: cleanSymbol,
            downloadedAt: timestamp,
            lastUpdatedAt: timestamp,
            caption: `Auto-saved (Rev ${nextRev}) to reports/${canvasName || 'default'}`,
          }),
          stateJson: JSON.stringify({
            status: 'passed',
            revisionCount: nextRev,
            lastTriggeredAt: timestamp,
          }),
        },
      });
      mutationsCount++;
    }

    return {
      mutationsCount,
      logMessage: `Dynamically refreshed Fundamental Report (${cleanSymbol}) in-place (Rev ${nextRev})`,
    };
  }

  // Initial creation: Spawn NoteNode & FileNode
  const newX = actionNode.positionX + 280;
  const newY = actionNode.positionY + spawnIndex * 220 - 40;

  const noteNode = await prisma.node.create({
    data: {
      canvasId,
      type: 'note',
      positionX: newX,
      positionY: newY,
      configJson: JSON.stringify({
        content: fundamentalNoteContent,
        color: 'blue',
        width: 320,
        height: 180,
        revisionCount: 1,
        symbol: cleanSymbol,
        lastUpdatedAt: timestamp,
      }),
      stateJson: JSON.stringify({
        status: 'passed',
        revisionCount: 1,
        lastTriggeredAt: timestamp,
      }),
    },
  });

  await prisma.edge.create({
    data: {
      canvasId,
      fromId: actionNode.id,
      toId: noteNode.id,
    },
  });

  const reportUrl = `/api/export/report?symbol=${report.symbol}&rev=1`;
  const fileNode = await prisma.node.create({
    data: {
      canvasId,
      type: 'file',
      positionX: newX + 350,
      positionY: newY + 20,
      configJson: JSON.stringify({
        fileName: exportedFile?.fileName || `${report.symbol}_Fundamental_Brief.html`,
        fileUrl: reportUrl,
        filePath: exportedFile?.filePath || `reports/${canvasName || 'default'}/${report.symbol}_Fundamental_Brief.html`,
        fileSize: exportedFile?.fileSize || '18.5 KB',
        fileCategory: 'document',
        savedLocally: true,
        isDownloaded: true,
        revisionCount: 1,
        symbol: cleanSymbol,
        downloadedAt: timestamp,
        lastUpdatedAt: timestamp,
        caption: `Auto-saved to reports/${canvasName || 'default'}`,
      }),
      stateJson: JSON.stringify({
        status: 'passed',
        revisionCount: 1,
        lastTriggeredAt: timestamp,
      }),
    },
  });

  await prisma.edge.create({
    data: {
      canvasId,
      fromId: noteNode.id,
      toId: fileNode.id,
    },
  });

  return {
    mutationsCount: 2,
    logMessage: `Generated Fundamental Report (${report.symbol}) & auto-saved to /reports (Rev 1)`,
  };
}

/**
 * Executes graph traversal and canvas mutations for a given MarketEvent.
 */
export async function executeGraphForEvent(
  canvasId: string,
  event: MarketEvent,
  sessionApiKey?: string
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

  // 2. Identify active Watcher nodes matching event symbol (Radar Watchers are exclusively handled by executeGraphForRadarWatcher)
  const matchingWatchers = canvas.nodes.filter((node) => {
    if (node.type !== 'watcher') return false;
    try {
      const cfg = JSON.parse(node.configJson);
      const sym = cfg.symbol?.toUpperCase();
      const mode = cfg.mode;

      const isRadar =
        mode === 'top_gainers' ||
        mode === 'top_losers' ||
        sym === 'TOP_GAINERS' ||
        sym === 'TOP_LOSERS' ||
        sym === 'TOP GAINERS' ||
        sym === 'TOP LOSERS';

      // Radar Watchers must only be executed via executeGraphForRadarWatcher
      if (isRadar) {
        return false;
      }

      // Check standard single-symbol match
      return sym === event.symbol.toUpperCase();
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
    let watcherCfg: any = {};
    try {
      if (watcher.stateJson) currentState = JSON.parse(watcher.stateJson);
      if (watcher.configJson) watcherCfg = JSON.parse(watcher.configJson);
    } catch {}

    const newCycleCount = (currentState.cycleCount || 0) + 1;

    // Update watcher state with incremented cycle counter
    await prisma.node.update({
      where: { id: watcher.id },
      data: {
        stateJson: JSON.stringify({
          status: 'passed',
          lastValue: event,
          movers: currentState.movers,
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
        // Natural sticky note update: generate clean structured financial summary
        updatedContent = generateDefaultNoteContent(curEvent);
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
        const rawContent = nodeConfig.params?.template || nodeConfig.template;
        const noteContent = rawContent
          ? interpolateTemplate(rawContent, curEvent)
          : generateDefaultNoteContent(curEvent);

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
              color: (curEvent.price_change || 0) >= 0 ? 'mint' : 'pink',
              width: 300,
              height: 160,
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
      } else if (nodeConfig.action === 'create_watcher') {
        const targetSymbol = (nodeConfig.targetSymbol || nodeConfig.params?.symbol || curEvent.symbol).toUpperCase();
        
        // Avoid duplicate watchers on canvas for same symbol
        const alreadyExists = canvas.nodes.some((n) => {
          if (n.type !== 'watcher') return false;
          try {
            const cfg = JSON.parse(n.configJson);
            return cfg.symbol?.toUpperCase() === targetSymbol.toUpperCase();
          } catch {
            return false;
          }
        });

        if (!alreadyExists) {
          const newX = node.positionX + 280;
          const newY = node.positionY + 20;

          // 1. Create Watcher Node
          const newWatcher = await prisma.node.create({
            data: {
              canvasId,
              type: 'watcher',
              positionX: newX,
              positionY: newY,
              configJson: JSON.stringify({
                symbol: targetSymbol,
                metric: 'price_change',
                interval: nodeConfig.interval || 300,
              }),
              stateJson: JSON.stringify({
                status: 'passed',
                cycleCount: 1,
                lastValue: curEvent,
                lastTriggeredAt: curEvent.timestamp || new Date().toLocaleTimeString(),
              }),
            },
          });

          await prisma.edge.create({
            data: {
              canvasId,
              fromId: node.id,
              toId: newWatcher.id,
            },
          });

          // 2. Auto-spawn downstream Condition Node connected to the new Watcher
          const condNode = await prisma.node.create({
            data: {
              canvasId,
              type: 'condition',
              positionX: newX + 260,
              positionY: newY,
              configJson: JSON.stringify({
                rule: 'price_change > 0',
              }),
              stateJson: JSON.stringify({
                status: (curEvent.price_change || 0) > 0 ? 'passed' : 'idle',
                lastValue: curEvent.price_change,
                lastTriggeredAt: curEvent.timestamp || new Date().toLocaleTimeString(),
              }),
            },
          });

          await prisma.edge.create({
            data: {
              canvasId,
              fromId: newWatcher.id,
              toId: condNode.id,
            },
          });

          // 3. Auto-spawn downstream Note Node connected to Condition Node
          const noteNode = await prisma.node.create({
            data: {
              canvasId,
              type: 'note',
              positionX: newX + 520,
              positionY: newY - 20,
              configJson: JSON.stringify({
                content: `🚀 Auto-Tracked: ${targetSymbol}\n• Price: Rp ${(curEvent.price || 0).toLocaleString()}\n• Change: ${curEvent.price_change >= 0 ? '+' : ''}${curEvent.price_change}%\n• Status: Active Pipeline`,
                template: `🚀 Auto-Tracked: \${symbol}\n• Price: Rp \${price}\n• Change: \${price_change}%\n• Updated: \${timestamp}`,
                color: 'mint',
                width: 280,
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
              fromId: condNode.id,
              toId: noteNode.id,
            },
          });

          mutationsCount += 3;
          logs.push(`Auto-spawned complete tracking pipeline (${targetSymbol} -> Condition -> Note)`);
        }
      } else if (nodeConfig.action === 'fundamental_report') {
        const res = await handleFundamentalReportMutation({
          canvasId,
          canvasName: canvas.name,
          canvasNodes: canvas.nodes,
          canvasEdges: canvas.edges,
          actionNode: node,
          symbol: curEvent.symbol,
          sessionApiKey,
          triggerContextText: `Triggered by ${curEvent.price_change >= 0 ? '+' : ''}${curEvent.price_change}% move`,
          spawnIndex: canvas.edges.filter((e) => e.fromId === node.id).length,
          marketEvent: curEvent,
        });
        mutationsCount += res.mutationsCount;
        logs.push(res.logMessage);
      }
    } else if (node.type === 'watcher') {
      triggeredNodes.push(node.id);
      let currentState: any = {};
      try {
        if (node.stateJson) currentState = JSON.parse(node.stateJson);
      } catch {}
      const newCycleCount = (currentState.cycleCount || 0) + 1;

      const updatedConfig = {
        ...nodeConfig,
        symbol: nodeConfig.symbol || curEvent.symbol,
      };

      await prisma.node.update({
        where: { id: node.id },
        data: {
          configJson: JSON.stringify(updatedConfig),
          stateJson: JSON.stringify({
            status: 'passed',
            lastValue: curEvent,
            cycleCount: newCycleCount,
            lastTriggeredAt: curEvent.timestamp || new Date().toLocaleTimeString(),
          }),
        },
      });
      logs.push(`Watcher ${updatedConfig.symbol} triggered by upstream node`);
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

/**
 * Executes graph traversal and mutations for a Top Gainers / Losers Radar Watcher
 * using the full list of ranked movers.
 */
export async function executeGraphForRadarWatcher(
  canvasId: string,
  watcherId: string,
  movers: MarketEvent[],
  sessionApiKey?: string,
  isLive: boolean = true,
  apiError?: { code: number; message: string }
): Promise<GraphExecutionResult> {
  const triggeredNodes: string[] = [];
  const logs: string[] = [];
  let mutationsCount = 0;

  if (!movers || movers.length === 0) {
    return { triggeredNodes, mutationsCount, logs };
  }

  const canvas = await prisma.canvas.findUnique({
    where: { id: canvasId },
    include: { nodes: true, edges: true },
  });

  if (!canvas) return { triggeredNodes, mutationsCount, logs };

  const watcher = canvas.nodes.find((n) => n.id === watcherId);
  if (!watcher) return { triggeredNodes, mutationsCount, logs };

  let watcherCfg: any = {};
  let watcherState: any = {};
  try {
    if (watcher.configJson) watcherCfg = JSON.parse(watcher.configJson);
    if (watcher.stateJson) watcherState = JSON.parse(watcher.stateJson);
  } catch {}

  const newCycleCount = (watcherState.cycleCount || 0) + 1;
  const top1 = movers[0];
  const hasError = !!apiError && !!sessionApiKey && sessionApiKey.trim().length > 0;
  const nodeStatus = hasError ? 'error' : 'passed';

  // 1. Update Watcher node state with full movers list + error / live metadata
  await prisma.node.update({
    where: { id: watcher.id },
    data: {
      stateJson: JSON.stringify({
        status: nodeStatus,
        lastValue: top1,
        movers: movers,
        cycleCount: newCycleCount,
        lastTriggeredAt: new Date().toLocaleTimeString(),
        isLive: isLive && !hasError,
        error: hasError ? apiError : undefined,
      }),
    },
  });
  triggeredNodes.push(watcher.id);

  // 2. Traverse outgoing edges from this radar watcher
  const outgoingEdges = canvas.edges.filter((e) => e.fromId === watcher.id);

  for (const edge of outgoingEdges) {
    const targetNode = canvas.nodes.find((n) => n.id === edge.toId);
    if (!targetNode) continue;

    let targetCfg: any = {};
    try {
      if (targetNode.configJson) targetCfg = JSON.parse(targetNode.configJson);
    } catch {}

    if (targetNode.type === 'note') {
      // Flow 1: Direct connected note -> Formats full ranked leaderboard summary
      triggeredNodes.push(targetNode.id);
      const rawText = targetCfg.template || targetCfg.content || '';
      let updatedContent = '';

      if (rawText.includes('${rankings_table}') || rawText.includes('${rankings_list}')) {
        const tableStr = generateLeaderboardNoteContent(movers, watcherCfg.mode, watcherCfg.period);
        updatedContent = rawText
          .replace(/\$\{rankings_table\}/g, tableStr)
          .replace(/\$\{rankings_list\}/g, tableStr);
      } else if (rawText.includes('${') && !rawText.startsWith('🚀') && !rawText.startsWith('🔻')) {
        // Interpolate using top #1 mover details
        updatedContent = interpolateTemplate(rawText, top1);
      } else {
        // Default: Clean structured leaderboard note content
        updatedContent = generateLeaderboardNoteContent(movers, watcherCfg.mode, watcherCfg.period);
      }

      await prisma.node.update({
        where: { id: targetNode.id },
        data: {
          configJson: JSON.stringify({
            ...targetCfg,
            content: updatedContent,
          }),
          stateJson: JSON.stringify({
            status: 'passed',
            lastTriggeredAt: new Date().toLocaleTimeString(),
          }),
        },
      });
      mutationsCount++;
      logs.push(`Sticky note updated with Top Movers leaderboard`);
    } else if (targetNode.type === 'action') {
      // Flow 2: Action Node -> create_note or other actions
      triggeredNodes.push(targetNode.id);
      await prisma.node.update({
        where: { id: targetNode.id },
        data: {
          stateJson: JSON.stringify({
            status: 'passed',
            lastTriggeredAt: new Date().toLocaleTimeString(),
          }),
        },
      });

      if (targetCfg.action === 'create_note') {
        // Spawn individual notes for each ranked stock in movers
        const existingSpawned = canvas.edges.filter((e) => e.fromId === targetNode.id);
        const baseSpawnIndex = existingSpawned.length;

        for (let i = 0; i < movers.length; i++) {
          const mover = movers[i];
          const rawContent = targetCfg.params?.template || targetCfg.template;
          const noteContent = rawContent
            ? interpolateTemplate(rawContent, mover)
            : generateDefaultNoteContent(mover);

          const spawnIdx = baseSpawnIndex + i;
          const newX = targetNode.positionX + 280 + (spawnIdx % 2 === 1 ? 25 : 0);
          const newY = targetNode.positionY + spawnIdx * 190 - 40;

          const newNode = await prisma.node.create({
            data: {
              canvasId,
              type: 'note',
              positionX: newX,
              positionY: newY,
              configJson: JSON.stringify({
                content: noteContent,
                color: (mover.price_change || 0) >= 0 ? 'mint' : 'pink',
                width: 300,
                height: 160,
              }),
              stateJson: JSON.stringify({
                status: 'passed',
                lastTriggeredAt: mover.timestamp || new Date().toLocaleTimeString(),
              }),
            },
          });

          await prisma.edge.create({
            data: {
              canvasId,
              fromId: targetNode.id,
              toId: newNode.id,
            },
          });

          mutationsCount++;
        }
        logs.push(`Spawned ${movers.length} individual sticky notes for Top Movers`);
      } else if (targetCfg.action === 'fundamental_report') {
        for (let i = 0; i < movers.length; i++) {
          const mover = movers[i];
          const res = await handleFundamentalReportMutation({
            canvasId,
            canvasName: canvas.name,
            canvasNodes: canvas.nodes,
            canvasEdges: canvas.edges,
            actionNode: targetNode,
            symbol: mover.symbol,
            sessionApiKey,
            triggerContextText: `Rank #${mover.rank || i + 1} (${mover.price_change >= 0 ? '+' : ''}${mover.price_change}%)`,
            spawnIndex: i,
            marketEvent: mover,
          });
          mutationsCount += res.mutationsCount;
        }
        logs.push(`Processed fundamental reports & PDF briefs for ${movers.length} top movers`);
      } else if (targetCfg.action === 'create_watcher') {
        const existingSpawned = canvas.edges.filter((e) => e.fromId === targetNode.id);
        const baseSpawnIndex = existingSpawned.length;
        let spawnedCount = 0;

        for (let i = 0; i < movers.length; i++) {
          const mover = movers[i];
          const targetSymbol = (targetCfg.targetSymbol || targetCfg.params?.symbol || mover.symbol).toUpperCase();

          // Avoid duplicate watchers for same symbol on canvas
          const alreadyExists = canvas.nodes.some((n) => {
            if (n.type !== 'watcher') return false;
            try {
              const cfg = JSON.parse(n.configJson);
              return cfg.symbol?.toUpperCase() === targetSymbol;
            } catch {
              return false;
            }
          });

          if (!alreadyExists) {
            const spawnIdx = baseSpawnIndex + spawnedCount;
            const newX = targetNode.positionX + 280;
            const newY = targetNode.positionY + spawnIdx * 200 - 20;

            // 1. Create Watcher Node
            const newWatcher = await prisma.node.create({
              data: {
                canvasId,
                type: 'watcher',
                positionX: newX,
                positionY: newY,
                configJson: JSON.stringify({
                  symbol: targetSymbol,
                  metric: 'price_change',
                  interval: targetCfg.interval || 300, // default 300s
                }),
                stateJson: JSON.stringify({
                  status: 'passed',
                  cycleCount: 1,
                  lastValue: mover,
                  lastTriggeredAt: mover.timestamp || new Date().toLocaleTimeString(),
                }),
              },
            });

            await prisma.edge.create({
              data: {
                canvasId,
                fromId: targetNode.id,
                toId: newWatcher.id,
              },
            });

            // 2. Auto-spawn downstream Condition Node connected to the new Watcher
            const condNode = await prisma.node.create({
              data: {
                canvasId,
                type: 'condition',
                positionX: newX + 260,
                positionY: newY,
                configJson: JSON.stringify({
                  rule: 'price_change > 0',
                }),
                stateJson: JSON.stringify({
                  status: (mover.price_change || 0) > 0 ? 'passed' : 'idle',
                  lastValue: mover.price_change,
                  lastTriggeredAt: mover.timestamp || new Date().toLocaleTimeString(),
                }),
              },
            });

            await prisma.edge.create({
              data: {
                canvasId,
                fromId: newWatcher.id,
                toId: condNode.id,
              },
            });

            // 3. Auto-spawn downstream Note Node connected to Condition Node
            const noteNode = await prisma.node.create({
              data: {
                canvasId,
                type: 'note',
                positionX: newX + 520,
                positionY: newY - 20,
                configJson: JSON.stringify({
                  content: `🚀 Auto-Tracked: ${targetSymbol}\n• Price: Rp ${(mover.price || 0).toLocaleString()}\n• Change: ${mover.price_change >= 0 ? '+' : ''}${mover.price_change}%\n• Rank #${mover.rank || i + 1} mover`,
                  template: `🚀 Auto-Tracked: \${symbol}\n• Price: Rp \${price}\n• Change: \${price_change}%\n• Updated: \${timestamp}`,
                  color: (mover.price_change || 0) >= 0 ? 'mint' : 'pink',
                  width: 280,
                  height: 150,
                }),
                stateJson: JSON.stringify({
                  status: 'passed',
                  lastTriggeredAt: mover.timestamp || new Date().toLocaleTimeString(),
                }),
              },
            });

            await prisma.edge.create({
              data: {
                canvasId,
                fromId: condNode.id,
                toId: noteNode.id,
              },
            });

            mutationsCount += 3;
            spawnedCount++;
          }
        }
        logs.push(`Auto-spawned ${spawnedCount} dedicated breakout watchers on canvas (300s interval)`);
      }
    } else if (targetNode.type === 'alert') {
      triggeredNodes.push(targetNode.id);
      const isGainer = (top1.price_change || 0) >= 0;
      const alertMsg = targetCfg.messageTemplate
        ? interpolateTemplate(targetCfg.messageTemplate, top1)
        : `Leaderboard Alert: Top 1 ${isGainer ? 'Gainer' : 'Loser'} is ${top1.symbol} (${top1.price_change >= 0 ? '+' : ''}${top1.price_change}%)`;

      await prisma.node.update({
        where: { id: targetNode.id },
        data: {
          stateJson: JSON.stringify({
            status: 'passed',
            lastTriggeredAt: new Date().toLocaleTimeString(),
          }),
        },
      });

      await prisma.log.create({
        data: {
          canvasId,
          eventSummary: alertMsg,
          triggeredNodes: JSON.stringify([targetNode.id]),
          detailsJson: JSON.stringify(movers),
        },
      });
      logs.push(`Notification fired: ${alertMsg}`);
    } else if (targetNode.type === 'condition') {
      // Evaluate condition for each mover and propagate
      for (const mover of movers) {
        await executeGraphForEvent(canvasId, mover);
      }
    } else if (targetNode.type === 'watcher') {
      triggeredNodes.push(targetNode.id);
      if (movers.length > 0) {
        const topSymbol = movers[0].symbol.toUpperCase();
        let currentState: any = {};
        try {
          if (targetNode.stateJson) currentState = JSON.parse(targetNode.stateJson);
        } catch {}
        const newCycleCount = (currentState.cycleCount || 0) + 1;

        await prisma.node.update({
          where: { id: targetNode.id },
          data: {
            configJson: JSON.stringify({
              ...targetCfg,
              symbol: targetCfg.symbol || topSymbol,
            }),
            stateJson: JSON.stringify({
              status: 'passed',
              cycleCount: newCycleCount,
              lastValue: movers[0],
              lastTriggeredAt: movers[0].timestamp || new Date().toLocaleTimeString(),
            }),
          },
        });
        mutationsCount++;
        logs.push(`Watcher ${targetCfg.symbol || topSymbol} adopted Top Mover ${topSymbol}`);
      }
    }
  }

  // Record main execution log
  if (triggeredNodes.length > 0) {
    const isGainer = watcherCfg.mode === 'top_gainers' || watcherCfg.mode === 'Top Gainers';
    await prisma.log.create({
      data: {
        canvasId,
        eventSummary: `Leaderboard poll: Top ${movers.length} ${isGainer ? 'Gainers' : 'Losers'} (${top1.symbol} #${top1.rank}) flowed through ${triggeredNodes.length} cards`,
        triggeredNodes: JSON.stringify(triggeredNodes),
        detailsJson: JSON.stringify({ movers, logs }),
      },
    });
  }

  return {
    triggeredNodes,
    mutationsCount,
    logs,
  };
}

/**
 * Formats a clean, readable Markdown summary of AI Screener results for Sticky Notes.
 */
export function generateScreenerNoteContent(
  query: string,
  results: ScreenerCompanyResult[],
  queryValues?: Record<string, any>
): string {
  if (!results || results.length === 0) {
    return `✨ AI SCREENER RESULTS\n• Query: "${query || 'All Companies'}"\n• No companies matched the screening criteria\n• Time: ${new Date().toLocaleTimeString()}`;
  }

  const promptTitle = query ? `"${query}"` : 'Market Screener';
  const rows = results.map((c, idx) => {
    const rank = `#${idx + 1}`;
    const sym = c.symbol;
    const metrics: string[] = [];

    if (c.price) metrics.push(`Rp ${c.price.toLocaleString('id-ID')}`);
    
    if (c.market_cap) {
      const mcapStr =
        c.market_cap >= 1_000_000_000_000_000
          ? `Mcap Rp ${(c.market_cap / 1_000_000_000_000_000).toFixed(2)} Q`
          : c.market_cap >= 1_000_000_000_000
          ? `Mcap Rp ${(c.market_cap / 1_000_000_000_000).toFixed(1)} T`
          : `Mcap Rp ${(c.market_cap / 1_000_000_000).toFixed(0)} B`;
      metrics.push(mcapStr);
    }

    if (c.pe !== undefined && c.pe !== null) metrics.push(`P/E ${c.pe}x`);
    if (c.dividend_yield !== undefined && c.dividend_yield !== null) metrics.push(`Div ${c.dividend_yield}%`);
    if (c.pb !== undefined && c.pb !== null && metrics.length < 4) metrics.push(`P/B ${c.pb}x`);
    if (c.roe !== undefined && c.roe !== null && metrics.length < 4) metrics.push(`ROE ${c.roe}%`);
    if (c.revenue !== undefined && c.revenue !== null && metrics.length < 4) {
      const revStr = c.revenue >= 1_000_000_000_000 ? `Rev Rp ${(c.revenue / 1_000_000_000_000).toFixed(1)} T` : `Rev Rp ${(c.revenue / 1_000_000_000).toFixed(0)} B`;
      metrics.push(revStr);
    }

    // Dynamic field check if no metrics were pushed
    if (metrics.length === 0) {
      for (const [k, v] of Object.entries(c)) {
        if (['symbol', 'company_name', 'name', 'sector', 'sub_sector', 'rank', 'id', 'canvasId', 'type'].includes(k)) continue;
        const n = Number(v);
        if (!isNaN(n)) {
          metrics.push(`${k}: ${n >= 1_000_000_000_000 ? `Rp ${(n / 1_000_000_000_000).toFixed(1)} T` : n}`);
          if (metrics.length >= 3) break;
        }
      }
    }

    if (metrics.length === 0 && (c.sub_sector || c.sector)) {
      metrics.push(c.sub_sector || c.sector || 'Listed');
    }

    return `• ${rank} ${sym} (${c.company_name}): ${metrics.join(' | ')}`;
  });

  return `✨ AI SCREENER: ${promptTitle}\n${rows.join('\n')}\n• Screened: ${new Date().toLocaleTimeString()}`;
}

/**
 * Executes graph traversal and mutations for an AI Natural Language Screener node.
 */
export async function executeGraphForScreener(
  canvasId: string,
  screenerId: string,
  sessionApiKey?: string
): Promise<GraphExecutionResult> {
  const triggeredNodes: string[] = [];
  const logs: string[] = [];
  let mutationsCount = 0;

  const canvas = await prisma.canvas.findUnique({
    where: { id: canvasId },
    include: { nodes: true, edges: true },
  });

  if (!canvas) return { triggeredNodes, mutationsCount, logs };

  const screener = canvas.nodes.find((n) => n.id === screenerId);
  if (!screener) return { triggeredNodes, mutationsCount, logs };

  let screenerCfg: any = {};
  let screenerState: any = {};
  try {
    if (screener.configJson) screenerCfg = JSON.parse(screener.configJson);
    if (screener.stateJson) screenerState = JSON.parse(screener.stateJson);
  } catch {}

  const limit = screenerCfg.limit || 5;
  const screenerResult = await fetchCompaniesScreener(
    {
      q: screenerCfg.query || 'top 5 banks by market cap',
      where: screenerCfg.where,
      orderBy: screenerCfg.orderBy,
      desc: screenerCfg.desc,
      limit,
    },
    sessionApiKey
  );

  const results = screenerResult.data || [];
  const newCycleCount = (screenerState.cycleCount || 0) + 1;

  // 1. Update Screener node state with results
  await prisma.node.update({
    where: { id: screener.id },
    data: {
      stateJson: JSON.stringify({
        status: 'passed',
        screenerResults: results,
        queryValues: screenerResult.queryValues,
        screenerQuery: screenerCfg.query || 'top 5 banks by market cap',
        cycleCount: newCycleCount,
        lastTriggeredAt: new Date().toLocaleTimeString(),
      }),
    },
  });
  triggeredNodes.push(screener.id);
  logs.push(`AI Screener executed: "${screenerCfg.query || 'top companies'}" (${results.length} companies returned)`);

  if (results.length === 0) {
    return { triggeredNodes, mutationsCount, logs };
  }

  // 2. Traverse outgoing edges from this screener node
  const outgoingEdges = canvas.edges.filter((e) => e.fromId === screener.id);

  for (const edge of outgoingEdges) {
    const targetNode = canvas.nodes.find((n) => n.id === edge.toId);
    if (!targetNode) continue;

    let targetCfg: any = {};
    try {
      if (targetNode.configJson) targetCfg = JSON.parse(targetNode.configJson);
    } catch {}

    if (targetNode.type === 'note') {
      // Flow 1: Direct connected note -> Formats full screener results table
      triggeredNodes.push(targetNode.id);
      const updatedContent = generateScreenerNoteContent(
        screenerCfg.query,
        results,
        screenerResult.queryValues
      );

      await prisma.node.update({
        where: { id: targetNode.id },
        data: {
          configJson: JSON.stringify({
            ...targetCfg,
            content: updatedContent,
          }),
          stateJson: JSON.stringify({
            status: 'passed',
            lastTriggeredAt: new Date().toLocaleTimeString(),
          }),
        },
      });
      mutationsCount++;
      logs.push(`Sticky note updated with AI Screener results table`);
    } else if (targetNode.type === 'action') {
      // Flow 2: Action Node -> create_note, fundamental_report, create_watcher
      triggeredNodes.push(targetNode.id);
      await prisma.node.update({
        where: { id: targetNode.id },
        data: {
          stateJson: JSON.stringify({
            status: 'passed',
            lastTriggeredAt: new Date().toLocaleTimeString(),
          }),
        },
      });

      if (targetCfg.action === 'create_note') {
        // Spawn individual notes for each screened stock
        const existingSpawned = canvas.edges.filter((e) => e.fromId === targetNode.id);
        const baseSpawnIndex = existingSpawned.length;

        for (let i = 0; i < results.length; i++) {
          const comp = results[i];
          const mcapFormatted = comp.market_cap
            ? comp.market_cap >= 1_000_000_000_000_000
              ? `Rp ${(comp.market_cap / 1_000_000_000_000_000).toFixed(2)} Q`
              : `Rp ${(comp.market_cap / 1_000_000_000_000).toFixed(1)} T`
            : 'N/A';

          const noteContent = `✨ AI SCREENER RESULT #${i + 1}\n• Company: ${comp.symbol} (${comp.company_name})\n• Sector: ${comp.sector || 'General'}\n• Market Cap: ${mcapFormatted}\n• Valuation: P/E ${comp.pe ? `${comp.pe}x` : 'N/A'} | P/B ${comp.pb ? `${comp.pb}x` : 'N/A'}\n• Dividend Yield: ${comp.dividend_yield ? `${comp.dividend_yield}%` : 'N/A'}\n• Time: ${new Date().toLocaleTimeString()}`;

          const spawnIdx = baseSpawnIndex + i;
          const newX = targetNode.positionX + 280;
          const newY = targetNode.positionY + spawnIdx * 190 - 40;

          const newNode = await prisma.node.create({
            data: {
              canvasId,
              type: 'note',
              positionX: newX,
              positionY: newY,
              configJson: JSON.stringify({
                content: noteContent,
                color: 'blue',
                width: 310,
                height: 160,
              }),
              stateJson: JSON.stringify({
                status: 'passed',
                lastTriggeredAt: new Date().toLocaleTimeString(),
              }),
            },
          });

          await prisma.edge.create({
            data: {
              canvasId,
              fromId: targetNode.id,
              toId: newNode.id,
            },
          });

          mutationsCount++;
        }
        logs.push(`Spawned ${results.length} individual sticky notes for AI Screener results`);
      } else if (targetCfg.action === 'fundamental_report') {
        for (let i = 0; i < results.length; i++) {
          const comp = results[i];
          const res = await handleFundamentalReportMutation({
            canvasId,
            canvasName: canvas.name,
            canvasNodes: canvas.nodes,
            canvasEdges: canvas.edges,
            actionNode: targetNode,
            symbol: comp.symbol,
            sessionApiKey,
            triggerContextText: `Rank #${i + 1} from AI Screener: "${screenerCfg.query || 'Screen'}"`,
            spawnIndex: i,
            marketEvent: {
              symbol: comp.symbol,
              name: comp.company_name,
              price: comp.price || 5000,
              prevPrice: comp.price || 5000,
              price_change: comp.price_change || 0,
              volume: comp.volume || 10000000,
              avg_volume: 10000000,
              rank: i + 1,
              timestamp: new Date().toLocaleTimeString(),
            },
          });
          mutationsCount += res.mutationsCount;
        }
        logs.push(`Processed fundamental reports & PDF briefs for ${results.length} screened companies`);
      } else if (targetCfg.action === 'create_watcher') {
        // Spawn complete automated Watcher pipelines [Watcher -> Condition -> Note]
        const existingSpawned = canvas.edges.filter((e) => e.fromId === targetNode.id);
        const baseSpawnIndex = existingSpawned.length;
        let spawnedCount = 0;

        for (let i = 0; i < results.length; i++) {
          const comp = results[i];
          const targetSymbol = comp.symbol.toUpperCase();

          const alreadyExists = canvas.nodes.some((n) => {
            if (n.type !== 'watcher') return false;
            try {
              const cfg = JSON.parse(n.configJson);
              return cfg.symbol?.toUpperCase() === targetSymbol;
            } catch {
              return false;
            }
          });

          if (!alreadyExists) {
            const spawnIdx = baseSpawnIndex + spawnedCount;
            const newX = targetNode.positionX + 280;
            const newY = targetNode.positionY + spawnIdx * 200 - 20;

            const newWatcher = await prisma.node.create({
              data: {
                canvasId,
                type: 'watcher',
                positionX: newX,
                positionY: newY,
                configJson: JSON.stringify({
                  symbol: targetSymbol,
                  metric: 'price_change',
                  interval: 300,
                  cycleCount: 0,
                  mode: 'single',
                }),
                stateJson: JSON.stringify({
                  status: 'idle',
                  cycleCount: 0,
                  lastTriggeredAt: new Date().toLocaleTimeString(),
                }),
              },
            });

            await prisma.edge.create({
              data: {
                canvasId,
                fromId: targetNode.id,
                toId: newWatcher.id,
              },
            });

            const newCondition = await prisma.node.create({
              data: {
                canvasId,
                type: 'condition',
                positionX: newX + 260,
                positionY: newY,
                configJson: JSON.stringify({
                  rule: 'price_change > 0',
                }),
                stateJson: JSON.stringify({
                  status: 'idle',
                  lastTriggeredAt: new Date().toLocaleTimeString(),
                }),
              },
            });

            await prisma.edge.create({
              data: {
                canvasId,
                fromId: newWatcher.id,
                toId: newCondition.id,
              },
            });

            const newNote = await prisma.node.create({
              data: {
                canvasId,
                type: 'note',
                positionX: newX + 540,
                positionY: newY,
                configJson: JSON.stringify({
                  content: `📡 Live Watcher: ${targetSymbol} (${comp.company_name})\n• Auto-spawned from AI Screener: "${screenerCfg.query || 'Screen'}"\n• Tracking live market price & volume`,
                  color: 'mint',
                  width: 280,
                  height: 150,
                }),
                stateJson: JSON.stringify({
                  status: 'passed',
                  lastTriggeredAt: new Date().toLocaleTimeString(),
                }),
              },
            });

            await prisma.edge.create({
              data: {
                canvasId,
                fromId: newCondition.id,
                toId: newNote.id,
              },
            });

            mutationsCount += 3;
            spawnedCount++;
          }
        }
        logs.push(`Spawned ${spawnedCount} automated watcher pipelines from AI Screener`);
      }
    } else if (targetNode.type === 'alert') {
      triggeredNodes.push(targetNode.id);
      const alertMsg = `✨ AI Screener found ${results.length} companies matching "${screenerCfg.query || 'query'}"`;

      await prisma.node.update({
        where: { id: targetNode.id },
        data: {
          stateJson: JSON.stringify({
            status: 'passed',
            lastTriggeredAt: new Date().toLocaleTimeString(),
          }),
        },
      });

      await prisma.log.create({
        data: {
          canvasId,
          eventSummary: alertMsg,
          triggeredNodes: JSON.stringify([targetNode.id]),
          detailsJson: JSON.stringify(results),
        },
      });
      logs.push(`Notification fired: ${alertMsg}`);
    } else if (targetNode.type === 'watcher') {
      triggeredNodes.push(targetNode.id);
      if (results.length > 0) {
        const topSymbol = results[0].symbol.toUpperCase();
        let currentState: any = {};
        try {
          if (targetNode.stateJson) currentState = JSON.parse(targetNode.stateJson);
        } catch {}
        const newCycleCount = (currentState.cycleCount || 0) + 1;

        await prisma.node.update({
          where: { id: targetNode.id },
          data: {
            configJson: JSON.stringify({
              ...targetCfg,
              symbol: targetCfg.symbol || topSymbol,
            }),
            stateJson: JSON.stringify({
              status: 'passed',
              cycleCount: newCycleCount,
              lastTriggeredAt: new Date().toLocaleTimeString(),
            }),
          },
        });
        mutationsCount++;
        logs.push(`Watcher node adopted top screened symbol: ${topSymbol}`);
      }
    }
  }

  // Record execution log
  await prisma.log.create({
    data: {
      canvasId,
      eventSummary: `AI Screener: "${screenerCfg.query || 'top companies'}" returned ${results.length} stocks across ${triggeredNodes.length} cards`,
      triggeredNodes: JSON.stringify(triggeredNodes),
      detailsJson: JSON.stringify({ results, logs }),
    },
  });

  return {
    triggeredNodes,
    mutationsCount,
    logs,
  };
}

