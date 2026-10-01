# Implementation Plan: TECHNICAL_GUIDE.md

**Target file:** `TECHNICAL_GUIDE.md` (new file, project root)  
**Audience:** Contributors, hackathon technical evaluators, and developers extending Scriffle.

---

## 1. Purpose & Scope

The Technical Guide is a self-contained developer reference. It answers three classes of questions:

1. **How does the system work?** Architecture, data flow, key design decisions.
2. **How do I work with it?** Dev commands, API endpoints, database schema, file formats.
3. **How do I extend it?** Adding node types, writing tests, creating custom themes.

It is deliberately separate from `README.md` so the user-facing document stays clean. Any content
that requires understanding code, terminal commands, or JSON structures belongs here.

---

## 2. Section-by-Section Blueprint

---

### Section 1: Tech Stack

A single table. Referenced briefly so developers can orient before reading further.

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| Canvas | `@xyflow/react` (React Flow v12) |
| Styling | Tailwind CSS v4, 2px flat outline system |
| Typography & Icons | Stack Sans Text (Google Fonts), MingCute Icons (local webfont) |
| Database & ORM | SQLite (`prisma/dev.db`) + Prisma 5.22.0 |
| Sync & Polling | SWR — 2s short-poll on `/api/canvas` and `/api/logs` |
| Expression Evaluator | `expr-eval` — safe DSL, no raw `eval()` |
| Market Data | Sectors.app API v2 + randomized mock engine |
| Runtime & Tests | Bun v1.4+, Vitest v5 |

---

### Section 2: System Architecture

#### 2.1 Design Decisions Worth Knowing

Two short notes before the diagram, to explain intentional constraints:

- **No WebSockets.** SWR polling at 2s cadence is robust enough for demo scale and avoids
  connection state management overhead. Each page refresh is safe.
- **Session-only API key.** The Sectors API key is held only in React state for the lifetime
  of the browser tab. It is never written to SQLite, localStorage, `.env`, or `.scriffle` exports.
  Any API route that needs it must receive it per-request (in the request body or header).

#### 2.2 Data Flow Diagram

Render as an ASCII diagram (no external image dependency):

```
User Action / Market Poll Timer
          │
          ▼
POST /api/engine/trigger
  ├── Sectors API live data (if API key provided)
  └── Randomized mock engine (if no key — realistic ±0–7% distributions)
          │
          ▼
graphEngine.ts
  ├── BFS traversal starting from Watcher / Screener nodes
  ├── Evaluates Condition rules via dslEngine.ts (expr-eval)
  ├── Executes downstream Note / Alert / Action nodes
  └── Action mutations: spawns nodes, calls reportExporter.ts, fires discordWebhook.ts
          │
          ▼
SQLite via Prisma
  ├── Node.stateJson updated (cycleCount, lastValue, status)
  ├── Log record written (eventSummary, triggeredNodes, detailsJson)
  └── MarketSnapshot upserted (symbol → price, volume, rank)
          │
          ▼
SWR 2s poll ← /api/canvas?id=<id> + /api/logs
          │
          ▼
React Flow re-renders → toast notifications fired → ActivityFeed updated
```

#### 2.3 Key Source Files

A brief file map covering only the files a contributor is likely to touch:

```
src/
├── app/api/
│   ├── canvas/            ← Canvas CRUD routes
│   ├── engine/trigger/    ← Main poll + graph execution entry point
│   ├── alert/             ← Discord webhook test ping
│   ├── export/report/     ← Fundamental HTML report generator
│   └── logs/              ← Execution log reader
├── components/canvas/
│   ├── MarketCanvas.tsx   ← React Flow root, context menus, clipboard, drag-drop
│   └── nodes/             ← 10 node components (one file each)
├── server/services/
│   ├── graphEngine.ts     ← BFS traversal, canvas mutations, cycle counting
│   ├── dslEngine.ts       ← Safe expr-eval DSL wrapper
│   ├── sectorsApi.ts      ← Live API client + mock data engine
│   ├── discordWebhook.ts  ← Discord embed formatter and dispatcher
│   └── reportExporter.ts  ← HTML/PDF fundamental brief writer
├── types/
│   └── canvas.ts          ← Master TypeScript interfaces (single source of truth)
└── __tests__/unit/        ← All 257 Vitest unit tests
```

