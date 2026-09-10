# 📌 CHECKPOINT & CONTEXT HANDOVER: Scriffle

> **FOR NEXT AI MODEL / COPILOT IN SUBSEQUENT SESSIONS:**  
> Read this file to instantly understand what has been designed, implemented, and verified in this codebase.

---

## 🌟 1. Project Summary & Identity
**Scriffle** is an event-driven, visual workflow whiteboard for financial market research on Indonesian stocks (via Sectors API).
* **Vibe & Style:** True **FigJam / Whiteboard hybrid** (NOT an IDE or dark-mode n8n). Flat outline design system with clean 2px borders, zero drop shadows, soft dotted canvas, and colorful tactile sticky notes.
* **Typography:** Strict **`Stack Sans Text`** loaded directly from Google Fonts. Zero all-caps, zero spaced-out letters. Clean sentence/title case.
* **Icons:** **MingCute Icons** loaded locally from `public/mingcute/Mingcute.css` (e.g. `MingIcon name="..."`).
* **Runtime & Package Manager:** **Bun** (v1.4.0) exclusively.

---

## 🧩 2. Core Concepts & Features Implemented

### 2.1 The Node System
* **`watcher` (Radar sticker):** Monitors Indonesian stock tickers (`BBCA`, `BBRI`, `BMRI`, `TLKM`, `ASII`). Displays current price, price change, polling interval, and a **cycle counter** (`⚡ 12 runs`) that increments on each run.
* **`condition` (Rule capsule):** Evaluates boolean rules safely using `expr-eval` (e.g. `price_change > 5 AND volume > 1000000`). Zero insecure `eval()`.
* **`note` (FigJam Sticky Note):** **Direct inline editable on canvas** without popups. Supports pastel color themes (`yellow`, `mint`, `pink`, `blue`, `purple`) and template interpolation (e.g. `${symbol} surged ${price_change}%`).
* **`alert` (Notification sticker):** Emits UI notifications and logs them to the activity feed.
* **`action` (Mutation capsule):** Automatically mutates the canvas by inserting new connected sticky notes or watchers when upstream conditions pass.
* **`text` (FigJam × Miro Rich Freeform Text):**
  * **Direct inline editable on canvas** with auto-growing textarea and zero awkward scrollbars.
  * **Floating Contextual Formatting Toolbar (`TextFormatToolbar`):** Docks above active card with 4-level typography scale (`H1 Title`, `H2 Header`, `Body`, `Note/Caption`), styling toggles (`Bold`, `Italic`, `Underline`, `Strikethrough`), text alignment (`Left`, `Center`, `Right`), pastel highlighter markers (`Yellow`, `Mint`, `Coral`, `Purple`), and container styles (`Plain`, `Callout Banner`, `Card Box`).
  * **Interactive Width Resizing:** Corner `<NodeResizer />` drag handles to set custom wrapping boundaries persisted to SQLite.
  * **Markdown Prefix Triggers:** `# ` auto-converts to H1 Title, `## ` auto-converts to H2 Header, `- ` / `* ` starts bulleted lists with `Enter` continuation.
  * **`T` Hotkey Placement:** Press `T` anywhere on canvas to immediately drop free-text at mouse cursor with auto-focus.
* **`sticker` (Market Stickers):** Flat badge stickers with MingCute icons (`Bullish`, `Bearish`, `Breakout Ready`, `Target Hit`, `Top Pick`, `High Volatility`, `Thesis Approved`).
* **`image` (Image Studio Node):**
  * **Upload:** Via top toolbar button, right-click context menu, or file drop.
  * **Clipboard Copy & Paste:** Press `Ctrl+V` / `Cmd+V` to paste images directly from OS clipboard onto the canvas at current cursor coordinates.
  * **Transparency:** Full support for transparent `.png` files with zero white background boxes.
  * **Interactive Resizing:** Click an image to drag corner `<NodeResizer />` handles (aspect-ratio locked & persisted to SQLite).

