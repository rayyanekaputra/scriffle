# Technical Guide

This document is the developer reference for Scriffle. It covers architecture, API endpoints,
database schema, file formats, DSL syntax, theming, testing, and how to extend the project.

If you are looking for a product overview or setup instructions, see [README.md](./README.md).

---

[Tech Stack](#tech-stack) · [Architecture](#system-architecture) · [Database](#database-schema) · [API](#rest-api-reference) · [.scriffle Format](#the-scriffle-file-format) · [Node Schemas](#node-configuration-schemas) · [DSL Syntax](#dsl-rule-syntax) · [Themes](#custom-theme-engine) · [Tests](#automated-test-suite) · [Dev Commands](#development-commands) · [Extending](#extending-scriffle)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| Canvas | `@xyflow/react` (React Flow v12) |
| Styling | Tailwind CSS v4, 2px flat outline system, zero drop shadows |
| Typography & Icons | Stack Sans Text (Google Fonts), MingCute Icons (local webfont) |
| Database & ORM | SQLite (`prisma/dev.db`) + Prisma 5.22.0 |
| Sync & Polling | SWR — 2s short-poll on `/api/canvas` and `/api/logs` |
| Expression Evaluator | `expr-eval` — safe DSL, no raw `eval()` |
| Market Data | Sectors.app API v2 + randomized offline mock engine |
| Runtime & Tests | Bun v1.4+, Vitest v5 |

---

## System Architecture

### Design Decisions

Two constraints worth knowing before reading the codebase:

**No WebSockets.** SWR polling at a 2-second cadence is intentional. It is robust enough for
demo scale, survives page refreshes cleanly, and avoids connection state management overhead.

**Session-only API key.** The Sectors API key lives exclusively in React state for the lifetime
of the browser tab. It is never written to SQLite, localStorage, `.env`, or `.scriffle` exports.
Any API route that needs it must receive it per-request in the request body or header. Never
assume it is available server-side.

### Data Flow

```
User action / polling timer
          │
          ▼
POST /api/engine/trigger
  ├── Sectors API (live, if key provided)
  └── Randomized mock engine (offline — realistic ±0–7% price distributions)
          │
          ▼
graphEngine.ts
  ├── BFS traversal from Watcher / Screener source nodes
  ├── Evaluates Condition rules via dslEngine.ts (expr-eval sandbox)
  ├── Executes downstream Note / Alert / Action nodes
  └── Action mutations:
        ├── Spawns new nodes on canvas
        ├── Calls reportExporter.ts (Sectors fundamental brief → disk)
        └── Fires discordWebhook.ts (rich embed to Discord)
          │
          ▼
SQLite via Prisma
  ├── Node.stateJson updated (cycleCount, lastValue, status, error)
  ├── Log record written (eventSummary, triggeredNodes, detailsJson)
  └── MarketSnapshot upserted (symbol → price, volume, rank)
          │
          ▼
SWR 2s poll (/api/canvas?id=<id> + /api/logs)
          │
          ▼
React Flow re-renders → toast notifications fired → ActivityFeed updated
```

### Key Source Files

```
src/
├── app/api/
│   ├── canvas/              ← Canvas CRUD routes (nodes, edges, restore, list)
│   ├── engine/trigger/      ← Main poll + graph execution entry point
│   ├── alert/               ← Discord webhook test ping
│   ├── export/report/       ← Fundamental HTML report generator
│   └── logs/                ← Execution log reader
├── components/canvas/
│   ├── MarketCanvas.tsx     ← React Flow root, context menus, clipboard, drag-drop
│   ├── ContextMenu.tsx      ← Right-click menus (canvas, node, edge, group)
│   ├── SelectionBoundingBox.tsx ← 8-point multi-select box, group actions, tidy up
│   └── nodes/               ← 10 node components (one file per type)
├── server/services/
│   ├── graphEngine.ts       ← BFS traversal, canvas mutations, cycle counting
│   ├── dslEngine.ts         ← Safe expr-eval DSL wrapper
│   ├── sectorsApi.ts        ← Sectors.app API v2 client + mock data engine
│   ├── discordWebhook.ts    ← Discord embed formatter and dispatcher
│   └── reportExporter.ts   ← HTML/PDF fundamental brief writer
├── types/
│   └── canvas.ts            ← Master TypeScript interfaces — single source of truth
└── __tests__/unit/          ← All Vitest unit tests
```

---

## Database Schema

### Canvas

| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `name` | String | Default: `"My Market Canvas"` |
| `createdAt` | DateTime | Auto |
| `updatedAt` | DateTime | Auto |

Relations: has many `Node`, `Edge`, `Log`.

### Node

| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `canvasId` | String | Foreign key → Canvas (cascade delete) |
| `type` | String | One of the 10 `NodeType` values |
| `positionX` | Float | Canvas X coordinate |
| `positionY` | Float | Canvas Y coordinate |
| `configJson` | String | JSON-stringified typed config object |
| `stateJson` | String? | Runtime state: `cycleCount`, `lastValue`, `status`, `error`, `movers`, `screenerResults` |

### Edge

| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `canvasId` | String | Foreign key → Canvas (cascade delete) |
| `fromId` | String | Source node ID |
| `toId` | String | Target node ID |
| `fromHandle` | String? | `'true'` \| `'false'` \| `null` — null is treated as `'true'` at runtime |
| `toHandle` | String? | Reserved, currently unused |

Unique constraint: `@@unique([fromId, toId, fromHandle])` prevents duplicate parallel edges.

### MarketSnapshot

Cache of the most recent market data per ticker. Upserted on every engine trigger.

| Field | Type | Notes |
|---|---|---|
| `symbol` | String | Unique IDX ticker — primary lookup key |
| `price` | Float | Last price in IDR |
| `prevPrice` | Float? | Previous close price |
| `priceChange` | Float? | Percentage change (e.g. `4.5` = +4.5%, `-2.1` = -2.1%) |
| `volume` | Float? | Day volume in shares |
| `avgVolume` | Float? | 20-day average daily volume |
| `rank` | Int? | Leaderboard rank position (Top Gainers / Losers mode) |

### Log

| Field | Type | Notes |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `canvasId` | String | Foreign key → Canvas (cascade delete) |
| `eventSummary` | String | Human-readable trigger description |
| `triggeredNodes` | String | JSON-stringified array of node IDs that executed |
| `detailsJson` | String? | Full event context, payload, and outcome |

---

## REST API Reference

### Canvas CRUD

| Method | Endpoint | Request body | Returns |
|---|---|---|---|
| `GET` | `/api/canvas?id=<id>` | — | Full canvas state: nodes, edges, logs |
| `POST` | `/api/canvas/nodes` | `{ type, position: {x,y}, config }` | Created node |
| `PATCH` | `/api/canvas/nodes/:id` | `{ position?, config? }` | Updated node |
| `DELETE` | `/api/canvas/nodes/:id` | — | Deleted node + all pruned edges |
| `POST` | `/api/canvas/edges` | `{ fromId, toId, fromHandle? }` | Created edge |
| `DELETE` | `/api/canvas/edges/:id` | — | 204 No Content |
| `GET` | `/api/canvas/list` | — | Array of all canvases with node counts |
| `POST` | `/api/canvas/restore?id=<id>` | `.scriffle` JSON body | Replaced canvas with remapped IDs |

### Engine & Alerting

| Method | Endpoint | Request body | Returns |
|---|---|---|---|
| `POST` | `/api/engine/trigger` | `{ canvasId, sessionApiKey? }` | Execution summary + triggered node list |
| `GET` | `/api/logs` | `?canvasId=<id>&limit=<n>` | Recent execution log entries |
| `POST` | `/api/alert/test-webhook` | `{ webhookUrl }` | Discord ping response status |

### Reporting & Files

| Method | Endpoint | Request | Returns |
|---|---|---|---|
| `GET` | `/api/export/report?symbol=<sym>` | `sessionApiKey` in header | Fundamental HTML report (auto-saved to `reports/`) |
| `POST` | `/api/file/open-location` | `{ filePath }` | Reveals path in OS file manager — local dev only |

---

## The `.scriffle` File Format

A `.scriffle` file is a UTF-8 JSON document. It is the portable export format for any canvas
and can be dragged onto the canvas or loaded via Open File to restore a board instantly.

> For the exhaustive LLM-focused specification — including a copy-pasteable system prompt for
> generating valid `.scriffle` files from natural language — see
> [SCRIFFLE_AI_SPEC.md](./SCRIFFLE_AI_SPEC.md).

### Envelope

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

### Node shape

```json
{
  "id": "unique-node-id",
  "type": "watcher",
  "position": { "x": 100, "y": 150 },
  "config": {}
}
```

`config` is typed per node type. See [Node Configuration Schemas](#node-configuration-schemas).

### Edge shape

```json
{
  "id": "unique-edge-id",
  "from": "source-node-id",
  "to": "target-node-id",
  "fromHandle": "true"
}
```

`fromHandle` is `"true"` or `"false"` for edges leaving a Condition node. Omit or set to `null`
for all other edges — the engine treats `null` as `"true"` for backward compatibility.

### Valid signal flow

```
watcher    ──→  condition  ──→  note
watcher    ──→  condition  ──→  alert
watcher    ──→  condition  ──→  action
watcher    ──→  note
watcher    ──→  action
screener   ──→  note
screener   ──→  action
screener   ──→  watcher
```

### ID collision handling on restore

When loading a `.scriffle` into an existing project, `/api/canvas/restore` runs an atomic
ID remapping pass. It detects any node or edge IDs already present in the database from other
project tabs, allocates fresh UUIDs, and rewrites all `from` / `to` references in edges before
inserting. This prevents `UNIQUE constraint failed` errors in multi-project environments.

---

## Node Configuration Schemas

All configs are defined in [`src/types/canvas.ts`](./src/types/canvas.ts). This section is the
quick reference; the source file is the authoritative contract.

### watcher

Monitors a single IDX stock ticker or scans market-wide Top Gainers / Losers via Sectors.

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `symbol` | string | Yes | — | IDX ticker, e.g. `"BBCA"` |
| `metric` | `'price' \| 'price_change' \| 'volume' \| 'rank'` | Yes | — | Value to expose to downstream nodes |
| `interval` | number | Yes | — | Polling interval in seconds |
| `mode` | `'single' \| 'top_gainers' \| 'top_losers'` | No | `'single'` | Single ticker or radar leaderboard |
| `threshold` | number | No | — | Percentage move filter |
| `limit` | number | No | `5` | Number of stocks in radar leaderboard |
| `period` | `'1d' \| '7d' \| '14d' \| '30d' \| '365d' \| 'all'` | No | `'1d'` | Timeframe for radar mode |
| `minMcapBillion` | number | No | — | Minimum market cap in Billion IDR |
| `classifications` | string | No | — | Sector filter; omit or `'all'` for no filter |

### screener

Executes natural language queries across Indonesian listed stocks via the Sectors AI screener.

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `query` | string | Yes | — | Plain English query, e.g. `"top 5 banks by market cap"` |
| `mode` | `'natural' \| 'structured'` | No | `'natural'` | Query mode |
| `limit` | number | No | `5` | Maximum results returned |
| `interval` | number | No | `300` | Polling interval in seconds |
| `where` | string | No | — | Optional SQL-like filter clause |
| `orderBy` | string | No | — | Sort field, e.g. `"market_cap"` |
| `desc` | boolean | No | — | Sort descending |

### condition

Evaluates a boolean DSL rule. Routes data to the `true` or `false` output handle.

| Field | Type | Required | Notes |
|---|---|---|---|
| `rule` | string | Yes | DSL expression — see [DSL Rule Syntax](#dsl-rule-syntax) |

### note

Displays text on the canvas. When triggered by an upstream node, updates content by
interpolating live market values into the template.

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `content` | string | Yes | — | Current text content |
| `template` | string | No | — | Auto-update template with `${variable}` placeholders |
| `color` | `'yellow' \| 'mint' \| 'pink' \| 'blue' \| 'purple'` | No | `'yellow'` | Sticky note colour |
| `width` | number | No | `260` | Width in pixels |
| `height` | number | No | `180` | Height in pixels |
| `revisionCount` | number | No | — | Incremented on in-place update; renders `Rev X` badge |
| `symbol` | string | No | — | Associated ticker for automated refresh |

Template variables: `${symbol}`, `${price}`, `${prevPrice}`, `${price_change}`, `${volume}`,
`${avg_volume}`, `${timestamp}`.

### alert

Emits notifications when triggered.

| Field | Type | Required | Notes |
|---|---|---|---|
| `channel` | `'ui' \| 'discord' \| 'telegram' \| 'webhook'` | Yes | Delivery target |
| `messageTemplate` | string | No | Notification message with `${variable}` interpolation |
| `discordWebhookUrl` | string | No | Full Discord webhook URL (required when `channel` is `'discord'`) |
| `botName` | string | No | Display name for the Discord bot |
| `includeMarketStats` | boolean | No | Attach volume and price stats to the Discord embed |

### action

Triggers autonomous canvas mutations when downstream conditions are met.

| Field | Type | Required | Notes |
|---|---|---|---|
| `action` | `'create_note' \| 'create_watcher' \| 'fundamental_report' \| 'export_canvas'` | Yes | Operation to perform |
| `targetSymbol` | string | No | Target ticker override — defaults to the upstream event ticker |
| `template` | string | No | Custom note template when `action` is `'create_note'` |
| `interval` | number | No | Polling interval for watchers spawned by `'create_watcher'` |
| `params` | object | No | Additional action parameters |

`'create_watcher'` auto-spawns a complete connected pipeline:
`[Watcher] → [Condition: price_change > 0] → [Sticky Note]`

`'fundamental_report'` generates an HTML brief via the Sectors API and saves it to
`reports/<canvas_name>/<symbol>_Fundamental_Brief.html`. Subsequent triggers for the same
symbol refresh the file in place and increment `revisionCount`.

### text

Freeform WYSIWYG text block. Does not participate in graph automation.

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `text` | string | Yes | — | Text content |
| `fontSize` | `'title' \| 'header' \| 'body' \| 'caption'` | No | `'body'` | Typography scale |
| `containerStyle` | `'plain' \| 'callout' \| 'card'` | No | `'plain'` | Background style |
| `align` | `'left' \| 'center' \| 'right'` | No | `'left'` | Text alignment |
| `highlight` | `'none' \| 'yellow' \| 'mint' \| 'coral' \| 'purple'` | No | `'none'` | Highlight marker colour |
| `bold` | boolean | No | — | |
| `italic` | boolean | No | — | |
| `underline` | boolean | No | — | |
| `strike` | boolean | No | — | |
| `width` | number | No | — | Width in pixels |
| `height` | number | No | — | Height in pixels |

### sticker

Customisable emoji badge. Does not participate in graph automation.

| Field | Type | Required | Notes |
|---|---|---|---|
| `emoji` | string | No | Unicode emoji, e.g. `"🚀"`, `"📈"`, `"⚠️"` |
| `label` | string | No | Text label shown beside the emoji |
| `color` | `'green' \| 'red' \| 'blue' \| 'amber' \| 'purple' \| 'teal' \| 'slate'` | No | Badge accent colour |
| `stickerType` | string | No | Legacy field — use `emoji` / `label` / `color` instead |

### image

Resizable image node. Does not participate in graph automation.

| Field | Type | Required | Notes |
|---|---|---|---|
| `url` | string | Yes | Image URL or data URI |
| `caption` | string | No | Caption text |
| `width` | number | No | Width in pixels (persisted after resize) |
| `height` | number | No | Height in pixels (persisted after resize) |
| `aspectRatio` | number | No | Locked aspect ratio (width / height) |
| `isTransparent` | boolean | No | Renders without white background box |

### file

File attachment node. Typically auto-created by an Action node after generating a report.

| Field | Type | Required | Notes |
|---|---|---|---|
| `fileName` | string | Yes | Display name with extension |
| `fileUrl` | string | Yes | URL or API path |
| `filePath` | string | No | Absolute path on disk, e.g. `reports/Project/BBCA_Fundamental_Brief.html` |
| `fileCategory` | `'pdf' \| 'presentation' \| 'document' \| 'spreadsheet' \| 'audio' \| 'code' \| 'archive' \| 'generic'` | No | Icon and colour coding |
| `savedLocally` | boolean | No | If `true`, renders a green `Saved` indicator |
| `isDownloaded` | boolean | No | Alias for `savedLocally` |
| `revisionCount` | number | No | Current version count — renders a `Rev X` badge |
| `symbol` | string | No | Associated ticker for in-place re-export |

---

## DSL Rule Syntax

Condition node rules are evaluated by `expr-eval` — a sandboxed expression parser. Raw
JavaScript `eval()` is never used. Rules cannot access the filesystem, network, or any
global scope outside the variables listed below.

### Available variables

| Variable | Type | Description |
|---|---|---|
| `price` | number | Current market price in IDR |
| `prevPrice` | number | Previous close price |
| `price_change` | number | Percentage change — e.g. `4.5` is +4.5%, `-2.1` is -2.1% |
| `volume` | number | Current day transaction volume in shares |
| `avg_volume` | number | 20-day average daily trading volume |
| `rank` | number | Leaderboard rank position — `1` is the top mover |

### Supported operators

| Category | Operators |
|---|---|
| Comparison | `>` `<` `>=` `<=` `==` `!=` |
| Logical | `AND` `OR` `not` |
| Arithmetic | `+` `-` `*` `/` |

### Example rules

```
price_change > 5
price_change > 3.5 AND volume > 1000000
volume > avg_volume * 1.5
price_change < -2 OR rank <= 3
not (price_change > 0)
price >= 10000 AND price_change >= 2
```

---

## Custom Theme Engine

Scriffle ships with three built-in themes (Light, Mono, Dark) and a plain-text custom theme
format — `.scrifflemes` — for creating or distributing your own.

### Format

`.scrifflemes` files are INI-style plain text with four sections:

```ini
[metadata]
name = "Bloomberg Terminal"
author = "Scriffle Core"
version = "1.0.0"
mode_base = "dark"

[canvas]
background = #121212
grid_dot = #2A2A2A
selection_box = #FF8C00
selection_box_fill = #FF8C0018

[ui]
primary = #FF8C00
surface = #1A1A1A
surface_muted = #242424
border = #333333
border_active = #FF8C00
text = #FF9E00
text_muted = #B07200

[nodes]
watcher = #00C853
condition = #FFAB00
alert = #FF3D00
screener = #FF8C00
action = #D500F9
note_default = #222018

[edges]
default = #734800
active = #FF8C00
selected = #FFD600
```

All colour values must be valid hex codes (`#RRGGBB` or `#RRGGBBAA`).

### Applying a theme

- **Via UI**: Open the Theme modal from the top toolbar, use the file picker, or drag and drop
  a `.scrifflemes` file directly onto the canvas.
- **Bundled presets**: Located in `themes/` — `bloomberg.scrifflemes`, `nord.scrifflemes`,
  `gruvbox.scrifflemes`, `tokyo_night.scrifflemes`, `solarized_dark.scrifflemes`.

### Creating a theme

Copy any file from `themes/` as a starting point. Edit the hex values in any text editor.
Save with a `.scrifflemes` extension and drop it onto the canvas to apply.

### Implementation

- **Parser / serialiser**: `src/lib/themeParser.ts` — reads INI sections, validates hex values,
  maps tokens to CSS custom properties.
- **Application**: CSS variables are written to `document.documentElement` under the
  `[data-theme]` attribute selector at runtime. No page reload required.

---

## Automated Test Suite

### Running tests

```bash
bun test                  # Run all tests
bun run test:watch        # Watch mode
bun run test:coverage     # Coverage report
```

### Summary

**257 tests across 26 suites, 0 failures, approximately 200ms runtime.**

All test files live in `src/__tests__/unit/`.

### Test inventory

| File | Coverage domain |
|---|---|
| `dslEngine.test.ts` | All DSL operators, AND/OR compounds, camelCase variable aliases, edge cases |
| `interpolateTemplate.test.ts` | All `${variable}` substitutions, volume formatting (K/M/B), undefined fallbacks |
| `leaderboard.test.ts` | Top Gainers/Losers formatted output, rank indicators, empty input, mock fallback |
| `screenerNote.test.ts` | AI Screener output structure, company rows, missing field fallbacks |
| `searchIndexer.test.ts` | Fuzzy search across node tickers, prompts, rules, and sticker emoji |
| `spatialNavigator.test.ts` | Tab/Shift+Tab traversal, non-oscillating wrap-around behaviour |
| `quickAddNavigator.test.ts` | Spatial collision offsets, node recommendations, config inheritance |
| `themeEngine.test.ts` | `.scrifflemes` INI parser, serialiser, hex colour sanitiser, CSS variable mapping |
| `edgeLabels.test.ts` | Contextual edge label inference, true/false handle resolution |
| `conditionBranching.test.ts` | Dual-output BFS routing, legacy null handle fallback, multi-child fanout |
| `discordWebhook.test.ts` | URL validation, embed formatting, sentiment colours, timeout protection |
| `loadingState.test.ts` | LoadingContext task queue, concurrent tasks, `runTracked`, 12s auto-timeout |
| `onboarding.test.ts` | Spotlight Tour step logic, startup suppression preference persistence |
| `sandboxTutorial.test.ts` | Hands-on mission validation, live canvas action detection |
| `reportRevision.test.ts` | In-place dynamic report revision (Rev 1, Rev 2+, disk overwrite) |
| `watcherInitialState.test.ts` | Clean idle watcher state on create and restore |
| `creditCosts.test.ts` | Centralized Sectors API credit pricing registry and burst calculations |
| `topMoversApi.test.ts` | Param builder, `'all'` classification omission, structured error capture |
| `companySearch.test.ts` | Indonesian company matcher, keyword tokens, freeform ticker commit |
| `tidyUpLayout.test.ts` | AABB overlap relaxation, centroid stability, type-aware card dimensions |
| `startFresh.test.ts` | `--start-fresh` CLI flag: project creation, tour reset, mission reset |
| `draggableWidget.test.ts` | Draggable sandbox widget gesture thresholding and boundary constraints |
| `imageNode.test.ts` | ImageNode config, aspect-ratio locking, clipboard paste handling |
| `imageStudio.test.ts` | Image Studio modal interactions |
| `stickerNode.test.ts` | Free-form emoji/label/color schema, legacy `stickerType` backward compatibility |
| `tutorialPopover.test.ts` | Popover overflow containment, text wrapping, width constraints |

### Shared test fixtures

`src/__tests__/fixtures/marketEvents.ts` exports reusable mock `MarketEvent` objects:

| Export | Description |
|---|---|
| `BBCA_SURGE` | +6.2% price spike event for BBCA |
| `TLKM_DROP` | -3.1% drop event for TLKM |
| `MOCK_GAINERS` | Array of 5 top gainer events for radar tests |
| `MOCK_LOSERS` | Array of 5 top loser events for radar tests |

### Test-exported functions from `graphEngine.ts`

These functions are exported specifically to enable unit testing. They would otherwise be
internal to the engine:

| Function | Tested in |
|---|---|
| `interpolateTemplate(template, event)` | `interpolateTemplate.test.ts` |
| `generateDefaultNoteContent(event)` | `leaderboard.test.ts` |
| `generateLeaderboardNoteContent(movers, mode, period)` | `leaderboard.test.ts` |
| `generateScreenerNoteContent(query, results, queryValues)` | `screenerNote.test.ts` |

---

## Development Commands

```bash
bun dev                            # Start dev server at http://localhost:3000
bun run dev --start-fresh          # Start with a fresh canvas + reset onboarding
bun run build                      # Production build (also validates TypeScript)
bun run start                      # Start production server (requires build first)
bun run prisma/seed.ts             # Reset and re-seed the demo canvas
bunx prisma db push                # Push schema changes to prisma/dev.db
bunx prisma studio                 # Open visual database browser at localhost:5555
bun test                           # Run all unit tests
bun run test:watch                 # Watch mode — re-runs tests on file change
bun run test:coverage              # Run tests with coverage report
```

---

## Extending Scriffle

### Adding a new node type

Follow these steps in order. Use an existing node (e.g. `alert`) as a reference at each step.

1. **Register the type string** — add the new type name to the `NodeType` union in
   `src/types/canvas.ts`.

2. **Define the config interface** — create a `MyNodeConfig` interface in `canvas.ts` and
   add it to the `NodeConfig` union type.

3. **Build the React component** — create `src/components/canvas/nodes/MyNode.tsx`. Accept
   `{ data: CanvasNodeData }` as props. Render connection handles using `<Handle>` from
   `@xyflow/react`.

4. **Register the component** — add the new type to the `nodeTypes` object in
   `src/components/canvas/MarketCanvas.tsx`.

5. **Add to insertion UI** — wire the `POST /api/canvas/nodes` call with the correct default
   config in:
   - `src/components/canvas/ContextMenu.tsx` (right-click on canvas)
   - `src/components/controls/NavToolbar.tsx` (toolbar button)

6. **Add a property editor** — add a new case to `src/components/controls/EditNodeModal.tsx`
   if the node has user-configurable properties.

7. **Handle in the graph engine** — if the node participates in BFS automation, add a case to
   the traversal switch in `src/server/services/graphEngine.ts`.

8. **Write unit tests** — cover all config branches, edge states, and engine integration in a
   new file at `src/__tests__/unit/myNode.test.ts`. Run `bun test` to confirm 0 failures.
