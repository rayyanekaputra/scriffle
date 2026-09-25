# Scriffle Feature Backlog

This backlog tracks candidate Sectors API v2 integrations and advanced automation capabilities planned for future iterations.

---

## 🔴 Saturday Production Freeze — Launch Checklist

> **Deadline: Saturday.** These must be done before we freeze and build. QA guide is at [`context/QA_TESTING_GUIDE.md`](./QA_TESTING_GUIDE.md).

### 1. 🧹 Repo Cleanup — Remove DB from Version Control
- [x] Add `prisma/dev.db` to `.gitignore`
- [x] Add `prisma/*.db-journal` to `.gitignore`
- [x] Remove `prisma/dev.db` from git tracking: `git rm --cached prisma/dev.db`
- [x] Verify `bun run prisma/seed.ts` still works after clean clone (no committed DB dependency)
- [x] Check for any other files that shouldn't be committed (`reports/`, `node_modules/`, `.env*`)
- [x] Add `reports/` to `.gitignore` (auto-generated report exports)

### 2. 📄 Update `README.md`
- [x] Rewrite README to reflect current full feature set (Screener, Themes, Quick-Add, Discord Webhooks, Multi-Project, etc.)
- [x] Update "How it works" section — currently only lists 5 node types, we now have 10
- [x] Update "Project structure" — current structure is outdated
- [x] Update API reference table — several new endpoints missing (`/api/alert/test-webhook`, `/api/export/report`, `/api/file/open-location`, `/api/canvas/list`, `/api/canvas/restore`)
- [x] Add "Themes" section — explain Light / Mono / Dark + `.scrifflemes` custom themes
- [x] Add "Control Panel" section — explain streaming, presets, and project file operations
- [x] Add "Keyboard Shortcuts" section (or reference the in-app `?` modal)
- [x] Add "Unit Tests" section: `bun test` → 179 tests, 16 suites, ~450ms
- [x] Add hackathon credits / problem statement blurb

### 3. 🎬 Product Teaser
- [ ] Create a short teaser page / README banner image or GIF
- [ ] Core message: **"Too many platforms to switch between for research. Scriffle lets you automate data fetching and brainstorm visually — all in one canvas."**
- [ ] Show the visual canvas with nodes wired up, activity feed live, and leaderboard
- [ ] Mention key unique angles: event-driven, auto-mutating canvas, Sectors API integration, Discord alerts
- [ ] Options: animated GIF from screen recording, static hero screenshot, or a short Loom-style teaser video embed in README

### 4. 🎥 Hackathon Demo Video (3 min minimum)
- [ ] **Problem framing (30s):** "Analysts switch between 5+ platforms — Bloomberg, Excel, Telegram groups, broker apps, news sites — just to track one stock. Scriffle collapses all of that into one automated visual canvas."
- [ ] **Core demo (2 min):**
  - Start with blank canvas
  - Add a Watcher → Condition → Note chain (30s)
  - Run "Do Once" → watch notes auto-update, activity feed fires (20s)
  - Add an AI Screener → Action (create_watcher) → watch 5 pipelines auto-spawn (30s)
  - Show Top Gainers leaderboard in Radar Watcher mode (15s)
  - Fire a Discord webhook alert — show it land in Discord (15s)
  - Switch theme (Dark / Bloomberg) in one click (10s)
- [ ] **Closing (30s):** Show the `.scriffle` save/load flow, multi-project tabs, highlight Sectors API credit badges for transparency. End with problem statement callback.
- [ ] Upload to YouTube / Loom and embed link in README + hackathon submission

---

## 🚀 Active / Completed in Recent Sprint

- [x] **🎮 Discord Webhook Alert Delivery & Rich Embeds (`discordWebhook.ts`, `AlertNode.tsx`, `EditNodeModal.tsx`, `graphEngine.ts`, `/api/alert/test-webhook`, `discordWebhook.test.ts`)**
  - Implemented Discord Webhook dispatch service (`src/server/services/discordWebhook.ts`) supporting URL validation, dynamic sentiment embed colors (Mint `#10B981` for gains, Coral `#FF5B79` for drops, Electric Blue `#0050FF` for neutral), structured ticker metrics (Price, Change %, Volume, Prev Close), canvas board name, and 6s timeout protection.
  - Built dedicated `/api/alert/test-webhook` endpoint and interactive "⚡ Send Test Ping" button with live spinner and success/failure feedback banner in `EditNodeModal.tsx`.
  - Added webhook URL persistence awareness notice, inline "Save Alert Settings" button, and Discord channel badge pills in `AlertNode.tsx`.
  - Integrated into `graphEngine.ts` across single-event triggers, Top Movers radar alerts, and AI Screener outputs.
  - Added unit test suite `discordWebhook.test.ts` (179 total passing unit tests across 16 suites, 100% green).
- [x] **🔀 Condition Node Dual Outputs & False Branching (`ConditionNode.tsx`, `QuickAddSourceHandle.tsx`, `graphEngine.ts`, `edgeLabels.ts`, `LabeledEdge.tsx`, `MarketCanvas.tsx`, `conditionBranching.test.ts`)**
  - Added dual output connection handles to `ConditionNode`: upper `True` port (Emerald green `#10B981` @ `36%` Y) and lower `False` port (Rose `#FF5B79` @ `72%` Y) with dedicated Quick-Add `[+]` triggers.
  - Implemented handle-filtered BFS traversal in `graphEngine.ts`: routes market events to matching `fromHandle` edges (`'true'` vs `'false'`), with legacy fallback defaulting to `'true'`.
  - Updated Prisma schema with `fromHandle String?` and compound unique key `[fromId, toId, fromHandle]` on `Edge`.
  - Self-documenting edge label inference: `"if true"` (emerald dot + blue/emerald text) and `"if false"` (rose dot + rose/coral text).
  - Quick-add navigator automatically seeds appropriate neutral/negative templates (e.g. `${symbol} held steady at ${price}`) and labels when adding from the `False` branch.
  - Added unit test suite `conditionBranching.test.ts` (168 total passing unit tests across 15 suites, 100% green).
