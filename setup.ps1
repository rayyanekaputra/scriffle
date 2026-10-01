# ==============================================================================
#  Scriffle — Interactive Setup and Onboarding Script (Windows PowerShell)
# ==============================================================================

# Require PowerShell 3+ (needed for [string]::IsNullOrWhiteSpace, -match regex, etc.)
if ($PSVersionTable.PSVersion.Major -lt 3) {
    Write-Error "Scriffle requires PowerShell 3 or later. Current version: $($PSVersionTable.PSVersion). Please upgrade at https://github.com/PowerShell/PowerShell"
    Exit 1
}

$ErrorActionPreference = "Stop"

function Print-Banner {
    Clear-Host
    Write-Host "███████╗ ██████╗██████╗ ██╗███████╗███████╗██╗     ███████╗" -ForegroundColor Cyan
    Write-Host "██╔════╝██╔════╝██╔══██╗██║██╔════╝██╔════╝██║     ██╔════╝" -ForegroundColor Cyan
    Write-Host "███████╗██║     ██████╔╝██║█████╗  █████╗  ██║     █████╗  " -ForegroundColor Cyan
    Write-Host "╚════██║██║     ██╔══██╗██║██╔══╝  ██╔══╝  ██║     ██╔══╝  " -ForegroundColor Cyan
    Write-Host "███████║╚██████╗██║  ██║██║██║     ██║     ███████╗███████╗" -ForegroundColor Cyan
    Write-Host "╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝╚═╝     ╚═╝     ╚══════╝╚══════╝" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Visual Market Automation and Research Whiteboard" -ForegroundColor White
    Write-Host "  ─────────────────────────────────────────────────────────" -ForegroundColor DarkGray
}

# ------------------------------------------------------------------------------
# Re-Run Detection: Check if Scriffle is already set up
# ------------------------------------------------------------------------------
if ((Test-Path "node_modules") -and (Test-Path "prisma\dev.db") -and (Test-Path "node_modules\.prisma\client")) {
    Print-Banner
    Write-Host "  ✓ Scriffle is already set up on this machine!" -ForegroundColor Green
    Write-Host "  ─────────────────────────────────────────────────────────`n" -ForegroundColor DarkGray
    Write-Host "  To start Scriffle, type one of these commands in your terminal:`n"

    $hasBun = Get-Command bun -ErrorAction SilentlyContinue
    if ($hasBun) {
        Write-Host "    bun run dev       " -NoNewline -ForegroundColor Cyan
        Write-Host "← Start development server (fast reload)" -ForegroundColor Gray
        Write-Host "    bun run start     " -NoNewline -ForegroundColor Cyan
        Write-Host "← Start production server (after bun run build)" -ForegroundColor Gray
    } else {
        Write-Host "    npm run dev       " -NoNewline -ForegroundColor Cyan
        Write-Host "← Start development server" -ForegroundColor Gray
        Write-Host "    npm run start     " -NoNewline -ForegroundColor Cyan
        Write-Host "← Start production server (after npm run build)" -ForegroundColor Gray
    }

    Write-Host "`n  Then open your browser at:  http://localhost:3000`n" -ForegroundColor Yellow
    Write-Host "  ─────────────────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host "  💡 Tip: If you want to reset everything or start fresh," -ForegroundColor Gray
    Write-Host "     delete the 'prisma\dev.db' file and run this setup script again.`n" -ForegroundColor Gray

    $launchNow = Read-Host "  Would you like to launch Scriffle right now? [Y/n]"
    if ([string]::IsNullOrWhiteSpace($launchNow) -or $launchNow -match "^[Yy]$") {
        Write-Host "`n  🚀 Starting Scriffle...`n" -ForegroundColor Cyan
        if ($hasBun) {
            bun run dev
        } else {
            npm run dev
        }
    } else {
        Write-Host "`n  Have fun building on Scriffle! 👋`n" -ForegroundColor Gray
    }
    Exit 0
}

Print-Banner
Write-Host "  Welcome! Let's get Scriffle set up on your machine." -ForegroundColor White
Write-Host "  This will take less than a minute.`n" -ForegroundColor DarkGray

# ------------------------------------------------------------------------------
# Step 1: Runtime Detection and Choice
# ------------------------------------------------------------------------------
Write-Host "  Step 1: Choose your runtime" -ForegroundColor Cyan
Write-Host "  A runtime is the engine that powers Scriffle on your computer.`n" -ForegroundColor DarkGray

$hasBun = Get-Command bun -ErrorAction SilentlyContinue
$hasNode = Get-Command node -ErrorAction SilentlyContinue

