# Implementation Plan: Immediate Bug Fixes & Regressions

This document outlines the architectural fixes for the 4 immediate bugs and regressions identified in the Scriffle codebase.

---

## 1. Bug 1: [HIGH PRIORITY REGRESSION] Quick-Connect Edge Auto-Wiring Failure

### Problem & Root Cause Analysis
When a user adds a node using the Quick-Add feature (`+` handle on a source node or dragging a connector onto empty canvas), `handleCreateAndConnectNode` in [`MarketCanvas.tsx`](file:///home/abzolute/Projects/hackathon/src/components/canvas/MarketCanvas.tsx) generates a local UUID `newId` and creates an edge `{ source: sourceNodeId, target: newId, fromHandle: quickAdd.sourceHandleId }`.

However:
1. **Server-Side Node ID Discard:** [`src/app/api/canvas/nodes/route.ts`](file:///home/abzolute/Projects/hackathon/src/app/api/canvas/nodes/route.ts) ignores the client-passed `id` property in `POST` requests and lets Prisma/SQLite generate a *different* random UUID.
2. **Foreign Key Violation on Edge Creation:** When [`MarketCanvas.tsx`](file:///home/abzolute/Projects/hackathon/src/components/canvas/MarketCanvas.tsx) subsequently calls `POST /api/canvas/edges` with `to: newId`, SQLite throws a foreign key constraint violation because `newId` does not exist in the `Node` table.
3. **Optimistic State Overwritten:** When `onRefresh()` triggers SWR refetch (`GET /api/canvas`), the canvas re-syncs from SQLite, which lacks the edge, wiping the edge from the screen and leaving the new node disconnected.

### Proposed Changes
1. **Update [`src/app/api/canvas/nodes/route.ts`](file:///home/abzolute/Projects/hackathon/src/app/api/canvas/nodes/route.ts):**
   - Extract `id` from the request body: `const { canvasId, id, type, position, config } = body;`
   - Pass `id: id || undefined` into `prisma.node.create({ data: { id: id || undefined, canvasId, ... } })` so client-allocated UUIDs are honored.
2. **Harden [`src/app/api/canvas/edges/route.ts`](file:///home/abzolute/Projects/hackathon/src/app/api/canvas/edges/route.ts):**
   - Ensure `fromHandle` / `sourceHandle` resolution safely handles `null` / undefined values without failing compound unique lookups in SQLite.
3. **Harden [`src/components/canvas/MarketCanvas.tsx`](file:///home/abzolute/Projects/hackathon/src/components/canvas/MarketCanvas.tsx):**
   - Await the `POST /api/canvas/nodes` response and use the returned `createdNode.id` (or fallback to `newId`) when creating the edge, guaranteeing ID parity.

---

## 2. Bug 2: ActionNode Icon Inconsistency (Standardize on Zap / Flash)

### Problem & Root Cause Analysis
`ActionNode` cards and actions represent automation and triggers. While `ActionNode.tsx`, `NavToolbar.tsx`, `ContextMenu.tsx`, and `ActivityFeed.tsx` use the MingCute zap icon (`flash_line`), [`src/lib/quickAddNavigator.ts`](file:///home/abzolute/Projects/hackathon/src/lib/quickAddNavigator.ts) had `icon: 'play_line'`, causing the Quick-Add popover menu to display a media play button instead of a lightning/zap icon.

### Proposed Changes
1. **Update [`src/lib/quickAddNavigator.ts`](file:///home/abzolute/Projects/hackathon/src/lib/quickAddNavigator.ts):**
   - Change `icon: 'play_line'` to `icon: 'flash_line'` on the Action option in `ALL_QUICK_ADD_NODES`.
2. **Verify Consistency Across All Components:**
   - Confirm all Action references use `flash_line` in:
     - [`QuickAddPopover.tsx`](file:///home/abzolute/Projects/hackathon/src/components/canvas/QuickAddPopover.tsx)
     - [`NavToolbar.tsx`](file:///home/abzolute/Projects/hackathon/src/components/controls/NavToolbar.tsx)
     - [`ContextMenu.tsx`](file:///home/abzolute/Projects/hackathon/src/components/canvas/ContextMenu.tsx)
     - [`ActionNode.tsx`](file:///home/abzolute/Projects/hackathon/src/components/canvas/nodes/ActionNode.tsx)
     - [`ActivityFeed.tsx`](file:///home/abzolute/Projects/hackathon/src/components/feed/ActivityFeed.tsx)

---

## 3. Bug 3: Sticker Preset Dropdown Arrow Container Vertical Alignment in NavToolbar

### Problem & Root Cause Analysis
In [`src/components/controls/NavToolbar.tsx`](file:///home/abzolute/Projects/hackathon/src/components/controls/NavToolbar.tsx), the Sticker split-button is structured as:
```tsx
<div ref={stickerMenuRef} className="relative shrink-0 flex items-center">
  <button className="... rounded-l-xl border-y border-l px-3 py-1.5 ...">Sticker</button>
  <button className="... rounded-r-xl border px-1.5 py-1.5 ...">Chevron</button>
</div>
```
The chevron dropdown trigger has a full `border` (4 sides) whereas the left button has `border-y border-l`, causing double vertical borders and height calculation discrepancies in flex layouts.

### Proposed Changes
1. **Update [`src/components/controls/NavToolbar.tsx`](file:///home/abzolute/Projects/hackathon/src/components/controls/NavToolbar.tsx):**
   - Apply `items-stretch` on the split-button container.
   - Use `border-y border-r border-l-0` on the chevron button with matched padding/height so the chevron perfectly aligns on the horizontal baseline with all peer toolbar buttons.

---

## 4. Bug 4: Mono Theme Active-State Highlight & Contrast in Theme Chooser

### Problem & Root Cause Analysis
In [`src/components/controls/TopNav.tsx`](file:///home/abzolute/Projects/hackathon/src/components/controls/TopNav.tsx), the 4-mode theme switcher container has:
```tsx
<button
  onClick={() => setTheme('mono')}
  className={`... ${theme === 'mono' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
>
```
1. When **Mono** mode is active, the button renders `bg-white text-blue-600`, which violates the warm monochrome aesthetic and fails to provide a crisp active state against the `#EAE7DF` switcher container.
2. Inactive buttons in Mono mode use `text-slate-500`, resulting in low contrast against the warm paper background.
3. In [`src/components/canvas/controls/ThemeModal.tsx`](file:///home/abzolute/Projects/hackathon/src/components/canvas/controls/ThemeModal.tsx), the Mono mode card active badge uses `bg-[#1D4ED8]` (blue) instead of matching Mono's warm charcoal branding.

### Proposed Changes
1. **Update [`src/components/controls/TopNav.tsx`](file:///home/abzolute/Projects/hackathon/src/components/controls/TopNav.tsx):**
   - In Mono mode (`theme === 'mono'`), style the active button with `bg-[#FCFBF9] text-[#242321] border border-[#D8D4CA] shadow-2xs` and inactive buttons with `text-[#78756D] hover:text-[#242321]`.
2. **Update [`src/components/canvas/controls/ThemeModal.tsx`](file:///home/abzolute/Projects/hackathon/src/components/canvas/controls/ThemeModal.tsx):**
   - Update `cardActiveClass` and badge colors for Mono mode to use warm charcoal (`bg-[#242321] text-white border-[#242321]`).

---

## 5. Verification & Acceptance Criteria
- [ ] **Quick-Add Connectivity:** Spawning any node via Quick-Add (`+` handle on Watcher, Condition True, Condition False, Action, Screener) immediately persists the connected edge without requiring manual connection or disappearing on SWR refresh.
- [ ] **Icon Consistency:** ActionNode presents the MingCute Zap icon (`flash_line`) consistently across toolbar, quick-add popover, context menu, and card headers.
- [ ] **Toolbar Alignment:** Sticker split button and chevron dropdown have identical height and vertical alignment with peer toolbar buttons.
- [ ] **Theme Switcher:** Mono mode displays a clean active indicator in both TopNav and ThemeModal.
- [ ] **Existing Test Suite:** All 168 existing unit tests remain green.
