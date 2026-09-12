# 📋 Implementation Plan: Top Gainers & Losers Ranking Leaderboard & Dual Workflows

## 1. Problem Summary & User Workflows
Currently, the Watcher in Top Gainers / Losers mode is stuck on ticker #4 because events are executed sequentially without grouping, causing each stock to overwrite the previous stock's state.

We need to support two distinct workflows:
- **Flow 1 (Direct Connected Note):** `Watcher (Top Gainers)` ──connects to──> `Sticky Note (NoteNode)`
  - The connected note displays the **full ranked leaderboard table** (e.g. all Top 5/10 movers listed together).
- **Flow 2 (Action Node Multi-Spawn):** `Watcher (Top Gainers)` ──connects to──> `Action Node (create_note)`
  - The Action Node spawns **individual distinct sticky notes for each top mover** (`#1`, `#2`, `#3`...) with clean spatial offset layout (`x + index * 260px`).

---

## 2. Detailed Technical Plan

### A. Sectors API Client (`src/server/services/sectorsApi.ts`)
1. **Query construction:**
   - Support `n_stock` (1–20), `periods` (`1d`, `7d`, `14d`, `30d`, `365d`, `all`), `classifications` (`all`), and `min_mcap_billion` (e.g. `5000` for 5T IDR).
   - URL: `https://api.sectors.app/v2/companies/top-changes/?n_stock=${nStock}&classifications=${classifications}&periods=${periods}&min_mcap_billion=${minMcapBillion}`
2. **Response parsing:**
   - Parse nested period objects: `data.top_gainers[period]` / `data.top_losers[period]`.
   - Calculate percentage: `price_change * 100` (converting `0.25` → `+25.0%`).
   - Clean ticker: `.replace('.JK', '')`.
   - Ensure 1-indexed ranks (`rank: 1, 2, 3...`) and company names (`name`).
3. **Mock Data:** Update `MOCK_TOP_GAINERS` and `MOCK_TOP_LOSERS` with realistic 5-item lists containing company names, prices, and percentage changes.

### B. Canvas Types (`src/types/canvas.ts`)
1. Update `WatcherConfig`:
   ```typescript
   export interface WatcherConfig {
     symbol: string;
     metric: 'price' | 'price_change' | 'volume' | 'rank';
     interval: number;
     mode?: 'single' | 'top_gainers' | 'top_losers';
     threshold?: number;
     limit?: number; // 1, 3, 5, 10, 20
     period?: '1d' | '7d' | '14d' | '30d' | '365d' | 'all';
     minMcapBillion?: number;
     classifications?: string;
   }
   ```
2. Update `MarketEvent`: ensure `name?: string`, `rank?: number`, `period?: string`.
3. Add `movers?: MarketEvent[]` to `WatcherState`.

### C. Watcher Node UI (`src/components/canvas/nodes/WatcherNode.tsx`)
1. **Leaderboard Card Mode:** When `config.mode === 'top_gainers' || config.mode === 'top_losers'`:
   - Header: Mode badge (e.g. `Top 5 Gainers • 1D`) and `⚡ {cycleCount} runs`.
   - Render compact, scrollable or multi-row list:
     - Rank pill (`#1`, `#2`, `#3`...)
     - Ticker symbol (`JECX`) + subtle company name
     - Last close price (`Rp 1,950`)
     - Move badge (`+25.00%` in Mint Green / `-8.96%` in Coral)
   - Support Light, Mono, and Dark themes.

### D. Graph Engine (`src/server/services/graphEngine.ts` & `src/app/api/engine/trigger/route.ts`)
1. **Trigger Engine (`/api/engine/trigger`):**
   - Query top movers per watcher config (honoring `limit`, `period`, `minMcapBillion`).
   - For radar watchers, update the watcher's `stateJson` with `{ status: 'passed', movers: [...] }` and increment `cycleCount` **once** per polling cycle.
2. **Flow 1 Handling (Direct Connected Note):**
   - When a note is connected directly to a Top Gainers/Losers watcher:
     - Generate a multi-line formatted leaderboard table listing all movers:
       ```text
       🚀 Top 5 Gainers (1D)
       • #1 JECX: Rp 1,950 (+25.00%)
       • #2 AGII: Rp 3,080 (+23.20%)
       • #3 MPRO: Rp 9,800 (+22.50%)
       • #4 BOGA: Rp 1,545 (+74.58%)
       • #5 MGLV: Rp 8,000 (+2798.55%)
       ```
     - Support `${rankings_list}` or individual `${symbol}`, `${price_change}` if templated.
3. **Flow 2 Handling (Action Node `create_note`):**
   - When an `ActionNode` with `action === 'create_note'` is triggered from a radar watcher:
     - Iterate through the list of top movers.
     - Spawn individual sticky notes for each mover (e.g. `#1 JECX`, `#2 AGII`, etc.).
     - Apply progressive coordinate offsets (`x: actionNode.x + 280, y: actionNode.y + (index * 160)`) so the spawned notes are cleanly arranged without overlapping.

### E. Edit Node Modal (`src/components/controls/EditNodeModal.tsx`)
- Add controls for:
  - **Leaderboard Limit**: Top 1, Top 3, Top 5, Top 10, Top 20.
  - **Period**: 1 Day (1d), 7 Days (7d), 14 Days (14d), 30 Days (30d), 365 Days (365d), All Periods.
  - **Minimum Market Cap Filter (Billion IDR)**: e.g. `5000` (IDR 5T).
  - **Minimum % Move Threshold**: e.g. `5` for +5%.

---

## 3. Verification Steps
1. Run `bun run build` to verify clean TypeScript compilation.
2. Test **Flow 1**: Connect Top Gainers Watcher to a Sticky Note -> Verify sticky note contains the full multi-stock ranked list.
3. Test **Flow 2**: Connect Top Gainers Watcher to an Action Node (`create_note`) -> Trigger poll -> Verify separate notes are spawned with appropriate spatial offsets for each stock.
4. Verify Watcher Node card displays the sleek ranked leaderboard with rank badges and prices across Light, Mono, and Dark themes.
