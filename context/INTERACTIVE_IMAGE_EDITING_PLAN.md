# 📋 IMPLEMENTATION PLAN: Interactive Image Editing, Replacement & Studio Enhancement

## 1. Executive Summary & Goal Description

This implementation plan covers the complete delivery of **Task #2: Interactive Image Editing & Replacement (`ImageNode.tsx` & `EditNodeModal.tsx`)** from the Scriffle Backlog ([`context/BACKLOG.md`](file:///D:/workspace-artia/1-hackathon/scriffle/context/BACKLOG.md)).

While basic image addition (drag-and-drop, clipboard paste, resizing via `<NodeResizer />`, and initial modal properties) has foundational support in the codebase, the user experience currently has critical gaps:
1. **Direct Drag-and-Drop Image Replacement**: Users currently cannot drag an image file directly onto an existing `ImageNode` card to replace its contents.
2. **Missing Dedicated Image Action Bar & Aspect-Ratio Reset**: No quick 1-click action to reset dimensions to natural aspect ratio directly from the card toolbar without opening `EditNodeModal`.
3. **Card Border vs. Transparent Styling Cohesion**: Switching between transparent cutout mode and bordered card container needs smooth styling across all 3 themes (Light, Mono warm-paper, Dark soft charcoal) and custom `.scrifflemes`.
4. **Direct Double-Click Image Replacement & URL Dialog**: Double-clicking an image should allow direct image replacement (opening file picker or URL prompt), matching Miro and FigJam whiteboard expectations.
5. **Caption Editing Experience**: Streamlined inline caption editor with auto-trimming, placeholder guidance, keyboard commit (`Enter` / `Escape`), and single-click edit trigger from the floating toolbar.
6. **Edit Modal Parity**: Ensure `EditNodeModal.tsx` provides comprehensive configuration (Image URL input with live preview, upload dropzone with hover feedback, caption, border/transparency segmented toggle, custom dimensions display, and 1-click dimension reset).

---

## 2. Architecture & Design Principles

### 2.1 Design System & Aesthetic Alignment
- **Flat Outline System**: Strict 2px borders (`border-slate-300` in Light, `border-[#D8D4CA]` in Mono, `border-[#282A36]` in Dark), zero drop shadows (`shadow-none`), zero blurred glows.
- **Font & Hierarchy**: Stack Sans Text only. Clean sentence/title case. Zero all-caps, zero spaced-out letters.
- **Iconography**: MingCute local icons only (`<MingIcon name="..." />`).
- **Color Palettes**: Electric Blue (`#0050FF`) selection rings and active states, theme-cohesive surfaces across Light, Mono (`#FCFBF9`), and Dark (`#14151B`).

### 2.2 Component State & Data Contracts

#### Updated `ImageConfig` in [`src/types/canvas.ts`](file:///D:/workspace-artia/1-hackathon/scriffle/src/types/canvas.ts)
```typescript
export interface ImageConfig {
  url: string;                  // Data URL (data:image/...) or web URL (https://...)
  caption?: string;             // Optional descriptive caption displayed beneath the image
  width?: number;               // Persistent explicit width in pixels (or undefined for natural auto)
  height?: number;              // Persistent explicit height in pixels (or undefined for natural auto)
  isTransparent?: boolean;      // True for borderless transparent cutout; false for bordered card container
  aspectRatio?: number;         // Natural width/height ratio for proportional resets
}
```

---

## 3. Detailed Scope of Implementation

### 3.1 Card-Level Enhancements (`src/components/canvas/nodes/ImageNode.tsx`)
- **Direct Dropzone on Card**:
  - Add native drag-over and drop event handlers (`onDragOver`, `onDragLeave`, `onDrop`) directly to the image card container.
  - When dragging an image file over an existing `ImageNode`, render a tactile dashed border highlight (`border-[#0050FF]` with subtle background tint) and caption indicator (`"Drop to replace image"`).
  - On file drop, immediately read as Data URL and update the node in-place via `/api/canvas/nodes/${id}` while preserving existing caption and node position.
