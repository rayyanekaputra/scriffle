# 🔀 Implementation Plan: Condition Node Dual Outputs & False Branching

> **Feature:** Dual Output Handles (`True` & `False`) on Condition Nodes with Dynamic Branch Execution  
> **Status:** Reviewed & Patched (Sonnet review pass applied)  
> **Target Version:** Scriffle v2.1  
> **Tech Stack:** React Flow (`@xyflow/react`), Next.js 16, TypeScript, Prisma (SQLite), `expr-eval`  

---

## 1. Overview & Problem Statement

Currently, `ConditionNode` only supports single-path execution:
1. When a condition evaluates to `true` (`passed`), execution continues down all outgoing edges.
2. When a condition evaluates to `false` (`failed`), graph traversal halts immediately (`branchShouldContinue = false`), discarding the market event.

In real financial market automation and visual workflow engines (like n8n, Zapier, Node-RED, and Unreal Blueprints), conditional branching requires **two distinct execution pathways**:
- **`True` Branch (Green)**: Executed when the DSL boolean rule is met (e.g. `price_change > 5%` → Trigger Surge Alert / Generate Deep Dive PDF).
- **`False` Branch (Rose / Coral)**: Executed when the DSL rule fails (e.g. `price_change <= 5%` → Log Neutral Sticky Note / Trigger Reversion Watcher / Clear Alert).

---

## 2. Core Architecture & Data Flow

```
                     ┌──────────────────┐
                     │   Watcher Node   │ (BBCA Market Tick)
                     └────────┬─────────┘
                              │
                              ▼
                     ┌──────────────────┐
                     │  Condition Node  │ [price_change > 5.0]
                     └───────┬──┬───────┘
                             │  │
             ┌───────────────┘  └────────────────┐
             │ (sourceHandle: "true")            │ (sourceHandle: "false")
             ▼                                   ▼
   ┌────────────────────┐              ┌────────────────────┐
   │ Action / Alert /   │              │ Note / Action /    │
   │ Note ("if true")   │              │ Alert ("if false") │
   │ 🚀 Surge Alert     │              │ 💤 Steady Market   │
   └────────────────────┘              └────────────────────┘
```

---

## 3. Detailed Technical Specifications

### A. Database Schema & Prisma Model (`prisma/schema.prisma`)

Update `Edge` model to persist `fromHandle` and `toHandle`.

> [!CAUTION]
> **Schema constraint change requires a dev DB reset.** The existing `@@unique([fromId, toId])` constraint is being replaced with `@@unique([fromId, toId, fromHandle])`. SQLite treats `NULL != NULL`, which means the upsert logic in `/api/canvas/edges` keyed on `fromId_toId` will break. After running `bunx prisma db push`, also run `bun run prisma/seed.ts` to re-seed the dev DB. Existing `.scriffle` files remain importable without changes — the restore route will simply write `fromHandle: null` for legacy edges.

```prisma
model Edge {
  id          String   @id @default(uuid())
  canvasId    String
  canvas      Canvas   @relation(fields: [canvasId], references: [id], onDelete: Cascade)
  fromId      String
  toId        String
  fromHandle  String?  // 'true' | 'false' | null (null = legacy, treated as 'true' at runtime)
  toHandle    String?
  fromNode    Node     @relation("FromNode", fields: [fromId], references: [id], onDelete: Cascade)
  toNode      Node     @relation("ToNode", fields: [toId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())

  @@unique([fromId, toId, fromHandle])
}
```

Also update the upsert in `/api/canvas/edges/route.ts` to key on the new compound:

```typescript
const edge = await prisma.edge.upsert({
  where: {
    fromId_toId_fromHandle: {
      fromId: from,
      toId: to,
      fromHandle: fromHandle ?? null,
    },
  },
  create: { canvasId: targetCanvasId, fromId: from, toId: to, fromHandle: fromHandle ?? null },
  update: {},
});
```

---

### B. TypeScript Contracts (`src/types/canvas.ts`)

Update `CanvasEdgeData`:

```typescript
export interface CanvasEdgeData {
  id: string;
  canvasId: string;
  from: string;
  to: string;
  fromHandle?: string | null; // 'true' | 'false' | null (null = legacy default 'true')
  toHandle?: string | null;
}
```

