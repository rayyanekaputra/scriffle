# Scriffle Feature Backlog

This backlog tracks candidate Sectors API v2 integrations and advanced automation capabilities planned for future iterations.

---

## 🚀 Active / Completed in Recent Sprint

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

## 📌 Open Candidate Endpoints & Features

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

## 🎨 Whiteboard QoL & UX Experience Improvements (FigJam × n8n × Figma × Miro)

### 🌟 Top Recommendations for Immediate Hackathon Polish

1. **Spotlight Search (`Cmd+K` / `Cmd+F`) & Shortcuts Cheat Sheet (`?`)** — High demo impact, instant spatial navigation across complex research boards.
2. **Sections / Frame Containers** — FigJam/Miro-style structural clustering that groups and moves related cards together.
3. **Quick-Add Node Connector (`Tab` / `+` port handle) & Labeled Edges** — Signature n8n flow builder speedup with self-documenting automation connectors.

---

### Candidate QoL Features

#### 1. ⚡ Automation & Flow Building (n8n-inspired)
- [ ] **Quick-Add Connector (`Tab` or `+` handle)**: Hovering a node's output handle shows a small `+` icon; clicking it or pressing `Tab` opens a quick-picker to auto-wire the next node (e.g., `Watcher` → `Condition` → `Note`) in 1 click.
- [ ] **Edge Labels & Condition Badges**: Custom edges with auto-inferred or custom pills (e.g., `"if true"`, `"on surge"`, `"export"`) to make automation pathways self-documenting.
- [ ] **Live Signal Flow Pulses**: Visual pulsing packet animating along connecting edges when a watcher or condition triggers downstream nodes.

#### 2. 🗂️ Spatial Board Organization (FigJam × Miro-inspired)
- [ ] **Canvas Sections / Frames**: Visual colored boundaries with editable title headers (e.g., *"Banking Sector Watchers"*, *"AI Screener Pipeline"*) that enclose and move child nodes together.
- [ ] **Tidy Up / Auto-Distribute**: 1-click button in the selection bounding box when 3+ nodes are selected to align and space nodes with equal horizontal/vertical offsets.
- [ ] **Floating Color Quick-Swatches on Sticky Notes**: Floating 5-color mini palette on hover/selection of sticky notes for 1-click color swapping.

#### 3. 🔍 Navigation & Productivity (Figma × FigJam-inspired)
- [x] **Spotlight Quick Search (`Cmd+K` / `Cmd+F`)**: Modal search across stock tickers (`BBCA`, `BBRI`), note text, and node labels with 1-click camera pan & zoom.
- [x] **Keyboard Shortcuts Cheat Sheet Modal (`?`)**: Clean visual shortcut guide overlay showing all canvas hotkeys (`V`, `H`, `T`, `Cmd+G`, `Cmd+Shift+G`, `Cmd+C/V/D`, `Cmd+Z/Y`, `Delete`, `Esc`, `Space`).
- [x] **Zoom Percentage Badge & Fit-to-Screen (`Shift+1` / `Shift+0`)**: Clickable zoom indicator in toolbar with presets (`50%`, `100%`, `150%`, `200%`, `Fit All`).

#### 4. 🎭 Presentation & Live Pitch Mode (Miro-inspired)
- [ ] **Zen / Presenter Mode (`Cmd+.`)**: 1-click toggle to hide all UI chrome (toolbars, docks, sidebars) for distraction-free presentation to judges.
- [ ] **Presenter Laser Pointer**: Hold modifier key or toggle a laser pointer tool that leaves a smooth fading line for explaining live graphs.