---

### Section 3: Database Schema

Render the Prisma schema as a clean reference table — one table per model. No need to
paste the raw `.prisma` file; a formatted table is more readable.

#### Canvas

| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `name` | String | Default: `"My Market Canvas"` |
| `createdAt` | DateTime | Auto |
| `updatedAt` | DateTime | Auto |

#### Node

| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `canvasId` | String | Foreign key → Canvas |
| `type` | String | One of the 10 `NodeType` values |
| `positionX` | Float | Canvas X coordinate |
| `positionY` | Float | Canvas Y coordinate |
| `configJson` | String | JSON-stringified typed config object |
| `stateJson` | String? | Runtime state: `cycleCount`, `lastValue`, `status`, `error` |

#### Edge

| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `canvasId` | String | Foreign key → Canvas |
| `fromId` | String | Source node ID |
| `toId` | String | Target node ID |
| `fromHandle` | String? | `'true'` \| `'false'` \| `null` (null = legacy, treated as `'true'` at runtime) |
| `toHandle` | String? | Reserved, currently unused |

Unique constraint: `@@unique([fromId, toId, fromHandle])` — prevents duplicate parallel edges.

#### MarketSnapshot

Cache of the most recent market data per ticker. Upserted on every engine trigger.

| Field | Type | Notes |
|---|---|---|
| `symbol` | String | Unique IDX ticker |
| `price` | Float | Last price in IDR |
| `prevPrice` | Float? | Previous close |
| `priceChange` | Float? | Percentage (e.g. `4.5` for +4.5%) |
| `volume` | Float? | Day volume (shares) |
| `avgVolume` | Float? | 20-day average daily volume |
| `rank` | Int? | Leaderboard rank (Top Gainers / Losers) |

#### Log

| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `canvasId` | String | Foreign key → Canvas |
| `eventSummary` | String | Human-readable trigger description |
| `triggeredNodes` | String | JSON array of node IDs that executed |
| `detailsJson` | String? | Full event context and outcome payload |

---

### Section 4: REST API Reference

Full endpoint reference table. Each row includes method, route, request shape, and what it returns.

#### Canvas CRUD

| Method | Endpoint | Request | Returns |
|---|---|---|---|
| `GET` | `/api/canvas?id=<id>` | — | Full canvas: nodes, edges, logs |
| `POST` | `/api/canvas/nodes` | `{ type, position: {x,y}, config }` | Created node |
| `PATCH` | `/api/canvas/nodes/:id` | `{ position?, config? }` | Updated node |
| `DELETE` | `/api/canvas/nodes/:id` | — | Deleted node + pruned edges |
| `POST` | `/api/canvas/edges` | `{ fromId, toId, fromHandle? }` | Created edge |
| `DELETE` | `/api/canvas/edges/:id` | — | 204 No Content |
| `GET` | `/api/canvas/list` | — | Array of all canvases with metadata |
| `POST` | `/api/canvas/restore?id=<id>` | `.scriffle` JSON body | Replaced canvas with remapped IDs |

#### Engine & Alerting

| Method | Endpoint | Request | Returns |
|---|---|---|---|
| `POST` | `/api/engine/trigger` | `{ canvasId, sessionApiKey? }` | Execution summary + triggered nodes |
| `GET` | `/api/logs` | `?canvasId=<id>&limit=<n>` | Recent execution log entries |
| `POST` | `/api/alert/test-webhook` | `{ webhookUrl }` | Discord ping response status |

#### Reporting & Files

| Method | Endpoint | Request | Returns |
|---|---|---|---|
| `GET` | `/api/export/report?symbol=<sym>` | `sessionApiKey` in header | Fundamental HTML report |
| `POST` | `/api/file/open-location` | `{ filePath }` | Opens OS file manager (local dev only) |

