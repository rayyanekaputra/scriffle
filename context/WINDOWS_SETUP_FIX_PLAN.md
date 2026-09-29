# Windows Setup Fix Plan — `setup.bat` & `setup.ps1`

> **Status:** Ready to implement
> **Scope:** `setup.bat`, `setup.ps1` only — `setup.sh` is working correctly and must not be touched.

---

## Root-Cause Analysis

### Problem 1 — `setup.bat` is a thin wrapper with no error context
`setup.bat` is 11 lines. It simply delegates to `setup.ps1` via `powershell -File`. This is fine architecturally, but it fails silently in common scenarios:
- **Execution Policy block:** Windows default policy (`Restricted`) blocks unsigned `.ps1` files when run from `explorer.exe` or some terminal emulators, producing a cryptic `Access Denied` error with no user guidance.
- **Missing PowerShell version:** Very old Windows machines may have PowerShell 2, which cannot run modern PS syntax.
- **No CWD guarantee:** `cd /d "%~dp0"` is correct, but if the `.bat` is invoked from a UNC path (`\\server\share\...`), `%~dp0` may not include a drive letter and the `cd /d` silently fails, leaving commands running from the wrong directory.

### Problem 2 — `setup.ps1`: Bun auto-install uses wrong syntax
Line 104:
```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```
This spawns a **child** `powershell.exe` process. On Windows 11 / PowerShell 7 (pwsh), the outer process is `pwsh.exe` but the child is `powershell.exe` (Windows PowerShell 5.1). The child session's PATH changes are discarded when it exits — so even if Bun installs successfully, line 106's `Get-Command bun` fails because the PATH was only updated in the dead child process.

**Correct approach:** Use `Invoke-RestMethod` directly in the current session and source the install script inline:
```powershell
Invoke-RestMethod bun.sh/install.ps1 | Invoke-Expression
```

### Problem 3 — `setup.ps1`: PATH refresh is unreliable
Line 105:
```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","User") + ";" + [System.Environment]::GetEnvironmentVariable("Path","Machine")
```
This concatenates User + Machine PATH. Bun's installer adds its path to the **User** scope, so the refresh should work — but it runs *after* the broken child `powershell -c ...` call. Because the child never correctly sets the User environment variable (it installs in its own session), the PATH refresh reads stale values and `bun` is still not found.

### Problem 4 — `setup.ps1`: `bun install | Out-Null` suppresses all output including errors
Lines 145, 147:
```powershell
bun install | Out-Null
```
`| Out-Null` discards **stdout only**. If `bun install` writes critical errors to **stderr**, they still appear and intermix with the carriage-return progress line above — making the terminal output garbled. The correct suppression is `*>&1 | Out-Null` or redirect both streams.

More importantly, if `bun install` **fails** (e.g. network error), `$ErrorActionPreference = "Stop"` does **not** catch it because external process failures don't throw PS terminating errors — they only set `$LASTEXITCODE`. The script silently continues to the next step.

### Problem 5 — `setup.ps1`: `\r` carriage-return overwrite trick doesn't work in PowerShell
Lines 149, 158, 167, 175, 183:
```powershell
Write-Host "`r  ✓  Dependencies installed.          " -ForegroundColor Green
```
The leading `` `r `` (carriage return) is meant to overwrite the previous `📦 Installing...` line. **This only works in terminal emulators that handle CR correctly.** Windows Terminal and CMD both handle it, but:
- VS Code Integrated Terminal often does not honour bare `\r` without a newline.
- PowerShell ISE ignores it entirely.
- When `-NoNewline` is set on the *previous* Write-Host, the CR correctly moves to column 0 — but on Windows, `Write-Host` uses `Console.Write` under the hood, which does not guarantee the cursor is on the same line when stdout is redirected to a file or pipe.

This is not fatal but causes cosmetic corruption in many common Windows terminal configurations.

### Problem 6 — `setup.ps1` & `setup.bat`: No check for PowerShell minimum version
The script uses `[string]::IsNullOrWhiteSpace()` and `-match` with regex — both require PowerShell 3+. Windows 7 ships PowerShell 2. No version guard exists.

