# 📋 Implementation Plan: API Credit Cost Badges & Multi-Stock Burst Warning (Rank 3)

## 1. Problem Statement & Motivation
Sectors API v2 charges specific credit costs per endpoint call:
- `GET /v2/companies/top-changes/`: **10 credits / poll**
- `GET /v2/company/report/{symbol}/`: **8 credits / symbol**
- `GET /v2/companies/?q=...`: **3 credits / query**
- `GET /v2/daily/{symbol}/`: **1 credit / symbol tick**

When automated pipelines chain nodes (e.g. a Top Movers Radar watcher triggering `Action: fundamental_report` for 5 stocks simultaneously), **40+ credits** are consumed in a single execution burst. Users need clear, visible feedback on:
1. **Node UI cards**: Badges displaying credit costs per trigger/poll.
2. **Edit Modal**: Informative credit consumption breakdowns and multi-stock burst warnings before configuring expensive actions.
3. **Design Consistency**: Follow flat outline system (2px borders, zero drop shadows, MingCute icons, Stack Sans Text, strict sentence/title case).

---

## 2. Target UX & Visual Badges

### A. Action Node (`ActionNode.tsx`)
- **`fundamental_report` action**:
  - Displays amber credit badge: `🪙 8 credits / symbol`
  - Subtext warning when wired to multi-symbol outputs: `"~40 credits per 5-stock leaderboard run"`.
- **`create_watcher` / `create_note`**:
  - Displays clean badge: `⚡ 0 credits (Board mutation)`

### B. Watcher Node (`WatcherNode.tsx`)
- **Top Gainers / Losers Radar Mode**:
  - Displays amber credit pill in footer: `🪙 10 credits / poll`
- **Single Ticker Mode (`BBCA`, `TLKM`)**:
  - Displays subtle pill in footer: `🪙 1 credit / tick`

### C. Screener Node (`ScreenerNode.tsx`)
- Standardize and polish existing `3 AI credits / query` pill with consistent typography and theme tokens across Light, Mono, and Dark modes.

### D. Node Editor Modal (`EditNodeModal.tsx`)
- **Watcher Tab**:
  - Notice callout: `⚡ Single Stock: 1 credit/tick | Top Movers Radar: 10 credits/poll`.
- **Action Tab (`fundamental_report`)**:
  - Prominent burst warning box:
    > ⚠️ **API Credit Notice & Burst Warning:** Each company fundamental report consumes **8 API credits** (`/v2/company/report/{symbol}/`). Triggering automated reports for 5 Top Movers will consume **40 credits per poll**.
- **Action Tab (`create_watcher`)**:
  - Clarify that node creation is free (0 credits), while spawned watchers consume 1 credit per symbol tick on subsequent polls.

---

## 3. Credit Cost Architecture & Helper Contract

Create a centralized credit cost utility `src/lib/creditCosts.ts`:

```typescript
export interface CreditCostEstimate {
  creditsPerUnit: number;
  unitLabel: string;
  badgeText: string;
  endpoint?: string;
  burstEstimate?: (stockCount: number) => string;
}

export function getCreditCostForNode(type: string, config: any): CreditCostEstimate;
```

---

## 4. File Modifications

| File | Changes |
|---|---|
| [`src/lib/creditCosts.ts`](file:///home/abzolute/Projects/hackathon/src/lib/creditCosts.ts) *(New)* | Central credit cost calculation utility & pricing registry. |
| [`src/components/canvas/nodes/ActionNode.tsx`](file:///home/abzolute/Projects/hackathon/src/components/canvas/nodes/ActionNode.tsx) | Render dynamic credit cost badge based on action type. |
| [`src/components/canvas/nodes/WatcherNode.tsx`](file:///home/abzolute/Projects/hackathon/src/components/canvas/nodes/WatcherNode.tsx) | Render `10 credits / poll` (Radar) or `1 credit / tick` (Single) pill in footer. |
| [`src/components/controls/EditNodeModal.tsx`](file:///home/abzolute/Projects/hackathon/src/components/controls/EditNodeModal.tsx) | Add credit cost notices and 40-credit multi-stock burst warnings in Action and Watcher tabs. |
| [`src/__tests__/unit/creditCosts.test.ts`](file:///home/abzolute/Projects/hackathon/src/__tests__/unit/creditCosts.test.ts) *(New)* | Vitest unit tests verifying credit calculations across all node configs. |
| [`context/BACKLOG.md`](file:///home/abzolute/Projects/hackathon/context/BACKLOG.md) | Update status to completed. |
