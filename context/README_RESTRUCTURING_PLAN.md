# Implementation Plan: User-First README & Documentation Restructuring

**Target files:** `README.md` (rewrite) · `TECHNICAL_GUIDE.md` (new file)

---

## 1. Objectives & Design Principles

1. **Non-intimidating, user-first writing**: Write for stock market analysts, retail investors, and
   curious first-timers — not backend engineers. The first read should feel like discovering a product,
   not reading a deployment guide.

2. **Prose before commands**: Explain what Scriffle is and why someone would want it before showing
   a single line of terminal output. Non-technical users need the mental model first; the install
   command is a consequence of being convinced, not the introduction.

3. **Zero emojis**: Remove all decorative emoji from headings, lists, and tables. Use clean
   typographic hierarchy and indentation instead. The only acceptable exception is emoji *inside*
   node content examples where it represents the actual product output (e.g. a sticker node displaying 📈).

4. **Audience bifurcation**: Two files, two audiences.
   - `README.md` → Product overview for everyone.
   - `TECHNICAL_GUIDE.md` → Architecture, API, testing, and extension guide for contributors and
     technical evaluators (e.g. hackathon judges who want to inspect the implementation).

5. **Anchor navigation**: In-page anchor links at the top of README.md allow any reader to jump
   to their relevant section immediately. GitHub renders these natively.

6. **Real-world IDX examples in plain English**: Every node gets one concrete scenario written
   for someone who knows what `BBCA` is but has never touched a terminal.

7. **Preset links using relative paths**: All links to `presets/` files must be relative
   (e.g. `./presets/banking_sector_watcher.scriffle`) — `file://` absolute paths break on GitHub.

---

## 2. File Strategy

```
scriffle/
├── README.md               ← Rewrite: user-facing, friendly, no emojis, anchor nav
├── TECHNICAL_GUIDE.md      ← New: REST API, architecture, DSL syntax, test suite, .scriffle spec
├── presets/                ← Linked from README with relative paths
│   ├── banking_sector_watcher.scriffle
│   ├── idx_bluechip_rotation_engine.scriffle
│   ├── idx_momentum_breakout.scriffle
│   ├── idx_macro_alpha_intelligence.scriffle
│   └── idx_omnibus_alpha_command_center.scriffle
└── context/
    └── README_RESTRUCTURING_PLAN.md   ← This file
```

---

## 3. New `README.md` — Section-by-Section Blueprint

### Section 1: Hero & Sectors API Emphasis

**Title**: `Scriffle`

