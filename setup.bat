@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"
title Scriffle Setup ^& Launcher

:: Verify we are running from the Scriffle project root
if not exist "%~dp0package.json" (
    echo.
    echo [Scriffle] ERROR: setup.bat must be run from the Scriffle project root.
    echo             Current directory: %CD%
    echo             Please move setup.bat back to the project root and try again.
    echo.
    pause
    exit /b 1
)

:: Check that PowerShell is available and is version 3+
for /f "tokens=*" %%v in ('powershell -NoProfile -Command "$PSVersionTable.PSVersion.Major" 2^>nul') do set PS_MAJOR=%%v
if "!PS_MAJOR!" == "" (
    echo.
    echo [Scriffle] ERROR: PowerShell is not available or not in PATH.
    echo             Please install PowerShell from https://github.com/PowerShell/PowerShell
    echo.
    pause
    exit /b 1
)
if !PS_MAJOR! LSS 3 (
    echo.
    echo [Scriffle] ERROR: PowerShell !PS_MAJOR! detected. Scriffle requires PowerShell 3 or later.
    echo             Please upgrade at https://github.com/PowerShell/PowerShell
    echo.
    pause
    exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1"
set EXIT_CODE=%ERRORLEVEL%

if %EXIT_CODE% neq 0 (
    echo.
    echo [Scriffle Setup Error] Setup exited with code %EXIT_CODE%.
    echo If you saw an error message above, read it and follow the instructions.
    echo You can re-run setup.bat at any time.
    echo.
    pause
)
