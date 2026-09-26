# 📋 Implementation Plan: Fix StickerNode `TypeError: Cannot read properties of undefined (reading 'bg')`

> **Feature Type:** Bug Fix & Resilience Hardening  
> **Status:** Proposed Implementation Plan  
> **Root Cause:** In `freshProjectCreator.ts`, sticker nodes were seeded with `color: 'mint'`. However, `StickerNode.tsx`'s palette type `StickerColor` only defined `['green', 'red', 'blue', 'amber', 'purple', 'teal', 'slate']`. Because `COLOR_STYLES['mint']` was `undefined`, accessing `cs.bg` on line 117 threw a runtime `TypeError`, crashing the React render tree.

---

## 1. Problem Analysis & Root Cause

1. **`freshProjectCreator.ts` seeded `'mint'` color**:
   - `freshProjectCreator.ts` lines 39 & 180 seeded `{ emoji: '📈', label: 'Top Pick', color: 'mint' }` (borrowed from sticky note color vocabulary).
2. **`StickerNode.tsx` lacked fallback safety**:
   - `StickerNode.tsx` line 111 performed direct unchecked lookup: `const cs = COLOR_STYLES[color]`.
   - When `color` is `'mint'` (or any legacy/custom color not in the strict 7-key dictionary), `cs` is `undefined`.
   - Line 117 attempted `${cs.bg} ${cs.border} ${cs.text}`, causing `Uncaught TypeError: Cannot read properties of undefined (reading 'bg')`.
3. **Missing Color Aliasing**:
   - Sticky notes and other components in Scriffle use `'mint'` and `'pink'`. Stickers should either alias these gracefully (`mint` $\rightarrow$ `green`, `pink` $\rightarrow$ `red`) or include `mint` and `pink` in the palette with fallback to `COLOR_STYLES.blue` if an unknown color is encountered.

---

## 2. Proposed Solution

### A. Harden `StickerNode.tsx` with Defensive Color Resolution & Aliases
1. **Add Safe Fallback**:
   ```typescript
   // Ensure cs always resolves to a valid style object, never undefined
   const validColor = (COLOR_STYLES[color] ? color : COLOR_ALIASES[color] || 'blue') as StickerColor;
   const cs = COLOR_STYLES[validColor] || COLOR_STYLES.blue;
   ```
2. **Add Palette Aliases (`COLOR_ALIASES`)**:
   - `'mint'` $\rightarrow$ `'green'`
   - `'emerald'` $\rightarrow$ `'green'`
   - `'pink'` $\rightarrow$ `'red'`
   - `'rose'` $\rightarrow$ `'red'`
   - `'indigo'` $\rightarrow$ `'blue'`
   - `'yellow'` $\rightarrow$ `'amber'`
3. **Defensive Initial State**:
   - Sanitize `initColor` in `useState` and upstream `useEffect` so `color` state is guaranteed to be a valid `StickerColor`.

### B. Fix `freshProjectCreator.ts` and `seed.ts`
- Use valid canonical `StickerColor` values:
  - Top Pick Sticker $\rightarrow$ `color: 'green'`
  - Rocket Breakout Sticker $\rightarrow$ `color: 'blue'`

---

## 3. Step-by-Step Implementation Tasks

| # | File | Action | Details |
|---|---|---|---|
| **1** | `src/components/canvas/nodes/StickerNode.tsx` | Modify | Add `COLOR_ALIASES`, safe `COLOR_STYLES[validColor] \|\| COLOR_STYLES.blue` fallback, and defensive color resolution in `initColor` and `useEffect`. |
| **2** | `src/lib/freshProjectCreator.ts` | Modify | Update seeded sticker colors to canonical `'green'` and `'blue'`. |
| **3** | `src/__tests__/unit/stickerNode.test.ts` | Create | Unit test suite verifying that unknown/legacy colors (like `'mint'`, `'pink'`, `undefined`, `null`, `'invalid-color'`) resolve gracefully to valid CSS classes without throwing runtime exceptions. |

---

## 4. Verification & Validation Plan

1. **Unit Test Execution**:
   - Run `bun test` to verify all unit tests pass including the new sticker color resilience tests.
2. **`--start-fresh` Execution Verification**:
   - Run `bun run dev --start-fresh`.
   - Open browser at `http://localhost:3000`.
   - Verify the canvas renders immediately without any `TypeError` in browser console.
   - Verify both sticker badges (📈 Top Pick & 🚀 Breakout) render with correct theme-aware green and blue styling.
3. **Build Check**:
   - Run `bun run build` to confirm zero TypeScript or Turbopack errors.
