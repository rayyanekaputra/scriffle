# 📋 IMPLEMENTATION PLAN: Quick-Add Node Connector (`+` Port Handle & Flow Auto-Wiring)

> **Objective:** Introduce signature n8n / FigJam-style 1-click node expansion and workflow auto-wiring. Users can click a floating `+` handle on any node's output port or drag-and-drop a connector onto an empty canvas area to open a contextual quick-add menu that creates the next node, auto-wires the edge, and positions it cleanly without overlapping existing cards.

---

## 1. Problem Statement & UX Motivation

In Scriffle, constructing automation workflows currently requires:
1. Right-clicking or using the bottom navigation toolbar to drop a new node somewhere on the canvas.
2. Manually dragging a connection line from the source node handle to the newly created target node handle.
3. Manually moving the nodes around to keep the canvas neat.

### UX Bottlenecks
- **High Click / Drag Friction**: Auto-building standard financial pipelines (e.g. `[Watcher: BBCA] -> [Condition: price_change > 3] -> [Sticky Note]` or `[AI Screener] -> [Action: Fundamental Report] -> [FileNode]`) requires 4–6 manual positioning and connection steps.
- **Mental Flow Disruption**: Having to switch back and forth between node placement, wiring, and positioning slows down presentation and research authoring.
- **Discovery**: New users may not know which node types naturally chain into downstream logic.

---

## 2. Target UX & Feature Capabilities

```
┌────────────────────────┐
│ WatcherNode: BBCA      │
│ [ ⚡ 0 runs ]          │────( ● ) ───[ + ]   <-- Floating Quick-Add button on hover/select
└────────────────────────┘          │
                                    │ (Click [+] or Drag & Release on empty canvas)
                                    ▼
                      ┌───────────────────────────┐
                      │ ⚡ Quick Add Connected Node│
                      │ ───────────────────────── │
                      │ 🟡 Condition (Rule Check) │
                      │ 📝 Sticky Note            │
                      │ ⚙️ Action (Create / Report)│
                      │ 🔔 Alert (Toast / Notify) │
                      │ 📑 File Attachment        │
                      └───────────────────────────┘
                                    │
                                    ▼ (User clicks "Condition")
┌────────────────────────┐            ┌────────────────────────┐
│ WatcherNode: BBCA      │            │ ConditionNode          │
│ [ ⚡ 0 runs ]          │───────────▶│ [ price_change > 0 ]   │
└────────────────────────┘  Auto-Edge └────────────────────────┘
                           (Offset: +320px X, aligned Y)
```

### Key Capabilities

1. **Hover / Selection `+` Quick-Add Button**:
   - When a node with a source handle (e.g. `Watcher`, `Condition`, `Screener`, `Action`) is hovered or selected, a sleek `+` button appears directly adjacent to its right output handle.
   - 2px flat outline, theme-aware styling, perfectly aligned with the handle.

2. **Drag-to-Empty-Canvas Connector (`onConnectEnd`)**:
   - If a presenter drags a connection line out of any output handle and releases it over empty canvas space (instead of snapping to another node handle), the Quick-Add popover immediately opens at the release coordinates.

3. **Intelligent Smart Placement & Non-Overlapping Offset**:
   - If triggered via `+` button: spawns the new node at `(sourceNode.x + 320, sourceNode.y)` (with automatic collision check against existing nodes, bumping `y + 140` if occupied).
   - If triggered via drag release: spawns the new node directly at the drop coordinate converted via `screenToFlowPosition`.

4. **Instant Auto-Edge Creation**:
   - Immediately creates the edge `{ from: sourceNodeId, to: newNodeId }` in React Flow and persists to `/api/canvas/edges`.
   - Selects and focuses the new node so users can immediately hit `Tab` / `+` again to continue chaining.

5. **Contextual & Semantic Node Recommendations**:
   - The quick-picker highlights the most logical next node types:
     - From `Watcher` / `Screener`: Recommended `Condition` (Yellow), `Sticky Note` (Pastel), `Action` (Cobalt).
     - From `Condition`: Recommended `Sticky Note`, `Alert`, `Action`.
     - From `Action`: Recommended `Sticky Note`, `File`, `Watcher`.

---

## 3. Technical Architecture & Component Breakdown

### A. Quick-Add Floating Handle Component (`QuickAddHandle.tsx`)
A shared, reusable wrapper or handle decorator used across all source-capable node components:
- Renders standard `@xyflow/react` `<Handle type="source" position={Position.Right} />`.
- Renders an interactive `<button>` with `<MingIcon name="add_line" />` on hover/selection.
- Emits `onQuickAdd(sourceNodeId, handlePosition)`.

```tsx
// src/components/canvas/QuickAddHandle.tsx
interface QuickAddHandleProps {
  nodeId: string;
  isDark: boolean;
  isMono: boolean;
  onOpenQuickAdd: (nodeId: string, position: { x: number; y: number }) => void;
}
```

