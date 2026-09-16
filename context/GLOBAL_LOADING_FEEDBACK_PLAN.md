# 📋 IMPLEMENTATION PLAN: Global & Card-Level Loading Feedback for Long-Running Operations

> **Objective:** Provide instant, clear, and institutional visual feedback across the entire Scriffle canvas whenever asynchronous or multi-step operations are in flight (AI screening, multi-stock fundamental report exports, market data stream polling, project file restores, and canvas mutations).

---

## 1. Problem Statement & UX Motivation

In financial automation workflows, operations often have variable latency:
- **AI Natural Language Screening** (`GET /v2/companies/?q=...`): 1.5s–3.5s parsing and SQL query execution.
- **Multi-Stock Fundamental Brief Generation** (`ActionNode` -> `GET /v2/company/report/{symbol}/` for 5 top movers): 2s–6s multi-request batching, calculation, and disk auto-export.
- **Live / Mock Market Polling Ticks** (`POST /api/engine/trigger`): 500ms–2.5s Sectors API roundtrip and BFS graph mutation.
- **Project Board Restores & Presets** (`POST /api/canvas/restore`): Schema validation, UUID allocation, SQLite transaction, and SWR cache revalidation.

### Current Gaps
1. **Lack of Global Visibility**: When a user clicks *Do Once*, triggers a screener, or loads a preset, there is no unified top-level indicator showing that background network work is active.
2. **Card-Level Uncertainty**: Action nodes and radar watchers do not visually convey when downstream reports are being compiled and saved to disk.
3. **Double-Click / Re-Trigger Hazards**: Without active loading states and button disabling, users may repeatedly click triggers, wasting API credits (e.g. 40 credits per burst on multi-report triggers).

---

## 2. Multi-Tier Feedback Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ TOPNAV: [Logo] [Board Title] ── [ ⚡ Generating 5 Briefs... (40%)] ── [Theme] │
│ ──────────────────────────────────────────────────────────────────────────── │
│                                                                              │
│   ┌──────────────────────┐          ┌──────────────────────┐                 │
│   │ WatcherNode: BBCA    │─────────▶│ ActionNode (Report)  │                 │
│   │ [⚡ Polling live...] │          │ [⏳ Compiling Brief] │                 │
│   └──────────────────────┘          └──────────┬───────────┘                 │
│                                                │                             │
│                                                ▼                             │
│                                     ┌──────────────────────┐                 │
│                                     │ FileNode             │                 │
│                                     │ [⏳ Saving to disk..]│                 │
│                                     └──────────────────────┘                 │
│                                                                              │
│ [BOTTOM-LEFT TOAST]: "⚡ Generating 5 Fundamental Briefs for Top Gainers..."  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Tier 1: Global Canvas Status Bar & Progress Indicator
- **TopNav Header Progress Bar**: A sleek 2px hairline progress animation (`bg-[#0050FF]`) along the bottom edge of the top navigation bar during active network operations.
- **TopNav Status Capsule Pill**: Docks in the center of TopNav (next to Spotlight Search) displaying:
  - `⚡ Polling market stream...` (when manual poll or auto-stream is active)
  - `🤖 Screening IDX universe ("top 5 banks")...`
  - `📄 Compiling 5 fundamental briefs (40 credits)...`
  - `💾 Restoring project board...`
- **Auto-Clearing & Timeout Protection**: Automatically dismisses after completion or a safety timeout (12s max) to prevent stuck loading indicators.

### Tier 2: Card-Level Loading & Operation States
- **`ActionNode.tsx`**:
  - Button state: Disables trigger, swaps icon to animated spinner (`loading_3_line`), changes label to `"Generating..."` or `"Mutating..."`.
  - Border animation: Soft pulsing outline (`border-[#0050FF] animate-pulse`) while the action is executing downstream creations.
- **`ScreenerNode.tsx`**:
  - Header badge switches from `⚡ X runs` to `🤖 Screening...`.
  - Prompt bubble displays a glowing shimmer effect (`animate-pulse`).
- **`WatcherNode.tsx`**:
  - Single mode: Metric price badge subtly dims with spinning refresh icon.
  - Radar mode: Leaderboard table displays a skeleton/loading placeholder rows or subtle spinner overlay during fresh API fetch.
- **`FileNode.tsx`**:
  - Badge displays `⏳ Generating...` with animated pulse before transitioning into `✓ Saved in /reports`.

### Tier 3: Toast & Activity Stream Integration
- **Execution Toasts**: Fired on start of multi-second burst operations and on completion:
  - Start: `showToast('Generating Reports', 'Compiling fundamental briefs for 5 top movers (40 credits)...', 'info')`
  - Finish: `showToast('Reports Saved', '5 fundamental briefs auto-exported to /reports', 'success')`
- **Activity Feed**: Logs `operation_start` and `operation_complete` execution records.

---

## 3. Technical Design & State Management

### A. Centralized Loading Registry (`src/context/LoadingContext.tsx`)

