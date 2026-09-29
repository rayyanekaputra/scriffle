@echo off
setlocal
cd /d "%~dp0"
title Scriffle Setup & Launcher
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1"
if %ERRORLEVEL% neq 0 (
    echo.
    echo [Scriffle Setup Error] Something went wrong during setup.
    pause
)
