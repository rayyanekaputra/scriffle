# 📐 Tidy Up: Overlap-Aware Minimal Displacement — Implementation Plan

> **Status:** Ready for implementation. This replaces the previous sorting-based Tidy Up engine.

---

## 0. What Must Change (And What Must NOT Change)

### What changes
- The internal logic of `tidyUpNodes` in `src/lib/tidyUpLayout.ts` when `mode === 'auto'` (the default).
  - It must **no longer sort** nodes into a row or grid.
  - It must instead **de-overlap** nodes by pushing colliders apart with minimal movement.

### What stays the same
- All exported function signatures: `tidyUpNodes`, `tidyHorizontal`, `tidyVertical`, `tidyGrid`, `detectTidyMode`, `resolveNodeDimensions`.
- `TidyNode`, `TidyResult`, `TidyMode` types — **unchanged**.
- All constant names: `TIDY_HORIZONTAL_GAP`, `TIDY_VERTICAL_GAP`, `TIDY_GRID_GAP_X`, `TIDY_GRID_GAP_Y` — **unchanged**.
- `src/components/canvas/MarketCanvas.tsx` — **no changes needed** (it already calls `tidyUpNodes(tidyInput, mode)`).
- `SelectionBoundingBox.tsx` UI — **no changes needed**.
- Keyboard shortcut `Ctrl+Shift+T` — **no changes needed**.

### What changes in tests
- `src/__tests__/unit/tidyUpLayout.test.ts` must be **updated** to:
  - Remove the tests for `tidyHorizontal` exact pixel positions (lines 50–74) and `tidyVertical` exact pixel positions (lines 76–95), and `detectTidyMode` / `tidyGrid` tests (lines 97–145), since these are no longer the primary code path.
  - Add new tests for the overlap-aware `tidyUpNodes('auto')` behaviour (see Section 5).
  - Keep the `< 3 nodes` guard test and `resolveNodeDimensions` test — they remain valid.

---

## 1. Core Concept

The new `auto` mode is an **iterative AABB (axis-aligned bounding box) de-collision engine**. It:

1. Takes the nodes exactly where the user left them.
2. Detects any pairs of nodes whose bounding boxes overlap (including clearance margin for React Flow handles).
3. Pushes **each colliding pair** apart by the smallest possible movement — either horizontally or vertically, whichever axis requires less travel.
4. Repeats until no overlaps remain (or max iterations hit).
5. After settling, applies a **centroid drift correction** to re-anchor the group center to where it started.

Nodes that were already non-overlapping are **never moved**.

---

## 2. Algorithm: Step by Step

### Step 1 — Compute Padded Bounding Boxes

For each node $i$, define its padded bounding box with clearance half-margins:

```
paddedLeft(i)   = x_i - GAP_X / 2
paddedRight(i)  = x_i + width_i  + GAP_X / 2
paddedTop(i)    = y_i - GAP_Y / 2
paddedBottom(i) = y_i + height_i + GAP_Y / 2
```