- **Floating Quick-Action Toolbar**:
  - Docks smoothly above the card (`-top-3.5 right-2`) on card hover or selection.
  - Action buttons:
    1. **Replace / Upload (`upload_2_line`)**: Triggers native file selection dialog.
    2. **Container Mode Toggle (`square_line` / `ghost_line`)**: Instant 1-click toggle between borderless transparent sticker mode and institutional bordered card container mode.
    3. **Reset Dimensions (`aspect_ratio_line` / `fullscreen_exit_line`)**: Enabled when `config.width` or `config.height` is set; resets dimensions to natural sizing in 1 click.
    4. **Edit Caption (`text_line`)**: Opens inline caption input directly below the image.
- **Inline Caption Editor**:
  - Click on existing caption or action bar button to activate inline text input.
  - Commits on `Enter` or `blur`.
  - Reverts / cancels on `Escape`.
  - Trims unnecessary whitespace and persists to backend via `persistConfig({ caption })`.
- **Theme-Aware Container Rendering**:
  - **Transparent Mode (`isTransparent: true`)**: `bg-transparent border-0` with clean focus/selection ring.
  - **Bordered Card Mode (`isTransparent: false`)**:
    - Light: `rounded-2xl border-2 border-slate-300 bg-white p-2.5`
    - Mono: `rounded-2xl border-2 border-[#D8D4CA] bg-[#FCFBF9] p-2.5`
    - Dark: `rounded-2xl border-2 border-[#282A36] bg-[#14151B] p-2.5`
    - Custom Theme: `border-[var(--color-border)] bg-[var(--color-surface)] p-2.5`

### 3.2 Modal Configuration (`src/components/controls/EditNodeModal.tsx`)
- Verify and polish the `node.type === 'image'` section:
  1. **Image Source**:
     - Web / Data URL input field with clear placeholder.
     - Interactive drag-and-drop file upload zone with MingCute icon and supported formats hint (`PNG, JPG, SVG, WebP`).
  2. **Caption Input**:
     - Descriptive placeholder (`"e.g. Q3 Banking Sector Overview Chart"`).
  3. **Display Style Segmented Selector**:
     - 2-button grid: **Transparent Sticker** (`ghost_line`) vs **Bordered Card** (`square_line`) with active theme highlights.
  4. **Custom Dimensions Indicator & Reset**:
     - Displays `Custom dimensions: {width} × {height} px` with a 1-click `"Reset to natural size"` action.

### 3.3 Search & Canvas Navigation Indexing (`src/lib/searchIndexer.ts`)
- Ensure image nodes with captions or fallback tokens are indexed seamlessly in Spotlight Search (`Ctrl+K` / `Cmd+K`), allowing users to jump directly to specific charts, figures, or diagrams on a crowded whiteboard.

---

## 4. Step-by-Step Implementation Sequence