### 2.2 Whiteboard Interactions, Project Files & Shortcuts
* **Project Save & Open (`.scriffle` Format):**
  * **Save / Export:** 1-click **Save** button in top navbar creates and downloads `<canvas_name>.scriffle` (UTF-8 JSON formatted).
  * **Open / Import:** **Open** button with native file picker (`.scriffle`, `.json`) + Drag & Drop `.scriffle` file directly onto the canvas to restore full graph.
  * **Starter Presets:** Quick template dropdown in Demo Controls to load `"Rotation Engine"` (complex multi-branching pipeline), `"Momentum Breakout Loop"`, or `"Banking Sector Trio"`.
  * **Atomic Restore API (`/api/canvas/restore`):** Validates nodes/edges and cleanly replaces canvas with run counters reset to 0.
* **Group & Ungroup System (`Cmd+G` / `Cmd+Shift+G`):**
  * **Cohesive Selection & Dragging:** Multi-select nodes and press `Cmd+G` to group them into a single cohesive unit. Clicking any member node selects and drags the whole group synchronously.
  * **Group-Aware Copy & Paste (`Cmd+C` / `Cmd+V` / `Cmd+D`):** Copies group members, their relative spatial offsets, and internal connecting edges. Pasting assigns a fresh `groupId` and recreates the internal connections at the cursor position.
  * **Double-Click Isolation Focus Mode:** Double-clicking an element in a group isolates the canvas into that group with a top status banner, allowing individual element editing and `Shift+Click` sub-selections. Press `Escape` or click the empty canvas to exit.
  * **Ungroup (`Cmd+Shift+G`):** Dissolves groups back into standalone elements.
* **Multi-Selection, Box Select & Figma Bounding Box Handles:**
  * `Shift + Click` or `Ctrl/Cmd + Click` to toggle select multiple elements concurrently.
  * `Shift + Drag` marquee box selection to group-select cards and connectors.
  * **Figma-Style Selection Bounding Box (`SelectionBoundingBox`):** Automatically frames multi-selected elements with 8 tactile square corner & midpoint handles, a dashed boundary outline, and floating interactive quick `Group` / `Ungroup` action pills.
  * `Delete` / `Backspace` removes all selected elements in bulk.
* **Keyboard Shortcuts:**
  * **`Delete` / `Backspace`:** Deletes selected card(s) and connector(s).
  * **`Ctrl+C` / `Cmd+C`:** Copy selected card.
  * **`Ctrl+V` / `Cmd+V`:** Paste copied card at cursor position on canvas.
  * **`Ctrl+D` / `Cmd+D`:** Quick duplicate adjacent to active card.
  * **`Escape`:** Deselect nodes & close context menus.
* **Right-Click on Canvas:** Context menu to drop Sticky Notes, Watchers, Conditions, Free Text, Image upload, Stickers, Alerts, or Actions at the exact mouse coordinates (`screenToFlowPosition`).
* **Right-Click on Elements & Connectors:** Context menu to Edit, Change Sticky Color, or Delete element/connector.
* **Sticky Notes Resizing & Edit Modal:**
  * Interactive `<NodeResizer />` handles on canvas with overflow cropping.
  * Right-click -> "Edit element" opens full detail modal with char/word counter, dynamic variable insertion, color picker, and dimension reset.
* **Presenter Simulation Bar:** Floating bottom dock with quick demo triggers and continuous live ticker streaming.
* **Activity Feed & Backtracking:**
  * **Human-readable node chips** with MingCute icons (`Watcher (BBCA) → Rule → Toast`).
  * **1-click smooth camera pan & zoom** to fly directly to any card.
  * **Hover execution chain glow** illuminating active paths across the canvas.
  * **Drag-to-resize sidebar width** (280px to 750px) with quick reset.
  * **Clear Activity Feed button** with confirmation modal that pauses streaming and resets all card run counters to `0`.
