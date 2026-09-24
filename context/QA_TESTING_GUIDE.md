# 🧪 Scriffle QA Testing Guide — Pre-Production Freeze

> **For QA partner:** This is your complete testing checklist before we freeze the build for Saturday. Go through each section top-to-bottom. Mark each item ✅ Pass, ❌ Fail (note what broke), or ⚠️ Partial. The app runs at `http://localhost:3000`. Use **Mock Mode** (no API key needed) for all tests unless stated otherwise.
>
> **Goal:** Zero regressions. If something fails, log it in `context/BUG_FIXES_PLAN.md` with repro steps.

---

## 0. Setup

1. Clone repo and install: `bun install`
2. Push DB schema: `bunx prisma db push`
3. Seed demo canvas: `bun run prisma/seed.ts`
4. Start dev server: `bun dev`
5. Open `http://localhost:3000` — you should be redirected to `/b/<canvas-id>`
6. **Do NOT enter a Sectors API key** for most tests. Mock mode is sufficient and doesn't burn credits.

---

## 1. Canvas Basics

### 1.1 Canvas Load & Navigation
- [ ] Page loads without JS console errors
- [ ] Canvas shows a dot-grid background (`#F8F9FC` with `#CBD5E1` dots)
- [ ] Panning works: click-drag on empty canvas area
- [ ] Zooming works: scroll wheel / trackpad pinch
- [ ] `Shift+1` — fits all nodes to screen
- [ ] `Shift+0` — resets zoom to 100%
- [ ] Bottom-left zoom controls pill is visible: percentage display, preset dropdown (50%, 100%, 150%, 200%, Fit All)

### 1.2 Right-Click Context Menu on Canvas
- [ ] Right-click on empty canvas area opens context menu
- [ ] Menu shows all node types: Watcher, Condition, Sticky Note, Alert, Action, AI Screener, Text, Sticker, Image, File
- [ ] Clicking any item places the node at or near the cursor position
- [ ] Menu dismisses on Esc or outside-click

### 1.3 Canvas Tool Modes (V / H keys)
- [ ] Press `V` → Move mode: cursor is arrow on canvas, pointer on cards
- [ ] Press `H` → Hand mode: cursor is grab hand on canvas, grabbing when dragging
- [ ] TopNav shows the correct active tool button highlight

---

## 2. Node Creation — Toolbar (NavToolbar)

Open the toolbar (top-left floating bar).

- [ ] **Watcher** button → drops Watcher node at viewport center
- [ ] **Condition** button → drops Condition node at viewport center
- [ ] **Sticky Note** button → drops Note node at viewport center
- [ ] **Alert** button → drops Alert node at viewport center
- [ ] **Action** button → drops Action node at viewport center
- [ ] **AI Screener** button → drops Screener node at viewport center (shows `3 cr` badge)
- [ ] **Text** button → drops Text node at viewport center
- [ ] **Sticker** split button → single-click drops a default sticker at center; chevron opens 8 preset dropdown
- [ ] **Image** button → opens file picker for image upload
- [ ] **File** button → opens file picker for any file

**Verify placement:** Each node appears at approximately the viewport center (not at static top-left `300, 200`).

### 2.1 T Hotkey
- [ ] Press `T` anywhere on canvas → Text node drops at mouse cursor position with auto-focus

---

## 3. Node Cards — Appearance & States

### 3.1 Watcher Node
- [ ] Card renders: white card, blue accents, "Radar" or ticker label
- [ ] Shows `⚡ 0 runs` on fresh create (clean initial state — NOT premature mock data)
- [ ] Shows `Mock` badge in offline mode
- [ ] Credit badge visible in footer: `🪙 1 credit / tick` (single) or `🪙 10 credits / poll` (radar)

### 3.2 Condition Node
- [ ] Yellow capsule renders correctly
- [ ] Shows rule text (e.g. `price_change > 5`)
- [ ] **Two output handles visible on right side:** upper green `True` port, lower red `False` port

### 3.3 Note Node
- [ ] Pastel sticky note renders (default yellow)
- [ ] Content is directly inline-editable — click to focus
- [ ] Color changes reflect on card
- [ ] Resize handles appear on hover

