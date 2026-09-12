# 📋 Session Changelog — 2026-09-12

> **For new agents:** Read this file first. It summarises every change made in the most recent working session so you can catch up instantly without re-reading every plan document.

---

## 1. Canvas UX & Formatting Fixes (Emoji Picker, Viewport Placement & Text Toolbar Stability)

**Key Issues Resolved:**
1. **Sticker Node Editing & Emoji Picker (`EditNodeModal.tsx` & `StickerNode.tsx`)**:
   - Double-clicking a sticker node previously showed an empty edit modal because `sticker` was unhandled.
   - Added full sticker editing support to `EditNodeModal.tsx`: 32-emoji grid picker (🚀, 📈, 📉, 🎯, ⭐, ⚠️, ✅, 💎, 🐂, 🐻, 💰, 📊, 🔥, 💡, ⏳, 🛑, 🔍, 🏆, ⚡, 📌, 🏷️, 👀, 🔔, 💼, 🏦, 🪙, etc.), custom emoji input, label field, 7-color badge palette, and live sticker preview badge.
   - Added an inline quick-picker popover in `StickerNode.tsx` when clicking the emoji icon directly on the canvas.
   - Converted the toolbar Sticker button in `NavToolbar.tsx` into a split button: single click immediately drops a sticker at viewport center, and dropdown chevron allows selecting between 8 quick presets with outside-click dismiss.
2. **Viewport-Centered Node Placement (`NavToolbar.tsx` & `src/app/page.tsx`)**:
   - Previously, clicking any tool button in `NavToolbar` dropped nodes at static coordinates `(300, 200)` at the canvas top.
   - Integrated `useReactFlow().screenToFlowPosition` in `NavToolbar.tsx` to dynamically convert window center `(window.innerWidth / 2, window.innerHeight / 2)` to canvas flow coordinates with slight natural scatter jitter (`±20px`).
   - Moved `<NavToolbar>` inside `<ReactFlowProvider>` in `src/app/page.tsx` and updated `handleAddNode` to place nodes right where the user is currently panning and zooming.
3. **Free-Text Formatting Toolbar Stability (`TextNode.tsx` & `TextFormatToolbar.tsx`)**:
   - The floating typography toolbar previously closed when clicking formatting buttons because the `<textarea>` lost focus (`blur`), setting `isEditing = false` and unmounting the toolbar before/during click.
   - Added `onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}` and `onPointerDown` preventDefault in `TextFormatToolbar.tsx` to prevent focus loss.
   - Updated `showToolbar` in `TextNode.tsx` to `(selected || isEditing) && selectedCount === 1` so the toolbar remains accessible and active whenever the text node is selected or actively being edited.
4. **Unit Testing & Search Indexing**:
   - Updated `src/lib/searchIndexer.ts` to index custom emoji, label, and color for sticker nodes.
   - Added sticker search tests in `src/__tests__/unit/searchIndexer.test.ts`. All **106 tests** pass.

---

## 2. Navigation & Productivity Suite (Spotlight Search, Shortcuts Guide & Non-Oscillating Spatial Tab Traversal)

**Feature Overview:**
Equipped Scriffle with a Figma/FigJam-inspired spatial navigation and productivity system:
- **Spotlight Quick Search (`SpotlightSearchModal.tsx`)**:
  - Activated via `Cmd+K`, `Cmd+F`, `Ctrl+K`, `Ctrl+F`, or top navbar search trigger.
  - Fuzzy multi-term search indexer ([`src/lib/searchIndexer.ts`](src/lib/searchIndexer.ts)) indexing stock tickers (`BBCA`, `TLKM`), AI screener queries, sticky note texts, condition rules, actions, and attached report files.
  - Keyboard navigation (`↑`/`↓`/`↵`) smoothly flies the camera to the target node (`setCenter`, 400ms) and selects it.
