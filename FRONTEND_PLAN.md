# 🎨 Frontend Implementation Plan: Scriffle

## 1. Overview & Architecture Goals

The frontend serves as the interactive, visual window into Scriffle. It is responsible for:
1. **Interactive Node Graph Editor**: Providing a smooth, Figma Jam/n8n-like canvas where users can drag, connect, configure, and delete nodes.
2. **5 Custom Node Components**: High-fidelity visual cards for each of the 5 allowed node types with clear status indicators and badges.
3. **Live Syncing & Visual Reaction**: Short-polling the backend canvas state (every 2–3s) and animating/highlighting nodes when events trigger them.
4. **Live Execution Feed & Notification Drawer**: Showing real-time log activity, triggered conditions, and market alerts.
5. **Interactive Demo / Simulator Bar**: Giving the presenter a one-click simulation toolbar to inject market spikes (e.g. `BBCA +6.2%`) and watch the canvas react live in front of judges.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          TOP NAVIGATION BAR                            │
│  [ Canvas Title ]  [ + Add Node ]  [ ⚡ Simulate Tick ]  [ Sync Status ]│
└────────────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────┬─────────────────────────┐
│                                              │                         │
│               REACT FLOW CANVAS              │   ACTIVITY & LOG FEED   │
│                                              │                         │
│   ┌───────────────┐     ┌────────────────┐   │  [13:30] 🚀 BBCA surged │
│   │ Watcher: BBCA │ ──► │ Condition: >5% │   │  [13:30] 📝 Note updated│
│   └───────────────┘     └───────┬────────┘   │  [13:30] 🔔 Alert fired │
│                                 │            │                         │
│                         ┌───────▼────────┐   │                         │
│                         │ Action: Note   │   │                         │
│                         └────────────────┘   │                         │
│                                              │                         │
└──────────────────────────────────────────────┴─────────────────────────┘
```

---

## 2. Tech Stack & Library Decisions

* **Framework:** Next.js (React 19 / TypeScript, App Router) or Vite + React.
* **Canvas Engine:** `@xyflow/react` (React Flow v12) — industry standard for interactive node-based graphs.
* **Styling & Icons:** Tailwind CSS + `lucide-react` for clean fintech-grade dark/light mode aesthetic.
* **Data Fetching & Polling:** `swr` or TanStack Query (fetching canvas state and logs with 2-second background refresh).
* **UI Components:** Radix UI primitives / `shadcn/ui` (Dialogs, Dropdowns, Toast notifications, Tooltips).

---

## 3. Custom Node Component Design

Each node is rendered as a custom React Flow node with dedicated styling, input/output handles, and status pills.

### 3.1. Watcher Node (`WatcherNode.tsx`)
- **Visuals:** Purple/Blue border with an eye/radar icon.
- **Header:** `WATCHER: {symbol}` (e.g., `BBCA`).
- **Body:** Metric selector (`price_change`, `volume`, `pe_ratio`), polling interval display, last known price snapshot badge.
- **Handles:** Output handle on the right side.

### 3.2. Condition Node (`ConditionNode.tsx`)
- **Visuals:** Amber/Yellow border with a filter/branch icon.
- **Header:** `CONDITION (RULE)`
- **Body:** Rule expression editor (e.g., `price_change > 5`), evaluation badge (`True / False / Waiting`).
- **Handles:** Input handle on the left, Output handle on the right.

### 3.3. Note Node (`NoteNode.tsx`)
- **Visuals:** Slate/Teal sticky-note card.
- **Header:** `MARKET NOTE`
- **Body:** Rich text display that updates automatically when triggered (supports Markdown or template variables).
- **Handles:** Input handle on the left.

### 3.4. Alert Node (`AlertNode.tsx`)
- **Visuals:** Crimson/Red alert card with a bell icon.
- **Header:** `ALERT TRIGGER`
- **Body:** Target channel (`UI Toast`, `Telegram`, `Webhook`), last triggered timestamp.
- **Handles:** Input handle on the left.

### 3.5. Action Node (`ActionNode.tsx`)
- **Visuals:** Emerald/Green card with a lightning bolt / gear icon.
- **Header:** `SYSTEM ACTION`
- **Body:** Mutation type dropdown (`create_note`, `create_watcher`, `export_canvas`), target configuration.
- **Handles:** Input handle on the left, Output handle on the right.

---

## 4. State Management & Canvas Synchronization

### 4.1. React Flow State vs. Server State
1. **Initial Load:** Fetch canvas graph (`nodes`, `edges`) via `/api/canvas` using SWR.
2. **User Mutations (Optimistic UI):**
   - **Adding Node / Moving Node:** Update local React Flow state immediately -> Debounce/Save coordinates and config to `/api/canvas/nodes`.
   - **Connecting Nodes:** `onConnect` handler triggers `POST /api/canvas/edges` and renders edge immediately.
   - **Deleting Nodes/Edges:** Local delete + API call to `/api/canvas/nodes/:id` or `/api/canvas/edges/:id`.
3. **Backend-Triggered Mutations (Self-Updating Canvas):**
   - SWR polls `/api/canvas` every 2 seconds.
   - When the backend action creates a new node or updates a note's text, React Flow updates smoothly without resetting user viewport/zoom.
   - Nodes triggered in the latest cycle receive a temporary **glow animation** (pulsing highlight).

---

## 5. UI Controls & Presenter Toolbar

### 5.1. Top Navigation Bar
- **Canvas Selector / Title:** Renameable canvas title.
- **Add Node Dropdown:** Quick-insert menu to drop any of the 5 node types onto the canvas at center viewport.
- **Preset Templates:** Quick 1-click loading of standard setups (e.g. *"BBCA Breakout Watcher"* or *"Banking Sector Volume Surge"*).
- **Live Sync Indicator:** Green pulsing dot indicating live backend connectivity.

### 5.2. Judge / Presenter Simulation Bar (Demo Tool)
- Located floating at the bottom or top-right:
  - **"⚡ Simulate Spike" Button:** Triggers `/api/engine/simulate` with customizable mock events (e.g. `BBCA +6.2% price surge`, `BMRI +3x Volume`).
  - **"▶ Poll Live Market" Button:** Forces an immediate fetch from Sectors API.
  - **"🔄 Reset Canvas" Button:** Restores default clean demo canvas state.

### 5.3. Activity Log & Alert Drawer (Collapsible Right Sidebar)
- Stream of all engine events in chronological order:
  - Timestamp, ticker symbol, condition evaluated, and actions triggered.
  - Clicking a log entry highlights and centers the relevant node on the canvas.

---

## 6. Project Directory Structure (Frontend Focus)

```txt
src/
├── app/
│   ├── layout.tsx                 # Root layout with theme & toaster
│   ├── page.tsx                   # Main Canvas Page
│   └── globals.css                # Tailwind & custom node glow animations
├── components/
│   ├── canvas/
│   │   ├── MarketCanvas.tsx       # React Flow container & controls
│   │   ├── nodes/
│   │   │   ├── WatcherNode.tsx    # Watcher node card
│   │   │   ├── ConditionNode.tsx  # Condition DSL node card
│   │   │   ├── NoteNode.tsx       # Auto-updating note node
│   │   │   ├── AlertNode.tsx      # Alert node card
│   │   │   └── ActionNode.tsx     # Action / Self-mutation node card
│   │   └── edges/
│   │       └── AnimatedEdge.tsx   # Custom edge with animated pulses on active events
│   ├── controls/
│   │   ├── TopNav.tsx             # Canvas title, add node menu, presets
│   │   ├── SimulationBar.tsx      # Demo trigger toolbar (judge presentation mode)
│   │   └── NodeConfigModal.tsx    # Modal/drawer for editing node parameters
│   └── feed/
│       └── ActivityFeed.tsx       # Live execution history & alert stream
├── hooks/
│   ├── useCanvasSync.ts           # SWR polling hook with optimistic updates
│   └── useSimulation.ts           # Trigger simulation API calls
└── lib/
    ├── types.ts                   # TypeScript interfaces for nodes, edges, logs
    └── utils.ts                   # Tailwind merge & formatting helpers
```

---

## 7. Verification & Demo Flow Checklist

- [ ] **Drag & Drop / Connect Test:** Verify adding all 5 node types, moving them around, and wiring handles works smoothly.
- [ ] **Real-Time Text Updates:** Trigger a simulation and verify the `NoteNode` content text updates visually without requiring a page refresh.
- [ ] **Self-Mutation Visual:** Trigger an `action` node that creates a child note and verify the new node appears smoothly on the canvas connected with an edge.
- [ ] **Responsive Activity Feed:** Verify logs appear in real-time in the sidebar feed with clickable highlights.
