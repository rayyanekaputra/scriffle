# 📋 Session Changelog — 2026-09-10

> **For new agents:** Read this file first. It summarises every change made in the most recent working session so you can catch up instantly without re-reading every plan document.

---

## 1. Design System Enforcement (Critical Reminder)

A key typography rule was clarified and written into Rule 3 of the Design System in `AGENT_CONTEXT.md`:

- **No all-caps / uppercase** (`text-transform: uppercase`, `uppercase` Tailwind class) anywhere — the only exception is for well-known acronyms and ticker symbols used inline (e.g. `BBCA`, `IDX`, `ROE`, `P/E`, `ESG`, `LQ45`, `PDF`, `SOE`, `ATH`, `CAGR`).
- **No spaced-out letters** (`letter-spacing`, `tracking-wider`, `tracking-widest`) anywhere.
- All headings, section titles, brand labels, and buttons must be **Sentence case** or **Title Case** only.

This was violated in the old `/api/export/report` HTML and has been corrected.

---

## 2. PDF / Fundamental Report Redesign (`src/app/api/export/report/route.ts`)

**Before:** Outer container card with a 2px border, box shadow, uppercase section headings, and `letter-spacing`.

**After:** Clean, borderless institutional document:
- Pure white background (`#FFFFFF`), no outer box or card wrapper.
- `max-width: 820px` document layout with generous padding.
- Subtle hairline section dividers (`1px solid #E5E7EB`) instead of decorative boxes.
- Selective colour use:
  - **Mint (`#059669`)** / **Coral (`#DC2626`)** — price direction badges only.
  - **Electric Blue (`#0050FF`)** — analyst consensus bar and index pills only.
  - Everything else is charcoal/slate text on white.
- **Metric glossary & quick reference** section added at the bottom (`glossary-grid` 2-column layout) with plain-English definitions of P/E, P/B, ROE, Dividend Yield, Market Cap Rank, Analyst Consensus — intended for non-finance users.
- `@media print` CSS ensures clean PDF output.
- Section titles, brand label, thesis label all changed to Sentence/Title Case.

---

## 3. Auto-Export Reports to Disk (`src/server/services/reportExporter.ts`) — New File

**Purpose:** When an `ActionNode` fires `fundamental_report`, the HTML report is now **automatically saved to disk** without requiring the user to manually click "Print / Save PDF".

**Location on disk:**
```
hackathon/
└── reports/
    └── {project_slug}/              # sanitized from canvas.name, e.g. "banking_sector_trio"
        └── {SYMBOL}_Fundamental_Brief.html
```

**Key function:** `exportReportToDisk(projectName: string, symbol: string): Promise<ExportedReportResult>`

- Sanitizes project name to a lowercase snake_case directory slug.
- Creates directory if it does not exist (`fs.mkdirSync` with `{ recursive: true }`).
- Writes a complete standalone HTML document with embedded CSS.
- Returns `{ fileName, filePath, fileUrl, fileSize, savedLocally: true }`.

**Integration point:** Called in `src/server/services/graphEngine.ts` inside the `fundamental_report` branch. The returned metadata is passed directly into the spawned `FileNode` config.

---

## 4. FileNode Download / Local Status Indicator (`src/components/canvas/nodes/FileNode.tsx`)

**Before:** FileNode showed file size and category type only. No indication of whether the file existed on disk.

**After:** When `config.savedLocally === true` or `config.isDownloaded === true`:
- Shows a compact green pill: `✓ Saved` (Mint green, theme-aware for Dark and Mono modes).
- Replaces the generic category label in that slot.
- Eliminates user confusion about whether "the file was automatically generated or just a web link."

**Type changes in `src/types/canvas.ts`:**
```typescript
export interface FileConfig {
  // ... existing fields ...
  savedLocally?: boolean;    // true = file exists on disk at filePath
  isDownloaded?: boolean;    // true = user has triggered a download at some point
  downloadedAt?: string;     // human-readable time string
}
```

---

## 5. Free-Text Node Keyboard Commit (`src/components/canvas/nodes/TextNode.tsx`)

**Before:** `Enter` would continue a new bullet line but otherwise had no special behaviour in non-bullet context. Users had to click away to commit.

**After:**
- **`Enter`** (without Shift) → immediately commits changes and exits edit mode (`blur()`).
- **`Shift+Enter`** → inserts a new line. If the current line is a bullet (`• `), it continues the list. If not a bullet, standard textarea newline applies.
- **`Escape`** → also commits and exits (unchanged from before but now explicit).

---

## 6. Top Gainers & Losers Ranking Leaderboard & Dual Workflows

**Problem:** Top Gainers/Losers Watcher was stuck perpetually on stock #4 because sequential scalar ticks were overwriting the node's state, only single prices were rendered, and official query parameters (`min_mcap_billion`, nested periods) were not handled.

