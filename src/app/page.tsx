'use client';

import React from 'react';
import { TopNav } from '@/components/controls/TopNav';
import { MarketCanvas } from '@/components/canvas/MarketCanvas';
import { ActivityFeed } from '@/components/feed/ActivityFeed';
import { SimulationBar } from '@/components/controls/SimulationBar';
import { useCanvasSync } from '@/hooks/useCanvasSync';
import { NodeType } from '@/types/canvas';

export default function Home() {
  const { canvas, logs, mutate, mutateLogs } = useCanvasSync();

  const handleAddNode = async (type: NodeType) => {
    let defaultConfig: any = {};
    if (type === 'watcher') {
      defaultConfig = { symbol: 'BMRI', metric: 'price_change', interval: 300 };
    } else if (type === 'condition') {
      defaultConfig = { rule: 'price_change > 4' };
    } else if (type === 'note') {
      defaultConfig = { content: 'Watching sector dynamics...' };
    } else if (type === 'alert') {
      defaultConfig = { channel: 'ui' };
    } else if (type === 'action') {
      defaultConfig = { action: 'create_note' };
    }

    try {
      await fetch('/api/canvas/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canvasId: canvas?.id,
          type,
          position: { x: 300 + Math.random() * 200, y: 200 + Math.random() * 150 },
          config: defaultConfig,
        }),
      });
      mutate();
    } catch (err) {
      console.error('Failed to add node:', err);
    }
  };

  const handleRefresh = () => {
    mutate();
    mutateLogs();
  };

  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden bg-slate-950 text-slate-100 antialiased font-sans">
      <TopNav canvasName={canvas?.name || 'Scriffle Studio'} onAddNode={handleAddNode} />

      <div className="relative flex flex-1 overflow-hidden">
        {/* Main React Flow Canvas */}
        <div className="flex-1 h-full">
          <MarketCanvas canvasData={canvas} onRefresh={handleRefresh} />
        </div>

        {/* Live Activity & Log Sidebar */}
        <ActivityFeed logs={logs} />
      </div>

      {/* Floating Demo Simulation Bar */}
      <SimulationBar onSimulateSuccess={handleRefresh} />
    </main>
  );
}
