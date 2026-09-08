# Scriffle Feature Backlog

This backlog tracks candidate Sectors API v2 integrations and advanced automation capabilities planned for future iterations.

---

## 📌 Candidate Endpoints & Features

### 1. 🤖 AI Natural Language Screener (`/v2/companies/?q=...`)
- **API**: `GET /v2/companies/?q={natural_language_query}&include_query_values=true`
- **Description**: Natural language company screener allowing users to type freeform queries (e.g. *"top 3 banks by market cap"*, *"mining companies with PE < 10 and dividend yield > 5%"*).
- **Canvas Integration**: Dynamic Screener Node that dynamically resolves and streams multi-ticker event payloads to connected Condition and Action nodes.

---

### 2. ⚡ Top Market Movers & Gainers Radar (`/v2/companies/top-changes/`)
- **API**: `GET /v2/companies/top-changes/`
- **Description**: Automated leaderboard monitoring top gainers and losers across 1d, 7d, 30d, and 365d windows.
- **Canvas Integration**: Market Mover Radar Node that continuously monitors the broader IDX exchange and triggers downstream actions when stocks hit threshold gains.

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

## 🎨 UI & Document Polish

### 5. 📄 Redesign PDF & Export Brief Layout (Scriffle Design System)
- **Issue**: The current exported research brief / PDF view layout looks generic and lacks Scriffle's signature visual design.
- **Goal**: Redesign the `/api/export/report` document layout to adopt Scriffle's distinctive FigJam/sticker aesthetic:
  - Flat 2px solid outlines (zero soft shadows, crisp high-contrast cards).
  - FigJam brand typography, tag capsules, and clean metric grids.
  - Scriffle Blue (`#0050FF`) and warm paper surfaces matching the canvas themes.
  - Formatted print stylesheet (`@media print`) so physical/PDF printouts look institutional-grade.