if ($hasBun) {
    $bunVer = (bun --version)
    Write-Host "     [1]  ⚡ Bun (v$bunVer) — Recommended. Ultra-fast native engine. ✓ Installed" -ForegroundColor Green
} else {
    Write-Host "     [1]  ⚡ Bun — Recommended. Ultra-fast native engine. (Will auto-install via PowerShell)" -ForegroundColor Yellow
}

if ($hasNode) {
    $nodeVer = (node --version)
    Write-Host "     [2]  🟢 Node.js ($nodeVer) — Universal JavaScript runtime. ✓ Installed" -ForegroundColor Blue
} else {
    Write-Host "     [2]  🟢 Node.js — Universal JavaScript runtime. (Not found)" -ForegroundColor DarkGray
}

Write-Host ""
$runtimeChoice = Read-Host "  Enter 1 or 2 (default: 1 — press Enter)"
if ([string]::IsNullOrWhiteSpace($runtimeChoice)) { $runtimeChoice = "1" }

$selectedRuntime = "bun"

if ($runtimeChoice -eq "2") {
    if (-not $hasNode) {
        Write-Host "`n  ❌ Node.js is not installed on your system." -ForegroundColor Red
        Write-Host "  Please download it from https://nodejs.org or choose Bun.`n"
        Exit 1
    }
    $selectedRuntime = "node"
} else {
    if (-not $hasBun) {
        Write-Host "`n  ⚡ Installing Bun automatically for Windows...`n" -ForegroundColor Yellow
        try {
            # Run the Bun installer inline in the CURRENT session so PATH changes persist.
            # Do NOT spawn a child powershell.exe — its PATH changes would be lost on exit.
            Invoke-RestMethod bun.sh/install.ps1 | Invoke-Expression
        } catch {
            Write-Host "  ❌ Failed to download the Bun installer. Check your internet connection." -ForegroundColor Red
            Write-Host "     You can install Bun manually from https://bun.sh and then rerun setup." -ForegroundColor DarkGray
            Exit 1
        }
        # Refresh PATH in the current session by re-reading from the registry
        $userPath    = [System.Environment]::GetEnvironmentVariable("Path", "User")
        $machinePath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
        $env:Path    = "$userPath;$machinePath"
        $hasBun = Get-Command bun -ErrorAction SilentlyContinue
        if (-not $hasBun) {
            Write-Host "  ❌ Bun was installed but could not be found in PATH." -ForegroundColor Red
            Write-Host "     Please close this terminal, reopen it, and run setup again." -ForegroundColor DarkGray
            Exit 1
        }
        Write-Host "  ✓ Bun installed successfully!" -ForegroundColor Green
    }
    $selectedRuntime = "bun"
}

Write-Host "`n  ✓ Using $selectedRuntime`n" -ForegroundColor Green

# ------------------------------------------------------------------------------
# Step 2: Choose Starting Canvas Workspace
# ------------------------------------------------------------------------------
Write-Host "  Step 2: Choose your starting canvas" -ForegroundColor Cyan
Write-Host "  How would you like Scriffle to look when it first opens?`n" -ForegroundColor DarkGray

Write-Host "     [1]  🌟 Full Demo Workspace  — Pre-built IDX momentum flow with live" -ForegroundColor Yellow
Write-Host "                                    watchers, condition rules, and sticky notes."
Write-Host "                                    Great for exploring Scriffle immediately." -ForegroundColor DarkGray
Write-Host "     [2]  🚀 Clean Canvas         — Starts completely blank with an interactive" -ForegroundColor Blue
Write-Host "                                    guided tour and sandbox tutorial missions."
Write-Host "                                    Best for building your own research board." -ForegroundColor DarkGray
Write-Host ""

$canvasChoice = Read-Host "  Enter 1 or 2 (default: 1 — press Enter)"
if ([string]::IsNullOrWhiteSpace($canvasChoice)) { $canvasChoice = "1" }

Write-Host ""

# ------------------------------------------------------------------------------
# Step 3: Automated Installation and Database Initialization
# ------------------------------------------------------------------------------
Write-Host "  Step 3: Setting up Scriffle...`n" -ForegroundColor Cyan

# 1. Install dependencies
Write-Host "  📦  Installing dependencies..." -ForegroundColor Cyan
if ($selectedRuntime -eq "bun") {
    bun install *> $null
} else {
    npm install *> $null
}
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ❌ Dependency installation failed (exit code $LASTEXITCODE)." -ForegroundColor Red
    Write-Host "     Check your internet connection, then try running 'bun install' manually." -ForegroundColor DarkGray
    Exit $LASTEXITCODE
}
Write-Host "  ✓  Dependencies installed." -ForegroundColor Green

