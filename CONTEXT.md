# 🌟 PROJECT CONTEXT: Scriffle

> **FOR AI MODELS / COPILOTS:**  
> Read this file first before implementing any frontend or backend code. This document establishes the master contracts, system architecture, shared TypeScript interfaces, and collaborative workflow guidelines.

---

## 1. Executive Summary

**Scriffle** is an event-driven, visual workflow automation system for financial market research (Figma Jam + n8n hybrid).
* Users create a canvas of connected nodes.
* The system continuously monitors Indonesian stock market data via **Sectors.app API**.
* Backend evaluates user-defined condition rules and **automatically mutates the canvas** (e.g. updating notes, firing alerts, creating new nodes) without requiring manual interaction.
* A built-in **Simulation Bar** allows presenters/judges to inject live market spikes (e.g. `BBCA +6.2%`) to showcase instant visual reactions during demos.

---

## 2. The 5 Core Node Types (Strict Constraint)

The system supports exactly **5 node types**. Do not add extra types.

1. **`watcher` Node:** Tracks a stock ticker and metric (e.g. `BBCA`, `price_change`).
2. **`condition` Node:** Evaluates safe boolean/arithmetic DSL expressions (e.g. `price_change > 5 AND volume > 2 * avg_volume`).
3. **`note` Node:** Displays market commentary and auto-updates text when events trigger it.
4. **`alert` Node:** Emits visual UI toasts or external notification logs.
5. **`action` Node:** Performs system mutations (e.g. `create_note`, `create_watcher`, `export_canvas`).

---

## 3. Master Shared Data Contracts (`src/types/canvas.ts`)

Both frontend and backend must strictly conform to these shared TypeScript definitions.

```typescript
export type NodeType = 'watcher' | 'condition' | 'note' | 'alert' | 'action';

export interface WatcherConfig {
  symbol: string;         // e.g. "BBCA", "BBRI", "BMRI"
  metric: 'price' | 'price_change' | 'volume' | 'rank';
  interval: number;       // in seconds, e.g. 300
}

export interface ConditionConfig {
  rule: string;           // e.g. "price_change > 5 AND volume > 1000000"
}

export interface NoteConfig {
  content: string;        // Text / markdown content
  template?: string;      // e.g. "${symbol} surged ${price_change}% at ${timestamp}"
}

export interface AlertConfig {
  channel: 'ui' | 'telegram' | 'webhook';
  messageTemplate?: string;
}

export interface ActionConfig {
  action: 'create_note' | 'create_watcher' | 'export_canvas';
  params?: Record<string, any>;
}

export type NodeConfig =
  | WatcherConfig
  | ConditionConfig
  | NoteConfig
  | AlertConfig
  | ActionConfig;

export interface CanvasNodeData {
  id: string;
  canvasId: string;
  type: NodeType;
  position: { x: number; y: number };
  config: NodeConfig;
  state?: {
    lastTriggeredAt?: string;
    lastValue?: any;
    status?: 'idle' | 'running' | 'passed' | 'failed' | 'error';
    error?: string;
  };
}

export interface CanvasEdgeData {
  id: string;
  canvasId: string;
  from: string; // source node ID
  to: string;   // target node ID
}

export interface MarketEvent {
  symbol: string;
  price: number;
  prevPrice: number;
  price_change: number; // Percentage e.g. 6.2 for +6.2%
  volume: number;
  avg_volume: number;
  rank?: number;
  rank_change?: number;
  timestamp: string;
}

export interface ExecutionLog {
  id: string;
  canvasId: string;
  eventSummary: string;
  triggeredNodes: string[];
  details?: Record<string, any>;
  createdAt: string;
}
```

---

## 4. API Endpoints Contract

All endpoints follow standard JSON REST patterns:

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/canvas` | Returns `{ id, name, nodes, edges }` |
| `POST` | `/api/canvas/nodes` | Create node `{ type, position, config }` |
| `PATCH` | `/api/canvas/nodes/:id` | Update node position or config |
| `DELETE` | `/api/canvas/nodes/:id` | Delete node and attached edges |
| `POST` | `/api/canvas/edges` | Create edge `{ from, to }` |
| `DELETE` | `/api/canvas/edges/:id` | Delete edge |
| `GET` | `/api/logs` | Fetch recent execution logs |
| `POST` | `/api/engine/trigger` | Manually triggers live Sectors API poll & graph run |
| `POST` | `/api/engine/simulate` | Injects mock `MarketEvent` payload for instant demo reaction |

---

## 5. Dual-Mode Sectors.app Integration

* **Live Mode:** Used when `SECTORS_API_KEY` is present in `.env.local`. Fetches data from official Sectors endpoints with `X-API-KEY`.
* **Mock / Offline Mode:** Used when `SECTORS_API_KEY` is not set or when using the demo Simulation Bar. Returns instant realistic ticker data for `BBCA`, `BBRI`, `BMRI`, `TLKM`, etc.

---

## 6. Two-Developer Vibecoding Division

| Role | Developer | Responsibilities | Target Plan |
|---|---|---|---|
| **Graph & Visuals Lead** | Dev A | React Flow canvas setup, 5 custom node cards, animations, activity feed UI, optimistic state. | `FRONTEND_PLAN.md` |
| **Engine & Integration Lead** | Dev B | Sectors API client, safe DSL evaluator (`expr-eval`), graph traversal engine, Prisma/SQLite DB, simulation bar endpoints. | `BACKEND_PLAN.md` |

### Coding Rules for AI Assistants:
1. **Always reference `src/types/canvas.ts`:** Never invent ad-hoc JSON structures.
2. **Keep code modular:** Separate custom nodes into individual component files and backend services into isolated single-purpose modules.
3. **No Insecure `eval()`:** Always use `expr-eval` or `filtrex` for the Condition DSL.
4. **Short-polling over WebSockets:** Frontend polls canvas state every 2 seconds via SWR for robust, lightweight synchronization.
