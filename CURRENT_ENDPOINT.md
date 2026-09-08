# Scriffle Features & Sectors API v2 Mapping

This document maps all active, integrated, and planned features in Scriffle directly to the **32 Sectors API v2 Endpoints** referenced in [`ENDPOINTS.md`](./ENDPOINTS.md).

---

## 🟢 1. Active & Implemented Features

| Feature Name | Scriffle Component / Flow | Sectors API v2 Endpoint | Endpoint # in `ENDPOINTS.md` | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Real-Time Market Watcher** | `WatcherNode.tsx` & `/api/engine/trigger` | `GET /v2/daily/{symbol}/` | **#9** (Daily Transaction Data) | 🟢 Active |
| **Manual Live API Polling** | Left Sidebar **"Poll Live Sectors API"** button | `GET /v2/daily/{symbol}/` | **#9** (Daily Transaction Data) | 🟢 Active |
| **Independent Per-Node Auto-Polling** | `page.tsx` Scheduler + `SimulationBar.tsx` | `GET /v2/daily/{symbol}/` | **#9** (Daily Transaction Data) | 🟢 Active |
| **Automated Fundamental Report Action** | `ActionNode.tsx` $\rightarrow$ `graphEngine.ts` | `GET /v2/company/report/{symbol}/` | **#3** (Company Report) | 🟢 Active |
| **Interactive Research Brief & PDF Export** | `/api/export/report?symbol={symbol}` | `GET /v2/company/report/{symbol}/` | **#3** (Company Report) | 🟢 Active |
| **Top Market Movers & Gainers Radar** | `WatcherNode.tsx` (Radar Mode) & `/api/engine/trigger` | `GET /v2/companies/top-changes/` | **#14** (Top Company Movers) | 🟢 Active |
| **Universal File Node Attachment** | `FileNode.tsx` (Open in tab + Open location) | Linked output of `/api/export/report` | N/A (Canvas Node System) | 🟢 Active |

---

## 🟡 2. Backlogged & Planned Features

| Feature Name | Proposed Scriffle Component | Target Sectors API v2 Endpoint | Endpoint # in `ENDPOINTS.md` | Status |
| :--- | :--- | :--- | :--- | :--- |
| **AI Natural Language Screener** | `ScreenerNode.tsx` (Plain English prompt resolver) | `GET /v2/companies/?q={query}&include_query_values=true` | **#1** (Companies Screener) | 🟡 In Backlog |
| **Smart Money & Foreign Flow Tracker** | `ForeignFlowWatcher.tsx` (Bandarmology rules) | `GET /v2/foreign-flow/{symbol}/` | **#21** (Daily Net Foreign Inflow) | 🟡 In Backlog |
| **Broker Accumulation / Distribution Alert** | `BrokerRadarNode.tsx` (Top buyer/seller tracking) | `GET /v2/broker-summary/{symbol}/top/` | **#20** (Top Buyers/Sellers Per Symbol) | 🟡 In Backlog |
| **Insider Filings & Governance Alert** | `InsiderAlertNode.tsx` (Director / Shareholder trades) | `GET /v2/filings/` | **#23** (Company Filings) | 🟡 In Backlog |
| **Liquidity & Volume Breakout Scanner** | `VolumeBreakoutNode.tsx` (Exchange volume leaders) | `GET /v2/most-traded/` | **#13** (Most Traded Stocks) | 🟡 In Backlog |
| **Revenue & Cost Segment Sankey Card** | `SegmentNode.tsx` (Visual revenue waterfall) | `GET /v2/company/get-segments/{symbol}/` | **#4** (Company Revenue Segments) | 🟡 In Backlog |
| **New IPO & Listing Momentum Tracker** | `IpoWatcherNode.tsx` (Post-listing performance) | `GET /v2/listing-performance/{symbol}/` | **#25** (IPO Listing Performance) | 🟡 In Backlog |

---

## 📊 Summary of Active Endpoints

```
[Active in Engine]
├── GET /v2/daily/{symbol}/              --> Watcher Nodes, Live Polling, Per-Node Cadence Engine
├── GET /v2/companies/top-changes/       --> Top Gainers & Losers Radar Watchers
└── GET /v2/company/report/{symbol}/     --> Action Node (Fundamental Report), PDF Brief Generator
```