### 3.4 Alert Node
- [ ] Coral/red notification card renders
- [ ] Channel badge pill visible (`UI` by default)

### 3.5 Action Node
- [ ] Cobalt capsule renders
- [ ] Credit badge visible: `🪙 8 credits / symbol` or `⚡ 0 credits (local)` depending on action
- [ ] Label shows dynamic symbol or `(Dynamic)` — not hardcoded `BBRI`

### 3.6 AI Screener Node
- [ ] Blue card with query prompt badge
- [ ] `🪙 3 AI credits / query` cost badge visible
- [ ] `⚡ Run` button visible

### 3.7 Text Node
- [ ] Transparent freeform block
- [ ] Click to select, click again (when selected) → enters edit mode
- [ ] Double-click always enters edit mode
- [ ] No dimensional jump between view and edit mode (WYSIWYG)

### 3.8 Sticker Node
- [ ] Transparent badge sticker
- [ ] Click emoji → inline quick-picker popover appears
- [ ] Double-click label → label becomes editable inline
- [ ] Color palette (7 colors) appears on hover/select

### 3.9 Image Node
- [ ] Renders with no white background box (transparent PNG)
- [ ] Resize handles visible (corner + edge)
- [ ] Aspect ratio is preserved during resize

### 3.10 File Node
- [ ] Shows file name, extension badge, category icon
- [ ] Badges are high-contrast (not faint pastels)
- [ ] No `tracking-wider` on extension label
- [ ] When `savedLocally: true` → shows green `✓ Saved` pill

---

## 4. Node Editing — Edit Modal (`EditNodeModal`)

Double-click any automation node (Watcher, Condition, Note, Alert, Action, Screener) to open the modal.

### 4.1 General Modal Rules
- [ ] Modal opens with `max-h-[88vh]` — does NOT overflow the screen
- [ ] Header is pinned at the top
- [ ] "Save Changes" and "Cancel" buttons are pinned at the bottom
- [ ] Body scrolls independently when content is tall
- [ ] Modal closes on "Cancel" without saving changes
- [ ] Modal closes on "Save Changes" and the node card reflects updated config

### 4.2 Watcher Config
- [ ] Can set symbol (e.g. `BBCA`, `TLKM`)
- [ ] Can set metric: `price`, `price_change`, `volume`, `rank`
- [ ] Can set interval (seconds)
- [ ] Can switch mode: Single vs. Top Gainers / Top Losers
- [ ] Top Movers mode shows: `n_stock` limit slider, Min Market Cap filter, Period dropdown
- [ ] Credit cost formula and burst warning displayed in modal

### 4.3 Condition Config
- [ ] DSL rule input field works (`price_change > 5 AND volume > 1000000`)
- [ ] Supports `AND`, `OR`, `>`, `<`, `>=`, `<=`, `==`, `!=`

### 4.4 Note Config
- [ ] Content textarea editable
- [ ] Template variable inserter works (`${symbol}`, `${price_change}`, `${price}`, `${timestamp}`)
- [ ] Color picker changes note color live
- [ ] Char/word counter visible
- [ ] Dimension reset button works

### 4.5 Alert Config
- [ ] Channel selector: `UI`, `Discord`, `Telegram`, `Webhook`
- [ ] Switching to **Discord** reveals:
  - [ ] Webhook URL input
  - [ ] Custom Bot Name input
  - [ ] Rich embed toggle
  - [ ] `⚡ Send Test Ping` button with live spinner
  - [ ] Persistence awareness notice
  - [ ] `💾 Save Alert Settings` button
- [ ] Message template pre-populated with default (not blank)

### 4.6 Action Config
- [ ] Action type dropdown: `create_note`, `create_watcher`, `fundamental_report`, `export_canvas`
- [ ] `fundamental_report` shows credit cost notice (8 credits / symbol, burst warning for multi-stock)

### 4.7 Screener Config
- [ ] Preset prompt chips available (e.g. "top 5 banks by market cap")
- [ ] Natural language query input works
- [ ] `3 AI credits / query` notice shown
- [ ] Limit and interval selectors work

