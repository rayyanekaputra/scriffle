# 🛠️ Backend Implementation Plan: Scriffle

## 1. Overview & Architecture Goals

The backend is the **source of truth** for Scriffle. It is responsible for:
1. Storing canvas graph state (nodes, edges, logs, snapshots).
2. Polling external financial market data (Sectors API).
3. Detecting delta changes and emitting domain events.
4. Traversing and executing the node graph via a deterministic pipeline.
5. Mutating canvas state (e.g. self-creating nodes, updating note contents, logging alerts).
6. Exposing REST endpoints for canvas CRUD, execution history, and **demo/testing simulation triggers**.

```
┌─────────────────────────────────────────────────────────────┐
│                    SCHEDULER / TRIGGER                      │
│      (Cron Interval OR Manual Trigger / Demo Simulation)    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    SECTORS DATA FETCHER                     │
│  - Fetch live/mock market metrics for registered Watchers   │
│  - Compute deltas vs. last known state snapshot             │
└──────────────────────────────┬──────────────────────────────┘
                               │ Emits Events: { symbol, metric, value, ... }
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                        GRAPH ENGINE                         │
│  1. Identify Watcher Nodes matching the event               │
│  2. Traverse outgoing edges -> Condition Nodes              │
│  3. Evaluate DSL (e.g. `price_change > 5`)                  │
│  4. If passed -> Traverse to Action / Alert / Note Nodes    │
│  5. Execute Mutations (Update notes, create nodes, log)     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 DATABASE & CANVAS MUTATION                  │
│  - SQLite (Prisma / Drizzle) or LowDB/JSON storage          │
│  - Execution Logs recorded for UI activity feed             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Tech Stack & Library Decisions

* **Runtime & Framework:** Node.js (TypeScript) with Express or Next.js App Router API routes.
* **Database / ORM:** SQLite via **Prisma** or **Drizzle** (Fast setup, zero infrastructure overhead, single-file DB).
* **Safe DSL Evaluation:** `expr-eval` or `filtrex` (guarantees safe arithmetic & boolean evaluation with zero `eval()`).
* **Scheduler:** `node-cron` or simple Node `setInterval` loop with an in-memory lock flag.
* **HTTP Client:** `axios` or native `fetch` for calling Sectors API.

---

## 3. Database Schema Design (SQLite / Prisma)

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}

model Canvas {
  id        String   @id @default(uuid())
  name      String   @default("My Market Canvas")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  nodes     Node[]
  edges     Edge[]
  logs      Log[]
}

model Node {
  id         String   @id @default(uuid())
  canvasId   String
  canvas     Canvas   @relation(fields: [canvasId], references: [id], onDelete: Cascade)
  type       String   // "watcher" | "condition" | "note" | "alert" | "action"
  positionX  Float    @default(0)
  positionY  Float    @default(0)
  configJson String   // JSON stringified node configuration
  stateJson  String?  // JSON stringified runtime state (e.g., last evaluated value, status)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  outgoingEdges Edge[] @relation("FromNode")
  incomingEdges Edge[] @relation("ToNode")
}

model Edge {
  id        String   @id @default(uuid())
  canvasId  String
  canvas    Canvas   @relation(fields: [canvasId], references: [id], onDelete: Cascade)
  fromId    String
  toId      String
  fromNode  Node     @relation("FromNode", fields: [fromId], references: [id], onDelete: Cascade)
  toNode    Node     @relation("ToNode", fields: [toId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([fromId, toId])
}

model MarketSnapshot {
  id          String   @id @default(uuid())
  symbol      String   @unique
  price       Float
  prevPrice   Float?
  priceChange Float?   // Percentage change (e.g. 5.2 for +5.2%)
  volume      Float?
  avgVolume   Float?
  rank        Int?
  rawJson     String?
  updatedAt   DateTime @updatedAt
}

model Log {
  id             String   @id @default(uuid())
  canvasId       String
  canvas         Canvas   @relation(fields: [canvasId], references: [id], onDelete: Cascade)
  eventSummary   String
  triggeredNodes String   // JSON array of node IDs executed
  detailsJson    String?  // Context, payload, outcome
  createdAt      DateTime @default(now())
}
```

---

## 4. Module Breakdown & Step-by-Step Implementation

### Step 4.1: Sectors API Client & Delta Calculator
- **File:** `src/server/services/sectorsApi.ts`
- **Functions:**
  - `fetchCompanyData(symbol: string)`: Calls Sectors API endpoint (e.g., `https://api.sectors.app/v1/company/report/${symbol}/` with `X-API-KEY`).
  - `fetchMarketDeltas(symbols: string[])`: Fetches market data for tracked symbols, compares against `MarketSnapshot` in DB, updates snapshot, and returns an array of structured `MarketEvent`s.
  - Fallback / Mock provider: `fetchMockMarketData()` for offline development or running simulated market swings during demo.

