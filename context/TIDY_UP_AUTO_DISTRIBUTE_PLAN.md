# 📐 Tidy Up & Anti-Collision Auto-Distribute Implementation Plan

> **Backlog item:** "Tidy Up / Auto-Distribute" — 1-click button in the selection bounding box when 3+ nodes are selected to align and space nodes with equal horizontal/vertical offsets without overlaps.

---

## 🎯 Objectives & Anti-Overlap Mandate

1. **Zero Overlap Guarantee:** Prevent any physical bounding box or handle clipping between adjacent nodes.
2. **Handle-Aware Spacing:** Accommodate React Flow node handles (e.g. 36px floating quick-add `+` buttons, True/False branching handles).
3. **Type-Specific Dimension Accuracy:** Accurately measure or estimate dimensions based on node type and mode (e.g. Radar Watcher `400px`, Screener `360px`, Single Watcher `340px`, Note `280px`).
4. **Intelligent Axis & Grid Layout (1D vs 2D Grid):**
   - Pure single-row horizontal spread $\rightarrow$ Equal horizontal spacing with aligned tops.
   - Pure single-column vertical spread $\rightarrow$ Equal vertical spacing with aligned lefts.
   - 2D Cluster ($\ge 4$ nodes with wide $X$ and $Y$ spreads) $\rightarrow$ Clean non-overlapping grid layout.
5. **Undo-Safe & Theme-Compliant:** Integrates seamlessly into `SelectionBoundingBox` pill bar, respects all 3 themes + custom `.scrifflemes`, and supports `Ctrl+Z` undo.

---

## 1. Node Dimension Fallback Table (`src/lib/tidyUpLayout.ts`)

When `node.measured` is pending or unavailable, resolve dimensions accurately with type-aware defaults:

```typescript
export interface TidyNode {
  id: string;
  type?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  config?: any;
}

export const DEFAULT_NODE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  watcher_radar: { width: 400, height: 260 },
  watcher_single: { width: 340, height: 180 },
  screener: { width: 360, height: 300 },
  condition: { width: 280, height: 120 },
  note: { width: 280, height: 180 },
  action: { width: 280, height: 140 },
  alert: { width: 280, height: 130 },
  text: { width: 260, height: 100 },
  file: { width: 280, height: 120 },
  image: { width: 300, height: 200 },
  sticker: { width: 180, height: 70 },
  default: { width: 280, height: 140 },
};

export function resolveNodeDimensions(node: {
  type?: string;
  measured?: { width?: number; height?: number };
  data?: { config?: any };
}): { width: number; height: number } {
  const measuredW = node.measured?.width;
  const measuredH = node.measured?.height;
  const configW = node.data?.config?.width;
  const configH = node.data?.config?.height;

  if (measuredW && measuredH && measuredW > 0 && measuredH > 0) {
    return { width: measuredW, height: measuredH };
  }

  const type = node.type || 'default';
  const isRadar = type === 'watcher' && (node.data?.config?.mode === 'top_gainers' || node.data?.config?.mode === 'top_losers');
  const lookupKey = isRadar ? 'watcher_radar' : type === 'watcher' ? 'watcher_single' : type;
  const fallback = DEFAULT_NODE_DIMENSIONS[lookupKey] || DEFAULT_NODE_DIMENSIONS.default;

  return {
    width: configW ?? fallback.width,
    height: configH ?? fallback.height,
  };
}
```

---

## 2. Core Layout Engine (`src/lib/tidyUpLayout.ts`)

### Configuration Constants

```typescript
export const TIDY_HORIZONTAL_GAP = 48; // Spacing for 36px floating quick-add handles + clearance
export const TIDY_VERTICAL_GAP = 36;   // Vertical inter-card breathing room
export const TIDY_GRID_GAP_X = 48;
export const TIDY_GRID_GAP_Y = 36;
```

### Layout Modes

```typescript
export type TidyMode = 'auto' | 'horizontal' | 'vertical' | 'grid';

export interface TidyResult {
  id: string;
  position: { x: number; y: number };
}
```

### 1. `detectTidyMode(nodes: TidyNode[]): 'horizontal' | 'vertical' | 'grid'`
- Compute total bounds: `spreadX = max(x + w) - min(x)`, `spreadY = max(y + h) - min(y)`.
- If `nodes.length >= 4` and aspect ratio $0.5 \le \frac{\text{spreadX}}{\text{spreadY}} \le 2.0$, and nodes form multiple rows/columns $\rightarrow$ returns `'grid'`.
- Else if `spreadX >= spreadY` $\rightarrow$ `'horizontal'`.
- Else $\rightarrow$ `'vertical'`.

### 2. Horizontal Tidy (`tidyHorizontal`)
1. Sort nodes strictly from left to right by initial `x` coordinate.
2. Maintain anchor `minX = nodes[0].x` and `anchorY = min(nodes.map(n => n.y))`.
3. Sequentially place each node:
   - Node 0: `{ x: minX, y: anchorY }`
   - Node $i$: `{ x: prevX + prevWidth + TIDY_HORIZONTAL_GAP, y: anchorY }`
4. Guarantees **zero horizontal collision** regardless of varying card widths.