### 4.8 Sticker Modal
- [ ] Double-clicking a sticker opens modal (NOT empty modal)
- [ ] 32-emoji grid picker works
- [ ] Custom emoji input field works
- [ ] Label field editable
- [ ] 7-color badge palette works
- [ ] Live sticker preview badge shows in modal

---

## 5. Canvas Interactions

### 5.1 Selection
- [ ] Single click → selects node (blue highlight ring)
- [ ] `Shift+Click` → adds node to multi-selection
- [ ] `Ctrl+Click` → adds node to multi-selection
- [ ] Click-drag on empty canvas → box marquee selection
- [ ] `Delete` / `Backspace` → deletes selected nodes/edges

### 5.2 Copy, Paste, Duplicate
- [ ] `Ctrl+C` → copies selected node(s)
- [ ] `Ctrl+V` → pastes nodes (offset from original)
- [ ] `Ctrl+D` → duplicates node(s) in place with offset
- [ ] Paste preserves internal edges when pasting a multi-node group

### 5.3 Selection Bounding Box (2+ nodes selected)
- [ ] Dashed outline bounding box appears around multi-selection
- [ ] 8 resize/corner handles visible
- [ ] `Group` and `Ungroup` action pills appear in the bounding box UI
- [ ] Bounding box shows `Ctrl+G` and `Ctrl+Shift+G` shortcut badges

### 5.4 Group & Ungroup
- [ ] Select 2+ nodes → right-click → Group (`Ctrl+G`) — nodes group together
- [ ] Dragging the group moves all children together
- [ ] Double-click group → enters isolation focus mode with top banner
- [ ] `Esc` exits isolation mode
- [ ] `Shift+Click` inside isolation → sub-selects individual nodes
- [ ] Ungroup (`Ctrl+Shift+G`) — nodes return to independent

### 5.5 Undo & Redo
- [ ] `Ctrl+Z` → undoes last action
- [ ] `Ctrl+Shift+Z` → redoes

---

## 6. Edge Connections & Labels

### 6.1 Connecting Nodes
- [ ] Hover a node → connection dot appears on right side
- [ ] Drag from dot → draw a connector line
- [ ] Release on another node's left input port → creates an edge
- [ ] Edge appears with an animated line

### 6.2 Self-Documenting Edge Labels
- [ ] `Watcher → Condition` edge shows `"on tick"` badge pill
- [ ] `Condition → Note/Alert/Action` from **True** port shows green dot + `"if true"` badge
- [ ] `Condition → Note/Alert/Action` from **False** port shows red dot + `"if false"` badge
- [ ] `Screener → *` shows `"discovered"` / `"pipe results"` / `"summary"` badge
- [ ] `Action → *` shows `"generates"` / `"brief"` / `"spawns"` badge

### 6.3 Edge Deletion
- [ ] Hover an edge → `×` delete button appears on label badge
- [ ] Click `×` → edge deleted
- [ ] Right-click edge → context menu with Delete option

### 6.4 Quick-Add `[+]` Handle
- [ ] Hover `WatcherNode`, `ConditionNode`, `ScreenerNode`, or `ActionNode` → floating `+` button appears to the right (36px offset)
- [ ] Click `+` → opens Quick-Add popover at that position
- [ ] Popover recommends logical next node types (e.g. from Watcher → suggests Condition, Note, Action)
- [ ] Popover has search bar + keyboard navigation (`↑` / `↓` / `↵` / `Esc`)
- [ ] Selecting a node type from popover: spawns node, creates edge, auto-focuses new card
- [ ] **Drag connector onto empty canvas** → releases `onConnectEnd` → Quick-Add popover opens at release position

### 6.5 Condition Dual Output (True / False branches)
- [ ] Create: `Watcher → Condition`, then `Condition → Note A` (from True port), `Condition → Note B` (from False port)
- [ ] Run engine trigger
- [ ] **When condition passes:** only Note A is triggered
- [ ] **When condition fails:** only Note B is triggered

---

## 7. Engine Execution (Mock Mode)