### Problem 7 — `setup.ps1`: Clean Canvas path calls a non-existent `--dry-run` flag
Line 173:
```powershell
bun run ./scripts/dev.ts --start-fresh --dry-run 2>$null | Out-Null
```
`scripts/dev.ts` does **not** handle `--dry-run`. The `--start-fresh` path in `dev.ts` calls `createFreshProject()` and then spawns `next dev`. This means "Clean Canvas" option in `setup.ps1` actually starts the Next.js server inside setup — which the script didn't intend, and then hangs until the user kills it.

The correct behaviour (matching `setup.sh` line 196) is to seed an empty/clean canvas into the DB *without launching the server*. The seed script at `prisma/seed.ts` handles this properly. The `--dry-run` flag is a ghost from an old design. The Clean Canvas path should call `bunx prisma db push` (already done above it) and then just skip seeding — it doesn't need to call `dev.ts` at all.

### Problem 8 — `setup.ps1`: Launch with `--start-fresh` flag is passed to `bun run dev` incorrectly
Line 213:
```powershell
bun run dev --start-fresh
```
`bun run dev` invokes `package.json`'s `dev` script which is `bun ./scripts/dev.ts`. Arguments after `bun run dev` are appended correctly by Bun — **this part is actually fine**. However, the surrounding `if` at line 211 checks `$canvasChoice -eq "2"` (Clean Canvas), and if the user chose Clean Canvas during setup (option 2), launching with `--start-fresh` will again call `createFreshProject()` and create *another* fresh canvas on top of the one that may have already been created during Step 3. This results in a duplicate empty canvas.

---

## Fix Plan — Step by Step

### Fix 1: `setup.bat` — Add PowerShell version guard & clearer error messaging

**File:** `setup.bat`

Replace the body with:
```bat
@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"
title Scriffle Setup ^& Launcher

:: Verify we have a valid working directory
if not exist "%~dp0package.json" (
    echo.
    echo [Scriffle] ERROR: setup.bat must be run from the Scriffle project root.
    echo Current directory: %CD%
    pause
    exit /b 1
)

:: Check minimum PowerShell version (need 3+)
for /f "tokens=*" %%v in ('powershell -NoProfile -Command "$PSVersionTable.PSVersion.Major" 2^>nul') do set PS_MAJOR=%%v
if "!PS_MAJOR!" == "" (
    echo.
    echo [Scriffle] ERROR: PowerShell is not available or not in PATH.
    echo Please install PowerShell from https://github.com/PowerShell/PowerShell
    pause
    exit /b 1
)
if !PS_MAJOR! LSS 3 (
    echo.
    echo [Scriffle] ERROR: PowerShell %PS_MAJOR% detected. Scriffle requires PowerShell 3 or later.
    echo Please upgrade at https://github.com/PowerShell/PowerShell
    pause
    exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1"
set EXIT_CODE=%ERRORLEVEL%

if %EXIT_CODE% neq 0 (
    echo.
    echo [Scriffle Setup Error] Setup exited with code %EXIT_CODE%.
    echo If you saw an error above, read it carefully and re-run setup.
    pause
)
```

---

### Fix 2: `setup.ps1` — Fix Bun auto-install (inline, same session)

**File:** `setup.ps1`, lines 102–113 (Bun auto-install block)

Replace:
```powershell
if (-not $hasBun) {
    Write-Host "`n  ⚡ Installing Bun automatically for Windows...`n" -ForegroundColor Yellow
    powershell -c "irm bun.sh/install.ps1 | iex"
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","User") + ";" + [System.Environment]::GetEnvironmentVariable("Path","Machine")
    $hasBun = Get-Command bun -ErrorAction SilentlyContinue
    if (-not $hasBun) {
        Write-Host "  ❌ Please restart your terminal after Bun installation and rerun setup." -ForegroundColor Red
        Exit 1
    }
    Write-Host "  ✓ Bun installed successfully!" -ForegroundColor Green
}
```

