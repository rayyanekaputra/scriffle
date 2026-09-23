# Implementation Plan: UI Alignment, Search Popup Keyboard Theming, and Ctrl Shortcut Standardization

Address three visual polish and usability requirements across the Scriffle canvas UI:
1. Fix height discrepancies between the **Elements** and **Sticker** split-button arrow containers in the navigation toolbar.
2. Fix theme styling of `<kbd>` keyboard shortcut badges in the **Spotlight Search** popup modal (and header/search triggers) so they cleanly match Light, Mono, Dark, and Custom themes instead of remaining dark.
3. Replace all user-facing **`Command` / `Cmd` / `⌘`** shortcut labels and tooltips with **`Ctrl`** throughout all modals, toolbars, context menus, and bounding box badges.

---

## User Review Required

> [!NOTE]
> All shortcut triggers in the event listener (`MarketCanvas.tsx`) already check `isCtrlOrCmd = e.ctrlKey || e.metaKey`, so both Windows `Ctrl` and macOS `Cmd` keys will continue to work seamlessly under the hood. This change updates all user-facing labels, badges, and tooltips to consistently display `Ctrl`.

---

## Proposed Changes

### 1. Navigation Toolbar ([`NavToolbar.tsx`](file:///c:/Users/rayyanep/Coding/scriffle/src/components/controls/NavToolbar.tsx))
- Update both `insertWrapperRef` (Elements) and `stickerWrapperRef` (Sticker) container divs from `flex items-center` to `flex items-stretch h-[32px]`.
- Enforce `h-full flex items-center` on both the main action buttons and the dropdown chevron toggle buttons.
- Align icon sizing and vertical centering so that both split pills and their arrow containers have identical pixel-perfect heights and borders.

### 2. Spotlight Search Modal ([`SpotlightSearchModal.tsx`](file:///c:/Users/rayyanep/Coding/scriffle/src/components/controls/SpotlightSearchModal.tsx))
- Define a unified theme-aware `kbdClass` helper in `SpotlightSearchModal.tsx`:
  - **Light Mode**: `bg-white border border-slate-300 text-slate-700 shadow-2xs`
  - **Mono Mode**: `bg-[#ECEAE4] border border-[#D8D4CA] text-[#242321]`
  - **Dark Mode**: `bg-[#22242D] border border-[#2E3140] text-slate-200`
  - **Custom Theme**: `bg-[var(--custom-ui-surface-muted)] border border-[var(--custom-ui-border)] text-[var(--custom-ui-text)]`
- Replace hardcoded `bg-slate-200 dark:bg-slate-800` on footer keys (`↑`, `↓`, `↵`) with `kbdClass`.
- Align header `Esc` badge with the same theme-aware styling.

### 3. Replace 'Command' / 'Cmd' / '⌘' with 'Ctrl' Across UI
- **[`ShortcutsModal.tsx`](file:///c:/Users/rayyanep/Coding/scriffle/src/components/controls/ShortcutsModal.tsx)**:
  - Replace `⌘` with `Ctrl` across all categories: `Ctrl+C`, `Ctrl+V`, `Ctrl+D`, `Ctrl+Z`, `Ctrl+Shift+Z`, `Ctrl+G`, `Ctrl+Shift+G`, `Ctrl+K`.
- **[`TopNav.tsx`](file:///c:/Users/rayyanep/Coding/scriffle/src/components/controls/TopNav.tsx)**:
  - Replace `⌘K` badge with `Ctrl+K`.
  - Update search button tooltip to `Spotlight Search (Ctrl+K / Ctrl+F)`.
  - Update Undo/Redo tooltips to `Undo (Ctrl+Z)` and `Redo (Ctrl+Y / Ctrl+Shift+Z)`.
- **[`ContextMenu.tsx`](file:///c:/Users/rayyanep/Coding/scriffle/src/components/canvas/ContextMenu.tsx)**:
  - Change `Cmd+G` and `Cmd+Shift+G` group shortcut badges to `Ctrl+G` and `Ctrl+Shift+G`.
- **[`SelectionBoundingBox.tsx`](file:///c:/Users/rayyanep/Coding/scriffle/src/components/canvas/SelectionBoundingBox.tsx)**:
  - Change `Cmd+G` and `Cmd+Shift+G` button titles and badge text to `Ctrl+G` and `Ctrl+Shift+G`.

---

## Verification Plan

### Manual Verification
1. **Elements & Sticker Toolbar Height**:
   - Inspect the bottom `NavToolbar` in Light, Mono, and Dark modes.
   - Verify that the Elements button and Sticker button, along with their respective chevron arrow containers, have exact matching heights and alignment.
2. **Search Popup Modal Keyboard Badges**:
   - Open Spotlight Search (`Ctrl+K` or search button in TopNav) in **Light Mode**, **Mono Mode**, and **Dark Mode**.
   - Verify footer keys (`↑`, `↓`, `↵`) and header `Esc` badge have clean, theme-matched backgrounds and borders with crisp contrast.
3. **Ctrl Standardization**:
   - Open Shortcuts modal (`?`), inspect TopNav search button (`Ctrl+K`), right-click multi-selection context menu (`Ctrl+G`), and multi-select bounding box group pill (`Ctrl+G`).
   - Confirm all instances show `Ctrl` with no stray `Cmd` or `⌘` remaining.