- **Non-Oscillating Spatial & Graph `Tab` Traversal ([`src/lib/spatialNavigator.ts`](src/lib/spatialNavigator.ts))**:
  - **`Tab` (Forward)**: Prioritizes outgoing connected automation edges (`[Watcher] -> [Condition] -> [Note]`); when unlinked or at the end of a chain, hops strictly forward ($\Delta x > +15\text{px}$ or downwards in a subsequent row) to the nearest spatial neighbor. Wraps around smoothly to the top-left card when reaching the end of the board.
  - **`Shift+Tab` (Backward)**: Prioritizes incoming connected edges; falls back to backward spatial candidates ($\Delta x < -15\text{px}$ or upwards in a preceding row) with start-of-canvas wrap-around.
  - Eliminates back-and-forth ping-ponging on evenly spaced cards or grids.
- **Keyboard Shortcuts Cheat Sheet Modal (`ShortcutsModal.tsx`)**:
  - Activated via `?` or `Shift+/`. Clean 4-category visual cheat sheet covering Tools, Card Actions, Grouping, and Navigation.
- **Viewport Shortcuts**:
  - `Shift+1`: Fit all nodes to screen (`fitView`).
  - `Shift+0` / `Cmd+0`: Reset zoom to 100% (`zoomTo(1.0)`).
- **Unit Testing**:
  - Added `src/__tests__/unit/searchIndexer.test.ts` (14 tests) and `src/__tests__/unit/spatialNavigator.test.ts` (8 tests). Total test count increased to **105 passing tests**.

---

## 2. AI Natural Language Company Screener (`/v2/companies/?q=...`)

**Feature Overview:**
Added a full-featured **AI Screener Node** (`ScreenerNode.tsx`) to the canvas allowing users to query Indonesian stocks in natural language (e.g., *"top 5 banks by market cap"*, *"coal mining companies with high dividend"*, *"tech companies with positive revenue growth"*).

**Key Components & Changes:**
- **API Client (`src/server/services/sectorsApi.ts`)**:
  - Implemented `fetchCompaniesScreener(options, apiKey)` communicating with `GET /v2/companies/?q={query}&include_query_values=true` or structured SQL (`where`, `order_by`, `desc`, `limit`, `offset`).
  - **`query_values` Unpacking**: Unpacks nested `item.query_values` returned by Sectors API LLM into top-level company properties (`market_cap`, `pe_ttm`, `pb_mrq`, `yield_ttm`, `revenue[2023]`, `eps[2024]`, `roe_ttm`, etc.).
  - Rich offline mock dataset for standard sectors (Banking, Tech, Mining, Consumer) with dynamic keyword fallback.
- **Canvas Node UI (`src/components/canvas/nodes/ScreenerNode.tsx`)**:
  - Interactive card featuring query prompt badge, `🪙 3 AI credits / query` cost badge, `⚡ Run` manual execution button, cycle counter, and live ranked result table.
  - **Smart Stat Capsule Formatter (`formatStatCapsule`)**: Dynamically extracts and formats the exact queried metric (e.g. `Rev'23 Rp 149.2 T`, `P/E 18.2x`, `Div 6.1%`, `Rp 1.28 Q`), eliminating any `N/A` placeholders.
- **Graph Engine (`src/server/services/graphEngine.ts`)**:
  - `executeGraphForScreener(canvasId, screenerId, apiKey)`:
    - **Connected Note Node**: Formats ranked multi-stock summary table via `generateScreenerNoteContent`.
    - **Connected Action Node**:
      - `create_watcher`: Auto-spawns complete `[Watcher] -> [Condition] -> [Note]` automation pipelines for all screened companies.
      - `fundamental_report`: Fetches fundamental reports, auto-exports HTML briefs to disk (`reports/`), and spawns attached `FileNode` documents.
      - `create_note`: Spawns individual cards with detailed financial metrics.
- **Controls & Context Menu**:
  - Added Screener options in `ContextMenu.tsx` (with `3 cr` indicator) and `NavToolbar.tsx`.
  - Added dedicated Screener configuration tab in `EditNodeModal.tsx` with preset prompt chips, 3 AI credits usage notice, and limit/interval selectors.
