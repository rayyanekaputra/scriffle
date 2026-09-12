# 📋 Master Implementation Plan: Scriffle

## 1. Architectural Strategy & Execution Philosophy
Scriffle is a **backend-driven, self-mutating canvas application**. The canvas UI is an interactive viewport reflecting the graph state stored in SQLite. 

To ensure rapid progress, clean separation of concerns, and zero architectural rework, development is structured into **5 sequential phases**:

```
Phase 1: Scaffolding & Data Layer (Bun + Next.js, Contracts, SQLite/Prisma, Seed)
   ▼
Phase 2: Core Engine & Safe DSL (Evaluator, Graph Traversal, Self-Mutation)
   ▼
Phase 3: Backend REST APIs & Simulation Endpoints (CRUD, Simulation, Sectors API)
   ▼
Phase 4: Frontend Canvas & 5 Custom Node Components (React Flow, Modals, Cards)
   ▼
Phase 5: Sync, Live Activity Feed, Simulation Bar & Demo Polish
```

---

## 2. Phase-by-Phase Implementation Order

### 📦 Phase 1: Project Setup, Master Contracts & Database Layer
**Goal:** Establish the project foundation with **Bun**, lock down TypeScript contracts, and set up the SQLite database with Prisma.

1. **Scaffold Next.js Project with Bun:**
   * Next.js 14/15 with TypeScript, Tailwind CSS, App Router (managed via `bun`).
   * Install core dependencies with `bun add`:
     * Graph & UI: `@xyflow/react`, `lucide-react`, `clsx`, `tailwind-merge`, `swr`
     * Engine & DB: `@prisma/client`, `prisma`, `expr-eval`, `node-cron`, `axios`
2. **Master Types Contract (`src/types/canvas.ts`):**
   * Define the 5 strict node types: `watcher`, `condition`, `note`, `alert`, `action`.
   * Define node configs (`WatcherConfig`, `ConditionConfig`, `NoteConfig`, `AlertConfig`, `ActionConfig`).
   * Define runtime payloads: `MarketEvent`, `ExecutionLog`, `CanvasNodeData`, `CanvasEdgeData`.
3. **Database Schema & Prisma Client (`prisma/schema.prisma`):**
   * Models: `Canvas`, `Node`, `Edge`, `MarketSnapshot`, `Log`.
   * Configure SQLite provider (`file:./dev.db`).
   * Run initial migration (`bunx prisma migrate dev --name init`).
4. **Seed Initial Demo Graph (`prisma/seed.ts`):**
   * Create a default Canvas with a pre-configured demo flow:
     * `Watcher` (`BBCA`, `price_change`) $\rightarrow$ `Condition` (`price_change > 5`) $\rightarrow$ `Note` (`"BBCA Alert: ${symbol} up ${price_change}%"`) & `Alert` (`ui`) & `Action` (`create_note`).

---

### ⚙️ Phase 2: Core Engine, Safe DSL & Mutation Logic
**Goal:** Build and de-risk the brain of Scriffle before building any UI.

1. **Safe DSL Evaluator (`src/server/services/dslEngine.ts`):**
   * Wrap `expr-eval` (Parser) to safely evaluate rules against `MarketEvent` payloads without `eval()`.
   * Support operators: `>`, `<`, `>=`, `<=`, `==`, `!=`, `AND`, `OR`.
   * Handle arithmetic expressions like `volume > 2 * avg_volume`.
2. **Graph Traversal & Execution Engine (`src/server/services/graphEngine.ts`):**
   * Input: `canvasId`, `MarketEvent`.
   * Find matching `watcher` nodes for `event.symbol`.
   * Traverse outgoing edges using Breadth-First Search (BFS) while tracking visited nodes (cycle prevention).
   * Node execution handlers:
     * **`condition`:** Evaluate DSL. Halt branch traversal if `false`; continue if `true`.
     * **`note`:** Perform template interpolation (e.g. replacing `${symbol}`, `${price_change}`, `${price}`, `${timestamp}`) and update DB node config.
     * **`alert`:** Write entry to `Log` table with timestamp and event details.
     * **`action`:** 
       * `create_note`: Calculate offset position (`x + 240, y + 40`), create new Note node in DB, and create edge connecting from current node.
       * `create_watcher`: Create new Watcher node for related stock.
       * `export_canvas`: Snapshot JSON export.
