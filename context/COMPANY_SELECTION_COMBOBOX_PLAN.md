# 📋 Implementation Plan: Company & Symbol Selection Combobox with AI Fallback

> **Last updated:** Revised with code review feedback — empty-query behavior, dataset ordering, `popular` flag, `onOpenScreener` wiring, and dataset sourcing all clarified.

---

## 1. Overview & Goal
Replace raw ticker text inputs with an **instant, zero-lag, hybrid Company & Symbol Combobox**.
* **Primary Path**: Instant in-memory search across the **Top ~180 Most Popular / Liquid Indonesian Companies** (LQ45, IDX30, IDX80, Kompas100) by symbol abbreviation (e.g. `BBCA`, `TLKM`) or any word in the company full name (e.g. `mandiri`, `astra`, `indofood`, `telkom`).
* **Fallback Path**: When a user types a ticker or concept not found in the list, provide an immediate 1-click prompt to look it up via the **AI Natural Language Screener**.
* **Design Compliance**: Follows Scriffle's 2px flat outline system, zero drop shadows, MingCute icons, Stack Sans Text, and Light/Mono/Dark/Custom theme support.

---

## 2. Technical Architecture & File Structure

```
src/
├── data/
│   └── popularIdxCompanies.ts       <-- Curated dataset (~180 popular IDX tickers & names)
├── lib/
│   └── search/
│       └── companySearch.ts         <-- Fast in-memory token/substring matcher (<0.3ms)
└── components/
    ├── ui/
    │   └── CompanyCombobox.tsx      <-- Reusable accessible combobox dropdown component
    └── controls/
        └── EditNodeModal.tsx        <-- Integrated into Watcher & Action node property forms
```

---

## 3. Detailed Component & Logic Design

### A. Popular IDX Dataset (`src/data/popularIdxCompanies.ts`)

#### Data Sourcing Decision
Dataset is hand-curated from authoritative public sources (IDX official listings, LQ45/IDX30/Kompas100 constituent lists). The `/v2/close/` Sectors API endpoint was considered for bootstrapping but the static approach was chosen to keep the combobox fully offline-capable, zero-cost (no API quota), and stable across market holidays or API downtime.

#### `IdxCompany` Interface
```typescript
export interface IdxCompany {
  symbol: string;      // e.g. "BBCA"
  name: string;        // e.g. "Bank Central Asia Tbk"
  popular?: boolean;   // true for ~10-12 highest-signal stocks shown on empty focus
}
```

The `popular` flag drives the **empty-query UX** (see Section B below). A curated subset of ~12 well-known names is flagged `popular: true`:
`BBCA`, `BBRI`, `BMRI`, `TLKM`, `ASII`, `GOTO`, `ADRO`, `ANTM`, `ICBP`, `UNVR`, `BREN`, `AMMN`

#### Dataset Order (Intentional — Not Arbitrary)
The array is ordered by **descending market relevance and liquidity**:
1. LQ45 constituents first (highest liquidity, most recognized).
2. IDX80 / Kompas100 next.
3. Other active but less-liquid IDX names last.

This ensures that when a user types a partial query and multiple results are equally relevant, the `.filter()` output naturally surfaces the most liquid / popular names first — without needing complex scoring logic.

