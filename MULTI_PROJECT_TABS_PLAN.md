# Implementation Plan: Multi-Project & Multi-Tab Canvas Support

## 1. Executive Summary & Answer to User Question

> **Do we need different ports or complex server sessions?**
> **No.** You do not need multiple ports or separate server processes. 
> A single Next.js server instance handles unlimited simultaneous tabs and projects using **URL-based routing** (e.g. `http://localhost:3000/b/[id]`).

### How It Works (1 Browser Tab = 1 Project)
- **Tab A**: `http://localhost:3000/b/proj_banking_sector` (Loads Banking canvas from SQLite)
- **Tab B**: `http://localhost:3000/b/proj_momentum_breakout` (Loads Momentum canvas from SQLite)
- **Tab C**: `http://localhost:3000/b/new` (Creates a fresh blank board with a unique ID)

Each tab has its own React lifecycle, its own SWR cache keyed by `canvasId`, and its own session API key in memory.

---

## 2. Project Lifecycle: "New Project", "Close Project", & Safety

```
[ Current Board: Tab 1 ]
   │
   ├── Click "New Project" ──> Opens fresh board in new tab OR prompts to export current & redirects
   │
   └── Click "Close / Switch Project" ──> 
          1. Auto-saves all current node/edge states in SQLite
          2. Opens the Project Drawer / Hub modal with full project list
          3. Allows exporting .scriffle backup or switching to another board
```

### Safety & Persistence Rules:
1. **Continuous SQLite Auto-Sync**: Every node addition, drag, deletion, connector change, and rename is already persisted to SQLite in real-time. Closing a tab or switching projects never loses unsaved canvas data.
2. **Export Safeguard on Close**: When choosing "Close Project" or switching boards, the user can download a `.scriffle` backup file in 1 click or switch directly.
3. **Open in New Tab**: Clicking any project from the switcher or clicking "+ New Project (Tab)" automatically uses `window.open('/b/new', '_blank')` to keep the current project open while launching the new one.

---

## 3. Step-by-Step Implementation

### Step 1: Dynamic Route Structure in Next.js
1. **`src/app/b/[id]/page.tsx`**:
   - Client component extracting `params.id` (or `useParams()`) and passing `canvasId` to `WhiteboardContent`.
2. **`src/app/page.tsx`**:
   - Redirects to `/b/default` or creates a default `untitled board` and forwards to `/b/[id]`.

### Step 2: API Route Updates (Canvas Scoping)
1. **`GET /api/canvas?id=<canvasId>`**:
   - If `id` provided and exists in SQLite: returns that specific canvas, nodes, edges, logs.
   - If `id="new"` or doesn't exist: creates a new canvas with that ID and returns it.
2. **`GET /api/canvas/list` (New Endpoint)**:
   - Returns all saved canvases with metadata: `{ id, name, updatedAt, nodeCount, edgeCount }`.
3. **`PATCH /api/canvas`**:
   - Updates `{ id, name }` for the specific canvas.
4. **`DELETE /api/canvas?id=<canvasId>` (New Endpoint)**:
   - Allows deleting old/abandoned projects with cascading cleanup.
5. **`POST /api/canvas/restore`**:
   - Restores into specific `canvasId` or creates a new board and returns its ID for instant redirection.

### Step 3: UI Controls & Actions
1. **Project Switcher & Actions Popover in [TopNav.tsx](file:///home/abzolute/Projects/hackathon/src/components/controls/TopNav.tsx)**:
   - Clickable dropdown next to project title with:
     - **`+ New Project`** (open in new tab or current tab)
     - **`📂 Switch Project`** (shows recent boards with node counts and last edited timestamps)
     - **`💾 Save as .scriffle`**
     - **`✕ Close Project`** (returns to project picker / creates fresh board)
2. **SimulationBar Integration**:
   - Project File card in [SimulationBar.tsx](file:///home/abzolute/Projects/hackathon/src/components/controls/SimulationBar.tsx) updated with quick "New Board" and "Switch Board" triggers.

---

## 4. Verification Plan

1. Open Tab 1 (`/b/proj-1`), create Banking Watcher nodes, rename to "Banking Trio".
2. Click "+ New Project (New Tab)" → Tab 2 opens at `/b/[new-id]`, rename to "Tech Momentum".
3. Verify both tabs update independently without cross-contaminating nodes, edges, or live feeds.
4. Close Tab 1, reopen `/b/proj-1`, verify entire canvas layout and history are fully restored from SQLite.
