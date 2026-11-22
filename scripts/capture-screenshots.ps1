#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Silent screenshot capture for Env Vault.

.DESCRIPTION
  Implements the "quiet mode" capture contract:

  * the window is never maximised and never brought to the foreground,
  * SetForegroundWindow is never called, so the desktop stays usable,
  * every frame is rendered with PrintWindow(hwnd, dc, 2) from the DWM
    surface, which works even while the window is parked off-screen,
  * each capture happens in the same run, and the application is closed as
    soon as the walk-through finishes - it never stays open on the desktop.

  The walk-through is state-agnostic: it captures the first painted screen,
  then clicks the primary button of each onboarding step until no primary
  button is left, and finally captures the screen the app lands on.

.PARAMETER Executable
  Path to the built Env Vault executable.

.PARAMETER Output
  Screenshot directory. Defaults to docs/screenshots.

.EXAMPLE
  pwsh -File scripts/capture-screenshots.ps1
#>
[CmdletBinding()]
param(
  [string]$Executable = "src-tauri/target/release/env-vault.exe",
  [string]$Output = "docs/screenshots",
  [int]$TimeoutSeconds = 45
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

if (-not (Test-Path $Executable)) {
  throw "Executable not found: $Executable. Run 'npm run build:app' first."
}

$exePath = (Resolve-Path $Executable).Path
$outDir = Join-Path $repoRoot $Output
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

Add-Type -AssemblyName System.Drawing, UIAutomationClient, UIAutomationTypes
Add-Type @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class EnvVaultNative {
  public delegate bool EnumProc(IntPtr h, IntPtr l);
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L, T, R, B; }
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc cb, IntPtr l);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr h, IntPtr dc, uint f);
  [DllImport("user32.dll")] public static extern bool SetProcessDpiAwarenessContext(IntPtr v);
  [DllImport("user32.dll")] public static extern int GetSystemMetrics(int i);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)]
  public static extern int GetWindowTextW(IntPtr h, StringBuilder sb, int n);
  [DllImport("user32.dll")]
  public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hAfter, int x, int y, int cx, int cy, uint flags);
}
"@

[void][EnvVaultNative]::SetProcessDpiAwarenessContext([IntPtr](-4))

$screenW = [EnvVaultNative]::GetSystemMetrics(0)
$screenH = [EnvVaultNative]::GetSystemMetrics(1)

# SWP_NOSIZE | SWP_NOZORDER | SWP_NOACTIVATE: move only, never raise or focus.
$parkFlags = 0x0001 -bor 0x0004 -bor 0x0010
$parkX = $screenW + 60
$parkY = 40

function Get-AppWindows([int]$targetPid) {
  $script:found = @()
  $cb = [EnvVaultNative+EnumProc]{
    param($h, $l)
    $owner = 0
    [void][EnvVaultNative]::GetWindowThreadProcessId($h, [ref]$owner)
    if ($owner -eq $targetPid -and [EnvVaultNative]::IsWindowVisible($h)) {
      $rect = New-Object EnvVaultNative+RECT
      [void][EnvVaultNative]::GetWindowRect($h, [ref]$rect)
      $w = $rect.R - $rect.L
      $hgt = $rect.B - $rect.T
      if ($w -ge 400 -and $hgt -ge 300) {
        $script:found += [pscustomobject]@{ Handle = $h; Width = $w; Height = $hgt; Area = $w * $hgt }
      }
    }
    return $true
  }
  [void][EnvVaultNative]::EnumWindows($cb, [IntPtr]::Zero)
  return $script:found
}

function Park-AppWindows([int]$targetPid) {
  foreach ($window in Get-AppWindows $targetPid) {
    [void][EnvVaultNative]::SetWindowPos($window.Handle, [IntPtr]::Zero, $parkX, $parkY, 0, 0, $parkFlags)
  }
}

function Get-MainHandle([int]$targetPid) {
  $windows = Get-AppWindows $targetPid
  if ($windows.Count -eq 0) { return [IntPtr]::Zero }
  return ($windows | Sort-Object Area -Descending | Select-Object -First 1).Handle
}

