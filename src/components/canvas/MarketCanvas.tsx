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
import { FileNode } from './nodes/FileNode';
import { ScreenerNode } from './nodes/ScreenerNode';
import { ContextMenu } from './ContextMenu';
import { SelectionBoundingBox } from './SelectionBoundingBox';
import { CanvasData, CanvasToolMode, NodeType } from '@/types/canvas';
import { useTheme } from '@/context/ThemeContext';
import { MingIcon } from '@/components/ui/MingIcon';

interface MarketCanvasProps {
  canvasData?: CanvasData;
  focusedNodeId?: string | null;
  highlightedNodeIds?: string[];
  toolMode?: CanvasToolMode;
  onSetToolMode?: (mode: CanvasToolMode) => void;
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

interface ClipboardPayload {
  nodes: Array<{
    id: string;
    type: NodeType;
    position: { x: number; y: number };
    config: any;
    groupId?: string | null;
    groupName?: string | null;
  }>;
  edges: Array<{
    from: string;
    to: string;
  }>;
  isGroup?: boolean;
}

export const MarketCanvas: React.FC<MarketCanvasProps> = ({
  canvasData,
  focusedNodeId,
  highlightedNodeIds = [],
  toolMode = 'select',
  onSetToolMode,
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

  // Isolation mode state for deep double-click group editing
  const [isolatedGroupId, setIsolatedGroupId] = useState<string | null>(null);

  const nodeTypes = useMemo(
    () => ({
      watcher: WatcherNode,
      condition: ConditionNode,
      note: NoteNode,
      alert: AlertNode,
      action: ActionNode,
      screener: ScreenerNode,
      text: TextNode,
      image: ImageNode,
      sticker: StickerNode,
      file: FileNode,
    }),
    []
  );

  const initialNodes: Node[] = useMemo(() => {
    if (!canvasData?.nodes) return [];
    return canvasData.nodes.map((n) => {
      const cfg: any = n.config || {};
      return {
        id: n.id,
        type: n.type,
        position: n.position,
        data: {
          config: n.config,
          state: n.state,
          groupId: n.groupId || cfg._groupId || null,
          groupName: n.groupName || cfg._groupName || null,
        },
      };
    });
  }, [canvasData?.nodes]);

  const initialEdges: Edge[] = useMemo(() => {
    if (!canvasData?.edges) return [];
    return canvasData.edges.map((e) => ({
      id: e.id,
      source: e.from,
      target: e.to,
      animated: true,
      interactionWidth: 24,
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

  // Enhanced Multi-node & Group-aware Clipboard Buffer
  const clipboardRef = useRef<ClipboardPayload | null>(null);

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

  // Helper: Group selected nodes
  const handleGroupSelected = useCallback(async () => {
    const selectedNodes = nodes.filter((n) => n.selected);
    if (selectedNodes.length < 2) return;

    onRecordSnapshot?.();
    const newGroupId = `grp_${Date.now()}`;
    const newGroupName = `Group (${selectedNodes.length} items)`;

    // Optimistically update local nodes
    setNodes((nds) =>
      nds.map((n) => {
        if (n.selected) {
          const cfg: any = n.data?.config || {};
          const updatedConfig = {
            ...cfg,
            _groupId: newGroupId,
            _groupName: newGroupName,
          };
          return {
            ...n,
            data: {
              ...n.data,
              config: updatedConfig,
              groupId: newGroupId,
              groupName: newGroupName,
            },
          };
        }
        return n;
      })
    );

    try {
      await fetch('/api/canvas/nodes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: selectedNodes.map((n) => {
            const cfg: any = n.data?.config || {};
            return {
              id: n.id,
              config: {
                ...cfg,
                _groupId: newGroupId,
                _groupName: newGroupName,
              },
            };
          }),
        }),
      });
      onRefresh?.();
    } catch (err) {
      console.error('Failed to group selected nodes:', err);
    }
  }, [nodes, onRecordSnapshot, setNodes, onRefresh]);

  // Helper: Ungroup selected nodes
  const handleUngroupSelected = useCallback(async () => {
    const selectedNodes = nodes.filter((n) => {
      const data: any = n.data || {};
      const cfg: any = data.config || {};
      return n.selected && (data.groupId || cfg._groupId);
    });
    if (selectedNodes.length === 0) return;

    onRecordSnapshot?.();

    // Optimistically update local nodes
    setNodes((nds) =>
      nds.map((n) => {
        if (n.selected) {
          const cfg: any = n.data?.config || {};
          const updatedConfig = { ...cfg };
          delete updatedConfig._groupId;
          delete updatedConfig._groupName;
          return {
            ...n,
            data: {
              ...n.data,
              config: updatedConfig,
              groupId: null,
              groupName: null,
            },
          };
        }
        return n;
      })
    );

    setIsolatedGroupId(null);

    try {
      await fetch('/api/canvas/nodes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: selectedNodes.map((n) => {
            const cfg: any = n.data?.config || {};
            const updatedConfig = { ...cfg };
            delete updatedConfig._groupId;
            delete updatedConfig._groupName;
            return {
              id: n.id,
              config: updatedConfig,
            };
          }),
        }),
      });
      onRefresh?.();
    } catch (err) {
      console.error('Failed to ungroup nodes:', err);
    }
  }, [nodes, onRecordSnapshot, setNodes, onRefresh]);

  // Keyboard Shortcuts: Delete, Copy, Paste, Duplicate, Undo/Redo, Group (Cmd+G), Ungroup (Cmd+Shift+G), Tools
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputActive =
        target &&
        (target.tagName === 'TEXTAREA' ||
          target.tagName === 'INPUT' ||
          target.isContentEditable ||
          target.closest('.nodrag'));

      if (isInputActive) {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      // 1. Group / Ungroup Shortcuts
      // Group: Cmd+G / Ctrl+G
      if (isCtrlOrCmd && !e.shiftKey && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        handleGroupSelected();
        return;
      }

      // Ungroup: Cmd+Shift+G / Ctrl+Shift+G
      if (isCtrlOrCmd && e.shiftKey && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        handleUngroupSelected();
        return;
      }

      // 2. Delete or Backspace -> Delete selected nodes and edges
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

      // 3. Escape -> Exit isolation mode, close menus, and deselect all
      if (e.key === 'Escape') {
        setMenu(null);
        if (isolatedGroupId) {
          setIsolatedGroupId(null);
        }
        setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
        setEdges((eds) => eds.map((ed) => ({ ...ed, selected: false })));
        return;
      }

      // 4. Ctrl+C / Cmd+C -> Copy selected nodes + internal edges
      if (isCtrlOrCmd && (e.key === 'c' || e.key === 'C')) {
        const selectedNodes = nodes.filter((n) => n.selected);
        if (selectedNodes.length > 0) {
          const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));
          const internalEdges = edges
            .filter((ed) => selectedNodeIds.has(ed.source) && selectedNodeIds.has(ed.target))
            .map((ed) => ({ from: ed.source, to: ed.target }));

          const hasGroup = selectedNodes.some((n) => {
            const data: any = n.data || {};
            const cfg: any = data.config || {};
            return data.groupId || cfg._groupId;
          });

          clipboardRef.current = {
            nodes: selectedNodes.map((n) => {
              const data: any = n.data || {};
              const cfg: any = data.config || {};
              return {
                id: n.id,
                type: n.type as NodeType,
                position: { x: n.position.x, y: n.position.y },
                config: JSON.parse(JSON.stringify(cfg)),
                groupId: data.groupId || cfg._groupId || null,
                groupName: data.groupName || cfg._groupName || null,
              };
            }),
            edges: internalEdges,
            isGroup: hasGroup,
          };
        }
        return;
      }

      // 5. Ctrl+V / Cmd+V -> Paste copied batch (nodes + internal edges)
      if (isCtrlOrCmd && (e.key === 'v' || e.key === 'V')) {
        if (clipboardRef.current && clipboardRef.current.nodes.length > 0) {
          e.preventDefault();
          onRecordSnapshot?.();
          const flowPos = screenToFlowPosition(mousePosRef.current);
          const payload = clipboardRef.current;

          // Compute bounding box centroid of copied items to offset cleanly around cursor
          const minX = Math.min(...payload.nodes.map((n) => n.position.x));
          const minY = Math.min(...payload.nodes.map((n) => n.position.y));

          // If copied items belonged to a group, generate a fresh new group ID
          const newGroupId = payload.isGroup ? `grp_${Date.now()}` : null;
          const newGroupName = payload.isGroup ? `Group (${payload.nodes.length} items)` : null;

          payload.nodes.forEach((n) => {
            const pastedPos = {
              x: flowPos.x + (n.position.x - minX),
              y: flowPos.y + (n.position.y - minY),
            };
            const configCopy = JSON.parse(JSON.stringify(n.config || {}));
            if (newGroupId) {
              configCopy._groupId = newGroupId;
              configCopy._groupName = newGroupName;
            } else {
              delete configCopy._groupId;
              delete configCopy._groupName;
            }
            onAddNodeAtPosition?.(n.type, pastedPos, configCopy);
          });
        }
        return;
      }

      // 6. Ctrl+D / Cmd+D -> Quick Duplicate (+35px offset)
      if (isCtrlOrCmd && (e.key === 'd' || e.key === 'D')) {
        const selectedNodes = nodes.filter((n) => n.selected);
        if (selectedNodes.length > 0) {
          e.preventDefault();
          onRecordSnapshot?.();
          const newGroupId = selectedNodes.length > 1 ? `grp_${Date.now()}` : null;
          const newGroupName = selectedNodes.length > 1 ? `Group (${selectedNodes.length} items)` : null;

          selectedNodes.forEach((n) => {
            const duplicatePos = {
              x: n.position.x + 35,
              y: n.position.y + 35,
            };
            const data: any = n.data || {};
            const configCopy = JSON.parse(JSON.stringify(data.config || {}));
            if (newGroupId) {
              configCopy._groupId = newGroupId;
              configCopy._groupName = newGroupName;
            }
            onAddNodeAtPosition?.(n.type as NodeType, duplicatePos, configCopy);
          });
        }
        return;
      }

      // 7. Undo: Ctrl+Z / Cmd+Z (without Shift)
      if (isCtrlOrCmd && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        onUndo?.();
        return;
      }

      // 8. Redo: Ctrl+Shift+Z / Cmd+Shift+Z or Ctrl+Y / Cmd+Y
      if (
        (isCtrlOrCmd && e.shiftKey && (e.key === 'z' || e.key === 'Z')) ||
        (isCtrlOrCmd && (e.key === 'y' || e.key === 'Y'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        onRedo?.();
        return;
      }

      // 9. Tool switching shortcuts (V -> Move, H -> Hand, T -> Free-Text)
      if (!isCtrlOrCmd && !e.altKey && !e.shiftKey) {
        if (e.key === 'v' || e.key === 'V') {
          e.preventDefault();
          onSetToolMode?.('select');
          return;
        }
        if (e.key === 'h' || e.key === 'H') {
          e.preventDefault();
          onSetToolMode?.('hand');
          return;
        }
        if (e.key === 't' || e.key === 'T') {
          e.preventDefault();
          const flowPos = screenToFlowPosition(mousePosRef.current);
          onAddNodeAtPosition?.('text', flowPos, { text: '' });
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    nodes,
    edges,
    isolatedGroupId,
    handleGroupSelected,
    handleUngroupSelected,
    onDeleteNode,
    onDeleteEdge,
    onAddNodeAtPosition,
    onUndo,
    onRedo,
    onSetToolMode,
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

  // Sync state when backend updates or restores from undo/redo, preserving user selection state
  useEffect(() => {
    if (canvasData?.nodes) {
      setNodes((prevNodes) => {
        const selectionMap = new Map(prevNodes.map((n) => [n.id, Boolean(n.selected)]));
        return canvasData.nodes.map((serverNode) => {
          const cfg: any = serverNode.config || {};
          return {
            id: serverNode.id,
            type: serverNode.type,
            position: { ...serverNode.position },
            selected: selectionMap.has(serverNode.id) ? selectionMap.get(serverNode.id) : false,
            data: {
              config: serverNode.config,
              state: serverNode.state,
              groupId: serverNode.groupId || cfg._groupId || null,
              groupName: serverNode.groupName || cfg._groupName || null,
            },
          };
        });
      });
    }

    if (canvasData?.edges) {
      setEdges((prevEdges) => {
        const selectionMap = new Map(prevEdges.map((e) => [e.id, Boolean(e.selected)]));
        return canvasData.edges.map((e) => {
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
            selected: selectionMap.has(e.id) ? selectionMap.get(e.id) : false,
            animated: true,
            interactionWidth: 24,
            style: {
              stroke: isHighlighted ? highlightStroke : defaultStroke,
              strokeWidth: isHighlighted ? 4 : 2.5,
              cursor: 'pointer',
              transition: 'stroke 0.2s, stroke-width 0.2s',
            },
          };
        });
      });
    }
  }, [canvasData, highlightedNodeIds, theme, setNodes, setEdges]);

  // Smooth camera pan & zoom when a node is focused from Activity Feed
  useEffect(() => {
    if (!focusedNodeId || !canvasData?.nodes) return;
    const target = canvasData.nodes.find((n) => n.id === focusedNodeId);
    if (target) {
      setCenter(target.position.x + 140, target.position.y + 100, {
        zoom: 1.15,
        duration: 800,
      });

      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          selected: n.id === focusedNodeId,
        }))
      );
    }
  }, [focusedNodeId, canvasData?.nodes, setCenter, setNodes]);

  // Node Click: Handle Figma-style Group cohesive selection
  const onNodeClick = useCallback(
    (event: React.MouseEvent, clickedNode: Node) => {
      setMenu(null);
      const data: any = clickedNode.data || {};
      const cfg: any = data.config || {};
      const nodeGroupId = data.groupId || cfg._groupId;

      // If user is currently isolated in this group, allow standard single/Shift selection within it
      if (isolatedGroupId && nodeGroupId === isolatedGroupId) {
        return;
      }

      // If clicked node is part of a group and not currently isolated:
      if (nodeGroupId) {
        const isShiftOrCmd = event.shiftKey || event.metaKey || event.ctrlKey;
        setNodes((nds) =>
          nds.map((n) => {
            const nData: any = n.data || {};
            const nCfg: any = nData.config || {};
            const nGroupId = nData.groupId || nCfg._groupId;
            if (nGroupId === nodeGroupId) {
              return { ...n, selected: isShiftOrCmd ? !n.selected : true };
            }
            return isShiftOrCmd ? n : { ...n, selected: false };
          })
        );
      }
    },
    [isolatedGroupId, setNodes]
  );

  // Double Click: Enter Group Isolation Focus Mode for that 1 element
  const onNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const data: any = node.data || {};
      const cfg: any = data.config || {};
      const nodeGroupId = data.groupId || cfg._groupId;

      if (nodeGroupId) {
        // If not already isolated in this group, isolate into it and select only this 1 element!
        if (isolatedGroupId !== nodeGroupId) {
          setIsolatedGroupId(nodeGroupId);
          setNodes((nds) =>
            nds.map((n) => ({
              ...n,
              selected: n.id === node.id,
            }))
          );
          return;
        }
      }

      // Normal edit modal fallback
      onEditNode?.(node.id);
    },
    [isolatedGroupId, onEditNode, setNodes]
  );

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

  // Node position drag start
  const onNodeDragStart = useCallback(
    (_event: any, node: Node) => {
      const data: any = node.data || {};
      const cfg: any = data.config || {};
      const nodeGroupId = data.groupId || cfg._groupId;
      if (nodeGroupId && !isolatedGroupId) {
        setNodes((nds) =>
          nds.map((n) => {
            const nData: any = n.data || {};
            const nCfg: any = nData.config || {};
            const nGroupId = nData.groupId || nCfg._groupId;
            return nGroupId === nodeGroupId ? { ...n, selected: true } : n;
          })
        );
      }

      const currentNodesState = nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: { x: n.position.x, y: n.position.y },
        config: n.data?.config,
        state: n.data?.state,
      }));
      onRecordSnapshot?.(currentNodesState);
    },
    [nodes, isolatedGroupId, onRecordSnapshot, setNodes]
  );

  // Node position drag stop
  const onNodeDragStop = useCallback(
    async (_event: any, node: Node, draggedNodes?: Node[]) => {
      try {
        const movedNodes = draggedNodes && draggedNodes.length > 0 ? draggedNodes : [node];
        if (movedNodes.length > 1) {
          await fetch('/api/canvas/nodes', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nodes: movedNodes.map((n) => ({
                id: n.id,
                position: { x: n.position.x, y: n.position.y },
              })),
            }),
          });
        } else {
          await fetch(`/api/canvas/nodes/${node.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              position: { x: node.position.x, y: node.position.y },
            }),
          });
        }
        onRefresh?.();
      } catch (err) {
        console.error('Failed to update node position:', err);
      }
    },
    [onRefresh]
  );

  // Multi-selection drag stop
  const onSelectionDragStop = useCallback(
    async (_event: any, selectedNodes: Node[]) => {
      try {
        if (!selectedNodes || selectedNodes.length === 0) return;
        await fetch('/api/canvas/nodes', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nodes: selectedNodes.map((n) => ({
              id: n.id,
              position: { x: n.position.x, y: n.position.y },
            })),
          }),
        });
        onRefresh?.();
      } catch (err) {
        console.error('Failed to batch update selected nodes:', err);
      }
    },
    [onRefresh]
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

  // Drag and drop files onto canvas
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];

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

  const isHandMode = toolMode === 'hand';

  // Check if selected nodes contain groups or multi-selection
  const selectedNodes = nodes.filter((n) => n.selected);
  const hasGroupSelected = selectedNodes.some((n) => {
    const data: any = n.data || {};
    const cfg: any = data.config || {};
    return data.groupId || cfg._groupId;
  });
  const hasMultiSelection = selectedNodes.length >= 2;

  return (
    <div
      className={`h-full w-full relative transition-colors duration-200 ${isHandMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
      style={{ backgroundColor: bgColor }}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      {/* Group Isolation Focus Banner */}
      {isolatedGroupId && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-2 rounded-full border-2 border-[#0050FF] bg-white dark:bg-[#181920] px-4 py-1.5 shadow-lg animate-in fade-in slide-in-from-top-3 duration-200">
          <MingIcon name="group_line" size={16} className="text-[#0050FF]" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
            Editing inside Group (Isolated)
          </span>
          <span className="text-[11px] font-medium text-slate-400">
            • Press <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">Esc</kbd> or click canvas to exit
          </span>
          <button
            onClick={() => setIsolatedGroupId(null)}
            className="ml-1 rounded-full p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 transition cursor-pointer"
          >
            <MingIcon name="close_line" size={14} />
          </button>
        </div>
      )}

      {/* Figma-style Multi-Selection Bounding Box & Group Actions */}
      <SelectionBoundingBox
        nodes={nodes}
        onGroup={handleGroupSelected}
        onUngroup={handleUngroupSelected}
      />

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
        onSelectionDragStop={onSelectionDragStop}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onPaneClick={() => {
          setMenu(null);
          if (isolatedGroupId) setIsolatedGroupId(null);
        }}
        onEdgeClick={() => setMenu(null)}
        onPaneContextMenu={onPaneContextMenu}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        nodeTypes={nodeTypes}
        panOnDrag={isHandMode ? true : [1, 2]}
        nodesDraggable={!isHandMode}
        nodesConnectable={!isHandMode}
        elementsSelectable={!isHandMode}
        panOnScroll={false}
        selectionOnDrag={!isHandMode}
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
          position="top-left"
          className={
            theme === 'dark'
              ? '!border-2 !border-[#282A36] !bg-[#14151B] !fill-[#BAC0D0] !rounded-xl !shadow-md !mt-3 !ml-3'
              : theme === 'mono'
              ? '!border-2 !border-[#D8D4CA] !bg-[#ECEAE4] !fill-[#242321] !rounded-xl !shadow-md !mt-3 !ml-3'
              : '!border-2 !border-slate-300 !bg-white !fill-slate-700 !rounded-xl !shadow-md !mt-3 !ml-3'
          }
        />
        <MiniMap
          position="bottom-right"
          nodeColor={miniMapNodeColor}
          maskColor={miniMapMaskColor}
          className={
            theme === 'dark'
              ? '!border-2 !border-[#282A36] !bg-[#14151B] !rounded-xl !shadow-md !mb-20 !mr-4'
              : theme === 'mono'
              ? '!border-2 !border-[#D8D4CA] !bg-[#ECEAE4] !rounded-xl !shadow-md !mb-20 !mr-4'
              : '!border-2 !border-slate-300 !bg-white !rounded-xl !shadow-md !mb-20 !mr-4'
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
          hasGroupSelected={hasGroupSelected}
          hasMultiSelection={hasMultiSelection}
          onClose={() => setMenu(null)}
          onAddElement={(type, extraConfig) =>
            onAddNodeAtPosition?.(type, { x: menu.flowX, y: menu.flowY }, extraConfig)
          }
          onEditElement={(nodeId) => onEditNode?.(nodeId)}
          onChangeColor={(nodeId, color) => onChangeNodeColor?.(nodeId, color)}
          onGroupSelected={handleGroupSelected}
          onUngroupSelected={handleUngroupSelected}
          onDeleteElement={(nodeId) => onDeleteNode?.(nodeId)}
          onDeleteEdge={(edgeId) => onDeleteEdge?.(edgeId)}
        />
      )}
    </div>
  );
};
