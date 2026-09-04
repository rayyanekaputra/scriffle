'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { TopNav } from '@/components/controls/TopNav';
import { MarketCanvas } from '@/components/canvas/MarketCanvas';
import { ActivityFeed } from '@/components/feed/ActivityFeed';
import { SimulationBar } from '@/components/controls/SimulationBar';
import { EditNodeModal } from '@/components/controls/EditNodeModal';
import { ToastProvider, useToast } from '@/components/ui/ToastProvider';
import { useCanvasSync } from '@/hooks/useCanvasSync';
import { CanvasNodeData, NodeType } from '@/types/canvas';

function WhiteboardContent() {
  const { canvas, logs, mutate, mutateLogs } = useCanvasSync();
  const [editingNode, setEditingNode] = useState<CanvasNodeData | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<string[]>([]);
  const { showToast } = useToast();

  // Panels visibility state (hideable Left Panel & Activity Feed)
  const [isFeedOpen, setIsFeedOpen] = useState(true);
  const [isControlsOpen, setIsControlsOpen] = useState(true);

  // Auto-stream continuous market ticker state
  const [autoTickActive, setAutoTickActive] = useState(false);
  const [autoTickInterval, setAutoTickInterval] = useState(3);
  const timerRef = useRef<any>(null);

  const handleAddNode = async (
    type: NodeType,
    position?: { x: number; y: number },
    customConfig?: any
  ) => {
    let defaultConfig: any = customConfig || {};
    if (!customConfig) {
      if (type === 'watcher') {
        defaultConfig = { symbol: 'BBRI', metric: 'price_change', interval: 300 };
      } else if (type === 'condition') {
        defaultConfig = { rule: 'price_change > 4' };
      } else if (type === 'note') {
        defaultConfig = { content: 'Watching sector momentum breakout...', color: 'yellow' };
      } else if (type === 'text') {
        defaultConfig = { text: 'Freeform research hypothesis' };
      } else if (type === 'sticker') {
        defaultConfig = { stickerType: 'rocket' };
      } else if (type === 'alert') {
        defaultConfig = { channel: 'ui' };
      } else if (type === 'action') {
        defaultConfig = { action: 'create_note' };
      }
    }

    const pos = position || { x: 300 + Math.random() * 200, y: 200 + Math.random() * 150 };

    try {
      await fetch('/api/canvas/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canvasId: canvas?.id,
          type,
          position: pos,
          config: defaultConfig,
        }),
      });
      mutate();
    } catch (err) {
      console.error('Failed to add node:', err);
    }
  };

  const handleEditNode = (nodeId: string) => {
    const found = canvas?.nodes.find((n) => n.id === nodeId);
    if (found) {
      setEditingNode(found);
    }
  };

  const handleSaveNodeConfig = async (nodeId: string, updatedConfig: any) => {
    try {
      await fetch(`/api/canvas/nodes/${nodeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: updatedConfig }),
      });
      mutate();
    } catch (err) {
      console.error('Failed to update node config:', err);
    }
  };

  const handleChangeNodeColor = async (
    nodeId: string,
    color: 'yellow' | 'mint' | 'pink' | 'blue' | 'purple'
  ) => {
    const node = canvas?.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    try {
      await fetch(`/api/canvas/nodes/${nodeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            ...node.config,
            color,
          },
        }),
      });
      mutate();
    } catch (err) {
      console.error('Failed to update note color:', err);
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    try {
      await fetch(`/api/canvas/nodes/${nodeId}`, {
        method: 'DELETE',
      });
      mutate();
    } catch (err) {
      console.error('Failed to delete node:', err);
    }
  };

  const handleDeleteEdge = async (edgeId: string) => {
    try {
      await fetch(`/api/canvas/edges/${edgeId}`, {
        method: 'DELETE',
      });
      mutate();
    } catch (err) {
      console.error('Failed to delete edge:', err);
    }
  };

  const handleSimulateCustom = async (eventPayload: any, suppressInfoToast = false) => {
    try {
      const res = await fetch('/api/engine/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: eventPayload }),
      });
      const data = await res.json();
      if (res.ok) {
        mutate();
        mutateLogs();

        const alertLogs = data.result?.logs?.filter((l: string) => l.startsWith('Notification fired:')) || [];
        if (alertLogs.length > 0) {
          const isRising = (eventPayload.price_change || 0) >= 0;
          for (const msg of alertLogs) {
            showToast(
              `Market Alert: ${eventPayload.symbol}`,
              msg.replace('Notification fired: ', ''),
              isRising ? 'rising' : 'crashing'
            );
          }
        } else if (!suppressInfoToast) {
          const isRising = (eventPayload.price_change || 0) >= 0;
          showToast(
            `${eventPayload.symbol} ${isRising ? 'Surge' : 'Drop'} Tick`,
            `Change: ${isRising ? '+' : ''}${eventPayload.price_change}%, Volume: ${eventPayload.volume?.toLocaleString()}`,
            isRising ? 'rising' : 'crashing'
          );
        }
      }
    } catch (err) {
      console.error('Failed to run custom simulation:', err);
    }
  };

  // Continuous Auto-Ticker Stream Loop
  useEffect(() => {
    if (!autoTickActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const availableSymbols = Array.from(
      new Set(
        canvas?.nodes
          ?.filter((n) => n.type === 'watcher')
          ?.map((n: any) => n.config?.symbol?.toUpperCase())
          ?.filter(Boolean) || ['BBCA', 'TLKM', 'BMRI']
      )
    );

    if (availableSymbols.length === 0) availableSymbols.push('BBCA');

    timerRef.current = setInterval(() => {
      const randomSymbol = availableSymbols[Math.floor(Math.random() * availableSymbols.length)];
      const isSpike = Math.random() < 0.25;
      const priceChange = isSpike
        ? parseFloat((5.5 + Math.random() * 3.5).toFixed(2))
        : parseFloat(((Math.random() - 0.4) * 3.2).toFixed(2));

      const volume = isSpike
        ? Math.floor(18000000 + Math.random() * 20000000)
        : Math.floor(5000000 + Math.random() * 10000000);

      const basePrice = randomSymbol === 'TLKM' ? 3200 : randomSymbol === 'BBRI' ? 5100 : 10200;
      const currentPrice = Math.round(basePrice * (1 + priceChange / 100));

      handleSimulateCustom(
        {
          symbol: randomSymbol,
          price: currentPrice,
          prevPrice: basePrice,
          price_change: priceChange,
          volume,
          avg_volume: 10000000,
          rank: 1,
          timestamp: new Date().toLocaleTimeString(),
        },
        true // suppress info toasts during stream, only show alert toasts
      );
    }, autoTickInterval * 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoTickActive, autoTickInterval, canvas?.nodes]);

  const handleToggleAutoTick = (active: boolean, intervalSec: number) => {
    setAutoTickActive(active);
    setAutoTickInterval(intervalSec);
    if (active) {
      showToast('Live Streaming Started', `Mimicking live market ticks every ${intervalSec}s`, 'rising');
    } else {
      showToast('Streaming Paused', 'Market tick loop stopped', 'info');
    }
  };

  const handleRefresh = () => {
    mutate();
    mutateLogs();
  };

  const handleClearLogs = async () => {
    // 1. Immediately pause live streaming / auto-polling
    if (autoTickActive) {
      setAutoTickActive(false);
      showToast('Streaming Paused', 'Market polling stopped before clearing logs', 'info');
    }

    // 2. Clear logs in backend and revalidate
    try {
      const res = await fetch('/api/logs', {
        method: 'DELETE',
      });
      if (res.ok) {
        mutateLogs([], false); // Instant optimistic update
        mutateLogs();
        showToast('Activity Feed Cleared', 'All previous trigger records have been cleared', 'info');
      }
    } catch (err) {
      console.error('Failed to clear logs:', err);
    }
  };

  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden bg-[#F8F9FC] text-slate-900 antialiased font-sans">
      {/* Centered TopNav with view toggle buttons on the right */}
      <TopNav
        canvasName={canvas?.name || 'Scriffle Whiteboard'}
        onAddNode={(type, config) => handleAddNode(type, undefined, config)}
        isFeedOpen={isFeedOpen}
        onToggleFeed={() => setIsFeedOpen(!isFeedOpen)}
        isControlsOpen={isControlsOpen}
        onToggleControls={() => setIsControlsOpen(!isControlsOpen)}
      />

      <div className="relative flex flex-1 overflow-hidden">
        {/* Hideable Left Controls Panel */}
        <SimulationBar
          isOpen={isControlsOpen}
          onClose={() => setIsControlsOpen(false)}
          onSimulateSuccess={handleRefresh}
          onSimulateCustom={handleSimulateCustom}
          autoTickActive={autoTickActive}
          onToggleAutoTick={handleToggleAutoTick}
        />

        {/* Main React Flow Canvas */}
        <div className="flex-1 h-full">
          <ReactFlowProvider>
            <MarketCanvas
              canvasData={canvas}
              focusedNodeId={focusedNodeId}
              highlightedNodeIds={highlightedNodeIds}
              onRefresh={handleRefresh}
              onEditNode={handleEditNode}
              onAddNodeAtPosition={(type, pos, extra) => handleAddNode(type, pos, extra)}
              onDeleteNode={handleDeleteNode}
              onDeleteEdge={handleDeleteEdge}
              onChangeNodeColor={handleChangeNodeColor}
            />
          </ReactFlowProvider>
        </div>

        {/* Hideable Live Activity & Log Sidebar */}
        <ActivityFeed
          logs={logs}
          nodes={canvas?.nodes}
          isOpen={isFeedOpen}
          onClose={() => setIsFeedOpen(false)}
          onClearLogs={handleClearLogs}
          onSelectNode={(nodeId) => {
            // Toggle / trigger focus
            setFocusedNodeId(nodeId);
            // Reset focus trigger shortly after so it can be re-clicked
            setTimeout(() => setFocusedNodeId(null), 1000);
          }}
          onHoverNodes={(nodeIds) => setHighlightedNodeIds(nodeIds)}
        />
      </div>

      {/* Configuration Modal */}
      <EditNodeModal
        isOpen={Boolean(editingNode)}
        node={editingNode}
        onClose={() => setEditingNode(null)}
        onSave={handleSaveNodeConfig}
      />
    </main>
  );
}

export default function Home() {
  return (
    <ToastProvider>
      <WhiteboardContent />
    </ToastProvider>
  );
}
