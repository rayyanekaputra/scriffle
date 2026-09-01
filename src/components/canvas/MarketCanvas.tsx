'use client';

import React, { useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { WatcherNode } from './nodes/WatcherNode';
import { ConditionNode } from './nodes/ConditionNode';
import { NoteNode } from './nodes/NoteNode';
import { AlertNode } from './nodes/AlertNode';
import { ActionNode } from './nodes/ActionNode';
import { CanvasData } from '@/types/canvas';

interface MarketCanvasProps {
  canvasData?: CanvasData;
  onRefresh?: () => void;
}

export const MarketCanvas: React.FC<MarketCanvasProps> = ({ canvasData, onRefresh }) => {
  const nodeTypes = useMemo(
    () => ({
      watcher: WatcherNode,
      condition: ConditionNode,
      note: NoteNode,
      alert: AlertNode,
      action: ActionNode,
    }),
    []
  );

  const initialNodes: Node[] = useMemo(() => {
    if (!canvasData?.nodes) return [];
    return canvasData.nodes.map((n) => ({
      id: n.id,
      type: n.type,
      position: n.position,
      data: {
        config: n.config,
        state: n.state,
      },
    }));
  }, [canvasData?.nodes]);

  const initialEdges: Edge[] = useMemo(() => {
    if (!canvasData?.edges) return [];
    return canvasData.edges.map((e) => ({
      id: e.id,
      source: e.from,
      target: e.to,
      animated: true,
      style: { stroke: '#0050FF', strokeWidth: 2.5 },
    }));
  }, [canvasData?.edges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync state when SWR background poll returns fresh data from backend
  useEffect(() => {
    if (canvasData?.nodes) {
      setNodes((currentNodes) => {
        return canvasData.nodes.map((serverNode) => {
          const existing = currentNodes.find((n) => n.id === serverNode.id);
          return {
            id: serverNode.id,
            type: serverNode.type,
            // Preserve user's local drag position if currently dragging
            position: existing?.position || serverNode.position,
            data: {
              config: serverNode.config,
              state: serverNode.state,
            },
          };
        });
      });
    }

    if (canvasData?.edges) {
      setEdges(
        canvasData.edges.map((e) => ({
          id: e.id,
          source: e.from,
          target: e.to,
          animated: true,
          style: { stroke: '#0050FF', strokeWidth: 2.5 },
        }))
      );
    }
  }, [canvasData, setNodes, setEdges]);

  // Connect two nodes
  const onConnect = useCallback(
    async (params: Connection) => {
      if (!params.source || !params.target) return;
      setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#0050FF', strokeWidth: 2.5 } }, eds));

      try {
        await fetch('/api/canvas/edges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            canvasId: canvasData?.id,
            from: params.source,
            to: params.target,
          }),
        });
        onRefresh?.();
      } catch (err) {
        console.error('Failed to create edge:', err);
      }
    },
    [canvasData?.id, onRefresh, setEdges]
  );

  // Node position drag stop -> Persist to DB
  const onNodeDragStop = useCallback(
    async (_event: any, node: Node) => {
      try {
        await fetch(`/api/canvas/nodes/${node.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            position: { x: node.position.x, y: node.position.y },
          }),
        });
      } catch (err) {
        console.error('Failed to update node position:', err);
      }
    },
    []
  );

  return (
    <div className="h-full w-full bg-[#F8F9FC]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        colorMode="light"
        minZoom={0.2}
        maxZoom={2}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="#CBD5E1" />
        <Controls className="!border-slate-200 !bg-white !fill-slate-700 !shadow-sm !rounded-xl" />
        <MiniMap
          nodeColor="#0050FF"
          maskColor="rgba(241, 245, 249, 0.7)"
          className="!border-slate-200 !bg-white !rounded-xl !shadow-sm"
        />
      </ReactFlow>
    </div>
  );
};
