# 📋 Implementation Plan: AI Natural Language Screener (`/v2/companies/?q=...`)

This document outlines the end-to-end plan for implementing the **AI Natural Language Screener Node** in Scriffle, connecting natural language queries to the Sectors.app `GET /v2/companies/` endpoint and downstream canvas automations.

---

## 1. Feature Specifications

### 1.1 Overview
The **AI Natural Language Screener Node** (`ScreenerNode`) enables users to type plain English queries (or SQL-like `where` filters) to search and rank companies across the IDX universe.
Examples:
- `"top 10 tech companies by revenue in 2023"`
- `"top 5 banks by market cap"`
- `"coal mining companies with PE < 10 and dividend yield > 5%"`
- `"companies with positive earnings growth in 2024"`

### 1.2 Query Modes Supported
1. **Natural Language (`q`)**:
   - Sends `q=<natural_language_prompt>&include_query_values=true`.
   - The Sectors API LLM dynamically resolves the filters, sorting, and limits.
2. **Structured Query (`where` + `order_by`)** *(Advanced tab in Edit Modal)*:
   - For power users who prefer explicit expressions: `where=revenue[2024] > 1000000000000&order_by=-market_cap&limit=10`.

---

## 2. API Client Integration (`src/server/services/sectorsApi.ts`)

### 2.1 Interface & Types
```typescript
export interface ScreenerCompanyResult {
  symbol: string;
  company_name: string;
  sector?: string;
  sub_sector?: string;
  market_cap?: number;
  price?: number;
  pe?: number;
  pb?: number;
  dividend_yield?: number;
  revenue?: number;
  earnings?: number;
  [key: string]: any; // dynamic metric columns extracted by the LLM
}

export interface ScreenerResponse {
  data: ScreenerCompanyResult[];
  query_values?: Record<string, any>;
  query?: string;
}
```

### 2.2 Client Method `fetchCompaniesScreener`
- URL: `https://api.sectors.app/v2/companies/`
- Query Params:
  - If `q` is set: `?q=${encodeURIComponent(q)}&include_query_values=true`
  - If `where` is set (without `q`): `?where=${encodeURIComponent(where)}&order_by=${order_by}&limit=${limit}`
- Headers: `Authorization: ${apiKey}` (when provided).
- **Offline / Mock Fallback**:
  - Pre-built rich datasets for common queries:
    - **Banking** (`"top banks by market cap"`): `BBCA`, `BBRI`, `BMRI`, `BBNI`, `BRIS`
    - **Tech & Telecom** (`"top tech companies"`): `GOTO`, `TLKM`, `BUKA`, `EMTK`, `MTDL`
    - **Mining & Energy** (`"coal mining companies with high dividend"`): `ADRO`, `PTBA`, `ITMG`, `BUMI`, `MEDC`
    - **Consumer Staples** (`"consumer goods companies"`): `ICBP`, `INDF`, `UNVR`, `MYOR`, `KLBF`
    - **Dynamic Fallback**: If unknown query offline, safely filters mock company universe based on keyword matching.

---

## 3. Data Contracts & State Management (`src/types/canvas.ts`)

### 3.1 Node Type & Config
```typescript
export type NodeType =
  | 'watcher'
  | 'condition'
  | 'note'
  | 'alert'
  | 'action'
  | 'screener'   // New Node Type
  | 'text'
  | 'image'
  | 'sticker'
  | 'file';

export interface ScreenerConfig {
  query: string;               // e.g. "top 5 banks by market cap"
  mode?: 'natural' | 'structured';
  where?: string;              // e.g. "revenue[2024] > 1000000000000"
  orderBy?: string;            // e.g. "-market_cap"
  limit?: number;              // default 5
  interval?: number;           // in seconds (e.g. 300 for periodic re-screen)
  cycleCount?: number;         // run counter displayed as "⚡ 3 runs"
}

export interface CanvasNodeState {
  // Existing fields...
  screenerResults?: ScreenerCompanyResult[];
  queryValues?: Record<string, any>;
  lastScreenedAt?: string;
}
```

