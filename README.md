# Scriffle

Scriffle is a visual, event-driven workflow automation tool built for financial market research. Think of it as a mashup of Figma Jam and n8n, but wired into the Indonesian stock market.

You build a canvas of connected nodes. The engine watches live market data from the [Sectors.app API](https://sectors.app), evaluates your conditions in real time, and automatically updates the canvas — notes rewrite themselves, alerts fire, new nodes get spawned — all without you lifting a finger.

There is also a built-in Simulation Bar so you can inject fake market spikes (e.g. `BBCA +6.2%`) and watch the whole thing react live during a demo.

---

## How it works

There are exactly five node types you can place on the canvas:

- **Watcher** — tracks a stock ticker and a specific metric (price, volume, rank, etc.)
- **Condition** — evaluates a boolean rule against live data (e.g. `price_change > 5 AND volume > 2 * avg_volume`)
- **Note** — displays market commentary that auto-updates when triggered
- **Alert** — emits a UI toast or external notification when conditions are met
- **Action** — performs canvas mutations like creating a new note or watcher node

Wire them together, set your rules, and let the engine run.

---

## Tech stack

- [Next.js 16](https://nextjs.org) with React 19 and TypeScript
- [React Flow (@xyflow/react)](https://reactflow.dev) for the interactive canvas
- [Prisma](https://www.prisma.io) with SQLite for local persistence
- [Tailwind CSS](https://tailwindcss.com) for styling
- [SWR](https://swr.vercel.app) for short-poll canvas sync (every 2 seconds)
- [expr-eval](https://github.com/silentmatt/expr-eval) for safe DSL expression evaluation
- [Bun](https://bun.sh) as the package manager and runtime

---

## Prerequisites

- [Bun](https://bun.sh) v1.4.0 or later
- Node.js 20 or later (required by Next.js)

---

## Installation

Clone the repo and install dependencies:

```bash
git clone https://github.com/rayyanekaputra/scriffle.git
cd scriffle
bun install
```

Set up the database:

```bash
bunx prisma generate
bunx prisma db push
```

Optionally, seed the database with a demo canvas:

```bash
bunx prisma db seed
```

---

## API key

No environment file or configuration is needed. When you open the app, you enter your Sectors.app API key directly in the UI. It is never stored anywhere — not in localStorage, not on the server, nowhere. Every time you refresh the page, you start fresh.

If you skip the API key, the engine falls back to mock mode and returns realistic dummy data for `BBCA`, `BBRI`, `BMRI`, `TLKM`, and others. This is perfectly fine for development and demos.

---

## Running the app

Start the development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

To build and run in production mode:

```bash
bun run build
bun start
```

---

## Using the Simulation Bar

The Simulation Bar is the floating toolbar on the canvas. It lets you:

- **Simulate Spike** — injects a mock market event (e.g. `BBCA +6.2%`) and fires the full engine cycle
- **Poll Live Market** — forces an immediate fetch from the Sectors API
- **Reset Canvas** — restores the default demo canvas state

This is useful for presentations and demos where you want to show the system reacting in real time without waiting for the market to move.

---

## API reference

The backend exposes a JSON REST API:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/canvas` | Returns the canvas with all nodes and edges |
| `POST` | `/api/canvas/nodes` | Create a new node |
| `PATCH` | `/api/canvas/nodes/:id` | Update a node's position or config |
| `DELETE` | `/api/canvas/nodes/:id` | Delete a node and its connected edges |
| `POST` | `/api/canvas/edges` | Create an edge between two nodes |
| `DELETE` | `/api/canvas/edges/:id` | Delete an edge |
| `GET` | `/api/logs` | Fetch recent execution logs |
| `POST` | `/api/engine/trigger` | Manually trigger a live Sectors API poll and graph run |
| `POST` | `/api/engine/simulate` | Inject a mock market event for instant demo reaction |

---

## Project structure

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── canvas/
│   │   ├── MarketCanvas.tsx
│   │   ├── nodes/
│   │   │   ├── WatcherNode.tsx
│   │   │   ├── ConditionNode.tsx
│   │   │   ├── NoteNode.tsx
│   │   │   ├── AlertNode.tsx
│   │   │   └── ActionNode.tsx
│   │   └── edges/
│   │       └── AnimatedEdge.tsx
│   ├── controls/
│   │   ├── TopNav.tsx
│   │   ├── SimulationBar.tsx
│   │   └── NodeConfigModal.tsx
│   └── feed/
│       └── ActivityFeed.tsx
├── hooks/
│   ├── useCanvasSync.ts
│   └── useSimulation.ts
└── lib/
    ├── types.ts
    └── utils.ts
prisma/
├── schema.prisma
└── seed.ts
```

---

## About

Scriffle was built by **thelast10years** for the [Sectors 2026 Hackathon](https://sectors.app).
