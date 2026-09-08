# Implementation Plan: Company Fundamental Report Action (`/v2/company/report/{symbol}/`)

## Overview
Integrate **Sectors API v2 Endpoint #5 — Company Report (`GET /v2/company/report/{symbol}/`)** into Scriffle's **Action Node** and **Graph Engine**. When an upstream Watcher/Condition detects a breakout or event (e.g. `BBCA` jumps +5%), the Action Node automatically calls the Company Report endpoint and generates a formatted fundamental research summary note on the canvas.

---

## 1. User Story & Workflow
1. User connects a **Watcher Node** (`BBCA`) $\rightarrow$ **Condition Node** (`price_change >= 4.0%`) $\rightarrow$ **Action Node** (`Generate Fundamental Report`).
2. When the condition triggers:
   - Scriffle fetches the comprehensive company report for `${symbol}` via `https://api.sectors.app/v2/company/report/${symbol}/`.
   - Extracts valuation metrics: **P/E Ratio**, **P/B Ratio**, **Market Cap**, **Dividend Yield**, **Sector/Subsector**, and **Peer Rankings**.
   - Spawns an aesthetic **Research Sticky Note** or **Fundamental Summary Card** on the whiteboard with formatted markdown / key metrics directly linked to the triggering node.

---

## 2. Technical Architecture & Changes

### A. Sectors API Client Service (`src/server/services/sectorsApi.ts`)
- Add `getCompanyFundamentalReport(symbol: string, apiKey?: string)`:
  - Calls `GET /v2/company/report/${symbol}/` with `Authorization: ${apiKey}`.
  - Returns structured fundamentals:
    ```typescript
    export interface CompanyFundamentalReport {
      symbol: string;
      companyName: string;
      sector: string;
      subSector: string;
      marketCap: number; // in IDR
      peRatio: number;
      pbvRatio: number;
      dividendYield: number;
      revenueGrowthYoY?: number;
      netProfitMargin?: number;
    }
    ```
  - Includes clean mock fallback with realistic IDX data (for `BBCA`, `BBRI`, `BMRI`, `TLKM`, etc.) if no API key is provided during demo.

### B. Canvas Types (`src/types/canvas.ts`)
- Extend `ActionConfig`:
  ```typescript
  export interface ActionConfig {
    action: 'create_note' | 'create_watcher' | 'fundamental_report' | 'export_canvas';
    params?: Record<string, any>;
  }
  ```

### C. Graph Execution Engine (`src/server/services/graphEngine.ts`)
- In `executeGraphForEvent()` under `node.type === 'action'`:
  - Handle `nodeConfig.action === 'fundamental_report'`.
  - Fetch report using `getCompanyFundamentalReport(curEvent.symbol, apiKey)`.
  - Format a rich sticky note on the canvas with color styling (e.g. mint/blue):
    ```markdown
    📊 Fundamental Report: BBCA (Bank Central Asia)
    • Sector: Banking / Financials
    • Market Cap: Rp 1,230.5 T
    • P/E Ratio: 19.4x | P/B: 4.8x
    • Dividend Yield: 2.85%
    • Triggered by: +4.5% Breakout at 10:30 AM
    ```
  - Create node + edge attached to the action node on the canvas.

### D. UI & Controls (`ActionNode.tsx` & `EditNodeModal.tsx`)
- **`ActionNode.tsx`**: Add badge/icon representation for `Generate Fundamental Report`.
- **`EditNodeModal.tsx`**: Add dropdown option: **"Generate Fundamental Report (Sectors API)"** with an info box explaining that it queries live valuation metrics.

---

## 3. Verification & Testing
1. Configure an Action Node to `Generate Fundamental Report`.
2. Trigger the upstream condition via manual poll or simulation tool.
3. Verify that a research sticky note with live P/E, PBV, and Market Cap is spawned on the canvas and logged in the Activity Feed.
4. Verify full theme compatibility (Light, Warm Mono, Dark).