**Tagline**: A visual research workspace for Indonesian stocks, powered by the
[Sectors.app API](https://sectors.app).

**One-liner pitch** (blockquote):
> Too many platforms to switch between for research. Scriffle lets you automate data fetching
> and brainstorm visually — all in one canvas.

**Sectors API as the core power source** — this must come first, not as a footnote.
Frame it clearly: Scriffle is built on the Sectors.app API. The API is what makes live
market data, AI company screener queries, fundamental reports, and Top Movers leaderboards
work. The product only reaches its full capability with a Sectors API key.

Suggested prose:
> Scriffle connects to the [Sectors.app API](https://sectors.app) to pull live IDX price data,
> run AI-powered stock screener queries, and generate institutional research briefs on demand.
> Get your free API key at [sectors.app](https://sectors.app) and paste it into the top toolbar
> when you open the app.

**Offline / tryout mode** — framed as a convenience for first run, not the headline:
> If you don't have a key yet, Scriffle runs on realistic simulated IDX data so you can explore
> the canvas, load example templates, and follow the guided tour without waiting.

**Trust signals** (repositioned — secondary to API emphasis):
- No account or signup required beyond your Sectors API key.
- The API key is held in memory for your session only. It is never saved to disk.
- Everything else runs locally on your machine.

**Anchor navigation bar** — one line, pipe-separated:

```
How It Works  ·  Quickstart  ·  Nodes  ·  Example Templates  ·  Shortcuts  ·  For Developers
```

Each word links to its heading anchor.

---

### Section 2: How It Works

> This comes *before* Quickstart intentionally. Users need to understand what they're installing
> before they open a terminal.

Three plain-English steps — no code, no jargon:

1. **Watch**: Drop a Watcher card onto the canvas. Point it at any Indonesian stock (e.g. BBCA)
   or ask it to track today's top gainers. It polls live price data from Sectors automatically.

2. **Filter**: Connect a Condition card and write a plain rule — like "if the price moved more
   than 3.5% today". The canvas routes data down the True branch or the False branch depending
   on the result.

3. **Act**: Connect the output to a Sticky Note, a Discord Alert, or a Research Action. Scriffle
   executes automatically — updating your notes, notifying your team, or generating a full
   fundamental report — without you clicking anything.

---

### Section 3: Quickstart

Frame this as a single, confident action — not a multi-step checklist.

**Opening prose** (before any code blocks):
> Download Scriffle and run the installer. It detects your environment, sets up the local database,
> and opens the app in your browser automatically. No configuration files to edit.

**macOS / Linux**:
```bash
git clone https://github.com/rayyanekaputra/scriffle.git
cd scriffle
./setup.sh
```

**Windows**:
```cmd
git clone https://github.com/rayyanekaputra/scriffle.git
cd scriffle
setup.bat
```

**Starting again later**:
```bash
bun run dev
```

**Starting a fresh board for a live demo or presentation**:
```bash
bun run dev --start-fresh
```
Briefly explain what `--start-fresh` does in one sentence: creates a clean new canvas, resets
the onboarding tour, and preserves all your previous project files.

**Connecting to Sectors** — immediately after install, not buried:
> Once the app opens, paste your Sectors API key into the toolbar at the top of the screen to
> enable live market data. Get a free key at [sectors.app](https://sectors.app). Without a key,
> the app runs on simulated data so you can explore the interface before going live.

---

### Section 4: The Nodes

Introductory sentence: *Scriffle has ten types of cards. Six run your automation logic. Four are
for freeform thinking and annotation.*

#### Automation cards

Present as a definition list — name, one sentence of plain English, one real-world example.

| Card | What it does | Example |
|---|---|---|
| AI Screener | Searches all Indonesian listed stocks using plain language | *"Top 5 banks by market cap"* or *"Coal miners with dividend yield above 8%"* |
| Watcher | Tracks a stock's live price, or ranks today's top gainers and losers | Monitor BBCA tick by tick, or show the 5 biggest movers since market open |
| Condition | Routes data down a True or False path based on a simple rule you write | *If price moved more than 3.5% and volume was above 1 million, take the True path* |
| Sticky Note | Auto-updates its text when triggered — fills in live values automatically | Writes *"BBCA surged 4.2% at 10:15 AM"* the moment the condition fires |
| Alert | Sends a notification to your browser or a Discord channel | Posts a formatted market card to your team's Discord server when a breakout triggers |
| Action | Creates new cards or generates a research file — automatically, on trigger | Generates a PDF fundamental brief for a breakout stock and saves it to your reports folder |

#### Annotation and brainstorming cards

| Card | What it does |
|---|---|
| Text block | Freeform notes with heading styles, bold, italic, and highlight markers |
| Sticker | Emoji badges and status tags — useful for labelling sections of your canvas |
| Image | Drop in screenshots or chart images. Paste from clipboard with Ctrl+V |
| File | Attach a document or research brief. Preview it in the browser or open its folder |

---

### Section 5: Example Templates

Introductory note: *The easiest way to get started is to load one of these example canvases.
Open the Control Panel, click "Open File", and select any file below — or drag and drop it
directly onto the canvas.*

All links use relative paths to the repo:

| Template | What it shows |
|---|---|
| [Banking Sector Watcher](./presets/banking_sector_watcher.scriffle) | Tracks BBCA, BBRI, and BMRI simultaneously. Routes breakout signals to alerts |
| [Bluechip Rotation Engine](./presets/idx_bluechip_rotation_engine.scriffle) | Watches capital movement across the IDX blue chip index |
| [Momentum Breakout Loop](./presets/idx_momentum_breakout.scriffle) | Flags high-volume price moves and fires a Discord notification automatically |
| [Macro Alpha Intelligence](./presets/idx_macro_alpha_intelligence.scriffle) | Multi-branch canvas combining macro signals with fundamental research generation |
| [Omnibus Alpha Command Center](./presets/idx_omnibus_alpha_command_center.scriffle) | A complete trading desk layout. Demonstrates all ten card types working together |

---

### Section 6: Keyboard Shortcuts

Introductory note: *Press `?` anywhere on the canvas to open the full interactive shortcuts guide.*

| Key | Action |
|---|---|
| `V` / `H` | Switch between Select and Pan tools |
| `T` | Drop a Text block at the mouse cursor |
| `Ctrl+K` | Spotlight search — jumps the camera to any card |
| `Ctrl+G` / `Ctrl+Shift+G` | Group / ungroup selected cards |
| `Ctrl+Shift+T` | Tidy up — redistributes overlapping cards automatically |
| `Ctrl+C` / `Ctrl+V` | Copy and paste cards (preserves connectors) |
| `Ctrl+D` | Duplicate selection |
| `Ctrl+Z` / `Ctrl+Shift+Z` | Undo / Redo |
| `Shift+1` | Fit all cards to screen |
| `?` | Open shortcuts guide |

---

### Section 7: For Developers

A single concise callout — not a full technical breakdown:

> Full technical documentation is in [TECHNICAL_GUIDE.md](./TECHNICAL_GUIDE.md). It covers
> the REST API, system architecture, the `.scriffle` file format, DSL rule syntax, how to add
> new node types, and the automated test suite.

---

### Section 8: Built By

- Built for the Sectors 2026 Hackathon by **thelast10years**
  ([@rayyanekaputra](https://github.com/rayyanekaputra) & [@artyaaryatama](https://github.com/artyaaryatama))
- Problem: Market analysts juggle disconnected platforms — terminal feeds, spreadsheets,
  broker apps, and charting tools simultaneously.
- Solution: Scriffle collapses research, screening, and automation into a single living canvas
  where market events trigger automatic note-taking, alerts, and workflow mutations in real time.

---

## 4. New `TECHNICAL_GUIDE.md` — Section-by-Section Blueprint

This is the document for contributors, hackathon technical judges, and developers extending the project.

### 1. System Architecture

- Stack overview table: Next.js 16, React 19, @xyflow/react, Tailwind CSS v4, SQLite + Prisma 5, SWR, expr-eval, Bun v1.4+.
- Data flow narrative + ASCII diagram:
  ```
  Sectors API / Mock Engine
        ↓
  POST /api/engine/trigger
        ↓
  graphEngine.ts (BFS traversal: Watcher → Condition → Note / Alert / Action)
        ↓
  SQLite via Prisma (node state, logs, cycle counters)
        ↓
  SWR 2s poll → React Flow re-render
  ```
- Notes on intentional design decisions: no WebSockets (SWR polling is robust enough at demo scale), session-only API key (never persisted), Bun runtime exclusively.

### 2. REST API Reference

Full endpoint table:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/canvas?id=<id>` | Full canvas state (nodes, edges, logs) |
| POST | `/api/canvas/nodes` | Create node |
| PATCH | `/api/canvas/nodes/:id` | Update position or config |
| DELETE | `/api/canvas/nodes/:id` | Delete node and prune connected edges |
| POST | `/api/canvas/edges` | Create edge with optional `fromHandle` |
| DELETE | `/api/canvas/edges/:id` | Delete edge |
| GET | `/api/canvas/list` | All saved canvases with metadata |
| POST | `/api/canvas/restore?id=<id>` | Atomic canvas replace with collision-safe ID remapping |
| POST | `/api/engine/trigger` | Run live API poll or randomized mock tick |
| GET | `/api/logs` | Recent engine execution logs |
| POST | `/api/alert/test-webhook` | Test Discord webhook ping |
| GET | `/api/export/report?symbol=<sym>` | Generate fundamental HTML report |
| POST | `/api/file/open-location` | Reveal file in OS file manager (local dev only) |

### 3. The `.scriffle` File Format

- JSON structure: `{ canvas: { name, id }, nodes: [...], edges: [...] }`.
- Node shape: `{ id, type, position: { x, y }, config: <TypedConfig> }`.
- Edge shape: `{ id, fromId, toId, fromHandle: 'true' | 'false' | null }`.
- Explain that `restore` API performs ID remapping to prevent collision when loading across
  multiple project tabs.
- Example minimal `.scriffle` snippet for a Watcher → Condition → Note chain.

### 4. DSL Rule Syntax (Condition Nodes)

- Powered by `expr-eval` (safe, no raw `eval()`).
- Available variables: `price`, `price_change`, `volume`, `rank`.
- Supported operators: `>`, `<`, `>=`, `<=`, `==`, `!=`, `AND`, `OR`, arithmetic.
- Example rules:
  - `price_change > 5`
  - `price_change > 3.5 AND volume > 1000000`
  - `volume > 2 * 500000`

### 5. Adding a New Node Type (Extension Guide)

Step-by-step for contributors:
1. Add the type name to `NodeType` union in `src/types/canvas.ts`.
2. Create a config interface (e.g. `MyNodeConfig`) in the same file.
3. Build the React component in `src/components/canvas/nodes/MyNode.tsx`.
4. Register it in `MarketCanvas.tsx` (nodeTypes map).
5. Handle it in `graphEngine.ts` BFS traversal if it participates in automation.
6. Add it to context menus in `ContextMenu.tsx` and the toolbar in `NavToolbar.tsx`.

### 6. Development Commands

```bash
bun dev                        # Start dev server → localhost:3000
bun run build                  # Production build (also validates TypeScript)
bun run prisma/seed.ts         # Reset and seed the demo canvas
bunx prisma db push            # Push schema changes to dev.db
bunx prisma studio             # Open visual database browser
bun test                       # Run all unit tests (257 tests, 26 suites, ~200ms)
bun run test:watch             # Watch mode during development
bun run test:coverage          # Coverage report
```

### 7. Automated Test Suite

- Tool: Vitest v5 (`bun test`)
- **257 tests across 26 suites, 0 failures, ~200ms runtime**
- Coverage domains and file map:

| Test file | Domain |
|---|---|
| `dslEngine.test.ts` | Safe boolean DSL (all operators, AND/OR, edge cases) |
| `interpolateTemplate.test.ts` | Template variable substitution (`${symbol}`, `${price_change}`, etc.) |
| `leaderboard.test.ts` | Top Gainers/Losers leaderboard formatting |
| `screenerNote.test.ts` | AI Screener output structure and fallbacks |
| `searchIndexer.test.ts` | Fuzzy node search across tickers, rules, sticker emoji |
| `spatialNavigator.test.ts` | Tab/Shift+Tab keyboard traversal, non-oscillating wrap-around |
| `quickAddNavigator.test.ts` | Spatial offset collision avoidance, node recommendations |
| `themeEngine.test.ts` | `.scrifflemes` INI parser, serializer, CSS variables mapper |
| `edgeLabels.test.ts` | Contextual edge label auto-inference (true/false handle routing) |
| `conditionBranching.test.ts` | Dual output BFS routing, legacy null handle fallback |
| `discordWebhook.test.ts` | Webhook URL validation, embed formatting, timeout protection |
| `loadingState.test.ts` | LoadingContext task queue, runTracked, 12s auto-timeout |
| `onboarding.test.ts` | Spotlight Tour step logic, suppress preference persistence |
| `reportRevision.test.ts` | In-place dynamic report revision (Rev 1, Rev 2+, disk overwrite) |
| `watcherInitialState.test.ts` | Clean idle watcher state on create and restore |
| `creditCosts.test.ts` | Centralized Sectors API credit pricing registry |
| `topMoversApi.test.ts` | Param builder, 'all' classification omission, error capture |
| `companySearch.test.ts` | Indonesian company fuzzy matcher, keyword tokens, freeform entry |
| `tidyUpLayout.test.ts` | AABB overlap relaxation, centroid stability, dimension awareness |
| `sandboxTutorial.test.ts` | Hands-on mission validation, live canvas action detection |
| + 6 others | (`draggableWidget`, `imageNode`, `imageStudio`, `startFresh`, `stickerNode`, `tutorialPopover`) |

### 8. Custom Theme Engine (`.scrifflemes`)

- INI-style plain-text format. Users edit or create themes in any text editor.
- Parser (`themeParser.ts`) reads key=value pairs and maps them to CSS variables under `[data-theme]`.
- Bundled presets in `themes/`: Bloomberg Terminal, Nord Frost, Gruvbox Dark, Tokyo Night, Solarized Dark.
- Drag-and-drop a `.scrifflemes` file onto the canvas to apply it instantly.
- Example format and token reference table included here.

---

## 5. Review Checklist

- [ ] README hero section leads with trust signals (no account, no API key, local) before any install command
- [ ] "How It Works" section appears before "Quickstart" in the document order
- [ ] Zero emojis in README.md headings, tables, or bullet lists
- [ ] All preset links use relative paths (not `file://` absolute paths)
- [ ] Preset descriptions use plain financial language, not engineering jargon
- [ ] Every node type has a one-sentence plain English description and a concrete IDX example
- [ ] `TECHNICAL_GUIDE.md` includes DSL syntax reference, `.scriffle` format spec, and node extension guide
- [ ] Anchor links at the top of README resolve correctly on GitHub
- [ ] "For Developers" in README is a short callout, not a repeated technical breakdown