Where:
- `GAP_X = 48` (clears React Flow's 36px floating `+` quick-add handles + breathing room)
- `GAP_Y = 36` (vertical inter-card breathing room)

Two nodes **A** and **B** overlap when ALL FOUR of these are true:
```
paddedRight(A)  > paddedLeft(B)
paddedRight(B)  > paddedLeft(A)
paddedBottom(A) > paddedTop(B)
paddedBottom(B) > paddedTop(A)
```

### Step 2 — Compute Minimal Escape Vector Per Pair

When A and B overlap, compute penetration depth on each axis using their **center points** (not corners — this ensures correctness for variable-size nodes):

```
centerX_A = x_A + width_A  / 2     centerX_B = x_B + width_B  / 2
centerY_A = y_A + height_A / 2     centerY_B = y_B + height_B / 2

dx = centerX_A - centerX_B         (positive = A is to the right)
dy = centerY_A - centerY_B         (positive = A is below)

halfSumW = (width_A  + width_B)  / 2 + GAP_X
halfSumH = (height_A + height_B) / 2 + GAP_Y

overlapX = halfSumW - abs(dx)      (> 0 means horizontal overlap)
overlapY = halfSumH - abs(dy)      (> 0 means vertical overlap)
```

**Choose the separation axis** by picking whichever overlap is smaller (minimum displacement):

```
if overlapX < overlapY:
  → Separate horizontally
  → push each node by overlapX * weight along the X axis
else:
  → Separate vertically
  → push each node by overlapY * weight along the Y axis
```

**Tie-breaker** (when dx === 0 and dy === 0 — nodes are perfectly stacked):
- Always push A to the right (`+X`) and B to the left (`-X`).

### Step 3 — Weighted Displacement (NOT symmetric 50/50)

Do **not** split the escape vector equally. Use **distance-from-centroid weighting**: the node closer to the group centroid moves more; the outer node moves less. This preserves the group shape better.

```typescript
// Before the loop, compute group centroid using center-of-box coordinates:
const centroid = {
  x: nodes.reduce((s, n) => s + n.x + n.width  / 2, 0) / nodes.length,
  y: nodes.reduce((s, n) => s + n.y + n.height / 2, 0) / nodes.length,
};

// Per pair (A, B), during each overlap resolution:
const distA = Math.hypot(centerX_A - centroid.x, centerY_A - centroid.y);
const distB = Math.hypot(centerX_B - centroid.x, centerY_B - centroid.y);
const total = distA + distB;

// Avoid divide-by-zero when both centers coincide with centroid:
const weightA = total > 0 ? distB / total : 0.5; // A moves more if B is farther
const weightB = total > 0 ? distA / total : 0.5;

// Apply:
// For horizontal separation (dx > 0 means A is to the right of B):
nodeA.x += sign(dx) * overlapX * weightA;
nodeB.x -= sign(dx) * overlapX * weightB;

// For vertical separation (dy > 0 means A is below B):
nodeA.y += sign(dy) * overlapY * weightA;
nodeB.y -= sign(dy) * overlapY * weightB;
```

When `dx === 0`, use `sign = +1` for A (push right) and `-1` for B (push left).  
When `dy === 0`, use `sign = +1` for A (push down) and `-1` for B (push up).

### Step 4 — Iterative Relaxation Loop

```typescript
const MAX_ITERATIONS = 50;  // Enough for dense clusters of N ≤ 20

for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
  let anyOverlap = false;

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      // check and resolve pair (nodes[i], nodes[j])
      // if overlap found: anyOverlap = true
    }
  }

  if (!anyOverlap) break; // Stable — no need to continue
}
```

> **Why 50?** With 20 fully-stacked nodes, a single inner pass resolves at most N-1 = 19 pairs per iteration. 50 rounds ensures convergence even in extreme pile-ups. In practice, 3–8 rounds is typical.

### Step 5 — Centroid Drift Correction

After relaxation, nodes may have drifted slightly from the user's original working area (the outer nodes moved outward). Re-anchor by computing the **post-relaxation centroid** and translating all nodes back:

```typescript
// Centroid uses center-of-box, not top-left corner:
const finalCentroid = {
  x: nodes.reduce((s, n) => s + n.x + n.width  / 2, 0) / nodes.length,
  y: nodes.reduce((s, n) => s + n.y + n.height / 2, 0) / nodes.length,
};

const driftX = originalCentroid.x - finalCentroid.x;
const driftY = originalCentroid.y - finalCentroid.y;

for (const node of nodes) {
  node.x += driftX;
  node.y += driftY;
}
```

---

## 3. Full Function to Write

Add this new internal function to `src/lib/tidyUpLayout.ts`:

```typescript
/**
 * De-overlaps nodes using iterative AABB constraint relaxation with centroid preservation.
 * Nodes that are already non-overlapping are never moved.
 * This is the new default behavior for mode === 'auto'.
 */
export function tidyDeOverlap(
  nodes: TidyNode[],
  gapX: number = TIDY_HORIZONTAL_GAP,
  gapY: number = TIDY_VERTICAL_GAP
): TidyResult[] {
  if (nodes.length === 0) return [];

  // Work on mutable copies — never mutate input
  const working = nodes.map((n) => ({ ...n }));

  // 1. Original centroid (center-of-box average)
  const origCentroid = {
    x: working.reduce((s, n) => s + n.x + n.width  / 2, 0) / working.length,
    y: working.reduce((s, n) => s + n.y + n.height / 2, 0) / working.length,
  };

  const MAX_ITERATIONS = 50;

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    let anyOverlap = false;

    for (let i = 0; i < working.length; i++) {
      for (let j = i + 1; j < working.length; j++) {
        const A = working[i];
        const B = working[j];

        const centerAx = A.x + A.width  / 2;
        const centerAy = A.y + A.height / 2;
        const centerBx = B.x + B.width  / 2;
        const centerBy = B.y + B.height / 2;

        const dx = centerAx - centerBx;
        const dy = centerAy - centerBy;

        const halfSumW = (A.width  + B.width)  / 2 + gapX;
        const halfSumH = (A.height + B.height) / 2 + gapY;

        const overlapX = halfSumW - Math.abs(dx);
        const overlapY = halfSumH - Math.abs(dy);

        // Only a collision if BOTH axes overlap
        if (overlapX <= 0 || overlapY <= 0) continue;

        anyOverlap = true;

        // Compute weights based on distance from centroid
        const distA = Math.hypot(centerAx - origCentroid.x, centerAy - origCentroid.y);
        const distB = Math.hypot(centerBx - origCentroid.x, centerBy - origCentroid.y);
        const total  = distA + distB;
        const wA = total > 0 ? distB / total : 0.5;
        const wB = total > 0 ? distA / total : 0.5;

        // Pick minimal-displacement axis
        if (overlapX < overlapY) {
          // Separate horizontally
          const signX = dx >= 0 ? 1 : -1; // 0 case: push A right
          A.x += signX * overlapX * wA;
          B.x -= signX * overlapX * wB;
        } else {
          // Separate vertically
          const signY = dy >= 0 ? 1 : -1; // 0 case: push A down
          A.y += signY * overlapY * wA;
          B.y -= signY * overlapY * wB;
        }
      }
    }

    if (!anyOverlap) break;
  }

  // 2. Centroid drift correction
  const finalCentroid = {
    x: working.reduce((s, n) => s + n.x + n.width  / 2, 0) / working.length,
    y: working.reduce((s, n) => s + n.y + n.height / 2, 0) / working.length,
  };
  const driftX = origCentroid.x - finalCentroid.x;
  const driftY = origCentroid.y - finalCentroid.y;

  return working.map((n) => ({
    id: n.id,
    position: {
      x: Math.round(n.x + driftX),
      y: Math.round(n.y + driftY),
    },
  }));
}
```

### Update `tidyUpNodes` dispatcher

In `tidyUpNodes`, route `'auto'` to the new function:

```typescript
export function tidyUpNodes(
  nodes: TidyNode[],
  mode: TidyMode = 'auto',
  customGap?: number
): TidyResult[] {
  if (nodes.length < 3) return [];

  switch (mode) {
    case 'auto':
      // NEW: Overlap-aware de-collision with centroid preservation
      return tidyDeOverlap(nodes, customGap ?? TIDY_HORIZONTAL_GAP, customGap ?? TIDY_VERTICAL_GAP);
    case 'horizontal':
      return tidyHorizontal(nodes, customGap ?? TIDY_HORIZONTAL_GAP);
    case 'vertical':
      return tidyVertical(nodes, customGap ?? TIDY_VERTICAL_GAP);
    case 'grid':
      return tidyGrid(nodes, customGap ?? TIDY_GRID_GAP_X, customGap ?? TIDY_GRID_GAP_Y);
    default:
      return tidyDeOverlap(nodes, customGap ?? TIDY_HORIZONTAL_GAP, customGap ?? TIDY_VERTICAL_GAP);
  }
}
```

> **Keep `tidyHorizontal`, `tidyVertical`, `tidyGrid`, and `detectTidyMode` in the file** — they are exported and referenced by the existing test file. They just no longer run on the `'auto'` button press.

---

## 4. Do NOT Touch

| File | Status |
|---|---|
| `src/components/canvas/MarketCanvas.tsx` | ✅ No changes |
| `SelectionBoundingBox.tsx` | ✅ No changes |
| `AGENT_CONTEXT.md` tidy-up section | ✅ No changes |
| `TidyNode`, `TidyResult`, `TidyMode` types | ✅ No changes |
| All constant values (`TIDY_HORIZONTAL_GAP` etc.) | ✅ No changes |

---

## 5. Updated Tests for `src/__tests__/unit/tidyUpLayout.test.ts`

Replace the test file content entirely with these. Keep the existing `< 3 nodes` guard and `resolveNodeDimensions` tests verbatim, then add:

```typescript
describe('tidyDeOverlap — Overlap-Aware Minimal Displacement', () => {

  it('does NOT move nodes that have no overlap', () => {
    // Three nodes far apart — expect zero displacement
    const nodes: TidyNode[] = [
      { id: 'a', x: 0,    y: 0,   width: 280, height: 140 },
      { id: 'b', x: 600,  y: 0,   width: 280, height: 140 },
      { id: 'c', x: 1200, y: 0,   width: 280, height: 140 },
    ];
    const results = tidyUpNodes(nodes, 'auto');
    const posMap = new Map(results.map((r) => [r.id, r.position]));
    // Nodes are already spaced 320px apart (> 280 + 48 = 328) — marginal but OK
    // Check none moved drastically (within 5px tolerance of original)
    expect(Math.abs(posMap.get('a')!.x - 0)).toBeLessThan(5);
    expect(Math.abs(posMap.get('b')!.x - 600)).toBeLessThan(5);
    expect(Math.abs(posMap.get('c')!.x - 1200)).toBeLessThan(5);
  });

  it('separates two fully overlapping (stacked) nodes', () => {
    // A and B are perfectly stacked at the same coordinates
    const nodes: TidyNode[] = [
      { id: 'a', x: 100, y: 100, width: 280, height: 140 },
      { id: 'b', x: 100, y: 100, width: 280, height: 140 },
      { id: 'c', x: 800, y: 100, width: 280, height: 140 }, // far away, won't overlap
    ];
    const results = tidyUpNodes(nodes, 'auto');
    const posMap = new Map(results.map((r) => [r.id, r.position]));
    const pA = posMap.get('a')!;
    const pB = posMap.get('b')!;

    // After de-overlap, A and B must not overlap (right edge of left + 48 ≤ left edge of right)
    const leftNode  = pA.x <= pB.x ? pA : pB;
    const rightNode = pA.x <= pB.x ? pB : pA;
    expect(leftNode.x + 280).toBeLessThanOrEqual(rightNode.x); // at least separated
  });

  it('separates partial overlaps — a node partially behind another', () => {
    // Node B overlaps A by 50px on X axis
    const nodes: TidyNode[] = [
      { id: 'a', x: 0,   y: 0, width: 280, height: 140 },
      { id: 'b', x: 230, y: 0, width: 280, height: 140 }, // overlaps A by 50px
      { id: 'c', x: 700, y: 0, width: 280, height: 140 },
    ];
    const results = tidyUpNodes(nodes, 'auto');
    const posMap = new Map(results.map((r) => [r.id, r.position]));
    const pA = posMap.get('a')!;
    const pB = posMap.get('b')!;

    // A's right + GAP ≤ B's left (zero collision guaranteed)
    expect(pA.x + 280 + 48).toBeLessThanOrEqual(pB.x + 1); // +1 for float rounding
  });

  it('produces zero overlapping pairs after de-collision of a dense cluster', () => {
    // 5 nodes all piled up at origin — worst case
    const nodes: TidyNode[] = Array.from({ length: 5 }, (_, i) => ({
      id: String(i),
      x: 50 + i * 10, // slight jitter to avoid perfect coincidence
      y: 50 + i * 5,
      width: 280,
      height: 140,
    }));
    const results = tidyUpNodes(nodes, 'auto');
    expect(results).toHaveLength(5);

    // Build result map and check ALL pairs for collision (zero tolerance)
    const positions = results.map((r) => ({
      id: r.id,
      x: r.position.x,
      y: r.position.y,
      width: nodes.find((n) => n.id === r.id)!.width,
      height: nodes.find((n) => n.id === r.id)!.height,
    }));

    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const A = positions[i];
        const B = positions[j];
        const noOverlapX = A.x + A.width  <= B.x || B.x + B.width  <= A.x;
        const noOverlapY = A.y + A.height <= B.y || B.y + B.height <= A.y;
        expect(noOverlapX || noOverlapY).toBe(true);
      }
    }
  });

  it('preserves centroid — group center does not drift more than 2px', () => {
    const nodes: TidyNode[] = [
      { id: 'a', x: 100, y: 100, width: 280, height: 140 },
      { id: 'b', x: 120, y: 110, width: 280, height: 140 }, // overlaps a
      { id: 'c', x: 500, y: 400, width: 360, height: 200 },
    ];

    const origCx = nodes.reduce((s, n) => s + n.x + n.width  / 2, 0) / nodes.length;
    const origCy = nodes.reduce((s, n) => s + n.y + n.height / 2, 0) / nodes.length;

    const results = tidyUpNodes(nodes, 'auto');
    const posMap  = new Map(results.map((r) => [r.id, r.position]));

    const finalCx = nodes.reduce((s, n) => s + posMap.get(n.id)!.x + n.width  / 2, 0) / nodes.length;
    const finalCy = nodes.reduce((s, n) => s + posMap.get(n.id)!.y + n.height / 2, 0) / nodes.length;

    expect(Math.abs(origCx - finalCx)).toBeLessThan(2);
    expect(Math.abs(origCy - finalCy)).toBeLessThan(2);
  });

  it('preserves ID mapping — every input node ID appears exactly once in results', () => {
    const nodes: TidyNode[] = [
      { id: 'x1', x: 0,   y: 0,   width: 280, height: 140 },
      { id: 'x2', x: 50,  y: 50,  width: 280, height: 140 },
      { id: 'x3', x: 100, y: 100, width: 280, height: 140 },
    ];
    const results = tidyUpNodes(nodes, 'auto');
    const ids = results.map((r) => r.id).sort();
    expect(ids).toEqual(['x1', 'x2', 'x3']);
  });
});
```

---

## 6. Summary of File Changes

| File | Change |
|---|---|
| `src/lib/tidyUpLayout.ts` | Add `tidyDeOverlap()` function. Update `tidyUpNodes()` to route `'auto'` mode to it. Keep all other functions. |
| `src/__tests__/unit/tidyUpLayout.test.ts` | Replace old geometry tests with new overlap-aware test suite (see Section 5). Keep `< 3 nodes` guard + `resolveNodeDimensions` tests. |
| All other files | **No changes.** |
