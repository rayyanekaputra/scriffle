# ==============================================================================
#  Scriffle - Interactive Setup and Onboarding Script (Windows PowerShell)
# ==============================================================================

# Ensure TLS 1.2 is enabled for downloads in PowerShell 5.1
try {
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor [System.Net.SecurityProtocolType]::Tls12
} catch {}

# Use Continue so stderr from external tools does not crash PS5.1
$ErrorActionPreference = "Continue"

function Print-Banner {
    Clear-Host
    Write-Host ""
    Write-Host "  =============================================================" -ForegroundColor Cyan
    Write-Host "    SCRIFFLE  -  Visual Market Automation and Research Board" -ForegroundColor Cyan
    Write-Host "  =============================================================" -ForegroundColor Cyan
    Write-Host ""
}

# ------------------------------------------------------------------------------
# Re-Run Detection: Check if Scriffle is already set up
# ------------------------------------------------------------------------------
$hasNodeModules = Test-Path "node_modules"
$hasDb = Test-Path "prisma\dev.db"
$hasPrismaClient = (Test-Path "node_modules\.prisma\client") -or (Test-Path "node_modules/@prisma/client")

if ($hasNodeModules -and $hasDb -and $hasPrismaClient) {
    Print-Banner
    Write-Host "  [OK] Scriffle is already set up on this machine!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  To start Scriffle, run one of these commands:" -ForegroundColor White
    Write-Host ""

    $hasBun = $null -ne (Get-Command bun -ErrorAction SilentlyContinue)
    if ($hasBun) {
        Write-Host "    bun run dev       <- development server (fast reload)" -ForegroundColor Cyan
        Write-Host "    bun run start     <- production server (after: bun run build)" -ForegroundColor Cyan
    } else {
        Write-Host "    npm run dev       <- development server" -ForegroundColor Cyan
        Write-Host "    npm run start     <- production server (after: npm run build)" -ForegroundColor Cyan
    }

    Write-Host ""
    Write-Host "  Then open: http://localhost:3000" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Tip: to reset, delete 'prisma\dev.db' and run this script again." -ForegroundColor DarkGray
    Write-Host ""

    $launchNow = Read-Host "  Launch Scriffle right now? [Y/n]"
    if ([string]::IsNullOrWhiteSpace($launchNow) -or $launchNow -match "^[Yy]$") {
        Write-Host ""
        Write-Host "  Starting Scriffle..." -ForegroundColor Cyan
        Write-Host ""
        if ($hasBun) {
            & bun run dev
        } else {
            & npm run dev
        }
    } else {
        Write-Host ""
        Write-Host "  All set! Run 'bun run dev' whenever you are ready." -ForegroundColor DarkGray
        Write-Host ""
    }
    Exit 0
}

Print-Banner
Write-Host "  Welcome! Let's get Scriffle set up on your machine." -ForegroundColor White
Write-Host "  This will take less than a minute." -ForegroundColor DarkGray
Write-Host ""

# ------------------------------------------------------------------------------
# Step 1 - Runtime Detection and Choice
# ------------------------------------------------------------------------------
Write-Host "  Step 1 - Choose your runtime" -ForegroundColor Cyan
Write-Host "  A runtime is the engine that runs Scriffle on your computer." -ForegroundColor DarkGray
Write-Host ""

$hasBun  = $null -ne (Get-Command bun  -ErrorAction SilentlyContinue)
$hasNode = $null -ne (Get-Command node -ErrorAction SilentlyContinue)

if ($hasBun) {
    $bunVer = & bun --version
    Write-Host "    [1]  Bun  (v$bunVer)  - RECOMMENDED - Ultra-fast. Already installed." -ForegroundColor Green
} else {
    Write-Host "    [1]  Bun  - RECOMMENDED - Ultra-fast. (Will auto-install)" -ForegroundColor Yellow
}

if ($hasNode) {
    $nodeVer = & node --version
    Write-Host "    [2]  Node.js  ($nodeVer)  - Standard runtime. Already installed." -ForegroundColor White
} else {
    Write-Host "    [2]  Node.js  - Standard runtime. (Not found)" -ForegroundColor DarkGray
}

