# 🛠️ IMPLEMENTATION PLAN: Canvas Lock, Cursor & Dialog Overflow Inconsistency

## 1. Executive Summary & Goal Description

This implementation plan addresses the foundational trust bugs specified in the backlog entry **`🐛 BUG: Canvas Lock, Cursor & Dialog Overflow Inconsistency`**:

1. **Canvas Lock & Creation Guard Inconsistency**:
   - **Problem**: When canvas lock is toggled, cards have inconsistent draggable states (some draggable, some not), and users can still create nodes via the bottom toolbar, right-click context menu, quick-add `+` handles, connector drops to empty space, and clipboard paste / file drag-drop.
   - **Solution**: Centralize canvas lock state (`isLocked`) in application state. When locked, **all node-creation entry points** (toolbar addition buttons, canvas right-click insertion, quick-add `+` handle buttons, drag-to-empty quick popover, and `Ctrl+V`/drop creation) are disabled with visual feedback, while **pan, zoom, and dragging existing cards remain 100% functional**.

2. **Move / Hand Tool Cursor Mapping Inverted**:
   - **Problem**: The Move tool shows a grab hand cursor on the canvas pane, while the Hand tool shows a default arrow cursor.
   - **Solution**: Swap and strictly enforce correct cursor styles:
     - **Move Tool (`select`)**: Canvas pane and marquee selection show `cursor-default`; hovering over cards shows `cursor-pointer` (or `cursor-move` on drag).
     - **Hand Tool (`hand`)**: Canvas pane and card surfaces show `cursor-grab`; actively dragging/panning shows `cursor-grabbing`.

3. **Inconsistent Card Hover Feedback & Pointer Cursors Across 10 Node Types & 3 Themes**:
   - **Problem**: Hover states are erratic—some nodes change border color only, none change background tint, and almost none provide `cursor-pointer` feedback. In Mono and Dark modes, hover cues are missing or mismatched.
   - **Solution**: Establish a unified card hover system across all 10 node types (`watcher`, `condition`, `note`, `alert`, `action`, `screener`, `text`, `sticker`, `image`, `file`) with high-fidelity border darkening, background tint shift, and `cursor-pointer` across Light, Mono (warm-paper), and Dark (soft charcoal) themes.

4. **Dialog Viewport Overflow & Unreachable Action Buttons in Modals**:
   - **Problem**: Modals (`EditNodeModal`, `ShortcutsModal`, `SpotlightSearchModal`, `ProjectSwitcherModal`) lack proper viewport height constraints and inner scroll containers. Tall forms (e.g. Watcher with multi-movers, Screener with presets, or Sticker with emoji grids) push footer action buttons ("Save Changes", "Cancel") off-screen.
   - **Solution**: Standardize all 4 modals to a rigid, responsive dialog architecture: fixed backdrop with padding, modal container constrained to `max-h-[88vh]` with `flex flex-col overflow-hidden`, pinned header (`shrink-0`), scrollable body (`flex-1 min-h-0 overflow-y-auto`), and permanently pinned footer actions (`shrink-0`).

---

## 2. Detailed Root Cause Analysis & Architecture Strategy

