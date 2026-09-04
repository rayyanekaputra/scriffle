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

  // In-Memory Session API Key (Temporary for this session only, never saved to disk or export)
  const [sectorsApiKey, setSectorsApiKey] = useState('');

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
        mutate(); // Revalidate canvas to show 0 runs on watcher cards
        showToast('Activity Feed & Counters Reset', 'All trigger logs cleared and card run counters reset to 0', 'info');
      }
    } catch (err) {
      console.error('Failed to clear logs:', err);
    }
  };

  // Export full project as .scriffle file (UTF-8 JSON formatted)
  const handleExportScriffle = () => {
    if (!canvas) {
      showToast('Export Failed', 'No active canvas data to export', 'crashing');
      return;
    }

    const payload = {
      format: 'scriffle',
      version: '1.0.0',
      name: canvas.name || 'Market Automation Canvas',
      createdAt: new Date().toISOString(),
      nodes: canvas.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        config: n.config,
        state: { ...n.state, runCount: 0 },
      })),
      edges: canvas.edges.map((e) => ({
        id: e.id,
        from: e.from,
        to: e.to,
      })),
    };

    const jsonString = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const safeTitle = (canvas.name || 'scriffle_project').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeTitle}.scriffle`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Project Saved', `Exported ${canvas.nodes.length} cards and ${canvas.edges.length} connectors as ${safeTitle}.scriffle`, 'rising');
  };

  // Import .scriffle or .json file
  const handleImportScriffle = async (file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);

          if (!parsed.nodes && parsed.format !== 'scriffle') {
            showToast('Invalid File', 'File is missing required Scriffle canvas nodes', 'crashing');
            return;
          }

          const res = await fetch('/api/canvas/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: content,
          });

          if (res.ok) {
            mutate();
            mutateLogs([], false);
            showToast(
              'Project Restored',
              `Loaded "${parsed.name || file.name}" with ${parsed.nodes?.length || 0} cards`,
              'rising'
            );
          } else {
            const errData = await res.json();
            showToast('Restore Failed', errData.error || 'Server rejected file payload', 'crashing');
          }
        } catch (err: any) {
          console.error('JSON parse error:', err);
          showToast('Corrupt File', 'Selected file contains invalid JSON', 'crashing');
        }
      };
      reader.readAsText(file);
    } catch (err) {
      console.error('File read error:', err);
      showToast('Import Error', 'Failed to read project file', 'crashing');
    }
  };

  // Load built-in starter presets
  const handleLoadPreset = async (presetKey: string) => {
    let presetData: any = null;

    if (presetKey === 'momentum') {
      presetData = {
        format: 'scriffle',
        version: '1.0.0',
        name: 'BBCA Momentum Breakout & Mutator Loop',
        nodes: [
          {
            id: 'node-watcher-bbca',
            type: 'watcher',
            position: { x: 100, y: 150 },
            config: { symbol: 'BBCA', metric: 'price_change', interval: 300 },
          },
          {
            id: 'node-rule-surge',
            type: 'condition',
            position: { x: 420, y: 150 },
            config: { rule: 'price_change > 5' },
          },
          {
            id: 'node-alert-toast',
            type: 'alert',
            position: { x: 740, y: 80 },
            config: { channel: 'ui', template: '🚀 BBCA Surge Detected: ${price_change}% at Rp${price}' },
          },
          {
            id: 'node-action-spawn-note',
            type: 'action',
            position: { x: 740, y: 250 },
            config: { action: 'create_note', noteTemplate: '📈 Breakout Confirmed for ${symbol} (+${price_change}%) at ${timestamp}!' },
          },
          {
            id: 'node-action-spawn-peer',
            type: 'action',
            position: { x: 1060, y: 250 },
            config: { action: 'create_watcher', targetSymbol: 'BBRI' },
          },
        ],
        edges: [
          { id: 'edge-1', from: 'node-watcher-bbca', to: 'node-rule-surge' },
          { id: 'edge-2', from: 'node-rule-surge', to: 'node-alert-toast' },
          { id: 'edge-3', from: 'node-rule-surge', to: 'node-action-spawn-note' },
          { id: 'edge-4', from: 'node-action-spawn-note', to: 'node-action-spawn-peer' },
        ],
      };
    } else if (presetKey === 'banking') {
      presetData = {
        format: 'scriffle',
        version: '1.0.0',
        name: 'IDX Big 3 Banking Comparison',
        nodes: [
          {
            id: 'node-bbca',
            type: 'watcher',
            position: { x: 120, y: 120 },
            config: { symbol: 'BBCA', metric: 'price_change', interval: 300 },
          },
          {
            id: 'node-bbri',
            type: 'watcher',
            position: { x: 120, y: 350 },
            config: { symbol: 'BBRI', metric: 'price_change', interval: 300 },
          },
          {
            id: 'node-bmri',
            type: 'watcher',
            position: { x: 120, y: 580 },
            config: { symbol: 'BMRI', metric: 'price_change', interval: 300 },
          },
          {
            id: 'node-rule-bbca',
            type: 'condition',
            position: { x: 450, y: 120 },
            config: { rule: 'price_change > 3' },
          },
          {
            id: 'node-rule-bbri',
            type: 'condition',
            position: { x: 450, y: 350 },
            config: { rule: 'price_change > 3' },
          },
          {
            id: 'node-rule-bmri',
            type: 'condition',
            position: { x: 450, y: 580 },
            config: { rule: 'price_change > 3' },
          },
          {
            id: 'node-note-summary',
            type: 'note',
            position: { x: 800, y: 280 },
            config: {
              content: '🎯 Big 4 Banking Rotation:\nMonitoring capital rotation between BBCA, BBRI, and BMRI.',
              color: 'blue',
            },
          },
        ],
        edges: [
          { id: 'edge-b1', from: 'node-bbca', to: 'node-rule-bbca' },
          { id: 'edge-b2', from: 'node-bbri', to: 'node-rule-bbri' },
          { id: 'edge-b3', from: 'node-bmri', to: 'node-rule-bmri' },
          { id: 'edge-b4', from: 'node-rule-bbca', to: 'node-note-summary' },
          { id: 'edge-b5', from: 'node-rule-bbri', to: 'node-note-summary' },
          { id: 'edge-b6', from: 'node-rule-bmri', to: 'node-note-summary' },
        ],
      };
    } else if (presetKey === 'rotation') {
      presetData = {
        format: 'scriffle',
        version: '1.0.0',
        name: 'IDX Blue-Chip Rotation & Auto-Discovery Engine',
        nodes: [
          {
            id: 'header-title',
            type: 'text',
            position: { x: 80, y: 40 },
            config: {
              text: 'IDX Market Research & Dynamic Rotation Matrix',
              fontSize: 'large',
              color: '#0F172A',
            },
          },
          {
            id: 'header-subtitle',
            type: 'text',
            position: { x: 80, y: 80 },
            config: {
              text: 'Live Sectors v2 API Watchers: /v2/daily/{symbol} → Multi-tier Thresholds → Automated Mutator Branching',
              fontSize: 'small',
              color: '#64748B',
            },
          },
          {
            id: 'sticker-bullish',
            type: 'sticker',
            position: { x: 80, y: 140 },
            config: { stickerType: 'bullish' },
          },
          {
            id: 'watcher-bbca',
            type: 'watcher',
            position: { x: 80, y: 220 },
            config: {
              symbol: 'BBCA',
              metric: 'price_change',
              interval: 300,
            },
          },
          {
            id: 'condition-bbca-surge',
            type: 'condition',
            position: { x: 420, y: 180 },
            config: {
              rule: 'price_change > 4 AND volume > 10000000',
            },
          },
          {
            id: 'condition-bbca-pullback',
            type: 'condition',
            position: { x: 420, y: 320 },
            config: {
              rule: 'price_change < -1.5',
            },
          },
          {
            id: 'alert-bbca-breakout',
            type: 'alert',
            position: { x: 760, y: 120 },
            config: {
              channel: 'ui',
              template: '🚀 BBCA Massive Breakout: +${price_change}% at Rp${price} (Vol: ${volume})',
            },
          },
          {
            id: 'action-spawn-bbca-thesis',
            type: 'action',
            position: { x: 760, y: 240 },
            config: {
              action: 'create_note',
              noteTemplate: '📈 BBCA Bullish Thesis Confirmed!\nPrice: Rp${price} (+${price_change}%)\nTimestamp: ${timestamp}\nForeign institutional inflow surging.',
            },
          },
          {
            id: 'action-spawn-peer-bbri',
            type: 'action',
            position: { x: 1100, y: 240 },
            config: {
              action: 'create_watcher',
              targetSymbol: 'BBRI',
            },
          },
          {
            id: 'note-bbca-defense',
            type: 'note',
            position: { x: 760, y: 360 },
            config: {
              content: '⚠️ BBCA Pullback Strategy:\nWatch support level at Rp10,000.\nCheck if funds are rotating into Telco (TLKM) or Energy.',
              color: 'pink',
              width: 300,
              height: 160,
            },
          },
          {
            id: 'watcher-tlkm',
            type: 'watcher',
            position: { x: 80, y: 560 },
            config: {
              symbol: 'TLKM',
              metric: 'price_change',
              interval: 300,
            },
          },
          {
            id: 'condition-tlkm-rebound',
            type: 'condition',
            position: { x: 420, y: 560 },
            config: {
              rule: 'price_change > 2',
            },
          },
          {
            id: 'alert-tlkm-toast',
            type: 'alert',
            position: { x: 760, y: 560 },
            config: {
              channel: 'ui',
              template: '📡 TLKM Telco Rotation: Up ${price_change}% at Rp${price}',
            },
          },
          {
            id: 'action-spawn-tlkm-note',
            type: 'action',
            position: { x: 1100, y: 560 },
            config: {
              action: 'create_note',
              noteTemplate: '🎯 TLKM Accumulation Signal\nPrice: Rp${price}\nTurnaround confirmation logged at ${timestamp}.',
            },
          },
          {
            id: 'note-macro-overview',
            type: 'note',
            position: { x: 1100, y: 40 },
            config: {
              content: '💡 Whiteboard Automation Protocol:\n1. BBCA breakout triggers real-time UI toast.\n2. Auto-spawns dynamic research note.\n3. Chains mutator to spawn peer watcher (BBRI).\n4. Parallel TLKM watcher tracks capital rotation.',
              color: 'blue',
              width: 340,
              height: 180,
            },
          },
          {
            id: 'sticker-rocket',
            type: 'sticker',
            position: { x: 1020, y: 140 },
            config: { stickerType: 'rocket' },
          },
        ],
        edges: [
          { id: 'e1', from: 'watcher-bbca', to: 'condition-bbca-surge' },
          { id: 'e2', from: 'watcher-bbca', to: 'condition-bbca-pullback' },
          { id: 'e3', from: 'condition-bbca-surge', to: 'alert-bbca-breakout' },
          { id: 'e4', from: 'condition-bbca-surge', to: 'action-spawn-bbca-thesis' },
          { id: 'e5', from: 'action-spawn-bbca-thesis', to: 'action-spawn-peer-bbri' },
          { id: 'e6', from: 'condition-bbca-pullback', to: 'note-bbca-defense' },
          { id: 'e7', from: 'watcher-tlkm', to: 'condition-tlkm-rebound' },
          { id: 'e8', from: 'condition-tlkm-rebound', to: 'alert-tlkm-toast' },
          { id: 'e9', from: 'condition-tlkm-rebound', to: 'action-spawn-tlkm-note' },
        ],
      };
    }

    if (!presetData) return;

    try {
      const res = await fetch('/api/canvas/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(presetData),
      });

      if (res.ok) {
        mutate();
        mutateLogs([], false);
        showToast('Preset Loaded', `Template "${presetData.name}" is ready`, 'rising');
      }
    } catch (err) {
      console.error('Failed to load preset:', err);
      showToast('Preset Error', 'Failed to load starter template', 'crashing');
    }
  };

  // Rename Canvas / Project
  const handleRenameCanvas = async (newName: string) => {
    try {
      const res = await fetch('/api/canvas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });
      if (res.ok) {
        mutate();
        showToast('Project Renamed', `Project title set to "${newName}"`, 'rising');
      }
    } catch (err) {
      console.error('Failed to rename canvas:', err);
    }
  };

  // Live / Mock Market Polling
  const handlePollMarket = async () => {
    try {
      const res = await fetch('/api/engine/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canvasId: canvas?.id,
          apiKey: sectorsApiKey.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        mutate();
        mutateLogs();

        const count = data.polledEvents?.length || 0;
        const isLive = Boolean(data.isLive);
        showToast(
          isLive ? 'Market Polled (Live Sectors v2)' : 'Market Polled (Simulated)',
          `Synced ${count} ticker${count !== 1 ? 's' : ''} across active Watchers`,
          isLive ? 'rising' : 'info'
        );
      } else {
        showToast('Poll Error', data.error || 'Failed to poll market data', 'crashing');
      }
    } catch (err: any) {
      console.error('Failed to poll market:', err);
      showToast('Poll Failed', err.message || 'Network error during poll', 'crashing');
    }
  };

  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden bg-[#F8F9FC] text-slate-900 antialiased font-sans">
      {/* Centered TopNav with view toggle buttons on the right */}
      <TopNav
        canvasName={canvas?.name || 'untitled board'}
        onRenameCanvas={handleRenameCanvas}
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
          onExportScriffle={handleExportScriffle}
          onImportScriffle={handleImportScriffle}
          onLoadPreset={handleLoadPreset}
          apiKey={sectorsApiKey}
          onApiKeyChange={(key) => setSectorsApiKey(key)}
          onPollMarket={handlePollMarket}
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