### Step 1: Types & Configuration Contract Verification
- Review [`src/types/canvas.ts`](file:///D:/workspace-artia/1-hackathon/scriffle/src/types/canvas.ts) to ensure `ImageConfig` includes all required optional fields (`url`, `caption`, `width`, `height`, `isTransparent`, `aspectRatio`).

### Step 2: `ImageNode.tsx` Refactoring & Feature Additions
- Add drag-over/drag-leave/drop state and handlers for direct in-place image swapping.
- Add "Reset Dimensions" button to the floating action bar.
- Refine inline caption keyboard accessibility (`Enter`, `Escape`) and visual auto-focus.
- Ensure `<NodeResizer />` preserves aspect ratio and updates node dimensions cleanly on resize end.

### Step 3: `EditNodeModal.tsx` Polish & Theme Verification
- Verify image form fields in `EditNodeModal.tsx`.
- Ensure theme-aware borders and backgrounds match Light, Mono, and Dark color tokens.
- Add feedback toast or error handling if an invalid file type is uploaded.

### Step 4: Unit Test Suite Expansion
- Expand `src/__tests__/unit/imageStudio.test.ts` and `src/__tests__/unit/imageNode.test.ts`:
  - Test initial image config creation.
  - Test in-place image URL replacement preserving captions and dimensions.
  - Test transparent vs bordered card toggle.
  - Test caption trimming and empty string clearing.
  - Test dimension reset to natural size.
  - Test Spotlight Search indexing for captioned and uncaptioned images.

### Step 5: Verification & End-to-End Validation
- Run unit test suite: `bun test src/__tests__/unit/imageStudio.test.ts` and full master test suite (`bun test`).
- Verify zero regressions and 100% test pass rate.

---

## 5. Verification Checklist

- [ ] **Direct File Drop**: Dropping an image file onto an existing `ImageNode` replaces the image immediately.
- [ ] **Floating Action Bar**: Displays Replace, Transparency toggle, Reset Dimensions (when resized), and Edit Caption buttons.
- [ ] **Inline Caption**: Double-click or toolbar click enables inline editing; `Enter` commits, `Escape` cancels.
- [ ] **Theme Cohesion**: Bordered card styling conforms to 2px flat outline across Light, Mono (`#FCFBF9`), and Dark (`#14151B`).
- [ ] **EditNodeModal**: Opens from context menu or double-click; allows URL editing, file upload, caption edit, style toggle, and dimension reset.
- [ ] **Unit Tests**: All existing 231 tests + new image studio tests pass green.

## 6. Revision R1: Live Resize Feedback & Toolbar Placement

Found during manual testing of the Section 3.1 implementation. Scope is limited to `ImageNode.tsx`. Do not touch unrelated code.

### R1.1 Live resize feedback
**Problem:** Resizing an ImageNode shows the new size only after a lag of a few seconds, so the user can't judge if the image is too small or too big while dragging.

**Requirements:**
- Apply width/height to local state on every `onResize` frame. Local state is the source of truth during the drag.
- Persist to `/api/canvas/nodes/${id}` only in `onResizeEnd` (one request, never per frame). Never await the network inside the resize path.
- Server responses must not overwrite local size mid-drag.
- Disable CSS `transition` on width/height during an active resize.
- Memoize the `<img>` subtree so it doesn't re-render or re-decode on each frame.
- Keep the aspect ratio locked using `config.aspectRatio`.
- Show a small live size readout (`320 × 240`) near the card only while resizing. Use the flat style (2px outline, no shadow, sentence case).
- Find the actual root cause of the lag first (likely candidates: per-frame persistence, awaiting the API before updating state, heavy `<img>` re-render, transition on size) and fix that rather than guessing.

### R1.2 Floating toolbar placement
**Problem:** The toolbar currently straddles the card's top border and overlaps the top resize handles, making them hard to grab.

**Requirements:**
- Position the toolbar fully above the card with an 8-12px gap, clear of the resize handles.
- Replace the `-top-3.5 right-2` placement. Use `<NodeToolbar position={Position.Top} offset={...} />` if it's already used in the project. Otherwise use `bottom-full mb-2` on the card wrapper.
- Fixed size (it must not scale or wrap with the card), with `nodrag` so it doesn't interfere with dragging or resizing.
- Must not be clipped by a parent `overflow: hidden`.

### R1.3 Checklist additions
- [x] **Live Resize**: card size updates every frame with no perceptible lag, the readout shows during the drag, and only one API request fires on resize end.
- [x] **Toolbar Placement**: toolbar sits fully above the card with a visible gap and never overlaps the top border or the resize handles.

### R1.4 Test additions
- Resize persists exactly once (on end), while dimension state updates during the resize.
- Toolbar positioning offset/class assertion, if testable at unit level.