* **Sectors API Key & Live Watcher Polling:**
  * **Session-Only Storage:** Managed in temporary React client state. Automatically wiped on tab close or refresh. Never saved to SQLite and excluded from `.scriffle` exports.
  * **Masked Input & Reveal Toggle:** Password-style masked input with eye reveal toggle (`eye_line` / `eye_close_line`) and clear button.
  * **Privacy Guarantee Banner:** User-facing shield notice assuring keys stay private and local to the browser session.
  * **Live Mode vs. Mock Mode:** Mode pill dynamically switches between `🟢 Live API v2` and `⚪ Offline Mock`.
  * **1-Click Live Poll Button:** Clicking **"Poll Live Sectors API"** sends the key to `POST /api/engine/trigger`, fetching real daily OHLCV from `https://api.sectors.app/v2/daily/{symbol}/` for all active canvas Watchers (`BBCA`, `BBRI`, `TLKM`, etc.) and executing downstream conditions.
* **Toast Notifications:** Located at bottom-left with reverse stacking and slide-in animations.

### 2.3 Implementation Plans Saved in Context Directory (`context/`)
* [`FREE_TEXT_EXPERIENCE_PLAN.md`](file:///home/abzolute/Projects/hackathon/context/FREE_TEXT_EXPERIENCE_PLAN.md): FigJam × Miro rich free-text whiteboard tooling, floating formatting toolbar, typography hierarchy, highlighter pens, and container styles.
* [`GROUP_UNGROUP_IMPLEMENTATION_PLAN.md`](file:///home/abzolute/Projects/hackathon/context/GROUP_UNGROUP_IMPLEMENTATION_PLAN.md): Group & ungroup architecture, group-aware copy/paste with internal connectors, and double-click group isolation focus.
* [`SECTORS_API_KEY_LIVE_POLL_PLAN.md`](file:///home/abzolute/Projects/hackathon/context/SECTORS_API_KEY_LIVE_POLL_PLAN.md): Details on masked API key session management, live polling, and mode toggling.
* [`SAVE_OPEN_SCRIFFLE_PLAN.md`](file:///home/abzolute/Projects/hackathon/context/SAVE_OPEN_SCRIFFLE_PLAN.md): Details on `.scriffle` file schema, backend restore endpoint, and starter presets.
* [`ACTIVITY_FEED_BACKTRACKING_PLAN.md`](file:///home/abzolute/Projects/hackathon/context/ACTIVITY_FEED_BACKTRACKING_PLAN.md): Details on human-readable labels, camera panning, and chain glow.
* [`KEYBOARD_SHORTCUTS_PLAN.md`](file:///home/abzolute/Projects/hackathon/context/KEYBOARD_SHORTCUTS_PLAN.md): Details on keyboard shortcuts, clipboard buffers, and input safety guards.
* [`ENDPOINTS.md`](file:///home/abzolute/Projects/hackathon/context/ENDPOINTS.md): Complete index of all 32 Indonesia v2 Sectors API endpoints.

---

## 🏗️ 3. Architecture & Tech Stack

* **Framework:** Next.js 16 (App Router, Turbopack, React 19, TypeScript) with **Bun**.
* **Canvas:** `@xyflow/react` (React Flow v12) in Light Mode with dot grid background (`#F8F9FC`) and `<NodeResizer />`.
* **Styling:** Tailwind CSS v4 with custom Flat Outline System (zero shadows).
* **Database & ORM:** SQLite (`dev.db`) with **Prisma 5.22.0**.
* **Synchronization:** SWR short-polling (`/api/canvas` & `/api/logs`) every 2 seconds.
* **External Financial Data:** Sectors.app API with automatic offline mock fallback for IDX blue chips.

---

## 📂 4. Key File Map

```txt
hackathon/
├── prisma/
│   ├── schema.prisma                  # SQLite models (Canvas, Node, Edge, Log, MarketSnapshot)
│   └── seed.ts                        # FigJam demo canvas seed script
├── public/
│   └── mingcute/                      # Local MingCute font files & Mingcute.css
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── canvas/
│   │   │   │   ├── route.ts           # GET canvas state
│   │   │   │   ├── nodes/
│   │   │   │   │   ├── route.ts       # POST create node
│   │   │   │   │   └── [id]/route.ts  # PATCH & DELETE node
│   │   │   │   └── edges/
│   │   │   │       ├── route.ts       # POST connect edge
│   │   │   │       └── [id]/route.ts  # DELETE edge
│   │   │   ├── engine/
│   │   │   │   ├── simulate/route.ts  # Inject mock market event
│   │   │   │   └── trigger/route.ts   # Trigger live Sectors poll & graph execution
│   │   │   └── logs/route.ts          # Activity logs feed
│   │   ├── globals.css                # Stack Sans Text font & flat outline zero-shadow styles
│   │   ├── layout.tsx                 # Google Font + MingCute font-face loading
│   │   └── page.tsx                   # Main Whiteboard page
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── MarketCanvas.tsx       # React Flow canvas, clipboard paste, context menus & drop events
│   │   │   ├── ContextMenu.tsx        # Right-click context menus for canvas and nodes
│   │   │   ├── SelectionBoundingBox.tsx # Figma-style 8-point bounding box handles & group pills
│   │   │   └── nodes/
│   │   │       ├── WatcherNode.tsx    # Watcher sticker + cycle counter
│   │   │       ├── ConditionNode.tsx  # Condition rule capsule
│   │   │       ├── NoteNode.tsx       # Direct inline editable FigJam sticky note
│   │   │       ├── AlertNode.tsx      # Alert sticker
│   │   │       ├── ActionNode.tsx     # Mutation automation sticker
│   │   │       ├── TextNode.tsx       # Direct inline editable free text with markdown triggers
│   │   │       ├── StickerNode.tsx    # Transparent badge stickers
│   │   │       ├── ImageNode.tsx      # Resizable transparent Image node with NodeResizer
│   │   │       ├── FileNode.tsx       # Universal attached file & PDF brief preview
│   │   │       └── text/
│   │   │           └── TextFormatToolbar.tsx # Floating formatting toolbar (typography, highlight, container)
│   │   ├── controls/
│   │   │   ├── TopNav.tsx             # Floating whiteboard toolbar & sticker/image picker
│   │   │   ├── SimulationBar.tsx      # Presenter demo dock (BBCA surge, volume spike)
│   │   │   └── EditNodeModal.tsx      # Modal editor for structured nodes
│   │   ├── feed/
│   │   │   └── ActivityFeed.tsx       # Live activity stream
│   │   └── ui/
│   │       └── MingIcon.tsx           # Reusable MingCute icon component
│   ├── hooks/
│   │   └── useCanvasSync.ts           # SWR polling hook (2s interval)
│   ├── lib/
│   │   ├── prisma.ts                  # Global Prisma client singleton
│   │   └── utils.ts
│   ├── server/
│   │   ├── services/
│   │   │   ├── dslEngine.ts           # Safe expr-eval parser
│   │   │   ├── graphEngine.ts         # BFS graph traversal, self-mutations & cycle counting
│   │   │   └── sectorsApi.ts          # Live & mock Sectors API data fetcher
│   │   └── test-engine.ts             # Direct engine smoke test runner
│   └── types/
│       └── canvas.ts                  # Master TypeScript contracts
```

---

## ⚡ 5. Verification & Common Commands

* **Run Dev Server:** `bun dev` (runs on `http://localhost:3000`)
* **Run Production Build:** `bun run build`
* **Reset & Seed Demo Canvas:** `bun run prisma/seed.ts`
* **Run Engine Smoke Test:** `bun run src/server/test-engine.ts`
* **Push DB Schema Changes:** `bunx prisma db push`