- [x] **🎨 Scriffle Themes & `.conf`-Style Custom Theme Engine (`themeParser.ts`, `ThemeContext.tsx`, `ThemeModal.tsx`, `MarketCanvas.tsx`, `themes/*.scrifflemes`)**
  - Designed and implemented Alacritty/Kitty-style `.scrifflemes` INI/conf parser, serializer, and CSS variables injector (`[data-theme="custom"]`).
  - Added bundled terminal presets in `themes/` and `builtinThemes.ts` (⚡ **Bloomberg Terminal**, ❄️ **Nord Frost**, 📻 **Gruvbox Dark**, 🌃 **Tokyo Night**, ☀️ **Solarized Dark**).
  - Built interactive `ThemeModal.tsx` with live color swatch previews, 1-click theme import/export, and seamless switching between standard environments (Light, Mono, Dark) and custom `.scrifflemes`.
  - Added native drag-and-drop `.scrifflemes` / `.conf` file importing directly on `MarketCanvas.tsx` with automatic persistence in `localStorage`.
  - Added unit test suite `themeEngine.test.ts` (151 total passing unit tests across 13 suites, 100% green).
- [x] **🛡️ Canvas Lock, Cursor & Dialog Overflow Inconsistency (`page.tsx`, `MarketCanvas.tsx`, `NavToolbar.tsx`, `globals.css`, modals & node components)**
  - **Canvas Lock & Creation Guard**: Centralized `isLocked` state in `page.tsx` wired to custom `<ControlButton />` toggle. When locked, all node-creation entry points (NavToolbar addition buttons, canvas context menu right-click, quick-add `+` handles, connector drop to empty canvas, and `Ctrl+V` paste / file drop) are cleanly blocked, while pan, zoom, and existing card repositioning remain 100% interactive.
  - **Move vs. Hand Tool Cursor Correction**: Enforced deterministic CSS cursor rules via `[data-tool-mode]`. Move mode (`V`) renders default arrow on canvas pane and pointer on cards; Hand mode (`H`) renders grab hand on canvas pane and cards, shifting to grabbing fist during active drag.
  - **Unified Card Hover System**: Standardized hover styling across all 10 node types (`watcher`, `condition`, `note`, `alert`, `action`, `screener`, `text`, `sticker`, `image`, `file`) with theme-aware border darkening, background tint shift, and `cursor-pointer` across Light, Mono (warm-paper), and Dark (soft charcoal) themes.
  - **Modal Dialog Viewport Max-Height & Pinned Action Layout**: Standardized `EditNodeModal`, `ShortcutsModal`, `SpotlightSearchModal`, and `ProjectSwitcherModal` with fixed backdrops, `max-h-[88vh] flex flex-col overflow-hidden` containers, pinned headers (`shrink-0`), scrollable bodies (`flex-1 min-h-0 overflow-y-auto`), and permanently pinned footer action buttons.
- [x] **⚡ Quick-Add Node Connector & Flow Auto-Wiring (`QuickAddHandle.tsx`, `QuickAddPopover.tsx`, `quickAddNavigator.ts`, `MarketCanvas.tsx`)**
  - Implemented floating `+` quick-add button on all output handles (`WatcherNode`, `ConditionNode`, `ScreenerNode`, `ActionNode`) that appears on card hover/selection.
  - Implemented drag-to-empty-canvas connector drop (`onConnectEnd` in `MarketCanvas.tsx`) to open quick-picker directly at release coordinates.
  - Built `QuickAddPopover.tsx` with fuzzy search, keyboard navigation (`↑`/`↓`/`↵`/`Esc`), MingCute icons, and contextual recommendations per source node type.
  - Built `quickAddNavigator.ts` with spatial collision avoidance (staggers `+150px Y` if slot is occupied) and smart inheritance of ticker symbols / templates.
  - Automatically spawns target node, wires edge, persists to `/api/canvas/nodes` + `/api/canvas/edges`, and selects new node.
  - Added unit test suite `quickAddNavigator.test.ts` (143 total passing unit tests across 12 suites).
- [x] **⭐ Global & Card-Level Loading Feedback for Long-Running Operations (`LoadingContext.tsx`, `TopNav.tsx`, `ScreenerNode.tsx`, `ActionNode.tsx`, `WatcherNode.tsx`, `FileNode.tsx`, `SimulationBar.tsx`, `page.tsx`)**
  - Implemented centralized task queue manager (`LoadingContext.tsx`) with `startTask`, `endTask`, `runTracked`, `isNodeLoading`, and auto-timeout safety cleanup.
  - Added global 2px electric blue hairline progress bar and dynamic center status capsule in `TopNav.tsx` displaying active operation details with MingCute spinner.
  - Added card-level visual loading feedback across `ScreenerNode` (`🤖 Screening...` badge + pulse border), `ActionNode` (`Running...` spinner + pulse border), `WatcherNode` (`⚡ Polling...` badge + pulse border), and `FileNode` (`⏳ Generating...` badge).
  - Wired async operation tracking to live/mock polling ticks, AI company screener queries, `.scriffle` project imports, and example template restorations.
  - Added unit test suite `loadingState.test.ts` (135 total passing tests, 100% green).
