# 📦 Implementation Plan: FigJam & Figma-Style Group / Ungroup & Group Isolation

This plan details the full architecture and implementation steps to add **Group & Ungroup** capabilities to Scriffle, including group multi-element copy/paste, double-click sub-element isolation focus, and grouped `Shift+Click` sub-selections.

---

## 🎯 1. User Stories & Interaction Design

### A. Grouping & Ungrouping (`Cmd+G` / `Cmd+Shift+G`)
1. **Group Selected Elements (`Cmd+G` / `Ctrl+G`)**:
   * When 2 or more nodes are selected, pressing `Cmd+G` assigns them a unique `groupId` (e.g. `grp_xyz123`).
   * When any element in the group is clicked in normal canvas mode, **the entire group is selected simultaneously** as a single cohesive unit.
   * Dragging any element in the group moves the entire group synchronously.
2. **Ungroup Elements (`Cmd+Shift+G` / `Ctrl+Shift+G` or Context Menu)**:
   * Removes `groupId` from all selected grouped elements, restoring them as independent items.
3. **Visual Group Boundary / Header**:
   * Grouped items show a cohesive dashed bounding highlight and a subtle tag pill (e.g. `📦 Group (4 items)`) on hover/select.

---

### B. Group Clipboard & Multi-Element Copy/Paste (`Cmd+C` / `Cmd+V`)
1. **Multi-Node & Group Copy**:
   * Pressing `Cmd+C` when a group (or multi-selection) is active copies **all member nodes and their internal connecting edges** into the clipboard buffer, preserving relative XY offsets and node configs.
2. **Paste with Fresh Group ID (`Cmd+V` / `Cmd+D`)**:
   * Pasting duplicates all group elements with new unique IDs and assigns a fresh new `groupId` to the pasted batch at the cursor position.
   * Re-links internal connecting edges between the newly duplicated nodes!

---

### C. Double-Click Group Isolation Mode (Deep Selection / Focus)
1. **Single Click on Grouped Node**:
   * Selects all nodes in that group (Standard FigJam behavior).
2. **Double-Click on a Specific Grouped Node**:
   * Enters **"Group Isolation Focus Mode"** on that specific group:
     * Rest of the canvas is slightly dimmed / non-interfering.
     * The single clicked child element becomes individually active and editable (e.g., editing text, changing sticky note color, opening property modal).
     * `Shift + Click` inside the isolated group allows multi-selecting a subset of items within that group only.
3. **Exiting Isolation Mode**:
   * Pressing `Escape` or clicking outside on the empty canvas exits isolation mode back to global whiteboard view.

---

## 🏗️ 2. Data Contract & Schema (`src/types/canvas.ts` & DB)

### Node Schema Extension
Add `groupId?: string` to `CanvasNodeData` and DB Node model:

```typescript
export interface CanvasNodeData {
  id: string;
  canvasId: string;
  groupId?: string | null;  // Group identifier (e.g. "grp_1710000000000")
  type: NodeType;
  position: { x: number; y: number };
  config: NodeConfig;
  state?: {
    cycleCount?: number;
    lastTriggeredAt?: string;
    lastValue?: any;
    status?: 'idle' | 'running' | 'passed' | 'failed' | 'error';
    error?: string;
  };
}
```

---

## 🧩 3. Architectural Component Changes

```
src/
├── types/canvas.ts                # Add groupId to CanvasNodeData and NodeConfig
├── components/canvas/
│   ├── MarketCanvas.tsx           # Group selection dispatcher, Cmd+G/Cmd+Shift+G hotkeys, deep-select isolation state
│   ├── ContextMenu.tsx            # "Group selection" and "Ungroup" context menu options
│   └── nodes/
│       └── GroupOverlay.tsx       # (Optional) Visual group bounding outline with renameable group tag
└── app/api/canvas/
    ├── nodes/route.ts             # Batch update supporting groupId mutations
    └── nodes/[id]/route.ts        # Single node update supporting groupId
```

---

## 📋 4. Step-by-Step Implementation Steps

### Step 1: Types & API Schema
* Extend `CanvasNodeData` in [`src/types/canvas.ts`](file:///home/abzolute/Projects/hackathon/src/types/canvas.ts) with `groupId?: string | null`.
* Ensure `/api/canvas/nodes` batch PATCH endpoint accepts `groupId`.

### Step 2: Multi-Node Clipboard Buffer Upgrade
* Upgrade `clipboardNodeRef` in `MarketCanvas.tsx` from single-node to `ClipboardPayload`:
  ```typescript
  interface ClipboardPayload {
    nodes: Array<{ id: string; type: NodeType; position: { x: number; y: number }; config: any; groupId?: string }>;
    edges: Array<{ from: string; to: string; style?: any }>;
    isGroup?: boolean;
  }
  ```
* On `Cmd+C`: Collect all selected nodes. If any belongs to a group and isolation mode is inactive, include the whole group and internal edges.
* On `Cmd+V`: Calculate centroid offset to cursor, generate new node IDs, remap edge source/targets, assign a new `groupId` if copied as a group, and insert all nodes/edges via atomic batch.

### Step 3: Group Selection & Isolation Logic in `MarketCanvas.tsx`
* **State**: Track `isolatedGroupId: string | null`.
* **Node Click Handler (`onNodeClick`)**:
  * If node has `groupId`:
    * If `isolatedGroupId === node.groupId`: Allow normal single-select / `Shift+Click` sub-select within the isolated group.
    * Else: Select ALL nodes where `n.groupId === node.groupId`.
* **Node Double-Click Handler (`onNodeDoubleClick`)**:
  * If node has `groupId`:
    * Set `isolatedGroupId = node.groupId`.
    * Select only the clicked node.
  * Else: Open node editor modal.
* **Canvas Pane Click (`onPaneClick`)**:
  * If `isolatedGroupId !== null`: Clear isolation mode (`setIsolatedGroupId(null)`).

### Step 4: Keyboard Shortcuts & Context Menus
* `Cmd+G` / `Ctrl+G`: Group currently selected nodes -> assign `groupId = 'grp_' + Date.now()` and batch PATCH.
* `Cmd+Shift+G` / `Ctrl+Shift+G`: Ungroup selected nodes -> set `groupId = null` and batch PATCH.
* Add "Group selection (Cmd+G)" and "Ungroup (Cmd+Shift+G)" to `ContextMenu.tsx`.

### Step 5: Visual Feedback & Testing
* Show active group border highlight and isolation banner at top-center when isolation mode is active:
  * *"📦 Editing inside Group — Press Esc or click canvas to exit"*.
* Verify build with `bun run build`.