---

### Section 5: The `.scriffle` File Format

This section documents the format fully so that someone could write or generate a valid
`.scriffle` file without touching the source code.

> Note: `SCRIFFLE_AI_SPEC.md` at the project root is an extended version of this spec
> written as an LLM prompt. It includes a ready-to-use system prompt for generating `.scriffle`
> boards from natural language. This section is the concise developer reference; the AI spec
> is the exhaustive one.

#### 5.1 Envelope Structure

```json
{
  "format": "scriffle",
  "version": "1.0.0",
  "name": "Board Title",
  "createdAt": "2026-10-01T00:00:00.000Z",
  "nodes": [],
  "edges": []
}
```

#### 5.2 Node Shape

```json
{
  "id": "unique-node-id",
  "type": "watcher",
  "position": { "x": 100, "y": 150 },
  "config": { }
}
```

`config` is typed by node type. See Section 6 (Node Config Schemas) below.

#### 5.3 Edge Shape

```json
{
  "id": "unique-edge-id",
  "from": "source-node-id",
  "to": "target-node-id",
  "fromHandle": "true"
}
```

- `fromHandle` is `"true"` or `"false"` for Condition node branches. Omit or set to `null` for all
  other connections — the engine treats `null` as `"true"` for backward compatibility.

#### 5.4 ID Collision Handling on Restore

When loading a `.scriffle` into an existing project, `/api/canvas/restore` runs an atomic
ID remapping pass: it detects any node or edge IDs already present in the database (from other
project tabs), allocates fresh UUIDs, and rewrites all `fromId` / `toId` references in edges
to match the new IDs before inserting. This prevents `UNIQUE constraint failed` errors in
multi-project environments.

---

### Section 6: Node Configuration Schemas

A clean reference for all 10 node types, derived from `src/types/canvas.ts`. Each node type
gets: a brief description, a table of all config fields with types and defaults, and one minimal
valid JSON example.

**Order:** watcher · screener · condition · note · alert · action · text · sticker · image · file

For each entry, document:
- Field name
- Type (string, number, boolean, enum values)
- Required / optional
- Default value where applicable
- Short description

This replaces the need to read `canvas.ts` directly for most tasks.

---

### Section 7: DSL Rule Syntax (Condition Nodes)

#### 7.1 Available Variables

| Variable | Type | Description |
|---|---|---|
| `price` | number | Current market price in IDR |
| `prevPrice` | number | Previous close price |
| `price_change` | number | Percentage change (e.g. `4.5` = +4.5%, `-2.1` = -2.1%) |
| `volume` | number | Current day transaction volume (shares) |
| `avg_volume` | number | 20-day average daily trading volume |
| `rank` | number | Leaderboard rank (1 = top, for Top Gainers / Losers mode) |

#### 7.2 Supported Operators

| Category | Operators |
|---|---|
| Comparison | `>` `<` `>=` `<=` `==` `!=` |
| Logical | `AND` `OR` `not` |
| Arithmetic | `+` `-` `*` `/` |

#### 7.3 Example Rules

```
price_change > 5
price_change > 3.5 AND volume > 1000000
volume > avg_volume * 1.5
price_change < -2 OR rank <= 3
not (price_change > 0)
```

#### 7.4 Safety Note

All rules are evaluated via `expr-eval`, a sandboxed expression parser. Raw JavaScript
`eval()` is never used. Rules cannot access the filesystem, network, or any global scope.

---

### Section 8: Custom Theme Engine (`.scrifflemes`)

#### 8.1 Format

Themes are INI-style plain-text files with four sections:

```ini
[metadata]
name = "Theme Name"
author = "Author"
version = "1.0.0"
mode_base = "dark"   # or "light"

[canvas]
background = #121212
grid_dot = #2A2A2A

[ui]
primary = #FF8C00
surface = #1A1A1A
text = #FF9E00

[nodes]
watcher = #00C853
condition = #FFAB00
alert = #FF3D00

[edges]
default = #734800
active = #FF8C00
```

