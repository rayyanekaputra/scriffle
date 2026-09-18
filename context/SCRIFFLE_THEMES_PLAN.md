# 🎨 Implementation Plan: `.scrifflemes` Custom Theme Engine

> **Document Status**: Draft / Ready for Implementation  
> **Target Audience**: Financial researchers, quantitative analysts, and users wanting terminal-inspired or custom branding aesthetics.  
> **Inspiration**: Kitty / Alacritty `.conf` file architecture + VS Code Theme JSON simplicity.

---

## 📌 1. Executive Summary & Design Philosophy

While Scriffle provides three built-in modes (**Light** FigJam, **Mono** Warm-Paper, and **Soft Dark**), financial analysts and quants frequently spend long hours in specialized terminal environments (Bloomberg Terminal, Gruvbox, Nord, Solarized, Tokyo Night). 

The **`.scrifflemes` Theme Engine** introduces a simple, human-readable plain-text configuration format (`.scrifflemes` / `.conf` style) that allows anyone to create, customize, import, export, and drag-and-drop custom visual colorways onto Scriffle—**with zero CSS or web-development knowledge required**.

```
┌─────────────────────────────────────────────────────────────┐
│                   themes/bloomberg.scrifflemes              │
│  [metadata]                                                 │
│  name = "Bloomberg Terminal"                                │
│  author = "rayyanekaputra"                                  │
│                                                             │
│  [canvas]                                                   │
│  background = #121212          grid_dot = #2A2A2A           │
│                                                             │
│  [ui]                                                       │
│  primary = #FF8C00             surface = #1E1E1E            │
│  border = #383838              text = #FF9E00               │
│                                                             │
│  [nodes]                                                    │
│  watcher = #00C853             condition = #FFAB00          │
│  alert = #FF3D00               screener = #FF8C00           │
│  note_default = #2C2C24                                     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│           Lightweight Parser (themeParser.ts)               │
│        Deserializes INI ➔ Typed ScriffleTheme Object        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│          ThemeContext + CSS Variables Dynamic Injector      │
│   Injects `:root[data-theme="custom"] { --scriffle-... }`   │
│   Instant, zero-rebuild canvas theme switching & persist    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📐 2. The `.scrifflemes` File Specification

The format is a clean, standard INI/TOML-style key-value configuration. Lines starting with `#` or `;` are treated as comments.

### 2.1 Schema Definition (`themes/bloomberg.scrifflemes`)

```ini
# Scriffle Theme Configuration
# Format: INI / Conf (Alacritty / Kitty inspired)

[metadata]
name = "Bloomberg Terminal"
author = "Scriffle Core"
version = "1.0.0"
mode_base = "dark"              # Base behavior: "dark" or "light" (for contrast calculation)

[canvas]
background = #121212            # Main canvas background
grid_dot = #2A2A2A              # Background dot grid color
selection_box = #FF8C00         # Multi-selection marquee box outline
selection_box_fill = #FF8C0018  # Multi-selection marquee box fill (with alpha)

[ui]
primary = #FF8C00               # Primary accent color (active states, focus rings)
surface = #1A1A1A               # Toolbar, Control Panel, and modal background
surface_muted = #242424         # Secondary button and chip surfaces
border = #333333                # Global UI container border
border_active = #FF8C00         # Focused border outline
text = #FF9E00                  # Primary text color (Amber)
text_muted = #B07200            # Subdued helper / timestamp text
tape = #262014                  # Sticky note tape sticker fill

[nodes]
surface_card = #181818          # Default node background fill
border_card = #2E2E2E           # Default card border outline
watcher = #00C853               # Watcher node badge & accent
condition = #FFAB00             # Condition node badge & accent
alert = #FF3D00                 # Alert node badge & accent
screener = #FF8C00              # Screener node badge & accent
action = #D500F9                # Action node badge & accent
note_default = #222018          # Default sticky note fill
text_default = #FF9E00          # Free-text node text color

[edges]
default = #734800               # Connector wire idle color
active = #FF8C00                # Connector wire pulse/flowing signal
selected = #FFD600              # Selected connector wire highlight
```

---

## 🏗️ 3. Architecture & Core Components

### 3.1 TypeScript Type Contract (`src/types/theme.ts`)