#### Sample entries:
```typescript
export const POPULAR_IDX_COMPANIES: IdxCompany[] = [
  // --- LQ45 Blue Chips (popular flagged) ---
  { symbol: 'BBCA', name: 'Bank Central Asia Tbk', popular: true },
  { symbol: 'BBRI', name: 'Bank Rakyat Indonesia (Persero) Tbk', popular: true },
  { symbol: 'BMRI', name: 'Bank Mandiri (Persero) Tbk', popular: true },
  { symbol: 'BBNI', name: 'Bank Negara Indonesia (Persero) Tbk' },
  { symbol: 'TLKM', name: 'Telkom Indonesia (Persero) Tbk', popular: true },
  { symbol: 'ASII', name: 'Astra International Tbk', popular: true },
  { symbol: 'BREN', name: 'Barito Renewables Energy Tbk', popular: true },
  { symbol: 'AMMN', name: 'Amman Mineral Internasional Tbk', popular: true },
  { symbol: 'GOTO', name: 'GoTo Gojek Tokopedia Tbk', popular: true },
  { symbol: 'ADRO', name: 'Adaro Energy Indonesia Tbk', popular: true },
  { symbol: 'ANTM', name: 'Aneka Tambang Tbk', popular: true },
  { symbol: 'ICBP', name: 'Indofood CBP Sukses Makmur Tbk', popular: true },
  { symbol: 'UNVR', name: 'Unilever Indonesia Tbk', popular: true },
  // --- LQ45 (non-popular-flagged) ---
  { symbol: 'INDF', name: 'Indofood Sukses Makmur Tbk' },
  { symbol: 'PTBA', name: 'Bukit Asam Tbk' },
  { symbol: 'MEDC', name: 'Medco Energi Internasional Tbk' },
  { symbol: 'MDKA', name: 'Merdeka Copper Gold Tbk' },
  // ... ~180 total covering LQ45, IDX30, IDX80, Kompas100
];
```

---

### B. Fast Word & Substring Search Matcher (`src/lib/search/companySearch.ts`)

#### Empty Query Behavior
When the query is empty (input focused but nothing typed yet), **do not show an arbitrary slice of the array**. Instead, return only the `popular: true` flagged entries — a curated, meaningful "Popular stocks to watch" list:

```typescript
import { POPULAR_IDX_COMPANIES, IdxCompany } from '@/data/popularIdxCompanies';

export const POPULAR_PICKS = POPULAR_IDX_COMPANIES.filter((c) => c.popular);

export function searchCompanies(query: string, limit = 8): IdxCompany[] {
  const cleanQuery = query.trim().toLowerCase();

  // Empty query → show curated popular picks only (not arbitrary array slice)
  if (!cleanQuery) {
    return POPULAR_PICKS.slice(0, limit);
  }

  const queryWords = cleanQuery.split(/\s+/).filter(Boolean);

  const matched = POPULAR_IDX_COMPANIES.filter((company) => {
    const symbolLower = company.symbol.toLowerCase();
    const nameLower = company.name.toLowerCase();

    // 1. Symbol starts with or contains query (highest priority)
    if (symbolLower.startsWith(cleanQuery) || symbolLower.includes(cleanQuery)) {
      return true;
    }

    // 2. Every typed word must appear somewhere in the name or symbol
    return queryWords.every((word) => nameLower.includes(word) || symbolLower.includes(word));
  });

  // Sort: exact symbol match → symbol prefix match → rest (preserves dataset order within tiers)
  matched.sort((a, b) => {
    const aSym = a.symbol.toLowerCase();
    const bSym = b.symbol.toLowerCase();
    if (aSym === cleanQuery) return -1;
    if (bSym === cleanQuery) return 1;
    if (aSym.startsWith(cleanQuery) && !bSym.startsWith(cleanQuery)) return -1;
    if (!aSym.startsWith(cleanQuery) && bSym.startsWith(cleanQuery)) return 1;
    return 0; // preserves original array (liquidity-ordered) position within each tier
  });

  return matched.slice(0, limit);
}
```

---

### C. Reusable `CompanyCombobox` Component (`src/components/ui/CompanyCombobox.tsx`)

#### Props Interface
```typescript
interface CompanyComboboxProps {
  value: string;                    // Current committed symbol value (e.g. "BBCA")
  onChange: (symbol: string) => void; // Called on selection or freeform Enter commit
  onOpenScreener?: () => void;      // Optional: called when user clicks AI Screener fallback CTA
  placeholder?: string;
  disabled?: boolean;
}
```

#### `onOpenScreener` Wiring (Integration Contract)
`onOpenScreener` is an **optional escape hatch prop**. The caller (`EditNodeModal`) is responsible for defining what happens — it should:
1. Close the `EditNodeModal` (call `onClose()`).
2. Switch the node's type/mode to `screener` OR open the Quick-Add Popover pre-set to add a `screener` node.