### 2.1 Canvas Lock Consistency & Creation Guard
- **Root Cause**: Scriffle relied on `@xyflow/react`'s built-in `<Controls />` interactive toggle, which toggled an internal `isInteractive` boolean in React Flow's private store. This internal flag was never connected to Scriffle's React state. Furthermore, React Flow's internal `isInteractive: false` conflicted with `<ReactFlow nodesDraggable={!isHandMode} />`, creating race conditions where some nodes were draggable and some were locked. Crucially, none of Scriffle's creation entry points (`NavToolbar`, `ContextMenu`, `QuickAddSourceHandle`, `MarketCanvas` paste/drop) were aware of lock state.
- **Architecture & Fix**:
  1. Add `isLocked` state to `src/app/page.tsx` (default: `false`), passing `isLocked` and `onToggleLock` to `MarketCanvas`, `NavToolbar`, and `TopNav`.
  2. In `MarketCanvas.tsx`, configure `<Controls showInteractive={false} />` and add a custom `<ControlButton onClick={toggleLock} title={isLocked ? "Unlock Canvas (Enable Card Creation)" : "Lock Canvas (Disable Card Creation)"}>` rendering `<MingIcon name={isLocked ? "lock_line" : "unlock_line"} />` with theme-aware styling.
  3. Ensure existing nodes remain draggable: `<ReactFlow nodesDraggable={!isHandMode} />` continues to govern dragging, ensuring existing cards can always be repositioned even when the board is locked against new additions.
  4. Guard all node creation entry points when `isLocked === true`:
     - **`NavToolbar.tsx`**: Add `isLocked?: boolean` prop. Disable all 10 node addition buttons with `opacity-40 cursor-not-allowed pointer-events-none` (and disabled tooltips `"Canvas is locked against new cards"`). Move (V) and Hand (H) remain enabled.
     - **`MarketCanvas.tsx` / `ContextMenu.tsx`**: In `onPaneContextMenu`, check `isLocked`. If locked, suppress the canvas context menu (or render a disabled indicator `"Canvas is locked"`), preventing node insertions via right-click. Node-specific context menus (Edit, Color, Delete, Group) remain active.
     - **`QuickAddSourceHandle.tsx` & `MarketCanvas.tsx`**: If `isLocked`, do not render the floating `+` quick-add button. In `onConnectEnd`, if `isLocked`, do not open `QuickAddPopover`.
     - **`MarketCanvas.tsx` Paste & Drop**: In `handleKeyDown` (`Ctrl+V` / `Cmd+V`) and `onDrop` file drop, return early if `isLocked`, with an optional lightweight toast notification.

---

### 2.2 Move vs. Hand Tool Cursor Mapping Correction
- **Root Cause**: `@xyflow/react/dist/style.css` sets `.react-flow__pane { cursor: grab; }` whenever panning is possible. In Scriffle, `MarketCanvas.tsx` passed `panOnDrag={isHandMode ? true : [1, 2]}`. Because `[1, 2]` is truthy, React Flow set the pane class to draggable, showing a **grab hand** while in Move/Select mode (`toolMode === 'select'`). Conversely, when switching to Hand mode (`toolMode === 'hand'`), child node components and wrapper overrides caused the cursor to fall back to the default arrow pointer.
- **Architecture & Fix**:
  1. Add deterministic, high-priority cursor utility classes in `src/app/globals.css`:
     - `[data-tool-mode="select"] .react-flow__pane { cursor: default !important; }`
     - `[data-tool-mode="select"] .react-flow__node { cursor: pointer; }`
     - `[data-tool-mode="hand"] .react-flow__pane { cursor: grab !important; }`
     - `[data-tool-mode="hand"] .react-flow__pane:active { cursor: grabbing !important; }`
     - `[data-tool-mode="hand"] .react-flow__node { cursor: grab !important; }`
     - `[data-tool-mode="hand"] .react-flow__node:active { cursor: grabbing !important; }`
  2. Set `data-tool-mode={toolMode}` on the canvas wrapper in `MarketCanvas.tsx`.
  3. Update `MarketCanvas.tsx` wrapper div to remove conflicting conditional cursor classes, allowing the scoped CSS rules to govern all canvas states cleanly.

---

### 2.3 Unified Card Hover System (Darker Border/Bg + Pointer Cursor)
- **Root Cause**: Card containers across the 10 node types were developed iteratively with ad-hoc Tailwind classes. Many lacked `cursor-pointer`, hover background transitions, or theme-aware border shifts.
- **Architecture & Token Matrix**:
  We define a consistent hover rule for cards:

  | Theme | Normal State | Hover State (`group-hover` / `:hover`) | Selected State |
  |---|---|---|---|
  | **Light** | `border-slate-300 bg-white` | `hover:border-slate-400 hover:bg-slate-50/75 cursor-pointer` | `border-[#0050FF] ring-2 ring-[#0050FF]/20` |
  | **Mono** | `border-[#D8D4CA] bg-[#FCFBF9]` | `hover:border-[#9E9A8E] hover:bg-[#F2EFE8] cursor-pointer` | `border-[#242321] ring-2 ring-[#242321]/20` |
  | **Dark** | `border-[#282A36] bg-[#181920]` | `hover:border-[#3E4254] hover:bg-[#1E202B] cursor-pointer` | `border-[#8E95A5] ring-2 ring-[#8E95A5]/20` |

  - **Special Case Nodes**:
    - **`NoteNode.tsx`**: Pastel sticky notes have custom color backgrounds. On hover, apply `hover:border-slate-800` (Light), `hover:border-[#B5B0A2]` (Mono), `hover:border-[#8E95A5]` (Dark) and subtle darkening `hover:brightness-98 cursor-pointer`.
    - **`ConditionNode.tsx`**: Rule capsule has yellow/warm theme. On hover, apply `hover:border-amber-500 hover:bg-amber-50/60` (Light), Mono/Dark standard tokens, and `cursor-pointer`.
    - **`TextNode.tsx`**: When not actively typing/editing, container displays hover border and `cursor-pointer`. When double-clicked into edit mode, cursor shifts to text editing (`cursor-text`).
    - **`StickerNode.tsx`**: Container receives hover border darkening, hover tint, and `cursor-pointer`.
    - **`ImageNode.tsx`**: Non-transparent card receives hover border darkening and `cursor-pointer`.

