# 📋 Implementation Plan: Top Movers API 400 Parameter Fix & Error Transparency (Rank 1 & 2)

## 1. Problem Statement & Root Cause Analysis

### A. The 400 Bad Request Parameter Bug (Rank 1)
- **Audit Findings:** `GET /v2/companies/top-changes/?periods=1d&n_stock=5&classifications=all` consistently returns `400 Bad Request, 0 credits` from Sectors API v2.
- **Root Cause:** In [`src/server/services/sectorsApi.ts`](file:///home/abzolute/Projects/hackathon/src/server/services/sectorsApi.ts#L384), `classifications: options?.classifications || 'all'` hardcodes `'all'` as a default param value. The Sectors API does not accept `'all'` — it only accepts specific sector classification slugs (e.g. from `/v2/subsectors/`) and expects the parameter to be **omitted entirely** when querying across all sectors.
- **Param Verification:**
  - `periods`: `1d`, `7d`, `14d`, `30d`, `365d`, `all` (valid)
  - `n_stock`: integer limit (valid)
  - `classifications`: must only be passed if specified and $\ne \text{'all'}$.

### B. Deceptive Silent Mock Fallback (Rank 2)
- **Problem:** When `/v2/companies/top-changes/` fails with 400/500, `getTopMarketMovers()` catches the exception and returns mock data with `{ isLive: false }`.
- **Defect:** Neither `trigger/route.ts`, `graphEngine.ts`, nor `WatcherNode.tsx` surfaces the failure. The user has no indication that their API key / live request failed.
- **Required Behavior:**
  1. Capture `{ error: { code, message }, isLive: false }`.
  2. If an API key was provided (Live Mode) and the API call fails:
     - Record `{ status: 'error', error: { code, message }, isLive: false }` into the Watcher node's `stateJson`.
     - Log an `api_error` event to the Activity Feed: `⚠️ Sectors API /companies/top-changes/ failed (400: <detail>)`.
     - Render a prominent red/amber `⚠ API Error 400` status badge on `WatcherNode.tsx` with error tooltip/details.
  3. When in Mock Mode (no API key provided):
     - Clearly display a `Mock` badge instead of pretending the data is live.

---

## 2. Architecture & Data Flow

```mermaid
flowchart TD
    A["Trigger Radar Watcher Poll"] --> B["getTopMarketMovers(apiKey, { nStock, periods, classifications })"]
    B --> C{"classifications === 'all'?"}
    C -->|Yes| D["Omit classifications from axios params"]
    C -->|No| E["Include classifications in axios params"]
    D --> F["axios.get('/companies/top-changes/')"]
    E --> F
    F -->|Success 200| G["Return { gainers, losers, isLive: true }"]
    F -->|Error 400/500| H["Catch error -> Return { gainers, losers, isLive: false, error: { code, message } }"]
    G --> I["executeGraphForRadarWatcher: status = 'passed', isLive = true"]
    H --> J{"Was apiKey provided?"}
    J -->|Yes (Live Mode)| K["executeGraphForRadarWatcher: status = 'error', record error in stateJson + Log to Activity Feed"]
    J -->|No (Offline Mode)| L["executeGraphForRadarWatcher: status = 'passed', isLive = false (Mock mode)"]
    K --> M["WatcherNode: Render '⚠ API Error 400' Badge + Error Tooltip"]
    L --> N["WatcherNode: Render 'Mock' Badge with Offline Mock Leaderboard"]
```

---

## 3. Detailed File Modification Breakdown

### 1. `src/server/services/sectorsApi.ts`
- Fix parameter construction in `getTopMarketMovers`:
  ```typescript
  const params: Record<string, any> = {
    periods: targetPeriod,
    n_stock: targetStockCount,
  };
  if (options?.classifications && options.classifications !== 'all') {
    params.classifications = options.classifications;
  }
  if (options?.minMcapBillion !== undefined && options.minMcapBillion > 0) {
    params.min_mcap_billion = options.minMcapBillion;
  }
  ```
- Upgrade `TopMoversResult` interface to include `error?: { code: number; message: string }`.
- In `catch (err: any)`, extract status and error message and return structured error metadata.

### 2. `src/app/api/engine/trigger/route.ts`
- When `moversResult.error` is present and an API key was provided:
  - Log an error entry to the Activity Feed via `prisma.log.create({ data: { status: 'failed', message: `Sectors API error (${moversResult.error.code}): ${moversResult.error.message}`, ... } })`.
  - Pass `error` metadata to `executeGraphForRadarWatcher`.

### 3. `src/server/services/graphEngine.ts`
- In `executeGraphForRadarWatcher(canvasId, watcherId, movers, sessionApiKey, errorMetadata)`:
  - When `errorMetadata` exists and `sessionApiKey` is set:
    - Update node's `stateJson` with `{ status: 'error', error: errorMetadata, isLive: false, cycleCount: newCycleCount, lastTriggeredAt: ... }`.
  - Otherwise, set `{ status: 'passed', isLive: true/false, ... }`.

### 4. `src/components/canvas/nodes/WatcherNode.tsx`
- Inspect `state.status === 'error'` or `state.error`:
  - Render a red `⚠ API Error {code}` badge in the header.
  - If error is present, display error banner in card body: `API Error: ${state.error.message}`.
  - In normal mock mode (`!state.isLive && !state.error`), display a `Mock` pill in the header.

### 5. `src/components/feed/ActivityFeed.tsx`
- Ensure `failed` / `api_error` log entries render with red icon and high-contrast error styling.

### 6. `src/__tests__/unit/topMoversApi.test.ts`
- Unit tests verifying:
  1. Parameter filtering (omits `classifications=all`, includes specific classifications).
  2. Structured error object formatting on 400/500 API responses.
  3. Watcher node error state rendering contract.

---

## 4. Step-by-Step Execution Plan

| Step | Action | Files | Verification |
|---|---|---|---|
| **Step 1** | Fix parameter builder & error return in `getTopMarketMovers` | [`sectorsApi.ts`](file:///home/abzolute/Projects/hackathon/src/server/services/sectorsApi.ts) | `classifications=all` is never sent; error details captured |
| **Step 2** | Propagate error states in engine trigger & graph execution | [`trigger/route.ts`](file:///home/abzolute/Projects/hackathon/src/app/api/engine/trigger/route.ts), [`graphEngine.ts`](file:///home/abzolute/Projects/hackathon/src/server/services/graphEngine.ts) | `stateJson` stores error object & Activity Feed receives error log |
| **Step 3** | Update `WatcherNode.tsx` to render `⚠ API Error` and `Mock` badges | [`WatcherNode.tsx`](file:///home/abzolute/Projects/hackathon/src/components/canvas/nodes/WatcherNode.tsx) | Error UI visible when API fails in live mode |
| **Step 4** | Create unit tests `src/__tests__/unit/topMoversApi.test.ts` | Test suite | All unit tests pass (`bun test`) |
| **Step 5** | Verify production build & update documentation | [`BACKLOG.md`](file:///home/abzolute/Projects/hackathon/context/BACKLOG.md) | `bun run build` succeeds; Backlog updated |
