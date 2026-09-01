'use client';

import React, { useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { TopNav } from '@/components/controls/TopNav';
import { MarketCanvas } from '@/components/canvas/MarketCanvas';
import { ActivityFeed } from '@/components/feed/ActivityFeed';
import { SimulationBar } from '@/components/controls/SimulationBar';
import { EditNodeModal } from '@/components/controls/EditNodeModal';
import { useCanvasSync } from '@/hooks/useCanvasSync';
import { CanvasNodeData, NodeType } from '@/types/canvas';

export default function Home() {
  const { canvas, logs, mutate, mutateLogs } = useCanvasSync();
  const [editingNode, setEditingNode] = useState<CanvasNodeData | null>(null);

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

  const handleRefresh = () => {
    mutate();
    mutateLogs();
  };

  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden bg-[#F8F9FC] text-slate-900 antialiased font-sans">
      <TopNav
        canvasName={canvas?.name || 'Scriffle Whiteboard'}
        onAddNode={(type, config) => handleAddNode(type, undefined, config)}
      />

      <div className="relative flex flex-1 overflow-hidden">
        {/* Main React Flow Canvas wrapped with ReactFlowProvider for screenToFlowPosition */}
        <div className="flex-1 h-full">
          <ReactFlowProvider>
            <MarketCanvas
              canvasData={canvas}
              onRefresh={handleRefresh}
              onEditNode={handleEditNode}
              onAddNodeAtPosition={(type, pos, extra) => handleAddNode(type, pos, extra)}
              onDeleteNode={handleDeleteNode}
              onChangeNodeColor={handleChangeNodeColor}
            />
          </ReactFlowProvider>
        </div>

        {/* Live Activity & Log Sidebar */}
        <ActivityFeed logs={logs} />
      </div>

      {/* Floating FigJam Presenter Simulation Dock */}
      <SimulationBar onSimulateSuccess={handleRefresh} />

      {/* Double-Click Inline Edit Modal */}
      <EditNodeModal
        isOpen={Boolean(editingNode)}
        node={editingNode}
        onClose={() => setEditingNode(null)}
        onSave={handleSaveNodeConfig}
      />
    </main>
  );
}