#### 8.2 Applying a Theme

- **Via UI**: Open the Theme modal from the top toolbar. Import a `.scrifflemes` file using the
  file picker, or drag and drop it directly onto the canvas.
- **Bundled presets**: Located in `themes/` — Bloomberg Terminal, Nord Frost, Gruvbox Dark,
  Tokyo Night, Solarized Dark.

#### 8.3 Creating a Theme

Copy any file from `themes/` as a starting point. Edit color hex values in any text editor.
All values must be valid hex codes (`#RRGGBB` or `#RRGGBBAA`). Save with a `.scrifflemes`
extension and drop onto the canvas.

#### 8.4 Implementation

- **Parser**: `src/lib/themeParser.ts` — reads INI sections, validates hex values, maps tokens
  to CSS variables.
- **Application**: CSS variables are written to `document.documentElement` under `[data-theme]`
  selector. No page reload required.

---

### Section 9: Automated Test Suite

#### 9.1 Running Tests

```bash
bun test                  # Run all tests
bun run test:watch        # Watch mode
bun run test:coverage     # Coverage report
```

#### 9.2 Test Inventory

**257 tests across 26 suites, 0 failures, ~200ms runtime.**

All test files live in `src/__tests__/unit/`.

| File | What it tests |
|---|---|
| `dslEngine.test.ts` | All DSL operators, AND/OR compounds, camelCase variable aliases, edge cases |
| `interpolateTemplate.test.ts` | All `${variable}` substitutions, volume formatting (K/M/B), undefined fallbacks |
| `leaderboard.test.ts` | Top Gainers/Losers formatted output, rank indicators, empty input, mock fallback |
| `screenerNote.test.ts` | AI Screener output structure, company rows, missing fields |
| `searchIndexer.test.ts` | Fuzzy search across tickers, prompts, rules, and sticker emoji |
| `spatialNavigator.test.ts` | Tab/Shift+Tab traversal, non-oscillating wrap-around |
| `quickAddNavigator.test.ts` | Spatial collision offsets, node recommendations, config inheritance |
| `themeEngine.test.ts` | `.scrifflemes` INI parser, serializer, color sanitizer, CSS variable mapping |
| `edgeLabels.test.ts` | Contextual edge label inference, true/false handle resolution |
| `conditionBranching.test.ts` | Dual-output BFS routing, legacy null handle fallback, multi-child fanout |
| `discordWebhook.test.ts` | URL validation, embed formatting, sentiment colors, timeout protection |
| `loadingState.test.ts` | LoadingContext task queue, concurrent tasks, runTracked, 12s auto-timeout |
| `onboarding.test.ts` | Spotlight Tour step logic, startup suppression preference persistence |
| `sandboxTutorial.test.ts` | Hands-on mission validation, live canvas action detection |
| `reportRevision.test.ts` | In-place dynamic report revision (Rev 1, Rev 2+, disk overwrite) |
| `watcherInitialState.test.ts` | Clean idle watcher state on create and restore |
| `creditCosts.test.ts` | Centralized Sectors API credit pricing registry and burst calculations |
| `topMoversApi.test.ts` | Param builder, `'all'` classification omission, structured error capture |
| `companySearch.test.ts` | Indonesian company matcher, keyword tokens, freeform ticker entry |
| `tidyUpLayout.test.ts` | AABB overlap relaxation, centroid stability, type-aware dimensions |
| `startFresh.test.ts` | `--start-fresh` CLI flag: project creation, tour reset, mission reset |
| `draggableWidget.test.ts` | Draggable sandbox widget gesture thresholding and boundary constraints |
| `imageNode.test.ts` | ImageNode config, aspect-ratio locking, clipboard paste handling |
| `imageStudio.test.ts` | Image Studio modal interactions |
| `stickerNode.test.ts` | Free-form emoji/label/color schema, legacy `stickerType` backward compatibility |
| `tutorialPopover.test.ts` | Popover overflow containment, text wrapping, width constraints |

#### 9.3 Test Fixtures