### B. Quick-Add Picker Popover (`QuickAddPickerModal.tsx` or `QuickAddPopover.tsx`)
A lightweight, fast popover positioned at cursor / handle coordinates:
- 2px flat outline, zero drop shadow, Stack Sans Text, MingCute icons.
- Keyboard navigable: `↑`/`↓` to browse, `Enter` to select, `Esc` to dismiss.
- Supports theme tokens (Light, Mono, Dark).
- Categorized list:
  1. `Condition` (Rule filter)
  2. `Sticky Note` (Dynamic market note)
  3. `Action` (Canvas mutation & report export)
  4. `Alert` (Notification & toast)
  5. `File` (Document attachment)
  6. `Text` / `Sticker` (Annotation)

### C. Canvas-Level Flow Integration (`MarketCanvas.tsx`)
1. **`onConnectEnd` Hook Integration**:
   ```tsx
   const onConnectEnd = useCallback((event: MouseEvent | TouchEvent, connectionState: any) => {
     if (!connectionState.isValid && connectionState.fromNode) {
       const clientX = 'clientX' in event ? event.clientX : event.touches[0].clientX;
       const clientY = 'clientY' in event ? event.clientY : event.touches[0].clientY;
       const flowPos = screenToFlowPosition({ x: clientX, y: clientY });
       openQuickAdd({
         sourceNodeId: connectionState.fromNode.id,
         position: flowPos,
         screenPosition: { x: clientX, y: clientY },
       });
     }
   }, [screenToFlowPosition]);
   ```
2. **Auto-Wiring & Placement Engine**:
   - `handleCreateAndConnectNode(type: NodeType, sourceNodeId: string, targetPosition: { x: number; y: number })`
   - Spawns target node via `onAddNodeAtPosition` or direct state update.
   - Calls `POST /api/canvas/nodes` and `POST /api/canvas/edges`.
   - Records undo/redo history snapshot (`onRecordSnapshot`).

---

## 4. Design System Compliance Checklist

- [x] **Zero drop shadows**: Clean 2px solid border with subtle hover highlight.
- [x] **Flat outline system**: `border-2 border-slate-300` / `border-slate-800` / `border-[#2E3240]`.
- [x] **Typography**: Stack Sans Text, Sentence Case, zero all-caps, zero spaced letters.
- [x] **Icons**: MingCute exclusively (`<MingIcon name="add_line" />`, `filter_line`, `notification_line`, `play_line`, etc.).
- [x] **Themes**: Verified across Light (Electric Blue `#0050FF`), Mono (Warm-Paper `#F4F3EF`), and Dark (Soft Charcoal `#0F1014`).

---

## 5. Implementation Phases & Task Breakdown

### Phase 1: Quick-Add Popover Component & Spatial Coordinate Helper
- [ ] Create `src/components/canvas/QuickAddPopover.tsx` with keyboard navigation (`↑`/`↓`/`↵`/`Esc`).
- [ ] Create spatial placement helper `calculateQuickAddPosition(sourceNode, existingNodes)` with non-overlap collision avoidance.

### Phase 2: Handle Enhancements in Node Components
- [ ] Implement `QuickAddHandle` in:
  - `WatcherNode.tsx`
  - `ConditionNode.tsx`
  - `ScreenerNode.tsx`
  - `ActionNode.tsx`
- [ ] Ensure handles maintain seamless connection capability while supporting the `+` click trigger.

### Phase 3: Canvas Integration & Auto-Wiring
- [ ] Wire `onConnectEnd` in `MarketCanvas.tsx` for drag-to-empty-canvas gesture.
- [ ] Connect `handleCreateAndConnectNode` to DB persistence routes (`/api/canvas/nodes` + `/api/canvas/edges`).
- [ ] Support `Tab` hotkey on selected node to open Quick-Add at standard right offset.

### Phase 4: Unit Testing & Verification
- [ ] Create unit tests in `src/__tests__/unit/quickAddNavigator.test.ts`:
  - Verify spatial coordinate calculations and offset collision resolution.
  - Verify recommended node priority mapping per source node type.
  - Verify edge connector payload creation (`fromId` -> `toId`).
- [ ] Ensure all test suites remain 100% green with `bun test`.

---

## 6. Testing Strategy

| Test Area | Expected Behavior |
|---|---|
| **Collision Avoidance** | If `(x + 320, y)` is occupied by an existing node within 120px radius, offset to `(x + 320, y + 140)`. |
| **Recommendation Engine** | Source `watcher` recommends `['condition', 'note', 'action']`; source `condition` recommends `['note', 'alert', 'action']`. |
| **Edge Payload** | Correctly maps source node ID to newly created node ID and initializes default node configuration. |