### 7.1 Control Panel
- [ ] Click the settings icon (top nav) → Control Panel drawer opens from left
- [ ] Header reads "Control Panel" (not "Demo Controls")
- [ ] No `uppercase` or `tracking-wider` on any text in the drawer

### 7.2 Market Data Stream
- [ ] **Do Once** button → fires single poll tick, shows spinner, activity feed updates
- [ ] **Stream Data** button → starts continuous polling, button changes to **Stop Stream**
- [ ] **Stop Stream** → stops polling
- [ ] Global hairline progress bar (2px blue) appears at bottom of TopNav during active polling
- [ ] Status capsule with spinner and label appears in TopNav center during active load

### 7.3 Project File Actions
- [ ] **New** → navigates to fresh `/b/<new-uuid>` canvas (blank board)
- [ ] **Open** → opens file picker for `.scriffle` / `.json` files
- [ ] **Save** → downloads `<canvas-name>.scriffle` file

### 7.4 Examples (Presets)
- [ ] "Rotation Engine" example loads onto canvas
- [ ] "Momentum Breakout Loop" example loads onto canvas
- [ ] "Banking Sector Trio" example loads onto canvas
- [ ] No text is uppercase in preset labels

### 7.5 Engine Graph Execution
Set up this chain before testing:
```
[Watcher: BBCA, price_change, 5s] → [Condition: price_change > 0] → [Note: "${symbol} moved ${price_change}%"]
```
- [ ] Click **Do Once** — note content updates with interpolated values (`BBCA moved X%`)
- [ ] Watcher cycle counter increments (`⚡ 1 runs`, `⚡ 2 runs`...)
- [ ] Activity Feed logs the execution chain

---

## 8. Activity Feed

- [ ] Activity Feed panel is visible (right side or expandable)
- [ ] Shows human-readable chips: node type, MingCute icon, label
- [ ] Clicking a chip → camera pans and zooms to that node (smooth animation)
- [ ] Hovering a chip → execution path lights up (chain glow)
- [ ] Drag-to-resize sidebar works (280px–750px range)
- [ ] **Clear feed** button → confirmation dialog → clears logs AND resets all watcher cycle counters to 0
- [ ] After clearing, Watcher shows `⚡ 0 runs`

---

## 9. AI Screener Node

- [ ] Add a Screener node, open modal, set query: `"top 5 banks by market cap"`, interval: `60s`
- [ ] Click `⚡ Run` on the card
- [ ] Card shows `🤖 Screening...` badge + animate-pulse outline during load
- [ ] Results appear as ranked table in the card
- [ ] **Connect Screener → Note:** Note auto-updates with a formatted multi-stock summary table
- [ ] **Connect Screener → Action (create_watcher):** Action spawns `[Watcher] → [Condition] → [Note]` pipeline for each screened company

---

## 10. Top Gainers / Losers (Radar Watcher)

- [ ] Add Watcher, open modal, switch mode to **Top Gainers**
- [ ] Set limit (e.g. 5), period (e.g. `1d`)
- [ ] Trigger **Do Once**
- [ ] Watcher card shows leaderboard view with `#1`, `#2`, `#3`... ranked rows
- [ ] Rank badges use correct theme-aware colors:
  - **Light:** crisp gold/silver/bronze
  - **Mono:** warm graphite tones
  - **Dark:** translucent amber/slate/orange
- [ ] `⚠ API Error {code}` badge appears if live API fails (not a blank crash)
- [ ] On second/third poll: leaderboard stays intact (does NOT revert to single-stock note)

---

## 11. Themes

- [ ] **Light mode** (default): multicolor FigJam canvas loads
- [ ] Switch to **Mono**: canvas bg becomes warm paper `#F4F3EF`, borders warm graphite
- [ ] Switch to **Dark**: canvas bg becomes soft charcoal `#0F1014`, low-contrast borders, silver text
- [ ] **All three themes:** no `shadow-md`, `shadow-xl`, `drop-shadow` anywhere. Only flat 2px borders.
- [ ] All three themes: no `uppercase` or `tracking-wider` text violations
- [ ] Custom theme: drag-and-drop a `.scrifflemes` file onto canvas → theme applies
- [ ] Theme picker modal opens → palette pill bar shows bundled presets (Bloomberg, Nord, Gruvbox, Tokyo Night, Solarized Dark)

