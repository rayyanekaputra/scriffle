# 🎨 Implementation Plan: UI Fixes — Control Panel, Unified Data Stream & Theme Alignment

> **Document Type:** Implementation Plan  
> **Status:** Ready for Execution  
> **Target Files:**
> - `src/components/canvas/nodes/WatcherNode.tsx`
> - `src/components/controls/SimulationBar.tsx`
> - `src/components/controls/TopNav.tsx`
> - `src/app/page.tsx`

---

## 🎯 Objectives & Summary of Changes

This plan addresses 6 specific UI/UX refinements across the Scriffle canvas and side control panel:

1. **Theme-Aware Rank Capsules in Watcher Node (`WatcherNode.tsx`)**:
   - Fix hardcoded Light Mode colors on `#1`, `#2`, and `#3` rank badges in Top Gainers / Losers Leaderboard cards.
   - Implement contrast-compliant palettes across **Light**, **Mono** (Warm-Paper), and **Dark** (Soft Charcoal) themes.

2. **Single-Line Polling Stream Header & Labels (`SimulationBar.tsx`)**:
   - Prevent text wrapping and next-line spills in narrow side panels (`w-72`).

3. **Combined Data Stream Section ("Do Once" & "Stream Data") (`SimulationBar.tsx`)**:
   - Merge Section 2 ("Market Data Sync") and Section 3 ("Auto-Polling Stream") into a single, cohesive **Market Data Stream** container.
   - Simplify actions with plain, intuitive copy:
     - **"Do Once"** (triggers 1 manual poll tick)
     - **"Stream Data"** / **"Stop Stream"** (toggles continuous interval streaming)

4. **"New File" Action in Project File Container (`SimulationBar.tsx` & `page.tsx`)**:
   - Add a dedicated **New File** / **New Board** button alongside **Save File** and **Open File**.
   - Create a clean new board instance seamlessly.

5. **Rebrand "Presets" to "Examples" (`SimulationBar.tsx`)**:
   - Change section label from *"Load Preset Template:"* to *"Examples"* (optional starter boards).

6. **Rebrand Left Panel Title to "Control Panel" (`SimulationBar.tsx`, `TopNav.tsx`, `page.tsx`)**:
   - Change header and tooltips from *"Demo Controls"* to *"Control Panel"*.

---

## 🔍 Detailed Component Breakdown

### 1. Watcher Node Rank Capsule Theme Fix (`src/components/canvas/nodes/WatcherNode.tsx`)

#### Problem
In `WatcherNode.tsx` (lines 221–236), ranks `#1`, `#2`, and `#3` use hardcoded Tailwind classes (`bg-amber-100 text-amber-800`, `bg-slate-200 text-slate-700`, `bg-amber-50 text-amber-700`) without checking `isDark` or `isMono`. In Dark mode, this causes glaring bright boxes with illegible text; in Mono mode, it clashes with the warm-paper palette.

#### Solution
Refactor rank capsule styling to be fully theme-aware:

```tsx
const getRankBadgeClasses = (rank: number) => {
  if (isDark) {
    if (rank === 1) return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    if (rank === 2) return 'bg-slate-400/20 text-slate-200 border-slate-400/30';
    if (rank === 3) return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    return 'bg-[#22242D] text-[#8C90A0] border-[#313442]';
  }
  if (isMono) {
    if (rank === 1) return 'bg-[#E2DFD6] text-[#242321] border-[#C8C4B8] font-black';
    if (rank === 2) return 'bg-[#EAE7DF] text-[#4F4C45] border-[#D8D4CA] font-bold';
    if (rank === 3) return 'bg-[#EFECE4] text-[#78756D] border-[#D8D4CA] font-semibold';
    return 'bg-[#F4F3EF] text-[#8C8980] border-[#E2DFD6]';
  }
  // Light Mode (Default)
  if (rank === 1) return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
  if (rank === 2) return 'bg-slate-200 text-slate-800 border-slate-300 font-semibold';
  if (rank === 3) return 'bg-orange-100 text-orange-900 border-orange-200 font-semibold';
  return 'bg-slate-100 text-slate-600 border-slate-200';
};
```

---