With:
```powershell
if (-not $hasBun) {
    Write-Host "`n  ⚡ Installing Bun automatically for Windows...`n" -ForegroundColor Yellow
    try {
        # Run installer inline in the current session so PATH changes persist
        Invoke-RestMethod bun.sh/install.ps1 | Invoke-Expression
    } catch {
        Write-Host "  ❌ Failed to download Bun installer. Check your internet connection." -ForegroundColor Red
        Write-Host "     You can install Bun manually from https://bun.sh and rerun setup." -ForegroundColor DarkGray
        Exit 1
    }
    # Refresh PATH in the current session from registry
    $userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
    $machinePath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
    $env:Path = "$userPath;$machinePath"
    $hasBun = Get-Command bun -ErrorAction SilentlyContinue
    if (-not $hasBun) {
        Write-Host "  ❌ Bun installed but could not be found in PATH." -ForegroundColor Red
        Write-Host "     Please close this terminal, reopen it, and run setup again." -ForegroundColor DarkGray
        Exit 1
    }
    Write-Host "  ✓ Bun installed successfully!" -ForegroundColor Green
}
```

---

### Fix 3: `setup.ps1` — Fix external command error handling

**File:** `setup.ps1`, all external process calls (`bun install`, `bunx prisma generate`, `bunx prisma db push`, `bun run prisma/seed.ts`)

After each external call, check `$LASTEXITCODE` and terminate with a descriptive error if non-zero. Pattern:

```powershell
# BEFORE (broken — silently ignores failures):
bun install | Out-Null

# AFTER (correct):
bun install *>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n  ❌ 'bun install' failed (exit code $LASTEXITCODE)." -ForegroundColor Red
    Write-Host "     Check your internet connection or run 'bun install' manually." -ForegroundColor DarkGray
    Exit $LASTEXITCODE
}
```

Apply this pattern to all four Step 3 commands:
1. `bun install` / `npm install`
2. `bunx prisma generate` / `npx prisma generate`
3. `bunx prisma db push --skip-generate` / `npx prisma db push --skip-generate`
4. `bun run prisma/seed.ts` / `npx tsx prisma/seed.ts`

---

### Fix 4: `setup.ps1` — Fix carriage-return progress lines

**File:** `setup.ps1`, all `Write-Host` progress pairs

