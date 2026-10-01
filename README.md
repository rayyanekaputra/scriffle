# Scriffle

A visual research workspace for Indonesian stocks, powered by the
[Sectors.app API](https://sectors.app).

> Too many platforms to switch between for research. Scriffle lets you automate data fetching
> and brainstorm visually — all in one canvas.

Scriffle connects to the [Sectors.app API](https://sectors.app) to pull live IDX price data,
run AI-powered stock screener queries, and generate institutional research briefs on demand.
Get your free API key at [sectors.app](https://sectors.app) and paste it into the top toolbar
when you open the app.

If you don't have a key yet, Scriffle runs on realistic simulated IDX data so you can explore
the canvas, load example templates, and follow the guided tour without waiting.

Built for the **Sectors 2026 Hackathon** by **thelast10years**
([@rayyanekaputra](https://github.com/rayyanekaputra) & [@artyaaryatama](https://github.com/artyaaryatama)).
The API key is held in memory for your session only and is never saved to disk.

---

[How It Works](#how-it-works) · [Quickstart](#quickstart) · [Nodes](#the-nodes) · [Example Templates](#example-templates) · [Shortcuts](#keyboard-shortcuts) · [For Developers](./TECHNICAL_GUIDE.md)

---

## How It Works

Scriffle is a canvas of connected cards. Each card has a job. Together, they form a live
automation pipeline that runs in the background while you think, present, or do other work.

**1. Watch** — Drop a Watcher card onto the canvas. Point it at any Indonesian stock (e.g. BBCA)
or ask it to track today's top gainers across the entire IDX. It polls live price data from
Sectors on a timer you set.

**2. Filter** — Connect a Condition card and write a plain rule, like *"if the price moved more
than 3.5% today and volume was above average"*. The canvas routes data down the True path or
the False path depending on the result.

**3. Act** — Connect the output to a Sticky Note, a Discord Alert, or a Research Action.
Scriffle executes automatically — updating your notes, notifying your team, or generating a
full fundamental research brief from Sectors — without you clicking anything.

---

## Quickstart

Scriffle runs on [Bun](https://bun.sh) (recommended) or Node.js (v18+). Setting it up takes three quick terminal commands — dependencies are installed, a local SQLite database is provisioned and seeded, and the app is built and started on your machine.

### 1. Clone and install dependencies

```bash
git clone https://github.com/rayyanekaputra/scriffle.git
cd scriffle
bun install
```

### 2. Set up the local database

```bash
bunx prisma db push
bun run prisma/seed.ts
```

*(This creates your local SQLite database at `prisma/dev.db` and loads the starter IDX workspace.)*

### 3. Build and start Scriffle

```bash
bun run build
bun run start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Once the app opens, paste your Sectors API key into the toolbar at the top of the screen to enable live market data. Get a free key at [sectors.app](https://sectors.app). Without a key, Scriffle runs seamlessly on simulated data so you can explore the interface before going live.

---

### Using npm / Node.js instead?

If you prefer npm over Bun:

```bash
npm install
npx prisma db push
npx tsx prisma/seed.ts
npm run build
npm run start
```

---

### Starting a fresh canvas for a presentation or demo

```bash
bun run start --start-fresh
```

*(Or `bun run dev --start-fresh` if running the dev server.)*

This creates a clean new canvas without deleting any of your previous projects. It also resets the onboarding tour and guided sandbox missions back to the beginning.

---

## The Nodes

Scriffle has ten types of cards. Six run your automation logic. Four are for freeform thinking
and annotation.

### Automation cards

| Card | What it does | Example |
|---|---|---|
| AI Screener | Searches all Indonesian listed stocks using a plain English question, via the Sectors API | *"Top 5 banks by market cap"* or *"Coal miners with dividend yield above 8%"* |
| Watcher | Tracks a stock's live price from Sectors, or ranks today's top gainers and losers | Monitor BBCA tick by tick, or show the 5 biggest movers since market open |
| Condition | Routes data down a True or False path based on a rule you write | *If the price moved more than 3.5% and volume was above 1 million, take the True path* |
| Sticky Note | Updates its own text automatically when triggered, filling in live values | Writes *"BBCA surged 4.2% at 10:15 AM"* the moment the condition fires |
| Alert | Sends a notification to your browser or a Discord channel | Posts a formatted market card to your team's Discord server when a breakout triggers |
| Action | Creates new cards or generates a Sectors fundamental brief — automatically, on trigger | Fetches a full research report for a breakout stock and saves it to your reports folder |

### Annotation and brainstorming cards

| Card | What it does |
|---|---|
| Text block | Freeform notes with heading styles, bold, italic, and colour highlight markers |
| Sticker | Emoji badges and label tags — useful for marking up sections of your canvas |
| Image | Drop in screenshots or chart images. Paste directly from clipboard with Ctrl+V |
| File | Attach a document or research brief. Preview it in the browser or open its folder |

---

## Example Templates

The fastest way to get started is to load one of these ready-made canvases. Open the
Control Panel, click **Open File**, and select any template below — or drag and drop the file
directly onto the canvas.

| Template | What it shows |
|---|---|
| [IDX Big 3 Banking Comparison](./presets/banking_sector_watcher.scriffle) | Tracks BBCA, BBRI, and BMRI side by side using live Sectors data, with breakout condition routing |
| [Bluechip Rotation & Auto-Discovery Engine](./presets/idx_bluechip_rotation_engine.scriffle) | Watches capital movement across IDX blue chips and auto-spawns tracking pipelines for breakout tickers |
| [BBCA Momentum Breakout & Mutator Loop](./presets/idx_momentum_breakout.scriffle) | Flags high-volume price moves from Sectors and automatically fires a Discord notification |
| [Macro & Alpha Intelligence Dashboard](./presets/idx_macro_alpha_intelligence.scriffle) | Multi-branch canvas combining macro signals with automatic Sectors fundamental research generation |
| [Omnibus Alpha Command Center](./presets/idx_omnibus_alpha_command_center.scriffle) | A full six-sector, multi-signal trading desk layout demonstrating all ten card types working together |

---

## Keyboard Shortcuts

Press `?` anywhere on the canvas to open the full interactive shortcuts guide.

| Key | Action |
|---|---|
| `V` / `H` | Switch between Select and Pan tools |
| `T` | Drop a Text block at the mouse cursor |
| `Ctrl+K` | Spotlight search — finds any card and flies the camera to it |
| `Ctrl+G` / `Ctrl+Shift+G` | Group / ungroup selected cards |
| `Ctrl+Shift+T` | Tidy up — redistributes overlapping cards automatically |
| `Ctrl+C` / `Ctrl+V` | Copy and paste cards (connectors are preserved) |
| `Ctrl+D` | Duplicate selection |
| `Ctrl+Z` / `Ctrl+Shift+Z` | Undo / Redo |
| `Shift+1` | Fit all cards to screen |
| `?` | Open the shortcuts guide |

---

## For Developers

Full technical documentation is in [TECHNICAL_GUIDE.md](./TECHNICAL_GUIDE.md). It covers
the system architecture, REST API reference, database schema, the `.scriffle` file format,
DSL rule syntax, the automated test suite, and a step-by-step guide for adding new node types.
