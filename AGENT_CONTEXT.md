# 🧠 AGENT CONTEXT: Scriffle — Master Handover Document

> **READ THIS FIRST.** This is the single source of truth for any new AI agent or copilot joining the Scriffle project. It synthesizes all context from previous sessions. After reading this file, check `context/BACKLOG.md` for open tasks and `context/CHECKPOINT.md` for implementation status.

---

## 1. What Is Scriffle?

**Scriffle** is an event-driven, visual workflow automation whiteboard for financial market research on **Indonesian stocks** (IDX). Think **FigJam × n8n**, wired into the [Sectors.app API](https://sectors.app).

- Users build a canvas of connected nodes (visual graph)
- The backend engine monitors market data and **auto-mutates the canvas** (rewrites notes, fires alerts, creates new nodes) without user interaction
- A **Simulation Bar** lets presenters inject fake market spikes (e.g. `BBCA +6.2%`) for live demos
- Built for the **Sectors 2026 Hackathon** by `thelast10years` / `rayyanekaputra`

**GitHub:** `https://github.com/rayyanekaputra/scriffle`

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| Canvas | `@xyflow/react` (React Flow v12), Light Mode, dot grid bg |
| Styling | Tailwind CSS v4, **flat outline system** (ZERO drop shadows, 2px borders) |
| Icons | **MingCute Icons** — loaded locally from `public/mingcute/Mingcute.css` via `<MingIcon name="..." />` |
| Font | **Stack Sans Text** — from Google Fonts. **Zero all-caps, zero spaced letters** |
| DB / ORM | SQLite (`prisma/dev.db`) + Prisma 5.22.0 |
| Sync | SWR short-polling every 2s (`/api/canvas` + `/api/logs`) |
| Runtime | **Bun** (v1.4.0) exclusively — use `bun add`, `bunx`, `bun dev` |
| DSL Evaluator | `expr-eval` — NEVER use raw `eval()` |
| Financial Data | Sectors.app API v2 (live) + realistic offline mock fallback |

---

## 3. Core Agent Operating Rules (Critical — Never Violate)

1. **NO SUBAGENTS**: **DO NOT CREATE SUBAGENTS** under any circumstances (`invoke_subagent` / `define_subagent`). All reading, searching, code editing, and planning must be handled directly within the main agent context to conserve token quota and API data.
2. **NO TESTS FOR IMPLEMENTATION PLANS OR DOCUMENTATION**: Never run `bun test` or ask to test when writing, editing, or reviewing implementation plans, markdown specs, architectural proposals, backlog items, or documentation. Tests are strictly reserved for actual application code changes (`.ts`, `.tsx`, API routes, engines).
3. **Zero drop shadows** — no `shadow-md`, `shadow-xl`, `drop-shadow` anywhere
4. **Flat outline** — 2px solid borders (`border-slate-300`, `border-slate-800`)
5. **Font: Stack Sans Text & Typography Hierarchy** — strictly sentence/title case only.
   - **NO all-caps / uppercase** (`text-transform: uppercase`, `uppercase` class) — only allow uppercase for necessary acronyms/tickers (e.g. `BBCA`, `IDX`, `ROE`, `P/E`, `ESG`, `LQ45`, `PDF`, `SOE`, `CAGR`).
   - **NO spaced-out letters** (`letter-spacing`, `tracking-wider`, `tracking-widest`, `l e t t e r s`).
   - Header labels, brand titles, section headings, and buttons must always use clean Sentence Case or Title Case.
6. **Icons: MingCute only** — `<MingIcon name="mgc_..." />` from `src/components/ui/MingIcon.tsx`
7. **Color palette:**
   - Primary: `#0050FF` (Electric Blue)
   - Yellow: `#FFD728` (Condition nodes)
   - Mint: `#10B981` (Watcher positive states)
   - Coral: `#FF5B79` (Alert nodes)
   - Lavender: `#8B5CF6`
   - Canvas bg: `#F8F9FC` with dotted grid `#CBD5E1`
8. **3 Themes:** Light (default), Mono (warm-paper `#F4F3EF`), Dark (soft charcoal `#0F1014`) — implemented via `[data-theme]` CSS tokens

---

## 4. Node System (Strict — Exactly These Types)

### Core Automation Nodes (5 original types)

| Node | Visual | Purpose | Key Config |
|---|---|---|---|
| `screener` | AI Screener card (blue header, prompt pill, 3 credits badge) | Natural language company screener (Sectors API `/v2/companies/`) | `query`, `limit`, `interval` |
| `watcher` | Radar sticker (white card, blue accents) | Monitors IDX stock tickers | `symbol`, `metric`, `interval` (seconds) |
| `condition` | Yellow rule capsule | Evaluates DSL boolean rules with `expr-eval` | `rule` (e.g. `price_change > 5 AND volume > 1000000`) |
| `note` | Pastel sticky note (5 colors) | Auto-updates text on trigger; direct inline edit | `content`, `template` (e.g. `${symbol} surged ${price_change}%`) |
| `alert` | Coral notification sticker | Emits toast + logs to activity feed | `channel: 'ui' \| 'telegram' \| 'webhook'` |
| `action` | Cobalt automation capsule | Auto-mutates canvas (creates nodes) | `action: 'create_note' \| 'create_watcher' \| 'fundamental_report' \| 'export_canvas'` |

### Annotation / Freeform Nodes (extended — no engine execution)

| Node | Purpose |
|---|---|
| `text` | Freeform text blocks — direct inline editable |
| `sticker` | Transparent badge stickers (Bullish, Bearish, Breakout Ready, Target Hit, Top Pick, High Volatility, Thesis Approved) |
| `image` | Resizable transparent image — `NodeResizer`, aspect-ratio locked, persisted dimensions |
| `file` | Universal file attachment — browser preview, open location, copy link |

> **Rule:** The `text`, `sticker`, `image`, `file` types are canvas-only annotations. Only `screener`, `watcher`, `condition`, `note`, `alert`, `action` participate in the graph engine.

---

## 5. Architecture & Data Flow

```
[Sectors API / Mock Data]
         │
         ▼
POST /api/engine/trigger (Live Sectors API poll or realistic randomized Mock)
         │
         ▼
graphEngine.ts → BFS traversal from Watcher → Condition → Note/Alert/Action
         │
         ▼
SQLite (Prisma) ← Node state updated, Logs written, Cycle counters incremented
         │
         ▼
SWR polling (2s) ← Frontend fetches /api/canvas + /api/logs
         │
         ▼
React Flow re-renders ← Updated nodes/edges shown, toasts fired
```

### Master TypeScript Contracts (`src/types/canvas.ts`)

**Always use these types. Never invent ad-hoc JSON structures.**

```typescript
export type NodeType = 'watcher' | 'condition' | 'note' | 'alert' | 'action' | 'text' | 'sticker' | 'image' | 'file';

export interface WatcherConfig {
  symbol: string;       // "BBCA", "BBRI", "BMRI", "TLKM", "ASII"
  metric: 'price' | 'price_change' | 'volume' | 'rank' | 'top_gainers' | 'top_losers';
  interval: number;     // seconds
  cycleCount?: number;  // run counter displayed as "⚡ 12 runs"
}

export interface MarketEvent {
  symbol: string;
  price: number;
  prevPrice: number;
  price_change: number; // e.g. 6.2 for +6.2%
  volume: number;
  avg_volume: number;
  rank?: number;
  timestamp: string;
}
```

---

## 6. Key File Map

```
hackathon/
├── context/                        ← All historical plan/design docs (archived)
├── prisma/
│   ├── schema.prisma               ← DB models: Canvas, Node, Edge, Log, MarketSnapshot
│   └── seed.ts                     ← Demo canvas seeder
├── public/mingcute/                ← MingCute icon font (Mingcute.css)
├── presets/                        ← Starter .scriffle preset files
└── src/
    ├── app/
    │   ├── api/
    │   │   ├── canvas/
    │   │   │   ├── route.ts        ← GET canvas state
    │   │   │   ├── nodes/route.ts + [id]/route.ts
    │   │   │   ├── edges/route.ts + [id]/route.ts
    │   │   │   ├── list/route.ts   ← List all canvases (multi-project)
    │   │   │   └── restore/route.ts ← Atomic canvas restore from .scriffle
    │   │   ├── engine/
    │   │   │   ├── trigger/route.ts ← Live Sectors API poll + graph run
    │   │   │   └── simulate/route.ts ← Inject mock MarketEvent
    │   │   ├── export/report/route.ts ← Fundamental report PDF/HTML
    │   │   ├── file/open-location/route.ts ← OS folder reveal for FileNode
    │   │   └── logs/route.ts
    │   ├── b/[id]/page.tsx         ← Multi-project URL-based routing
    │   ├── globals.css             ← Stack Sans Text + flat outline system + 3 themes
    │   ├── layout.tsx              ← Google Font + MingCute font-face loading
    │   └── page.tsx                ← Root redirect → /b/[default-canvas-id]
    ├── components/
    │   ├── canvas/
    │   │   ├── MarketCanvas.tsx    ← React Flow, clipboard paste, context menus, drop events
    │   │   ├── ContextMenu.tsx     ← Right-click menus (canvas + node/edge + group/ungroup)
    │   │   ├── SelectionBoundingBox.tsx ← Figma-style 8-point bounding box handles & group action pills
    │   │   └── nodes/
    │   │       ├── WatcherNode.tsx   ← Cycle counter ⚡, Radar/Top-Movers mode
    │   │       ├── ConditionNode.tsx ← expr-eval rule capsule
    │   │       ├── NoteNode.tsx      ← Inline editable, 5 pastel colors, resizable
    │   │       ├── AlertNode.tsx     ← Toast + log trigger
    │   │       ├── ActionNode.tsx    ← Canvas mutations + fundamental_report
    │   │       ├── TextNode.tsx      ← Freeform WYSIWYG text with markdown triggers
    │   │       ├── StickerNode.tsx   ← Transparent badge stickers
    │   │       ├── ImageNode.tsx     ← NodeResizer, transparent PNG
    │   │       ├── FileNode.tsx      ← File attachment with preview
    │   │       └── text/
    │   │           └── TextFormatToolbar.tsx ← Floating formatting toolbar (typography, highlight, container)
    │   ├── controls/
    │   │   ├── TopNav.tsx          ← Floating whiteboard toolbar
    │   │   ├── NavToolbar.tsx      ← Secondary toolbar
    │   │   ├── SimulationBar.tsx   ← Control Panel drawer (stream manager, project file ops, examples)
    │   │   ├── EditNodeModal.tsx   ← Full property editor modal
    │   │   ├── DevSpikeTool.tsx    ← 4-param developer spike injector
    │   │   └── ProjectSwitcherModal.tsx ← Multi-project switcher
    │   ├── feed/
    │   │   └── ActivityFeed.tsx    ← Live event stream, camera pan, chain glow
    │   └── ui/
    │       └── MingIcon.tsx        ← Reusable MingCute icon component
    ├── hooks/
    │   └── useCanvasSync.ts        ← SWR polling hook (2s interval)
    ├── lib/
    │   ├── creditCosts.ts          ← Centralized pricing registry & burst calculations
    │   ├── prisma.ts               ← Global Prisma client singleton
    │   └── utils.ts
    ├── server/services/
    │   ├── dslEngine.ts            ← Safe expr-eval DSL parser
    │   ├── graphEngine.ts          ← BFS traversal, self-mutations, cycle counting
    │   └── sectorsApi.ts           ← Live + mock Sectors API client (Top Movers fix, error capture)
    └── types/
        └── canvas.ts               ← MASTER TypeScript interfaces (always reference this)
```

---

## 7. API Endpoints

### Canvas CRUD
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/canvas?id=<id>` | Full canvas with nodes, edges, logs |
| `POST` | `/api/canvas/nodes` | Create node `{ type, position, config }` |
| `PATCH` | `/api/canvas/nodes/:id` | Update position or config |
| `DELETE` | `/api/canvas/nodes/:id` | Delete node + attached edges |
| `POST` | `/api/canvas/edges` | Create edge `{ from, to }` |
| `DELETE` | `/api/canvas/edges/:id` | Delete edge |
| `GET` | `/api/canvas/list` | All saved canvases with metadata |
| `POST` | `/api/canvas/restore` | Atomic replace canvas from .scriffle file |

### Engine & Live Poll
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/logs` | Recent execution logs |
| `POST` | `/api/engine/trigger` | Live Sectors API poll + graph execution (with randomized mock fallback) |

### Export & Files
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/export/report?symbol=<sym>` | Fundamental report HTML/PDF |
| `POST` | `/api/file/open-location` | Open OS folder for FileNode |

---

## 8. Sectors API v2 Integration

### Active (Implemented)
| Endpoint | Feature |
|---|---|
| `GET /v2/daily/{symbol}/` | WatcherNode price/volume polling, live trigger |
| `GET /v2/companies/top-changes/` | Top Gainers / Top Losers Radar Watcher mode |
| `GET /v2/company/report/{symbol}/` | ActionNode fundamental report + PDF export |

### Dual-Mode Operation
- **Live Mode:** `SECTORS_API_KEY` entered in UI (session-only, never persisted). Sends `Authorization: <key>` header.
- **Mock / Offline Mode:** Realistic fake data for `BBCA`, `BBRI`, `BMRI`, `TLKM`, `ASII` — used automatically when no key is provided.
- The API key is **never stored** in SQLite, `.env`, localStorage, or `.scriffle` exports — only held in React client state for the browser session.

---

## 9. Key Features Implemented (Complete List)

### Canvas Interactions & Grouping System
- **Right-click on canvas** → context menu to insert any node type at cursor coordinates
- **Right-click on node/edge** → Edit, Change Color, Delete, Group, Ungroup
- **Double-click node** → `EditNodeModal` opens; for TextNode / Grouped nodes, enters inline edit mode or group isolation focus
- **Shift+Click / Ctrl+Click** → multi-select; **Shift+Drag** → box marquee select
- **Figma-Style Selection Bounding Box (`SelectionBoundingBox.tsx`):** 8-point corner and edge midpoint handles with dashed outline and quick `Group` / `Ungroup` action buttons when 2+ elements are selected
- **Group & Ungroup (`Cmd+G` / `Cmd+Shift+G`):** Cohesive multi-node dragging, group-aware copy & paste (`Cmd+C` / `Cmd+V`) preserving internal connectors and relative offsets
- **Double-Click Isolation Mode:** Isolates group into focus mode with top banner to edit individual elements or make `Shift+Click` sub-selections (`Esc` to exit)
- **Delete / Backspace** → bulk delete selected
- **Ctrl+C / Ctrl+V** → Copy/paste nodes; **Ctrl+D** → Duplicate

### Free-Text Tooling (`TextNode.tsx` & `TextFormatToolbar.tsx`)
- **1:1 True WYSIWYG Parity:** Zero dimensional jump between typing and display modes, auto-growing height with zero internal scrollbars
- **Floating Contextual Toolbar:** Docks above active card with 4-level typography scale (`Title`, `Header`, `Body`, `Caption`), text styling (`Bold`, `Italic`, `Underline`, `Strikethrough`), text alignment, pastel highlighter markers, and container styles (`Plain`, `Callout Banner`, `Card`)
- **Markdown Triggers:** `# ` auto-converts to Title, `## ` to Header, `- ` to bulleted list
- **`T` Hotkey Placement:** Press `T` anywhere on canvas to immediately drop free-text at mouse cursor with auto-focus
- **Keyboard Commit:** `Enter` applies changes and exits edit mode. `Shift+Enter` inserts a new line (with bullet continuation). `Escape` also commits and exits.

### Note Nodes
- **Direct inline edit** on canvas (no popup)
- 5 pastel color themes: yellow, mint, pink, blue, purple
- `<NodeResizer />` corner handles — persisted to SQLite
- Template interpolation: `${symbol}`, `${price_change}`, `${price}`, `${timestamp}`
- Full edit modal with char/word counter, variable inserter, color picker, dimension reset

### Image Node
- Upload via toolbar button, right-click menu, or file drop
- **Ctrl+V** clipboard paste → places image at cursor
- Transparent PNG rendering (zero white background box)
- `<NodeResizer />` with aspect-ratio locking, persisted dimensions

### Project Files (.scriffle format)
- **Save:** Downloads `<canvas_name>.scriffle` (UTF-8 JSON)
- **Open:** File picker (`.scriffle`, `.json`) + drag-drop onto canvas
- **Presets:** "Rotation Engine", "Momentum Breakout Loop", "Banking Sector Trio"
- **Restore API:** `/api/canvas/restore` — validates, resets run counters to 0

### Multi-Project Tabs
- URL routing: `/b/[canvasId]`
- `GET /api/canvas/list` → project switcher modal
- Each tab: independent SWR cache, independent session API key

### Activity Feed
- Human-readable node chips with MingCute icons
- 1-click camera pan & zoom to fly to any node
- Hover chain glow — highlights execution paths
- Drag-to-resize sidebar (280px–750px)
- Clear feed button with confirmation + resets all cycle counters to 0

### Watcher Node
- Cycle counter badge: `⚡ 12 runs`
- Modes: Single ticker (daily data) or Top Gainers/Losers (radar mode)
- Per-watcher configurable polling interval (1s–3600s)
- Clean initial state: Starts idle with `0 runs` and waiting indicators instead of premature mock data
- Error transparency: Live API failures display `⚠ API Error {code}` badge with structured callout banner; offline mode displays `Mock` badge
- Credit cost badge in footer (`🪙 10 credits / poll` for Radar, `🪙 1 credit / tick` for Single)

### API Credit Cost Badges & Safety System (`creditCosts.ts`)
- Centralized pricing registry for Sectors.app API v2 consumption
- Visual credit cost pills on `ActionNode` (`🪙 8 credits / symbol` or `⚡ 0 credits (local)`), `WatcherNode`, and `ScreenerNode` (`🪙 3 AI credits / query`)
- Edit modal callouts with multi-stock burst warnings (e.g. 5-mover fundamental report = 40 credits burst)

### Theme Switcher (3 modes)
- **Light** (default): Full multicolor FigJam
- **Mono** (Warm-Paper): `#F4F3EF` canvas, warm graphite borders
- **Dark** (Soft Charcoal): `#0F1014` canvas, low-contrast borders, soft silver text

### Control Panel & Data Streaming
- **Control Panel Drawer (`SimulationBar.tsx`)**: Rebranded from Demo Controls to institutional Control Panel with clean single-line headers.
- **Unified Market Data Stream**: Merged manual sync and auto-polling into a unified stream controller with **Do Once** (single poll tick) and **Stream Data** (continuous per-node interval streaming).
- **Project File Actions**: 3-button grid for **New File** (fresh `/b/[uuid]` board), **Open File** (`.scriffle`), and **Save File**.
- **Examples**: Built-in starter workflows (`Rotation Engine`, `Momentum Breakout Loop`, `Banking Sector Trio`).

---

## 10. Open Backlog (Prioritized)

- **Control Panel Rebranding, Unified Data Stream & Theme-Aware Rank Badges (`WatcherNode.tsx`, `SimulationBar.tsx`, `TopNav.tsx`, `page.tsx`)**:
  - Implemented contrast-compliant rank capsule badges (#1 gold, #2 silver, #3 bronze, #4+ neutral) in `WatcherNode.tsx` across Light, Mono (warm-paper), and Dark (soft charcoal) modes.
  - Combined Market Data Sync and Auto-Polling Stream into a unified single-line **Market Data Stream** card with **Do Once** and **Stream Data** action buttons.
  - Added **New File** action button alongside Open and Save in Project File container.
  - Rebranded Presets to **Examples** and renamed drawer from "Demo Controls" to **Control Panel**.
- **Dynamic Mock Fundamental Report & Valuation Metric Updates (`sectorsApi.ts`, `graphEngine.ts`, `reportExporter.ts`, `reportRevision.test.ts`)**:
  - Dynamically recalculates Market Cap ($\text{Market Cap}_{\text{base}} \times (1 + \frac{\Delta\%}{100})$), P/E, P/B, `lastClosePrice`, and `dailyCloseChange` on every mock poll tick and report revision instead of displaying static constants.
  - Formats dynamic market cap strings with `formatMarketCap` (`T`, `B`, `Q`).
  - Threaded `marketEvent` through `handleFundamentalReportMutation`, `getCompanyFundamentalReport`, and `exportReportToDisk`.
  - Added unit test suite verification in `reportRevision.test.ts` (112 passing unit tests).
- **Dynamic PDF & Fundamental Brief In-Place Refresh with Revision Counters (`reportExporter.ts`, `FileNode.tsx`, `NoteNode.tsx`, `graphEngine.ts`)**:
  - Implemented `handleFundamentalReportMutation` in `graphEngine.ts` across single-event triggers, Top Movers Radar, and AI Screener pipelines.
  - When subsequent market ticks trigger research for an already researched symbol, the engine dynamically refreshes the existing attached `FileNode` on disk and updates the connected `NoteNode` brief in-place, eliminating duplicate node clutter.
  - Added revision counter tracking (`revisionCount: rev + 1`) and timestamps rendered as `🔄 Rev X` pills on both `FileNode.tsx` and `NoteNode.tsx` headers, as well as institutional `Rev X` badge pills and footer records inside the exported HTML/PDF brief.
  - Added unit test suite `reportRevision.test.ts` (112 passing unit tests).
- **Dynamic Watcher Target Handle & Upstream Input Reception (`WatcherNode.tsx` & `graphEngine.ts`)**: Added left-side target handle (`<Handle type="target" position={Position.Left} />`) to `WatcherNode.tsx`, resolving the React Flow edge creation error when connecting Action or Screener nodes to Watcher nodes. Updated `graphEngine.ts` across BFS event processing, Top Movers radar processing, and AI Screener flows to support dynamic symbol adoption when upstream nodes feed tickers into Watcher nodes.
- **Dynamic Peer Watcher Action Label Fallback (`ActionNode.tsx` & `types/canvas.ts`)**: Fixed hardcoded `"BBRI"` default in `ActionNode.tsx` label to dynamically render `(Dynamic)` or configured symbol override (`config.targetSymbol` / `config.params.symbol`), and added `targetSymbol`, `template`, and `interval` properties to `ActionConfig`.
- **UI Contrast & Typography Cleanup (Esc Badge, Shortcuts Group Titles, FileNode Contrast, Zero All-Caps Enforcement)**:
  - **Shortcuts Modal Group Titles & Esc Badge Theme Alignment (`ShortcutsModal.tsx`)**: Fixed category group titles and icons to use theme-aware contrast tokens (`isDark ? 'text-slate-200' : isMono ? 'text-[#242321]' : 'text-slate-900'`) matching content text readability in Light and Mono modes; fixed footer `Esc` badge styling.
  - **FileNode Symbol & Badge Contrast in Light Mode (`FileNode.tsx`)**: Replaced low-contrast pastel badge colors (`bg-*-50` & `text-*-600`) with high-contrast backgrounds (`bg-*-100`), bold vibrant text (`text-*-700`/`800`), and crisp borders (`border-*-300`), removing `tracking-wider` on the extension label.
  - **Zero All-Caps & Spacing Enforcement (`SimulationBar.tsx`, `NavToolbar.tsx`, `ActivityFeed.tsx`)**: Removed `uppercase` and `tracking-wider` classes from preset template labels, sticker headers, execution breadcrumbs, and simulated mode badges to strictly adhere to sentence/title case design rules.
- **Canvas UX & Formatting Fixes (Emoji Picker, Viewport Placement & Text Toolbar Stability)**:
  - **Sticker Node & Modal Editor (`EditNodeModal.tsx` & `StickerNode.tsx`)**: Fixed empty modal on double-click sticker; added 32-emoji grid picker, custom emoji input, label field, 7-color badge palette, and live preview. Added inline quick emoji popover on canvas and converted toolbar Sticker button into a split button (direct click drops sticker at viewport center, chevron opens 8 presets with click-outside dismiss).
  - **Viewport-Centered Node Placement (`NavToolbar.tsx` & `src/app/page.tsx`)**: Replaced static top-left coordinate fallback `(300, 200)` with `useReactFlow().screenToFlowPosition` converting viewport center `(window.innerWidth / 2, window.innerHeight / 2)` to flow coordinates with natural scatter jitter. Wrapped `NavToolbar` inside `ReactFlowProvider`.
  - **Free-Text Formatting Toolbar Stability (`TextNode.tsx` & `TextFormatToolbar.tsx`)**: Added `onMouseDown` preventDefault in `TextFormatToolbar` to stop focus theft from `<textarea>`, and updated `showToolbar` to `(selected || isEditing) && selectedCount === 1` so formatting controls remain active and accessible.
  - **Search Indexer & Testing**: Updated `searchIndexer.ts` with custom emoji and label search tokens; increased unit tests to 109 passing tests.
- **Navigation & Productivity Suite (`SpotlightSearchModal.tsx`, `ShortcutsModal.tsx`, `ZoomControls.tsx`)** — Implemented Figma/FigJam-inspired spatial navigation: Spotlight Search (`Cmd+K`/`Cmd+F`) with real-time fuzzy indexer (`searchIndexer.ts`) across all tickers, prompts, rules, notes, and files with smooth camera pan & zoom (`setCenter`); visual Keyboard Shortcuts Guide modal (`?` / `Shift+/`); and interactive bottom-left Zoom Controls with live percentage pill, preset dropdown (`50%`, `100%`, `150%`, `200%`, `Fit All`), and viewport hotkeys (`Shift+1` fit to screen, `Shift+0`/`Cmd+0` 100% reset).
- **AI Natural Language Company Screener (`/v2/companies/?q=...`)** — Added dedicated `ScreenerNode` (`ScreenerNode.tsx`) on the canvas supporting natural language queries (e.g. *"top 5 banks by market cap"*, *"coal mining companies with high dividend"*, *"tech companies by revenue"*). Integrated `fetchCompaniesScreener` with dynamic `query_values` unpacking, full Sectors API field coverage, smart metric stat capsule formatting, 3 AI credits notice, and downstream automation (`[Screener] -> [Note / Action / Watcher]`).
- **Auto-Spawned Watcher Complete Automation Pipeline (`create_watcher`)** — When an Action node triggers `create_watcher` (from Top Gainers/Losers Radar or single breakout events), it now automatically spawns a complete, connected downstream automation pipeline: `[New Watcher] -> [Condition (price_change > 0)] -> [Sticky Note]`. This ensures newly discovered breakout stocks immediately execute live tracking on subsequent polling ticks without manual wiring.
- **Correlated Symbol Fundamental Note & Dynamic Fallback Fix** — Fixed bug where top mover fundamental reports/notes fell back to spreading `BBCA` data; added full mock datasets for all Top Gainers and Losers (`MPRO`, `JECX`, `AGII`, `BREN`, `CUAN`, `BKSL`, `ELPI`, `EMAS`, `PSAB`, `GOTO`), implemented `buildDynamicCompanyReport` for arbitrary tickers, and threaded `sessionApiKey` through `executeGraphForRadarWatcher`, `executeGraphForEvent`, `exportReportToDisk`, and `/api/export/report`.
- **Top Gainers & Losers Ranking Leaderboard & Dual Note Workflows (`/v2/companies/top-changes/`)** — Upgraded `WatcherNode.tsx` with dedicated ranked Leaderboard card view, implemented full query parameters (`n_stock`, `periods`, `classifications`, `min_mcap_billion`) in `sectorsApi.ts`, added `executeGraphForRadarWatcher` in `graphEngine.ts` to support both Flow 1 (direct connected note receives formatted leaderboard table) and Flow 2 (action node `create_note` spawns separate notes for each mover with non-overlapping layout offsets), and added limit/mcap filter controls in `EditNodeModal.tsx`.
- **PDF / Fundamental Report Redesign** — Fully redesigned `/api/export/report` to a clean, borderless institutional document: white canvas, subtle hairline dividers, selective colour highlights (Mint for gains, Coral for losses, Blue for ratings bar), metric glossary & quick reference section at the bottom, and `@media print` CSS.
- **Auto-Export Reports to Disk** — When `ActionNode` fires `fundamental_report`, the report is automatically saved to `reports/{project_name}/{symbol}_Fundamental_Brief.html` via `src/server/services/reportExporter.ts`. No manual download required.
- **FileNode Download Status Indicator** — `FileNode.tsx` now shows a green `✓ Saved` pill when `savedLocally: true` or `isDownloaded: true` in `FileConfig`. Eliminates confusion about whether a file is on-disk or just a web link.
- **Free-Text `Enter` to Commit** — In `TextNode.tsx`, `Enter` now commits and exits edit mode. `Shift+Enter` creates a new line (with bullet list continuation). `Escape` also commits and exits.
- **Collision-Free Canvas Restore & Multi-Tab Isolation (`/api/canvas/restore`)** — Solved database `UNIQUE constraint failed on Node.id / Edge.id` when importing `.scriffle` files across multiple project tabs. Introduced an atomic `idMap` allocation engine in `src/app/api/canvas/restore/route.ts` that safely detects cross-canvas ID collisions in SQLite and allocates clean UUIDs while dynamically preserving all graph edge wirings (`fromId` -> `toId`) and deduplicating parallel edge constraints (`@@unique([fromId, toId])`). Scoped all frontend restore requests (`onDrop`, `handleUndo`, `handleRedo`, starter templates) to pass active `?id=${canvasId}`.
- **Free-Form Text Node Edit-Mode Race Fix (`TextNode.tsx`)** — Fixed bug where clicking a Text card caused edit mode to immediately close itself. Root cause: `useEffect` watching React Flow's `selected` prop fired `setIsEditing(false)` during the brief pointer-down de-select. Fix: replaced with a **200ms debounced timer** (`deselectedTimerRef`) that cancels on re-select; added **single-click-to-edit** when node was already selected (`wasSelectedRef`) matching FigJam/Notion UX; double-click always enters edit mode unconditionally.
- **In-Place Customizable Emoji Stickers (`StickerNode.tsx`)** — Replaced the rigid 7-preset `stickerType` enum with a free-form `{ emoji, label, color }` schema. `StickerNode` fully rewritten: double-click emoji to change it (inline input), double-click label to rename it, color palette (7 colors) appears on hover/select. Fully backward-compatible with old `.scriffle` files via a `LEGACY_MAP`. NavToolbar and ContextMenu updated to seed stickers with new format; bullish/bearish presets replaced with 📈/📉 emoji stickers.

- **Unit Testing Suite (Vitest)** — Implemented full Tier 1 unit test suite: 109 tests across 7 files covering `dslEngine`, `interpolateTemplate`, `generateLeaderboardNoteContent`, `generateScreenerNoteContent`, `searchIndexer`, `spatialNavigator`, and `reportRevision`. All pass in ~128ms. Run with `bun test`. See `context/TESTING_PLAN.md` for the full 3-tier roadmap and the testing mandate.

### 🟡 Open Candidate Integrations & Polish (Prioritized)
1. **⏳ Global & Card-Level Loading Feedback for Long-Running Operations** — Show institutional loading/progress feedback during multi-stock PDF generation, `.scriffle` exports, or heavy API fetches.
2. **Interactive Image Editing & Replacement (`ImageNode.tsx` & `EditNodeModal.tsx`)** — In-place replacement, inline caption editing, border toggle, and dedicated image modal tab.
3. **Canvas Sections / Frames & Spatial Clustering** — FigJam/Miro-style structural boundaries that group and move child nodes together.
4. **Quick-Add Node Connector (`Tab` / `+` port handle) & Labeled Edges** — Signature n8n flow builder speedup with self-documenting automation connectors.
5. **Foreign Flow Tracker** — Bandarmology node using `GET /v2/foreign-flow/{symbol}/`
6. **Broker Accumulation / Distribution Alert** — `GET /v2/broker-summary/{symbol}/top/`
7. **Insider Filings Alert** — Director/shareholder trade alerts using `GET /v2/filings/`
8. **Volume Breakout Scanner** — `GET /v2/most-traded/`

### ⏸️ On-Hold / Deprioritized Candidates
- **Action-to-Action Chaining** — Chained sequential actions (`[Action] -> [Action]`). *Status: Deprioritized / On-Hold — currently lacking concrete logic-case as single downstream action pipelines (`[Screener/Radar] -> [Action] -> [Pipeline]`) already fulfill target workflows without compounding branching complexity.*

---

## 11. Known Issues & Resolved Caveats

1. **✅ Top Movers API Parameter Bug & Error Transparency — Resolved**:
   - Fixed `sectorsApi.ts` `getTopMarketMovers()` to omit `classifications` when value is `'all'`, eliminating 400 Bad Request responses.
   - Structured error information (`{ code, message }`) is captured on failure, recorded in `stateJson`, displayed as a `⚠ API Error {code}` badge with error callout on `WatcherNode.tsx`, and logged to `ActivityFeed.tsx`.
   - Offline mode clearly displays a `Mock` indicator on Watcher cards.

2. **API Token & Credit Consumption Awareness — ✅ Surfaced in UI**:
   - Sectors API v2 charges credits per endpoint call:
     - `/v2/companies/top-changes/`: **Costs 1 API credit per requested classification × period combination** (default behavior with 2 classifications × 5 periods consumes **10 credits** per poll).
     - `/v2/company/report/{symbol}/`: **8 credits** per symbol.
     - `/v2/companies/?q=...`: **3 credits** per AI query.
     - `/v2/daily/{symbol}/`: **1 credit** per tick.
   - Automated pipelines triggering multi-symbol fundamental reports (e.g. 5 Top Movers) consume $5 \times 8 = 40\text{ credits}$ per trigger. Rapid multi-poll triggers can consume 380+ credits in minutes.
   - Credit cost badges, official classification × period rate formulas, and burst warnings are surfaced on `ActionNode.tsx`, `WatcherNode.tsx`, `ScreenerNode.tsx`, and in `EditNodeModal.tsx`.
3. **DSL Safety:** Always use `expr-eval` (never `eval()`). The DSL supports `AND`, `OR`, `>`, `<`, `>=`, `<=`, `==`, `!=`, and arithmetic (e.g. `volume > 2 * avg_volume`).
4. **SWR Polling Smoothness:** Node updates from SWR should NOT disturb user's current zoom/pan viewport.
5. **API Key Session-Only:** The Sectors API key lives in React state only. Any backend route that needs it must receive it per-request (e.g. in request body or header). Never assume it's available server-side.
6. **Cycle Counter Reset:** When clearing the Activity Feed, ALL watcher cycle counters reset to 0 in SQLite.
7. **FileNode OS Reveal:** `POST /api/file/open-location` opens the OS file manager — only works in local dev, not production.
8. **MingCute Loading:** Icons are loaded via CSS font from `public/mingcute/Mingcute.css`. Import it in `layout.tsx`. Use `<MingIcon name="mgc_xxx_line" />` — check Mingcute.css for valid icon names.
9. **Multi-canvas isolation:** Each canvas has its own `canvasId`. The engine route (`/api/engine/trigger`) must always scope to the correct canvas ID.
10. **No WebSockets:** Short-polling via SWR only (2s). Intentional — simpler and robust enough for demo scale.
11. **Bun only:** Do not use `npm` or `yarn`. All commands use `bun`, `bunx`, `bun run`.
12. **Mock Poll Randomization:** Mock market polling in `sectorsApi.ts` applies realistic per-call randomized distributions (±0–7% price movements, volume multipliers) so nodes update dynamically during offline demos.
13. **Turbopack `fs` warnings:** 3 pre-existing warnings about `fs.existsSync`/`fs.statSync`/`path.resolve` in `src/app/api/file/open-location/route.ts` appear in `bun run build` — not actionable, ignore.



---

## 12. Dev Commands

```bash
bun dev                           # Start dev server → http://localhost:3000
bun run build                     # Production build (run to check for TS errors)
bun run prisma/seed.ts            # Reset & seed demo canvas
bun run src/server/test-engine.ts # Smoke test the graph engine directly
bunx prisma db push               # Push schema changes to dev.db
bunx prisma studio                # Visual DB browser
bun test                          # ⚠️ Run ALL unit tests — must stay green (128 tests across 10 suites, ~140ms)
bun run test:watch                # Run tests in watch mode during development
bun run test:coverage             # Run tests with coverage report
```

---

## 13. Context Document Index (`context/` folder)

All historical plan documents are in `context/`. Key ones to reference:

| File | What It Covers |
|---|---|
| `SESSION_CHANGELOG.md` | ⭐ Most recent session changes — read this first for a quick catch-up |
| `CHECKPOINT.md` | Implementation status snapshot (pre-session) |
| `BACKLOG.md` | Open features & Sectors API v2 integration candidates |
| `TESTING_PLAN.md` | ⭐ Full 3-tier testing strategy & mandate — **read before adding any new feature** |
| `CURRENT_ENDPOINT.md` | Active vs. planned Sectors API endpoint mapping |
| `ENDPOINTS.md` | All 32 Sectors API v2 endpoints reference |
| `CONTEXT.md` | Original master contracts & TypeScript interfaces |
| `THEME_SWITCHER_PLAN.md` | 3-mode theme color tokens |
| `MULTI_PROJECT_TABS_PLAN.md` | URL routing & multi-canvas architecture |
| `SAVE_OPEN_SCRIFFLE_PLAN.md` | .scriffle file format & restore API |
| `ACTIVITY_FEED_BACKTRACKING_PLAN.md` | Feed labels, camera pan, chain glow |
| `IMAGE_FEATURES_PLAN.md` | Image upload, clipboard paste, NodeResizer |
| `FUNDAMENTAL_REPORT_ACTION_PLAN.md` | Company report action + PDF export |
| `SPIKE_DEVTOOL_PLAN.md` | DevSpikeTool + toast system |
| `KEYBOARD_SHORTCUTS_PLAN.md` | All keyboard shortcuts |
| `SECTORS_API_KEY_LIVE_POLL_PLAN.md` | API key session management |
| `FILE_NODE_PLAN.md` | Universal FileNode architecture |
| `AUTO_EXPORT_AND_DOWNLOAD_STATUS_PLAN.md` | Auto-export to disk & FileNode download status indicator |
| `TOP_MOVERS_RANKING_LEADERBOARD_PLAN.md` | Top Gainers & Losers Leaderboard display, official query params & engine fix |
| `MULTI_SYMBOL_EXPORT_AND_PEER_WATCHER_PLAN.md` | Multi-symbol PDF report export & dynamic peer watcher automation |
| `NAVIGATION_PLAN.md` | Spotlight Search (Cmd+K/Cmd+F), Keyboard Shortcuts Guide (?), and Zoom Presets (Shift+1) |
| `SCRIFFLE_AI_SPEC.md` | ⭐ Standalone AI prompt & .scriffle format specification manual for LLMs (ChatGPT, Claude, Gemini, Cursor) |
| `WATCHER_CLEAN_INITIAL_STATE_PLAN.md` | Watcher node clean initial state implementation (Rank 4 sprint) |
| `CREDIT_COST_BADGES_PLAN.md` | API credit cost badges & burst warning notices (Rank 3 sprint) |
| `TOP_MOVERS_API_FIX_AND_ERROR_TRANSPARENCY_PLAN.md` | Top Movers `/v2/companies/top-changes/` 400 bug fix & error UI (Rank 1 & 2 sprint) |


---

## 14. Testing Architecture (Implemented)

> **IMPORTANT FOR ALL AGENTS:** The project has a live unit test suite. Run `bun test` before and after any change. All 128 tests must stay green.

### Current State
- **Tool:** Vitest v5 (`bun test` / `bun run test:watch` / `bun run test:coverage`)
- **128 tests, 0 failures, ~140ms runtime**
- **Config:** `vitest.config.ts` at project root (has `@` path alias wired to `./src`)

### Test File Map
```
src/__tests__/
├── fixtures/
│   └── marketEvents.ts              ← Shared MarketEvent mocks (BBCA_SURGE, TLKM_DROP, MOCK_GAINERS, MOCK_LOSERS, etc.)
└── unit/
    ├── dslEngine.test.ts             ← 30 tests — all DSL operators, AND/OR compounds, camelCase aliases, edge cases
    ├── interpolateTemplate.test.ts   ← 20 tests — all ${variables}, volume formatting (K/M/B), edge cases
    ├── leaderboard.test.ts           ← 20 tests — gainers/losers formatting, rank indicators, empty input, mock movers fallback
    ├── screenerNote.test.ts          ← 15 tests — screener output structure, company rows, fallbacks
    ├── searchIndexer.test.ts         ← 15 tests — fuzzy node search indexing, ticker, rule & sticker emoji matching
    ├── spatialNavigator.test.ts      ← 8 tests — Tab / Shift+Tab non-oscillating spatial & connected traversal with wrap-around
    ├── reportRevision.test.ts        ← 3 tests — in-place dynamic report revisions (Rev 1, Rev 2+) & disk overwrite
    ├── watcherInitialState.test.ts   ← 5 tests — watcher node clean idle state on create & restore (Rank 4 sprint)
    ├── creditCosts.test.ts           ← 7 tests — centralized pricing registry, burst calculations (Rank 3 sprint)
    └── topMoversApi.test.ts          ← 3 tests — param builder omits 'all' classifications, structured error capture (Rank 1&2 sprint)
```

### Exported Test-Friendly Functions in `graphEngine.ts`
These were made `export` specifically to enable unit testing (previously private):
- `interpolateTemplate(template, event)` — template variable substitution
- `generateDefaultNoteContent(event)` — auto-generated note for triggered market events
- `generateLeaderboardNoteContent(movers, mode, period)` — radar watcher leaderboard formatter
- `generateScreenerNoteContent(query, results, queryValues)` — AI screener output formatter

### ⚠️ THE TESTING MANDATE — APPLIES STRICTLY TO CODE CHANGES

**When writing/editing code (TypeScript, TSX, React Flow components, API routes, engines):**
- Adding any new feature = adding new unit tests covering all input branches and edge cases.
- Run `bun test` only when **actual application code** (`.ts`, `.tsx`) has been modified.
- Keep all unit tests 100% green.

> [!CAUTION]
> **NO TESTS FOR IMPLEMENTATION PLANS / MARKDOWN / SPECS**:
> When writing, updating, or reviewing implementation plans (e.g. `*_PLAN.md`), specifications (`SCRIFFLE_AI_SPEC.md`), backlog/status tracking, or documentation, you must **NEVER** run `bun test` or ask to execute tests. Markdown documents require zero test runs.

> [!CAUTION]
> **STRICT PROHIBITION ON SUBAGENTS**:
> **DO NOT CREATE OR INVOKE SUBAGENTS** (`invoke_subagent`, `define_subagent`). All tasks, file operations, searches, and reasoning must be performed directly within the main agent context to prevent wasteful token/quota consumption.
