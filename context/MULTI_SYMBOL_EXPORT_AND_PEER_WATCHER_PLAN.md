# 📋 Implementation Plan: Multi-Symbol PDF Export & Dynamic Peer Watcher Automation

## 1. Problem Statement
1. **PDF Export Not Exporting Each Symbol Outputted:**
   - When an `ActionNode` (`action: 'fundamental_report'`) is connected to a Top Gainers/Losers Watcher, it currently only generates a single fundamental report and FileNode for the `#1` top mover instead of generating reports and PDF files for **each symbol in the leaderboard**.
2. **Peer Watcher Manual Symbol Selection:**
   - The `create_watcher` action currently requires the user to manually hardcode a ticker symbol (e.g., `BBRI`) in the property editor, or defaults to hardcoded strings. It cannot dynamically spawn watchers for the incoming breakout stocks or automatically discover sector peers.

---

## 2. Proposed Architecture & Solutions

### A. Multi-Symbol Fundamental Report & PDF Export (`src/server/services/graphEngine.ts`)
1. **Radar Watcher Flow (`executeGraphForRadarWatcher`):**
   - When an `ActionNode` with `action === 'fundamental_report'` is triggered:
     - Iterate through **all top movers** in `movers` (up to the configured `limit` or all active movers).
     - For **each symbol** in the list:
       - Fetch company fundamentals via `getCompanyFundamentalReport(mover.symbol)`.
       - Auto-export standalone HTML report to `reports/{project_slug}/{symbol}_Fundamental_Brief.html` via `exportReportToDisk`.
       - Spawn linked Research Note (`NoteNode`) with structured valuation & financial metrics.
       - Spawn linked File Attachment (`FileNode`) with `✓ Saved` status, local file path, and print/download URL.
     - Apply progressive coordinate offsets:
       - `x = actionNode.positionX + 280`
       - `y = actionNode.positionY + (index * 220) - 40`
       - Linked `FileNode` positioned at `x + 350, y + 20`
     - Connect action node to each generated note, and each note to its file node.

### B. Dynamic Peer & Breakout Watcher Spawning (`create_watcher`)
1. **Mode Options in `ActionConfig` & `EditNodeModal.tsx`:**
   - **`auto_incoming` (Default):** Auto-spawns dedicated `WatcherNode` cards for each incoming breakout stock / top mover without requiring manual input.
   - **`auto_peers`:** Dynamically resolves sector peers (e.g. for `BBCA` -> `BBRI`, `BMRI`; for `CUAN` -> `BREN`, `PTRO`; for `ADRO` -> `PTBA`, `ITMG`) and spawns peer watchers.
   - **`specific_symbol`:** Fallback manual ticker input (e.g. user specifies a fixed ticker).
2. **Duplicate Prevention & Clean Canvas Placement:**
   - Checks if a watcher for that symbol already exists on the canvas to prevent duplicates.
   - Places newly spawned watchers in an organized vertical column (`x = actionNode.positionX + 280, y = actionNode.positionY + (index * 160)`).
   - Creates connecting edges from the action node to each spawned watcher.

### C. UI & Modal Enhancements (`src/components/controls/EditNodeModal.tsx`)
1. **`ActionNode` Configuration UI:**
   - For `fundamental_report`:
     - Add option: "Export All Outputted Symbols (Multi-Report)" vs "Top 1 Symbol Only".
   - For `create_watcher`:
     - Replace hardcoded text input with a 3-way dropdown:
       - `⚡ Auto-Track Incoming Breakout Tickers (Dynamic)`
       - `🏢 Auto-Discover Related Sector Peers (Dynamic)`
       - `🎯 Specific Fixed Ticker (Manual)`
     - Only show the manual symbol text field if "Specific Fixed Ticker" is selected.

---

## 3. Detailed File Modifications

| File | Proposed Changes |
|---|---|
| `src/types/canvas.ts` | Extend `ActionConfig` with `spawnMode?: 'auto_incoming' \| 'auto_peers' \| 'specific'`, `exportScope?: 'all' \| 'top1'`, and `targetSymbol?: string`. |
| `src/server/services/sectorsApi.ts` | Add `getSectorPeers(symbol: string): Promise<string[]>` helper for dynamic peer discovery. |
| `src/server/services/graphEngine.ts` | Update `fundamental_report` and `create_watcher` branches in both `executeGraphForRadarWatcher` and `executeGraphForEvent` to support multi-symbol loop and dynamic peer resolution. |
| `src/components/controls/EditNodeModal.tsx` | Add dynamic watcher spawn mode dropdown and multi-report scope controls. |

---

## 4. Verification & Testing Plan
1. **Multi-Symbol PDF Export Test:**
   - Connect a Top 3 Gainers Watcher to an Action Node (`fundamental_report`).
   - Trigger poll.
   - Verify that 3 research notes and 3 corresponding FileNodes (`.html` / PDF) are created on the canvas with correct coordinates.
   - Check `reports/{project_name}/` directory to confirm all 3 HTML files were exported to disk.
2. **Dynamic Peer Watcher Test:**
   - Connect a Top Gainers Watcher to an Action Node (`create_watcher` with `auto_incoming`).
   - Trigger poll.
   - Verify that dedicated Watcher cards are spawned on the canvas for each incoming gainer stock without manual typing.
3. **TypeScript Build Verification:**
   - Run `bun run build` to guarantee zero compile errors.