The `\r` overwrite trick is unreliable on Windows terminals. Replace the two-line pattern:
```powershell
# BEFORE:
Write-Host "  📦  Installing dependencies..." -NoNewline -ForegroundColor Cyan
bun install | Out-Null
Write-Host "`r  ✓  Dependencies installed.          " -ForegroundColor Green
```

With a simple sequential pattern that works everywhere:
```powershell
# AFTER:
Write-Host "  📦  Installing dependencies..." -ForegroundColor Cyan
bun install *>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Host "  ❌ bun install failed." -ForegroundColor Red; Exit $LASTEXITCODE }
Write-Host "  ✓  Dependencies installed." -ForegroundColor Green
```

This applies to all 4 progress blocks in Step 3.

---

### Fix 5: `setup.ps1` — Remove broken `--dry-run` path for Clean Canvas

**File:** `setup.ps1`, lines 170–175

Replace:
```powershell
if ($canvasChoice -eq "2") {
    Write-Host "  🚀  Initializing fresh clean canvas..." -NoNewline -ForegroundColor Cyan
    if ($selectedRuntime -eq "bun") {
        bun run ./scripts/dev.ts --start-fresh --dry-run 2>$null | Out-Null
    }
    Write-Host "`r  ✓  Clean canvas initialized.        " -ForegroundColor Green
}
```

With:
```powershell
if ($canvasChoice -eq "2") {
    # Clean Canvas: DB schema is already pushed above. No seeding needed.
    # The onboarding tour will guide the user from a blank board.
    Write-Host "  🚀  Clean canvas ready (no demo data seeded)." -ForegroundColor Green
}
```

---

### Fix 6: `setup.ps1` — Fix duplicate fresh canvas on launch

**File:** `setup.ps1`, lines 210–223 (Step 4 launch block)

The `--start-fresh` flag in `bun run dev --start-fresh` creates a new DB project. When the user chose Clean Canvas (option 2) during setup, the DB is already in a clean state (just `db push`, no seed). Launching again with `--start-fresh` creates a *second* empty project. Remove the `--start-fresh` flag from the launch command entirely — it is only needed when *resetting* an already-seeded canvas, not on first setup:

Replace:
```powershell
if ($canvasChoice -eq "2") {
    if ($selectedRuntime -eq "bun") {
        bun run dev --start-fresh
    } else {
        npm run dev
    }
} else {
    if ($selectedRuntime -eq "bun") {
        bun run dev
    } else {
        npm run dev
    }
}
```

With:
```powershell
# Always just launch dev — the DB is already in the correct state from Step 3
if ($selectedRuntime -eq "bun") {
    bun run dev
} else {
    npm run dev
}
```

---

### Fix 7: `setup.ps1` — Add PowerShell version guard at top

**File:** `setup.ps1`, insert at top after the comment header (before `$ErrorActionPreference`)

```powershell
# Require PowerShell 3+
if ($PSVersionTable.PSVersion.Major -lt 3) {
    Write-Error "Scriffle requires PowerShell 3 or later. Current version: $($PSVersionTable.PSVersion). Please upgrade at https://github.com/PowerShell/PowerShell"
    Exit 1
}
```

---

## Summary of All Changes

| # | File | Line(s) | Issue | Fix |
|---|---|---|---|---|
| 1 | `setup.bat` | All | No version guard, silent CWD failure | Add PS version check, validate `package.json` exists, add exit code messaging |
| 2 | `setup.ps1` | 104 | Child `powershell -c` spawns isolated session; PATH changes are lost | Replace with `Invoke-RestMethod ... \| Invoke-Expression` in current session |
| 3 | `setup.ps1` | 105 | PATH refresh runs after dead child; reads stale registry | Move PATH refresh to after inline install; already correct once Fix 2 applied |
| 4 | `setup.ps1` | 145,154,163,179 | `\| Out-Null` hides stderr; no `$LASTEXITCODE` guard | Add `*>&1 \| Out-Null` and `$LASTEXITCODE -ne 0` guard after each external call |
| 5 | `setup.ps1` | 149,158,167,175,183 | `` `r `` carriage-return overwrite unreliable on Windows terminals | Replace two-line progress pattern with plain sequential `Write-Host` calls |
| 6 | `setup.ps1` | 171–174 | `--dry-run` flag does not exist in `dev.ts`; accidentally starts Next.js server | Remove call entirely; Clean Canvas needs no seed, no server spawn during setup |
| 7 | `setup.ps1` | 212–213 | `bun run dev --start-fresh` on Clean Canvas path creates duplicate empty project | Remove `--start-fresh` from launch; always use plain `bun run dev` |
| 8 | `setup.ps1` | Top | No PowerShell version guard | Add `$PSVersionTable.PSVersion.Major -lt 3` check |

---

## Files to Edit

- [`setup.bat`](file:///c:/Users/rayyanep/Coding/scriffle/setup.bat) — Full rewrite of body (keep it as a thin PS1 launcher, but add version check + CWD guard)
- [`setup.ps1`](file:///c:/Users/rayyanep/Coding/scriffle/setup.ps1) — Fix 7 targeted edits as described above

## Files NOT to Touch

- [`setup.sh`](file:///c:/Users/rayyanep/Coding/scriffle/setup.sh) — Working correctly on Linux/macOS. Do not modify.
- [`scripts/dev.ts`](file:///c:/Users/rayyanep/Coding/scriffle/scripts/dev.ts) — No changes needed; the `--start-fresh` flag works correctly when called at runtime (not during setup).
- `package.json`, `prisma/seed.ts` — No changes needed.