```typescript
export interface ScriffleThemeMetadata {
  name: string;
  author?: string;
  version?: string;
  mode_base: 'light' | 'dark';
}

export interface ScriffleThemeCanvas {
  background: string;
  grid_dot: string;
  selection_box: string;
  selection_box_fill: string;
}

export interface ScriffleThemeUI {
  primary: string;
  surface: string;
  surface_muted: string;
  border: string;
  border_active: string;
  text: string;
  text_muted: string;
  tape: string;
}

export interface ScriffleThemeNodes {
  surface_card: string;
  border_card: string;
  watcher: string;
  condition: string;
  alert: string;
  screener: string;
  action: string;
  note_default: string;
  text_default: string;
}

export interface ScriffleThemeEdges {
  default: string;
  active: string;
  selected: string;
}

export interface ScriffleTheme {
  id: string; // generated slug, e.g. "bloomberg-terminal"
  isBuiltin?: boolean;
  metadata: ScriffleThemeMetadata;
  canvas: ScriffleThemeCanvas;
  ui: ScriffleThemeUI;
  nodes: ScriffleThemeNodes;
  edges: ScriffleThemeEdges;
}
```

---

### 3.2 Theme Parser & Serializer (`src/lib/themeParser.ts`)

A lightweight pure-TypeScript parser (zero heavy external dependencies):
1. **`parseScriffleTheme(rawText: string, fallbackId?: string): ScriffleTheme`**:
   - Parses sections (`[canvas]`, `[ui]`, etc.) and key-value pairs (`key = value`).
   - Strips comments (`#`, `;`) and trims whitespace.
   - Validates hex/color codes (3, 6, or 8 digits with `#` or CSS color strings).
   - Falls back gracefully to default dark/light values for missing keys.
2. **`serializeScriffleTheme(theme: ScriffleTheme): string`**:
   - Serializes a `ScriffleTheme` object back into a clean `.scrifflemes` formatted string.
3. **`themeToCssVariables(theme: ScriffleTheme): Record<string, string>`**:
   - Maps theme properties to CSS variables (`--canvas-bg`, `--ui-primary`, etc.).

---

### 3.3 Dynamic CSS Variable Integration (`src/app/globals.css`)

CSS variable bridge under `[data-theme="custom"]`:

```css
:root[data-theme="custom"] {
  --canvas-bg: var(--custom-canvas-bg, #121212);
  --canvas-dot: var(--custom-canvas-dot, #2A2A2A);
  --ui-primary: var(--custom-ui-primary, #FF8C00);
  --ui-surface: var(--custom-ui-surface, #1A1A1A);
  --ui-surface-muted: var(--custom-ui-surface-muted, #242424);
  --ui-border: var(--custom-ui-border, #333333);
  --ui-text: var(--custom-ui-text, #FF9E00);
  --ui-text-muted: var(--custom-ui-text-muted, #B07200);
  --ui-tape: var(--custom-ui-tape, #262014);
  --node-card-bg: var(--custom-node-card-bg, #181818);
  --node-card-border: var(--custom-node-card-border, #2E2E2E);
  --edge-default: var(--custom-edge-default, #734800);
  --edge-selected: var(--custom-edge-selected, #FFD600);
}

[data-theme="custom"] body {
  background-color: var(--canvas-bg);
  color: var(--ui-text);
}

[data-theme="custom"] .flat-tape {
  background-color: var(--ui-tape);
  border-color: var(--ui-border);
}
```

---

### 3.4 Extended `ThemeContext.tsx`