---

### 2.4 Modal Dialog Max-Height & Pinned Action Layout
- **Root Cause**: Modals did not use Flexbox vertical pinning with `min-h-0`. When inner content grew (e.g. 32-emoji grid, preset prompt buttons, or multi-field filters), the entire dialog stretched beyond `100vh`, pushing "Cancel" and "Save Changes" buttons out of the viewport.
- **Architecture & Fix**:
  All 4 modals will follow this strict template:

  ```tsx
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-xs">
    <div className={`flex flex-col w-full max-w-[...] max-h-[88vh] rounded-3xl border-2 overflow-hidden shadow-none transition-colors ${modalBg}`}>
      {/* Pinned Header */}
      <div className="flex items-center justify-between shrink-0 px-6 py-4 border-b">
        ...
      </div>

      {/* Scrollable Body (min-h-0 is essential to prevent flex blowout) */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4">
        ...
      </div>

      {/* Pinned Footer Actions */}
      <div className="flex items-center justify-end shrink-0 px-6 py-3 border-t gap-2">
        ...
      </div>
    </div>
  </div>
  ```

  - **Modals to Update**:
    1. **`EditNodeModal.tsx`**: Wrap with `max-h-[88vh] flex flex-col overflow-hidden`. Move form body into `flex-1 min-h-0 overflow-y-auto px-6 py-4`. Pin footer with "Cancel" and "Save Changes".
    2. **`ShortcutsModal.tsx`**: Add `max-h-[88vh]` to outer modal dialog. Make category grid container `flex-1 min-h-0 overflow-y-auto` with clean padding. Keep header and footer pinned.
    3. **`SpotlightSearchModal.tsx`**: Replace fixed `pt-24` with centered `flex items-center justify-center p-4`. Constrain modal to `max-h-[80vh] flex flex-col`. Make results list `flex-1 min-h-0 overflow-y-auto`.
    4. **`ProjectSwitcherModal.tsx`**: Add `min-h-0` to the project list container `flex-1 min-h-0 overflow-y-auto` to ensure the "1 Tab = 1 Project" subheader and SQLite backup footer remain pinned even on ultra-compact viewports.

---

## 3. Step-by-Step Implementation Roadmap

### Phase 1: State & Canvas Lock Infrastructure
- [ ] **`src/app/page.tsx`**:
  - Add `const [isLocked, setIsLocked] = useState<boolean>(false);`
  - Pass `isLocked` and `onToggleLock={() => setIsLocked(!isLocked)}` to `MarketCanvas`.
  - Pass `isLocked` to `NavToolbar`.
- [ ] **`src/components/canvas/MarketCanvas.tsx`**:
  - Update `Controls` to `showInteractive={false}`.
  - Add custom `ControlButton` with MingCute icon (`lock_line` / `unlock_line`) and theme-aware styling.
  - Guard `onPaneContextMenu`: if `isLocked`, do not open context menu.
  - Guard `handleKeyDown` paste (`Ctrl+V` / `Cmd+V`): if `isLocked`, abort paste.
  - Guard `onDrop`: if `isLocked`, abort node creation from dropped files.
  - Guard `onConnectEnd`: if `isLocked`, do not open `QuickAddPopover`.
  - Pass `isLocked` down to `SelectionBoundingBox` / `QuickAddSourceHandle` if needed.
- [ ] **`src/components/controls/NavToolbar.tsx`**:
  - Accept `isLocked?: boolean` prop.
  - Disable all 10 node addition buttons when `isLocked === true` (add disabled classes: `opacity-40 cursor-not-allowed pointer-events-none`).
  - Add visual lock tooltip notice (`"Canvas is locked"`).
  - Ensure Move (V) and Hand (H) remain interactive.
