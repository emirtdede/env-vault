@echo off
chcp 65001 >nul
title Env Vault v1.0.0 — SHA-256 Dogrulama

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0dogrula.ps1"

echo.
pause