# 2. Prisma Generate
Write-Host "  ⚙️   Generating database client..." -ForegroundColor Cyan
if ($selectedRuntime -eq "bun") {
    bun x --bun prisma generate *> $null
} else {
    npx prisma generate *> $null
}
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ❌ Prisma client generation failed (exit code $LASTEXITCODE)." -ForegroundColor Red
    Write-Host "     Try running 'bun x --bun prisma generate' manually to see the error." -ForegroundColor DarkGray
    Exit $LASTEXITCODE
}
if (-not (Test-Path "node_modules\.prisma\client")) {
    Write-Host "  ❌ Prisma client generation reported success but client files are missing." -ForegroundColor Red
    Write-Host "     Try deleting node_modules and running setup again." -ForegroundColor DarkGray
    Exit 1
}
Write-Host "  ✓  Database client generated." -ForegroundColor Green

# 3. Prisma DB Push (create SQLite database)
Write-Host "  🗄️   Configuring SQLite database..." -ForegroundColor Cyan
if ($selectedRuntime -eq "bun") {
    bun x --bun prisma db push --skip-generate *> $null
} else {
    npx prisma db push --skip-generate *> $null
}
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ❌ Database setup failed (exit code $LASTEXITCODE)." -ForegroundColor Red
    Write-Host "     Try running 'bun x --bun prisma db push' manually to see the error." -ForegroundColor DarkGray
    Exit $LASTEXITCODE
}
Write-Host "  ✓  SQLite database configured." -ForegroundColor Green

# 4. Seed or Fresh Board
if ($canvasChoice -eq "2") {
    # Clean Canvas: DB schema is already pushed above. No seeding needed.
    # The onboarding tour will guide the user from a blank board on first launch.
    Write-Host "  🚀  Clean canvas ready (no demo data seeded)." -ForegroundColor Green
} else {
    Write-Host "  🌱  Seeding demo workspace..." -ForegroundColor Cyan
    if ($selectedRuntime -eq "bun") {
        bun run prisma/seed.ts *> $null
    } else {
        npx tsx prisma/seed.ts *> $null
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ❌ Demo workspace seeding failed (exit code $LASTEXITCODE)." -ForegroundColor Red
        Write-Host "     Try running 'bun run prisma/seed.ts' manually to see the error." -ForegroundColor DarkGray
        Exit $LASTEXITCODE
    }
    Write-Host "  ✓  Demo workspace seeded." -ForegroundColor Green
}

Write-Host "`n  ─────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  🎉 Scriffle setup complete!" -ForegroundColor Green
Write-Host "  ─────────────────────────────────────────────────────────`n" -ForegroundColor DarkGray

Write-Host "  📌 To start Scriffle again later, simply run:" -ForegroundColor White
if ($selectedRuntime -eq "bun") {
    Write-Host "       bun run dev     " -NoNewline -ForegroundColor Cyan
    Write-Host "← Start development server" -ForegroundColor Gray
    Write-Host "       bun run start   " -NoNewline -ForegroundColor Cyan
    Write-Host "← Start production server (after bun run build)" -ForegroundColor Gray
} else {
    Write-Host "       npm run dev     " -NoNewline -ForegroundColor Cyan
    Write-Host "← Start development server" -ForegroundColor Gray
    Write-Host "       npm run start   " -NoNewline -ForegroundColor Cyan
    Write-Host "← Start production server (after npm run build)" -ForegroundColor Gray
}
Write-Host ""
Write-Host "  🌐 URL: http://localhost:3000`n" -ForegroundColor Yellow

# ------------------------------------------------------------------------------
# Step 4: Prompt Launch
# ------------------------------------------------------------------------------
$launchConfirm = Read-Host "  Would you like to start Scriffle right now? [Y/n]"
if ([string]::IsNullOrWhiteSpace($launchConfirm) -or $launchConfirm -match "^[Yy]$") {
    Write-Host "`n  🚀 Launching Scriffle...`n" -ForegroundColor Cyan
    # Always launch with plain 'bun run dev'.
    # The DB is already in the correct state from Step 3 above.
    # '--start-fresh' is only for resetting an already-running instance, not needed here.
    if ($selectedRuntime -eq "bun") {
        bun run dev
    } else {
        npm run dev
    }
} else {
    Write-Host "`n  All set! Run 'bun run dev' whenever you're ready. 👋`n" -ForegroundColor Gray
}