Upgrade [`ThemeContext.tsx`](file:///home/abzolute/Projects/hackathon/src/context/ThemeContext.tsx) to support:
- `themeMode`: `'light' | 'mono' | 'dark' | 'custom'`
- `activeCustomTheme`: `ScriffleTheme | null`
- `customThemes`: Array of loaded custom themes (bundled presets + user saved)
- `loadThemeFromFile(file: File | string): Promise<ScriffleTheme>`
- `exportActiveTheme(): void` (downloads `theme-name.scrifflemes`)
- `deleteCustomTheme(themeId: string): void`
- Applies dynamic style tags or `document.documentElement.style.setProperty('--custom-...', val)` when in custom mode.

---

## 🎨 4. Starter Presets Bundle (`public/themes/` & `themes/`)

We will ship with 5 starter themes out of the box:

1. **`bloomberg.scrifflemes`**: Classic financial terminal (Pitch Black `#121212`, Amber `#FF9E00`, Emerald `#00C853`).
2. **`nord.scrifflemes`**: Arctic, north-bluish palette (Polar Night `#2E3440`, Frost `#88C0D0`, Snow Storm `#ECEFF4`).
3. **`gruvbox.scrifflemes`**: Retro warm groove (Dark `#282828`, Warm Sand `#EBDBB2`, Gruvbox Orange `#FE8019`).
4. **`solarized_dark.scrifflemes`**: Precision dark palette (Base03 `#002B36`, Cyan `#2AA198`, Yellow `#B58900`).
5. **`tokyo_night.scrifflemes`**: Modern cyberpunk neon (Night `#1A1B26`, Neon Purple `#BB9AF7`, Cyan `#7AA2F7`).

---

## 🖥️ 5. UI & User Interaction Workflows

### 5.1 Theme Switcher Dropdown & Modal (`ThemeSelectorModal.tsx` & `SimulationBar.tsx`)
* The Control Panel and Theme Switcher will show:
  * **Built-in Modes**: ☀️ Light, 📜 Mono (Warm-Paper), 🌙 Dark.
  * **Preset Themes**: ⚡ Bloomberg Amber, ❄️ Nord, 📻 Gruvbox, 🌃 Tokyo Night.
  * **Custom / Uploaded Themes**: Any user-imported themes with author metadata and a delete button.
  * **Action Buttons**: 
    - `📥 Import .scrifflemes` (opens file selector).
    - `📤 Export Current Theme` (downloads active config).
    - `✨ Create New Theme` (opens simple color swatch editor).

### 5.2 Drag & Drop onto Canvas (`MarketCanvas.tsx`)
* Dropping any `.scrifflemes` or `.conf` file directly onto the canvas:
  1. Detects file extension.
  2. Parses theme with `parseScriffleTheme`.
  3. Applies the theme immediately.
  4. Stores the theme in browser `localStorage` / custom themes registry.
  5. Emits an Activity Feed log: *"🎨 Custom theme loaded: Bloomberg Terminal by Scriffle Core"*.

---

## 🧪 6. Verification & Testing Plan

### 6.1 Unit Tests (`src/__tests__/unit/themeEngine.test.ts`)
1. **Parser Tests**:
   - Parses full valid `.scrifflemes` string into complete `ScriffleTheme` object.
   - Handles comments (`#`, `;`), inline comments, leading/trailing whitespace.
   - Gracefully falls back for omitted properties (e.g. missing `selection_box_fill`).
   - Rejects or sanitizes invalid hex strings.
2. **Serializer Tests**:
   - Serializes `ScriffleTheme` object and re-parses it (round-trip idempotency).
3. **CSS Variable Mapper Tests**:
   - Converts theme structure into correct `--custom-*` CSS variable key-values.

### 6.2 Visual & Manual Verification
- Verify React Flow canvas background, dot grid, and mini-map update dynamically without reloading.
- Verify node cards (`Watcher`, `Condition`, `Screener`, `Note`, `Action`) adopt custom borders, text, and badge accents.
- Verify connector paths (`.react-flow__edge-path`) adapt to custom edge colors.
- Verify export downloads valid `.scrifflemes` file that can be dragged into another browser session.

---

## 📋 7. Task Breakdown & Implementation Steps

| Step | Component / File | Description |
|:---|:---|:---|
| **Phase 1** | `src/types/theme.ts` | Define `ScriffleTheme` TypeScript schemas and defaults. |
| **Phase 2** | `src/lib/themeParser.ts` | Build robust parser, serializer, and CSS variable mapper. |
| **Phase 3** | `src/__tests__/unit/themeEngine.test.ts` | Add full unit test suite covering parsing, serialization, and fallback. |
| **Phase 4** | `src/app/globals.css` | Add `[data-theme="custom"]` CSS variable mappings. |
| **Phase 5** | `src/context/ThemeContext.tsx` | Extend context for custom themes, local persistence, and CSS injection. |
| **Phase 6** | `themes/*.scrifflemes` | Create bundled presets (`bloomberg`, `nord`, `gruvbox`, `tokyo_night`). |
| **Phase 7** | `src/components/canvas/controls/ThemeModal.tsx` | Build theme selector with presets preview, import/export, and live swatches. |
| **Phase 8** | `src/components/canvas/MarketCanvas.tsx` | Add `.scrifflemes` drag-and-drop file handler and dynamic React Flow edge/grid styling. |