**Event Structure:**
```typescript
interface MarketEvent {
  symbol: string;
  price: number;
  prevPrice: number;
  price_change: number; // in percentage e.g., 6.2
  volume: number;
  avg_volume: number;
  rank_change?: number;
  timestamp: string;
}
```

---

### Step 4.2: Safe Condition DSL Engine
- **File:** `src/server/services/dslEngine.ts`
- Uses `expr-eval` (Parser) to compile and evaluate boolean expressions safely.
- **Rules Supported:**
  - `price_change > 5`
  - `volume > 2 * avg_volume`
  - `price_change > 3 AND volume > 1000000`
- **Function:**
  ```typescript
  export function evaluateCondition(ruleStr: string, context: Record<string, any>): boolean {
    try {
      // Normalize 'AND'/'OR' to 'and'/'or' or '&&'/'||' for parser compatibility
      const normalized = ruleStr.replace(/\bAND\b/g, 'and').replace(/\bOR\b/g, 'or');
      const parser = new Parser();
      const expr = parser.parse(normalized);
      return Boolean(expr.evaluate(context));
    } catch (err) {
      console.error(`DSL syntax or evaluation error for rule: "${ruleStr}"`, err);
      return false;
    }
  }
  ```

---

### Step 4.3: Graph Engine & Event Propagation Pipeline
- **File:** `src/server/services/graphEngine.ts`
- **Execution Flow:**
  1. Load all active nodes and edges for the canvas.
  2. Filter `watcher` nodes matching `event.symbol`.
  3. Traverse child nodes via directed edges using Breadth-First Search (BFS) / Depth-First Search (DFS) while preventing cycles.
  4. At each node:
     - **`condition` Node:** Evaluate `rule` against `event`. If `false`, halt traversal down this branch. If `true`, continue.
     - **`note` Node:** Update note content with template interpolation (e.g. `"${symbol} surged ${price_change}% to ${price} at ${timestamp}"`).
     - **`alert` Node:** Record UI alert entry in `Log` table (or emit webhook/telegram if configured).
     - **`action` Node:** Execute self-mutation logic:
       - `create_note`: Inserts a new note node adjacent to current node (`x + 220, y`), creates edge connecting to it.
       - `create_watcher`: Automatically spins up a watcher for a related or detected ticker.
       - `export_canvas`: Generates JSON snapshot.
  5. Commit all canvas mutations and log entries in a single DB transaction.

---

### Step 4.4: Scheduler & Simulation Hook
- **File:** `src/server/services/scheduler.ts`
- Runs periodic background job using `node-cron` (e.g., every 5 minutes).
- **Critical Hackathon Feature — Simulation / Manual Trigger:**
  - Expose `POST /api/engine/trigger` to execute a run immediately.
  - Expose `POST /api/engine/simulate` with custom payload (e.g., `{ symbol: "BBCA", price_change: 6.5, volume: 5000000 }`) to guarantee instant demonstration to judges.

---

## 5. API Endpoint Specifications

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/canvas` | Get or create default canvas with all nodes and edges |
| `POST` | `/api/canvas/nodes` | Create a new node (type, config, position) |
| `PATCH` | `/api/canvas/nodes/:id` | Update node config or position |
| `DELETE` | `/api/canvas/nodes/:id` | Delete node and its connected edges |
| `POST` | `/api/canvas/edges` | Create a connection between two nodes |
| `DELETE` | `/api/canvas/edges/:id` | Remove a connection |
| `GET` | `/api/logs` | Fetch recent execution logs & alerts for live feed |
| `POST` | `/api/engine/trigger` | Trigger live poll and graph run for all active watchers |
| `POST` | `/api/engine/simulate` | Inject mock market event to test condition & mutation flow |

---

## 6. Verification & Testing Strategy

1. **Unit Testing DSL Parser:** Verify conditions like `price_change > 5`, `volume > 2 * avg_volume`, and invalid expressions fail gracefully.
2. **Graph Traversal Tests:** Test graph execution with a mock canvas:
   - `Watcher (BBCA)` -> `Condition (price_change > 5)` -> `Note (Update text)` -> `Action (Create Child Note)`.
3. **Simulation Endpoint Verification:** Call `/api/engine/simulate` via curl or UI and verify DB nodes are updated/created and logs appear.