- [x] **⭐ Control Panel Rebranding, Unified Data Stream & Theme-Aware Rank Badges (`WatcherNode.tsx`, `SimulationBar.tsx`, `TopNav.tsx`, `page.tsx`)**
  - Theme-aware rank capsule styling (#1 gold, #2 silver, #3 bronze, #4+ neutral) in `WatcherNode.tsx` across Light, Mono (warm-paper), and Dark (soft charcoal) modes.
  - Combined Market Data Sync and Auto-Polling Stream into a unified single-line **Market Data Stream** container with **Do Once** and **Stream Data** action buttons.
  - Added **New File** action button alongside Open and Save in Project File container.
  - Rebranded Presets to **Examples** and renamed drawer from "Demo Controls" to **Control Panel**.
- [x] **⭐ Top Movers API Fix & Error Transparency (`sectorsApi.ts`, `graphEngine.ts`, `WatcherNode.tsx`, `trigger/route.ts`)**
  - Fixed `/v2/companies/top-changes/` parameter building bug (omit `classifications` param when `'all'`).
  - Implemented structured error capture (`{ code, message }`) in `getTopMarketMovers()` and logged failures to Activity Feed.
  - Added visual error UI to `WatcherNode.tsx` (`⚠ API Error {code}` badge + callout banner) and `Mock` badge for offline mode.
  - Added unit test suite `topMoversApi.test.ts` (128 total tests, 100% green).
- [x] **⭐ Node UI Credit Cost Badges & Multi-Stock Burst Warnings (`creditCosts.ts`, `ActionNode.tsx`, `WatcherNode.tsx`, `EditNodeModal.tsx`)**
  - Centralized official Sectors API v2 pricing registry in `src/lib/creditCosts.ts`.
  - Added credit cost badges to `ActionNode.tsx` (`🪙 8 credits / symbol`, `⚡ 0 credits (local)`), `WatcherNode.tsx` (`🪙 10 credits / poll`, `🪙 1 credit / tick`), and `ScreenerNode.tsx`.
  - Added warning notices in `EditNodeModal.tsx` highlighting multi-symbol burst consumption (e.g. 5-mover report = 40 credits).
  - Added unit test suite `creditCosts.test.ts` (7 tests).
- [x] **⭐ Watcher Initial State Cleanliness (`WatcherNode.tsx`, `nodes/route.ts`, `restore/route.ts`)**
  - Removed eager mock fallback arrays on new watcher creations and `.scriffle` restores.
  - Nodes start cleanly in idle status with `0 runs` and waiting indicators until first poll/tick.
  - Added unit test suite `watcherInitialState.test.ts` (5 tests).
- [x] **⭐ Mock Top Movers Leaderboard Generation & Fallback Fix (`WatcherNode.tsx`, `mockData.ts`, `graphEngine.ts`, `SimulationBar.tsx`)**
  - Added dedicated shared mock constants (`MOCK_TOP_GAINERS`, `MOCK_TOP_LOSERS`) in `@/lib/mockData.ts` and exported from `sectorsApi.ts`.
  - Implemented zero-flicker mock leaderboard fallback in `WatcherNode.tsx`: automatically displays rich mock leaderboards on creation, restore, or simulation without getting stuck on blank "Waiting..." states.
  - Upgraded `executeGraphForEvent` in `graphEngine.ts` to preserve and update `movers` arrays for radar watchers during single-event triggers instead of resetting them to empty.
  - Added instant mock spike triggers for `🚀 Top Gainer (JECX +25%)` and `🔻 Top Loser (BKSL -8.96%)` in `SimulationBar.tsx` and `DevSpikeTool.tsx`.
  - Expanded unit test suite in `leaderboard.test.ts` (111 passing tests across 7 files).
- [x] **⭐ Navigation & Productivity Suite (Spotlight Search, Shortcuts Guide & Zoom Presets)**
  - **Spotlight Quick Search (`SpotlightSearchModal.tsx`)**: Fuzzy indexer (`searchIndexer.ts`) across all tickers (`BBCA`, `TLKM`), AI prompts, note text, rules, and files with keyboard navigation (`↑`/`↓`/`↵`) and smooth camera pan & zoom (`setCenter`).
  - **Keyboard Shortcuts Guide (`ShortcutsModal.tsx`)**: Categorized visual cheat sheet for Tools (`V`, `H`, `T`), Card Actions (`Cmd+C/V/D`, `Del`), Grouping (`Cmd+G/Shift+G`, Isolation), and Navigation.
  - **Zoom Controls & Viewport Shortcuts (`ZoomControls.tsx`)**: Real-time zoom level pill, zoom in/out, preset dropdown (`50%`, `100%`, `150%`, `200%`, `Fit All`), `Shift+1` fit-to-screen, `Shift+0`/`Cmd+0` 100% reset.
  - **Unit Testing**: 14 unit tests in `searchIndexer.test.ts` (97 passing tests overall).
- [x] **⭐ AI Natural Language Company Screener (`/v2/companies/?q=...`)**
  - Added dedicated `ScreenerNode` (`ScreenerNode.tsx`) on the canvas supporting plain-English queries (e.g. *"top 5 banks by market cap"*, *"coal mining companies with high dividend"*, *"tech companies with positive revenue growth"*).
  - Integrated `fetchCompaniesScreener` into `sectorsApi.ts` supporting `q`, `include_query_values=true`, and SQL `where`/`order_by`.
  - Added rich mock universe dataset for Banks, Tech, Mining/Energy, and Consumer Goods with dynamic fallback.
  - Implemented `executeGraphForScreener` in `graphEngine.ts`: formats connected sticky note summary tables and executes downstream actions (`create_watcher` complete pipelines, `fundamental_report` generation + disk auto-export, `create_note`).
  - Added right-click context menu, bottom navigation toolbar button, and full property editor in `EditNodeModal.tsx`.
- [x] **⭐ Auto-Spawned Watcher Complete Automation Pipeline (`create_watcher` in `graphEngine.ts`)**
  - Newly auto-spawned Watchers (from Top Movers Radar or Sector Peer triggers) now automatically spawn and connect a complete downstream pipeline: `[New Watcher] -> [Condition Node (price_change > 0)] -> [Sticky Note Node]`.
  - Enables immediate automated live-tracking on subsequent polling ticks with 0 manual wiring.
- [x] **⭐ Correlated Symbol Fundamental Note & Dynamic Fallback Fix (`sectorsApi.ts` & `graphEngine.ts`)**
  - Added dedicated mock fundamental records for all Top Gainers and Losers (`MPRO`, `JECX`, `AGII`, `BREN`, `CUAN`, `BKSL`, `ELPI`, `EMAS`, `PSAB`, `GOTO`).
  - Added `buildDynamicCompanyReport` dynamic fallback generator preventing unknown tickers from inheriting `BBCA` profile.
  - Threaded `sessionApiKey` through `executeGraphForRadarWatcher`, `executeGraphForEvent`, `exportReportToDisk`, and `/api/export/report`.
- [x] **⭐ Clean Borderless PDF Report Layout (`/api/export/report`)**
  - Full redesign to a clean institutional document: white canvas, hairline dividers, selective colour highlights (Mint/Coral for price direction, Blue for ratings bar), metric glossary at the bottom, `@media print` CSS. No outer card border, no all-caps, no letter-spacing.
- [x] **⭐ Auto-Export Reports to Disk (`reportExporter.ts`)**
  - Reports are automatically saved to `reports/{project_name}/{symbol}_Fundamental_Brief.html` on disk when `ActionNode` fires `fundamental_report`. No manual print/save step required.
- [x] **⭐ FileNode Download / Saved Status Indicator (`FileNode.tsx`)**
  - `FileNode` now shows a green `✓ Saved` pill when `savedLocally: true` or `isDownloaded: true` in `FileConfig`. Eliminates confusion about whether a file exists on disk or is a web-only link.
- [x] **⭐ Free-Text `Enter` to Commit (`TextNode.tsx`)**
  - `Enter` now commits changes and exits edit mode. `Shift+Enter` creates a new line (with bullet continuation). `Escape` also commits.
- [x] **🔥 Multi-Symbol PDF Export & Dynamic Peer Watcher Automation (`ActionNode.tsx` & `graphEngine.ts`)**
  - Updated `fundamental_report` in `executeGraphForRadarWatcher` to generate reports & FileNodes for **all outputted symbols** on the leaderboard.
  - Implemented dynamic peer watcher spawning in `create_watcher` defaulting to incoming top mover tickers with 300s polling interval without manual ticker entry.
  - Updated configuration controls in `EditNodeModal.tsx`.
- [x] **🔥 Top Gainers & Losers Ranking Leaderboard & Query Parameters Upgrade (`/v2/companies/top-changes/`)**
  - Leaderboard card rendering in `WatcherNode.tsx` displaying multi-stock rankings (`#1`, `#2`, `#3`... with ticker, company name, formatted price, and `% move` badges).
  - Supported official Sectors API query parameters (`n_stock`, `periods`, `classifications`, `min_mcap_billion`) in `sectorsApi.ts`.
  - Upgraded graph engine with `executeGraphForRadarWatcher` to persist `state.movers` without single-tick overwrites.
  - Implemented Flow 1: Connected sticky notes format full multi-line ranked leaderboard tables.
  - Implemented Flow 2: Connected action nodes (`create_note`) spawn individual sticky notes for each ranked mover with non-overlapping spatial offsets.
  - Expanded `EditNodeModal.tsx` with limit (Top 1–20), periods (`1d`, `7d`, `14d`, `30d`, `365d`, `all`), and minimum market cap (Billion IDR) filter.
- [x] **⚡ Top Market Movers & Gainers Radar (`/v2/companies/top-changes/`)**
  - Integrated into `WatcherNode.tsx`, `EditNodeModal.tsx`, `ContextMenu.tsx`, and `/api/engine/trigger`.
  - Supports `Top Gainers` & `Top Losers` modes with custom % move threshold filtering and automated downstream graph execution.
- [x] **📑 Universal File Node & Document Output (`FileNode.tsx`)**
  - Universal visual file attachments with category icons, browser preview, copy link, and direct OS folder reveal (`/api/file/open-location`).
- [x] **📊 Automated Fundamental Report Action (`/v2/company/report/{symbol}/`)**
  - `ActionNode.tsx` triggers live fundamental report generation and automatically spawns an attached `FileNode` on the canvas.
- [x] **⏱️ Independent Per-Watcher Polling Engine**
  - Configurable polling cadences (1s–3600s) per watcher with automatic timer scheduling.
- [x] **✍️ FigJam × Miro Rich Free-Text Whiteboard Tooling**
  - Interactive floating formatting toolbar (`TextFormatToolbar`), 4-tier font scale (`Title`, `Header`, `Body`, `Caption`), bold/italic/underline/strike, text alignment, pastel highlighter pens (`Yellow`, `Mint`, `Coral`, `Purple`), container modes (`Plain`, `Callout Banner`, `Card`), 1:1 true WYSIWYG parity, auto-growing textarea, interactive `<NodeResizer />`, markdown prefix triggers (`# `, `## `, `- `), and `T` hotkey canvas placement.
- [x] **📦 FigJam & Miro-Style Group / Ungroup & Deep Isolation Mode**
  - Grouping selected elements with `Cmd+G`, ungrouping with `Cmd+Shift+G`, cohesive group drag/selection, group-aware copy & paste (`Cmd+C` / `Cmd+V`) preserving internal connectors and spatial layout, and double-click isolation focus mode for sub-element editing and `Shift+Click` intra-group selections.
- [x] **📐 Figma-Style Multi-Selection Bounding Box & Transform Handles**
  - Interactive 8-point corner and edge midpoint handles overlay around all selected elements with live object counter and quick `Group` / `Ungroup` action buttons.

---

- [x] **⭐ Mock Poll Randomizer & Clean Demo Controls (`sectorsApi.ts`, `SimulationBar.tsx`, `page.tsx`)**
  - Implemented `generateMockMarketEvent(symbol)` in `sectorsApi.ts` using realistic probability distributions (20% mild drop, 20% slight down, 20% drift, 20% slight up, 20% surge), dynamic price calculations from prevPrice, and 60%–250% volume multipliers.
  - Implemented `generateMockTopMovers(n)` with dynamic pool sampling and randomized percentage moves for Top Gainers & Losers radar watchers.
  - Fully cleaned up manual preset spikes, `DevSpikeTool.tsx`, and `/api/engine/simulate` route in favor of clean live and randomized mock polling streams.
  - Maintained 100% green test suite across all 111 unit tests.

---

## 📌 Open Candidate Endpoints & Features

### 🐛 BUG: Sticker Toolbar Preset Dropdown Clipped by Container Overflow (`NavToolbar.tsx`)
- **Status**: ✅ Completed
- **Resolution**: Replaced `overflow-x-auto` with `overflow-visible` on the main toolbar wrapper in [`NavToolbar.tsx`](file:///home/eiksirf/Projects/scriffle/src/components/controls/NavToolbar.tsx) and elevated the dropdown `z-50` position above whiteboard chrome.

---

### 🛡️ BUG: Canvas Lock, Cursor & Dialog Overflow Inconsistency
- **Status**: ✅ Completed
- **Resolution**:
  1. **Canvas Lock & Creation Guard**: Centralized `isLocked` state in `src/app/page.tsx` wired to custom `<ControlButton />` toggle. When locked, all node-creation entry points (NavToolbar addition buttons, canvas context menu right-click, quick-add `+` handles, connector drop to empty canvas, and `Ctrl+V` paste / file drop) are cleanly blocked, while pan, zoom, and existing card repositioning remain 100% interactive.
  2. **Move vs. Hand Tool Cursor Correction**: Enforced deterministic CSS cursor rules in `src/app/globals.css` via `[data-tool-mode]`. Move mode (`V`) renders default arrow on canvas pane and pointer on cards; Hand mode (`H`) renders grab hand on canvas pane and cards, shifting to grabbing fist during active drag.
  3. **Unified Card Hover System**: Standardized hover styling across all 10 node types (`watcher`, `condition`, `note`, `alert`, `action`, `screener`, `text`, `sticker`, `image`, `file`) with theme-aware border darkening, background tint shift, and `cursor-pointer` across Light, Mono (warm-paper), and Dark (soft charcoal) themes.
  4. **Modal Dialog Viewport Max-Height & Pinned Action Layout**: Standardized `EditNodeModal`, `ShortcutsModal`, `SpotlightSearchModal`, and `ProjectSwitcherModal` with fixed backdrops, `max-h-[88vh] flex flex-col overflow-hidden` containers, pinned headers (`shrink-0`), scrollable bodies (`flex-1 min-h-0 overflow-y-auto`), and permanently pinned footer action buttons.
- **Reference**: [`CANVAS_LOCK_CURSOR_OVERFLOW_FIX_PLAN.md`](file:///home/eiksirf/Projects/scriffle/context/CANVAS_LOCK_CURSOR_OVERFLOW_FIX_PLAN.md)

---

### 🔥 BUG: `/v2/companies/top-changes/` Always Returns 400 & Silent Fallback
- **Status**: ✅ Completed
- **Resolution**:
  1. **Fixed Parameter Builder ([`sectorsApi.ts`](file:///home/abzolute/Projects/hackathon/src/server/services/sectorsApi.ts))**: Omitted `classifications` param when value is `'all'` or undefined.
  2. **Eliminated Deceptive Silent Mock Fallback ([`sectorsApi.ts`](file:///home/abzolute/Projects/hackathon/src/server/services/sectorsApi.ts) & [`trigger/route.ts`](file:///home/abzolute/Projects/hackathon/src/app/api/engine/trigger/route.ts))**: `getTopMarketMovers()` captures structured error metadata `{ code, message }` on failure and logs `api_error` events to the Activity Feed.
  3. **Node UI Error & Mock Indicators ([`WatcherNode.tsx`](file:///home/abzolute/Projects/hackathon/src/components/canvas/nodes/WatcherNode.tsx))**:
     - Displays `⚠ API Error {code}` status badge and detailed error banner on the card when in Live Mode.
     - Displays `Mock` badge when operating offline without an API key.
  4. **Unit Test Coverage ([`src/__tests__/unit/topMoversApi.test.ts`](file:///home/abzolute/Projects/hackathon/src/__tests__/unit/topMoversApi.test.ts))**: 3 test scenarios (128 total unit tests, 100% green).

---

### 🐛 BUG: Radar Watcher Leaderboard Brief Overwritten by Single-Stock Polls
- **Status**: ✅ Completed
- **Priority**: High — prevents 5-item Top Gainers / Losers Leaderboards and research briefs from collapsing into 1-stock notes on subsequent poll cycles
- **Root Cause**: `executeGraphForEvent()` falsely matched radar watchers (`mode === 'top_gainers' || mode === 'top_losers'`) when single tickers rolled positive/negative, executing single-item BFS down radar watcher edges and overwriting the 5-item leaderboard.
- **Fix**: Excluded radar watchers from `executeGraphForEvent()`; radar watchers are strictly processed via `executeGraphForRadarWatcher()`. See [`RADAR_LEADERBOARD_POLLUTION_FIX_PLAN.md`](file:///home/abzolute/Projects/hackathon/context/RADAR_LEADERBOARD_POLLUTION_FIX_PLAN.md).

---

### ⏳ ENHANCEMENT: Watcher Initial State Starts Clean & Empty (Waiting for Poll / Trigger)
- **Status**: ✅ Completed
- **Priority**: Medium — visual clarity and expected lifecycle progression
- **Description**: Watcher nodes (both single tickers like `BBCA` and Top Gainers / Losers Radar watchers) start in a clean initial state:
  - **Radar Watchers (`Top Gainers` / `Top Losers`)**: Cleanly renders `"Waiting for live leaderboard poll..."` with `0 runs` and `Idle` timestamp until the first poll cycle or trigger executes.
  - **Single Tickers (`BBCA`, `GOTO`, etc.)**: Renders `"Waiting for tick"` for Last Price without premature price change badge and with `0 runs` until the first market event fires.
- **Files Updated**:
  1. [`src/components/canvas/nodes/WatcherNode.tsx`](file:///home/abzolute/Projects/hackathon/src/components/canvas/nodes/WatcherNode.tsx): Removed eager fallback assignment of `MOCK_TOP_GAINERS`/`MOCK_TOP_LOSERS` when `state.movers` is empty.
  2. [`src/app/api/canvas/nodes/route.ts`](file:///home/abzolute/Projects/hackathon/src/app/api/canvas/nodes/route.ts): Starts newly created nodes with clean initial state `{ status: 'idle', cycleCount: 0 }`.
  3. [`src/app/api/canvas/restore/route.ts`](file:///home/abzolute/Projects/hackathon/src/app/api/canvas/restore/route.ts): Does not inject mock fallback arrays into unpopulated nodes during `.scriffle` restore.
  4. [`src/__tests__/unit/watcherInitialState.test.ts`](file:///home/abzolute/Projects/hackathon/src/__tests__/unit/watcherInitialState.test.ts): Unit test coverage (118 passing tests across 8 test suites).

---

### 💳 ENHANCEMENT: Node UI Token & API Credit Cost Badges / Warning Notice
- **Status**: ✅ Completed
- **Priority**: High — prevents unexpected API credit exhaustion (e.g. multi-ticker fundamental reports consuming 8 credits per symbol = ~40–380 credits per execution burst)
- **Implemented Capabilities**:
  1. **Centralized Pricing Registry (`src/lib/creditCosts.ts`)**: Encapsulates official Sectors API v2 pricing (1 credit per classification × period combination for Top Changes — default 2 classifications × 5 periods = 10 credits/poll, 8 credits/symbol for Company Reports, 3 credits/query for Screener, 1 credit/tick for Daily symbol watcher).
  2. **Node UI Credit Cost Badges**:
     - [`ActionNode.tsx`](file:///home/abzolute/Projects/hackathon/src/components/canvas/nodes/ActionNode.tsx): `🪙 8 credits / symbol` with endpoint tag for Fundamental Reports; `⚡ 0 credits (local)` for canvas mutations.
     - [`WatcherNode.tsx`](file:///home/abzolute/Projects/hackathon/src/components/canvas/nodes/WatcherNode.tsx): `🪙 10 credits / poll` for Top Movers Radar; `🪙 1 credit / tick` for Single Ticker Watchers in footer.
     - [`ScreenerNode.tsx`](file:///home/abzolute/Projects/hackathon/src/components/canvas/nodes/ScreenerNode.tsx): `🪙 3 AI credits / query`.
  3. **Edit Modal Credit Notices & Burst Warnings (`EditNodeModal.tsx`)**:
     - Added credit consumption breakdown in Watcher config.
     - Added prominent warning box in Action fundamental report config warning that 5-mover triggers consume **40 credits per execution burst**.
  4. **Unit Testing (`src/__tests__/unit/creditCosts.test.ts`)**: 7 test scenarios verifying credit calculations and burst warnings (125 tests total, 100% green).

---

### 1. 📄 Redesign PDF & Export Brief Layout (Scriffle Design System)
- **Status**: ✅ Completed (Clean institutional layout, metric glossary, `@media print`, auto-export to disk)

---

### 2. 🤖 AI Natural Language Screener (`/v2/companies/?q=...`)
- **Status**: ✅ Completed (`ScreenerNode.tsx`, `fetchCompaniesScreener`, `executeGraphForScreener`, `EditNodeModal.tsx`)
- **API**: `GET /v2/companies/?q={natural_language_query}&include_query_values=true`
- **Description**: Natural language company screener allowing users to type freeform queries (e.g. *"top 5 banks by market cap"*, *"mining companies with PE < 10 and dividend yield > 5%"*).
- **Canvas Integration**: Dynamic Screener Node that resolves and streams multi-ticker event payloads to downstream Notes, Actions, and Condition pipelines.

---

### 3. 🌊 Foreign Flow & Smart Money Tracker (`/v2/foreign-flow/{symbol}/`)
- **API**: `GET /v2/foreign-flow/{symbol}/`
- **Description**: Daily net foreign-broker inflow/outflow (in IDR) and volume for tracked IDX stocks.
- **Canvas Integration**: Bandarmology & Foreign Flow Node for institutional accumulation/distribution rules (e.g., `foreign_flow > 50B IDR AND price_change > 2%`).

---

### 4. 🕵️‍♂️ Insider Filings & Governance Radar (`/v2/filings/`)
- **API**: `GET /v2/filings/`
- **Description**: Real-time regulatory disclosures on insider stock transactions by directors, commissioners, and major shareholders (>5%).
- **Canvas Integration**: Insider Trading Alert Node that generates instant event triggers when high-conviction insider buys or sales occur.

---

### 5. 🏢 Broker Accumulation / Distribution Tracker (`/v2/broker-summary/{symbol}/top/`)
- **API**: `GET /v2/broker-summary/{symbol}/top/`
- **Description**: Identifies the top buyer and seller brokerages for any stock to detect retail vs institutional positioning.
- **Canvas Integration**: Broker Radar Node that evaluates accumulation ratios and triggers warnings when smart money begins exiting.

---

### 🌟 Top Recommendations for Immediate Hackathon Polish

1. ~~**🎨 In-Place Customizable Emoji & Label Stickers (`StickerNode.tsx`)**~~ ✅ **Complete**
   - Replaced rigid `stickerType` enum with free-form `{ emoji, label, color }` schema in `StickerConfig`.
   - `StickerNode.tsx` fully rewritten: double-click emoji to change it, double-click label to rename it, color palette appears on hover/select.
   - Backward-compatible with old `.scriffle` files that use `stickerType` (legacy map auto-converts to emoji/label/color).
   - `NavToolbar.tsx` + `ContextMenu.tsx` updated to seed stickers with `{ emoji, label, color }`.
   - `ActivityFeed.tsx` shows the emoji + label for sticker nodes.

   - **Problem:** Current stickers are hardcoded, static badges (`bullish`, `bearish`, `rocket`, `target`, `star`, `warning`, `approved`) with zero in-place editability on the canvas. The fixed `bullish` and `bearish` presets are rigid and repetitive.
   - **Proposed Solution & Experience:**
     - **Kill fixed bullish/bearish presets**: Replace the static lookup with a flexible, customizable sticker schema (`{ emoji: string, label: string, color?: string }`).
     - **In-Place Emoji Picker**: Clicking the sticker icon opens a lightweight emoji / icon quick-picker dropdown directly on the canvas (e.g. 🚀, 🎯, ⭐, 🔥, 💎, ⚠️, 🐻, 🐂, 📈, 📉, 🍜, ⚡, 🏆).
     - **In-Place Editable Label**: Double-clicking or clicking the label allows inline typing directly on the canvas card (e.g. *"Accumulation Zone"*, *"High Conviction"*, *"Earnings Catalyst"*) with `Enter` / `Esc` to commit.
     - **Color Swatch / Pill Selector**: Option to customize badge background accent tint (Mint, Rose, Amber, Indigo, Teal, Warm Slate).
- [x] **📊 Dynamic PDF Export & Fundamental Brief In-Place Updates with Revision Counter (`reportExporter.ts`, `FileNode.tsx`, `NoteNode.tsx`, `graphEngine.ts`)**
  - Implemented `handleFundamentalReportMutation` in `graphEngine.ts` across single-event triggers, Top Movers Radar, and AI Screener pipelines.
  - Dynamically updates existing attached `FileNode` documents on disk and connected `NoteNode` briefs in-place on repeat executions instead of spawning duplicate cards.
  - Added revision tracking (`revisionCount: rev + 1`) and `🔄 Rev X` badge pills on `FileNode.tsx` and `NoteNode.tsx`, with institutional `Rev X` badge pills in exported HTML/PDF briefs.
  - Added unit test suite `reportRevision.test.ts` (109 passing unit tests).

- [x] **⚡ Dynamic Watcher Target Handle & Upstream Input Reception (`WatcherNode.tsx` & `graphEngine.ts`)**
  - Added target handle (`Position.Left`) to `WatcherNode.tsx` allowing direct visual drag-to-connect from Screener and Action nodes without React Flow connection warnings.
  - Enabled dynamic symbol adoption across `executeGraphForEvent`, `executeGraphForRadarWatcher`, and `executeGraphForScreener`.
- [x] **🐛 Dynamic Peer Watcher Action Label Fallback (`ActionNode.tsx` & `types/canvas.ts`)**
  - Updated `ActionNode.tsx` to dynamically render `Spawn Peer Watcher (Dynamic)` or configured symbol override instead of hardcoded `"BBRI"`. Added `targetSymbol`, `template`, and `interval` properties to `ActionConfig`.

1. **🖼️ Interactive Image Editing & Replacement (`ImageNode.tsx` & `EditNodeModal.tsx`)**
   - **Problem:** Current `ImageNode` only supports resize handles (`NodeResizer`). Users cannot edit image URLs, swap/replace image files in-place, inline-edit the caption, toggle transparency/borders, or configure images via `EditNodeModal` (which currently lacks an `image` node tab).
   - **Proposed Solution & Experience:**
     - **In-Place Image Replace / Upload**: Hover action bar or double-click to swap the image URL or upload a new image from disk directly.
     - **Inline Caption Editing**: Click/double-click caption text on canvas to type directly with `Enter`/`Escape` commit.
     - **Transparency & Card Border Toggle**: Quick toggle between transparent sticker mode (`isTransparent: true`) and bordered card mode (`rounded-2xl border-2 border-slate-300 bg-white p-2`).
     - **Edit Modal Integration**: Add dedicated `image` configuration tab in `EditNodeModal.tsx` (URL input, upload dropzone, caption text, aspect ratio reset, dimensions).

2. **Sections / Frame Containers** — FigJam/Miro-style structural clustering that groups and moves related cards together.
3. ~~**⚡ Quick-Add Node Connector (`+` Port Handle & Flow Auto-Wiring)**~~ ✅ **Completed**
4. ~~**🎨 Simple `.conf`-Based Theme Customization Engine (`.scrifflemes` / `themes/` folder)**~~ ✅ **Completed**
   - **Concept**: Kitty/Alacritty-style simple key-value configuration file for custom themes (no CSS knowledge required).
   - **Target Audience**: Financial market researchers, quantitative analysts, and non-web developers who want custom branding or terminal-style aesthetics (e.g., Bloomberg Terminal amber, Cyberpunk neon, Gruvbox, Nord, Solarized).
   - **Dedicated Directory & Extension**: `themes/*.scrifflemes` (plain-text INI/conf format).
   - **Proposed File Format (`themes/bloomberg.scrifflemes`)**:
     ```ini
     # Scriffle Theme Configuration (Alacritty / Kitty style)
     name = "Cyberpunk Dark"
     author = "rayyanekaputra"

     [canvas]
     background = #0F1014
     grid_dot = #2A2D37
     selection_box = #0050FF

     [ui]
     primary = #0050FF
     border = #2E3240
     text = #F1F5F9
     text_muted = #94A3B8
     surface = #181920

     [nodes]
     watcher = #10B981
     condition = #FFD728
     alert = #FF5B79
     screener = #0050FF
     note_default = #FEF08A
     ```
   - **Experience & Capabilities**:
     - **Dedicated Themes Folder**: Packaged in `themes/` alongside starter presets.
     - **Import / Drag & Drop**: Drag a `my-theme.scrifflemes` file onto the canvas or select it from the Theme Switcher to apply immediately.
     - **Dynamic CSS Variable Mapping**: Under the hood, a lightweight parser converts key-value pairs into standard CSS variables / `[data-theme="custom"]` properties at runtime.
     - **Export Active Theme**: One-click "Export Theme" button in settings/theme picker to save current colors as a shareable `.scrifflemes` file.
     - **Presets Bundle**: Ships with popular colorways out of the box in `themes/` (e.g. *Bloomberg Amber*, *Nord*, *Gruvbox*, *Solarized*, *Tokyo Night*).

---

### ⏸️ On-Hold / Deprioritized Backlog (Least Favored)

- **🔗 Action-to-Action Chaining & Multi-Step Workflows (`ActionNode.tsx` & `graphEngine.ts`)**:
  - *Status:* **Deprioritized / On-Hold** — Currently lacking a strong user logic-case or clear mental model. Single downstream action pipelines (e.g. `[Screener/Radar] -> [Action: create_watcher] -> [Pipeline]`) already satisfy all primary research and board mutation workflows without introducing multi-action recursion overhead.

---

### Candidate QoL Features

#### 0. 🐛 Reported Bugs & Regressions (New)

- [x] **[BUG] ActionNode icon inconsistency — standardize on Zap (`QuickAddPopover.tsx`, `NavToolbar.tsx`, `quickAddNavigator.ts`)**:
  - Standardized everywhere on `flash_line` (MingCute zap icon), removing `play_line`.
- [x] **[BUG — HIGH PRIORITY REGRESSION] Quick-connect no longer auto-wires edge after adding a new node via Quick-Add (`nodes/route.ts`, `MarketCanvas.tsx`)**:
  - Updated `POST /api/canvas/nodes` to accept client-provided `id`, ensuring the ID generated on the frontend matches the database record so `POST /api/canvas/edges` doesn't fail foreign-key constraints.
- [x] **[BUG] Sticker dropdown arrow container in NavToolbar is not vertically aligned with peer items (`NavToolbar.tsx`)**:
  - Applied `items-stretch` and matching `border-y border-r border-l` on the chevron button.
- [x] **[BUG] Mono theme active-state highlight in theme chooser is incorrect (`TopNav.tsx`, `ThemeModal.tsx`)**:
  - Fixed active and inactive styling in Mono mode (`bg-[#FCFBF9] text-[#242321] border-[#D8D4CA] shadow-2xs`) in `TopNav.tsx` and updated Mono card active badge in `ThemeModal.tsx`.

- [x] **Discord Webhook alert delivery for `AlertNode` (`discordWebhook.ts`, `/api/alert/test-webhook`, `AlertNode.tsx`)**
- [ ] **[IDEATION] Telegram Bot alert delivery for `AlertNode`**:
  - Explore Telegram Bot API as downstream alert channel (@BotFather bot token + `chat_id`). Queued for future exploration.

#### 1. 🏷️ Sticker & Visual Annotation Modernization (FigJam-inspired)
- [ ] **In-Place Editable Sticker Component (`StickerNode.tsx`)**:
  - Replace static `STICKER_META` lookup (`bullish`/`bearish`) with inline stateful config (`emoji`, `label`, `color`).
  - Native inline text editor for sticker title with keyboard commit (`Enter`/`Escape`).
  - Floating emoji picker popover on icon click.
  - Context menu & `EditNodeModal` support for sticker customization.
  - Update `.scriffle` format schema and AI generator spec (`SCRIFFLE_AI_SPEC.md`) to support arbitrary `{ emoji, label, color }` configs.
- [ ] **In-Place Image Editor & Re-uploader (`ImageNode.tsx` & `EditNodeModal.tsx`)**:
  - Double-click / context menu to open Image property editor in `EditNodeModal`.
  - In-place image replacement button / file dropper.
  - Inline editable caption below image with `Enter`/`Esc` commit.
  - Quick transparency vs bordered card toggle.

#### 2. ⚡ Automation & Flow Building (n8n-inspired)
- [x] **Quick-Add Connector (`Tab` or `+` handle)**: Hovering a node's output handle shows a small `+` icon; clicking it or pressing `Tab` opens a quick-picker to auto-wire the next node (e.g., `Watcher` → `Condition` → `Note`) in 1 click.
- [x] **Edge Labels & Condition Badges**: Custom edges with auto-inferred or custom pills (e.g., `"if true"`, `"on tick"`, `"discovered"`, `"generates"`) to make automation pathways self-documenting.
- [x] **Condition Node Dual Outputs & "False" Branching (`ConditionNode.tsx`, `graphEngine.ts`, `edgeLabels.ts`)**:
  - Add dual output connection handles to `ConditionNode` cards:
    - **`True` Output Port (Green dot / top-right)**: Fires when `expr-eval` boolean rule evaluates to `true` (renders with `"if true"` edge badge).
    - **`False` Output Port (Rose/Slate dot / bottom-right)**: Fires when `expr-eval` rule evaluates to `false` (renders with `"if false"` / `"on fail"` edge badge).
  - Graph engine updates in `graphEngine.ts`: inspect `edge.sourceHandle` (`'true'` vs `'false'`) and route downstream executions according to the boolean outcome (e.g. `[Condition: price_change > 5%] -> (true) -> [Surge Alert]`, `[Condition: price_change > 5%] -> (false) -> [Log Neutral Note]`).
  - Unit tests covering true/false handle edge routing in `graphEngine`.
- [ ] **Live Signal Flow Pulses**: Visual pulsing packet animating along connecting edges when a watcher or condition triggers downstream nodes.

#### 2. 🗂️ Spatial Board Organization (FigJam × Miro-inspired)
- [ ] **Canvas Sections / Frames**: Visual colored boundaries with editable title headers (e.g., *"Banking Sector Watchers"*, *"AI Screener Pipeline"*) that enclose and move child nodes together.
- [ ] **Tidy Up / Auto-Distribute**: 1-click button in the selection bounding box when 3+ nodes are selected to align and space nodes with equal horizontal/vertical offsets.
- [ ] **Floating Color Quick-Swatches on Sticky Notes**: Floating 5-color mini palette on hover/selection of sticky notes for 1-click color swapping.

#### 3. 🔍 Navigation & Productivity (Figma × FigJam-inspired)
- [x] **Spotlight Quick Search (`Cmd+K` / `Cmd+F`)**: Modal search across stock tickers (`BBCA`, `BBRI`), note text, and node labels with 1-click camera pan & zoom.
- [x] **Keyboard Shortcuts Cheat Sheet Modal (`?`)**: Clean visual shortcut guide overlay showing all canvas hotkeys (`V`, `H`, `T`, `Cmd+G`, `Cmd+Shift+G`, `Cmd+C/V/D`, `Cmd+Z/Y`, `Delete`, `Esc`, `Space`).
- [x] **Zoom Percentage Badge & Fit-to-Screen (`Shift+1` / `Shift+0`)**: Clickable zoom indicator in toolbar with presets (`50%`, `100%`, `150%`, `200%`, `Fit All`).
- [x] **⏳ Global & Card-Level Loading Feedback for Long-Running Operations**:
  - Show an institutional progress/loading banner and center status pill during AI company screening, multi-stock fundamental reports, `.scriffle` imports/exports, and live/mock market streams.
  - Eliminates user uncertainty during heavy API roundtrips and disk exports with automatic 12s safety timeout.

#### 4. 🎭 Presentation & Live Pitch Mode (Miro-inspired)
- [ ] **Zen / Presenter Mode (`Cmd+.`)**: 1-click toggle to hide all UI chrome (toolbars, docks, sidebars) for distraction-free presentation to judges.
- [ ] **Presenter Laser Pointer**: Hold modifier key or toggle a laser pointer tool that leaves a smooth fading line for explaining live graphs.

#### 5. 🚀 First-Time User Onboarding & Guided Interactive Tour
- [ ] **Interactive Onboarding Tour (`useOnboardingStore`, `OnboardingModal.tsx` / `OnboardingOverlay.tsx`)**:
  - Automatically triggers on first install / visit (`localStorage.getItem('scriffle_onboarded')`).
  - Can be manually re-triggered anytime via Help `(?)` menu, Spotlight Search (`Ctrl+K` -> *"Restart Tour"*), or Settings.
  - Guided "Aha! Moment" sandbox flow:
    - Step 1: Concept & Welcome ("FigJam meets Stock Market Automation").
    - Step 2: Deploy first node with zero-friction ticker quick-picks (`BBCA`, `Top Gainers`, `AI Screener`).
    - Step 3: Wire a condition rule (`change_pct > 2%`) to an alert / note.
    - Step 4: Simulate a live tick / surge and see the canvas auto-mutate.
  - Skippable at any time with a resume badge and persistence state.




