# Scriffle Feature Backlog

This backlog tracks candidate Sectors API v2 integrations and advanced automation capabilities planned for future iterations.

---

## 🚀 Active / Completed in Recent Sprint

- [x] **⚡ Top Market Movers & Gainers Radar (`/v2/companies/top-changes/`)**
  - Integrated into `WatcherNode.tsx`, `EditNodeModal.tsx`, `ContextMenu.tsx`, and `/api/engine/trigger`.
  - Supports `Top Gainers` & `Top Losers` modes with custom % move threshold filtering and automated downstream graph execution.
- [x] **📑 Universal File Node & Document Output (`FileNode.tsx`)**
  - Universal visual file attachments with category icons, browser preview, copy link, and direct OS folder reveal (`/api/file/open-location`).
- [x] **📊 Automated Fundamental Report Action (`/v2/company/report/{symbol}/`)**
  - `ActionNode.tsx` triggers live fundamental report generation and automatically spawns an attached `FileNode` on the canvas.
- [x] **⏱️ Independent Per-Watcher Polling Engine**
  - Configurable polling cadences (1s–3600s) per watcher with automatic timer scheduling.
- [x] **✍️ FigJam × Miro Rich Free-Text Whiteboard Tooling**
  - Interactive floating formatting toolbar (`TextFormatToolbar`), 4-tier font scale (`Title`, `Header`, `Body`, `Caption`), bold/italic/underline/strike, text alignment, pastel highlighter pens (`Yellow`, `Mint`, `Coral`, `Purple`), container modes (`Plain`, `Callout Banner`, `Card`), 1:1 true WYSIWYG parity, auto-growing textarea, interactive `<NodeResizer />`, markdown prefix triggers (`# `, `## `, `- `), and `T` hotkey canvas placement.
- [x] **📦 FigJam & Miro-Style Group / Ungroup & Deep Isolation Mode**
  - Grouping selected elements with `Cmd+G`, ungrouping with `Cmd+Shift+G`, cohesive group drag/selection, group-aware copy & paste (`Cmd+C` / `Cmd+V`) preserving internal connectors and spatial layout, and double-click isolation focus mode for sub-element editing and `Shift+Click` intra-group selections.
- [x] **📐 Figma-Style Multi-Selection Bounding Box & Transform Handles**
  - Interactive 8-point corner and edge midpoint handles overlay around all selected elements with live object counter and quick `Group` / `Ungroup` action buttons.

---

## 📌 Open Candidate Endpoints & Features

### 1. 📄 Redesign PDF & Export Brief Layout (Scriffle Design System) — High Priority
- **Status**: 🟡 Open / Needs Polish
- **Issue**: The current `/api/export/report` document layout looks too plain and does not use Scriffle's signature visual style.
- **Goal**: Redesign the research brief to match Scriffle's FigJam/Neo-brutalist aesthetic:
  - 2px solid dark borders, zero blurry drop shadows, crisp high-contrast cards.
  - Distinctive tag capsules, company identity cards, and clear metric grids (Valuation, Financial Health, Profitability, Peer Comparison).
  - Print-friendly layout (`@media print`) for institutional-grade PDF and physical printouts.
  - Multi-theme preview support (Light, Warm Mono `#F4F3EF`, Dark `#181920`).

---

### 2. 🤖 AI Natural Language Screener (`/v2/companies/?q=...`)
- **API**: `GET /v2/companies/?q={natural_language_query}&include_query_values=true`
- **Description**: Natural language company screener allowing users to type freeform queries (e.g. *"top 3 banks by market cap"*, *"mining companies with PE < 10 and dividend yield > 5%"*).
- **Canvas Integration**: Dynamic Screener Node that resolves and streams multi-ticker event payloads to downstream Condition and Action nodes.

---

### 3. 🌊 Foreign Flow & Smart Money Tracker (`/v2/foreign-flow/{symbol}/`)
- **API**: `GET /v2/foreign-flow/{symbol}/`
- **Description**: Daily net foreign-broker inflow/outflow (in IDR) and volume for tracked IDX stocks.
- **Canvas Integration**: Bandarmology & Foreign Flow Node for institutional accumulation/distribution rules (e.g., `foreign_flow > 50B IDR AND price_change > 2%`).

---

### 4. 🕵️‍♂️ Insider Filings & Governance Radar (`/v2/filings/`)
- **API**: `GET /v2/filings/`
- **Description**: Real-time regulatory disclosures on insider stock transactions by directors, commissioners, and major shareholders (>5%).
- **Canvas Integration**: Insider Trading Alert Node that generates instant event triggers when high-conviction insider buys or sales occur.

---

### 5. 🏢 Broker Accumulation / Distribution Tracker (`/v2/broker-summary/{symbol}/top/`)
- **API**: `GET /v2/broker-summary/{symbol}/top/`
- **Description**: Identifies the top buyer and seller brokerages for any stock to detect retail vs institutional positioning.
- **Canvas Integration**: Broker Radar Node that evaluates accumulation ratios and triggers warnings when smart money begins exiting.