3. **Unit / Smoke Test:**
   * Script to simulate an event through the engine and verify DB mutations and logs.

---

### 🌐 Phase 3: External Data & Backend REST APIs
**Goal:** Expose all endpoints required by the canvas UI, scheduler, and demo simulation toolbar.

1. **Sectors API Client & Snapshot Manager (`src/server/services/sectorsApi.ts`):**
   * Dual-mode client:
     * **Live Mode:** Calls official Sectors endpoints when `SECTORS_API_KEY` is present.
     * **Mock / Offline Mode:** Realistic fallback data for IDX blue chips (`BBCA`, `BBRI`, `BMRI`, `TLKM`, `ASII`).
   * Delta calculation against `MarketSnapshot` table to generate `MarketEvent[]`.
2. **Canvas Graph CRUD Endpoints:**
   * `GET /api/canvas` - Returns current canvas with nodes, edges, and logs.
   * `POST /api/canvas/nodes` - Create new node.
   * `PATCH /api/canvas/nodes/[id]` - Update node position or config.
   * `DELETE /api/canvas/nodes/[id]` - Delete node and attached edges.
   * `POST /api/canvas/edges` - Create directed edge between two nodes.
   * `DELETE /api/canvas/edges/[id]` - Remove an edge.
3. **Execution & Simulation Endpoints:**
   * `GET /api/logs` - Fetch execution logs and UI alerts.
   * `POST /api/engine/trigger` - Manually trigger live market poll & graph evaluation.
   * `POST /api/engine/simulate` - Inject custom `MarketEvent` payload (e.g. `{ symbol: "BBCA", price_change: 6.2, volume: 5000000 }`) and return execution summary.
4. **Background Scheduler (`src/server/services/scheduler.ts`):**
   * Lightweight cron / interval runner to trigger periodic checks.

---

### 🎨 Phase 4: Frontend Canvas & 5 Custom Node Cards
**Goal:** Build the high-fidelity visual interface using React Flow.

1. **Canvas Container Setup (`src/components/canvas/MarketCanvas.tsx`):**
   * React Flow instance with custom controls, background grid, and mini-map.
   * Drag-and-drop node handling, connection validation, and deletion handlers.
2. **Implement 5 Custom Node Components (`src/components/canvas/nodes/`):**
   * **`WatcherNode.tsx`:** Ticker symbol selector, metric badge, polling frequency, last price display.
   * **`ConditionNode.tsx`:** DSL rule text, pass/fail status pill, rule helper tooltip.
   * **`NoteNode.tsx`:** Markdown text area / formatted text display, auto-update transition indicator.
   * **`AlertNode.tsx`:** Channel icon (`UI Toast` / `Telegram`), trigger history badge.
   * **`ActionNode.tsx`:** Action selector dropdown (`create_note`, `create_watcher`), target parameter preview.
3. **Node Configuration Modal / Drawer (`src/components/controls/NodeConfigModal.tsx`):**
   * Clicking a node opens a config panel allowing the user to edit ticker, rule DSL, note template, or action settings.
4. **Animated Active Edges (`src/components/canvas/edges/AnimatedEdge.tsx`):**
   * Edge styling with glowing/pulsing animation when an event propagates through a connection.

---

### ⚡ Phase 5: Live Sync, Activity Feed & Presenter Demo Bar
**Goal:** Connect frontend to backend, enable live short-polling, and provide presenter controls for judges.

