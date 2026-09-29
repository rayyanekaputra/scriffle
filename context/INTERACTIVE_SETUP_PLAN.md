# 🎨 Implementation Plan: Zero-Friction Interactive Setup for Scriffle (Bash & Windows)

## 📌 What Is This?

When someone clones Scriffle for the first time, they currently need to run a bunch of technical commands manually — installing packages, setting up a database, and figuring out how to start the app. That's a bad first experience.

This plan creates a **single setup script** that handles everything automatically, in a friendly step-by-step interactive experience — like installing an app, not running terminal commands.

---

## 🧭 What the User Will Experience

When the user runs `./setup.sh` (Mac/Linux) or double-clicks `setup.bat` (Windows), they will see:

```
███████╗ ██████╗██████╗ ██╗███████╗███████╗██╗     ███████╗
██╔════╝██╔════╝██╔══██╗██║██╔════╝██╔════╝██║     ██╔════╝
███████╗██║     ██████╔╝██║█████╗  █████╗  ██║     █████╗  
╚════██║██║     ██╔══██╗██║██╔══╝  ██╔══╝  ██║     ██╔══╝  
███████║╚██████╗██║  ██║██║██║     ██║     ███████╗███████╗
╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝╚═╝     ╚═╝     ╚══════╝╚══════╝

  Visual Market Automation & Research Whiteboard
  ─────────────────────────────────────────────
  Welcome! Let's get Scriffle set up on your machine.
  This will only take a minute.
```

The installer then walks them through **4 short questions**, runs all the technical work silently in the background, and opens the app.

---

## 🪜 Step-by-Step Flow

### Step 1 — Choose Your Runtime
> *"A runtime is the engine that powers Scriffle on your computer."*

The installer checks what is already installed on the machine:

