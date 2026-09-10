# Implementation Plan: 3-Mode Theme Switcher (Light / Calm Mono / Soft Dark)

## 1. Design Mindset & Philosophy
The theme switcher allows users to transition from the default energetic, colorful FigJam style into **calmer, lower-fatigue, and easy-on-the-eyes** analytical environments:

1. **Light Mode (Default)**: Full multi-colored FigJam style palette (mint, yellow, pink, blue, purple, emerald, rose).
2. **Mono Mode (Calm Warm-Paper Monochrome)**:
   - **Tone**: Warm-paper / bookish aesthetic (warm stone / parchment gray instead of blinding pure white `#FFFFFF` or stark `#000000`).
   - **Backgrounds**: Soft warm parchment gray (`#F4F3EF` / `#ECEAE4`), cards on warm white (`#FCFBF9`), subtle graphite borders (`#D3D0C7` / `#B8B4A8`).
   - **Accent**: Soft reserved Scriffle Blue (`#1D4ED8` / `#2563EB`) strictly for functional connections and key badges.
3. **Dark Mode (Soft Matte Monochrome Dark)**:
   - **Tone**: Relaxed, low-glare darkroom aesthetic. **NOT harsh pure white on pitch black.**
   - **Backgrounds**: Deep charcoal/matte graphite (`#0F1014` / `#16171D`), cards on `#1C1D24`.
   - **Borders**: Subdued, low-contrast dark slate/zinc borders (`#2B2D37` / `#363845`). White is strictly reserved for primary focal text/values, not blinding outlines.
   - **Typography**: Soft silver-gray (`#E2E4E9` for headings, `#9CA0AC` for secondary labels). Zero rainbow gradients or glowing neon.

---

## 2. Updated Color Matrix & Tokens

| Element | 1. Light (Default) | 2. Mono (Warm-Paper Gray) | 3. Dark (Soft Matte Charcoal) |
|---|---|---|---|
| **Canvas Background** | `#F8F9FC` (Dot grid `#CBD5E1`) | `#F4F3EF` (Dot grid `#D1CEC4`) | `#0F1014` (Dot grid `#252730`) |
| **Panels & Navbars** | `bg-white border-slate-200` | `#ECEAE4 border-[#D8D4CA]` | `#14151B border-[#252730]` |
| **Cards & Nodes** | Colorful fills (mint, pink, yellow) | `#FCFBF9 border-[#D1CEC4] text-[#282725]` | `#1A1B22 border-[#2C2E3A] text-[#E2E4E9]` |
| **Card Borders (Idle)** | `border-slate-300` | Warm graphite `#D1CEC4` (soft outline) | Low-contrast charcoal `#2C2E3A` |
| **Primary Accent** | `#0050FF` | Reserved Blue `#1D4ED8` | Subtle Off-White / Steel Blue `#8E95A5` |
| **Connectors / Edges** | `#0050FF` | `#1D4ED8` (or soft graphite) | `#5A5E6F` (highlight: `#A8ACB8`) |
| **Text Primary** | `#0F172A` | Deep Charcoal `#242321` | Soft Off-White `#E2E4E9` |
| **Text Muted** | `#64748B` | Warm Muted Stone `#78756D` | Subdued Gray `#8E919E` |
| **Flat Tape** | Semi-translucent white | Warm-tinted tape `#E8E5DC border-[#C8C4B8]` | Charcoal tape `#282A35 border-[#3A3C4B]` |

---

## 3. Component Refinement Plan

1. **`globals.css` Theme Tokens**:
   - Redefine `[data-theme="mono"]` to warm-paper tones (`#F4F3EF` canvas, `#ECEAE4` sidebars, `#242321` text).
   - Redefine `[data-theme="dark"]` to soft matte charcoal tones (`#0F1014` canvas, `#14151B` sidebars, `#2C2E3A` borders, `#E2E4E9` text).
2. **Node Components (`WatcherNode`, `ConditionNode`, `NoteNode`, etc.)**:
   - Remove stark white borders in Dark mode; use low-contrast `#2C2E3A` / `#363845` borders instead.
   - In Mono mode, use warm parchment card surfaces (`#FCFBF9`) with soft warm graphite borders.
3. **`MarketCanvas.tsx`**:
   - Set canvas backgrounds to `#F4F3EF` (mono) and `#0F1014` (dark).
   - Set connector edge colors to `#1D4ED8` (mono) and `#5A5E6F` / `#A8ACB8` (dark).
   - Set MiniMap and controls to match the warm-paper and soft matte themes.
4. **`SimulationBar.tsx` & `ActivityFeed.tsx`**:
   - Ensure cards and buttons match the calming background palettes with gentle contrast.
