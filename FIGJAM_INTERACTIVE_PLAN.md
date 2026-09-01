# 📋 Implementation Plan: Scriffle (True FigJam Interactive Canvas)

## 1. Vision & Core Pivots

Transform Scriffle from a rigid graph editor into a **true freeform FigJam whiteboard experience**:
* **Freeform Canvas Interactions:**
  * **Right-Click Context Menu anywhere on canvas:** Add elements at exact cursor coordinates (Sticky Notes, Watchers, Conditions, Alerts, Actions, Free Text, Image, Stickers).
  * **Right-Click on an Element:** Contextual options (Edit, Change Color, Duplicate, Delete).
  * **Double-Click on any Element:** Instant inline edit mode (edit sticky note content, watcher symbol/interval, rule DSL, alert channel, or action type).
  * **Free Text Tool:** Place unconstrained text blocks anywhere on the canvas.
  * **Image Drop / Upload Tool:** Drag-and-drop or paste image files directly onto the board.
  * **Sticker Tool:** Pick and place transparent PNG badge stickers (e.g. Bullish, Bearish, Rocket, Target, Star, Approved).
* **UI & Aesthetics (Flat Outline Design System):**
  * **Zero Drop Shadows:** Kill all `box-shadow` / `drop-shadow`. Clean, crisp 1.5px / 2px borders and flat fills (Figma/FigJam flat outline style).
  * **MingCute Icons:** Replace all emojis/Lucide icons with **MingCute Icons** (`@mingcute/font` or `mingcute_icon` SVG components from mingcute.com).
  * **Palette & Typography:** Primary `#0050FF`, Sunny Yellow `#FFD728`, strict **Stack Sans Text** font, and strictly no all-caps or spaced text.

---

## 2. Phase-by-Phase Execution Order

```
Phase 1: MingCute Icons & Flat Outline Design System (Kill all drop shadows)
   ▼
Phase 2: Freeform Elements (Free Text, Image Node, Transparent PNG Stickers)
   ▼
Phase 3: FigJam Interactions (Right-Click Context Menus, Double-Click Inline Edit Modal)
   ▼
Phase 4: Drag & Drop File Uploads & Quick Toolbar Enhancements
   ▼
Phase 5: Verification & End-to-End Build Test
```

---

### 🎨 Phase 1: MingCute Icons & Flat Outline System
**Goal:** Strip all shadows and integrate MingCute icons for a flat, crisp whiteboard look.

1. **Install MingCute Icons:**
   * Add `mingcute_icon` / SVG components or `@mingcute/font` via `bun add`.
2. **Flat Outline Global Styles (`src/app/globals.css`):**
   * Remove all `.figma-shadow`, `shadow-xl`, `shadow-md`, `shadow-sm`, and `shadow-2xl`.
   * Enforce flat crisp borders (`border-2 border-slate-300` / `border-slate-800`) with flat pastel fills (`#FEF9C3`, `#FFFDE7`, `#E0F2FE`, `#DCFCE7`, `#FFE4E6`, `#FFFFFF`).
3. **Update 5 Custom Node Cards:**
   * Replace emojis with MingCute vector icons (`mgc_radar_line`, `mgc_filter_line`, `mgc_note_line`, `mgc_notification_line`, `mgc_flash_line`, `mgc_repeat_line`, `mgc_trending_up_line`, `mgc_trending_down_line`).
   * Apply flat outline styling with zero shadows.

---

### 🖼️ Phase 2: Freeform Elements (Free Text, Image, PNG Stickers)
**Goal:** Extend node capabilities beyond the 5 core execution cards so users can annotate freely.

1. **Master Types Extension (`src/types/canvas.ts`):**
   * Add support for annotation element types:
     * `text`: Free floating text block.
     * `image`: Uploaded / URL image card.
     * `sticker`: Transparent PNG stickers (Bull, Bear, Rocket, Warning, Star, 100).
2. **Implement Annotation Components (`src/components/canvas/nodes/`):**
   * `TextNode.tsx`: Minimal borderless/subtle border text area with auto-resize.
   * `ImageNode.tsx`: Flat framed image display with aspect-ratio preservation and resizing.
   * `StickerNode.tsx`: Transparent PNG sticker renderer.
3. **Built-in Sticker Palette:**
   * Bundle transparent SVG/PNG sticker assets for market research (Bullish, Bearish, Rocket, Target, Verified, Alert).

---

### 🖱️ Phase 3: FigJam Context Menus & Double-Click Inline Edit
**Goal:** Deliver Figma-style right-click menus and double-click inline editing.

1. **Canvas Right-Click Context Menu (`src/components/canvas/ContextMenu.tsx`):**
   * Listen to `onContextMenu` on React Flow wrapper.
   * Calculate exact viewport coordinates via `screenToFlowPosition`.
   * Menu items:
     * 📝 Add Sticky Note
     * 📡 Add Stock Watcher
     * ⚖️ Add Condition Rule
     * 🔤 Add Free Text
     * 🔔 Add Alert
     * ⚡ Add Action
     * 🎨 Add Sticker
2. **Element Right-Click Menu:**
   * Options: `Edit Properties`, `Change Color (Yellow / Mint / Pink / Blue)`, `Duplicate`, `Delete`.
3. **Double-Click Inline Edit Modal / Drawer (`src/components/controls/EditNodeModal.tsx`):**
   * Listen to `onNodeDoubleClick`.
   * Opens a crisp, lightweight flat property editor:
     * Watcher: Symbol (`BBCA`, `BBRI`, `BMRI`, `TLKM`), Metric, Interval.
     * Condition: Rule DSL editor (`price_change > 5 AND volume > 1000000`).
     * Note / Text: Rich text editor / template string.
     * Color Picker for sticky notes.

---

### 📤 Phase 4: Drag & Drop Images & FigJam Toolbar
**Goal:** Enable drag-and-dropping images directly onto the canvas and provide quick-access whiteboard tools.

1. **Drag-and-Drop Image Dropzone on Canvas:**
   * Dragging an image from desktop onto the canvas creates an `image` node at the drop position.
2. **Top FigJam Pill Toolbar Update (`src/components/controls/TopNav.tsx`):**
   * Include quick selectors for Cursor, Sticky Note, Free Text, Watcher, Condition, Stickers, and Demo Controls.

---

### 🧪 Phase 5: Verification & End-to-End Testing
1. Test right-click at any point on the canvas $\rightarrow$ Verify element inserts at cursor position.
2. Test double-click on any element $\rightarrow$ Verify edit modal opens and updates SQLite state.
3. Verify all drop shadows are eliminated in favor of clean 1.5px/2px flat outlines.
4. Verify all MingCute icons render crisply with Stack Sans Text typography.
5. Run `bun run build` and engine simulation test to ensure graph execution and self-mutation remain 100% operational.

---

## 3. Deliverables Checklist

- [ ] `src/app/globals.css`: Flat outline styling, zero drop shadows.
- [ ] MingCute icons package / components integrated.
- [ ] `src/components/canvas/ContextMenu.tsx`: Right-click canvas & element menus.
- [ ] `src/components/controls/EditNodeModal.tsx`: Double-click element configuration modal.
- [ ] `src/components/canvas/nodes/TextNode.tsx`, `ImageNode.tsx`, `StickerNode.tsx`.
- [ ] Updated 5 custom node cards with MingCute icons and flat outlines.
- [ ] `src/components/canvas/MarketCanvas.tsx` with right-click context menu, double-click handler, and drag-and-drop.