- [ ] **`src/components/canvas/QuickAddSourceHandle.tsx`**:
  - Check `isLocked` (via props or hook): if `isLocked`, hide/suppress the floating `+` handle button.

### Phase 2: Cursor Mapping Correction
- [ ] **`src/app/globals.css`**:
  - Define high-specificity cursor overrides for `[data-tool-mode="select"]` and `[data-tool-mode="hand"]` targeting `.react-flow__pane` and `.react-flow__node`.
- [ ] **`src/components/canvas/MarketCanvas.tsx`**:
  - Attach `data-tool-mode={toolMode}` to the canvas wrapper element.
  - Remove redundant/conflicting inline cursor classes on the outer div.

### Phase 3: Card Hover Feedback Standardization Across 10 Node Types
Update root container classes in:
- [ ] `src/components/canvas/nodes/WatcherNode.tsx`
- [ ] `src/components/canvas/nodes/ConditionNode.tsx`
- [ ] `src/components/canvas/nodes/NoteNode.tsx`
- [ ] `src/components/canvas/nodes/AlertNode.tsx`
- [ ] `src/components/canvas/nodes/ActionNode.tsx`
- [ ] `src/components/canvas/nodes/ScreenerNode.tsx`
- [ ] `src/components/canvas/nodes/TextNode.tsx`
- [ ] `src/components/canvas/nodes/StickerNode.tsx`
- [ ] `src/components/canvas/nodes/ImageNode.tsx`
- [ ] `src/components/canvas/nodes/FileNode.tsx`

Ensure each node has:
- `cursor-pointer` (active in Move tool mode)
- Light theme hover: `hover:border-slate-400 hover:bg-slate-50/75`
- Mono theme hover: `hover:border-[#9E9A8E] hover:bg-[#F2EFE8]`
- Dark theme hover: `hover:border-[#3E4254] hover:bg-[#1E202B]`

### Phase 4: Modal Dialog Max-Height & Pinned Action Layout
- [ ] **`src/components/controls/EditNodeModal.tsx`**:
  - Add `max-h-[88vh] flex flex-col overflow-hidden` to dialog container.
  - Wrap form inputs in `flex-1 min-h-0 overflow-y-auto px-6 py-4`.
  - Pinned footer with "Cancel" and "Save Changes".
- [ ] **`src/components/controls/ShortcutsModal.tsx`**:
  - Add `max-h-[88vh]` to dialog card.
  - Make inner category grid `flex-1 min-h-0 overflow-y-auto`.
  - Keep header and footer pinned.
- [ ] **`src/components/controls/SpotlightSearchModal.tsx`**:
  - Convert to vertically centered flex layout with `max-h-[80vh] flex flex-col`.
  - Make results list `flex-1 min-h-0 overflow-y-auto`.
  - Keep search input and keyboard hints footer pinned.
- [ ] **`src/components/controls/ProjectSwitcherModal.tsx`**:
  - Ensure list has `min-h-0` on `flex-1 overflow-y-auto`.
  - Verify subheader and backup footer remain pinned.

---

## 4. Verification & Testing Strategy

In strict adherence to the agent guidelines:
- **No tests executed during planning or documentation updates.**
- Once application code (`.ts`, `.tsx`, `.css`) is modified during implementation:
  1. Add unit test scenarios in `src/__tests__/unit/canvasInteraction.test.ts` (or relevant test suite) covering:
     - `isLocked` guard behavior preventing node addition payloads.
     - Move vs. Hand tool mode state and cursor mapping contracts.
  2. Run `bun test` to ensure all existing 143 unit tests remain 100% green.
  3. Run `bun run build` to confirm zero TypeScript compiler or Turbopack errors.
  4. Manually verify in the UI:
     - Toggling lock in `<Controls />`: creation buttons in toolbar dim and block clicks; right-click pane menu suppressed; `+` quick handle hidden; `Ctrl+V` paste blocked; existing cards remain draggable.
     - Tool mode V shows default arrow on canvas, pointer on cards.
     - Tool mode H shows grab hand on canvas and cards, grabbing fist while dragging.
     - Hovering cards across Light, Mono, and Dark themes exhibits smooth, consistent border darkening and background tinting.
     - Opening tall modals (`EditNodeModal` with multi-mover radar or 32-emoji sticker) scrolls smoothly with "Cancel" and "Save Changes" buttons pinned at all times.
