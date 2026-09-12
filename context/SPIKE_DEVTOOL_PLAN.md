# 📋 Implementation Plan: Multi-Side Handles, UI Toaster & Market Spike DevTool

## 1. Problem Diagnoses & Feature Goals

### 🐛 Problem 1: Sticky Note Only Connects from Top
* **Diagnosis:** In `NoteNode.tsx`, `<Handle type="target" position={Position.Top} />` and `<Handle type="source" position={Position.Top} />` are positioned at the exact same coordinates (top center) with no offset. React Flow's mouse hit-testing defaults to the top DOM element and blocks left/right/bottom source handles.
* **Fix:** Clean up handle positioning:
  * Place unambiguous source handles (with distinct IDs and offset/hover hitbox) on **all 4 borders**:
    * Left side (`Position.Left`)
    * Right side (`Position.Right`)
    * Top side (`Position.Top`)
    * Bottom side (`Position.Bottom`)
  * Ensure source handles can be pulled from any of the 4 edges with zero overlap collisions.

### 🐛 Problem 2: UI Toast Notification Not Appearing on Screen
* **Diagnosis:** The backend creates an alert log entry and updates node state, but there is no floating client-side Toast Notification component mounted on the root viewport to display the toast message visually to the user.
* **Fix:**
  * Add a lightweight global **Toast Notification Provider** (or use a minimal flat UI Toast system) that listens to incoming alerts and fires animated flat toasts at the top-right / top-center of the screen.
  * When a simulation or poll runs and triggers an `alert` node, an instant visual toast message pops up (e.g. `🔔 Alert: BBCA price change is +6.37%`).

### ⚡ Feature: Developer Market Spike Tool (4 Core Parameters)
* **Goal:** A dedicated, minimal DevTool drawer/popover to inject custom mock numbers across the **4 core market metrics**:
  1. **Stock Ticker:** `symbol` (e.g. `BBCA`, `TLKM`, `BMRI`, `BBRI`, `ASII`)
  2. **Price Change (%):** `price_change` (e.g. `+7.5%`, `-3.2%`)
  3. **Volume:** `volume` (e.g. `25,000,000` vs `avg_volume` of `10,000,000`)
  4. **Market Rank:** `rank` (e.g. `#1`, `#4`)
* **Benefit:** Allows you to test any complex condition rule instantly (e.g. `price_change > 5 AND volume > 2 * avg_volume AND rank <= 3`) directly from the UI without touching code.

---

## 2. Phase-by-Phase Execution Order

```
Phase 1: Fix Multi-Side Connection Handles on Sticky Notes (NoteNode.tsx)
   ▼
Phase 2: Implement Global UI Toast Notification System
   ▼
Phase 3: Build Developer Market Spike Tool (4-Parameter Simulator)
   ▼
Phase 4: Integrate Spike Tool into Floating Demo Dock
   ▼
Phase 5: Verification & End-to-End Testing
```

---

### 🔧 Phase 1: Fix Multi-Side Connection Handles on `NoteNode.tsx`
1. Separate target and source handles clearly:
   * Left: `Position.Left` (Target on left edge, Source slightly offset or dual-mode).
   * Right: `Position.Right` (Primary source output).
   * Top: `Position.Top`.
   * Bottom: `Position.Bottom`.
2. Give each handle a unique `id` (e.g. `source-right`, `source-bottom`, `target-left`, `target-top`) with generous hitboxes so pulling a connection wire from any side works smoothly.

---

### 🔔 Phase 2: Implement UI Toast Notification System
1. **Toast Notification Hook & Context (`src/components/ui/ToastProvider.tsx`):**
   * Floating flat container in top-right screen.
   * Renders incoming alerts with MingCute notification icon, ticker badge, message, and auto-dismiss after 4 seconds.
2. **Hook up to SWR Sync & Simulation Triggers:**
   * When `/api/engine/simulate` or `/api/engine/trigger` returns triggered `alert` nodes, fire `toast.show(message)`.
   * Detect newly added alert logs from SWR poll and fire toasts automatically.

---

### 🧪 Phase 3: Build Developer Market Spike Tool (4 Parameters)
1. **Spike Tool Popover / Modal (`src/components/controls/DevSpikeTool.tsx`):**
   * Clean, minimal flat modal with 4 numeric/text inputs:
     1. `symbol`: Text input or quick selector (`BBCA`, `TLKM`, `BMRI`, `BBRI`, `ASII`).
     2. `price_change`: Number slider / input (e.g. `-10%` to `+20%`).
     3. `volume`: Number input (e.g. `5,000,000` to `50,000,000`).
     4. `price`: Current price input (e.g. `10,500`).
   * **"⚡ Inject Market Tick" Button:** Calls `POST /api/engine/simulate` with the exact 4 parameters.
   * **Quick Presets:** Breakout (+8%), Dump (-6%), Massive Volume (3x Avg), Bluechip Rally.

---

### 🎛️ Phase 4: Integrate Spike Tool into Floating Demo Dock
1. Add a **"⚙️ Custom Spike (DevTool)"** button to the bottom `SimulationBar.tsx`.
2. Clicking it opens the clean 4-parameter spike dialog so creators can test edge cases on custom condition nodes on the fly.

---

### 🧪 Phase 5: Verification Checklist

- [ ] **Handle Check:** Drag wire from Right, Left, Top, and Bottom of a sticky note $\rightarrow$ Verify all 4 sides connect seamlessly.
- [ ] **Toast Notification Check:** Trigger an alert node $\rightarrow$ Verify visual toast appears at top-right of screen.
- [ ] **Custom Dev Spike Tool Check:**
  * Open DevTool.
  * Enter `TLKM`, `price_change = 8.5`, `volume = 30000000`.
  * Click Inject $\rightarrow$ Verify `TLKM` flow evaluates rule and triggers connected notes and toasts!
- [ ] **Build Check:** Run `bun run build`.
