# 📌 CHECKPOINT & CONTEXT HANDOVER: Scriffle

> **FOR NEXT AI MODEL / COPILOT IN SUBSEQUENT SESSIONS:**  
> Read this file to instantly understand what has been designed, implemented, and verified in this codebase.

---

## 🌟 1. Project Summary & Identity
**Scriffle** is an event-driven, visual workflow whiteboard for financial market research on Indonesian stocks (via Sectors API).
* **Vibe & Style:** True **FigJam / Whiteboard hybrid** (NOT an IDE or dark-mode n8n). Flat outline design system with clean 2px borders, zero drop shadows, soft dotted canvas, and colorful tactile sticky notes.
* **Typography:** Strict **`Stack Sans Text`** loaded directly from Google Fonts. Zero all-caps, zero spaced-out letters. Clean sentence/title case.
* **Icons:** **MingCute Icons** loaded locally from `public/mingcute/Mingcute.css` (e.g. `MingIcon name="..."`).
* **Runtime & Package Manager:** **Bun** (v1.4.0) exclusively.
* **Master Unit Test Suite:** **143 unit tests across 12 test suites (100% green).**

---

## 🧩 2. Core Concepts & Features Implemented

### 2.1 The Node System
* **`watcher` (Radar sticker & Leaderboard):**
  * **Single Stock Mode:** Monitors individual Indonesian stock tickers (`BBCA`, `BBRI`, `BMRI`, `TLKM`, `ASII`) with current price, % move, and cycle counter (`⚡ 12 runs`).
  * **Top Gainers / Losers Leaderboard Mode:** Full multi-mover ranking table (`#1`, `#2`, `#3`... with ticker, company name, last close price, and Mint/Coral % badges) querying `GET /v2/companies/top-changes/` with `n_stock`, `periods`, `classifications`, and `min_mcap_billion` parameters. Features theme-aware rank badges (#1 gold, #2 silver, #3 bronze, #4+ slate) for Light, Mono (warm-paper), and Dark (soft charcoal) modes.
  * **Clean Initial State & Lifecycle:** Watchers start in a clean idle state (`0 runs`, `"Waiting for tick"` / `"Waiting for live leaderboard poll..."`) without premature mock data injection.
  * **API Error Transparency & Offline Mock Indicator:** Structured error capture (`{ code, message }`) displays a `⚠ API Error {code}` badge and detailed callout banner on live API failures. Offline mode displays a crisp `Mock` badge.
  * **Credit Rate Badge & Tooltip:** Shows `🪙 10 credits / poll` (with tooltip explaining the 1 credit per classification × period formula) or `🪙 1 credit / tick` in the card footer.
  * **Upstream Input Target Handle:** Equipped with a left-side Target Handle allowing upstream Screener or Action nodes to pipe dynamic ticker payloads directly into Watchers.
  * **Dual Downstream Workflows:** Direct connected sticky notes (`NoteNode`) auto-format the full ranked summary table; connected action nodes (`create_note`) spawn separate individual sticky notes for each ranked mover with non-overlapping spatial offsets.
* **`screener` (AI Natural Language Company Screener):**
  * **Natural Language Queries:** Users query Indonesian stocks in plain English (e.g., *"top 5 banks by market cap"*, *"mining companies with high dividend"*, *"tech companies by revenue"*).
  * **Sectors API Integration:** Calls `GET /v2/companies/?q={query}&include_query_values=true` or structured SQL (`where`, `order_by`). Unpacks nested `query_values` into direct company properties.
  * **Smart Stat Capsule (`formatStatCapsule`):** Dynamically prioritizes and renders the exact requested metric (e.g. `Rev'23 Rp 149.2 T`, `P/E 18.2x`, `Div 6.1%`, `Rp 1.28 Q`).
  * **Token Credit Cost:** Clearly displays `🪙 3 AI credits / query` notice.
  * **Downstream Automations:** Connected sticky notes format ranked tables; connected action nodes auto-spawn complete watcher pipelines (`[Watcher] -> [Condition] -> [Note]`) or generate institutional fundamental reports with disk auto-export.
* **`condition` (Rule capsule):** Evaluates boolean rules safely using `expr-eval` (e.g. `price_change > 5 AND volume > 1000000`). Zero insecure `eval()`.
* **`note` (FigJam Sticky Note):** **Direct inline editable on canvas** without popups. Supports pastel color themes (`yellow`, `mint`, `pink`, `blue`, `purple`) and template interpolation (e.g. `${symbol} surged ${price_change}%`).
* **`alert` (Notification sticker):** Emits UI notifications and logs them to the activity feed.
* **`action` (Mutation capsule):** Automatically mutates the canvas by inserting new connected sticky notes, watchers, or generating institutional Fundamental Briefs (`fundamental_report` action auto-saved to disk + linked `FileNode` + research `NoteNode` with dynamic in-place `Rev 2+` incrementing on repeated runs).
  * **Credit Badges & Burst Warnings:** Badged with `🪙 8 credits / symbol` and prominent burst warnings in `EditNodeModal.tsx` for multi-stock pipelines (e.g. 5-mover fundamental report = 40 credits burst).
  * **Dynamic Peer Watcher Labeling:** Displays contextual peer symbols (e.g. `⚡ Auto-Spawn Peer Watcher (BBRI)`) or dynamic fallback (`⚡ Auto-Spawn Peer Watcher (Incoming Ticker)`) when no hardcoded ticker is set.
* **`text` (FigJam × Miro Rich Freeform Text):**
  * **Direct inline editable on canvas** with auto-growing textarea and zero awkward scrollbars.
  * **Floating Contextual Formatting Toolbar (`TextFormatToolbar`):** Docks above active card with 4-level typography scale (`H1 Title`, `H2 Header`, `Body`, `Note/Caption`), styling toggles (`Bold`, `Italic`, `Underline`, `Strikethrough`), text alignment (`Left`, `Center`, `Right`), pastel highlighter markers (`Yellow`, `Mint`, `Coral`, `Purple`), and container styles (`Plain`, `Callout Banner`, `Card Box`).
  * **Interactive Width Resizing:** Corner `<NodeResizer />` drag handles to set custom wrapping boundaries persisted to SQLite.
  * **Markdown Prefix Triggers:** `# ` auto-converts to H1 Title, `## ` auto-converts to H2 Header, `- ` / `* ` starts bulleted lists with `Enter` continuation.
  * **`T` Hotkey Placement:** Press `T` anywhere on canvas to immediately drop free-text at mouse cursor with auto-focus.
* **`sticker` (Customizable Emoji & Label Stickers):** Free-form sticker badges featuring an inline quick emoji picker popover on canvas, double-click full modal editor with 32-emoji grid, custom label text, and 7-color badge palette (`green`, `red`, `blue`, `amber`, `purple`, `teal`, `slate`). Toolbar button split action supports 1-click addition at viewport center or selecting from 8 quick presets.
* **`image` (Image Studio Node):**
  * **Upload:** Via top toolbar button, right-click context menu, or file drop.
  * **Clipboard Copy & Paste:** Press `Ctrl+V` / `Cmd+V` to paste images directly from OS clipboard onto the canvas at current cursor coordinates.
  * **Transparency:** Full support for transparent `.png` files with zero white background boxes.
  * **Interactive Resizing:** Click an image to drag corner `<NodeResizer />` handles (aspect-ratio locked & persisted to SQLite).
* **`file` (Universal File Node & PDF Brief):** Universal visual file attachments with category icons, browser preview, copy link, direct OS folder reveal (`/api/file/open-location`), and green `✓ Saved` status indicators.

---

### 2.2 Control Panel, Project Files & Whiteboard Interactions
* **Quick-Add Connected Node & Auto-Wiring (`QuickAddHandle.tsx`, `QuickAddPopover.tsx`, `quickAddNavigator.ts`):**
  * **Hover & Selection `[+]` Button:** Floating `+` button positioned 36px to the right of output handles on `WatcherNode`, `ConditionNode`, `ScreenerNode`, and `ActionNode` appears on hover/selection.
  * **Drag-to-Empty-Canvas Connector Drop:** Releasing a connector line onto empty canvas (`onConnectEnd`) opens the Quick-Add popover at cursor coordinates.
  * **Smart Recommendations & Collision Avoidance:** Recommends logical next nodes (e.g. `Watcher` $\rightarrow$ `Condition` / `Note` / `Action`) and calculates non-overlapping offsets (`+320px X`, staggering `+150px Y` if occupied).
  * **Instant 1-Click Auto-Wiring:** Spawns target node, connects edge, focuses the card, and persists both in SQLite.
* **Control Panel & Market Data Stream (`SimulationBar.tsx`):**
  * **Unified Stream Container:** Single-line layout offering **Do Once** (1-tick poll) and **Stream Data** (continuous per-node interval streaming) across Live API and Mock modes.
  * **Project File Operations:** 3-button actions for **New File** (creates fresh `/b/[uuid]` board), **Open File** (`.scriffle` / `.json`), and **Save File**.
  * **Examples:** Quick starter board loader (`Rotation Engine`, `Momentum Breakout Loop`, `Banking Sector Trio`).
* **Project Save & Open (`.scriffle` Format):**
  * **Save / Export:** 1-click **Save** button in top navbar creates and downloads `<canvas_name>.scriffle` (UTF-8 JSON formatted).
  * **Open / Import:** **Open** button with native file picker (`.scriffle`, `.json`) + Drag & Drop `.scriffle` file directly onto the canvas to restore full graph.
  * **Atomic Restore API (`/api/canvas/restore`):** Validates nodes/edges and cleanly replaces canvas with run counters reset to 0; equipped with automatic `idMap` allocation preventing cross-tab `UNIQUE constraint` collisions and preserving 100% of graph edge connections.
* **Group & Ungroup System (`Cmd+G` / `Cmd+Shift+G`):**
  * **Cohesive Selection & Dragging:** Multi-select nodes and press `Cmd+G` to group them into a single cohesive unit.
  * **Group-Aware Copy & Paste (`Cmd+C` / `Cmd+V` / `Cmd+D`):** Copies group members, their relative spatial offsets, and internal connecting edges.
  * **Double-Click Isolation Focus Mode:** Double-clicking isolates group into focus mode for sub-element editing.
* **Multi-Selection, Box Select & Figma Bounding Box Handles:**
  * `Shift + Click` or `Ctrl/Cmd + Click` to toggle select multiple elements concurrently.
  * `Shift + Drag` marquee box selection to group-select cards and connectors.
  * **Figma-Style Selection Bounding Box (`SelectionBoundingBox`):** Automatically frames multi-selected elements with 8 tactile square corner & midpoint handles, dashed boundary outline, and quick `Group` / `Ungroup` action pills.
* **Keyboard Shortcuts & Spatial Navigation:**
  * **`Tab` / `Shift + Tab` Spatial & Graph Traversal:** Smart non-oscillating keyboard navigation that follows outgoing/incoming automation connections or hops to the closest candidate node ahead with automatic canvas wrap-around and smooth camera pan (`setCenter`).
  * **`Cmd+K` / `Cmd+F` (Spotlight Quick Search):** Real-time fuzzy indexer searching stock tickers (`BBCA`, `TLKM`), AI screener prompts, note texts, rules, and files with keyboard navigation (`↑`/`↓`/`↵`) and 1-click smooth camera pan.
  * **`?` (Shortcuts Cheat Sheet):** Categorized visual reference covering Tools, Card Actions, Grouping, and Navigation.
  * **`Shift + 1`:** Fit all nodes to screen.
  * **`Shift + 0` / `Cmd + 0`:** Reset zoom to 100%.
  * **`Delete` / `Backspace`:** Deletes selected card(s) and connector(s).
  * **`Ctrl+C` / `Cmd+C` / `Ctrl+V` / `Cmd+V` / `Ctrl+D`:** Copy, paste, duplicate cards.
* **Canvas Lock & Creation Guard (`isLocked`):**
  * Centralized lock toggle in top-left canvas controls (`<ControlButton />`).
  * Disables all 10 card creation buttons in `NavToolbar`, suppresses pane context menu, hides quick-add `+` handle buttons, blocks drag-to-empty connect popover, and prevents `Ctrl+V` paste / file drops.
  * Allows pan, zoom, and existing card repositioning to remain 100% interactive.
* **Deterministic Tool Mode & Cursor Mapping:**
  * Move Mode (`select` / `V`): Default arrow pointer on canvas pane, `cursor-pointer` on cards.
  * Hand Mode (`hand` / `H`): Grab hand on canvas pane and cards, shifting to grabbing fist during active drag.
* **Responsive Modal Dialog Constraints:**
  * All modals (`EditNodeModal`, `ShortcutsModal`, `SpotlightSearchModal`, `ProjectSwitcherModal`) enforce `max-h-[88vh] flex flex-col overflow-hidden` with pinned headers, scrollable bodies (`flex-1 min-h-0 overflow-y-auto`), and permanently pinned footer action buttons.
* **Sectors API Key & Live Watcher Polling:**
  * **Session-Only Storage:** Managed in temporary React client state. Automatically wiped on tab close or refresh. Never saved to SQLite and excluded from `.scriffle` exports.
  * **1-Click Live Poll Button:** Sends the key to `POST /api/engine/trigger`, fetching real daily OHLCV and Top Movers from Sectors API v2.

---

### 2.3 Implementation Plans Saved in Context Directory (`context/`)
* [`CANVAS_LOCK_CURSOR_OVERFLOW_FIX_PLAN.md`](file:///home/abzolute/Projects/hackathon/context/CANVAS_LOCK_CURSOR_OVERFLOW_FIX_PLAN.md): Canvas lock state, card creation guard, Move/Hand cursor correction, unified hover system, and dialog viewport max-height layout.
* [`QUICK_ADD_CONNECTOR_PLAN.md`](file:///home/abzolute/Projects/hackathon/context/QUICK_ADD_CONNECTOR_PLAN.md): Quick-Add floating handle, drag-to-empty-canvas drop, and flow auto-wiring.
* [`TOP_MOVERS_API_FIX_AND_ERROR_TRANSPARENCY_PLAN.md`](file:///home/abzolute/Projects/hackathon/context/TOP_MOVERS_API_FIX_AND_ERROR_TRANSPARENCY_PLAN.md): Top Movers 400 bug fix, structured error capture, and Watcher error UI.
* [`CREDIT_COST_BADGES_PLAN.md`](file:///home/abzolute/Projects/hackathon/context/CREDIT_COST_BADGES_PLAN.md): Centralized pricing registry (`creditCosts.ts`), node badges, and burst warning notices.
* [`WATCHER_CLEAN_INITIAL_STATE_PLAN.md`](file:///home/abzolute/Projects/hackathon/context/WATCHER_CLEAN_INITIAL_STATE_PLAN.md): Watcher clean idle initial states and restore cleanliness.
* [`NAVIGATION_PLAN.md`](file:///home/abzolute/Projects/hackathon/context/NAVIGATION_PLAN.md): Spotlight search (`Cmd+K`), Shortcuts guide (`?`), Viewport zoom presets (`Shift+1`/`Shift+0`), and spatial `Tab` traversal.
* [`FREE_TEXT_EXPERIENCE_PLAN.md`](file:///home/abzolute/Projects/hackathon/context/FREE_TEXT_EXPERIENCE_PLAN.md): FigJam × Miro rich free-text whiteboard tooling, formatting toolbar, highlighter pens.
* [`GROUP_UNGROUP_IMPLEMENTATION_PLAN.md`](file:///home/abzolute/Projects/hackathon/context/GROUP_UNGROUP_IMPLEMENTATION_PLAN.md): Group & ungroup architecture and double-click isolation focus.
* [`TESTING_PLAN.md`](file:///home/abzolute/Projects/hackathon/context/TESTING_PLAN.md): Full 3-tier testing strategy and unit test suite documentation.
* [`ENDPOINTS.md`](file:///home/abzolute/Projects/hackathon/context/ENDPOINTS.md): Complete index of all 32 Indonesia v2 Sectors API endpoints.

---

## 🏗️ 3. Architecture & Tech Stack

* **Framework:** Next.js 16 (App Router, Turbopack, React 19, TypeScript) with **Bun**.
* **Canvas:** `@xyflow/react` (React Flow v12) in Light Mode with dot grid background (`#F8F9FC`) and `<NodeResizer />`.
* **Styling:** Tailwind CSS v4 with custom Flat Outline System (zero shadows).
* **Database & ORM:** SQLite (`dev.db`) with **Prisma 5.22.0**.
* **Synchronization:** SWR short-polling (`/api/canvas` & `/api/logs`) every 2 seconds.
* **External Financial Data:** Sectors.app API with automatic offline mock fallback for IDX blue chips.

---

## 📂 4. Key File Map

```txt
hackathon/
├── context/                           # All plan docs & specifications
├── prisma/
│   ├── schema.prisma                  # SQLite models (Canvas, Node, Edge, Log, MarketSnapshot)
│   └── seed.ts                        # FigJam demo canvas seed script
├── public/
│   └── mingcute/                      # Local MingCute font files & Mingcute.css
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── canvas/
│   │   │   │   ├── route.ts           # GET canvas state
│   │   │   │   ├── nodes/
│   │   │   │   │   ├── route.ts       # POST create node
│   │   │   │   │   └── [id]/route.ts  # PATCH & DELETE node
│   │   │   │   └── edges/
│   │   │   │       ├── route.ts       # POST connect edge
│   │   │   │       └── [id]/route.ts  # DELETE edge
│   │   │   ├── engine/
│   │   │   │   └── trigger/route.ts   # Trigger live Sectors poll & graph execution
│   │   │   └── logs/route.ts          # Activity logs feed
│   │   ├── globals.css                # Stack Sans Text font & flat outline zero-shadow styles
│   │   ├── layout.tsx                 # Google Font + MingCute font-face loading
│   │   └── page.tsx                   # Main Whiteboard page
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── MarketCanvas.tsx       # React Flow canvas, clipboard paste, context menus & drop events
│   │   │   ├── ContextMenu.tsx        # Right-click context menus for canvas and nodes
│   │   │   ├── SelectionBoundingBox.tsx # Figma-style 8-point bounding box handles & group pills
│   │   │   ├── QuickAddSourceHandle.tsx # Output handle wrapper with floating [+] button
│   │   │   ├── QuickAddPopover.tsx    # Contextual quick-add next node search popover
│   │   │   └── nodes/
│   │   │       ├── WatcherNode.tsx    # Watcher sticker + cycle counter + credit cost badge + error UI
│   │   │       ├── ConditionNode.tsx  # Condition rule capsule
│   │   │       ├── NoteNode.tsx       # Direct inline editable FigJam sticky note
│   │   │       ├── AlertNode.tsx      # Alert sticker
│   │   │       ├── ActionNode.tsx     # Mutation automation sticker + credit cost badge
│   │   │       ├── TextNode.tsx       # Direct inline editable free text with markdown triggers
│   │   │       ├── StickerNode.tsx    # Transparent badge stickers
│   │   │       ├── ImageNode.tsx      # Resizable transparent Image node with NodeResizer
│   │   │       ├── FileNode.tsx       # Universal attached file & PDF brief preview
│   │   │       └── text/
│   │   │           └── TextFormatToolbar.tsx # Floating formatting toolbar (typography, highlight, container)
│   │   ├── controls/
│   │   │   ├── TopNav.tsx             # Floating whiteboard toolbar & sticker/image picker
│   │   │   ├── SimulationBar.tsx      # Control Panel drawer (stream manager, project file ops, examples)
│   │   │   └── EditNodeModal.tsx      # Modal editor for structured nodes with credit notices & burst warnings
│   │   ├── feed/
│   │   │   └── ActivityFeed.tsx       # Live activity stream
│   │   └── ui/
│   │       └── MingIcon.tsx           # Reusable MingCute icon component
│   ├── context/
│   │   └── LoadingContext.tsx         # Centralized loading task queue (LoadingProvider, useLoading, runTracked)
│   ├── hooks/
│   │   └── useCanvasSync.ts           # SWR polling hook (2s interval)
│   ├── lib/
│   │   ├── creditCosts.ts             # Centralized Sectors API credit pricing registry & burst warnings
│   │   ├── mockData.ts                # Realistic market mocks
│   │   ├── prisma.ts                  # Global Prisma client singleton
│   │   ├── quickAddNavigator.ts       # Spatial placement collision resolution & smart node defaults
│   │   └── utils.ts
│   ├── server/
│   │   └── services/
│   │       ├── dslEngine.ts           # Safe expr-eval parser
│   │       ├── graphEngine.ts         # BFS graph traversal, self-mutations & cycle counting
│   │       ├── reportExporter.ts      # HTML & PDF brief generation with in-place revision tracking
│   │       └── sectorsApi.ts          # Live & mock Sectors API data fetcher
│   └── types/
│       └── canvas.ts                  # Master TypeScript contracts
```

---

## ⚡ 5. Verification & Common Commands

* **Run Dev Server:** `bun dev` (runs on `http://localhost:3000`)
* **Run Unit Tests:** `bun test` (**143 tests across 12 suites, 100% green, ~140ms**)
* **Run Production Build:** `bun run build`
* **Reset & Seed Demo Canvas:** `bun run prisma/seed.ts`
* **Run Engine Smoke Test:** `bun run src/server/test-engine.ts`
* **Push DB Schema Changes:** `bunx prisma db push`