---

## 4. Graph Engine Execution (`src/server/services/graphEngine.ts`)

### 4.1 Execution Flow `executeGraphForScreener`
When a Screener Node triggers (via manual run button, simulation trigger, or polling tick):
1. Calls `fetchCompaniesScreener(config.query, { apiKey })`.
2. Persists `state.screenerResults` and increments `cycleCount`.
3. Traverses downstream connected nodes via BFS:
   - **Flow A (Direct Connected Note Node)**:
     - Formats a clean Markdown table summarizing the screened companies, their ranks, tickers, and extracted metrics.
     - Updates the note's `content` and triggers canvas broadcast.
   - **Flow B (Connected Action Node)**:
     - `create_watcher`: Auto-spawns independent watcher automation pipelines (`[Watcher] -> [Condition] -> [Note]`) for all screened tickers (staggered spatial layout).
     - `fundamental_report`: Automatically generates company reports, exports to `reports/{project_slug}/{symbol}_Fundamental_Brief.html`, and spawns attached `FileNode` cards for each result.
     - `create_note`: Spawns individual sticky notes for each screened company.
   - **Flow C (Connected Alert Node)**:
     - Emits toast notification (e.g., `✨ AI Screener found 5 companies for "top 5 banks by market cap"`).

---

## 5. UI & Design System Components

Complying strictly with Scriffle's Design System (flat 2px borders, 0 drop shadows, Stack Sans Text sentence/title case, MingCute icons, theme token compatibility):

### 5.1 `src/components/canvas/nodes/ScreenerNode.tsx`
- **Visual Appearance**: Clean card with Electric Blue (`#0050FF`) accent header and MingCute `mgc_ai_line` / `mgc_sparkles_line` icon.
- **Top Bar**: Query prompt badge (`"top 5 banks by market cap"`), run button (`⚡ Run`), cycle indicator (`⚡ 4 runs`).
- **Live Results Table**: Ranked list with rank number, ticker badge, company name, and dynamic primary metric (e.g., Market Cap `Rp 1,250 T`, P/E `14.2x`).
- **Handles**: Output handle at bottom/right for wiring downstream conditions, notes, and actions.

### 5.2 Property Editor (`src/components/controls/EditNodeModal.tsx`)
- Dedicated Screener configuration tab:
  - Natural Language Prompt input with suggestions pills:
    - `"Top 5 banks by market cap"`
    - `"Mining companies with PE < 10 and dividend yield > 5%"`
    - `"Tech companies with positive revenue growth"`
    - `"High ROE consumer goods stocks"`
  - Max results limiter (Top 3, 5, 10, 20).
  - Advanced toggle for SQL `where` and `order_by` filters.
  - Polling interval slider (manual, 60s, 300s, 3600s).

### 5.3 Toolbar & Context Menu Integration
- **`ContextMenu.tsx`**: Add `AI Screener Node` to the right-click insert menu (`mgc_sparkles_line`).
- **`TopNav.tsx` / `NavToolbar.tsx`**: Add quick Screener insert button.

---

## 6. Verification & Test Plan

1. **Unit & Engine Smoke Test**:
   - Test `fetchCompaniesScreener` with mock and live API keys.
   - Verify graph propagation from Screener → Note and Screener → Action (`fundamental_report`, `create_watcher`).
2. **UI & Canvas Verification**:
   - Drop a Screener Node via context menu or toolbar.
   - Configure a prompt (e.g. `"top 5 banks by market cap"`).
   - Trigger execution and verify:
     - Table renders live items with formatted badges.
     - Connected Sticky Note automatically renders formatted table.
     - Connected Action Node auto-spawns downstream pipelines and disk reports.
3. **Theme & Design Consistency**:
   - Verify across Light, Mono (warm-paper), and Dark themes.
   - Verify zero drop shadows, 2px borders, and sentence case text.