- **Documentation**: Added [`context/SCREENER_FIELDS.md`](file:///home/abzolute/Projects/hackathon/context/SCREENER_FIELDS.md) and updated [`context/BACKLOG.md`](file:///home/abzolute/Projects/hackathon/context/BACKLOG.md).

---

## 1. Design System Enforcement (Critical Reminder)

A key typography rule was clarified and written into Rule 3 of the Design System in `AGENT_CONTEXT.md`:

- **No all-caps / uppercase** (`text-transform: uppercase`, `uppercase` Tailwind class) anywhere — the only exception is for well-known acronyms and ticker symbols used inline (e.g. `BBCA`, `IDX`, `ROE`, `P/E`, `ESG`, `LQ45`, `PDF`, `SOE`, `ATH`, `CAGR`).
- **No spaced-out letters** (`letter-spacing`, `tracking-wider`, `tracking-widest`) anywhere.
- All headings, section titles, brand labels, and buttons must be **Sentence case** or **Title Case** only.

This was violated in the old `/api/export/report` HTML and has been corrected.

---

## 2. PDF / Fundamental Report Redesign (`src/app/api/export/report/route.ts`)

**Before:** Outer container card with a 2px border, box shadow, uppercase section headings, and `letter-spacing`.

**After:** Clean, borderless institutional document:
- Pure white background (`#FFFFFF`), no outer box or card wrapper.
- `max-width: 820px` document layout with generous padding.
- Subtle hairline section dividers (`1px solid #E5E7EB`) instead of decorative boxes.
- Selective colour use:
  - **Mint (`#059669`)** / **Coral (`#DC2626`)** — price direction badges only.
  - **Electric Blue (`#0050FF`)** — analyst consensus bar and index pills only.
  - Everything else is charcoal/slate text on white.
- **Metric glossary & quick reference** section added at the bottom (`glossary-grid` 2-column layout) with plain-English definitions of P/E, P/B, ROE, Dividend Yield, Market Cap Rank, Analyst Consensus — intended for non-finance users.
- `@media print` CSS ensures clean PDF output.
- Section titles, brand label, thesis label all changed to Sentence/Title Case.

---

## 3. Auto-Export Reports to Disk (`src/server/services/reportExporter.ts`) — New File

**Purpose:** When an `ActionNode` fires `fundamental_report`, the HTML report is now **automatically saved to disk** without requiring the user to manually click "Print / Save PDF".

**Location on disk:**
```
hackathon/
└── reports/
    └── {project_slug}/              # sanitized from canvas.name, e.g. "banking_sector_trio"
        └── {SYMBOL}_Fundamental_Brief.html
```

**Key function:** `exportReportToDisk(projectName: string, symbol: string): Promise<ExportedReportResult>`

- Sanitizes project name to a lowercase snake_case directory slug.
- Creates directory if it does not exist (`fs.mkdirSync` with `{ recursive: true }`).
- Writes a complete standalone HTML document with embedded CSS.
- Returns `{ fileName, filePath, fileUrl, fileSize, savedLocally: true }`.

**Integration point:** Called in `src/server/services/graphEngine.ts` inside the `fundamental_report` branch. The returned metadata is passed directly into the spawned `FileNode` config.

---

## 4. FileNode Download / Local Status Indicator (`src/components/canvas/nodes/FileNode.tsx`)

**Before:** FileNode showed file size and category type only. No indication of whether the file existed on disk.

**After:** When `config.savedLocally === true` or `config.isDownloaded === true`:
- Shows a compact green pill: `✓ Saved` (Mint green, theme-aware for Dark and Mono modes).
- Replaces the generic category label in that slot.
- Eliminates user confusion about whether "the file was automatically generated or just a web link."

**Type changes in `src/types/canvas.ts`:**
```typescript
export interface FileConfig {
  // ... existing fields ...
  savedLocally?: boolean;    // true = file exists on disk at filePath
  isDownloaded?: boolean;    // true = user has triggered a download at some point
  downloadedAt?: string;     // human-readable time string
}
```

---

## 5. Free-Text Node Keyboard Commit (`src/components/canvas/nodes/TextNode.tsx`)

**Before:** `Enter` would continue a new bullet line but otherwise had no special behaviour in non-bullet context. Users had to click away to commit.

**After:**
- **`Enter`** (without Shift) → immediately commits changes and exits edit mode (`blur()`).
- **`Shift+Enter`** → inserts a new line. If the current line is a bullet (`• `), it continues the list. If not a bullet, standard textarea newline applies.
- **`Escape`** → also commits and exits (unchanged from before but now explicit).

---

## 6. Top Gainers & Losers Ranking Leaderboard & Dual Workflows

**Problem:** Top Gainers/Losers Watcher was stuck perpetually on stock #4 because sequential scalar ticks were overwriting the node's state, only single prices were rendered, and official query parameters (`min_mcap_billion`, nested periods) were not handled.

**Solution:**
- **Leaderboard Card Mode (`WatcherNode.tsx`):** Renders multi-item ranking table (`#1`, `#2`, `#3`... with ticker, company name, formatted price, and Mint/Coral % badges).
- **Official Parameters (`sectorsApi.ts`):** Supports `n_stock` (1–20), `periods` (`1d`, `7d`, `14d`, `30d`, `365d`, `all`), `classifications` (`all`), and `min_mcap_billion` on `GET /v2/companies/top-changes/`. Normalizes percentage returns (`* 100`) and removes `.JK` ticker suffix.
- **Engine Execution (`graphEngine.ts` & `trigger/route.ts`):** Added `executeGraphForRadarWatcher` to persist `state.movers` without single-tick overwriting.
- **Flow 1 (Connected Note):** Direct connected sticky note automatically formats the full multi-stock ranked summary table.
- **Flow 2 (Action Node Multi-Spawn):** Connected `create_note` action node spawns separate individual notes for each ranked stock with non-overlapping spatial offsets (`x: action.x + 280, y: action.y + index * 190`).
- **Edit Modal (`EditNodeModal.tsx`):** Added Top 20 limit option and Min Market Cap filter input.

---

## 7. Correlated Symbol Fundamental Note & Dynamic Report Fallback Fix

**Problem:** When a `fundamental_report` action was triggered from a Top Gainer / Top Loser Watcher (e.g. `MPRO`), the generated research note and brief displayed `MPRO` in the header but had all company details hardcoded to `PT Bank Central Asia Tbk.` (`Financials (Banks)`, `Rp 1,245.0 T`, `P/E 22.4x`, `Margin 46.8%`).

**Root Cause:**
1. `MOCK_FUNDAMENTAL_DATA` only contained 8 blue-chip tickers and defaulted unlisted tickers to `MOCK_FUNDAMENTAL_DATA['BBCA']`.
2. Spreading `...mock` copied BBCA's company name and valuation metrics.
3. `sessionApiKey` was not forwarded into `executeGraphForRadarWatcher` / `executeGraphForEvent`, forcing mock fallback even during live sessions.

**Solution:**
- **Added Full Fundamental Profiles (`sectorsApi.ts`):** Added complete, realistic fundamental datasets for all Top Gainers and Losers (`MPRO`, `JECX`, `AGII`, `BREN`, `CUAN`, `BKSL`, `ELPI`, `EMAS`, `PSAB`, `GOTO`).
- **Dynamic Fallback Builder (`buildDynamicCompanyReport`):** Dynamic synthesis for any unknown ticker, computing matching company name (`PT {SYMBOL} Indonesia Tbk.`), market cap, and valuation without inheriting BBCA.
- **Threaded `sessionApiKey`:** Propagated `apiKey` through `executeGraphForRadarWatcher`, `executeGraphForEvent`, `exportReportToDisk`, and `/api/export/report`.

---

## 8. Auto-Spawned Watcher Complete Automation Pipeline (`create_watcher`)

**Problem:** When `create_watcher` was executed by an Action Node (e.g. tracking incoming breakout tickers from Top Gainers/Losers or sector peers), the new Market Watcher node was spawned as an isolated card on the canvas with no downstream condition or note attached. It could not execute automation on subsequent polling ticks without manual wiring.

**Solution:**
- Upgraded `create_watcher` in both `executeGraphForEvent` and `executeGraphForRadarWatcher` in [`graphEngine.ts`](src/server/services/graphEngine.ts):
  - Spawns the new `WatcherNode` (e.g. `MPRO`, `300s` interval).
  - Automatically spawns a downstream `ConditionNode` (`rule: 'price_change > 0'`) and connects `newWatcher -> Condition`.
  - Automatically spawns a downstream `NoteNode` (pastel `mint` card with template `🚀 Auto-Tracked: ${symbol}\n• Price: Rp ${price}\n• Change: ${price_change}%\n• Updated: ${timestamp}`) and connects `Condition -> Note`.
  - On every subsequent polling cycle, the newly spawned Watcher triggers its own automated pipeline seamlessly.

## 9. Collision-Free Canvas Restore & Multi-Tab Isolation (`/api/canvas/restore`)

**Problem:**
When restoring/importing `.scriffle` files on multi-project boards (e.g. `/b/[canvasId]`), preset or handcrafted node and edge IDs (e.g. `watcher-bbca`, `e1`) collided with existing node primary keys in other canvas records in SQLite, causing:
```
Unique constraint failed on the fields: (`id`)
```
Additionally, frontend restore calls in `MarketCanvas.tsx` (`onDrop`) and `page.tsx` (`handleUndo`, `handleRedo`, starter templates) did not pass `?id=${canvasId}`, risking restore ops targeting fallback canvas instances.

**Solution:**
- **Dynamic ID Collision Engine ([`src/app/api/canvas/restore/route.ts`](src/app/api/canvas/restore/route.ts))**:
  - Implemented an atomic `idMap` mapping (`originalId -> assignedId`).
  - Pre-fetches all existing node and edge IDs across other canvases in SQLite.
  - If an incoming node or edge ID already exists on another canvas or in the current batch, dynamically generates a fresh UUID.
  - Remaps all edge connections (`fromId` and `toId`) through `idMap` so signal wiring stays 100% intact.
  - Deduplicates parallel edge insertions against Prisma's `@@unique([fromId, toId])` constraint.
- **Scoped Canvas URL Query**:
  - Updated all restore fetch endpoints in `MarketCanvas.tsx` and `page.tsx` to include `?id=${canvasId}`.
- **Preset Validation**:
  - Verified with [`presets/idx_omnibus_alpha_command_center.scriffle`](presets/idx_omnibus_alpha_command_center.scriffle) (142 nodes, 75 edges) restored cleanly across multiple tabs with status 200.

---

## 10. Files Changed This Session

| File | Change Type | Summary |
|---|---|---|
| `src/app/api/canvas/restore/route.ts` | Modified | Added collision-free `idMap` allocation and edge remapping for multi-canvas imports |
| `src/app/page.tsx` | Modified | Passed `?id=${canvasId}` in undo, redo, import, and preset restore calls |
| `src/components/canvas/MarketCanvas.tsx` | Modified | Passed `?id=${canvasData.id}` on dropped `.scriffle` file imports |
| `presets/idx_omnibus_alpha_command_center.scriffle` | Added | Master 6-sector 142-node benchmark `.scriffle` project |
| `AGENT_CONTEXT.md` | Modified | Handover documentation updated with restore fix details |
| `context/SESSION_CHANGELOG.md` | Modified | Added restore fix session notes |

---

## 11. Build & Test Status

- `bun test`: **105 pass, 0 fail (115ms)**
- `bun run build`: Zero TypeScript errors.