function Save-Frame([int]$targetPid, [string]$name) {
  Park-AppWindows $targetPid
  $hwnd = Get-MainHandle $targetPid
  if ($hwnd -eq [IntPtr]::Zero) { throw "No window available for $name" }

  $rect = New-Object EnvVaultNative+RECT
  [void][EnvVaultNative]::GetWindowRect($hwnd, [ref]$rect)
  $width = $rect.R - $rect.L
  $height = $rect.B - $rect.T

  $bitmap = New-Object System.Drawing.Bitmap $width, $height
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $dc = $graphics.GetHdc()
  $ok = [EnvVaultNative]::PrintWindow($hwnd, $dc, 2)
  $graphics.ReleaseHdc($dc)
  $graphics.Dispose()

  $file = Join-Path $outDir $name
  $bitmap.Save($file, [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Dispose()

  $bytes = (Get-Item $file).Length
  if ($bytes -lt 8000) { throw "$name looks empty ($bytes bytes)" }
  Write-Host ("captured {0} ({1}x{2}, ok={3}, {4} bytes)" -f $name, $width, $height, $ok, $bytes)
}

function Get-AutomationWindow([int]$targetPid) {
  $root = [System.Windows.Automation.AutomationElement]::RootElement
  $condition = New-Object System.Windows.Automation.PropertyCondition(
    [System.Windows.Automation.AutomationElement]::ProcessIdProperty, $targetPid)
  return $root.FindFirst([System.Windows.Automation.TreeScope]::Children, $condition)
}

function Find-ButtonByName($window, [string]$name) {
  if (-not $window) { return $null }
  $condition = New-Object System.Windows.Automation.AndCondition(
    (New-Object System.Windows.Automation.PropertyCondition(
      [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
      [System.Windows.Automation.ControlType]::Button)),
    (New-Object System.Windows.Automation.PropertyCondition(
      [System.Windows.Automation.AutomationElement]::NameProperty, $name)))
  return $window.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $condition)
}

# The primary advance label in both fully authored locales.
$primaryLabels = @(
  'Continue', 'Finish setup', 'Devam', 'Kurulumu tamamla'
)

function Invoke-PrimaryButton([int]$targetPid) {
  $window = Get-AutomationWindow $targetPid
  foreach ($label in $primaryLabels) {
    $button = Find-ButtonByName $window $label
    if ($button) {
      $button.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern).Invoke()
      Write-Host "clicked '$label'"
      return $true
    }
  }
  return $false
}

Get-Process -Name 'env-vault' -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Milliseconds 600
Write-Host "starting $exePath"
$process = Start-Process -FilePath $exePath -PassThru
$deadline = (Get-Date).AddSeconds($TimeoutSeconds)

try {
  # Park the window the instant it exists; the first frame never covers the desktop.
  $handle = [IntPtr]::Zero
  while ((Get-Date) -lt $deadline) {
    Park-AppWindows $process.Id
    $handle = Get-MainHandle $process.Id
    if ($handle -ne [IntPtr]::Zero) { break }
    Start-Sleep -Milliseconds 250
  }
  if ($handle -eq [IntPtr]::Zero) { throw 'The main window never appeared.' }

  Park-AppWindows $process.Id
  Start-Sleep -Milliseconds 2200
  Save-Frame $process.Id 'onboarding-language.png'

  $order = @('onboarding-theme.png', 'onboarding-welcome.png', 'onboarding-tour.png')
  $index = 0
  while ($index -lt $order.Count) {
    $invoked = Invoke-PrimaryButton $process.Id
    if (-not $invoked) { break }
    Start-Sleep -Milliseconds 1400
    Save-Frame $process.Id $order[$index]
    $index += 1
  }

  Start-Sleep -Milliseconds 1200
  Save-Frame $process.Id 'vault-setup.png'
}
finally {
  # Quiet-mode contract: the window must not survive the run.
  Get-Process -Id $process.Id -ErrorAction SilentlyContinue | Stop-Process -Force
  Write-Host 'application closed'
}

Write-Host "screenshots written to $outDir"