This keeps `CompanyCombobox` fully decoupled — it just calls the prop if provided, and the parent decides the navigation.

In `EditNodeModal`, the wiring will look like:
```tsx
<CompanyCombobox
  value={config.symbol}
  onChange={(sym) => setConfig({ ...config, symbol: sym })}
  onOpenScreener={() => {
    onClose();  // close the modal
    // dispatch an event or call a canvas-level handler to open screener creation
  }}
/>
```

#### Key UX & Ergonomics
1. **On focus with empty value**: Dropdown opens showing `POPULAR_PICKS` labeled as *"Popular stocks"*.
2. **On focus with existing value**: Dropdown opens pre-filtered to current value so user can see context and change it.
3. **Keyboard Accessible**:
   - `ArrowDown` / `ArrowUp` to navigate results.
   - `Enter` to commit highlighted result (or commit freeform typed value if no result highlighted).
   - `Escape` to close dropdown without changing value.
4. **Click outside**: Closes dropdown, commits the current input value if it is a valid symbol (≥ 1 char).
5. **Single-Surface Dropdown**: 2px flat border matching active theme, zero drop shadows.
6. **Freeform Typing**: Users can type any arbitrary ticker (e.g. a newly listed IPO) and press `Enter` — it commits as-is, uppercased.
7. **AI Screener Fallback**: When search returns 0 results, renders:
   > *"No popular company found for 'XYZ'. Can't find your ticker? [✨ Use AI Screener →]*

---

### D. Integration with `EditNodeModal.tsx`

1. **Watcher Node (Single Stock Mode)**: Replace the plain `<input placeholder="e.g. BBCA, BBRI">` (line ~161–167) with `<CompanyCombobox>`.
2. **Action Node (Fundamental Report Mode)**: Replace the `targetSymbol` plain input with `<CompanyCombobox>` for brief generation.
3. **`onOpenScreener` handler**: Defined in `EditNodeModal` and passed to `CompanyCombobox`. Closes the modal and triggers Screener node creation flow via existing canvas state handlers.

---

## 4. Theme & Design System Alignment

| Theme | Input & Dropdown Styling |
|---|---|
| **Light** | `border-slate-200 bg-white text-slate-900`, hover `bg-slate-100` |
| **Mono** | `border-[#D8D4CA] bg-[#FCFBF9] text-[#242321]`, hover `bg-[#EFECE4]` |
| **Dark** | `border-[#282A36] bg-[#14151B] text-[#E2E4E9]`, hover `bg-[#1E202A]` |
| **Custom** | Uses `var(--custom-ui-bg)`, `var(--custom-border-color)`, `var(--custom-ui-text)` |

---

## 5. Implementation Steps

1. **Step 1: Create Curated Dataset**
   - Create `src/data/popularIdxCompanies.ts` with ~180 popular IDX tickers, full legal names, and `popular` flags on ~12 top picks. Order the array by descending market relevance (LQ45 first).
2. **Step 2: Create Search Matcher**
   - Create `src/lib/search/companySearch.ts` with `POPULAR_PICKS` export and `searchCompanies()` function — prefix & word token matching, correct empty-query behavior.
3. **Step 3: Build `CompanyCombobox.tsx`**
   - Implement input field, focus/blur behavior, keyboard navigation (`ArrowUp`/`ArrowDown`/`Enter`/`Esc`), click-outside handler, freeform commit, and AI screener fallback CTA. Fully theme-aware.
4. **Step 4: Integrate into `EditNodeModal.tsx`**
   - Replace raw symbol inputs in Watcher (single stock mode) and Action (fundamental report) editors. Wire `onOpenScreener` to close modal + trigger screener creation.
5. **Step 5: Verify & Polish**
   - Verify keyboard navigation, fast typing, empty-focus popular picks display, fallback trigger, freeform IPO ticker commit, and theme switches across Light, Mono, Dark, and Custom modes.