---

### C. Canvas API GET — Return `fromHandle` on Edges (`/api/canvas/route.ts`)

The `GET /api/canvas` response currently omits `fromHandle`. It must be included so the frontend and engine can read it:

```typescript
const formattedEdges: CanvasEdgeData[] = canvas.edges.map((edge: any) => ({
  id: edge.id,
  canvasId: edge.canvasId,
  from: edge.fromId,
  to: edge.toId,
  fromHandle: edge.fromHandle ?? null,  // ← ADD THIS
  toHandle: edge.toHandle ?? null,      // ← ADD THIS
}));
```

---

### D. Visual UI: Dual Output Handles (`ConditionNode.tsx`)

Replace the single `<QuickAddSourceHandle>` with two positioned handles. `QuickAddSourceHandle` must also be updated (see Section F).

```tsx
{/* True output — top-right */}
<QuickAddSourceHandle
  nodeId={id}
  nodeType="condition"
  nodeLabel={`Rule: ${config.rule || 'Condition'} [TRUE]`}
  handleId="true"
  selected={selected}
  positionStyle={{ top: '36%' }}
/>

{/* False output — bottom-right */}
<QuickAddSourceHandle
  nodeId={id}
  nodeType="condition"
  nodeLabel={`Rule: ${config.rule || 'Condition'} [FALSE]`}
  handleId="false"
  selected={selected}
  positionStyle={{ top: '72%' }}
  variant="false"
/>
```

Handle visual specs:
| Handle | Color | Handle ID | Position |
|---|---|---|---|
| True | Emerald `#10B981` | `"true"` | `top: 36%` |
| False | Rose/Coral `#FF5B79` | `"false"` | `top: 72%` |

Each handle shows a hover tooltip chip (`"True"` / `"False"`) and a Quick-Add `[+]` button.

---

### E. `QuickAddSourceHandle.tsx` — Add `handleId` & `variant` Props

The component currently has **no `handleId` prop** and dispatches `scriffle:quick-add` without a `sourceHandleId`. Both must be added:

```typescript
interface QuickAddSourceHandleProps {
  nodeId: string;
  nodeType: NodeType;
  nodeLabel?: string;
  selected?: boolean;
  className?: string;
  handleId?: string;           // ← NEW: 'true' | 'false'
  positionStyle?: React.CSSProperties; // ← NEW: override top/bottom position
  variant?: 'default' | 'false'; // ← NEW: colors the handle and + button coral for false branch
}
```

In the dispatch event detail:
```typescript
window.dispatchEvent(
  new CustomEvent('scriffle:quick-add', {
    detail: {
      nodeId,
      sourceNodeType: nodeType,
      sourceNodeLabel: nodeLabel || nodeType,
      sourceHandleId: handleId ?? null,  // ← NEW
      screenPosition: { x: clientX, y: clientY },
    },
  })
);
```

The `<Handle>` component rendered inside must also pass `id={handleId}`:
```tsx
<Handle
  type="source"
  position={Position.Right}
  id={handleId}   // ← required for React Flow to set sourceHandle on Connection
  style={positionStyle}
  className={...}
/>
```

---

### F. `onConnect` in `MarketCanvas.tsx` — Thread `sourceHandle`

The React Flow `Connection` object already exposes `sourceHandle`. It's currently dropped. Fix:

```typescript
const onConnect = useCallback(
  async (params: Connection) => {
    if (!params.source || !params.target) return;
    // ...existing edge add logic...
    await fetch('/api/canvas/edges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        canvasId: canvasData?.id,
        from: params.source,
        to: params.target,
        fromHandle: params.sourceHandle ?? null,  // ← ADD
        toHandle: params.targetHandle ?? null,    // ← ADD
      }),
    });
  },
  [...]
);
```

Also update `initialEdges` and the SWR sync `setEdges` block to pass `sourceHandle` on the React Flow edge object so `LabeledEdge` can read it:

```typescript
return canvasData.edges.map((e) => ({
  id: e.id,
  source: e.from,
  target: e.to,
  sourceHandle: e.fromHandle ?? null,  // ← ADD
  targetHandle: e.toHandle ?? null,    // ← ADD
  type: 'labeled',
  animated: true,
  // ...
}));
```

