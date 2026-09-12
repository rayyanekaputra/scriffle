# 🛠️ CANVAS UX FIXES PLAN: Emoji Sticker Picker, Viewport Center Placement & Free-Text Toolbar Fix

## 1. Goal Description
Fix three key UX issues across the Scriffle canvas:
1. **Sticker Node Editing & Emoji Picker**: Double-clicking a sticker opened `EditNodeModal`, but showed a blank modal because `sticker` was unhandled. We add a rich Sticker editor to `EditNodeModal.tsx` (emoji grid, custom input, label, 7-color palette, preview) and an inline quick emoji picker in `StickerNode.tsx`.
2. **Viewport Center Node Placement**: Creating nodes via the bottom toolbar previously placed elements at static coordinates `(300, 200)` at the canvas top. We calculate the current viewport center dynamically using `useReactFlow().screenToFlowPosition` so new nodes drop right in front of the user regardless of where they panned or zoomed.
3. **Free-Text Styling Menu Stability**: The floating formatting toolbar previously closed upon clicking because `<textarea>` lost focus (`blur`), setting `isEditing = false` and unmounting the toolbar. We prevent focus loss with `onMouseDown` preventDefault and keep the toolbar open when selected.

---

## 2. Proposed Changes

### Component 1: Sticker Editing (`EditNodeModal.tsx` & `StickerNode.tsx`)
- **`EditNodeModal.tsx`**: Add `node.type === 'sticker'` form handling with emoji grid categories (Market, Status, Action, Symbols), custom input, label, 7-color swatch picker, and live preview.
- **`StickerNode.tsx`**: Add inline quick emoji popover when clicking the emoji icon directly on canvas.

### Component 2: Viewport-Centered Node Creation (`NavToolbar.tsx` & `src/app/page.tsx`)
- **`NavToolbar.tsx`**: Wrap with `useReactFlow()` and compute screen-to-flow center coordinates `screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 })` with slight jitter.
- **`src/app/page.tsx`**: Move `<NavToolbar>` inside `<ReactFlowProvider>` so it has access to ReactFlow instance, and update `handleAddNode` to use passed coordinates.

### Component 3: Free-Text Toolbar Persistence (`TextNode.tsx` & `TextFormatToolbar.tsx`)
- **`TextFormatToolbar.tsx`**: Add `onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}` on the toolbar container and buttons to prevent textarea blur on click.
- **`TextNode.tsx`**: Update `showToolbar` condition to `(selected && selectedCount === 1) || isEditing`.

---

## 3. Verification Plan
1. Run `bun test` to ensure all 105 tests pass.
2. Verify Sticker double-click and emoji selection in `EditNodeModal`.
3. Verify Toolbar node creation places cards at center of current pan/zoom.
4. Verify Free-Text formatting toolbar stays open and applies formatting without closing.