Write-Host ""
$runtimeChoice = Read-Host "  Enter 1 or 2 (press Enter for default: 1)"
if ([string]::IsNullOrWhiteSpace($runtimeChoice)) { $runtimeChoice = "1" }

$selectedRuntime = "bun"

if ($runtimeChoice -eq "2") {
    if (-not $hasNode) {
        Write-Host ""
        Write-Host "  [ERROR] Node.js is not installed." -ForegroundColor Red
        Write-Host "  Download it from https://nodejs.org or choose Bun instead." -ForegroundColor DarkGray
        Write-Host ""
        Exit 1
    }
    $selectedRuntime = "node"
} else {
    if (-not $hasBun) {
        Write-Host ""
        Write-Host "  Installing Bun for Windows..." -ForegroundColor Yellow
        try {
            Invoke-RestMethod -Uri "https://bun.sh/install.ps1" -UseBasicParsing | Invoke-Expression
        } catch {
            Write-Host ""
            Write-Host "  [ERROR] Failed to download the Bun installer: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "  Check your internet connection, or install manually from https://bun.sh" -ForegroundColor DarkGray
            Write-Host ""
            Exit 1
        }
        # Refresh PATH in current session from registry
        $userPath    = [System.Environment]::GetEnvironmentVariable("Path", "User")
        $machinePath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
        $env:Path    = "$userPath;$machinePath"
        $hasBun = $null -ne (Get-Command bun -ErrorAction SilentlyContinue)
        if (-not $hasBun) {
            Write-Host ""
            Write-Host "  [ERROR] Bun was installed but is not in PATH." -ForegroundColor Red
            Write-Host "  Please close this window, open a new terminal, and run setup again." -ForegroundColor DarkGray
            Write-Host ""
            Exit 1
        }
        Write-Host "  [OK] Bun installed successfully!" -ForegroundColor Green
    }
    $selectedRuntime = "bun"
}

Write-Host ""
Write-Host "  [OK] Using: $selectedRuntime" -ForegroundColor Green
Write-Host ""

# ------------------------------------------------------------------------------
# Step 2 - Choose Starting Canvas
# ------------------------------------------------------------------------------
Write-Host "  Step 2 - Choose your starting canvas" -ForegroundColor Cyan
Write-Host "  How would you like Scriffle to look when it first opens?" -ForegroundColor DarkGray
Write-Host ""
Write-Host "    [1]  Full Demo Workspace  - Pre-built IDX momentum flow with live watchers," -ForegroundColor Yellow
Write-Host "                               condition rules, and sticky notes." -ForegroundColor DarkGray
Write-Host "                               Great for exploring Scriffle right away." -ForegroundColor DarkGray
Write-Host ""
Write-Host "    [2]  Clean Canvas         - Starts completely blank with an interactive" -ForegroundColor White
Write-Host "                               guided tour and sandbox tutorial missions." -ForegroundColor DarkGray
Write-Host "                               Best for building your own research board." -ForegroundColor DarkGray
Write-Host ""

$canvasChoice = Read-Host "  Enter 1 or 2 (press Enter for default: 1)"
if ([string]::IsNullOrWhiteSpace($canvasChoice)) { $canvasChoice = "1" }

Write-Host ""

# ------------------------------------------------------------------------------
# Step 3 - Installation and Database Setup
# ------------------------------------------------------------------------------
Write-Host "  Step 3 - Installing Scriffle..." -ForegroundColor Cyan
Write-Host ""

# --- 3a. Install dependencies ---
Write-Host "  [1/3] Installing dependencies..." -ForegroundColor White
if ($selectedRuntime -eq "bun") {
    & bun install
} else {
    & npm install
}
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "  [ERROR] Dependency installation failed (exit code: $LASTEXITCODE)" -ForegroundColor Red
    Write-Host "  Try running 'bun install' manually to inspect the error." -ForegroundColor DarkGray
    Write-Host ""
    Exit $LASTEXITCODE
}
Write-Host "  [OK]  Dependencies installed." -ForegroundColor Green

