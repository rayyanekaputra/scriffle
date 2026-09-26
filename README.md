# Scriffle

**Scriffle** is an event-driven visual workflow whiteboard designed for financial market research on **Indonesian stocks** (IDX), powered by the [Sectors.app API](https://sectors.app).

Think **FigJam × n8n**, but purpose-built for the stock market:
- Build a whiteboard of connected nodes (market data triggers, rule evaluators, automated sticky notes, rich Discord alerts, research files, and self-spawning pipelines).
- The background engine monitors IDX market data and **auto-mutates the canvas in real time** without user interaction.
- Presentation & control drawers let presenters stream live ticks or realistic mock market distributions for seamless live pitch demonstrations.
- Interactive **Spotlight Tour & 6-Mission Guided Sandbox Tutorial** teaches you every capability through live canvas action detection.

> *"Too many platforms to switch between for research. Scriffle lets you automate data fetching and brainstorm visually — all in one canvas."*

Built for the **Sectors 2026 Hackathon** by **thelast10years** / [rayyanekaputra](https://github.com/rayyanekaputra).

---

## ⚡ First Start & Quickstart

### Prerequisites
- [Bun](https://bun.sh) (v1.4.0+)
- Node.js 20+

### Installation & Setup

1. **Clone and Install:**
   ```bash
   git clone https://github.com/rayyanekaputra/scriffle.git
   cd scriffle
   bun install
   ```

2. **Initialize Database:**
   ```bash
   bunx prisma db push
   bun run prisma/seed.ts
   ```

3. **Start Development Server:**
   
   **Standard Start:**
   ```bash
   bun run dev
   ```
   
   **Fresh Demo Mode (Recommended for first run & live pitches):**
   ```bash
   bun run dev --start-fresh
   ```
   > 💡 **What `--start-fresh` does:**
   > - Non-destructively creates a brand-new project board in SQLite (never overwrites or deletes historical canvases).
   > - Seeds clean starter nodes with `cycleCount: 0` and empty logs.
   > - Resets the **Spotlight Onboarding Tour** to Step 1 and the **6 Hands-On Missions** to 0/6 pending.

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎯 Key Capabilities

- **10 Distinct Node Types**: 6 automated graph nodes (`watcher`, `condition`, `note`, `alert`, `action`, `screener`) and 4 visual annotation nodes (`text`, `sticker`, `image`, `file`).
- **Interactive Spotlight Tour & 6-Mission Sandbox Challenge**: Guided onboarding with live DOM spotlight masking, *"Don't show on startup"* preferences, and real-time task detection checking off missions as you build on canvas.
- **Curated 150+ IDX Stock Chooser**: Instant `<0.3ms` token & keyword matcher across Indonesian listed companies (`popularIdxCompanies.ts`), surfacing top 12 blue chips (`BBCA`, `BBRI`, `BMRI`, `TLKM`, `ASII`, `GOTO`, `ADRO`, etc.) with AI screener fallback.
- **AI Natural Language Company Screener**: Plain English queries (e.g. *"top 5 banks by market cap"*, *"coal mining companies with high dividend"*) dynamically resolving to IDX company rankings and streaming downstream.
- **Top Movers Leaderboard & Radar**: Live ranked Top Gainers & Losers from `/v2/companies/top-changes/` with theme-aware rank badges (#1 gold, #2 silver, #3 bronze).
- **Dual-Branching Condition Nodes**: Upper **True** (Emerald) and lower **False** (Rose) ports with branch-aware BFS traversal.
- **Native Discord Webhook Alerts**: Formatted financial embed cards with dynamic sentiment colors (Mint for gains, Coral for drops), volume statistics, and 1-click test ping.
- **Institutional Fundamental Briefs**: Action nodes auto-generate and export HTML/PDF briefs directly to disk (`reports/`) with dynamic in-place `Rev 2+` revision updates.
- **Quick-Add Flow Auto-Wiring**: Floating `[+]` port handles and drag-to-empty-canvas drop popover with spatial collision avoidance.
- **Multi-Theme Engine**: Built-in Light, Mono (warm-paper `#F4F3EF`), and Dark (soft charcoal `#0F1014`) modes, plus plain-text `.scrifflemes` custom themes (Bloomberg Terminal, Nord, Gruvbox, Tokyo Night, Solarized Dark).
- **Multi-Project Workspace**: URL-based project tabs (`/b/[id]`), project switcher modal, and atomic `.scriffle` file export/restore.
- **Figma-Style Canvas Ergonomics**: 8-point multi-selection bounding box, grouping (`Ctrl+G` / `Ctrl+Shift+G`), isolation focus mode, Spotlight Search (`Ctrl+K`), and spacious Keyboard Shortcuts modal (`?`).
- **Institutional Design System**: 2px flat outline system, zero drop shadows, MingCute icons, and `Stack Sans Text` typography (zero all-caps, zero spaced letters).

---

## 🧩 The Node System

| Category | Node Type | Description & Purpose |
|---|---|---|
| **Engine** | **AI Screener** (`screener`) | Natural language IDX screener (`/v2/companies/?q=...`) with stat capsules and 3 AI credit badge. |
| **Engine** | **Watcher** (`watcher`) | Radar sticker monitoring individual tickers or ranked Top Gainers / Losers leaderboard. |
| **Engine** | **Condition** (`condition`) | Yellow rule capsule evaluating safe boolean expressions via `expr-eval` with dual True/False output handles. |
| **Engine** | **Sticky Note** (`note`) | Tactile FigJam sticky note (5 pastel colors) with direct inline editing and `${variable}` interpolation. |
| **Engine** | **Alert** (`alert`) | Real-time notification sticker delivering UI toasts and rich financial embeds to Discord Webhooks. |
| **Engine** | **Action** (`action`) | Canvas mutation capsule auto-spawning sticky notes, peer watchers, or generating fundamental research briefs. |
| **Annotation** | **Text Block** (`text`) | Freeform WYSIWYG markdown text with formatting toolbar, font scale (`Title`, `Header`, `Body`, `Caption`), and `T` hotkey. |
| **Annotation** | **Sticker** (`sticker`) | Badge stickers with inline quick emoji popovers, 32-emoji grid picker, and 7-color palette. |
| **Annotation** | **Image Studio** (`image`) | Aspect-ratio locked transparent PNG node with `<NodeResizer />` and `Ctrl+V` clipboard paste. |
| **Annotation** | **File / PDF** (`file`) | File attachment with category icons, browser preview, copy link, OS folder reveal, and `✓ Saved` indicators. |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router, Turbopack), [React 19](https://react.dev), TypeScript |
| **Interactive Canvas** | [@xyflow/react](https://reactflow.dev) (React Flow v12) |
| **Styling & System** | [Tailwind CSS v4](https://tailwindcss.com), 2px flat outline system (zero drop shadows) |
| **Typography & Icons** | **Stack Sans Text** (Google Fonts) & **MingCute Icons** (local webfont) |
| **Database & ORM** | SQLite (`prisma/dev.db`) + [Prisma 5.22.0](https://www.prisma.io) |
| **Sync & State** | [SWR](https://swr.vercel.app) short-polling (2s cadence) |
| **Expression Evaluator** | [expr-eval](https://github.com/silentmatt/expr-eval) (safe boolean DSL, zero insecure `eval()`) |
| **Market Data** | [Sectors.app API v2](https://sectors.app) + randomized realistic offline mock fallback |
| **Runtime & Testing** | [Bun](https://bun.sh) (v1.4.0+), [Vitest](https://vitest.dev) |

---

## 🔑 API Key & Dual Modes

- **Mock / Offline Mode (Default)**: No API key or `.env` configuration required. Realistic randomized distributions are generated for `BBCA`, `BBRI`, `BMRI`, `TLKM`, `ASII`, and Top Movers. Perfect for offline development and stage demos without consuming live API credits.
- **Live Sectors API Mode**: Enter your `SECTORS_API_KEY` into the top toolbar or Control Panel. The key is strictly **session-only** (held in React memory) and is never persisted to SQLite, localStorage, or export files.
- **Credit Cost Awareness**: Built-in credit badges display Sectors API token rates (e.g. `🪙 10 credits / poll` for Top Movers, `🪙 8 credits` for fundamental briefs, `🪙 3 credits` for AI screener queries).

---

## 🎛️ Control Panel & Data Streaming

Open the **Control Panel** drawer from the top navbar:
- **Market Data Stream**:
  - **Do Once**: Executes a single market poll tick across active watcher nodes.
  - **Stream Data**: Starts continuous per-node interval polling with live TopNav hairline progress indication.
- **Project Files**:
  - **New File**: Instantly creates a clean, independent `/b/[uuid]` whiteboard.
  - **Open File**: Native file picker accepting `.scriffle` and `.json` files.
  - **Save File**: Downloads `<canvas_name>.scriffle` (UTF-8 JSON formatted) containing all nodes, edges, and configurations.
- **Examples**: One-click starter workflow presets (*Rotation Engine*, *Momentum Breakout Loop*, *Banking Sector Trio*).

---

## ⌨️ Keyboard Shortcuts

Press `?` anywhere on the whiteboard to view the full cheat sheet:

| Shortcut | Action |
|---|---|
| `V` / `H` | Switch between Move (Select) and Hand (Pan) tool |
| `T` | Drop freeform Text block at mouse cursor |
| `Ctrl+K` / `Ctrl+F` | Open Spotlight Quick Search with smooth camera fly-to-node |
| `Ctrl+G` | Group selected nodes into a cohesive container |
| `Ctrl+Shift+G` | Ungroup container |
| `Ctrl+C` / `Ctrl+V` | Copy and paste nodes (with internal edge preservation) |
| `Ctrl+D` | Duplicate selection in-place with offset |
| `Ctrl+Z` / `Ctrl+Shift+Z` | Undo / Redo canvas operations |
| `Shift+1` | Fit all nodes to screen |
| `Shift+0` / `Ctrl+0` | Reset zoom to 100% |
| `Tab` / `Shift+Tab` | Spatial and graph edge keyboard traversal |
| `?` or `Shift+/` | Open Keyboard Shortcuts Guide modal |

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/canvas?id=<id>` | Fetch full canvas graph (nodes, edges, logs) |
| `POST` | `/api/canvas/nodes` | Create a new node on the active canvas |
| `PATCH` | `/api/canvas/nodes/:id` | Update node coordinates, dimensions, or config |
| `DELETE` | `/api/canvas/nodes/:id` | Delete node and automatically prune connected edges |
| `POST` | `/api/canvas/edges` | Create connector edge with custom `fromHandle` |
| `DELETE` | `/api/canvas/edges/:id` | Delete edge |
| `GET` | `/api/canvas/list` | List all saved canvas projects with node counts |
| `POST` | `/api/canvas/restore?id=<id>` | Atomic replace canvas from `.scriffle` with collision-safe ID remapping |
| `POST` | `/api/engine/trigger` | Trigger live Sectors API poll or randomized mock run |
| `GET` | `/api/logs` | Fetch real-time engine activity execution logs |
| `POST` | `/api/alert/test-webhook` | Test ping Discord webhook with live status response |
| `GET` | `/api/export/report?symbol=<sym>` | Institutional borderless fundamental HTML report |
| `POST` | `/api/file/open-location` | Reveal exported report folder in OS file manager (local dev) |

---

## 🧪 Automated Test Suite

Scriffle maintains a comprehensive unit test suite with 100% pass rate:

```bash
bun test
```

- **229 unit tests across 24 test suites** executing in ~215ms.
- Covers safe DSL evaluation (`dslEngine`), template interpolation, Top Movers leaderboard generation, AI Screener formatting, Indonesian company fuzzy search (`companySearch`), spatial navigation, `.scrifflemes` theme parser, dual Condition output branching, Discord Webhooks, Onboarding Spotlight Tour, Hands-On Sandbox Missions validation, and `--start-fresh` CLI reset engine.

---

## 📂 Project Structure

```
scriffle/
├── context/                        # Historical specs, architecture & QA plans
├── prisma/
│   ├── schema.prisma               # Prisma SQLite schema (Canvas, Node, Edge, Log)
│   └── seed.ts                     # Comprehensive demo canvas seeder
├── presets/                        # Starter .scriffle preset blueprints
├── public/mingcute/                # MingCute icon font & styles
├── reports/                        # Auto-exported fundamental HTML/PDF briefs (git-ignored)
├── scripts/
│   ├── dev.ts                      # Dev runner supporting --start-fresh flag
│   └── start.ts                    # Production runner supporting --start-fresh flag
├── themes/                         # Plain-text .scrifflemes theme presets
└── src/
    ├── app/
    │   ├── api/                    # REST API routes (canvas, engine, export, alert)
    │   ├── b/[id]/page.tsx         # Multi-project URL routing
    │   ├── globals.css             # Stack Sans Text, flat outline & theme CSS variables
    │   └── layout.tsx              # Root HTML layout and webfont imports
    ├── components/
    │   ├── canvas/
    │   │   ├── MarketCanvas.tsx    # React Flow canvas, context menu, drop listeners
    │   │   ├── ContextMenu.tsx     # Canvas & node right-click menus
    │   │   ├── SelectionBoundingBox.tsx # 8-point multi-selection transform box
    │   │   └── nodes/              # 10 node components (Watcher, Screener, Text, etc.)
    │   ├── controls/
    │   │   ├── TopNav.tsx          # Top header bar, search trigger, theme switcher
    │   │   ├── NavToolbar.tsx      # Floating bottom node insertion toolbar
    │   │   ├── SimulationBar.tsx   # Control Panel drawer (streaming, project files)
    │   │   ├── EditNodeModal.tsx   # Comprehensive node configuration editor
    │   │   ├── ShortcutsModal.tsx  # Keyboard shortcuts guide
    │   │   ├── SpotlightSearchModal.tsx # Fuzzy search modal
    │   │   └── ThemeModal.tsx      # Theme selector & .scrifflemes manager
    │   ├── onboarding/             # Spotlight Tour (SpotlightOverlay, TourCardPopover, ResumeTourPill)
    │   ├── tutorial/               # Guided Missions (SandboxMissionsCard, missionValidator)
    │   └── feed/
    │       └── ActivityFeed.tsx    # Live execution feed with camera pan & chain glow
    ├── context/                    # React Contexts (Loading, Theme, Onboarding, SandboxTutorial)
    ├── lib/
    │   ├── freshProjectCreator.ts  # Non-destructive project creator for --start-fresh
    │   ├── creditCosts.ts          # Centralized Sectors API credit registry
    │   └── search/companySearch.ts # <0.3ms in-memory Indonesian company matcher
    ├── server/services/
    │   ├── dslEngine.ts            # Safe expr-eval boolean evaluator
    │   ├── graphEngine.ts          # BFS graph traversal & canvas self-mutation engine
    │   ├── sectorsApi.ts           # Sectors.app API v2 client + randomized mock engine
    │   ├── discordWebhook.ts       # Discord webhook notification service
    │   └── reportExporter.ts       # HTML fundamental report disk auto-exporter
    └── types/
        └── canvas.ts               # Master TypeScript interfaces
```

---

## 🏆 Hackathon Submission

Developed for the **Sectors 2026 Hackathon**.
- **Problem Statement**: Market analysts and active investors are forced to juggle between disconnected platforms — terminal feeds, Excel spreadsheets, messaging groups, broker apps, and charting software.
- **Solution**: Scriffle collapses research, screening, and automation into a single living canvas where market events trigger automatic note-taking, notifications, and workflow mutations in real time.
