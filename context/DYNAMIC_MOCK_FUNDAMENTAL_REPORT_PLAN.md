# 📊 Dynamic Mock Fundamental Report & Valuation Metric Updates

## Goal Description
When subsequent mock market ticks trigger a `fundamental_report` action (e.g. `GOTO Rev 5`), the note content and exported report currently retain hardcoded static numbers (`Market Cap: Rp 62.5 T`, `P/E -18.5x`, `P/B 1.95x`, `Margin -8.4%`) because `MOCK_FUNDAMENTAL_DATA` only defines static constants and `getCompanyFundamentalReport()` does not dynamically factor in current market price changes or tick events.

This plan details how to dynamically recalculate **Market Cap**, **Valuation Multiples (P/E, P/B)**, **Price**, and **Financial Ratios** on every mock tick and report revision so all properties stay in sync with market movements.

---

## 🔍 Root Cause Analysis
1. **Static Fixture Return in `sectorsApi.ts`**:
   `getCompanyFundamentalReport(upperSymbol, sessionApiKey)` returns a shallow copy of `MOCK_FUNDAMENTAL_DATA[upperSymbol]` with fixed `marketCap`, `marketCapFormatted`, `peRatio`, `pbvRatio`, and `netProfitMargin`.
2. **Missing Market Event Context**:
   `handleFundamentalReportMutation` in `graphEngine.ts` calls `getCompanyFundamentalReport(cleanSymbol, sessionApiKey)` without threading the active `MarketEvent` (which contains the dynamic `price`, `prevPrice`, and `price_change`).
3. **No Dynamic Valuation Calculation**:
   In real equity research, when price changes by $\Delta\%$:
   - $\text{Market Cap}_{\text{new}} = \text{Market Cap}_{\text{base}} \times (1 + \frac{\Delta\%}{100})$
   - $\text{P/E}_{\text{new}} = \text{P/E}_{\text{base}} \times (1 + \frac{\Delta\%}{100})$
   - $\text{P/B}_{\text{new}} = \text{P/B}_{\text{base}} \times (1 + \frac{\Delta\%}{100})$
   - $\text{Last Close Price} = \text{event.price}$
   - $\text{Daily Close Change} = \frac{\text{event.price\_change}}{100}$

---

## Proposed Changes

### Component 1: `src/server/services/sectorsApi.ts`

#### [MODIFY] sectorsApi.ts
1. Update `getCompanyFundamentalReport` signature to accept optional `marketEvent?: MarketEvent`:
   ```ts
   export async function getCompanyFundamentalReport(
     symbol: string,
     sessionApiKey?: string,
     marketEvent?: MarketEvent
   ): Promise<CompanyFundamentalReport>
   ```
2. When falling back to mock data (`explicitMock` or `buildDynamicCompanyReport`):
   - Retrieve or generate the current `MarketEvent` for the symbol if not passed.
   - Dynamically compute:
     ```ts
     const priceChange = marketEvent ? marketEvent.price_change : ((Math.random() - 0.5) * 6);
     const price = marketEvent?.price || Math.round(basePrice * (1 + priceChange / 100));
     
     // Market cap moves proportionally with price
     const dynamicMarketCap = Math.round(baseMarketCap * (1 + priceChange / 100));
     const dynamicMarketCapFormatted = formatMarketCap(dynamicMarketCap);
     
     // Valuation multiples adjust with price
     const dynamicPe = parseFloat((basePe * (1 + priceChange / 100)).toFixed(2));
     const dynamicPbv = parseFloat((basePbv * (1 + priceChange / 100)).toFixed(2));
     ```
   - Update `allTimePrice`, `futureForecasts.intrinsicValue`, `lastClosePrice`, and `dailyCloseChange` with the dynamic prices.

---

### Component 2: `src/server/services/graphEngine.ts`

#### [MODIFY] graphEngine.ts
1. Update `FundamentalMutationInput` interface in `graphEngine.ts` to accept `marketEvent?: MarketEvent`.
2. In `handleFundamentalReportMutation`:
   - Pass `marketEvent` into `getCompanyFundamentalReport(cleanSymbol, sessionApiKey, marketEvent)`.
   - Pass `marketEvent` into `exportReportToDisk(canvasName, cleanSymbol, sessionApiKey, nextRev, marketEvent)`.
3. Update call sites across `graphEngine.ts`:
   - Inside `executeGraphForEvent` (single ticker trigger pipeline): pass current `event`.
   - Inside `executeGraphForRadarWatcher` (Top Movers radar trigger): pass the specific mover's `MarketEvent`.
   - Inside `executeGraphForScreener`: pass the screened company's synthesized `MarketEvent`.

---

### Component 3: `src/server/services/reportExporter.ts`

#### [MODIFY] reportExporter.ts
1. Update `exportReportToDisk` signature to accept `marketEvent?: MarketEvent`:
   ```ts
   export async function exportReportToDisk(
     projectName: string,
     symbol: string,
     sessionApiKey?: string,
     revisionCount: number = 1,
     marketEvent?: MarketEvent
   ): Promise<ExportedReportResult>
   ```
2. Pass `marketEvent` to `getCompanyFundamentalReport(cleanSymbol, sessionApiKey, marketEvent)` so the generated standalone HTML document and printable PDF reflect the exact dynamic valuation and market cap numbers.

---

## Verification Plan

### Automated Tests
1. Add new unit tests to `src/__tests__/unit/reportRevision.test.ts` verifying that:
   - Passing different `MarketEvent` payloads to `getCompanyFundamentalReport` results in varying, dynamically calculated `marketCap`, `peRatio`, `pbvRatio`, and formatted strings.
   - Revision updates reflect the new market price and valuation without static stagnation.
2. Run full test suite:
   ```bash
   bun test
   ```
   Ensure all tests stay green.
3. Verify Next.js build:
   ```bash
   bun run build
   ```

### Manual Verification
1. Start dev server: `bun dev`.
2. Drop a Watcher (`GOTO`) $\rightarrow$ Condition $\rightarrow$ Action (`fundamental_report`).
3. Click **"Poll Market API (Mock)"** multiple times.
4. Verify that:
   - Sticky Note and FileNode update in-place with `(Rev 2)`, `(Rev 3)`, etc.
   - Market Cap (e.g. `Rp 58.4 T` $\rightarrow$ `Rp 64.2 T`), P/E, and P/B update dynamically on each revision according to the simulated price move.
