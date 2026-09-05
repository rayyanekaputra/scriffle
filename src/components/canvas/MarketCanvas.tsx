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
  SelectionMode,
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
import { useTheme } from '@/context/ThemeContext';

interface MarketCanvasProps {
  canvasData?: CanvasData;
  focusedNodeId?: string | null;
  highlightedNodeIds?: string[];
  onRefresh?: () => void;
  onEditNode?: (nodeId: string) => void;
  onAddNodeAtPosition?: (type: NodeType, position: { x: number; y: number }, extraConfig?: any) => void;
  onDeleteNode?: (nodeId: string) => void;
  onDeleteEdge?: (edgeId: string) => void;
  onChangeNodeColor?: (nodeId: string, color: 'yellow' | 'mint' | 'pink' | 'blue' | 'purple') => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onRecordSnapshot?: (nodesOverride?: any[]) => void;
}

export const MarketCanvas: React.FC<MarketCanvasProps> = ({
  canvasData,
  focusedNodeId,
  highlightedNodeIds = [],
  onRefresh,
  onEditNode,
  onAddNodeAtPosition,
  onDeleteNode,
  onDeleteEdge,
  onChangeNodeColor,
  onUndo,
  onRedo,
  onRecordSnapshot,
}) => {
  const { theme } = useTheme();
  const { screenToFlowPosition, setCenter } = useReactFlow();
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
      interactionWidth: 24, // Wider click/hover hitbox for easier selection
      style: { stroke: '#0050FF', strokeWidth: 2.5, cursor: 'pointer' },
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
    edgeId: string | null;
  } | null>(null);

  // Internal clipboard buffer for copying canvas nodes
  const clipboardNodeRef = useRef<{ type: NodeType; config: any } | null>(null);

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

  // Keyboard Shortcuts: Delete, Copy (Ctrl+C), Paste (Ctrl+V), Duplicate (Ctrl+D), Deselect (Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputActive =
        target &&
        (target.tagName === 'TEXTAREA' ||
          target.tagName === 'INPUT' ||
          target.isContentEditable ||
          target.closest('.nodrag'));

      // If user is typing inside a text box, do not trigger canvas shortcuts
      if (isInputActive) {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      // 1. Delete or Backspace -> Delete selected nodes and edges
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedNodes = nodes.filter((n) => n.selected);
        const selectedEdges = edges.filter((e) => e.selected);

        if (selectedNodes.length > 0 || selectedEdges.length > 0) {
          e.preventDefault();
          selectedNodes.forEach((n) => onDeleteNode?.(n.id));
          selectedEdges.forEach((ed) => onDeleteEdge?.(ed.id));
        }
        return;
      }

      // 2. Escape -> Close menus and deselect all
      if (e.key === 'Escape') {
        setMenu(null);
        setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
        setEdges((eds) => eds.map((ed) => ({ ...ed, selected: false })));
        return;
      }

      // 3. Ctrl+C / Cmd+C -> Copy selected node
      if (isCtrlOrCmd && (e.key === 'c' || e.key === 'C')) {
        const selectedNode = nodes.find((n) => n.selected);
        if (selectedNode) {
          clipboardNodeRef.current = {
            type: selectedNode.type as NodeType,
            config: JSON.parse(JSON.stringify(selectedNode.data.config || {})),
          };
        }
        return;
      }

      // 4. Ctrl+V / Cmd+V -> Paste copied node at mouse position
      if (isCtrlOrCmd && (e.key === 'v' || e.key === 'V')) {
        if (clipboardNodeRef.current) {
          e.preventDefault();
          const flowPos = screenToFlowPosition(mousePosRef.current);
          onAddNodeAtPosition?.(
            clipboardNodeRef.current.type,
            flowPos,
            JSON.parse(JSON.stringify(clipboardNodeRef.current.config))
          );
        }
        return;
      }

      // 5. Ctrl+D / Cmd+D -> Duplicate selected node (+35px offset)
      if (isCtrlOrCmd && (e.key === 'd' || e.key === 'D')) {
        const selectedNode = nodes.find((n) => n.selected);
        if (selectedNode) {
          e.preventDefault();
          const duplicatePos = {
            x: selectedNode.position.x + 35,
            y: selectedNode.position.y + 35,
          };
          onAddNodeAtPosition?.(
            selectedNode.type as NodeType,
            duplicatePos,
            JSON.parse(JSON.stringify(selectedNode.data.config || {}))
          );
        }
        return;
      }

      // 6. Undo: Ctrl+Z / Cmd+Z (without Shift)
      if (isCtrlOrCmd && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        onUndo?.();
        return;
      }

      // 7. Redo: Ctrl+Shift+Z / Cmd+Shift+Z or Ctrl+Y / Cmd+Y
      if (
        (isCtrlOrCmd && e.shiftKey && (e.key === 'z' || e.key === 'Z')) ||
        (isCtrlOrCmd && (e.key === 'y' || e.key === 'Y'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        onRedo?.();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    nodes,
    edges,
    onDeleteNode,
    onDeleteEdge,
    onAddNodeAtPosition,
    onUndo,
    onRedo,
    screenToFlowPosition,
    setNodes,
    setEdges,
  ]);

  // Global Clipboard Image Paste Listener
  useEffect(() => {
    const handleImagePaste = (event: ClipboardEvent) => {
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

    window.addEventListener('paste', handleImagePaste);
    return () => window.removeEventListener('paste', handleImagePaste);
  }, [screenToFlowPosition, onAddNodeAtPosition]);

  // Sync state when backend updates or restores from undo/redo
  useEffect(() => {
    if (canvasData?.nodes) {
      setNodes(
        canvasData.nodes.map((serverNode) => ({
          id: serverNode.id,
          type: serverNode.type,
          position: { ...serverNode.position },
          data: {
            config: serverNode.config,
            state: serverNode.state,
          },
        }))
      );
    }

    if (canvasData?.edges) {
      setEdges(
        canvasData.edges.map((e) => {
          const isHighlighted =
            highlightedNodeIds.length > 0 &&
            highlightedNodeIds.includes(e.from) &&
            highlightedNodeIds.includes(e.to);

          const defaultStroke =
            theme === 'dark' ? '#525668' : theme === 'mono' ? '#78756D' : '#0050FF';
          const highlightStroke =
            theme === 'dark' ? '#A8ACB8' : theme === 'mono' ? '#242321' : '#6366F1';

          return {
            id: e.id,
            source: e.from,
            target: e.to,
            animated: true,
            interactionWidth: 24,
            style: {
              stroke: isHighlighted ? highlightStroke : defaultStroke,
              strokeWidth: isHighlighted ? 4 : 2.5,
              cursor: 'pointer',
              transition: 'stroke 0.2s, stroke-width 0.2s',
            },
          };
        })
      );
    }
  }, [canvasData, highlightedNodeIds, theme, setNodes, setEdges]);

  // Smooth camera pan & zoom when a node is focused from Activity Feed
  useEffect(() => {
    if (!focusedNodeId || !canvasData?.nodes) return;
    const target = canvasData.nodes.find((n) => n.id === focusedNodeId);
    if (target) {
      // Smoothly pan viewport center directly to the node
      setCenter(target.position.x + 140, target.position.y + 100, {
        zoom: 1.15,
        duration: 800,
      });

      // Highlight the targeted node as selected
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          selected: n.id === focusedNodeId,
        }))
      );
    }
  }, [focusedNodeId, canvasData?.nodes, setCenter, setNodes]);

  // Connect two nodes
  const onConnect = useCallback(
    async (params: Connection) => {
      if (!params.source || !params.target) return;
      onRecordSnapshot?.();
      const edgeStroke =
        theme === 'dark' ? '#525668' : theme === 'mono' ? '#78756D' : '#0050FF';
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            interactionWidth: 24,
            style: { stroke: edgeStroke, strokeWidth: 2.5, cursor: 'pointer' },
          },
          eds
        )
      );

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

  // Keyboard delete (Backspace/Delete) or user edge deletion
  const onEdgesDelete = useCallback(
    async (deletedEdges: Edge[]) => {
      for (const edge of deletedEdges) {
        onDeleteEdge?.(edge.id);
      }
    },
    [onDeleteEdge]
  );

  // Node position drag start (record previous snapshot before movement)
  const onNodeDragStart = useCallback(
    (_event: any, _node: Node) => {
      // Map current flow nodes positions to snapshot
      const currentNodesState = nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: { x: n.position.x, y: n.position.y },
        config: n.data?.config,
        state: n.data?.state,
      }));
      onRecordSnapshot?.(currentNodesState);
    },
    [nodes, onRecordSnapshot]
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
        onRefresh?.();
      } catch (err) {
        console.error('Failed to update node position:', err);
      }
    },
    [onRefresh]
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
        edgeId: null,
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
        edgeId: null,
      });
    },
    [screenToFlowPosition]
  );

  // Right click on specific edge
  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();
      const flowPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      setMenu({
        x: event.clientX,
        y: event.clientY,
        flowX: flowPos.x,
        flowY: flowPos.y,
        nodeId: null,
        edgeId: edge.id,
      });
    },
    [screenToFlowPosition]
  );

  // Drag and drop image files or .scriffle project files onto canvas
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];

        // 1. If user drops a .scriffle or .json project file
        if (file.name.endsWith('.scriffle') || file.name.endsWith('.json')) {
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const text = e.target?.result as string;
              const parsed = JSON.parse(text);
              if (parsed.nodes || parsed.format === 'scriffle') {
                const res = await fetch('/api/canvas/restore', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: text,
                });
                if (res.ok) {
                  onRefresh?.();
                }
              }
            } catch (err) {
              console.error('Failed to import dropped .scriffle project:', err);
            }
          };
          reader.readAsText(file);
          return;
        }

        // 2. If user drops an image file
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
    [screenToFlowPosition, onAddNodeAtPosition, onRefresh]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  // ReactFlow onNodesDelete callback
  const onNodesDelete = useCallback(
    async (deletedNodes: Node[]) => {
      for (const node of deletedNodes) {
        onDeleteNode?.(node.id);
      }
    },
    [onDeleteNode]
  );

  const bgColor =
    theme === 'dark' ? '#0F1014' : theme === 'mono' ? '#F4F3EF' : '#F8F9FC';
  const dotColor =
    theme === 'dark' ? '#252732' : theme === 'mono' ? '#D1CEC4' : '#CBD5E1';
  const miniMapNodeColor =
    theme === 'dark' ? '#8E95A5' : theme === 'mono' ? '#1D4ED8' : '#0050FF';
  const miniMapMaskColor =
    theme === 'dark'
      ? 'rgba(15, 16, 20, 0.85)'
      : theme === 'mono'
      ? 'rgba(236, 234, 228, 0.75)'
      : 'rgba(241, 245, 249, 0.7)';

  return (
    <div
      className="h-full w-full transition-colors duration-200"
      style={{ backgroundColor: bgColor }}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        onNodeDoubleClick={onNodeDoubleClick}
        onPaneClick={() => setMenu(null)}
        onNodeClick={() => setMenu(null)}
        onEdgeClick={() => setMenu(null)}
        onPaneContextMenu={onPaneContextMenu}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        nodeTypes={nodeTypes}
        multiSelectionKeyCode={['Shift', 'Control', 'Meta']}
        selectionKeyCode="Shift"
        selectionMode={SelectionMode.Partial}
        fitView
        colorMode={theme === 'dark' ? 'dark' : 'light'}
        minZoom={0.2}
        maxZoom={2}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color={dotColor} />
        <Controls
          className={
            theme === 'dark'
              ? '!border-2 !border-[#282A36] !bg-[#14151B] !fill-[#BAC0D0] !rounded-xl'
              : theme === 'mono'
              ? '!border-2 !border-[#D8D4CA] !bg-[#ECEAE4] !fill-[#242321] !rounded-xl'
              : '!border-2 !border-slate-300 !bg-white !fill-slate-700 !rounded-xl'
          }
        />
        <MiniMap
          nodeColor={miniMapNodeColor}
          maskColor={miniMapMaskColor}
          className={
            theme === 'dark'
              ? '!border-2 !border-[#282A36] !bg-[#14151B] !rounded-xl'
              : theme === 'mono'
              ? '!border-2 !border-[#D8D4CA] !bg-[#ECEAE4] !rounded-xl'
              : '!border-2 !border-slate-300 !bg-white !rounded-xl'
          }
        />
      </ReactFlow>

      {/* Right-Click Context Menu */}
      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          targetNodeId={menu.nodeId}
          targetEdgeId={menu.edgeId}
          onClose={() => setMenu(null)}
          onAddElement={(type, extraConfig) =>
            onAddNodeAtPosition?.(type, { x: menu.flowX, y: menu.flowY }, extraConfig)
          }
          onEditElement={(nodeId) => onEditNode?.(nodeId)}
          onChangeColor={(nodeId, color) => onChangeNodeColor?.(nodeId, color)}
          onDeleteElement={(nodeId) => onDeleteNode?.(nodeId)}
          onDeleteEdge={(edgeId) => onDeleteEdge?.(edgeId)}
        />
      )}
    </div>
  );
};
