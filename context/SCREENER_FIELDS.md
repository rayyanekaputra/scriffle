# Sectors API v2: Screener Available Fields Reference

Endpoint: `GET /v2/companies/`

## 1. Direct Fields (Top-Level Columns)
Standard operators: `=`, `!=`, `>`, `<`, `>=`, `<=`, `LIKE`, `IN`. String comparisons are case-insensitive.

- `symbol`: IDX ticker symbol (e.g. `BBCA`, `TLKM`)
- `company_name`: Full registered company name
- `listing_board`: IDX board (`Main`, `Development`, or `Acceleration`)
- `industry`: IDX industry classification
- `sub_industry`: IDX sub-industry classification
- `sector`: IDX sector classification
- `sub_sector`: IDX sub-sector classification
- `market_cap`: Market capitalisation in IDR
- `market_cap_rank`: Rank by market cap among all IDX companies (1 = largest)
- `employee_num`: Total number of employees
- `employee_num_rank`: Rank by employee count among all IDX companies
- `listing_date`: Date the company was first listed on IDX
- `last_ex_dividend_date`: Most recent ex-dividend date
- `last_close_price`: Latest closing price in IDR
- `daily_close_change`: Day-over-day closing price change as a decimal
- `forward_pe`: Forward price-to-earnings ratio based on next year earnings estimate
- `intrinsic_value`: Estimated intrinsic value per share in IDR
- `esg_score`: ESG composite score
- `yield_ttm`: Dividend yield over trailing twelve months
- `dividend_ttm`: Total dividends paid per share over trailing twelve months in IDR
- `payout_ratio`: Proportion of earnings paid out as dividends
- `cash_payout_ratio`: Proportion of free cash flow paid out as dividends
- `yoy_quarter_earnings_growth`: Year-over-year earnings growth based on most recent quarter
- `yoy_quarter_revenue_growth`: Year-over-year revenue growth based on most recent quarter

## 2. Array Fields
Filter with `in` operator.
- `tags`: Analyst sentiment tags (e.g. `'bullish'`)
- `indices`: IDX indices (e.g. `LQ45`, `IDX30`)
- `affiliates`: Related company tickers

## 3. JSON Object Fields (Most Recent Data)
- `pe_ttm`: Trailing twelve months P/E ratio
- `pb_mrq`: Most recent quarter P/B ratio
- `ps_ttm`: Trailing twelve months P/S ratio
- `dar_mrq`: Most recent quarter Debt-to-Assets ratio
- `der_mrq`: Most recent quarter Debt-to-Equity ratio
- `roa_ttm`: Trailing twelve months Return on Assets
- `roe_ttm`: Trailing twelve months Return on Equity
- `total_assets_mrq`, `total_equity_mrq`, `total_revenue_mrq`, `earnings_mrq`, `total_liabilities_mrq`
- `dividend_yield_avg`, `dividend_yield_avg_period`
- `52_w_low_price`, `52_w_high_price`, `all_time_low_price`, `all_time_high_price`

## 4. Yearly JSON Fields (`field[YYYY]`)
Bracket notation: `eps[2024]`, `revenue[2024]`, `earnings[2024]`, `pe[2024]`, `pb[2024]`, `roe[2024]`, `roa[2024]`, `free_cash_flow[2024]`, `gross_profit[2024]`, `operating_pnl[2024]`, `cost_to_income_ratio[2024]`, `capital_adequacy_ratio[2024]`.

## 5. Quarterly JSON Fields (`field[Qi-YYYY]`)
Bracket notation: `revenue_q[Q1-2024]`, `earnings_q[Q1-2024]`, `ebitda_q[Q1-2024]`, `operating_pnl_q[Q1-2024]`.
