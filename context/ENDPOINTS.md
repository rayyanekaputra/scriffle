# Sectors API v2 — Indonesia Endpoints

> **Base URL:** `https://api.sectors.app/v2`
>
> **Auth:** `Authorization: YOUR_API_KEY` header
>
> **Source:** [docs.sectors.app/api-references/v2/indonesia](https://docs.sectors.app/api-references/v2/indonesia/)

All endpoints are `GET` requests.

---

## 📊 Screener

| # | Endpoint | Path | Description |
|---|----------|------|-------------|
| 1 | [Companies Screener](https://docs.sectors.app/api-references/v2/indonesia/screener/companies) | `/v2/companies/` | High-performance API for filtering & sorting IDX-listed companies. Supports SQL-like queries (`where`, `order_by`) and natural language (`q`). |
| 2 | [Free Float Market Analysis](https://docs.sectors.app/api-references/v2/indonesia/screener/free-float) | `/v2/free-float/` | Returns free float percentage for IDX-listed companies, optionally filtered by sector taxonomy level. |

---

## 📈 Report

| # | Endpoint | Path | Description |
|---|----------|------|-------------|
| 3 | [Company Report](https://docs.sectors.app/api-references/v2/indonesia/report/company-report) | `/v2/company/report/{symbol}/` | Comprehensive report for an IDX-listed company (financials, valuation, peers, etc.). |
| 4 | [Company Revenue Segments](https://docs.sectors.app/api-references/v2/indonesia/report/company-segments) | `/v2/company/get-segments/{symbol}/` | Sankey-graph-ready revenue and cost segment breakdown for a given company and financial year. |
| 5 | [Company Quarterly Financials](https://docs.sectors.app/api-references/v2/indonesia/report/quarterly-financials) | `/v2/financials/quarterly/{symbol}/` | Quarterly financial data for a given IDX symbol. Fields vary by sector (banks/insurance have additional metrics). |
| 6 | [Subsector Report](https://docs.sectors.app/api-references/v2/indonesia/report/sector-report) | `/v2/subsector/report/{sub_sector}/` | Comprehensive report for an IDX subsector. Use `sections` param to fetch only the data you need. |

---

## 🏢 Company

| # | Endpoint | Path | Description |
|---|----------|------|-------------|
| 7 | [Corporate Actions](https://docs.sectors.app/api-references/v2/indonesia/company/corporate-actions) | `/v2/company/corporate-actions/{symbol}/` | All corporate action history for a given IDX-listed company (dividends, stock splits, rights issues, etc.). |
| 8 | [Shareholders Composition](https://docs.sectors.app/api-references/v2/indonesia/company/shareholders-composition) | `/v2/company/shareholders-composition/{symbol}/` | Monthly shareholder composition snapshots for a given IDX-listed company. |

---

## 💹 Transaction

| # | Endpoint | Path | Description |
|---|----------|------|-------------|
| 9 | [Daily Transaction Data](https://docs.sectors.app/api-references/v2/indonesia/transaction/daily) | `/v2/daily/{symbol}/` | Daily OHLCV transaction data for a single IDX ticker over a date range (up to 90 days). |
| 10 | [Daily Full-Universe Close](https://docs.sectors.app/api-references/v2/indonesia/transaction/close) | `/v2/close/` | Daily closing price for every IDX ticker on a single trading day, in one paginated feed. |
| 11 | [IDX Market Summary](https://docs.sectors.app/api-references/v2/indonesia/transaction/idx-total) | `/v2/idx-total/` | Historical total IDX market capitalisation for a date range (up to 90 days). Data from Jan 1, 2021. |
| 12 | [Index Daily Transaction Data](https://docs.sectors.app/api-references/v2/indonesia/transaction/index-daily) | `/v2/index-daily/{index_code}/` | Daily closing price for a given IDX index over a date range (up to 90 days). Data from Jan 2, 2019. |

---

## 🏆 Ranking

| # | Endpoint | Path | Description |
|---|----------|------|-------------|
| 13 | [Most Traded Stocks](https://docs.sectors.app/api-references/v2/indonesia/ranking/most-traded) | `/v2/most-traded/` | Most traded IDX stocks by transaction volume over a date range (up to 90 days). |
| 14 | [Top Company Movers](https://docs.sectors.app/api-references/v2/indonesia/ranking/top-changes) | `/v2/companies/top-changes/` | Top gainers and losers across multiple time periods (1d, 7d, 14d, 30d, 365d). |

---

## 🏦 Brokers

| # | Endpoint | Path | Description |
|---|----------|------|-------------|
| 15 | [Broker Registry](https://docs.sectors.app/api-references/v2/indonesia/brokers/broker-registry) | `/v2/brokers/` | List of all registered IDX brokers. |
| 16 | [Top Brokers Daily Ranking](https://docs.sectors.app/api-references/v2/indonesia/brokers/top) | `/v2/brokers/top/` | Brokers ranked by gross trade value or absolute net flow for a single date. Filter by origin (foreign/domestic) and cohort (retail/institutional). |
| 17 | [Broker Activity By Code](https://docs.sectors.app/api-references/v2/indonesia/brokers/broker-activity-by-code) | `/v2/broker-activity/{broker_code}/` | All (stock, day) trading activity for one broker over a date range (up to 14 days). |
| 18 | [Top Accumulations/Distributions Per Broker](https://docs.sectors.app/api-references/v2/indonesia/brokers/broker-activity-top) | `/v2/broker-activity/{broker_code}/top/` | Stocks a single broker has been most actively accumulating and distributing over a date range. |
| 19 | [Broker Activity Per Symbol](https://docs.sectors.app/api-references/v2/indonesia/brokers/broker-summary-by-symbol) | `/v2/broker-summary/{symbol}/` | Per-broker daily trading rows for one IDX ticker over a date range (up to 14 days). |
| 20 | [Top Buyers/Sellers Per Symbol](https://docs.sectors.app/api-references/v2/indonesia/brokers/broker-summary-top) | `/v2/broker-summary/{symbol}/top/` | Brokers most actively accumulating and distributing a single IDX ticker over a date range. |
| 21 | [Daily Net Foreign Inflow](https://docs.sectors.app/api-references/v2/indonesia/brokers/foreign-flow-by-symbol) | `/v2/foreign-flow/{symbol}/` | Daily net foreign-broker inflow (IDR) for one IDX ticker over a date range (up to 90 days). |

---

## 📰 News

| # | Endpoint | Path | Description |
|---|----------|------|-------------|
| 22 | [News Articles](https://docs.sectors.app/api-references/v2/indonesia/news/news) | `/v2/news/` | Paginated news articles from IDX or mining news sources. Filter by sector, subsector, tags, date range. |
| 23 | [Company Filings](https://docs.sectors.app/api-references/v2/indonesia/news/filings) | `/v2/filings/` | IDX insider trading filings — buy/sell transactions by company insiders and major shareholders. |
| 24 | [Stock Suspensions](https://docs.sectors.app/api-references/v2/indonesia/news/suspensions) | `/v2/suspensions/` | Paginated list of historical IDX-listed stock suspensions with dates, reasons, and official links. |

---

## 🚀 IPO

| # | Endpoint | Path | Description |
|---|----------|------|-------------|
| 25 | [Company IPO & Listing Performance](https://docs.sectors.app/api-references/v2/indonesia/ipo/listing-performance) | `/v2/listing-performance/{symbol}/` | Price change percentages since listing date across 7, 30, 90, and 365-day windows. |

---

## 📋 Helper Lists

| # | Endpoint | Path | Description |
|---|----------|------|-------------|
| 26 | [Subsectors](https://docs.sectors.app/api-references/v2/indonesia/helper-list/subsectors) | `/v2/subsectors/` | All available sector/subsector pairs as kebab-case slugs. |
| 27 | [Industries](https://docs.sectors.app/api-references/v2/indonesia/helper-list/industries) | `/v2/industries/` | All available subsector/industry pairs as kebab-case slugs. |
| 28 | [Subindustries](https://docs.sectors.app/api-references/v2/indonesia/helper-list/subindustries) | `/v2/subindustries/` | All available industry/sub-industry pairs as kebab-case slugs. |
| 29 | [News Tags](https://docs.sectors.app/api-references/v2/indonesia/helper-list/tags) | `/v2/tags/` | Sorted alphabetical array of all available tag slugs used across news articles and filings. |
| 30 | [Companies with Revenue Segments](https://docs.sectors.app/api-references/v2/indonesia/helper-list/companies-segments-list) | `/v2/companies/list_companies_with_segments/` | Dictionary of all companies that have revenue/cost segment data, with available financial years. |
| 31 | [Quarterly Financial Dates (Per Symbol)](https://docs.sectors.app/api-references/v2/indonesia/helper-list/company-quarterly-dates) | `/v2/company/get_quarterly_financial_dates/{symbol}/` | All available quarterly financial report dates for a given symbol, grouped by year. |
| 32 | [Latest Quarterly Financial Dates (Universe)](https://docs.sectors.app/api-references/v2/indonesia/helper-list/latest-quarterly-dates) | `/v2/companies/quarterly-financial-dates/` | Latest available quarterly report date for every IDX company in one paginated feed. |

---

## Quick Reference (All 32 Endpoints)

```
# Screener
GET /v2/companies/                                          # Companies Screener
GET /v2/free-float/                                         # Free Float

# Report
GET /v2/company/report/{symbol}/                            # Company Report
GET /v2/company/get-segments/{symbol}/                      # Revenue Segments
GET /v2/financials/quarterly/{symbol}/                      # Quarterly Financials
GET /v2/subsector/report/{sub_sector}/                      # Subsector Report

# Company
GET /v2/company/corporate-actions/{symbol}/                 # Corporate Actions
GET /v2/company/shareholders-composition/{symbol}/          # Shareholders

# Transaction
GET /v2/daily/{symbol}/                                     # Daily OHLCV
GET /v2/close/                                              # Full Universe Close
GET /v2/idx-total/                                          # IDX Market Cap
GET /v2/index-daily/{index_code}/                           # Index Daily

# Ranking
GET /v2/most-traded/                                        # Most Traded
GET /v2/companies/top-changes/                              # Top Movers

# Brokers
GET /v2/brokers/                                            # Broker Registry
GET /v2/brokers/top/                                        # Top Brokers
GET /v2/broker-activity/{broker_code}/                      # Broker Activity
GET /v2/broker-activity/{broker_code}/top/                  # Broker Top Accum/Dist
GET /v2/broker-summary/{symbol}/                            # Broker Summary
GET /v2/broker-summary/{symbol}/top/                        # Top Buyers/Sellers
GET /v2/foreign-flow/{symbol}/                              # Foreign Flow

# News
GET /v2/news/                                               # News Articles
GET /v2/filings/                                            # Company Filings
GET /v2/suspensions/                                        # Stock Suspensions

# IPO
GET /v2/listing-performance/{symbol}/                       # IPO Performance

# Helper Lists
GET /v2/subsectors/                                         # Subsectors
GET /v2/industries/                                         # Industries
GET /v2/subindustries/                                      # Subindustries
GET /v2/tags/                                               # News Tags
GET /v2/companies/list_companies_with_segments/              # Companies w/ Segments
GET /v2/company/get_quarterly_financial_dates/{symbol}/      # Quarterly Dates
GET /v2/companies/quarterly-financial-dates/                 # Latest Quarterly Dates
```
