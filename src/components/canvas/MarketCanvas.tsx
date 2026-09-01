'use client';

import React, { useCallback, useMemo, useEffect, useState, useRef } from 'react';
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
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { WatcherNode } from './nodes/WatcherNode';
import { ConditionNode } from './nodes/ConditionNode';
import { NoteNode } from './nodes/NoteNode';
import { AlertNode } from './nodes/AlertNode';
import { ActionNode } from './nodes/ActionNode';
import { TextNode } from './nodes/TextNode';
import { ImageNode } from './nodes/ImageNode';
import { StickerNode } from './nodes/StickerNode';
import { ContextMenu } from './ContextMenu';
import { CanvasData, NodeType } from '@/types/canvas';

interface MarketCanvasProps {
  canvasData?: CanvasData;
  onRefresh?: () => void;
  onEditNode?: (nodeId: string) => void;
  onAddNodeAtPosition?: (type: NodeType, position: { x: number; y: number }, extraConfig?: any) => void;
  onDeleteNode?: (nodeId: string) => void;
  onChangeNodeColor?: (nodeId: string, color: 'yellow' | 'mint' | 'pink' | 'blue' | 'purple') => void;
}

export const MarketCanvas: React.FC<MarketCanvasProps> = ({
  canvasData,
  onRefresh,
  onEditNode,
  onAddNodeAtPosition,
  onDeleteNode,
  onChangeNodeColor,
}) => {
  const { screenToFlowPosition } = useReactFlow();
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 500, y: 300 });

  const nodeTypes = useMemo(
    () => ({
      watcher: WatcherNode,
      condition: ConditionNode,
      note: NoteNode,
      alert: AlertNode,
      action: ActionNode,
      text: TextNode,
      image: ImageNode,
      sticker: StickerNode,
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

  // Context Menu State
  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    flowX: number;
    flowY: number;
    nodeId: string | null;
  } | null>(null);

  // Track global mouse coordinates for paste placement safely on client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      mousePosRef.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    }

    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Global Clipboard Paste Listener (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const target = event.target as HTMLElement;
      if (target && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT')) {
        return;
      }

      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const dataUrl = e.target?.result as string;
              const flowPos = screenToFlowPosition(mousePosRef.current);
              onAddNodeAtPosition?.('image', flowPos, {
                url: dataUrl,
                isTransparent: file.type.includes('png'),
              });
            };
            reader.readAsDataURL(file);
          }
          event.preventDefault();
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [screenToFlowPosition, onAddNodeAtPosition]);

  // Sync state when backend updates
  useEffect(() => {
    if (canvasData?.nodes) {
      setNodes((currentNodes) => {
        return canvasData.nodes.map((serverNode) => {
          const existing = currentNodes.find((n) => n.id === serverNode.id);
          return {
            id: serverNode.id,
            type: serverNode.type,
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

  // Node position drag stop
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

  // Double click on node -> Edit Mode
  const onNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onEditNode?.(node.id);
    },
    [onEditNode]
  );

  // Right click on canvas
  const onPaneContextMenu = useCallback(
    (event: any) => {
      event.preventDefault();
      const flowPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      setMenu({
        x: event.clientX,
        y: event.clientY,
        flowX: flowPos.x,
        flowY: flowPos.y,
        nodeId: null,
      });
    },
    [screenToFlowPosition]
  );

  // Right click on specific node
  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      const flowPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      setMenu({
        x: event.clientX,
        y: event.clientY,
        flowX: flowPos.x,
        flowY: flowPos.y,
        nodeId: node.id,
      });
    },
    [screenToFlowPosition]
  );

  // Drag and drop image files onto canvas
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            const flowPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
            onAddNodeAtPosition?.('image', flowPos, {
              url: dataUrl,
              caption: file.name,
              isTransparent: file.type.includes('png'),
            });
          };
          reader.readAsDataURL(file);
        }
      }
    },
    [screenToFlowPosition, onAddNodeAtPosition]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  return (
    <div
      className="h-full w-full bg-[#F8F9FC]"
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onNodeDoubleClick={onNodeDoubleClick}
        onPaneContextMenu={onPaneContextMenu}
        onNodeContextMenu={onNodeContextMenu}
        nodeTypes={nodeTypes}
        fitView
        colorMode="light"
        minZoom={0.2}
        maxZoom={2}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="#CBD5E1" />
        <Controls className="!border-2 !border-slate-300 !bg-white !fill-slate-700 !rounded-xl" />
        <MiniMap
          nodeColor="#0050FF"
          maskColor="rgba(241, 245, 249, 0.7)"
          className="!border-2 !border-slate-300 !bg-white !rounded-xl"
        />
      </ReactFlow>

      {/* Right-Click Context Menu */}
      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          targetNodeId={menu.nodeId}
          onClose={() => setMenu(null)}
          onAddElement={(type, extraConfig) =>
            onAddNodeAtPosition?.(type, { x: menu.flowX, y: menu.flowY }, extraConfig)
          }
          onEditElement={(nodeId) => onEditNode?.(nodeId)}
          onChangeColor={(nodeId, color) => onChangeNodeColor?.(nodeId, color)}
          onDeleteElement={(nodeId) => onDeleteNode?.(nodeId)}
        />
      )}
    </div>
  );
};