---

## 12. Canvas Lock

- [ ] Lock button in TopNav → canvas enters locked state (lock icon changes)
- [ ] **All blocked when locked:**
  - [ ] NavToolbar card creation buttons (all grayed/disabled)
  - [ ] Right-click canvas context menu (create node items disabled)
  - [ ] Quick-add `+` handle buttons on node hover
  - [ ] `Ctrl+V` paste
  - [ ] File drag-and-drop onto canvas
- [ ] **Still works when locked:** pan, zoom, drag existing cards, open feed, view modals

---

## 13. Spotlight Search

- [ ] Press `Ctrl+K` or `Ctrl+F` → Spotlight Search modal opens
- [ ] Type `BBCA` → returns all nodes mentioning BBCA
- [ ] Type a note text fragment → returns matching Note nodes
- [ ] Type a condition rule → returns matching Condition node
- [ ] `↑` / `↓` keyboard navigation works
- [ ] `↵` → camera flies to selected node (`setCenter` 400ms animation)
- [ ] `Esc` → modal closes
- [ ] Keyboard badge labels show `Ctrl+K` (not `⌘K`)

---

## 14. Keyboard Shortcuts Guide

- [ ] Press `?` or `Shift+/` → Keyboard Shortcuts modal opens
- [ ] 4 categories visible: Tools, Card Actions, Grouping, Navigation
- [ ] All shortcut badges show `Ctrl` (not `⌘`)
- [ ] Category group titles are readable in all 3 themes (not dark text on dark background)
- [ ] Footer `Esc` badge is theme-aware (not hardcoded dark)
- [ ] `Esc` closes the modal

---

## 15. Tab Navigation (Spatial Traversal)

With 3+ nodes on canvas:
- [ ] `Tab` → moves focus forward along connected automation edges (`Watcher → Condition → Note`)
- [ ] At end of chain, `Tab` → hops to next spatial neighbor (rightward / downward)
- [ ] Wraps around to top-left card at end of board
- [ ] `Shift+Tab` → moves backward (upstream edges, then leftward / upward)
- [ ] No ping-ponging on evenly spaced grids

---

## 16. Multi-Project Tabs

- [ ] TopNav shows project switcher button
- [ ] Click → Project Switcher Modal opens
- [ ] Lists all saved canvases with metadata
- [ ] Click a project → navigates to `/b/<canvas-id>` for that project
- [ ] Each tab has its own independent SWR cache (switching projects loads fresh state)
- [ ] Creating a **New** canvas from Control Panel → creates fresh `/b/<uuid>` URL

---

## 17. .scriffle File Format

### 17.1 Save
- [ ] Control Panel → **Save** → downloads `<canvas-name>.scriffle`
- [ ] Open the file in a text editor — it's valid UTF-8 JSON
- [ ] Contains nodes, edges, config data

### 17.2 Open / Restore
- [ ] Control Panel → **Open** → pick `.scriffle` file → canvas restores cleanly
- [ ] Drag-and-drop `.scriffle` file onto canvas → canvas restores cleanly
- [ ] No `Unique constraint failed` errors in console
- [ ] **Cross-tab test:** Open the same `.scriffle` file on two different project tabs — no collision errors

### 17.3 Presets
- [ ] Load "Banking Sector Trio" → graph is fully wired (edges intact, correct node configs)

---

## 18. Fundamental Report (Action Node)

- [ ] Set up: `[Watcher: BBCA] → [Action: fundamental_report]`
- [ ] Trigger **Do Once**
- [ ] Action node shows `Running...` badge + pulse outline during generation
- [ ] A **File Node** appears on canvas attached to the action node
- [ ] File node shows `✓ Saved` green pill
- [ ] File is saved to `reports/<project-slug>/BBCA_Fundamental_Brief.html`
- [ ] Open the HTML file in a browser — report is clean, institutional layout
- [ ] Report shows: price direction badge (Mint/Coral), metric glossary at bottom, no all-caps headings
- [ ] Trigger **Do Once** again → same File Node updates in place (not a duplicate spawned), shows `🔄 Rev 2` pill