---

### G. Edge Labels & Badge Inference (`edgeLabels.ts` & `LabeledEdge.tsx`)

**`edgeLabels.ts`** — extend `inferEdgeLabel` signature with `sourceHandle`:

```typescript
export function inferEdgeLabel(
  sourceType?: string | null,
  targetType?: string | null,
  sourceHandle?: string | null  // ← NEW param
): string | null {
  if (sourceType === 'condition') {
    if (sourceHandle === 'false') return 'if false';
    return 'if true'; // 'true' or null/legacy both route here
  }
  // ... other node types unchanged
}
```

**`LabeledEdge.tsx`** — destructure `sourceHandle` from `EdgeProps` and pass to `resolveEdgeLabel`:

```typescript
export const LabeledEdge: React.FC<EdgeProps> = ({
  // ...existing props...
  sourceHandle,  // ← ADD (React Flow provides this)
}) => {
  const currentLabel = resolveEdgeLabel(
    (data as LabeledEdgeData)?.label || customLabel,
    sourceNodeType,
    targetNodeType,
    sourceHandle  // ← ADD
  );

  const isFalseEdge = currentLabel === 'if false';
  const isConditionEdge = currentLabel === 'if true';
```

Badge styling:
- `"if true"`: Existing emerald dot + blue text.
- `"if false"`: Rose dot (`bg-rose-500`) + rose text (`text-rose-500` / dark: `text-rose-400`).

---

### H. Graph Traversal Engine (`graphEngine.ts`)

> [!IMPORTANT]
> **Behavior change:** Previously, condition nodes that evaluated `false` were NOT added to `triggeredNodes` — the engine silently halted. With dual branching, **both outcomes** push the condition node into `triggeredNodes` so the Activity Feed always shows that the condition was evaluated and which branch was taken. This is intentional and desirable.

Update BFS traversal in `executeGraphForEvent`, `executeGraphForRadarWatcher`, and `executeGraphForScreener`:

```typescript
if (node.type === 'condition') {
  const passed = evaluateCondition(nodeConfig.rule || '', curEvent);
  await prisma.node.update({
    where: { id: node.id },
    data: {
      stateJson: JSON.stringify({
        status: passed ? 'passed' : 'failed',
        lastValue: curEvent,
        lastTriggeredAt: curEvent.timestamp || new Date().toLocaleTimeString(),
      }),
    },
  });

  // Both pass and fail now register as triggered (visible in Activity Feed)
  triggeredNodes.push(node.id);
  logs.push(
    passed
      ? `Condition matched: "${nodeConfig.rule}" for ${curEvent.symbol} (routing True branch)`
      : `Condition not met: "${nodeConfig.rule}" for ${curEvent.symbol} (routing False branch)`
  );

  // Route to matching handle branch only — remove old branchShouldContinue pattern
  const outgoing = canvas.edges.filter((e) => e.fromId === node.id);
  for (const edge of outgoing) {
    const handle = edge.fromHandle || 'true'; // null/legacy edges default to 'true'
    if (passed && handle === 'true') {
      queue.push({ nodeId: edge.toId, event: curEvent });
    } else if (!passed && handle === 'false') {
      queue.push({ nodeId: edge.toId, event: curEvent });
    }
  }
  // Note: branchShouldContinue is no longer used here — manual queue control replaces it
}
```

---

### I. `.scriffle` Export Format — Include `fromHandle`

When saving a `.scriffle` file (in `SimulationBar.tsx` / the save handler), edges must include `fromHandle`:

```typescript
edges: canvasData.edges.map((e) => ({
  id: e.id,
  from: e.from,
  to: e.to,
  fromHandle: e.fromHandle ?? null,  // ← ADD
}))
```

The restore route (`/api/canvas/restore/route.ts`) must also read and write `fromHandle` when re-creating edges:

```typescript
await prisma.edge.create({
  data: {
    id: newEdgeId,
    canvasId,
    fromId: idMap[edge.from],
    toId: idMap[edge.to],
    fromHandle: edge.fromHandle ?? null,  // ← ADD
  },
});
```

---

### J. Quick-Add Navigator (`quickAddNavigator.ts` & `QuickAddPopover.tsx`)