```typescript
export interface LoadingTask {
  id: string;
  label: string;
  category: 'poll' | 'screener' | 'report' | 'restore' | 'export' | 'mutation';
  nodeId?: string;
  symbol?: string;
  progress?: number; // 0 to 100 (optional)
  startTime: number;
}

export interface LoadingContextType {
  tasks: LoadingTask[];
  isLoading: boolean;
  activeTask: LoadingTask | null;
  startTask: (task: Omit<LoadingTask, 'id' | 'startTime'>) => string; // returns taskId
  updateTask: (id: string, updates: Partial<LoadingTask>) => void;
  endTask: (id: string) => void;
  isNodeLoading: (nodeId: string) => boolean;
}
```

### B. Helper Utility Hook (`src/hooks/useOperationTracker.ts`)
A lightweight wrapper for async operations:
```typescript
const { runTracked } = useOperationTracker();

// Example usage:
await runTracked({
  label: 'Screening Top Banks',
  category: 'screener',
  nodeId: node.id,
}, async () => {
  await fetch('/api/engine/trigger', { ... });
});
```

---

## 4. Step-by-Step Implementation Tasks

### Phase 1: Context & Core Infrastructure
- [ ] **Task 1.1: Create `src/context/LoadingContext.tsx`**
  - Implement task queue state, `startTask`, `endTask`, `isNodeLoading`, and auto-timeout cleanup (10s safety fallback).
  - Provide helper hook `useLoading()`.
- [ ] **Task 1.2: Wrap Application in `LoadingProvider`**
  - Integrate `LoadingProvider` in `src/app/layout.tsx` (around `ToastProvider` and canvas components).

### Phase 2: Global UI Feedback (TopNav & Progress Bar)
- [ ] **Task 2.1: TopNav Hairline Progress Bar & Status Pill (`src/components/controls/TopNav.tsx`)**
  - Add top/bottom border 2px animated hairline indicator (`bg-[#0050FF]` with indeterminate shimmer).
  - Add center status pill displaying `activeTask.label` with animated MingCute spinner icon and theme-compliant contrast colors.
- [ ] **Task 2.2: SimulationBar & Stream Controller Feedback (`src/components/controls/SimulationBar.tsx`)**
  - Connect *Do Once* and *Stream Data* buttons to loading context with active visual spinners.

### Phase 3: Card-Level Visual States
- [ ] **Task 3.1: Screener Node Loading Shimmer (`src/components/canvas/nodes/ScreenerNode.tsx`)**
  - Wire `isNodeLoading(data.id)` to prompt container shimmer and header status.
- [ ] **Task 3.2: Action Node Execution State (`src/components/canvas/nodes/ActionNode.tsx`)**
  - Add execution loading state when firing `fundamental_report` or `create_watcher`.
- [ ] **Task 3.3: Watcher Node Refresh Animation (`src/components/canvas/nodes/WatcherNode.tsx`)**
  - Connect manual refresh / stream ticks to localized pulse state.
- [ ] **Task 3.4: File Node In-Progress Badge (`src/components/canvas/nodes/FileNode.tsx`)**
  - Render `⏳ Generating...` badge before `✓ Saved`.

### Phase 4: Integration with Async Operations
- [ ] **Task 4.1: Wrap Engine Trigger & Polling Operations (`src/app/page.tsx` & `src/app/b/[id]/page.tsx`)**
  - Track `handleManualTrigger`, `runLivePoll`, `handleImportScriffle`, and `handleLoadPreset`.
- [ ] **Task 4.2: Export Operations Tracking (`handleExportScriffle`, PDF Generation)**

### Phase 5: Testing & Verification
- [ ] **Task 5.1: Unit Test Suite (`src/__tests__/unit/loadingState.test.ts`)**
  - Test task registration, cancellation, multiple concurrent tasks, and safety auto-dismissal.
- [ ] **Task 5.2: Run Full Unit Test Suite (`bun test`)**
  - Ensure all 128+ tests remain green.
- [ ] **Task 5.3: Update Documentation**
  - Update `AGENT_CONTEXT.md`, `context/BACKLOG.md`, and `context/CHECKPOINT.md`.

---

## 5. Design System Compliance Checklist
- [x] **Zero drop shadows**: All status pills and progress lines use 2px solid flat borders and crisp background fills.
- [x] **Flat outline system**: Uses `border-2 border-[#0050FF]` or theme-specific tokens (`border-[#252730]`, `border-[#D8D4CA]`).
- [x] **MingCute icons only**: Uses `<MingIcon name="loading_3_line" className="animate-spin" />` and `<MingIcon name="sparkles_line" />`.
- [x] **Typography**: Strict Sentence Case only; no all-caps, no letter-spacing.
- [x] **3-Theme compliance**: Verified in Light, Mono (warm-paper `#F4F3EF`), and Dark (charcoal `#0F1014`).

---

## 6. Verification Criteria
1. Clicking **Do Once** in Control Panel immediately shows the TopNav hairline bar and status capsule `"Polling market data..."` until SWR revalidation finishes.
2. Clicking **Execute Screener** on `ScreenerNode` pulses the prompt container and shows `"Screening IDX universe..."` in TopNav.
3. Triggering a multi-stock `fundamental_report` shows `"Compiling 5 fundamental briefs..."` and renders temporary `⏳ Generating...` badges on pending FileNodes.
4. Restoring `.scriffle` files or switching presets shows smooth `"Restoring board..."` feedback without UI freezing or double-clicks.
5. All 128+ unit tests pass cleanly with `bun test`.
