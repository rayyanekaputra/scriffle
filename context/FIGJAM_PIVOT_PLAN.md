# 📋 Implementation Plan: Scriffle (FigJam / Visual Canvas Pivot)

## 1. Vision & Concept Pivot
Pivot **Scriffle** from a developer-styled workflow engine (n8n/dark-mode IDE) to a **playful, tactile FigJam-style whiteboard & visual clipboard** for financial market ideas:
* **FigJam Visual Aesthetic:** Tactile sticky notes, geometric shapes (circles, pills, rounded squares), doodle badges, colored stickers, and emoji-driven status cues.
* **Watcher Cycle Counter:** Visual counter / odometer showing how many poll cycles a watcher has completed (e.g. `14 runs`).
* **Design & Typography System:**
  * Font: **Plus Jakarta Sans / Stack Sans Text** from Google Fonts.
  * Theme: **Light mode by default**.
  * Color Palette: Electric Blue primary (`#0050FF`), Vibrant Yellow accent (`#FFD728`), Mint Green (`#10B981`), Coral Pink (`#FF5B79`), Lavender Violet (`#8B5CF6`), and warm canvas backgrounds (`#F8F9FC` with soft dot grid).
  * Typography Rule: **Zero all-uppercase text and zero wide-spaced letter spacing** (no `T H I S` or `ALL CAPS`). Clean, modern sentence/title case.

---

## 2. Phase-by-Phase Execution Order

```
Phase 1: Design Tokens, Fonts & Light Mode Theme Setup
   ▼
Phase 2: Database & Backend Engine Cycle Counter Updates
   ▼
Phase 3: FigJam-Style Custom Canvas Nodes Redesign (Sticky Notes, Badges, Emojis)
   ▼
Phase 4: FigJam Toolbar, Presenter Simulation Dock & Activity Drawer
   ▼
Phase 5: Verification, Interactive Demo Flow & Build Verification
```

---

### 🎨 Phase 1: Design Tokens, Typography & Light Theme
**Goal:** Establish the new FigJam aesthetic foundation across all components.

1. **Google Fonts Integration:**
   * Import Google Font (`Plus Jakarta Sans` / `Stack Sans Text`) in [`src/app/layout.tsx`](file:///home/abzolute/Projects/hackathon/src/app/layout.tsx).
   * Set root font family in Tailwind configuration and [`src/app/globals.css`](file:///home/abzolute/Projects/hackathon/src/app/globals.css).
2. **Light Theme & Palette Configuration:**
   * Primary: `#0050FF` (Cobalt / Electric Blue).
   * Secondary / Accents: `#FFD728` (Warm Sunny Yellow), `#10B981` (Mint), `#FF5B79` (Coral Pink), `#8B5CF6` (Lavender).
   * Canvas background: `#F8FAFC` / `#F1F5F9` with soft dotted grid (`#CBD5E1`).
   * Clean typography standards: Strip all `tracking-wider`, `tracking-widest`, `uppercase`, and robotic monospace label conventions in favor of friendly sentence casing.

---

### ⚙️ Phase 2: Watcher Cycle Counter & Engine Updates
**Goal:** Track execution count per watcher and propagate state to the whiteboard.

1. **Model & State Update:**
   * Update `WatcherNode` state schema in [`src/types/canvas.ts`](file:///home/abzolute/Projects/hackathon/src/types/canvas.ts) to include `cycleCount: number`.
2. **Graph Engine Increment Logic (`src/server/services/graphEngine.ts`):**
   * Increment `cycleCount` whenever a watcher is polled or triggered.
   * Update the node's `stateJson` in SQLite.
3. **Database Seed Refresh (`prisma/seed.ts`):**
   * Update seed data with FigJam-style initial sticky notes, emojis, and initial cycle counts.

---

### 📝 Phase 3: FigJam Node Cards Redesign (5 Node Types)
**Goal:** Replace developer cards with tactile FigJam sticky notes, badges, and shapes.

1. **`WatcherNode.tsx` (Stock Radar Sticker):**
   * Visual: Crisp white rounded card with `#0050FF` accents, stock ticker chip, and an emoji icon (📡 / 📈).
   * **Cycle Counter:** Playful counter badge showing run iterations (e.g. `⚡ 12 cycles` or `12 runs`).
   * Price & change pill in soft mint green or coral pink.
2. **`ConditionNode.tsx` (Decision Diamond / Filter Capsule):**
   * Visual: Sunny Yellow (`#FFD728`) sticky card / pill with a filter emoji (🔍 / ⚖️).
   * Clean plain-language expression badge (e.g. `If price change > 5%`).
   * Pass/Fail status sticker (`✨ Passed` / `⏳ Waiting`).
3. **`NoteNode.tsx` (Tactile Sticky Note):**
   * Visual: Pastel yellow/mint/pink sticky note with subtle paper drop shadow, tilt, and hand-written/casual research text.
   * Auto-updating commentary formatted like a real FigJam sticky note with emojis.
4. **`AlertNode.tsx` (Notification Bell Sticker):**
   * Visual: Coral pink (`#FF5B79`) alert badge with notification bell emoji (🔔 / 📣).
   * Clear channel indicator (e.g. `Toast notification`).
5. **`ActionNode.tsx` (Automation Sparkle Capsule):**
   * Visual: Cobalt blue (`#0050FF`) badge with lightning/sparkle emoji (⚡ / 🪄).
   * Action preview (e.g. `Creates new note on breakout`).

---

### 🎛️ Phase 4: FigJam Toolbar, Presenter Bar & Activity Sidebar
**Goal:** Create a clean, floating FigJam-style whiteboard navigation and demo dock.

1. **FigJam Floating Top Bar (`src/components/controls/TopNav.tsx`):**
   * Centered floating whiteboard pill toolbar.
   * Clean buttons with icons & emojis to drop Sticky Notes, Watchers, Conditions, Alerts, and Actions onto the board.
2. **Presenter Demo Dock (`src/components/controls/SimulationBar.tsx`):**
   * Modern floating bottom dock with vibrant pill buttons:
     * `🚀 Simulate BBCA Surge (+6.37%)`
     * `📊 Simulate BBRI Volume Surge`
     * `🔄 Poll Market Data`
     * `🧹 Reset Board`
3. **Activity & Insights Drawer (`src/components/feed/ActivityFeed.tsx`):**
   * Clean light-mode sidebar with soft shadows, timeline avatars, and highlighted ticker tags.

---

### 🧪 Phase 5: Verification & Demo Testing
1. Verify typography (Stack Sans Text / Plus Jakarta Sans) and color palette (`#0050FF`, `#FFD728`).
2. Verify all 5 custom node cards render as FigJam stickers/sticky notes with no all-caps or spaced text.
3. Test simulation triggers and verify the **cycle counter** increments on each poll.
4. Run `bun run build` to confirm zero type or compilation errors.

---

## 3. Deliverables Checklist

- [ ] `src/app/layout.tsx` & `src/app/globals.css`: Light theme & Google Font integration.
- [ ] `src/types/canvas.ts`: `WatcherConfig` & `cycleCount` state updates.
- [ ] `src/server/services/graphEngine.ts`: Cycle counter tracking per run.
- [ ] `src/components/canvas/nodes/`: 5 redesigned FigJam sticky notes & shape cards.
- [ ] `src/components/controls/`: Floating FigJam toolbar & Presenter Simulation dock.
- [ ] `src/components/feed/ActivityFeed.tsx`: Clean light-mode timeline feed.