1. **SWR Polling & Optimistic Sync (`src/hooks/useCanvasSync.ts`):**
   * Poll `/api/canvas` every 2 seconds.
   * Smoothly update React Flow nodes and edges without disturbing user zoom or viewport pan.
   * Highlight recently mutated or triggered nodes with a pulsing border.
2. **Judge / Presenter Simulation Bar (`src/components/controls/SimulationBar.tsx`):**
   * Floating top/bottom toolbar with quick preset buttons:
     * **"🚀 Simulate BBCA Surge (+6.2%)"**
     * **"📊 Simulate BMRI High Volume (+3.5x)"**
     * **"🔄 Reset Demo Canvas"**
     * **"▶ Poll Live Sectors API"**
3. **Live Activity Feed Drawer (`src/components/feed/ActivityFeed.tsx`):**
   * Collapsible right sidebar showing real-time event logs.
   * Clicking a log entry pans and centers the canvas on the triggered node.
4. **Toast Alerts Integration:**
   * Fire instant visual toasts when `alert` nodes execute.

---

## 3. Deliverables & File Tree

```txt
scriffle/
├── prisma/
│   ├── schema.prisma              # SQLite models (Canvas, Node, Edge, Log, MarketSnapshot)
│   └── seed.ts                    # Demo canvas seed script
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── canvas/
│   │   │   │   ├── route.ts       # GET canvas
│   │   │   │   ├── nodes/
│   │   │   │   │   ├── route.ts   # POST node
│   │   │   │   │   └── [id]/route.ts # PATCH, DELETE node
│   │   │   │   └── edges/
│   │   │   │       ├── route.ts   # POST edge
│   │   │   │       └── [id]/route.ts # DELETE edge
│   │   │   ├── engine/
│   │   │   │   ├── trigger/route.ts  # Trigger live poll
│   │   │   │   └── simulate/route.ts # Inject mock event
│   │   │   └── logs/route.ts      # GET activity logs
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx               # Main Studio Canvas Page
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── MarketCanvas.tsx
│   │   │   ├── nodes/
│   │   │   │   ├── WatcherNode.tsx
│   │   │   │   ├── ConditionNode.tsx
│   │   │   │   ├── NoteNode.tsx
│   │   │   │   ├── AlertNode.tsx
│   │   │   │   └── ActionNode.tsx
│   │   │   └── edges/
│   │   │       └── AnimatedEdge.tsx
│   │   ├── controls/
│   │   │   ├── TopNav.tsx
│   │   │   ├── SimulationBar.tsx
│   │   │   └── NodeConfigModal.tsx
│   │   └── feed/
│   │       └── ActivityFeed.tsx
│   ├── hooks/
│   │   ├── useCanvasSync.ts
│   │   └── useSimulation.ts
│   ├── lib/
│   │   ├── prisma.ts              # Global Prisma client instance
│   │   └── utils.ts
│   ├── server/
│   │   └── services/
│   │       ├── dslEngine.ts       # Safe expr-eval parser
│   │       ├── graphEngine.ts     # BFS graph execution & self-mutation
│   │       ├── sectorsApi.ts      # Live & Mock Sectors API client
│   │       └── scheduler.ts       # Polling runner
│   └── types/
│       └── canvas.ts              # Master TypeScript interfaces
```

---

## 4. Verification Checklist & Demo Readiness

- [ ] **Database Integrity:** SQLite properly stores nodes, configs, and directed edges.
- [ ] **DSL Safety:** Condition evaluator safely parses compound rules (`price_change > 5 AND volume > 1000000`) with zero runtime errors.
- [ ] **Graph Traversal & Action Mutation:** Simulating an event causes Note nodes to update text and Action nodes to insert new connected nodes into SQLite.
- [ ] **Real-time Canvas Sync:** React Flow updates dynamically via SWR polling within 2 seconds of backend mutation.
- [ ] **Presenter Simulation Bar:** Presenter can click "Simulate BBCA Surge" and observe live node highlights, note updates, new node creation, toast notification, and log activity without page refresh.