- If **Bun** is found → recommends it automatically (it's faster)
- If **Node.js** is found → offers it as an alternative
- If **neither** is found → explains what to install and links to the download page

**What the user sees:**
```
  ⚡ Choose a runtime to power Scriffle:

     [1]  Bun   — Recommended. Fast & modern. (Already installed ✓)
     [2]  Node.js / npm — Universal, widely supported.

  Enter 1 or 2 (default: 1 — press Enter to confirm):
```

> **Note:** If the user picks Bun but it isn't installed yet, the script offers to install it automatically with a single command (`curl -fsSL https://bun.sh/install | bash`) or lets them fall back to Node.js instead.

---

### Step 2 — Choose Your Starting Canvas
> *"How would you like Scriffle to look when it first opens?"*

**What the user sees:**
```
  🎨 How would you like to start?

     [1]  Full Demo Workspace  — Opens with a pre-built IDX research board
                                  showing watchers, conditions, and live alerts.
                                  Great for exploring what Scriffle can do.

     [2]  Clean Canvas         — Starts completely blank with a guided tutorial.
                                  Best if you want to build your own board from scratch.

  Enter 1 or 2 (default: 1 — press Enter to confirm):
```

---

### Step 3 — Automated Setup (Runs in Background)
The user doesn't touch anything during this step. The script handles everything:

```
  📦  Installing packages...                         ✓ Done
  🗄️   Setting up local database...                  ✓ Done
  🌱  Loading your starting workspace...             ✓ Done
```

**What happens under the hood (technical):**
1. `bun install` / `npm install` — installs all project dependencies
2. `bunx prisma generate` — generates the Prisma database client
3. `bunx prisma db push` — creates the SQLite database schema
4. Runs seed (`prisma/seed.ts`) for Demo mode, or `--start-fresh` for Clean Canvas mode

**Error handling:** If any step fails, the script prints a plain-English explanation (not a raw stack trace) and suggests a fix — e.g., *"The database couldn't be created. Try running the script again."*

---

### Step 4 — Done! Launch Scriffle
```
  ✅  Scriffle is ready!

  ─────────────────────────────────────────────────────────
  🚀  Opening Scriffle in your browser at:
       http://localhost:3000

  📌  To start Scriffle again later, run:
       bun run dev    ← for development
       bun run start  ← for production (after bun run build)
  ─────────────────────────────────────────────────────────

  Start Scriffle now? [Y/n]:
```

> **Important:** The setup script always launches in **development mode** (`bun run dev`) since this is a first-time setup. For running Scriffle in production later, users need to first run `bun run build`, then `bun run start`.

---

## 🔁 Re-Run Detection — "Already Set Up"

If a user accidentally runs `./setup.sh` or `setup.bat` again after Scriffle is already set up, the script should **not** repeat the full installation. Instead, it detects that everything is in place and shows a friendly reminder screen.

**What the script checks:**
- `node_modules/` folder exists (packages already installed)
- `prisma/dev.db` file exists (database already created)
- `.next/` folder exists (app already built)

If all three are present, skip the setup flow entirely and show this instead:

```
███████╗ ██████╗██████╗ ██╗███████╗███████╗██╗     ███████╗
██╔════╝██╔════╝██╔══██╗██║██╔════╝██╔════╝██║     ██╔════╝
███████╗██║     ██████╔╝██║█████╗  █████╗  ██║     █████╗  
╚════██║██║     ██╔══██╗██║██╔══╝  ██╔══╝  ██║     ██╔══╝  
███████║╚██████╗██║  ██║██║██║     ██║     ███████╗███████╗
╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝╚═╝     ╚═╝     ╚══════╝╚══════╝

  ✅  Scriffle is already set up on this machine!
  ─────────────────────────────────────────────────────────

  To run Scriffle, type one of these in your terminal:

    bun run start    ← Start the app  (recommended)
    bun run dev      ← Start in developer mode

  Then open your browser and go to:  http://localhost:3000

  ─────────────────────────────────────────────────────────
  Tip: If something feels broken, delete the prisma/dev.db
  file and run this setup script again to start fresh.
```

> **Why this matters:** Non-technical users may not know the difference between running setup and running the app. This guard prevents accidentally re-seeding the database or overwriting their canvas work.

---

## 📁 Files to Create / Update

| # | What | Where | Why |
|---|---|---|---|
| 1 | Interactive setup script for Mac & Linux | [`setup.sh`](file:///home/moke/Projects/scriffle/setup.sh) | The main installer for Unix-based systems |
| 2 | Interactive setup script for Windows | [`setup.ps1`](file:///home/moke/Projects/scriffle/setup.ps1) | Full-featured PowerShell installer with same UX |
| 3 | Double-click launcher for Windows | [`setup.bat`](file:///home/moke/Projects/scriffle/setup.bat) | Thin wrapper — opens PowerShell and runs `setup.ps1` |
| 4 | Update README quickstart section | [`README.md`](file:///home/moke/Projects/scriffle/README.md) | Replace the multi-step setup instructions with a single command |

---

## 🔒 Privacy & Security Notes

- **No API keys are stored anywhere.** Scriffle never writes your Sectors API key to disk, `.env` files, or the database. The key is entered in the browser and lives only in memory for that session. This is by design.
- The setup script does **not** touch your system beyond the project folder. It only installs npm/bun packages locally and creates a single SQLite file (`prisma/dev.db`) inside the project.

---

## 🧩 Node.js vs Bun — Scope Decision

To keep things simple and reliable, **Bun remains the primary and fully supported runtime.** Node.js support is offered as a convenience option for users who already have it installed, but:

- The setup script will **strongly recommend Bun** (it's faster and is what Scriffle was built and tested with)
- If Node.js is chosen, the script uses `npx tsx` to run TypeScript files
- `scripts/dev.ts` and `scripts/start.ts` will be tested to work under `npx tsx` — but Bun is the safe default
- If Node.js causes issues during setup, the script will say: *"We recommend switching to Bun for the best experience"* and offer to install it

---

## ✅ What This Does Not Cover

- Telegram bot integration (separate feature)
- Live API key entry during setup (intentional — API keys are session-only in the browser)
- Cloud deployment or Docker setup