---

## 19. Discord Webhook (Alert Node)

- [ ] Add Alert node, open modal, switch channel to **Discord**
- [ ] Enter a valid Discord webhook URL
- [ ] Click `⚡ Send Test Ping` → spinner appears, then success / error feedback
- [ ] Card shows `✓ Delivered to Discord` or `⚠ Webhook Failed`
- [ ] Connect `[Watcher] → [Alert: Discord]` → trigger engine → Discord receives embed with correct symbol/price/color

---

## 20. Typography & Design System (Zero-Tolerance)

Spot-check across all surfaces for violations:

- [ ] **Zero all-caps:** No `uppercase` CSS class or `text-transform: uppercase` anywhere (exception: known acronyms like BBCA, IDX, ROE, P/E inline in content)
- [ ] **Zero letter-spacing:** No `tracking-wider`, `tracking-widest` anywhere
- [ ] **Zero drop shadows:** No `shadow-md`, `shadow-xl`, `drop-shadow` anywhere
- [ ] **All borders 2px flat:** `border-slate-300`, `border-slate-800` only
- [ ] **Buttons inside containers** are `bg-transparent` in idle state — no awkward nested contrast rectangles
- [ ] **Font:** All UI text renders in Stack Sans Text
- [ ] **Icons:** All icons render from MingCute (no FontAwesome, Heroicons, or emoji stand-ins)

---

## 21. E2E Demo Flow (Full Walkthrough)

This is the flagship demo. Run this end-to-end without breaking.

> **Narrative:** "There are too many platforms to switch between for research. Scriffle lets you automate data fetching and brainstorm visually — all in one canvas."

**Steps:**
1. Open app → blank canvas
2. Right-click canvas → Add **Watcher** (BBCA, price_change, 5s)
3. Hover Watcher → click `+` handle → Quick-Add → select **Condition**
4. Condition auto-wired from Watcher → set rule `price_change > 3`
5. Hover Condition (True port) → click `+` → Quick-Add → **Sticky Note** (template: `🚀 ${symbol} breakout! +${price_change}% at Rp${price}`)
6. Hover Condition (False port) → click `+` → **Alert** (channel: UI)
7. Open Control Panel → click **Do Once**
8. Watch: Note updates text automatically, Alert fires toast, Activity Feed logs chain
9. Right-click canvas → Add **AI Screener** (query: "top 5 banks by market cap")
10. Connect `Screener → Action (create_watcher)`
11. Click `⚡ Run` on Screener card
12. Watch: Action spawns 5 Watcher pipelines, each with Condition + Note auto-wired
13. Switch theme to **Dark** — everything adapts cleanly
14. Press `Ctrl+K` → Spotlight Search → type `BBCA` → press Enter → camera flies to Watcher
15. Save canvas as `.scriffle` → Open it on a second tab (`/b/new-id`) → no errors

**Expected result:** Zero crashes, zero console errors, every piece of the chain reacts correctly.

---

## 22. Build Verification

After all manual QA:

```bash
bun test          # Must show: 179 pass, 0 fail
bun run build     # Must show: 0 TypeScript errors
```

---

## QA Sign-Off

| Section | Status | Notes |
|---|---|---|
| Canvas Basics | | |
| Node Creation | | |
| Node Appearance | | |
| Edit Modal | | |
| Canvas Interactions | | |
| Edges & Labels | | |
| Engine Execution | | |
| Activity Feed | | |
| AI Screener | | |
| Top Movers | | |
| Themes | | |
| Canvas Lock | | |
| Spotlight Search | | |
| Shortcuts Modal | | |
| Tab Navigation | | |
| Multi-Project Tabs | | |
| .scriffle Files | | |
| Fundamental Report | | |
| Discord Webhook | | |
| Design System | | |
| E2E Demo Flow | | |
| Build Verification | | |

**QA completed by:** _______________  
**Date:** _______________  
**Build green for Saturday freeze?** ☐ Yes ☐ No — blockers listed in `context/BUG_FIXES_PLAN.md`
