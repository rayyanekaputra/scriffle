# 🐛 Fix: Radar Watcher Leaderboard Overwrite by Single-Symbol Polls

## Goal Description
On repeated "Poll Market API (Mock)" cycles (especially on the 2nd, 3rd, or subsequent polls), multi-stock Top Gainers / Losers Leaderboard Sticky Notes and Action research briefs get overwritten with **only 1 stock** instead of displaying the full 5-stock ranked leaderboard.

This plan identifies the exact root cause in `graphEngine.ts` and details the fix to isolate Radar Watcher pipelines from single-symbol poll pollution.

---

## 🔍 Root Cause Analysis

In [`src/server/services/graphEngine.ts`](file:///home/abzolute/Projects/hackathon/src/server/services/graphEngine.ts#L363-L397):
1. **Radar Watchers Processed Correctly in Section 1**:
   When `/api/engine/trigger` runs, Section 1 calls `executeGraphForRadarWatcher()` with the full array of 5 movers (`selectedMovers`). It formats the 5-item leaderboard note and/or spawns reports for all 5 movers.
2. **Pollution by Section 2 Single-Symbol BFS**:
   Section 2 in `trigger/route.ts` loops over single-symbol watchers (e.g. `BBCA`, `TLKM`, or auto-spawned tickers) and calls `executeGraphForEvent(canvasId, ev)`.
3. **Flawed Watcher Filter in `executeGraphForEvent`**:
   Inside `executeGraphForEvent`:
   ```ts
   // Check Top Gainers radar mode
   if (mode === 'top_gainers' || sym === 'TOP_GAINERS' || sym === 'TOP GAINERS') {
     const isGainer = event.price_change > 0;
     const threshold = typeof cfg.threshold === 'number' ? cfg.threshold : 0;
     const limit = typeof cfg.limit === 'number' && cfg.limit > 0 ? cfg.limit : 5;
     const rankMatch = event.rank !== undefined ? event.rank <= limit : true;
     return isGainer && event.price_change >= threshold && rankMatch;
   }
   ```
   If a single ticker (e.g. `BBCA` $+2.5\%$) happens to have a positive `price_change`, `matchingWatchers` in `executeGraphForEvent` falsely matches the **Top Gainers Radar Watcher**!
4. **Single-Stock Overwrite**:
   `executeGraphForEvent` enqueues the Radar Watcher's children into its BFS queue with `curEvent = BBCA` (a single event). When BFS reaches the connected Sticky Note or Action node, it calls:
   ```ts
   updatedContent = generateDefaultNoteContent(curEvent); // only BBCA!
   ```
   This completely wipes out the 5-stock leaderboard table and replaces it with a single stock summary.

---

## Proposed Changes

### Component 1: `src/server/services/graphEngine.ts`

#### [MODIFY] graphEngine.ts
1. In `executeGraphForEvent()`:
   - Restrict `matchingWatchers` to **only match single-symbol watchers** whose `cfg.symbol` matches `event.symbol`.
   - **Do NOT match radar watchers** (`mode === 'top_gainers'`, `mode === 'top_losers'`, `TOP_GAINERS`, `TOP_LOSERS`) in `executeGraphForEvent()`. Radar watchers must exclusively be processed via `executeGraphForRadarWatcher()` where the complete ranked `movers` list is provided.
   ```ts
   // Match only explicit single-stock watchers
   const isRadar = cfg.mode === 'top_gainers' || cfg.mode === 'top_losers' || sym === 'TOP_GAINERS' || sym === 'TOP_LOSERS' || sym === 'TOP GAINERS' || sym === 'TOP LOSERS';
   if (isRadar) {
     return false; // Exclusively handled by executeGraphForRadarWatcher
   }
   return sym === event.symbol.toUpperCase();
   ```

---

### Component 2: `src/app/api/engine/trigger/route.ts`

#### [MODIFY] trigger/route.ts
1. Ensure single symbols extracted in Section 2 strictly exclude any radar watcher symbols (`TOP_GAINERS`, `TOP_LOSERS`).
2. When multiple radar watchers and single watchers co-exist on the canvas, ensure `executeGraphForRadarWatcher` executes cleanly without cross-pollution from `syncMarketSnapshots`.

---

## Verification Plan

### Automated Tests
1. Add new unit test in `src/__tests__/unit/leaderboard.test.ts` / `graphEngine.test.ts`:
   - Simulate calling `executeGraphForEvent` with a single gainer `BBCA (+5%)` on a canvas that has a Top Gainers Radar Watcher connected to a leaderboard note.
   - Verify that the Radar Watcher's connected leaderboard note is **NOT** overwritten by the single `BBCA` tick and retains all 5 ranked movers.
2. Run `bun test` and ensure all 112+ tests pass.

### Manual Verification
1. Start dev server: `bun dev`.
2. Place a Top Gainers Radar Watcher connected to a Sticky Note.
3. Also place a single Watcher for `BBCA` and `BMRI`.
4. Click **"Poll Market API (Mock)"** 5–10 times.
5. Verify that the Top Gainers Sticky Note continuously displays the full ranked table (`#1`, `#2`, `#3`, `#4`, `#5`) on every single poll and never collapses into a 1-stock note.