### 2 & 3. Unified Market Data Stream Container (`src/components/controls/SimulationBar.tsx`)

#### Problem
Currently, single-tick polling ("Market Data Sync") and continuous polling ("Auto-Polling Stream") are in two separate containers, consuming excessive vertical space and cluttering the left drawer. Furthermore, header tags like `"Per-Node Cadence"` wrap onto the next line due to width constraints.

#### Proposed UI Layout
Combine both into a single container titled **Market Data Stream**:
- **Header**:
  - Left: Pulse dot + `time_line` / `radar_line` icon + title **Market Stream** (or **Data Stream**).
  - Right: Live vs Mock badge (`Live` or `Mock`).
- **Action Buttons (2-Column Grid)**:
  - **Left Button ("Do Once")**: Single execution.
    - Copy: `Do Once` (or `Run Once` / `Sync Once`).
    - Spinner icon when `loading`.
  - **Right Button ("Stream Data")**: Toggle continuous polling.
    - Copy: `Stream Data` (idle) / `Streaming` (active with pulse dot).
    - Active State: Vibrant coral/rose background (`bg-rose-600`) in Light mode or theme-accented border in Dark/Mono.
- **Footer Hint**: Single-line concise footnote: `1-tick poll or continuous per-node streaming.`

---

### 4. Project File Container: Add "New File" Button (`SimulationBar.tsx` & `page.tsx`)

#### Layout & Behavior
In the **Project File (.scriffle)** section:
- Change the 2-button grid into a 3-button grid:
  1. **New File**: Calls `onNewProject?.()` to initialize a fresh, clean board or navigate to `/b/${crypto.randomUUID()}`.
  2. **Open File**: Hidden input file picker trigger for `.scriffle` / `.json`.
  3. **Save File**: Exports `<canvas_name>.scriffle`.

```tsx
<div className="grid grid-cols-3 gap-1.5">
  <button onClick={onNewProject} className={...}>
    <MingIcon name="file_new_line" size={13} />
    <span>New</span>
  </button>
  <button onClick={() => scriffleInputRef.current?.click()} className={...}>
    <MingIcon name="folder_open_line" size={13} />
    <span>Open</span>
  </button>
  <button onClick={onExportScriffle} className={...}>
    <MingIcon name="download_2_line" size={13} />
    <span>Save</span>
  </button>
</div>
```

---

### 5. Rebrand Presets to "Examples" (`SimulationBar.tsx`)

- Change section divider title from `Load Preset Template:` to `Examples`.
- Update helper badge to indicate optional starter boards (e.g., `Rotation Engine`, `Momentum Breakout`, `Banking Sector Trio`).

---

### 6. Rebrand Left Panel to "Control Panel" (`SimulationBar.tsx`, `TopNav.tsx`, `page.tsx`)

- **Header in `SimulationBar.tsx`**: Change `<h2>Demo Controls</h2>` to `<h2>Control Panel</h2>`.
- **Icon**: Replace `game_2_line` with `dashboard_3_line` or `tune_line` for a professional, institutional feel.
- **Tooltips & Labels**:
  - `TopNav.tsx`: Change tooltip from *"Toggle Demo Controls"* to *"Toggle Control Panel"*.
  - `SimulationBar.tsx`: Close button tooltip updated to *"Hide Control Panel"*.

---

## 📋 Implementation Checklist

- [ ] **Step 1:** Update `WatcherNode.tsx` with theme-aware `getRankBadgeClasses` for #1, #2, #3, and #4+ ranks across Light, Dark, and Mono modes.
- [ ] **Step 2:** Update `SimulationBar.tsx` header to **Control Panel** with `tune_line` icon.
- [ ] **Step 3:** Add `onNewProject` prop to `SimulationBarProps` and render 3-column button group (`New`, `Open`, `Save`) in Project File section.
- [ ] **Step 4:** Rename Presets section to **Examples** with clean 1-line layout.
- [ ] **Step 5:** Merge Section 2 & Section 3 into a single **Data Stream** container with **Do Once** and **Stream Data** buttons.
- [ ] **Step 6:** Update `src/app/page.tsx` and `TopNav.tsx` to handle `onNewProject` callback and update all "Demo Controls" strings to "Control Panel".