Shared mock data lives in `src/__tests__/fixtures/marketEvents.ts`:
- `BBCA_SURGE` — +6.2% price spike event
- `TLKM_DROP` — -3.1% drop event
- `MOCK_GAINERS` / `MOCK_LOSERS` — Top 5 mover arrays for radar tests

#### 9.4 Test-Exported Functions from `graphEngine.ts`

These functions are exported specifically to enable unit testing (they would otherwise be
internal to the engine):

| Function | Tests in |
|---|---|
| `interpolateTemplate(template, event)` | `interpolateTemplate.test.ts` |
| `generateDefaultNoteContent(event)` | `leaderboard.test.ts` |
| `generateLeaderboardNoteContent(movers, mode, period)` | `leaderboard.test.ts` |
| `generateScreenerNoteContent(query, results, queryValues)` | `screenerNote.test.ts` |

---

### Section 10: Development Commands

```bash
bun dev                           # Start dev server → http://localhost:3000
bun run dev --start-fresh         # Start with a fresh blank canvas + reset onboarding
bun run build                     # Production build (also validates TypeScript)
bun run start                     # Start production server (after build)
bun run prisma/seed.ts            # Reset and re-seed the demo canvas
bunx prisma db push               # Push schema changes to dev.db
bunx prisma studio                # Open visual database browser at localhost:5555
bun test                          # Run all unit tests
bun run test:watch                # Watch mode — run tests on file change
bun run test:coverage             # Run tests with coverage report
```

---

### Section 11: Extending Scriffle — Adding a New Node Type

A numbered checklist for contributors adding a new node type end-to-end:

1. **Add the type string** to the `NodeType` union in `src/types/canvas.ts`.
2. **Define a config interface** (e.g. `MyNodeConfig`) in the same file and add it to the
   `NodeConfig` union type.
3. **Build the React component** at `src/components/canvas/nodes/MyNode.tsx`. Follow the
   existing node pattern: accept `{ data: CanvasNodeData }` as props, render handles
   with `<Handle>` from `@xyflow/react`.
4. **Register the component** in `MarketCanvas.tsx` inside the `nodeTypes` object.
5. **Add to context menus** in `ContextMenu.tsx` (right-click canvas) and `NavToolbar.tsx`
   (toolbar button), wiring the `POST /api/canvas/nodes` call with the correct default config.
6. **Add to `EditNodeModal.tsx`** if the node requires a property editor.
7. **Handle in `graphEngine.ts`** if the node participates in BFS automation — add a case
   to the graph traversal switch.
8. **Write unit tests** covering all config branches, edge states, and engine integration.
   Add the test file to `src/__tests__/unit/`.

---

## 3. Formatting Notes for Writing

- **No emojis** in headings, tables, or prose. This is a technical document — typographic
  hierarchy does the job.
- **Code blocks** for all JSON, TypeScript snippets, CLI commands, and INI examples.
  Always specify the language tag (`json`, `ts`, `bash`, `ini`).
- **Tables** for schemas, endpoints, and test inventories. Prefer tables over bullet lists
  wherever a structured comparison exists.
- **Anchor links** at the top matching each `##` heading, same as README.
- **Cross-references**: Link to `SCRIFFLE_AI_SPEC.md` in the `.scriffle` format section,
  since it is the exhaustive LLM-focused version of the same spec.

---

## 4. Review Checklist

- [ ] Section 2 data flow diagram accurately reflects the current engine path (trigger → BFS → SQLite → SWR)
- [ ] Database schema tables match `prisma/schema.prisma` exactly
- [ ] All 13 API endpoints are documented with correct routes, methods, and request shapes
- [ ] Node config schemas match `src/types/canvas.ts` exactly (all fields, all types, all enums)
- [ ] DSL variable table matches `MarketEvent` interface in `canvas.ts`
- [ ] Test count and suite count are accurate before committing (`bun test` to confirm)
- [ ] `.scrifflemes` format example matches the actual `bloomberg.scrifflemes` file in `themes/`
- [ ] Extension guide steps are validated against at least one existing node type as a reference
