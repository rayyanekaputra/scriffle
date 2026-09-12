# ✍️ Implementation Plan: Miro × FigJam Free-Text Experience

This plan details the upgrade path to transform Scriffle's existing basic `TextNode` into a rich, tactile, and flexible free-text whiteboard tool matching the freedom and convenience of **FigJam** and **Miro**, while adhering strictly to Scriffle's flat outline design system.

---

## 🎯 1. Core Objectives & User Stories

1. **Instant Whiteboard Placement (`T` Shortcut)**:
   * Pressing `T` switches to Text mode, or clicking on the canvas immediately drops a text cursor and starts typing with auto-focus.
2. **Contextual Floating Formatting Toolbar**:
   * When a text element is selected or focused, a sleek floating toolbar appears directly above the card with:
     * **Typography Scale**: `Title (32px / 700)`, `Header (22px / 600)`, `Body (14px / 500)`, `Caption (11px / 400)`.
     * **Styling**: Bold (`B`), Italic (`I`), Strikethrough (`S`), Underline (`U`), Code/Pill (`<>`).
     * **Alignment**: Left, Center, Right.
     * **Lists**: Bullet points (`•`) and Numbered lists (`1.`).
     * **Highlighter & Text Color**: Pastel highlighter pens (Yellow, Mint, Coral, Lavender) and text color tokens.
3. **Container Modes**:
   * **Frameless Transparent** (default): Seamless text floating on the dotted grid.
   * **Callout Capsule / Banner**: Subtle tinted background with a 3px left border accent for highlight theses, disclaimers, or quotes.
4. **Auto-Fit & Interactive Resizing**:
   * Drag side `<NodeResizer />` handles to set fixed wrapping width with auto-expanding height.
   * Double-click border handle to toggle between auto-width and fixed-width.
5. **Markdown & Auto-Formatting Triggers**:
   * `# `, `## `, `### ` automatically sets Title/Header scale and clears prefix.
   * `- ` or `* ` automatically starts bulleted formatting.
   * `1. ` automatically starts numbered list formatting.

---

## 🏗️ 2. Data Contract & Schema (`src/types/canvas.ts`)

Enhance `TextConfig` to support full formatting and container attributes:

```typescript
export type TextFontSize = 'title' | 'header' | 'body' | 'caption';
export type TextAlignment = 'left' | 'center' | 'right';
export type TextContainerStyle = 'plain' | 'callout' | 'card';
export type TextHighlightColor = 'none' | 'yellow' | 'mint' | 'coral' | 'purple';

export interface TextConfig {
  text: string;
  fontSize?: TextFontSize | 'small' | 'medium' | 'large'; // Backwards-compatible
  align?: TextAlignment;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  highlight?: TextHighlightColor;
  containerStyle?: TextContainerStyle;
  textColor?: string;
  width?: number;
  height?: number;
}
```

---

## 🧩 3. Architectural Component Breakdown

```
src/components/canvas/
├── MarketCanvas.tsx           # 'T' hotkey listener, cursor position placement, tool modes
├── ContextMenu.tsx            # Context options for text (typography, container style, delete)
└── nodes/
    ├── TextNode.tsx           # Enhanced with NodeResizer, dynamic typography, list handlers
    └── text/
        └── TextFormatToolbar.tsx  # Floating contextual toolbar docked above the active text node
```

### Component Details

#### A. `TextFormatToolbar.tsx` (Floating Contextual Action Bar)
* Rendered conditionally above the `TextNode` when `selected` or `isFocused`.
* Positioned with `pointer-events-auto` at `-top-12 left-1/2 -translate-x-1/2`.
* Contains:
  1. **Scale Dropdown / Pills**: `T1 Title`, `T2 Header`, `T3 Body`, `T4 Caption`.
  2. **Format Toggles**: Bold (`mgc_bold_line`), Italic (`mgc_italic_line`), Underline (`mgc_underline_line`), Strikethrough (`mgc_strikethrough_line`).
  3. **Align Toggles**: Left (`mgc_align_left_line`), Center (`mgc_align_center_line`), Right (`mgc_align_right_line`).
  4. **Highlight Color Picker**: Quick circular dot palette for marker highlights (`#FEF08A`, `#A7F3D0`, `#FECDD3`, `#E9D5FF`).
  5. **Container Style Toggle**: Switch between `Plain` (transparent) and `Callout` (accent border box).