### 3. Vertical Tidy (`tidyVertical`)
1. Sort nodes strictly from top to bottom by initial `y` coordinate.
2. Maintain anchor `minY = nodes[0].y` and `anchorX = min(nodes.map(n => n.x))`.
3. Sequentially place each node:
   - Node 0: `{ x: anchorX, y: minY }`
   - Node $i$: `{ x: anchorX, y: prevY + prevHeight + TIDY_VERTICAL_GAP }`
4. Guarantees **zero vertical collision** regardless of varying card heights.

### 4. 2D Grid Tidy (`tidyGrid`)
For clusters ($\ge 4$ nodes spanning both $X$ and $Y$):
1. Determine column count: `cols = Math.ceil(Math.sqrt(nodes.length))`.
2. Sort nodes by initial $(Y, X)$ raster order (row-by-row).
3. Compute dynamic column widths: `colWidth[c] = max(width of nodes in col c)`.
4. Compute dynamic row heights: `rowHeight[r] = max(height of nodes in row r)`.
5. Place each node $(r, c)$ at:
   - `x = minX + sum(colWidth[0..c-1]) + c * TIDY_GRID_GAP_X`
   - `y = minY + sum(rowHeight[0..r-1]) + r * TIDY_GRID_GAP_Y`
6. Guarantees **zero 2D overlap** across all rows and columns.

---

## 3. Comprehensive Unit Tests (`src/__tests__/unit/tidyUpLayout.test.ts`)

Write tests to verify zero overlaps under all permutations:

| Test Case | Verification Criteria |
|---|---|
| `< 3 nodes` | Returns empty array (no-op guard) |
| Horizontal layout with uniform nodes | Strict equal spacing of `48px`, top-aligned |
| Horizontal layout with mixed widths (e.g. Radar 400px + Condition 280px + Text 260px) | Strict distance $x_{i} - (x_{i-1} + w_{i-1}) = 48\text{px}$, zero overlap |
| Vertical layout with mixed heights (e.g. Screener 300px + Action 140px + Sticker 70px) | Strict distance $y_{i} - (y_{i-1} + h_{i-1}) = 36\text{px}$, zero overlap |
| Unsorted input order | Correctly re-sorted by coordinate order prior to laying out |
| 2D Grid distribution (4 and 6 nodes) | No overlapping bounding boxes (`intersects(a, b) === false`) for all pairs $(a, b)$ |
| Dimension resolution fallback | Correctly resolves Radar Watcher to 400px vs standard 340px |
| Node ID preservation | 100% ID parity between input and output positions |

---

## 4. UI Integration in `SelectionBoundingBox.tsx`

### Props & Visibility
- Add `onTidyUp?: (mode?: TidyMode) => void` prop.
- Render button when `selectedNodes.length >= 3 && !isGrouped`.

### Component Markup (Theme-Aware & Flat Outline)
```tsx
{onTidyUp && selectedNodes.length >= 3 && !isGrouped && (
  <button
    type="button"
    onClick={() => onTidyUp('auto')}
    title="Tidy up & auto-distribute spacing (Ctrl+Shift+T)"
    className={`flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-bold backdrop-blur-md transition-all cursor-pointer ${
      isDark
        ? 'bg-[#1E202B] hover:bg-[#2A2D3D] border-[#313444] text-[#E2E4E9]'
        : isMono
        ? 'bg-[#ECEAE4] hover:bg-[#E0DDD5] border-[#D1CEC4] text-[#242321]'
        : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
    }`}
  >
    <MingIcon name="distribute_horizontal_line" size={13} />
    <span>Tidy up</span>
    <span className="opacity-50 text-[10px]">Ctrl+Shift+T</span>
  </button>
)}
```

---

## 5. Wiring in `MarketCanvas.tsx`

1. **Implement `handleTidyUp`:**
   - Filter `selectedNodes` from React Flow `nodes`.
   - Resolve dimensions via `resolveNodeDimensions`.
   - Call `tidyUpNodes(tidyInput, mode)`.
   - Call `onRecordSnapshot?.()` for `Ctrl+Z` undo history.
   - Optimistically update local React Flow `setNodes`.
   - Bulk persist new positions via `PATCH /api/canvas/nodes`.
2. **Keyboard Shortcut:**
   - Listen for `(e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 't'`.
   - Triggers `handleTidyUp('auto')` when $\ge 3$ nodes are selected.
3. **Pass Handler to `<SelectionBoundingBox />`:**
   - `<SelectionBoundingBox nodes={nodes} onGroup={...} onUngroup={...} onTidyUp={handleTidyUp} />`.

---

## 6. Documentation & Shortcut Guides

1. **`ShortcutsModal.tsx`**: Add `Ctrl+Shift+T` under the *Grouping & Canvas* category.
2. **`AGENT_CONTEXT.md`**: Add Tidy Up & Auto-Distribute to Section 9 (Implemented Features).
3. **`context/BACKLOG.md`**: Mark item complete.

---

## 🛡️ Anti-Overlap Checklist

- [x] Standard horizontal gap increased to `48px` to clear `+` port handles.
- [x] Standard vertical gap set to `36px`.
- [x] Type-aware node dimensions (Radar Watcher 400px, Screener 360px, Single Watcher 340px).
- [x] 2D Grid fallback to prevent vertical collapsing of multi-row selections.
- [x] Zero drop shadows, flat 2px borders, MingCute icons, sentence case.
- [x] 100% covered by unit tests.