**Solution:**
- **Leaderboard Card Mode (`WatcherNode.tsx`):** Renders multi-item ranking table (`#1`, `#2`, `#3`... with ticker, company name, formatted price, and Mint/Coral % badges).
- **Official Parameters (`sectorsApi.ts`):** Supports `n_stock` (1–20), `periods` (`1d`, `7d`, `14d`, `30d`, `365d`, `all`), `classifications` (`all`), and `min_mcap_billion` on `GET /v2/companies/top-changes/`. Normalizes percentage returns (`* 100`) and removes `.JK` ticker suffix.
- **Engine Execution (`graphEngine.ts` & `trigger/route.ts`):** Added `executeGraphForRadarWatcher` to persist `state.movers` without single-tick overwriting.
- **Flow 1 (Connected Note):** Direct connected sticky note automatically formats the full multi-stock ranked summary table.
- **Flow 2 (Action Node Multi-Spawn):** Connected `create_note` action node spawns separate individual notes for each ranked stock with non-overlapping spatial offsets (`x: action.x + 280, y: action.y + index * 190`).
- **Edit Modal (`EditNodeModal.tsx`):** Added Top 20 limit option and Min Market Cap filter input.

---

## 7. Correlated Symbol Fundamental Note & Dynamic Report Fallback Fix

**Problem:** When a `fundamental_report` action was triggered from a Top Gainer / Top Loser Watcher (e.g. `MPRO`), the generated research note and brief displayed `MPRO` in the header but had all company details hardcoded to `PT Bank Central Asia Tbk.` (`Financials (Banks)`, `Rp 1,245.0 T`, `P/E 22.4x`, `Margin 46.8%`).

**Root Cause:**
1. `MOCK_FUNDAMENTAL_DATA` only contained 8 blue-chip tickers and defaulted unlisted tickers to `MOCK_FUNDAMENTAL_DATA['BBCA']`.
2. Spreading `...mock` copied BBCA's company name and valuation metrics.
3. `sessionApiKey` was not forwarded into `executeGraphForRadarWatcher` / `executeGraphForEvent`, forcing mock fallback even during live sessions.

**Solution:**
- **Added Full Fundamental Profiles (`sectorsApi.ts`):** Added complete, realistic fundamental datasets for all Top Gainers and Losers (`MPRO`, `JECX`, `AGII`, `BREN`, `CUAN`, `BKSL`, `ELPI`, `EMAS`, `PSAB`, `GOTO`).
- **Dynamic Fallback Builder (`buildDynamicCompanyReport`):** Dynamic synthesis for any unknown ticker, computing matching company name (`PT {SYMBOL} Indonesia Tbk.`), market cap, and valuation without inheriting BBCA.
- **Threaded `sessionApiKey`:** Propagated `apiKey` through `executeGraphForRadarWatcher`, `executeGraphForEvent`, `exportReportToDisk`, and `/api/export/report`.

---

## 8. Files Changed This Session

| File | Change Type | Summary |
|---|---|---|
| `src/server/services/sectorsApi.ts` | Modified | Added fundamental datasets for all top movers (`MPRO`, `JECX`, `AGII`, `BREN`, `CUAN`, `BKSL`, `ELPI`, `EMAS`, `PSAB`, `GOTO`) and `buildDynamicCompanyReport` fallback |
| `src/server/services/graphEngine.ts` | Modified | Threaded `sessionApiKey` through `executeGraphForEvent` and `executeGraphForRadarWatcher` for fundamental report actions |
| `src/server/services/reportExporter.ts` | Modified | Accepted `sessionApiKey` and forwarded to `getCompanyFundamentalReport` |
| `src/app/api/engine/trigger/route.ts` | Modified | Forwarded `apiKey` to graph execution functions |
| `src/app/api/export/report/route.ts` | Modified | Forwarded `apiKey` header / query param to `getCompanyFundamentalReport` |
| `src/types/canvas.ts` | Modified | Added `minMcapBillion`, `classifications` to `WatcherConfig`; added `name`, `period` to `MarketEvent`; added `movers` to state |
| `src/components/canvas/nodes/WatcherNode.tsx` | Modified | Added multi-row ranked Leaderboard card view with rank badges and prices |
| `src/components/controls/EditNodeModal.tsx` | Modified | Added Top 20 limit option and Min Market Cap filter |
| `AGENT_CONTEXT.md` | Modified | Master handover context updated |
| `context/BACKLOG.md` | Modified | Backlog and completed items updated |
| `context/CHECKPOINT.md` | Modified | Checkpoint updated |

---

## 9. Build Status

All changes verified clean with `bun run build` — zero TypeScript errors.