# --- 3b. Generate Prisma client ---
Write-Host "  [2/3] Generating database client..." -ForegroundColor White
if ($selectedRuntime -eq "bun") {
    & bun x --bun prisma generate
} else {
    & npx prisma generate
}
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "  [ERROR] Prisma client generation failed (exit code: $LASTEXITCODE)" -ForegroundColor Red
    Write-Host "  Try running 'bun x --bun prisma generate' manually to inspect the error." -ForegroundColor DarkGray
    Write-Host ""
    Exit $LASTEXITCODE
}
if (-not ((Test-Path "node_modules\.prisma\client") -or (Test-Path "node_modules/@prisma/client"))) {
    Write-Host ""
    Write-Host "  [ERROR] Prisma generate reported success but client files were not found." -ForegroundColor Red
    Write-Host "  Try deleting node_modules and running setup again." -ForegroundColor DarkGray
    Write-Host ""
    Exit 1
}
Write-Host "  [OK]  Database client generated." -ForegroundColor Green

# --- 3c. Push schema to SQLite ---
Write-Host "  [3/3] Configuring SQLite database..." -ForegroundColor White
if ($selectedRuntime -eq "bun") {
    & bun x --bun prisma db push --skip-generate
} else {
    & npx prisma db push --skip-generate
}
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "  [ERROR] Database setup failed (exit code: $LASTEXITCODE)" -ForegroundColor Red
    Write-Host "  Try running 'bun x --bun prisma db push' manually to inspect the error." -ForegroundColor DarkGray
    Write-Host ""
    Exit $LASTEXITCODE
}
Write-Host "  [OK]  SQLite database configured." -ForegroundColor Green

# --- 3d. Seed or skip ---
if ($canvasChoice -eq "2") {
    Write-Host "  [OK]  Clean canvas ready (no demo data)." -ForegroundColor Green
} else {
    Write-Host "  [+]   Seeding demo workspace..." -ForegroundColor White
    if ($selectedRuntime -eq "bun") {
        & bun run prisma/seed.ts
    } else {
        & npx tsx prisma/seed.ts
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "  [ERROR] Seeding failed (exit code: $LASTEXITCODE)" -ForegroundColor Red
        Write-Host "  Try running 'bun run prisma/seed.ts' manually to inspect the error." -ForegroundColor DarkGray
        Write-Host ""
        Exit $LASTEXITCODE
    }
    Write-Host "  [OK]  Demo workspace seeded." -ForegroundColor Green
}

# ------------------------------------------------------------------------------
# Done!
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "  =============================================================" -ForegroundColor Green
Write-Host "  Scriffle setup complete!" -ForegroundColor Green
Write-Host "  =============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  To start Scriffle later, run:" -ForegroundColor White
Write-Host ""
if ($selectedRuntime -eq "bun") {
    Write-Host "    bun run dev       <- development server" -ForegroundColor Cyan
    Write-Host "    bun run start     <- production server (after: bun run build)" -ForegroundColor Cyan
} else {
    Write-Host "    npm run dev       <- development server" -ForegroundColor Cyan
    Write-Host "    npm run start     <- production server (after: npm run build)" -ForegroundColor Cyan
}
Write-Host ""
Write-Host "  URL: http://localhost:3000" -ForegroundColor Yellow
Write-Host ""

# ------------------------------------------------------------------------------
# Step 4 - Offer to launch now
# ------------------------------------------------------------------------------
$launchConfirm = Read-Host "  Start Scriffle right now? [Y/n]"
if ([string]::IsNullOrWhiteSpace($launchConfirm) -or $launchConfirm -match "^[Yy]$") {
    Write-Host ""
    Write-Host "  Launching Scriffle..." -ForegroundColor Cyan
    Write-Host ""
    if ($selectedRuntime -eq "bun") {
        & bun run dev
    } else {
        & npm run dev
    }
} else {
    Write-Host ""
    Write-Host "  All set! Run 'bun run dev' whenever you are ready." -ForegroundColor DarkGray
    Write-Host ""
}
