@echo off
chcp 65001 >nul
title Env Vault v1.0.0 — Production Build Script
color 0A

echo ===============================================================================
echo                 Env Vault v1.0.0 — Otomatik Build Scripti
echo                               Vellium (c) 2026
echo ===============================================================================
echo.

cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\build-release.ps1"

echo.
pause