- Thread `sourceHandleId` from the `scriffle:quick-add` event detail into `QuickAddPopover`.
- Pass `fromHandle: sourceHandleId` in the edge POST when auto-wiring a new node.
- When `sourceHandleId === 'false'`, suggest a default `note` template: `${symbol} held steady at ${price} (${price_change}%)`.
- When `sourceHandleId === 'true'`, keep existing positive-trigger templates.

---

## 4. Implementation Steps (Execution Roadmap)

| Step | Scope | Files | Description |
|---|---|---|---|
| **Step 1** | Schema + DB | `prisma/schema.prisma` | Add `fromHandle String?`, `toHandle String?`, update `@@unique` to `[fromId, toId, fromHandle]`. Run `bunx prisma db push` then `bun run prisma/seed.ts`. |
| **Step 2** | API Routes | `/api/canvas/edges/route.ts`, `/api/canvas/route.ts`, `/api/canvas/restore/route.ts` | Update edge upsert compound key; include `fromHandle`/`toHandle` in GET response and restore writes. |
| **Step 3** | Types | `src/types/canvas.ts` | Add `fromHandle?`, `toHandle?` to `CanvasEdgeData`. |
| **Step 4** | Edge Labels | `src/lib/edgeLabels.ts`, `LabeledEdge.tsx` | Extend `inferEdgeLabel` + `resolveEdgeLabel` with `sourceHandle` param. Add rose badge styling for `"if false"` in `LabeledEdge.tsx`. |
| **Step 5** | Graph Engine | `src/server/services/graphEngine.ts` | Replace `branchShouldContinue` pattern for condition nodes with handle-filtered `queue.push()`. Update all 3 traversal functions. |
| **Step 6** | Handle Component | `src/components/canvas/QuickAddSourceHandle.tsx` | Add `handleId`, `positionStyle`, `variant` props. Emit `sourceHandleId` in event detail. Pass `id={handleId}` to `<Handle>`. |
| **Step 7** | Node UI | `src/components/canvas/nodes/ConditionNode.tsx` | Replace single `QuickAddSourceHandle` with two positioned handles (true @ 36%, false @ 72%). Add hover label chips. |
| **Step 8** | Canvas Wiring | `src/components/canvas/MarketCanvas.tsx` | Thread `sourceHandle`/`targetHandle` through `onConnect`, `initialEdges`, and SWR sync `setEdges`. |
| **Step 9** | Export Format | `SimulationBar.tsx` (save handler) | Include `fromHandle` in `.scriffle` edge serialization. |
| **Step 10** | Quick-Add | `quickAddNavigator.ts`, `QuickAddPopover.tsx` | Pass `sourceHandleId` through event → popover → edge POST. Apply false-branch note templates. |
| **Step 11** | Unit Tests | `src/__tests__/unit/conditionBranching.test.ts` | 10+ tests: true-only routing, false-only routing, mixed both-branch, legacy null edge fallback, no false-branch configured (condition silently passes with no false downstream), activity feed log content. |

---

## 5. Verification & Acceptance Criteria

1. **Visual Display**:
   - `ConditionNode` clearly displays two right-side handles: upper `True` (Emerald) and lower `False` (Rose).
   - Both handles show `+` quick-add buttons on hover/selection.
   - Existing nodes with a single outgoing edge are visually unaffected.

2. **Connector Badges**:
   - Connectors from the `True` port: emerald dot + `"if true"` badge pill.
   - Connectors from the `False` port: rose dot + `"if false"` badge pill.
   - Legacy edges (no `fromHandle`): render as `"if true"` (backward compatible).

3. **Engine Execution**:
   - Rule = `true` → only true-branch children execute; false-branch children are silent.
   - Rule = `false` → only false-branch children execute; true-branch children are silent.
   - Condition node always appears in Activity Feed regardless of outcome.
   - Logs explicitly state `"routing True branch"` / `"routing False branch"`.

4. **Backward Compatibility**:
   - Existing `.scriffle` files without `fromHandle` import and execute correctly (`null` → `'true'` default).
   - No existing test suite breakage — all 158+ tests remain green.

5. **Unit Tests**:
   - All new `conditionBranching.test.ts` tests pass.
   - `bun test` exits 100% green.