#### B. `TextNode.tsx` Enhancement
* Use `<NodeResizer />` (horizontal only or corner handles) to adjust text container width.
* Auto-expanding `<textarea>` (measuring `scrollHeight` on input) to prevent awkward vertical scrollbars unless constrained.
* Live Markdown prefix detection on `onChange`:
  * Detect `# ` → apply `fontSize: 'title'`, strip `# `.
  * Detect `## ` → apply `fontSize: 'header'`, strip `## `.
  * Detect `- ` → auto-prepend bullet `• ` and handle `Enter` key indentation continuation.
* Debounced auto-save (`PATCH /api/canvas/nodes/:id`) on blur or config changes.

#### C. `MarketCanvas.tsx` Integration
* Add `'t' | 'T'` keyboard shortcut:
  * When pressed (outside input fields), instantly places a new `TextNode` at the current mouse cursor coordinates and focuses the input.

---

## 🎨 4. Design System Compliance & Theming

| Element | Light Theme | Mono Theme (`#F4F3EF`) | Dark Theme (`#0F1014`) |
|---|---|---|---|
| **Floating Toolbar** | `bg-white border-2 border-slate-900 shadow-sm text-slate-800` | `bg-[#FCFBF9] border-2 border-[#242321] text-[#242321]` | `bg-[#181920] border-2 border-[#282A36] text-[#E2E4E9]` |
| **Title Font** | `text-2xl lg:text-3xl font-bold tracking-tight text-slate-900` | `text-2xl lg:text-3xl font-bold text-[#242321]` | `text-2xl lg:text-3xl font-bold text-white` |
| **Header Font** | `text-lg lg:text-xl font-bold text-slate-800` | `text-lg lg:text-xl font-bold text-[#242321]` | `text-lg lg:text-xl font-bold text-[#E2E4E9]` |
| **Body Font** | `text-sm font-medium text-slate-700` | `text-sm font-medium text-[#4A4741]` | `text-sm font-medium text-[#BAC0D0]` |
| **Caption Font** | `text-xs font-normal text-slate-500` | `text-xs font-normal text-[#78756D]` | `text-xs font-normal text-[#8C90A0]` |
| **Callout Container** | `bg-slate-50/80 border-l-4 border-l-[#0050FF] border-y border-r border-slate-200` | `bg-[#ECEAE4]/60 border-l-4 border-l-[#242321] border-y border-r border-[#D8D4CA]` | `bg-[#14151B]/80 border-l-4 border-l-[#6366F1] border-y border-r border-[#282A36]` |
| **Highlight Yellow** | `bg-[#FEF08A] text-amber-950 px-1 py-0.5 rounded-sm` | `bg-[#E5E0D0] text-[#242321] px-1 py-0.5 rounded-sm` | `bg-[#854D0E]/60 text-amber-200 px-1 py-0.5 rounded-sm` |
| **Highlight Mint** | `bg-[#A7F3D0] text-emerald-950 px-1 py-0.5 rounded-sm` | `bg-[#D1CEC4] text-[#242321] px-1 py-0.5 rounded-sm` | `bg-[#065F46]/60 text-emerald-200 px-1 py-0.5 rounded-sm` |

---

## 📋 5. Step-by-Step Implementation Steps

1. **Step 1: Update TypeScript Definitions (`src/types/canvas.ts`)**
   * Add `TextFontSize`, `TextAlignment`, `TextHighlightColor`, and `TextContainerStyle` to `TextConfig`.
2. **Step 2: Build `TextFormatToolbar.tsx` Component**
   * Create the floating toolbar with MingCute icons (`MingIcon`) for styling, scale, alignment, colors, and container modes.
3. **Step 3: Refactor `TextNode.tsx`**
   * Integrate `TextFormatToolbar`.
   * Add `<NodeResizer />` for width control with database persistence.
   * Implement auto-growing textarea and markdown formatting triggers (`#`, `-`, `1.`).
4. **Step 4: Update `MarketCanvas.tsx` & `NavToolbar.tsx`**
   * Bind `T` keyboard shortcut to place and focus text at mouse cursor.
   * Ensure click-away behavior cleanly commits text changes and closes toolbar.
5. **Step 5: Test & Validate**
   * Test keyboard shortcuts, undo/redo, `.scriffle` file export/import preservation of text properties, and multi-theme rendering across Light, Mono, and Dark.
